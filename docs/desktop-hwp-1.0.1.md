# HWP desktop 1.0.1 delivery

The HWP web fix was deployed first: `c5e401f0cedf5a483ed9c9285d1002ffe1cdc954`, Render deployment `dep-dbfhbqh5efls73c036p0`, Live at 2026-10-26 08:59:35 UTC. Production functionality was not exercised; local development and actual production bundles were verified.

Standalone installers were built from `fcff5dc351395df1fe9628f6d3ee92b0b53a3e80` in [GitHub Actions run 40291679088](https://github.com/saxoji/vora_works_hwp/actions/runs/40291679088). All three platform jobs succeeded, including native editor/save/print/export/AI-lock/update smoke checks. Downloaded installer bytes were checked against their generated manifests, actual Mach-O ARM64 / PE x64 / ELF x64 headers, and GitHub release asset digests. The later Smart direct-text web feature remains gated by AI availability; standalone AI features remain disabled.

The catalog retains immutable 1.0.0 artifacts and points the stable feed to 1.0.1. Five 1.0.1 assets live in the private GitHub `desktop-v1.0.1` draft as build archives; public downloads and automatic update information are emitted by STATIC. No existing release asset was replaced.

Local checks: production publisher streamed and verified all five actual installers; release security/integrity tests 5/5; download-page checks 96 language/theme/viewport combinations plus no-JS, SEO/OG, saved preferences, OS links and checksum details. Large verified local duplicate installers were removed after testing to release shared disk space; CI assets and private release archives remain available.
