import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import { copyFor, products, languages } from '../public/downloads/shared/content.js';
import { renderBody, validArtifacts } from '../public/downloads/shared/view.js';

const siteUrl = 'https://works.vora.im';
const source = (await readFile(new URL('../public/downloads/shared/page.js', import.meta.url), 'utf8')).replace(/^import[^\n]*\n/gm, '');
const config = {
  siteUrl, voraUrl: 'https://www.vora.im', voraSignupUrl: 'https://www.vora.im/auth/sign-in', companyUrl: 'https://www.horizonai.ai',
  products: Object.fromEntries(Object.keys(products).map(product => [product, {
    web: `https://v${product}.vora.im`, releaseManifestURL: `${siteUrl}/releases/${product}/stable.json`,
  }])),
};
function ready(product, version = '1.0.0') {
  return { schemaVersion: 1, product, version, artifacts: ['macos', 'windows', 'linux'].map(platform => {
    const arch = platform === 'macos' ? 'arm64' : 'x64';
    const format = { macos: 'dmg', windows: 'exe', linux: 'AppImage' }[platform];
    return { platform, arch, format, size: 4096, sha256: 'a'.repeat(64),
      url: `${siteUrl}/releases/${product}/${version}/VORA-${products[product].name}-${version}-${{ macos: 'mac', windows: 'win', linux: 'linux' }[platform]}-${arch}.${format}` };
  }) };
}
const pending = product => ({ schemaVersion: 1, product, version: '1.0.0', status: 'pending', artifacts: [] });

// Execute the actual page controller and renderer with only browser I/O replaced.
// No browser, real network, generated site files or deployment state is touched.
async function refresh(initial, response, lang = 'en') {
  const renders = [], requests = [];
  const app = { set innerHTML(html) { renders.push(html); } };
  const document = {
    documentElement: { dataset: {} }, title: '', addEventListener() {},
    getElementById: id => id === 'app' ? app : id === 'release-data' ? { textContent: JSON.stringify(initial) } : null,
  };
  await runInNewContext(`(async () => { ${source}\n })()`, {
    config, products, languages, copyFor, renderBody, validArtifacts, document, URL,
    location: { pathname: `/downloads/${initial.product}/${lang}/`, href: `${siteUrl}/downloads/${initial.product}/${lang}/` },
    navigator: { languages: [lang] }, LANGUAGE_KEY: 'language', THEME_KEY: 'theme',
    resolveLanguage: preferred => preferred, readPreference: (_, fallback) => fallback, savePreference() {},
    fetch: async (url, options) => { requests.push({ url, options }); return response(); },
  }, { timeout: 2_000 });
  assert.equal(requests.length, 1);
  assert.equal(requests[0].url, config.products[initial.product].releaseManifestURL);
  assert.equal(requests[0].options.cache, 'no-store');
  return renders;
}
const ok = value => () => ({ ok: true, json: async () => value });
const downloads = html => (html.match(/class="button primary download-button"/g) || []).length;

test('a valid pending feed removes old ready downloads and release labels for each product and language', async () => {
  for (const product of Object.keys(products)) {
    for (const lang of languages) {
      const renders = await refresh(ready(product), ok(pending(product)), lang);
      assert.equal(renders.length, 2, `${product}/${lang}`);
      assert.equal(downloads(renders[0]), 3);
      assert.equal(downloads(renders[1]), 0);
      assert.ok(renders[1].includes(`${copyFor(lang, product).pendingRelease} <strong>`));
      assert.ok(!renders[1].includes(`${copyFor(lang, product).release} <strong>`));
      assert.ok(!renders[1].includes('class="verification"'));
    }
  }
});

test('ready feed updates remain available and an unchanged pending feed is not rerendered', async () => {
  const updated = await refresh(ready('cell'), ok(ready('cell', '1.0.1')));
  assert.equal(updated.length, 2);
  assert.equal(downloads(updated[1]), 3);
  assert.ok(updated[1].includes('/releases/cell/1.0.1/'));
  assert.ok(!updated[1].includes('/releases/cell/1.0.0/'));
  const unchanged = await refresh(pending('cell'), ok(pending('cell')));
  assert.equal(unchanged.length, 1);
  assert.equal(downloads(unchanged[0]), 0);
});

test('malformed, wrong-product or contradictory pending feeds preserve the ready page', async () => {
  const base = pending('cell');
  const invalid = [null, {},
    { ...base, schemaVersion: 2 }, { ...base, product: 'word' }, { ...base, version: 'invalid' },
    { ...base, version: '1.0.0\n' }, { ...base, version: null }, { ...base, status: undefined },
    { ...base, status: 'unknown' }, { ...base, artifacts: undefined }, { ...base, artifacts: {} },
    { ...base, artifacts: ready('cell').artifacts },
    { ...ready('cell'), artifacts: [{ ...ready('cell').artifacts[0], url: 'https://untrusted.example.test/installer.exe' }] },
  ];
  for (const feed of invalid) {
    const renders = await refresh(ready('cell'), ok(feed));
    assert.equal(renders.length, 1, JSON.stringify(feed));
    assert.equal(downloads(renders[0]), 3);
  }
});

test('network, HTTP and JSON failures retain the build-time download page', async () => {
  for (const response of [
    () => { throw Error('offline'); },
    () => ({ ok: false, json: async () => pending('cell') }),
    () => ({ ok: true, json: async () => { throw Error('invalid JSON'); } }),
  ]) {
    const renders = await refresh(ready('cell'), response);
    assert.equal(renders.length, 1);
    assert.equal(downloads(renders[0]), 3);
  }
});
