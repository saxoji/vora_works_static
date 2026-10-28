"""Stream one pinned Actions ZIP member without an archive or installer spool.

The bounded range design follows VORA SLIDE desktop_artifact.py at SHA256
d2d97fecec0d0eadab66d5057c6236bce392c6e4a68370485a3f4d6dc7327917.
GitHub's digest is provenance for the outer archive, not a local rehash. The
caller must hash the inner bytes before completing its S3 multipart upload.
"""
from contextlib import contextmanager
import http.client
import io
import json
import re
import stat
import time
import zipfile
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit
from urllib.request import HTTPRedirectHandler, OpenerDirector, Request

CHUNK = 8 * 1024**2
MAX_ATTEMPTS = 3
RANGE_SECONDS = 60
TRANSFER_SECONDS = 5400
API = 'https://api.github.com/repos/saxoji/vora_works_slide/actions/artifacts/'


class ActionsNoRedirect(HTTPRedirectHandler):
    """Leave signed-URL selection to the authenticated API boundary below."""
    def redirect_request(self, request, fp, code, message, headers, url):
        return None


class _Transient(Exception):
    pass


def _archive_pin(archive, expected_size, token, opener):
    if (not isinstance(archive, dict) or set(archive) != {'url', 'member', 'size', 'sha256'}
            or not isinstance(archive['url'], str)
            or re.fullmatch(re.escape(API) + r'[1-9][0-9]*/zip', archive['url']) is None
            or type(archive['size']) is not int or not 0 < archive['size'] <= 16 * 1024**3
            or not isinstance(archive['sha256'], str)
            or re.fullmatch('[a-f0-9]{64}', archive['sha256']) is None
            or not isinstance(archive['member'], str) or len(archive['member']) > 512
            or not archive['member'].lower().endswith('.zip')
            or re.search(r'[\x00-\x1f\x7f\\:]', archive['member'])
            or any(p in ('', '.', '..') for p in archive['member'].split('/'))
            or type(expected_size) is not int or not 0 < expected_size <= 16 * 1024**3
            or not isinstance(token, str) or not token or '\r' in token or '\n' in token):
        raise ValueError('Exact Actions archive and member pins are required')
    if isinstance(opener, OpenerDirector):
        redirects = [h for h in opener.handlers if isinstance(h, HTTPRedirectHandler)]
        if len(redirects) != 1:
            raise ValueError('Actions requests require one non-redirecting handler')
        try:
            followed = redirects[0].redirect_request(Request(API + '1/zip'), None, 302, '', {},
                                                     'https://actions.example.invalid/')
        except Exception:
            raise ValueError('Actions opener must expose redirects without following them') from None
        if followed is not None:
            raise ValueError('Actions requests require the non-redirecting opener')
    return int(archive['url'][len(API):].split('/')[0])


def _signed_url(url):
    parsed = urlsplit(url)
    host = parsed.hostname or ''
    if (parsed.scheme != 'https' or parsed.username or parsed.password or parsed.port
            or parsed.fragment or not (host.endswith('.blob.core.windows.net')
                                       or host.endswith('.githubusercontent.com'))):
        raise ValueError('Untrusted Actions signed-URL destination')
    return url


class _Requests:
    def __init__(self, opener):
        self.opener = opener
        self.deadline = time.monotonic() + TRANSFER_SECONDS

    def timeout(self, deadline):
        left = min(self.deadline, deadline) - time.monotonic()
        if left <= 0:
            raise RuntimeError('Actions stream deadline exceeded')
        return min(RANGE_SECONDS, left)

    def request(self, url, headers, deadline):
        try:
            response = self.opener.open(Request(url, headers={**headers, 'Accept-Encoding': 'identity'}),
                                        timeout=self.timeout(deadline))
        except HTTPError as error:
            response = error
        except (OSError, URLError, http.client.HTTPException):
            raise _Transient('Actions transport failed') from None
        # An opener that follows redirects cannot be used with the bearer token.
        if response.geturl() != url:
            response.close()
            raise ValueError('Unexpected automatic Actions redirect')
        return response

    def retry(self, attempt, deadline):
        if attempt == MAX_ATTEMPTS:
            raise RuntimeError('Actions range or metadata retry budget exhausted') from None
        delay = 0.25 * attempt
        if self.timeout(deadline) <= delay:
            raise RuntimeError('Actions stream retry deadline exceeded')
        time.sleep(delay)


