"""실제 설치 파일/네트워크 없이 S3 이관의 무결성·불변성·게시 순서를 검증한다."""
from contextlib import nullcontext, redirect_stdout
import hashlib
import copy
import importlib.util
import io
import json
from pathlib import Path
import tempfile
import sys
import unittest
import zipfile
from unittest.mock import Mock, patch
from urllib.request import Request

from botocore.exceptions import ClientError

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
spec = importlib.util.spec_from_file_location("desktop_s3", Path(__file__).resolve().parents[1] / "scripts/upload-desktop-s3.py")
upload = importlib.util.module_from_spec(spec); spec.loader.exec_module(upload)


class S3:
    def __init__(self):
        self.objects = {}; self.pending = {}; self.aborted = False; self.completed = False; self.created = 0
    def head_object(self, Bucket, Key):
        if Key not in self.objects:
            raise ClientError({"Error": {"Code": "404"}}, "HeadObject")
        return self.objects[Key]
    def create_multipart_upload(self, **kwargs):
        self.config = kwargs; self.created += 1
        return {"UploadId": "owned-upload"}
    def upload_part(self, **kwargs):
        self.pending[kwargs["PartNumber"]] = kwargs["Body"]
        return {"ETag": '"part"'}
    def complete_multipart_upload(self, **kwargs):
        assert kwargs["IfNoneMatch"] == "*"
        body = b"".join(self.pending[part["PartNumber"]] for part in kwargs["MultipartUpload"]["Parts"])
        self.completed = True
        self.objects[kwargs["Key"]] = {"ContentLength": len(body), "Metadata": self.config["Metadata"], "ETag": '"final"'}
    def abort_multipart_upload(self, **kwargs): self.aborted = True
    def put_object(self, **kwargs):
        assert kwargs["IfNoneMatch"] == "*"
        self.objects[kwargs["Key"]] = {"ContentLength": len(kwargs["Body"]), "Metadata": kwargs["Metadata"], "ETag": '"marker"'}


class Response(io.BytesIO):
    status = 200
    def __init__(self, body=b"", headers=None):
        super().__init__(body); self.headers = headers or {}


def artifact(body=b"trusted installer"):
    digest = hashlib.sha256(body).hexdigest()
    return dict(product="cell", version="1.0.3", name="VORA-CELL-1.0.3-win-x64.msi", path="/releases/cell/1.0.3/VORA-CELL-1.0.3-win-x64.msi",
                size=len(body), sha256=digest, parts=[dict(url="https://api.github.com/repos/saxoji/vora_works_cell/releases/assets/1", size=len(body), sha256=digest)])


def actions_artifact(body=b"trusted installer"):
    value = artifact(body)
    value.update(product="slide", name="VORA-SLIDE-1.0.2-win-x64.zip", version="1.0.2",
                 path="/releases/slide/1.0.2/VORA-SLIDE-1.0.2-win-x64.zip", parts=[],
                 actionsArtifact=dict(url="https://api.github.com/repos/saxoji/vora_works_slide/actions/artifacts/123/zip",
                                      member="bundle/original.zip", size=456, sha256="a" * 64))
    return value


