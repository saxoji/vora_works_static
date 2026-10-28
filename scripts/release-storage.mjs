import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { products } from '../public/downloads/shared/content.js';

export async function catalogIdentity(root, product) {
  if (!Object.hasOwn(products, product)) throw new Error('Unknown desktop product');
  const bytes = await readFile(new URL(`releases/${product}/catalog.json`, root));
  return { product, sha256: createHash('sha256').update(bytes).digest('hex') };
}

export async function writeStorageIdentity(root, dist, product) {
  const identity = await catalogIdentity(root, product);
  const folder = new URL(`releases/${product}/catalogs/`, dist);
  await mkdir(folder, { recursive: true });
  await writeFile(new URL(`${identity.sha256}.json`, folder), JSON.stringify(identity) + '\n');
}

export function releaseStorageConfig(env = process.env) {
  const mode = env.DESKTOP_RELEASE_ARTIFACTS ?? 'bundle';
  if (!['bundle', 'metadata-only'].includes(mode)) throw new Error('Invalid DESKTOP_RELEASE_ARTIFACTS');
  if (mode === 'bundle') return null;
  const origins = JSON.parse(env.DESKTOP_RELEASE_ORIGINS_JSON ?? '{}');
  for (const product of Object.keys(products)) {
    const url = new URL(origins[product]);
    if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash)
      throw new Error('Invalid desktop storage origin');
    origins[product] = url.origin;
  }
  return origins;
}

// Do not advertise a catalog until its complete, verified immutable files are
// live. Normal website-only builds make four tiny requests and never download
// installers; overlapping release deploys wait for their matching storage build.
export async function awaitReleaseStorage({ root, origins, fetcher = fetch, timeoutMs = 20 * 60_000, pollMs = 15_000, onWait = console.log }) {
  const pending = new Map(await Promise.all(Object.keys(products).map(async product =>
    [product, await catalogIdentity(root, product)])));
  const deadline = Date.now() + timeoutMs;
  let lastPending = '';
  while (pending.size) {
    await Promise.all([...pending].map(async ([product, expected]) => {
      try {
        const url = `${origins[product]}/releases/${product}/catalogs/${expected.sha256}.json`;
        const response = await fetcher(url, { cache: 'no-store', signal: AbortSignal.timeout(10_000) });
        if (!response.ok) return;
        const actual = await response.json();
        if (actual.product === expected.product && actual.sha256 === expected.sha256) pending.delete(product);
      } catch { /* A storage deployment can still be publishing. */ }
    }));
    if (!pending.size) return;
    if (Date.now() >= deadline) throw new Error(`Desktop storage is not ready: ${[...pending.keys()].join(', ')}`);
    const nextPending = [...pending.keys()].join(', ');
    if (nextPending !== lastPending) onWait(`Waiting for verified desktop storage: ${nextPending}`);
    lastPending = nextPending;
    await new Promise(resolve => setTimeout(resolve, Math.min(pollMs, Math.max(0, deadline - Date.now()))));
  }
}