def _body(response, maximum):
    if response.headers.get('Content-Encoding'):
        raise ValueError('Encoded Actions response is not an exact byte source')
    try:
        data = response.read(maximum + 1)
    except (OSError, http.client.HTTPException):
        raise _Transient('Actions response was truncated') from None
    if len(data) > maximum:
        raise ValueError('Actions response exceeds its byte bound')
    return data


def _api(network, url, token, redirect=False, deadline=None):
    deadline = min(deadline or network.deadline, time.monotonic() + RANGE_SECONDS)
    headers = {'Authorization': 'Bearer ' + token, 'Accept': 'application/vnd.github+json',
               'X-GitHub-Api-Version': '2022-11-28'}
    for attempt in range(1, MAX_ATTEMPTS + 1):
        try:
            response = network.request(url, headers, deadline)
            try:
                if redirect and response.status == 302:
                    return _signed_url(response.headers.get('Location', ''))
                if not redirect and response.status == 200:
                    return json.loads(_body(response, 1024**2))
                if response.status != 429 and not 500 <= response.status <= 599:
                    raise ValueError('Actions metadata request was rejected')
            finally:
                response.close()
        except _Transient:
            pass
        network.retry(attempt, deadline)
    raise RuntimeError('Actions metadata retry budget exhausted')


def _metadata(network, pin, token, deadline=None):
    metadata = _api(network, pin['url'].removesuffix('/zip'), token, deadline=deadline)
    artifact_id = int(pin['url'][len(API):].split('/')[0])
    if (not isinstance(metadata, dict) or metadata.get('id') != artifact_id
            or metadata.get('size_in_bytes') != pin['size']
            or metadata.get('digest') != 'sha256:' + pin['sha256']
            or metadata.get('expired') is not False):
        raise ValueError('Actions outer archive metadata differs from its pinned provenance')


