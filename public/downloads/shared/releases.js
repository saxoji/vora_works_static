import {products} from './content.js';
export function validArtifact(artifact, product, version, siteUrl) {
  try {
    if(!products[product] || !/^\d+\.\d+\.\d+$/.test(version)) return false;
    const platform = {macos:'mac',windows:'win',linux:'linux'}[artifact.platform];
    const formats = artifact.platform === 'macos' ? ['dmg','zip'] : artifact.platform === 'linux' ? ['AppImage'] : artifact.platform === 'windows' ? (product !== 'hwp' ? ['exe','msi','zip'] : ['exe','zip']) : [];
    if(!formats.includes(artifact.format) || artifact.arch !== (artifact.platform === 'macos' ? 'arm64' : 'x64')) return false;
    const url = new URL(artifact.url), site = new URL(siteUrl);
    const name = `VORA-${products[product].name}-${version}-${platform}-${artifact.arch}.${artifact.format}`;
    return site.protocol === 'https:' && url.protocol === 'https:' && url.origin === site.origin && !url.username && !url.password && !url.search && !url.hash
      && url.pathname === `/releases/${product}/${version}/${name}` && Number.isSafeInteger(artifact.size) && artifact.size > 0 && artifact.size <= 2*1024**3 && /^[a-f0-9]{64}$/.test(artifact.sha256);
  } catch {return false;}
}
export function validArtifacts(manifest, siteUrl, product = 'hwp') {
  if(manifest?.schemaVersion !== 1 || manifest.product !== product || !Array.isArray(manifest.artifacts))return [];
  return manifest.artifacts.filter(artifact=>validArtifact(artifact, product, manifest.version, siteUrl));
}
