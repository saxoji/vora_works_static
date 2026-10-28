import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { publishDesktopReleases, publishProductReleases } from '../scripts/desktop-releases.mjs';
import { catalogIdentity, writeStorageIdentity, releaseStorageConfig, awaitReleaseStorage } from '../scripts/release-storage.mjs';

const siteUrl = 'https://works.vora.im';
const products = ['word', 'slide', 'cell', 'hwp'];
const bytes = Buffer.from('unchanged verified app');
const origins = Object.fromEntries(products.map(product => [product, `https://vora-works-downloads-${product}.onrender.com`]));
async function workspace(run) {
  const root = pathToFileURL((await mkdtemp(join(tmpdir(), 'vora-storage-'))) + '/');
  const dist = new URL('dist/', root);
  await mkdir(dist);
  const releases = {};
  try {
    for (const product of products) {
      const name = `VORA-${product.toUpperCase()}-1.0.0-mac-arm64.dmg`;
      const manifest = { schemaVersion: 1, product, version: '1.0.0', artifacts: [{ platform: 'macos', arch: 'arm64', format: 'dmg',
        url: `${siteUrl}/releases/${product}/1.0.0/${name}`, size: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') }] };
      releases[product] = { manifest, assets: { [name]: `https://api.github.com/repos/saxoji/vora_works_${product}/releases/assets/123` } };
      await mkdir(new URL(`releases/${product}/`, root), { recursive: true });
      await writeFile(new URL(`releases/${product}/catalog.json`, root), JSON.stringify({ schemaVersion: 1, stableVersion: '1.0.0', releases: [releases[product]] }));
    }
    await run({ root, dist, releases });
  } finally { await rm(root, { recursive: true, force: true }); }
}

test('metadata-only site preserves all update feeds and immutable URLs without fetching installers', () => workspace(async ({ root, dist, releases }) => {
  await publishDesktopReleases({ root, dist, siteUrl, downloadArtifacts: false, fetcher: () => { throw Error('unexpected installer download'); } });
  for (const product of products) {
    assert.deepEqual(JSON.parse(await readFile(new URL(`releases/${product}/stable.json`, dist))), releases[product].manifest);
    assert.deepEqual(JSON.parse(await readFile(new URL(`releases/${product}/1.0.0/manifest.json`, dist))), releases[product].manifest);
    await assert.rejects(stat(new URL(`releases/${product}/1.0.0/${Object.keys(releases[product].assets)[0]}`, dist)), { code: 'ENOENT' });
  }
}));

test('metadata-only still rejects untrusted private sources', () => workspace(async ({ root, dist, releases }) => {
  releases.cell.assets[Object.keys(releases.cell.assets)[0]] = 'https://evil.test/file';
  await writeFile(new URL('releases/cell/catalog.json', root), JSON.stringify({ schemaVersion: 1, stableVersion: '1.0.0', releases: [releases.cell] }));
  await assert.rejects(publishProductReleases({ root, dist, siteUrl, product: 'cell', downloadArtifacts: false }), /Untrusted build archive/);
}));

test('storage publishes exactly one product and exposes its catalog identity only after verified bytes', () => workspace(async ({ root, dist, releases }) => {
  const fetched = [];
  await publishProductReleases({ root, dist, siteUrl, product: 'slide', fetcher: async url => { fetched.push(String(url)); return new Response(bytes); } });
  await writeStorageIdentity(root, dist, 'slide');
  assert.equal(fetched.length, 1);
  assert.match(fetched[0], /vora_works_slide/);
  assert.deepEqual(await readFile(new URL(`releases/slide/1.0.0/${Object.keys(releases.slide.assets)[0]}`, dist)), bytes);
  const identity = await catalogIdentity(root, 'slide');
  assert.deepEqual(JSON.parse(await readFile(new URL(`releases/slide/catalogs/${identity.sha256}.json`, dist))), identity);
  for (const product of ['word', 'cell', 'hwp']) await assert.rejects(stat(new URL(`releases/${product}/`, dist)), { code: 'ENOENT' });
}));

test('site waits only for mismatched storage and never downloads any binary', () => workspace(async ({ root }) => {
  const calls = [], waits = [];
  await awaitReleaseStorage({ root, origins, pollMs: 0, onWait: value => waits.push(value), fetcher: async url => {
    calls.push(url);
    const product = products.find(product => url.includes(`/${product}/`));
    return new Response(JSON.stringify(product === 'slide' && calls.filter(url => url.includes('/slide/')).length === 1
      ? { product, sha256: 'outdated' } : await catalogIdentity(root, product)));
  } });
  assert.equal(calls.length, 5);
  assert(calls.every(url => /\/catalogs\/[a-f0-9]{64}\.json$/.test(url)));
  assert.deepEqual(waits, ['Waiting for verified desktop storage: slide']);
}));

test('unavailable or mismatched storage prevents catalog publication', () => workspace(async ({ root }) => {
  await assert.rejects(awaitReleaseStorage({ root, origins, timeoutMs: 0, fetcher: async () => new Response('{}') }), /Desktop storage is not ready/);
}));

test('CDN base prefix is retained for immutable release markers', () => workspace(async ({ root }) => {
  const bases = releaseStorageConfig({ DESKTOP_RELEASE_ARTIFACTS: 'metadata-only',
    DESKTOP_RELEASE_ORIGINS_JSON: JSON.stringify(Object.fromEntries(products.map(product => [product, 'https://cdn.vora.im/vora-works/']))) });
  const calls = [];
  await awaitReleaseStorage({ root, origins: bases, fetcher: async url => {
    calls.push(url);
    assert.match(url, /^https:\/\/cdn\.vora\.im\/vora-works\/releases\/(word|slide|cell|hwp)\/catalogs\/[a-f0-9]{64}\.json$/);
    const product = products.find(product => url.includes(`/releases/${product}/`));
    return new Response(JSON.stringify(await catalogIdentity(root, product)));
  } });
  assert.equal(calls.length, 4);
}));

test('storage mode is explicit and every product requires a valid HTTPS origin', () => {
  assert.equal(releaseStorageConfig({}), null);
  assert.throws(() => releaseStorageConfig({ DESKTOP_RELEASE_ARTIFACTS: 'typo' }));
  assert.throws(() => releaseStorageConfig({ DESKTOP_RELEASE_ARTIFACTS: 'metadata-only' }));
  assert.throws(() => releaseStorageConfig({ DESKTOP_RELEASE_ARTIFACTS: 'metadata-only', DESKTOP_RELEASE_ORIGINS_JSON: JSON.stringify({ ...origins, cell: 'http://example.com' }) }));
  assert.deepEqual(releaseStorageConfig({ DESKTOP_RELEASE_ARTIFACTS: 'metadata-only', DESKTOP_RELEASE_ORIGINS_JSON: JSON.stringify(origins) }), origins);
});
