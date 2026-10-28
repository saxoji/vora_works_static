# Desktop storage and website deployment

The failed Render deployment `dep-dbgpht5g1s2s73e8jaj0` ended with
`ENOSPC` on 2026-10-28 at 06:45:45 UTC. The catalog at `965a8f16` contains
37,094,576,757 bytes across current and historical installers. The publisher
already streams split source parts directly into each final file; the problem
is downloading the entire archive into every website build.

## Separate publishing from the website build

- Default `DESKTOP_RELEASE_ARTIFACTS=bundle` retains the existing verified file
  publisher for dedicated release publishing.
- The public website uses `DESKTOP_RELEASE_ARTIFACTS=metadata-only` and
  `DESKTOP_RELEASE_ORIGINS_JSON`, an object containing an HTTPS storage origin
  for each of `word`, `slide`, `cell`, and `hwp`. A base path is supported; the
  selected shared storage base is `https://cdn.vora.im/vora-works`.
- Metadata-only builds validate the same artifact and private source contracts
  and generate all version manifests and stable feeds. They never fetch an
  installer. The tested website output is 5.7 MB.
- Keep every public artifact URL under
  `https://works.vora.im/releases/{product}/{version}/{filename}`. Use a server
  rewrite returning the original bytes at that URL, not a 301/302 redirect.
  Installed clients can require the original origin and reject redirects.
- Keep file sizes, SHA-256 values, content length, range requests, and filenames
  unchanged. Historical versions stay available in storage.

## Publish files before advertising them

1. Upload and verify every immutable artifact referenced by a product catalog.
2. Compute SHA-256 over the exact source `catalog.json` bytes.
3. Only after all files are ready, publish
   `releases/{product}/catalogs/{sha256}.json` containing
   `{"product":"hwp","sha256":"..."}` (with the appropriate product).
4. The website checks the four small, immutable catalog markers in parallel
   before emitting feeds and download pages. A mismatched or unavailable
   storage build cannot advertise unavailable files. It waits at most 20 minutes
   and fails without replacing the existing live website.

Website-only updates reuse these markers without reinstalling applications,
downloading archives, rehashing unchanged files, or repeating app tests.

## Focused validation

Six storage tests cover unchanged feed/URL contracts without binary downloads,
private-source validation, one-product publishing, successful marker matching,
waiting only for a changed product, and failed storage blocking publication.
The two tests affected by the immutable marker-path refinement were rerun only
for that change. The actual site build with all four real catalogs and local
marker responses passed; no installer was fetched.

The existing S3 bucket `vora-tool-storage` in `ap-northeast-2` uses the new
`vora-works/releases/` prefix behind `cdn.vora.im`. CELL owns the initial uploader
and storage credentials; HWP owns website metadata and Render rewrites. WORD
and SLIDE provide their already verified release catalogs and source assets.
Private GitHub releases remain original-artifact archives and staging only;
S3 and CDN are the public installer and update delivery storage for every OS.
Do not rebuild, resign, renotarize, or reupload an unchanged app just to migrate
storage. Upload only missing objects; verify stored size and checksum before
writing immutable readiness markers. No secret belongs in a catalog, manifest,
marker, log, or Git commit.

Infrastructure connection and the first S3/CDN publication are coordinated
separately. Do not enable metadata-only on Render until storage and the rewrite
destinations are ready. Rewrite `/releases/{product}/*` to
`https://cdn.vora.im/vora-works/releases/{product}/*` with an HTTP 200 response,
including Range support, and preserve the existing withdrawn-file redirects.
Subsequent website updates must not download installation binaries.

The temporary `works.vora.im` rewrite was verified against the first migrated
CELL MSI: HEAD returned HTTP 200 with 52,355,072 bytes and no redirect; a
`bytes=0-31` request returned HTTP 206 with the correct total and exactly 32
bytes. The temporary route was removed after this single contract check. No
complete installer was downloaded or rehashed for the website verification.

For SLIDE Windows MSI/CAB ZIP files produced inside an Actions artifact, the
catalog may use `assets[filename].actionsArtifact` with exactly `url`, `member`,
`size`, and `sha256`. The URL identifies the pinned GitHub Actions artifact;
size and SHA belong to the outer archive. The existing manifest continues to
describe the inner installer ZIP. The archive member must be a safe relative
ZIP path. This source is restricted to SLIDE's `windows-msi-cab-v1` bundle.
The S3 publisher requires the verified inner file through a local map; the
website never downloads or treats the outer archive as the installer. Direct
`bundle` publishing rejects this source explicitly. No fabricated release URL
or second upload to GitHub private release parts is required.

## Required policy for every new OS release

Every new WORD, HWP, CELL, and SLIDE installer and updater binary must be
published to this S3/CDN storage. The owner of each product is responsible for
its own new release; the first bulk migration does not make CELL responsible
for all future uploads. GitHub original-artifact storage/staging is optional
and never substitutes for public S3/CDN publication.

Use the already verified, signed/notarized original bytes. Never overwrite a
different object at the same versioned key. Verify size and SHA, confirm CDN
availability, publish the exact catalog marker, and then publish the website
and updater feeds. Retain existing `works.vora.im` URLs. Official website
deployments must use metadata-only mode with zero installer downloads. A build
or Git push alone is not a completed app release. This policy update itself
does not require rebuilding or redeploying an unchanged application.

## Completed migration and website deployment

All 58 existing artifacts (37,094,576,757 bytes) were migrated with their
original size/hash and CDN HEAD verification. The website deployed commit
`7269dd3e01d563a036404a757c706f5ecae4f694` as
`dep-dbgq5rpsrm7s73eh7m70`, LIVE at 2026-10-28 07:23:40.620342 UTC.
Total deployment time was 13.155 seconds; site generation took about 0.7 seconds.

One final check confirmed all four stable feeds match their catalogs and return
HTTP 200 with no-cache headers: HWP 1.0.4, WORD 1.0.3, CELL 1.0.3, SLIDE 1.0.2.
The newly connected SLIDE Mac DMG returns HTTP 200 at its original works URL,
with 3,173,345,862 bytes and no redirect. This final check downloaded no installer
bytes. Existing withdrawn-file redirects were retained. New SLIDE Windows
packaging remains a separate follow-up and was not advertised prematurely.
