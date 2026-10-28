"""실제 설치 파일/네트워크 없이 S3 이관의 무결성·불변성·게시 순서를 검증한다."""
from contextlib import redirect_stdout
import hashlib
import importlib.util
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import Mock, patch
from urllib.request import Request

from botocore.exceptions import ClientError

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
