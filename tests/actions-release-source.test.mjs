import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { publishProductReleases } from '../scripts/desktop-releases.mjs';

const siteUrl = 'https://works.vora.im';
async function scenario(patch, run) {
  const root = pathToFileURL((await mkdtemp(join(tmpdir(), 'vora-actions-source-'))) + '/');
  const dist = new URL('dist/', root);
  const name = 'VORA-SLIDE-1.0.2-win-x64.zip';
  const source = { actionsArtifact: { url: 'https://api.github.com/repos/saxoji/vora_works_slide/actions/artifacts/123/zip',
    member: 'verified/windows/original-package.zip', size: 314159, sha256: 'a'.repeat(64) } };
  const manifest = { schemaVersion: 1, product: 'slide', version: '1.0.2', artifacts: [{
    platform: 'windows', arch: 'x64', format: 'zip', bundleKind: 'windows-msi-cab-v1',
    url: `${siteUrl}/releases/slide/1.0.2/${name}`, size: 271828, sha256: 'b'.repeat(64) }] };
  try {
    patch?.(source, manifest);
    await mkdir(new URL('releases/slide/', root), { recursive: true });
    await writeFile(new URL('releases/slide/catalog.json', root), JSON.stringify({ schemaVersion: 1, stableVersion: '1.0.2', releases: [{ manifest, assets: { [name]: source } }] }));
    await run({ root, dist, manifest, publish: options => publishProductReleases({ root, dist, product: 'slide', siteUrl,
      fetcher: () => { throw Error('must not fetch an archive as an installer'); }, ...options }) });
  } finally { await rm(root, { recursive: true, force: true }); }
}

test('metadata-only accepts pinned Actions provenance while preserving the inner file contract', () => scenario(null, async ({ dist, manifest, publish }) => {
  await publish({ downloadArtifacts: false });
  assert.deepEqual(JSON.parse(await readFile(new URL('releases/slide/stable.json', dist))), manifest);
  assert.equal(manifest.artifacts[0].sha256, 'b'.repeat(64));
  assert.equal(manifest.artifacts[0].size, 271828);
}));

test('bundle mode never downloads the outer Actions ZIP as an installer', () => scenario(null, async ({ publish }) => {
  await assert.rejects(publish({}), /verified local-map S3 publisher/);
}));

test('invalid Actions provenance and unsafe archive members are rejected', async () => {
  const patches = [
    s => { s.extra = true; }, s => { s.actionsArtifact.extra = true; },
    s => { s.actionsArtifact = null; }, s => { s.actionsArtifact.size = 0; },
    s => { s.actionsArtifact.size = 16 * 1024**3 + 1; }, s => { s.actionsArtifact.sha256 = 'invalid'; },
    ...['../file.zip', '/file.zip', 'C:/file.zip', 'a/../file.zip', 'a/./file.zip', 'a//file.zip', 'a\\file.zip', 'file.msi', 'a\u0000.zip']
      .map(member => s => { s.actionsArtifact.member = member; }),
    ...['http://api.github.com/repos/saxoji/vora_works_slide/actions/artifacts/123/zip',
      'https://api.github.com/repos/saxoji/vora_works_word/actions/artifacts/123/zip',
      'https://api.github.com/repos/saxoji/vora_works_slide/releases/assets/123',
      'https://api.github.com:8443/repos/saxoji/vora_works_slide/actions/artifacts/123/zip',
      'https://api.github.com/repos/saxoji/vora_works_slide/actions/artifacts/123/zip?token=x']
      .map(url => s => { s.actionsArtifact.url = url; }),
    (_s, m) => { m.artifacts[0].platform = 'macos'; },
  ];
  for (const patch of patches) await scenario(patch, async ({ publish }) => {
    await assert.rejects(publish({ downloadArtifacts: false }), /Invalid|Untrusted/);
  });
});
