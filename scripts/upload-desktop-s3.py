#!/usr/bin/env python3
"""검증된 앱 원본을 디스크 적재 없이 S3로 이관하고 CDN 준비 marker를 마지막에 게시한다."""
from __future__ import annotations

import argparse
import base64
from concurrent.futures import ThreadPoolExecutor
from contextlib import contextmanager
import hashlib
import json
import os
from pathlib import Path
import re
import ssl
import subprocess
import time
from urllib.error import HTTPError
from urllib.parse import urlparse
from urllib.request import HTTPRedirectHandler, HTTPSHandler, Request, build_opener

import boto3
from botocore.config import Config
from botocore.exceptions import ClientError
import certifi

PRODUCTS = ("cell", "hwp", "slide", "word")
CHUNK = 64 * 1024 * 1024
READ_SIZE = 1024 * 1024
ROOT = Path(__file__).resolve().parents[1]


class SourceRedirect(HTTPRedirectHandler):
    def redirect_request(self, request, fp, code, message, headers, url):
        parsed = urlparse(url)
        if (parsed.scheme != "https" or parsed.username or parsed.password
                or not (parsed.hostname == "api.github.com" or (parsed.hostname or "").endswith(".githubusercontent.com"))):
            raise ValueError("Untrusted source redirect")
        redirected = super().redirect_request(request, fp, code, message, headers, url)
        if redirected is not None and parsed.hostname != "api.github.com":
            redirected.remove_header("Authorization")
        return redirected


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs):
        raise ValueError("CDN must serve bytes directly, without redirects")


def https_client(redirect):
    return build_opener(redirect, HTTPSHandler(context=ssl.create_default_context(cafile=certifi.where())))


def sources(value, artifact, product):
    if not isinstance(value, (str, dict)):
        raise ValueError("Invalid artifact source")
    if isinstance(value, dict) and "actionsArtifact" in value:
        archive = value["actionsArtifact"]
        if set(value) != {"actionsArtifact"} or not isinstance(archive, dict):
            raise ValueError("Invalid Actions archive provenance")
        url = archive.get("url", "")
        digest = archive.get("sha256", "")
        if not isinstance(url, str) or not isinstance(digest, str):
            raise ValueError("Invalid Actions archive provenance")
        parsed = urlparse(url)
        member = archive.get("member", "")
        if (product != "slide" or artifact.get("platform") != "windows" or artifact.get("arch") != "x64"
                or artifact.get("format") != "zip" or artifact.get("bundleKind") != "windows-msi-cab-v1"
                or parsed.scheme != "https" or parsed.netloc != "api.github.com" or parsed.query or parsed.fragment
                or not re.fullmatch(r"/repos/saxoji/vora_works_slide/actions/artifacts/[0-9]+/zip", parsed.path)
                or not isinstance(member, str) or not member or "\\" in member or "\x00" in member
                or any(segment in ("", ".", "..") for segment in member.split("/"))
                or ":" in member or not member.lower().endswith(".zip")
                or type(archive.get("size")) is not int or not 0 < archive["size"] <= 16 * 1024**3
                or not re.fullmatch(r"[a-f0-9]{64}", digest)):
            raise ValueError("Untrusted Actions archive provenance")
        # The archive is provenance only. A verified extracted installer is supplied privately
        # through --local-map; never mistake the outer archive bytes/hash for the installer.
        return []
    parts = [{"url": value, "size": artifact["size"], "sha256": artifact["sha256"]}] if isinstance(value, str) else value.get("parts", [])
    if (not isinstance(parts, list) or not 1 <= len(parts) <= 4 or any(not isinstance(part, dict) for part in parts)
            or sum(part.get("size", 0) for part in parts) != artifact["size"]):
        raise ValueError("Invalid source part sizes")
    seen = set()
    for part in parts:
        parsed = urlparse(part.get("url", ""))
        if (parsed.scheme != "https" or parsed.netloc != "api.github.com" or parsed.query or parsed.fragment
                or not re.fullmatch(rf"/repos/saxoji/vora_works_{product}/releases/assets/[0-9]+", parsed.path)
                or parsed.path in seen or type(part.get("size")) is not int or part["size"] <= 0
                or not re.fullmatch(r"[a-f0-9]{64}", part.get("sha256", ""))):
            raise ValueError("Untrusted source part")
        seen.add(parsed.path)
    return parts