class _RangeReader(io.RawIOBase):
    def __init__(self, network, pin, token):
        super().__init__()
        self.network, self.pin, self.token = network, pin, token
        self.size, self.pos, self.buffer_start = pin['size'], 0, 0
        self.buffer, self.etag, self.renewals = b'', None, 0
        self.url = _api(network, pin['url'], token, redirect=True)
        self._range(0, 0)  # Establish the outer size and a strong ETag.

    def _renew(self, deadline):
        # Successful ranges may need many normal short-lived URL renewals. One
        # renewal per failed range, three attempts and the whole 90-minute
        # deadline still bound failures; normal renewals do not exhaust a quota.
        self.network.timeout(deadline)
        self.renewals += 1
        _metadata(self.network, self.pin, self.token, deadline=deadline)
        self.url = _api(self.network, self.pin['url'], self.token, redirect=True, deadline=deadline)

    def _range(self, start, end):
        deadline = time.monotonic() + RANGE_SECONDS
        renewed = False
        for attempt in range(1, MAX_ATTEMPTS + 1):
            status = None
            try:
                headers = {'Range': f'bytes={start}-{end}'}
                if self.etag is not None:
                    headers['If-Match'] = self.etag
                response = self.network.request(self.url, headers, deadline)
                try:
                    status = response.status
                    if status == 206:
                        if response.headers.get('Content-Range') != f'bytes {start}-{end}/{self.size}':
                            raise ValueError('Actions archive size or byte range changed')
                        etag = response.headers.get('ETag')
                        if (not isinstance(etag, str) or not re.fullmatch(r'"[^"\r\n]{1,200}"', etag)
                                or self.etag is not None and etag != self.etag):
                            raise ValueError('Actions archive ETag changed or is missing')
                        data = _body(response, end - start + 1)
                        if len(data) != end - start + 1:
                            raise _Transient('Actions range was truncated')
                        self.network.timeout(deadline)
                        self.etag = etag
                        return data
                    if status not in (200, 401, 403, 429) and not 500 <= status <= 599:
                        raise ValueError('Actions byte range was rejected')
                finally:
                    response.close()
            except _Transient:
                pass
            if attempt < MAX_ATTEMPTS and status in (200, 401, 403) and not renewed:
                self._renew(deadline)
                renewed = True
            self.network.retry(attempt, deadline)
        raise RuntimeError('Actions range retry budget exhausted')

    def seekable(self): return True
    def readable(self): return True
    def tell(self): return self.pos

    def seek(self, offset, whence=0):
        if whence not in (0, 1, 2):
            raise ValueError('Invalid Actions archive seek mode')
        position = offset if whence == 0 else self.pos + offset if whence == 1 else self.size + offset
        if not 0 <= position <= self.size:
            raise ValueError('Invalid Actions archive seek')
        self.pos = position
        return position

    def read(self, count=-1):
        if self.closed:
            raise ValueError('Actions archive reader is closed')
        count = min(self.size - self.pos, self.size - self.pos if count < 0 else count)
        if count > 64 * 1024**2:
            raise ValueError('Unbounded Actions ZIP directory read refused')
        output = bytearray()
        while count:
            if not self.buffer_start <= self.pos < self.buffer_start + len(self.buffer):
                self.buffer_start = self.pos
                self.buffer = b''
                self.buffer = self._range(self.pos, min(self.pos + CHUNK, self.size) - 1)
            offset = self.pos - self.buffer_start
            length = min(count, len(self.buffer) - offset)
            output.extend(self.buffer[offset:offset + length])
            self.pos += length
            count -= length
        return bytes(output)


class _Member:
    def __init__(self, stream, size):
        self.stream, self.size, self.count, self.eof = stream, size, 0, False

    def read(self, count=-1):
        if type(count) is not int or not 0 <= count <= CHUNK:
            raise ValueError('Actions member requires reads bounded to 8 MiB')
        if not count or self.eof:
            return b''
        data = self.stream.read(count)  # ZipExtFile checks the member CRC at EOF.
        self.count += len(data)
        if self.count > self.size:
            raise ValueError('Actions member exceeds the expected size')
        if self.count == self.size:
            if self.stream.read(1):
                raise ValueError('Actions member contains unexpected trailing data')
            self.eof = True
        elif not data:
            raise ValueError('Actions member ended before the expected size')
        return data


@contextmanager
def open_actions_member(archive, expected_size, token, opener):
    """Yield the exact inner byte stream; caller owns inner SHA and S3 completion."""
    _archive_pin(archive, expected_size, token, opener)
    network = _Requests(opener)
    _metadata(network, archive, token)
    with _RangeReader(network, archive, token) as reader, zipfile.ZipFile(reader) as container:
        matches = [item for item in container.infolist() if item.filename == archive['member']]
        if len(matches) != 1:
            raise ValueError('Exactly one pinned Actions member is required')
        info = matches[0]
        if (info.is_dir() or info.flag_bits & 1 or info.compress_type not in (0, 8)
                or stat.S_IFMT(info.external_attr >> 16) not in (0, stat.S_IFREG)
                or info.file_size != expected_size):
            raise ValueError('Actions member type, encryption, compression or size is invalid')
        with container.open(info) as stream:
            member = _Member(stream, expected_size)
            yield member
            if not member.eof:
                raise ValueError('Actions member was not completely consumed and CRC checked')
