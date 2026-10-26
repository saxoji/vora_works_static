# CELL desktop 1.0.0 delivery

The CELL web was deployed first: commit `5a4612768a92dce96f4f203bdcca574616f23eb5`, Render deployment `dep-dbfhm4e7bikc73c7kuu0`, Live at 2026-10-26 09:51:06 UTC. This was confirmed using deployment metadata, without production functionality tests. The standalone catalog follows that web delivery.

Installers: macOS Apple Silicon DMG, Windows x64 MSI, Linux x64 AppImage. Runtime source is `93976728ede8b5c439ee619e9bd9dfe1e339554a`. Windows source `d4b41cfbd555a3a7b4ff1d5d3e56c5e689604b99` differs only in a POSIX-specific packaging test. Owner-provided installation checks exercised the actual packages, including Windows install/run/uninstall (all eight checks passed, exit 0).

CI: [macOS/Linux run 40294728140](https://github.com/saxoji/vora_works_cell/actions/runs/40294728140), [Windows run 40295386388](https://github.com/saxoji/vora_works_cell/actions/runs/40295386388). The private `desktop-v1.0.0` release remains a draft build archive. Public installers and the stable update feed are served by STATIC.

The three local files and private GitHub asset digests match the catalog sizes and SHA-256 hashes. STATIC's production publisher separately downloaded and verified all three actual assets with the deployment credential. Local release-integrity tests passed 5/5; download pages passed 96 language/theme/viewport combinations plus system theme, saved preferences, no-JavaScript content, OS links, SHA details, SEO and OG checks. No production functionality tests were run.