def catalogs(root, products):
    result = []
    for product in products:
        raw = (root / f"releases/{product}/catalog.json").read_bytes()
        catalog = json.loads(raw)
        if catalog.get("schemaVersion") != 1:
            raise ValueError("Invalid catalog schema")
        files = []
        used = set()
        for release in catalog["releases"]:
            manifest = release["manifest"]
            version = manifest["version"]
            if manifest.get("product") != product or not re.fullmatch(r"[0-9]+\.[0-9]+\.[0-9]+", version):
                raise ValueError("Invalid release identity")
            for artifact in manifest["artifacts"]:
                parsed = urlparse(artifact["url"])
                name = parsed.path.rsplit("/", 1)[-1]
                expected = f"/releases/{product}/{version}/{name}"
                if (parsed.scheme != "https" or parsed.netloc != "works.vora.im" or parsed.query or parsed.fragment
                        or parsed.path != expected or not re.fullmatch(rf"VORA-{product.upper()}-{re.escape(version)}-[A-Za-z0-9_.-]+", name)
                        or name in used or type(artifact["size"]) is not int or not 0 < artifact["size"] <= 16 * 1024**3
                        or not re.fullmatch(r"[a-f0-9]{64}", artifact["sha256"])):
                    raise ValueError("Invalid public artifact")
                used.add(name)
                files.append(dict(product=product, version=version, name=name, path=expected,
                                  size=artifact["size"], sha256=artifact["sha256"],
                                  parts=sources(release["assets"][name], artifact, product)))
        result.append(dict(product=product, sha256=hashlib.sha256(raw).hexdigest(), files=files))
    return result


def existing(client, bucket, key):
    try:
        return client.head_object(Bucket=bucket, Key=key)
    except ClientError as error:
        if error.response["Error"]["Code"] in {"404", "NoSuchKey", "NotFound"}:
            return None
        raise


def matching(head, size, digest):
    return bool(head and head.get("ContentLength") == size and head.get("Metadata", {}).get("sha256") == digest
                and not head.get("ContentEncoding"))


@contextmanager
def open_part(part, token, opener):
    if part.get("local"):
        with Path(part["local"]).open("rb") as stream:
            yield stream
    else:
        headers = {"Accept": "application/octet-stream", "X-GitHub-Api-Version": "2022-11-28",
                   "Authorization": f"Bearer {token}"}
        with opener.open(Request(part["url"], headers=headers), timeout=90) as response:
            if response.status != 200 or response.headers.get("Content-Encoding"):
                raise ValueError("Unexpected source response")
            yield response


