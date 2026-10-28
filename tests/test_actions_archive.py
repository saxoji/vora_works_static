"""Focused synthetic coverage for the new bounded Actions member stream only."""
import hashlib
import io
import json
from pathlib import Path
import re
import sys
import unittest
from unittest.mock import patch
from urllib.error import HTTPError
from urllib.request import build_opener, HTTPRedirectHandler
import warnings
import zipfile

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
import actions_archive as a

TOKEN = 'fixture-only-token'
URL = a.API + '123/zip'
BLOB = 'https://productionresultssa0.blob.core.windows.net/artifact/file.zip'
NAME = 'VORA-SLIDE-1.0.2-win-x64.zip'


class Response(io.BytesIO):
    def __init__(self, url, data, status=200, headers=None):
        super().__init__(data)
        self.url, self.status, self.headers = url, status, headers or {}

    def geturl(self):
        return self.url


def archive_bytes(payload, duplicate=False):
    data = io.BytesIO()
    with warnings.catch_warnings(), zipfile.ZipFile(data, 'w', compression=zipfile.ZIP_STORED) as z:
        warnings.simplefilter('ignore', UserWarning)
        z.writestr(NAME, payload)
        if duplicate:
            z.writestr(NAME, payload)
    return data.getvalue()


class Opener:
    def __init__(self, data):
        self.data, self.requests, self.metadata_calls, self.leases = data, [], 0, 0
        self.mode = None
        self.injected = False
        self.failed_range = None

    def open(self, request, timeout):
        url, headers = request.full_url, {k.lower(): v for k, v in request.header_items()}
        self.requests.append((url, headers))
        if url == URL.removesuffix('/zip'):
            self.metadata_calls += 1
            digest = hashlib.sha256(self.data).hexdigest()
            if self.mode == 'metadata-digest' or self.mode == 'renewed-digest' and self.metadata_calls > 1:
                digest = 'a' * 64
            return Response(url, json.dumps({'id': 123, 'size_in_bytes': len(self.data),
                'digest': 'sha256:' + digest, 'expired': False}).encode())
        if url == URL:
            self.leases += 1
            raise HTTPError(url, 302, 'Found', {'Location': BLOB + '?lease=' + str(self.leases)}, io.BytesIO())
        if not url.startswith(BLOB + '?lease='):
            raise AssertionError('Unexpected mock URL')
        if 'authorization' in headers:
            raise AssertionError('Bearer token leaked to the blob host')
        start, end = map(int, re.fullmatch(r'bytes=(\d+)-(\d+)', headers['range']).groups())
        if end - start + 1 > a.CHUNK:
            raise AssertionError('Range allocation exceeds 8 MiB')
        payload = self.data[start:end + 1]
        result_headers = {'Content-Range': f'bytes {start}-{end}/{len(self.data)}', 'ETag': '"same"'}
        if self.mode in ('short-once', 'renew-once', 'renewed-digest') and end - start > 1024 and not self.injected:
            self.injected, self.failed_range = True, (start, end)
            if self.mode == 'short-once':
                payload = payload[:-5]
            else:
                return Response(url, b'', 403)
        if self.mode == 'etag-change' and not (start == 0 and end == 0):
            result_headers['ETag'] = '"changed"'
        if self.mode == 'wrong-range':
            result_headers['Content-Range'] = 'bytes 0-0/1'
        if self.mode == 'encoded':
            result_headers['Content-Encoding'] = 'gzip'
        if self.mode == 'blob-redirect':
            return Response(url, b'', 302, {'Location': 'https://example.invalid/forbidden'})
        return Response(url, payload, 206, result_headers)


def pins(data):
    return {'url': URL, 'member': NAME, 'size': len(data), 'sha256': hashlib.sha256(data).hexdigest()}


def consume(pin, size, opener):
    output = bytearray()
    with a.open_actions_member(pin, size, TOKEN, opener) as source:
        while block := source.read(1024**2):
            output.extend(block)
    return bytes(output)


