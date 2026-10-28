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
  for each of `word`, `slide`, `cell`, and `hwp`.
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

Infrastructure connection and the first S3/CDN publication are coordinated
separately. Do not enable metadata-only on Render until storage and the rewrite
destinations are ready.