def upload_artifact(client, bucket, prefix, artifact, token, opener, local=None, chunk_size=CHUNK):
    key = prefix + artifact["path"]
    head = existing(client, bucket, key)
    if head:
        if not matching(head, artifact["size"], artifact["sha256"]):
            raise ValueError(f"Refusing to replace existing immutable artifact: {key}")
        print(f"Reuse {key} ({artifact['size']} bytes)", flush=True)
        return head
    parts = artifact["parts"]
    if local:
        if Path(local).stat().st_size != artifact["size"]:
            raise ValueError("Local verified artifact size differs")
        parts = [dict(local=local, size=artifact["size"], sha256=artifact["sha256"])]
    if not parts:
        raise ValueError("Actions archive source requires a verified local installer")
    created = client.create_multipart_upload(
        Bucket=bucket, Key=key, ContentType="application/octet-stream",
        ContentDisposition=f'attachment; filename="{artifact["name"]}"',
        CacheControl="public,max-age=31536000,immutable", ChecksumAlgorithm="SHA256",
        Metadata={"sha256": artifact["sha256"], "product": artifact["product"], "version": artifact["version"]})
    upload_id = created["UploadId"]
    completed = False
    total_hash = hashlib.sha256()
    total = 0
    pending = []
    uploaded = []
    buffer = bytearray()
    started = last_progress = time.monotonic()

    def upload(number, payload):
        checksum = base64.b64encode(hashlib.sha256(payload).digest()).decode()
        response = client.upload_part(Bucket=bucket, Key=key, UploadId=upload_id, PartNumber=number,
                                      Body=payload, ChecksumSHA256=checksum)
        return {"PartNumber": number, "ETag": response["ETag"], "ChecksumSHA256": checksum}

    try:
        with ThreadPoolExecutor(max_workers=2) as workers:
            number = 1
            for part in parts:
                part_hash = hashlib.sha256()
                part_size = 0
                with open_part(part, token, opener) as stream:
                    while block := stream.read(READ_SIZE):
                        total += len(block); part_size += len(block)
                        if total > artifact["size"] or part_size > part["size"]:
                            raise ValueError("Source exceeds pinned size")
                        total_hash.update(block); part_hash.update(block); buffer.extend(block)
                        if len(buffer) >= chunk_size:
                            pending.append(workers.submit(upload, number, bytes(buffer)))
                            number += 1; buffer.clear()
                            if len(pending) >= 2:
                                uploaded.append(pending.pop(0).result())
                        if time.monotonic() - last_progress >= 20:
                            print(f"Upload {artifact['name']}: {total}/{artifact['size']} ({total * 100 // artifact['size']}%)", flush=True)
                            last_progress = time.monotonic()
                if part_size != part["size"] or part_hash.hexdigest() != part["sha256"]:
                    raise ValueError("Pinned source part checksum mismatch")
            if total != artifact["size"] or total_hash.hexdigest() != artifact["sha256"]:
                raise ValueError("Pinned artifact checksum mismatch")
            if buffer:
                pending.append(workers.submit(upload, number, bytes(buffer)))
            uploaded.extend(future.result() for future in pending)
        client.complete_multipart_upload(Bucket=bucket, Key=key, UploadId=upload_id,
                                          MultipartUpload={"Parts": sorted(uploaded, key=lambda part: part["PartNumber"])},
                                          IfNoneMatch="*")
        completed = True
    finally:
        if not completed:
            client.abort_multipart_upload(Bucket=bucket, Key=key, UploadId=upload_id)
    head = existing(client, bucket, key)
    if not matching(head, artifact["size"], artifact["sha256"]):
        raise ValueError("Completed S3 artifact does not match pinned metadata")
    print(f"Complete {artifact['name']}: {total} bytes, {time.monotonic()-started:.1f}s", flush=True)
    return head


def verify_cdn(opener, url, head):
    with opener.open(Request(url, method="HEAD"), timeout=30) as response:
        if (response.status != 200 or response.headers.get("Content-Encoding")
                or int(response.headers.get("Content-Length", -1)) != head["ContentLength"]
                or response.headers.get("ETag") != head["ETag"]):
            raise ValueError("CDN artifact differs from S3 object")


def publish_marker(client, bucket, prefix, catalog):
    key = f"{prefix}/releases/{catalog['product']}/catalogs/{catalog['sha256']}.json"
    payload = (json.dumps({"product": catalog["product"], "sha256": catalog["sha256"]}, separators=(",", ":")) + "\n").encode()
    digest = hashlib.sha256(payload).hexdigest()
    head = existing(client, bucket, key)
    if head:
        if not matching(head, len(payload), digest):
            raise ValueError("Refusing to replace existing catalog marker")
    else:
        client.put_object(Bucket=bucket, Key=key, Body=payload, ContentType="application/json",
                          CacheControl="public,max-age=31536000,immutable", IfNoneMatch="*",
                          Metadata={"sha256": digest}, ChecksumSHA256=base64.b64encode(hashlib.sha256(payload).digest()).decode())
    return key