class ActionsMemberTests(unittest.TestCase):
    def test_catalog_sixteen_gib_boundary_without_allocating_large_data(self):
        data = archive_bytes(b'A')
        self.assertEqual(a._archive_pin(pins(data), 16 * 1024**3, TOKEN, Opener(data)), 123)
        with self.assertRaises(ValueError):
            a._archive_pin(pins(data), 16 * 1024**3 + 1, TOKEN, Opener(data))

    def test_many_normal_lease_renewals_allow_progress_but_failed_range_stays_bounded(self):
        payload = b'A' * 4096
        data = archive_bytes(payload)
        class ShortLeaseOpener(Opener):
            def __init__(self, raw, always_fail=False):
                super().__init__(raw)
                self.expired, self.always_fail = set(), always_fail
            def open(self, request, timeout):
                response = super().open(request, timeout)
                value = request.get_header('Range')
                if request.full_url.startswith(BLOB) and value != 'bytes=0-0':
                    if value not in self.expired or self.always_fail:
                        self.expired.add(value)
                        response.close()
                        return Response(request.full_url, b'', 403)
                return response
        opener = ShortLeaseOpener(data)
        with patch.object(a, 'CHUNK', 128), patch.object(a.time, 'sleep'):
            output = bytearray()
            with a.open_actions_member(pins(data), len(payload), TOKEN, opener) as source:
                while block := source.read(64):
                    output.extend(block)
        self.assertEqual(bytes(output), payload)
        self.assertGreater(opener.leases, 8)
        rejected = ShortLeaseOpener(data, always_fail=True)
        with patch.object(a.time, 'sleep'), self.assertRaisesRegex(RuntimeError, 'retry budget'):
            consume(pins(data), len(payload), rejected)
        self.assertEqual(rejected.leases, 2)
        failed = [h for u, h in rejected.requests if u.startswith(BLOB) and h['range'] != 'bytes=0-0']
        self.assertEqual(len(failed), 3)

    def test_exact_large_member_ranges_and_separated_authorization(self):
        payload = b'X' * (a.CHUNK + 101)
        data = archive_bytes(payload)
        opener = Opener(data)
        self.assertEqual(consume(pins(data), len(payload), opener), payload)
        self.assertEqual(opener.metadata_calls, 1)
        for url, headers in opener.requests:
            self.assertEqual(headers.get('authorization'), 'Bearer ' + TOKEN if url.startswith(a.API) else None)
            self.assertEqual(headers['accept-encoding'], 'identity')

    def test_only_truncated_range_retries_without_restarting_member(self):
        payload = b'A' * (a.CHUNK + 101)
        data = archive_bytes(payload)
        opener = Opener(data); opener.mode = 'short-once'
        with patch.object(a.time, 'sleep'):
            self.assertEqual(consume(pins(data), len(payload), opener), payload)
        start, end = opener.failed_range
        attempts = [h for u, h in opener.requests if h.get('range') == f'bytes={start}-{end}']
        self.assertEqual(len(attempts), 2)
        self.assertEqual(opener.leases, 1)

    def test_expired_signed_url_renews_same_metadata_and_keeps_range(self):
        payload = b'A' * 4000
        data = archive_bytes(payload)
        opener = Opener(data); opener.mode = 'renew-once'
        with patch.object(a.time, 'sleep'):
            self.assertEqual(consume(pins(data), len(payload), opener), payload)
        self.assertEqual(opener.metadata_calls, 2)
        self.assertEqual(opener.leases, 2)
        self.assertTrue(all('authorization' not in h for u, h in opener.requests if u.startswith(BLOB)))

    def test_metadata_or_renewed_digest_mismatch_is_rejected(self):
        payload = b'A' * 4000
        data = archive_bytes(payload)
        for mode in ('metadata-digest', 'renewed-digest'):
            with self.subTest(mode=mode), patch.object(a.time, 'sleep'):
                opener = Opener(data); opener.mode = mode
                with self.assertRaisesRegex(ValueError, 'metadata differs'):
                    consume(pins(data), len(payload), opener)
                if mode == 'metadata-digest':
                    self.assertEqual(opener.leases, 0)

    def test_range_etag_encoding_and_blob_redirect_fail_closed(self):
        payload = b'A' * 300
        data = archive_bytes(payload)
        for mode in ('etag-change', 'wrong-range', 'encoded', 'blob-redirect'):
            with self.subTest(mode=mode):
                opener = Opener(data); opener.mode = mode
                with self.assertRaises(ValueError):
                    consume(pins(data), len(payload), opener)

    def test_wrong_or_duplicate_exact_member_is_rejected(self):
        payload = b'A' * 300
        data = archive_bytes(payload)
        pin = pins(data); pin['member'] = 'other.zip'
        with self.assertRaisesRegex(ValueError, 'Exactly one'):
            consume(pin, len(payload), Opener(data))
        duplicate = archive_bytes(payload, duplicate=True)
        with self.assertRaisesRegex(ValueError, 'Exactly one'):
            consume(pins(duplicate), len(payload), Opener(duplicate))

    def test_crc_and_wrong_inner_size_are_rejected(self):
        payload = b'A' * 300
        data = archive_bytes(payload)
        changed = bytearray(data)
        changed[30 + len(NAME) + 10] ^= 1
        changed = bytes(changed)
        with self.assertRaises(zipfile.BadZipFile):
            consume(pins(changed), len(payload), Opener(changed))
        with self.assertRaisesRegex(ValueError, 'member type'):
            consume(pins(data), len(payload) + 1, Opener(data))

    def test_early_consumer_exit_and_unbounded_read_are_rejected(self):
        payload = b'A' * 300
        data = archive_bytes(payload)
        with self.assertRaisesRegex(ValueError, 'not completely consumed'):
            with a.open_actions_member(pins(data), len(payload), TOKEN, Opener(data)) as stream:
                stream.read(1)
        with self.assertRaisesRegex(ValueError, 'bounded'):
            with a.open_actions_member(pins(data), len(payload), TOKEN, Opener(data)) as stream:
                stream.read()

    def test_pin_and_redirect_opener_are_checked_before_network(self):
        payload = b'A' * 300
        data = archive_bytes(payload)
        for value in ('https://evil.invalid/zip', a.API + '123/zip?query=1'):
            opener = Opener(data); pin = pins(data); pin['url'] = value
            with self.assertRaises(ValueError):
                consume(pin, len(payload), opener)
            self.assertEqual(opener.requests, [])
        with self.assertRaises(ValueError):
            a._archive_pin(pins(data), len(payload), TOKEN, build_opener())
        class HwpNoRedirect(HTTPRedirectHandler):
            def redirect_request(self, *args, **kwargs): return None
        self.assertEqual(a._archive_pin(pins(data), len(payload), TOKEN,
                         build_opener(HwpNoRedirect())), 123)


if __name__ == '__main__':
    unittest.main()
