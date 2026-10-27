import {products} from './content.js';
export function validArtifact(artifact, product, version, siteUrl) {
  try {
    if(!products[product] || !/^\d+\.\d+\.\d+$/.test(version)) return false;
    const platform = {macos:'mac',windows:'win',linux:'linux'}[artifact.platform];
    const formats = artifact.platform === 'macos' ? ['dmg','zip'] : artifact.platform === 'linux' ? ['AppImage'] : artifact.platform === 'windows' ? (product !== 'hwp' ? ['exe','msi','zip'] : ['exe','zip']) : [];
    if(!formats.includes(artifact.format) || artifact.arch !== (artifact.platform === 'macos' ? 'arm64' : 'x64')) return false;
    const slideWindowsBundle = product === 'slide' && artifact.platform === 'windows' && artifact.format === 'zip';
    // Only SLIDE's verified external-CAB wrapper has this contract. A bare MSI
    // remains a self-contained legacy installer and keeps the smaller limit.
    if (slideWindowsBundle ? artifact.bundleKind !== 'windows-msi-cab-v1' : Object.hasOwn(artifact, 'bundleKind')) return false;
    const largeSlidePackage = product === 'slide' && (slideWindowsBundle
      || (artifact.platform === 'macos' && artifact.format === 'dmg')
      || (artifact.platform === 'linux' && artifact.format === 'AppImage'));
    const maxSize = (largeSlidePackage ? 4 : 2) * 1024**3;
    const url = new URL(artifact.url), site = new URL(siteUrl);
    const name = `VORA-${products[product].name}-${version}-${platform}-${artifact.arch}.${artifact.format}`;
    return site.protocol === 'https:' && url.protocol === 'https:' && url.origin === site.origin && !url.username && !url.password && !url.search && !url.hash
      && url.pathname === `/releases/${product}/${version}/${name}` && Number.isSafeInteger(artifact.size) && artifact.size > 0 && artifact.size <= maxSize && /^[a-f0-9]{64}$/.test(artifact.sha256);
  } catch {return false;}
}
export function validArtifacts(manifest, siteUrl, product = 'hwp') {
  if(manifest?.schemaVersion !== 1 || manifest.product !== product || !Array.isArray(manifest.artifacts))return [];
  const current = manifest.artifacts.filter(artifact=>validArtifact(artifact, product, manifest.version, siteUrl));
  // Older verified downloads are presentation-only. Native updaters continue
  // to read only artifacts belonging to the single current manifest version.
  const platforms = new Set(current.map(artifact => artifact.platform));
  const urls = new Set(current.map(artifact => artifact.url));
  for (const group of Array.isArray(manifest.downloadFallbacks) ? manifest.downloadFallbacks : []) {
    if (!Array.isArray(group?.artifacts)) continue;
    const addedPlatforms = new Set();
    for (const artifact of group.artifacts) {
      if (validArtifact(artifact, product, group.version, siteUrl) && !platforms.has(artifact.platform) && !urls.has(artifact.url)) {
        current.push({...artifact, version:group.version});
        urls.add(artifact.url);
        addedPlatforms.add(artifact.platform);
      }
    }
    for (const platform of addedPlatforms) platforms.add(platform);
  }
  return current;
}

// The updater still receives the original installer in the manifest; user downloads prefer ZIP on Windows.
export function preferredArtifact(artifacts, platform) {
  const formats = {windows:['zip','msi','exe'],macos:['dmg','zip'],linux:['AppImage']}[platform] || [];
  for (const format of formats) {
    const artifact = artifacts.find(item => item.platform === platform && item.format === format);
    if (artifact) return artifact;
  }
  return undefined;
}

// The same withdrawal rules apply to publishing, development and local page QA.
export function currentManifest(catalog, product) {
  if (!products[product] || catalog?.schemaVersion !== 1 || !Array.isArray(catalog.releases)) throw new Error('Invalid desktop release catalog');
  const withdrawn = catalog.withdrawnPlatforms ?? [];
  if (!Array.isArray(withdrawn) || withdrawn.length > 3 || new Set(withdrawn).size !== withdrawn.length
    || withdrawn.some(platform => !['macos','windows','linux'].includes(platform))) throw new Error('Invalid withdrawn platforms');
  const stable = catalog.releases.find(release => release.manifest.version === catalog.stableVersion);
  if (!stable && catalog.releases.length) throw new Error('Missing stable release');
  const artifacts = stable?.manifest.artifacts.filter(artifact => !withdrawn.includes(artifact.platform)) ?? [];
  const fallbacks = catalog.downloadFallbacks ?? {};
  if (!fallbacks || typeof fallbacks !== 'object' || Array.isArray(fallbacks)) throw new Error('Invalid download fallbacks');
  const downloadFallbacks = [];
  for (const [platform, version] of Object.entries(fallbacks)) {
    if (!['macos','windows','linux'].includes(platform) || !/^\d+\.\d+\.\d+$/.test(version)) throw new Error('Invalid download fallback');
    const previous = catalog.releases.find(release => release.manifest.version === version);
    if (!previous || !stable || version === stable.manifest.version) throw new Error('Missing previous download release');
    if (withdrawn.includes(platform) || artifacts.some(artifact => artifact.platform === platform)) continue;
    const retained = previous.manifest.artifacts.filter(artifact => artifact.platform === platform);
    if (!retained.length) throw new Error('Missing previous platform download');
    downloadFallbacks.push({version, artifacts:retained});
  }
  return artifacts.length ? {...stable.manifest, artifacts, ...(downloadFallbacks.length ? {downloadFallbacks} : {})}
    : {schemaVersion:1,product,version:stable?.manifest.version ?? products[product].version,status:'pending',artifacts:[]};
}
