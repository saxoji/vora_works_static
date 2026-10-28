import { mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { basename } from 'node:path';
import { createWriteStream } from 'node:fs';
import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';

import { products } from '../public/downloads/shared/content.js';
import { validArtifact, currentManifest } from '../public/downloads/shared/releases.js';

function verifiedSources(source, artifact, product) {
  if (source && typeof source === 'object' && Object.hasOwn(source, 'actionsArtifact')) {
    const archive = source.actionsArtifact;
    if (product !== 'slide' || artifact.platform !== 'windows' || artifact.format !== 'zip'
      || artifact.bundleKind !== 'windows-msi-cab-v1' || Object.keys(source).length !== 1
      || !archive || typeof archive !== 'object' || Array.isArray(archive)
      || Object.keys(archive).sort().join(',') !== 'member,sha256,size,url'
      || typeof archive.url !== 'string' || typeof archive.member !== 'string'
      || !Number.isSafeInteger(archive.size) || archive.size <= 0 || archive.size > 16 * 1024**3
      || !/^[a-f0-9]{64}$/.test(archive.sha256)
      || archive.member.length > 512 || !/\.zip$/i.test(archive.member)
      || /[\u0000-\u001f\u007f\\:]/.test(archive.member)
      || archive.member.split('/').some(part => !part || part === '.' || part === '..'))
      throw new Error('Invalid Actions archive source');
    const url = new URL(archive.url);
    if (url.protocol !== 'https:' || url.hostname !== 'api.github.com'
      || !/^\/repos\/saxoji\/vora_works_slide\/actions\/artifacts\/[1-9][0-9]*\/zip$/.test(url.pathname)
      || url.username || url.password || url.search || url.hash || url.port)
      throw new Error('Untrusted Actions archive source');
    // This is provenance for a verified inner file, not a direct installer URL.
    // The S3 uploader requires a local-map file matching the manifest's hash.
    return null;
  }
  let parts;
  if (typeof source === 'string') {
    if (artifact.size >= 2 * 1024**3) throw new Error('Large GitHub release assets require verified SLIDE source parts');
    parts = [{url: source, size: artifact.size, sha256: artifact.sha256}];
  } else {
    const supported = product === 'slide' && (artifact.format === 'dmg' || artifact.format === 'AppImage'
      || (artifact.platform === 'macos' && artifact.format === 'zip')
      || (artifact.platform === 'windows' && artifact.format === 'zip' && artifact.bundleKind === 'windows-msi-cab-v1'));
    if (!supported || !source || Object.keys(source).length !== 1 || !Array.isArray(source.parts)
      || source.parts.length < 2 || source.parts.length > 4) throw new Error('Invalid release source parts');
    parts = source.parts;
    if (parts.some(part => !part || typeof part.url !== 'string' || !Number.isSafeInteger(part.size)
      || part.size <= 0 || part.size > 1024**3 || !/^[a-f0-9]{64}$/.test(part.sha256))
      || parts.reduce((size, part) => size + part.size, 0) !== artifact.size) throw new Error('Invalid release source parts');
  }
  const used = new Set();
  return parts.map(part => {
    const url = new URL(part.url);
    if (url.protocol !== 'https:' || url.hostname !== 'api.github.com' || !new RegExp(`^/repos/saxoji/vora_works_${product}/releases/assets/[0-9]+$`).test(url.pathname)
      || url.username || url.password || url.search || url.hash || url.port || used.has(url.href)) throw new Error('Untrusted build archive');
    used.add(url.href);
    return {...part, url};
  });
}

export async function publishProductReleases({ root, dist, siteUrl, product, fetcher = fetch, downloadArtifacts = true }) {
  if (!products[product]) throw new Error('Unknown desktop product');
  let catalog;
  try { catalog = JSON.parse(await readFile(new URL(`releases/${product}/catalog.json`, root))); }
  catch (error) { if (error.code === 'ENOENT') catalog = {schemaVersion:1,stableVersion:null,releases:[]}; else throw error; }
  if (catalog.schemaVersion !== 1 || !Array.isArray(catalog.releases)) throw new Error('Invalid desktop release catalog');
  const withdrawn = catalog.withdrawnPlatforms ?? [];
  if (!Array.isArray(withdrawn) || withdrawn.length > 3 || new Set(withdrawn).size !== withdrawn.length
    || withdrawn.some(platform => !['macos', 'windows', 'linux'].includes(platform))) throw new Error('Invalid withdrawn platforms');
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
      const parts = verifiedSources(release.assets[name], artifact, product);
      // The public site retains manifests and URLs; product storage builds keep
      // the immutable bytes. Validate both modes against the same contract.
      if (!downloadArtifacts) continue;
      if (!parts) throw new Error('Actions archive members require the verified local-map S3 publisher');
      const headers = { Accept: 'application/octet-stream', 'X-GitHub-Api-Version': '2022-11-28' };
      if (process.env.DESKTOP_RELEASE_GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.DESKTOP_RELEASE_GITHUB_TOKEN}`;
      const hash = createHash('sha256'); let size = 0;
      const target = new URL(name, folder);
      try {
        for (const [index, part] of parts.entries()) {
          const response = await fetcher(part.url, { headers, signal: AbortSignal.timeout(15 * 60 * 1000) });
          if (!response.ok || !response.body) throw new Error(`Cannot retrieve desktop installer (${response.status})`);
          const partHash = parts.length > 1 ? createHash('sha256') : null; let partSize = 0;
          const verifier = new Transform({ transform(chunk, _encoding, done) {
            size += chunk.length; partSize += chunk.length;
            if (size > artifact.size || partSize > part.size) { done(new Error('Artifact exceeds expected size')); return; }
            hash.update(chunk); partHash?.update(chunk); done(null, chunk);
          } });
          await pipeline(Readable.fromWeb(response.body), verifier, createWriteStream(target, { flags: index === 0 ? 'wx' : 'a' }));
          if (partSize !== part.size || (partHash && partHash.digest('hex') !== part.sha256)) throw new Error('Artifact source part checksum mismatch');
        }
        if (size !== artifact.size || hash.digest('hex') !== artifact.sha256) throw new Error('Artifact checksum mismatch');
      } catch (error) { await rm(target, { force: true }); throw error; }
    }
    await writeFile(new URL('manifest.json', folder), JSON.stringify(manifest, null, 2) + '\n');
  }
  // Keep immutable versioned files available to existing users while withdrawing
  // incomplete platforms from current download pages and automatic update discovery.
  const current = currentManifest(catalog, product);
  await mkdir(new URL(`releases/${product}/`, dist), {recursive:true});
  await writeFile(new URL(`releases/${product}/stable.json`, dist), JSON.stringify(current, null, 2) + '\n');
}

export async function publishDesktopReleases(options) {
  for (const product of Object.keys(products)) await publishProductReleases({...options,product});
}
