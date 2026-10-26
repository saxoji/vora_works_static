import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createView } from '../src/view.js';

const root = new URL('../', import.meta.url);
const linksFor = product => Object.fromEntries(['macos', 'windows', 'linux'].map(os => [os, `https://works.vora.im/downloads/${product}/?os=${os}`]));
const cellLinks = linksFor('cell');
const desktopLinks = { cell: cellLinks, hwp: linksFor('hwp') };
const keyFor = (os, product = 'cell') => `PUBLIC_${product.toUpperCase()}_${os.toUpperCase()}_DOWNLOAD_URL`;

// Copy only the public generator/defaults. Never read local deployment secrets,
// write the checkout's generated config, or inherit tokens into the child process.
async function generate({ local = '', env = {} } = {}) {
  const directory = await mkdtemp(join(tmpdir(), 'vora-public-config-'));
  try {
    await mkdir(join(directory, 'scripts'));
    await writeFile(join(directory, 'scripts/config.mjs'), await readFile(new URL('scripts/config.mjs', root)));
    await writeFile(join(directory, '.env.defaults'), await readFile(new URL('.env.defaults', root)));
    await writeFile(join(directory, '.env.local'), local);
    const module = pathToFileURL(join(directory, 'scripts/config.mjs')).href;
    const result = spawnSync(process.execPath, ['--input-type=module', '--eval', `import { generateConfig } from ${JSON.stringify(module)}; await generateConfig();`], {
      cwd: directory, env: { DESKTOP_RELEASE_GITHUB_TOKEN: 'synthetic-token-must-stay-private', ...env }, encoding: 'utf8', timeout: 10_000,
    });
    let source = '';
    try { source = await readFile(join(directory, 'public/config.js'), 'utf8'); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
    const config = source ? JSON.parse(source.slice(source.indexOf('{'), source.lastIndexOf('}') + 1)) : null;
    return { ...result, source, config };
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

test('CELL and HWP desktop defaults connect all three OS links without exposing private build credentials', async () => {
  const result = await generate();
  assert.equal(result.status, 0, result.stderr);
  for (const [product, links] of Object.entries(desktopLinks)) {
    assert.deepEqual(result.config.products[product].downloads, links);
    assert.equal(result.config.products[product].downloadPageURL, `https://works.vora.im/downloads/${product}/`);
    assert.equal(result.config.products[product].releaseManifestURL, `https://works.vora.im/releases/${product}/stable.json`);
    for (const lang of ['ko', 'en', 'ja']) {
      const dialog = createView({ lang, config: result.config }).downloadDialog(product, 'macOS');
      for (const url of Object.values(links)) assert.ok(dialog.includes(`href="${url}"`), `${lang}: ${url}`);
    }
  }
  for (const product of ['word', 'slide']) {
    assert.deepEqual(result.config.products[product].downloads, { macos: '', windows: '', linux: '' });
  }
  assert.doesNotMatch(result.source, /synthetic-token-must-stay-private|DESKTOP_RELEASE_GITHUB_TOKEN/);
});

test('CELL and HWP samples and Render blueprint keep the same configurable download destinations', async () => {
  const example = await readFile(new URL('.env.example', root), 'utf8');
  const blueprint = await readFile(new URL('render.yaml', root), 'utf8');
  for (const [product, links] of Object.entries(desktopLinks)) {
    for (const [os, url] of Object.entries(links)) {
      const key = keyFor(os, product);
      assert.ok(example.split(/\r?\n/).includes(`${key}=${url}`), key);
      const configured = blueprint.match(new RegExp(`- key: ${key}\\s*\\n\\s*value: ([^\\r\\n]+)`));
      assert.equal(configured?.[1], url, key);
    }
  }
});

test('process settings override local settings and an explicit empty URL hides only that OS link', async () => {
  const local = Object.keys(cellLinks).map(os => `${keyFor(os)}=https://local.example.test/cell/${os}`).join('\n');
  const result = await generate({ local, env: {
    PUBLIC_CELL_MACOS_DOWNLOAD_URL: 'https://custom.example.test/cell/mac',
    PUBLIC_CELL_WINDOWS_DOWNLOAD_URL: '',
  } });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(result.config.products.cell.downloads, {
    macos: 'https://custom.example.test/cell/mac', windows: '', linux: 'https://local.example.test/cell/linux',
  });
  const dialog = createView({ lang: 'en', config: result.config }).downloadDialog('cell', 'Windows');
  assert.ok(dialog.includes('href="https://custom.example.test/cell/mac"'));
  assert.ok(dialog.includes('href="https://local.example.test/cell/linux"'));
  assert.ok(!dialog.includes(cellLinks.windows));
  assert.match(dialog, /<span>Windows<\/span><small>/);
});

test('invalid or credential-bearing public installer URLs fail before writing browser configuration', async () => {
  for (const url of ['http://example.test/installer', 'javascript:alert(1)', 'https://name:secret@example.test/installer']) {
    const result = await generate({ env: { PUBLIC_CELL_MACOS_DOWNLOAD_URL: url } });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /PUBLIC_CELL_MACOS_DOWNLOAD_URL/);
    assert.equal(result.source, '');
  }
});