class ActionsUploadTests(unittest.TestCase):
    def setUp(self):
        self.quiet = redirect_stdout(io.StringIO()); self.quiet.__enter__(); self.addCleanup(self.quiet.__exit__, None, None, None)

    def test_linux_actions_source_accepts_only_exact_appimage_contract(self):
        value = dict(platform="linux", arch="x64", format="AppImage")
        source = {"actionsArtifact": dict(actions_artifact()["actionsArtifact"], member="dist/VORA-SLIDE-1.0.3-linux-x64.AppImage")}
        self.assertEqual(upload.sources(source, value, "slide"), [])
        for key, field in (("platform", "macos"), ("platform", "windows"), ("arch", "arm64"),
                           ("format", "zip"), ("bundleKind", "windows-msi-cab-v1")):
            with self.subTest(key=key, field=field), self.assertRaises(ValueError):
                upload.sources(source, dict(value, **{key: field}), "slide")
        for member in ("installer.zip", "../installer.AppImage", "x" * 513 + ".AppImage"):
            with self.subTest(member=member), self.assertRaises(ValueError):
                upload.sources({"actionsArtifact": dict(source["actionsArtifact"], member=member)}, value, "slide")
        with self.assertRaises(ValueError): upload.sources(source, value, "cell")

    def test_actions_catalog_keeps_outer_provenance_separate_from_inner_installer(self):
        value = actions_artifact()
        manifest_artifact = dict(platform="windows", arch="x64", format="zip", bundleKind="windows-msi-cab-v1",
                                 url="https://works.vora.im" + value["path"], size=value["size"], sha256=value["sha256"])
        catalog = dict(schemaVersion=1, releases=[dict(manifest=dict(product="slide", version="1.0.2", artifacts=[manifest_artifact]),
                                                       assets={value["name"]: {"actionsArtifact": value["actionsArtifact"]}})])
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "releases/slide/catalog.json"; path.parent.mkdir(parents=True)
            path.write_text(json.dumps(catalog))
            self.assertEqual(upload.catalogs(Path(directory), ["slide"])[0]["files"], [value])
        for member in ("bundle/\noriginal.zip", "bundle/\x7foriginal.zip"):
            source = {"actionsArtifact": dict(value["actionsArtifact"], member=member)}
            with self.assertRaises(ValueError): upload.sources(source, manifest_artifact, "slide")
        with self.assertRaises(ValueError):
            upload.sources({"actionsArtifact": dict(value["actionsArtifact"], extra=True)}, manifest_artifact, "slide")
        with self.assertRaisesRegex(ValueError, "part fields"):
            upload.sources({"parts": [dict(artifact()["parts"][0], actionsArtifact=value["actionsArtifact"])]}, artifact(), "cell")

    def test_actions_member_stream_finishes_multipart_only_for_verified_inner_bytes(self):
        value = actions_artifact(); client = S3(); opener = Mock(); range_opener = Mock()
        with patch.object(upload, "open_actions_member", return_value=nullcontext(Response(b"trusted installer"))) as member, \
                patch.object(upload, "https_client", return_value=range_opener) as factory:
            head = upload.upload_artifact(client, "bucket", "vora-works", value, "private-token", opener, chunk_size=5)
            member.assert_called_once_with(value["actionsArtifact"], value["size"], "private-token", range_opener)
            self.assertIsInstance(factory.call_args.args[0], upload.ActionsNoRedirect)
            self.assertIsNone(factory.call_args.args[0].redirect_request(None, None, 302, "Found", {}, "https://example.invalid/"))
            self.assertEqual(head["ContentLength"], value["size"])
            self.assertTrue(client.completed); self.assertFalse(client.aborted)
            upload.upload_artifact(client, "bucket", "vora-works", value, "private-token", opener)
            self.assertEqual(member.call_count, 1)
            self.assertEqual(client.created, 1)
        opener.open.assert_not_called()

    def test_actions_crc_size_hash_and_s3_failures_abort_without_publishing(self):
        class BadCRC(io.BytesIO):
            def read(self, size=-1):
                block = super().read(size)
                if not block: raise zipfile.BadZipFile("Bad CRC-32")
                return block
        for fault in ("crc", "short", "large", "hash", "s3"):
            value = actions_artifact(); client = S3()
            stream = BadCRC(b"trusted installer") if fault == "crc" else Response(
                b"trusted" if fault == "short" else b"trusted installer too large" if fault == "large" else b"trusted installer")
            if fault == "hash": value["sha256"] = "0" * 64
            if fault == "s3": client.upload_part = Mock(side_effect=RuntimeError("S3 upload failed"))
            with self.subTest(fault=fault), patch.object(upload, "open_actions_member", return_value=nullcontext(stream)), self.assertRaises(Exception):
                upload.upload_artifact(client, "bucket", "vora-works", value, "token", Mock(), chunk_size=5)
            self.assertTrue(client.aborted); self.assertFalse(client.completed)
            self.assertNotIn("vora-works" + value["path"], client.objects)

    def test_actions_local_override_and_matching_existing_objects_do_not_open_archive(self):
        value = actions_artifact(); client = S3()
        with tempfile.TemporaryDirectory() as directory, patch.object(upload, "open_actions_member") as member:
            path = Path(directory) / "installer.zip"; path.write_bytes(b"trusted installer")
            upload.upload_artifact(client, "bucket", "vora-works", value, "token", Mock(), local=path)
            upload.upload_artifact(client, "bucket", "vora-works", value, "token", Mock())
            member.assert_not_called()

    def test_actions_stream_setup_failure_aborts_owned_upload(self):
        client = S3()
        with patch.object(upload, "open_actions_member", side_effect=ValueError("Rejected archive")), self.assertRaises(ValueError):
            upload.upload_artifact(client, "bucket", "vora-works", actions_artifact(), "token", Mock())
        self.assertTrue(client.aborted); self.assertFalse(client.completed)

    def test_real_actions_zip_member_reaches_multipart_without_spooling(self):
        body = b"verified Windows installer bytes" * 100
        value = actions_artifact(body); archive = io.BytesIO()
        with zipfile.ZipFile(archive, "w", compression=zipfile.ZIP_DEFLATED) as container:
            container.writestr(value["actionsArtifact"]["member"], body)
        raw = archive.getvalue(); pin = value["actionsArtifact"]
        pin.update(size=len(raw), sha256=hashlib.sha256(raw).hexdigest())
        signed = "https://actions-results.blob.core.windows.net/release?sig=fixture"
        requests = []

        def respond(request, timeout):
            url = request.full_url; requests.append(request)
            status = 200; headers = {}
            if url == pin["url"].removesuffix("/zip"):
                payload = json.dumps(dict(id=123, size_in_bytes=pin["size"], digest="sha256:" + pin["sha256"], expired=False)).encode()
            elif url == pin["url"]:
                status = 302; headers = {"Location": signed}; payload = b""
            else:
                self.assertEqual(url, signed); self.assertIsNone(request.get_header("Authorization"))
                start, end = map(int, request.get_header("Range").removeprefix("bytes=").split("-"))
                status = 206; headers = {"Content-Range": f"bytes {start}-{end}/{len(raw)}", "ETag": '"fixed-archive"'}
                payload = raw[start:end + 1]
            response = Response(payload, headers); response.status = status; response.geturl = lambda: url
            return response

        client = S3(); network = Mock(); network.open.side_effect = respond
        with patch.object(upload, "https_client", return_value=network):
            upload.upload_artifact(client, "bucket", "vora-works", value, "fixture-token", Mock(), chunk_size=1024)
        self.assertTrue(client.completed); self.assertFalse(client.aborted)
        self.assertEqual(b"".join(client.pending[number] for number in sorted(client.pending)), body)
        self.assertGreater(len(requests), 2)