def load_settings(path):
    settings = {}
    if path:
        for line in Path(path).read_text().splitlines():
            if line.strip() and not line.lstrip().startswith("#") and "=" in line:
                key, value = line.strip().removeprefix("export ").split("=", 1)
                settings[key] = value.strip().strip('"').strip("'")
    settings.update(os.environ)
    return settings


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=ROOT)
    parser.add_argument("--env-file", type=Path)
    parser.add_argument("--product", choices=("all", *PRODUCTS), default="all")
    parser.add_argument("--bucket", default="vora-tool-storage")
    parser.add_argument("--region", default="ap-northeast-2")
    parser.add_argument("--prefix", default="vora-works")
    parser.add_argument("--cdn-base", default="https://cdn.vora.im/vora-works")
    parser.add_argument("--local-map", type=Path, help="Verified artifact basename to absolute local path JSON")
    parser.add_argument("--plan", action="store_true")
    args = parser.parse_args()
    if not re.fullmatch(r"[A-Za-z0-9_-]+(?:/[A-Za-z0-9_-]+)*", args.prefix):
        raise ValueError("Invalid S3 release prefix")
    cdn = urlparse(args.cdn_base)
    if cdn.scheme != "https" or cdn.username or cdn.password or cdn.query or cdn.fragment:
        raise ValueError("HTTPS CDN base required")
    selected = catalogs(args.root, PRODUCTS if args.product == "all" else [args.product])
    print(json.dumps({"catalogs": [{"product": c["product"], "sha256": c["sha256"], "files": len(c["files"]),
                                    "bytes": sum(a["size"] for a in c["files"])} for c in selected]}), flush=True)
    if args.plan:
        return
    settings = load_settings(args.env_file)
    token = settings.get("DESKTOP_RELEASE_GITHUB_TOKEN") or settings.get("GH_TOKEN")
    if not token:
        token = subprocess.check_output(["gh", "auth", "token"], stderr=subprocess.DEVNULL, text=True).strip()
    session = boto3.Session(aws_access_key_id=settings.get("AWS_ACCESS_KEY_ID") or settings.get("VORA_EXPORT_S3_ACCESS_KEY_ID"),
                            aws_secret_access_key=settings.get("AWS_SECRET_ACCESS_KEY") or settings.get("VORA_EXPORT_S3_SECRET_ACCESS_KEY"),
                            aws_session_token=settings.get("AWS_SESSION_TOKEN"), region_name=args.region)
    client = session.client("s3", config=Config(retries={"mode": "standard", "max_attempts": 4},
                                               connect_timeout=10, read_timeout=120, max_pool_connections=4))
    source_opener = https_client(SourceRedirect())
    cdn_opener = https_client(NoRedirect())
    local_map = json.loads(args.local_map.read_text()) if args.local_map else {}
    for catalog in selected:
        for artifact in catalog["files"]:
            head = upload_artifact(client, args.bucket, args.prefix, artifact, token, source_opener,
                                   local=local_map.get(artifact["name"]))
            verify_cdn(cdn_opener, args.cdn_base.rstrip("/") + artifact["path"], head)
        marker = publish_marker(client, args.bucket, args.prefix, catalog)
        print(f"Ready {catalog['product']}: {marker}", flush=True)


if __name__ == "__main__":
    try:
        main()
    except (ClientError, HTTPError) as error:
        # Never print signed URLs, source headers, or credential settings.
        code = error.response["Error"]["Code"] if isinstance(error, ClientError) else error.code
        raise SystemExit(f"Storage/source request failed ({code}); existing immutable objects remain unchanged") from None
