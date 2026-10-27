# CELL 1.0.2 macOS and Linux publication — 2026-10-27

Publish the two approved CELL installers independently. Keep the verified Windows
1.0.1 download available while Windows 1.0.2 updater validation is still running.
The desktop source commit is `70aaaa37d2da3aa17de1347814983ba328763826`.

## Approved immutable files

| Platform | File | Bytes | SHA-256 |
| --- | --- | ---: | --- |
| macOS Apple Silicon | `VORA-CELL-1.0.2-mac-arm64.dmg` | 1355645090 | `b75dd4f150ddd7354ad87f7dbaa1bad92aa1111308eedca7844d49636caddb9e` |
| Linux x64 | `VORA-CELL-1.0.2-linux-x64.AppImage` | 1205836280 | `e53e6fcc87678a96f9ab49d8916ce5730e46d20fa0b4eac70aed6447b96d5a92` |

CELL's release owner approved both installed-app and updater/rollback evidence in
`/private/tmp/cell-final190/unix-publication-approval.json` and
`/private/tmp/cell-final190/release-handoff-current.md`. GitHub asset metadata was
independently checked against the names, byte lengths, digests and uploaded state.
Private GitHub releases remain private; Render publishes the verified bytes under
`https://works.vora.im/releases/cell/1.0.2/`.

## Windows preservation and updater boundary

- The update manifest version is 1.0.2; its `artifacts` contain macOS and Linux only.
- The optional `downloadFallbacks` field is display-only. It carries the original
  Windows 1.0.1 artifacts, with their original URLs, sizes and hashes.
- The existing CELL native updater ignores unknown fields and returns no update
  when its platform is absent from `artifacts`. It never receives Windows 1.0.1
  bytes advertised as a 1.0.2 update.
- Server-rendered pages, live manifest refresh and installation instructions use
  the same validated downloads. Each OS card displays its own artifact version.
- Current artifacts win over fallbacks. Withdrawn platforms stay unavailable;
  invalid external URLs and duplicated fallback entries are rejected or ignored.
- Windows 1.0.2 must not be added until its release owner confirms updater QA.

## Local verification

- 35 public-config, release publisher/feed and installation-guide unit tests passed.
- Preview production-page generation passed (20 pages; installers deliberately
  omitted from local preview to avoid duplicating multi-gigabyte release assets).
- Chrome download-page checks passed all 96 product/language/theme/viewport
  combinations, plus no-JavaScript content, SEO/OG, system theme, saved preferences,
  version details, links and downloads.
- Installation/browser checks passed 12 main pages, 156 download clicks, 48 guide
  pages, 48 dialogs, seven feed/format boundaries and three WebKit language cases,
  with no page errors.
- Korean dark desktop CELL page was visually inspected: macOS/Linux 1.0.2 and
  Windows 1.0.1 are readable and all three platform cards align without wrapping.
- Render's existing production publisher downloads every archive and checks its
  full size and SHA-256 before a deployment can succeed. No production AI scenario
  was invoked for this release.

The three configured CELL platform URLs point to the static download page with an
OS query. `PUBLIC_CELL_WINDOWS_DOWNLOAD_URL` was explicitly aligned with macOS and
Linux; private archive authentication remains a server-only environment variable.