class UploadTests(unittest.TestCase):
    def setUp(self):
        self.quiet = redirect_stdout(io.StringIO()); self.quiet.__enter__(); self.addCleanup(self.quiet.__exit__, None, None, None)
    def test_streamed_upload_preserves_exact_bytes_then_reuses_same_object(self):
        client = S3(); value = artifact(); opener = Mock()
        opener.open.return_value = Response(b"trusted installer")
        head = upload.upload_artifact(client, "bucket", "vora-works", value, "token", opener, chunk_size=5)
        self.assertEqual(head["ContentLength"], value["size"])
        self.assertTrue(client.completed); self.assertFalse(client.aborted)
        upload.upload_artifact(client, "bucket", "vora-works", value, "token", opener)
        self.assertEqual(client.created, 1); self.assertEqual(opener.open.call_count, 1)
    def test_existing_immutable_mismatch_never_overwrites(self):
        client = S3(); value = artifact()
        client.objects["vora-works" + value["path"]] = {"ContentLength": value["size"], "Metadata": {"sha256": "0" * 64}}
        with self.assertRaisesRegex(ValueError, "Refusing"):
            upload.upload_artifact(client, "bucket", "vora-works", value, "token", Mock())
        self.assertEqual(client.created, 0)
    def test_corrupt_parts_or_full_digest_abort_before_completion(self):
        for full in (False, True):
            client = S3(); value = artifact(); opener = Mock()
            opener.open.return_value = Response(b"trusted installer" if full else b"corrupt installer")
            if full: value["sha256"] = "0" * 64
            with self.subTest(full=full), self.assertRaises(ValueError):
                upload.upload_artifact(client, "bucket", "vora-works", value, "token", opener)
            self.assertTrue(client.aborted); self.assertFalse(client.completed)
    def test_parts_are_hashed_separately_and_concatenated_without_local_files(self):
        body = b"first partsecond part"; value = artifact(body)
        value["parts"] = [dict(url=f"https://api.github.com/repos/saxoji/vora_works_cell/releases/assets/{index}", size=len(part), sha256=hashlib.sha256(part).hexdigest())
                          for index, part in enumerate((b"first part", b"second part"), 1)]
        opener = Mock(); opener.open.side_effect = [Response(b"first part"), Response(b"second part")]
        client = S3(); upload.upload_artifact(client, "bucket", "vora-works", value, "token", opener)
        self.assertTrue(client.completed)
    def test_verified_local_original_avoids_github_download(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "installer"; path.write_bytes(b"trusted installer")
            opener = Mock(); upload.upload_artifact(S3(), "bucket", "vora-works", artifact(), "token", opener, local=path)
            opener.open.assert_not_called()
    def test_actions_archive_pins_are_provenance_not_installer_bytes(self):
        value = artifact(); value.update(platform="windows", arch="x64", format="zip", bundleKind="windows-msi-cab-v1")
        source = {"actionsArtifact": {"url": "https://api.github.com/repos/saxoji/vora_works_slide/actions/artifacts/123/zip",
                                     "member": "dist/original-installer.zip", "size": 456, "sha256": "a" * 64}}
        self.assertEqual(upload.sources(source, value, "slide"), [])
        invalid = [("member", "../installer.zip"), ("member", "/installer.zip"), ("member", "C:/installer.zip"),
                   ("member", "dir\\installer.zip"), ("member", "installer.msi"), ("member", None),
                   ("url", "https://api.github.com/repos/saxoji/vora_works_word/actions/artifacts/123/zip"),
                   ("url", source["actionsArtifact"]["url"] + "?token=private"), ("url", None),
                   ("sha256", "wrong"), ("sha256", None), ("size", True), ("size", 0), ("size", 17 * 1024**3)]
        for key, field in invalid:
            changed = copy.deepcopy(source); changed["actionsArtifact"][key] = field
            with self.subTest(key=key, field=field), self.assertRaises(ValueError):
                upload.sources(changed, value, "slide")
        for key, field in [("platform", "macos"), ("arch", "arm64"), ("format", "msi"), ("bundleKind", "other")]:
            changed = dict(value, **{key: field})
            with self.subTest(key=key), self.assertRaises(ValueError): upload.sources(source, changed, "slide")
        with self.assertRaises(ValueError): upload.sources(source, value, "cell")
        with self.assertRaises(ValueError): upload.sources(dict(source, parts=[]), value, "slide")
    def test_actions_source_requires_local_file_before_creating_upload_and_validates_inner_hash(self):
        value = artifact(); value["parts"] = []; client = S3(); opener = Mock()
        with self.assertRaisesRegex(ValueError, "verified local installer"):
            upload.upload_artifact(client, "bucket", "vora-works", value, "token", opener)
        self.assertEqual(client.created, 0)
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "installer.zip"; path.write_bytes(b"trusted installer")
            upload.upload_artifact(client, "bucket", "vora-works", value, "token", opener, local=path)
            self.assertTrue(client.completed)
            # Future metadata-only releases reuse the immutable S3 file after the Actions source expires.
            upload.upload_artifact(client, "bucket", "vora-works", value, "token", opener)
            self.assertEqual(client.created, 1)
            corrupt = S3(); path.write_bytes(b"corrupt installer")
            with self.assertRaisesRegex(ValueError, "checksum"):
                upload.upload_artifact(corrupt, "bucket", "vora-works", value, "token", opener, local=path)
            self.assertTrue(corrupt.aborted); self.assertFalse(corrupt.completed)
        opener.open.assert_not_called()
    def test_source_redirect_never_forwards_github_authorization(self):
        request = Request("https://api.github.com/repos/test", headers={"Authorization": "Bearer private"})
        redirected = upload.SourceRedirect().redirect_request(request, None, 302, "Found", {}, "https://release-assets.githubusercontent.com/asset?signature=value")
        self.assertIsNone(redirected.get_header("Authorization"))
        with self.assertRaises(ValueError):
            upload.SourceRedirect().redirect_request(request, None, 302, "Found", {}, "https://foreign.invalid/asset")
        with self.assertRaises(ValueError): upload.NoRedirect().redirect_request(request)
    def test_sources_reject_foreign_product_duplicate_and_invalid_sizes(self):
        value = artifact()
        with self.assertRaises(ValueError): upload.sources("https://api.github.com/repos/saxoji/vora_works_word/releases/assets/1", value, "cell")
        part = value["parts"][0]
        for source in [None, {"parts": [part, part]}, {"parts": []}, {"parts": [None]}]:
            with self.subTest(source=source), self.assertRaises(ValueError): upload.sources(source, value, "cell")
    def test_cdn_head_requires_original_size_etag_and_no_encoding(self):
        opener = Mock(); head = {"ContentLength": 17, "ETag": '"pinned"'}
        opener.open.return_value = Response(headers={"Content-Length": "17", "ETag": '"pinned"'})
        upload.verify_cdn(opener, "https://cdn.vora.im/file", head)
        for headers in [{"Content-Length": "16", "ETag": '"pinned"'}, {"Content-Length": "17", "ETag": '"other"'},
                        {"Content-Length": "17", "ETag": '"pinned"', "Content-Encoding": "gzip"}]:
            opener.open.return_value = Response(headers=headers)
            with self.assertRaises(ValueError): upload.verify_cdn(opener, "https://cdn.vora.im/file", head)
    def test_marker_is_immutable_and_only_written_after_all_artifacts(self):
        client = S3(); catalog = {"product": "cell", "sha256": "a" * 64, "files": [artifact()]}
        key = upload.publish_marker(client, "bucket", "vora-works", catalog)
        self.assertIn("/catalogs/" + "a" * 64 + ".json", key)
        upload.publish_marker(client, "bucket", "vora-works", catalog)
        with patch("sys.argv", ["uploader", "--product", "cell"]), patch.object(upload, "catalogs", return_value=[catalog]), \
                patch.object(upload, "load_settings", return_value={"GH_TOKEN": "private"}), patch.object(upload.boto3, "Session"), \
                patch.object(upload, "upload_artifact", side_effect=ValueError("Incomplete upload")), \
                patch.object(upload, "publish_marker") as marker:
            with self.assertRaises(ValueError): upload.main()
            marker.assert_not_called()


if __name__ == "__main__": unittest.main()
