import { mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { basename } from 'node:path';
import { createWriteStream } from 'node:fs';
import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';

import { products } from '../public/downloads/shared/content.js';
import { validArtifact } from '../public/downloads/shared/releases.js';

export async function publishProductReleases({ root, dist, siteUrl, product, fetcher = fetch }) {
  if (!products[product]) throw new Error('Unknown desktop product');
  let catalog;
  try { catalog = JSON.parse(await readFile(new URL(`releases/${product}/catalog.json`, root))); }
  catch (error) { if (error.code === 'ENOENT') catalog = {schemaVersion:1,stableVersion:null,releases:[]}; else throw error; }
  if (catalog.schemaVersion !== 1 || !Array.isArray(catalog.releases)) throw new Error('Invalid desktop release catalog');
  const site = new URL(siteUrl);
  if (site.protocol !== 'https:') throw new Error('HTTPS PUBLIC_SITE_URL required');
  for (const release of catalog.releases) {
    const manifest = release.manifest;
    if (manifest.product !== product || manifest.schemaVersion !== 1 || !/^\d+\.\d+\.\d+$/.test(manifest.version) || !manifest.artifacts.length) throw new Error('Invalid release manifest');
    const folder = new URL(`releases/${product}/${manifest.version}/`, dist);
    await mkdir(folder, { recursive: true });
    const used = new Set();
    for (const artifact of manifest.artifacts) {
      const url = new URL(artifact.url);
      const name = basename(url.pathname);
      if (!validArtifact(artifact, product, manifest.version, siteUrl) || used.has(name)) throw new Error('Invalid release artifact');
      used.add(name);
      const source = new URL(release.assets[name]);
      if (source.protocol !== 'https:' || source.hostname !== 'api.github.com' || !new RegExp(`^/repos/saxoji/vora_works_${product}/releases/assets/[0-9]+$`).test(source.pathname)
        || source.username || source.password || source.search || source.hash) throw new Error('Untrusted build archive');
      const headers = { Accept: 'application/octet-stream', 'X-GitHub-Api-Version': '2022-11-28' };
      if (process.env.DESKTOP_RELEASE_GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.DESKTOP_RELEASE_GITHUB_TOKEN}`;
      const response = await fetcher(source, { headers, signal: AbortSignal.timeout(15 * 60 * 1000) });
      if (!response.ok || !response.body) throw new Error(`Cannot retrieve desktop installer (${response.status})`);
      const hash = createHash('sha256'); let size = 0;
      const verifier = new Transform({ transform(chunk, _encoding, done) {
        size += chunk.length; if (size > artifact.size) { done(new Error('Artifact exceeds expected size')); return; }
        hash.update(chunk); done(null, chunk);
      } });
      const target = new URL(name, folder);
      try {
        await pipeline(Readable.fromWeb(response.body), verifier, createWriteStream(target, { flags: 'wx' }));
        if (size !== artifact.size || hash.digest('hex') !== artifact.sha256) throw new Error('Artifact checksum mismatch');
      } catch (error) { await rm(target, { force: true }); throw error; }
    }
    await writeFile(new URL('manifest.json', folder), JSON.stringify(manifest, null, 2) + '\n');
  }
  const stable = catalog.releases.find(release => release.manifest.version === catalog.stableVersion);
  if (!stable && catalog.releases.length) throw new Error('Missing stable release');
  await mkdir(new URL(`releases/${product}/`, dist), {recursive:true});
  await writeFile(new URL(`releases/${product}/stable.json`, dist), JSON.stringify(stable?.manifest || {schemaVersion:1,product,version:products[product].version,status:'pending',artifacts:[]}, null, 2) + '\n');
}

export async function publishDesktopReleases(options) {
  for (const product of Object.keys(products)) await publishProductReleases({...options,product});
}
