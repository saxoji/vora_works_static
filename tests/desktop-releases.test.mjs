import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { publishProductReleases, publishDesktopReleases } from '../scripts/desktop-releases.mjs';
import { validArtifacts, preferredArtifact } from '../public/downloads/shared/releases.js';

const siteUrl = 'https://works.vora.im';
const data = Buffer.from('verified desktop installer fixture');
function fixture(product, platform='macos', format='dmg') {
  const arch=platform==='macos'?'arm64':'x64';
  const name=`VORA-${product.toUpperCase()}-1.0.0-${{macos:'mac',windows:'win',linux:'linux'}[platform]}-${arch}.${format}`;
  return {manifest:{schemaVersion:1,product,version:'1.0.0',artifacts:[{platform,arch,format,url:`${siteUrl}/releases/${product}/1.0.0/${name}`,size:data.length,sha256:createHash('sha256').update(data).digest('hex')}]},assets:{[name]:`https://api.github.com/repos/saxoji/vora_works_${product}/releases/assets/123`}};
}
async function workspace(run) {
  const directory=await mkdtemp(join(tmpdir(),'vora-desktop-catalog-'));
  const root=pathToFileURL(directory+'/'),dist=new URL('dist/',root);
  try {await mkdir(dist);await run({root,dist});}
  finally {await rm(directory,{recursive:true,force:true});}
}
async function catalog(root,product,release) {
  await mkdir(new URL(`releases/${product}/`,root),{recursive:true});
  await writeFile(new URL(`releases/${product}/catalog.json`,root),JSON.stringify({schemaVersion:1,stableVersion:'1.0.0',releases:[release]}));
}

test('each product publishes only its own verified installer and stable feed',async()=>{
  for(const product of ['word','slide','cell','hwp']) await workspace(async({root,dist})=>{
    const release=fixture(product);await catalog(root,product,release);
    let requests=0;
    await publishProductReleases({root,dist,product,siteUrl,fetcher:async(url)=>{requests++;assert.match(String(url),new RegExp(`/vora_works_${product}/`));return new Response(data);}});
    assert.equal(requests,1);
    const manifest=JSON.parse(await readFile(new URL(`releases/${product}/stable.json`,dist)));
    assert.deepEqual(manifest,release.manifest);
    assert.deepEqual(await readFile(new URL(`releases/${product}/1.0.0/${Object.keys(release.assets)[0]}`,dist)),data);
  });
});

test('unreleased products have a pending 1.0.0 feed without download claims',async()=>workspace(async({root,dist})=>{
  await publishDesktopReleases({root,dist,siteUrl,fetcher:async()=>{throw Error('unexpected fetch');}});
  for(const product of ['word','slide','cell','hwp']) {
    const manifest=JSON.parse(await readFile(new URL(`releases/${product}/stable.json`,dist)));
    assert.equal(manifest.version,'1.0.0');assert.equal(manifest.status,'pending');
    assert.deepEqual(validArtifacts(manifest,siteUrl,product),[]);
  }
}));

test('product, version, host and architecture mismatches never become download links',()=>{
  const original=fixture('cell').manifest;
  assert.equal(validArtifacts(original,siteUrl,'cell').length,1);
  assert.equal(validArtifacts(original,siteUrl,'word').length,0);
  const variants=[{arch:'x64'},{url:original.artifacts[0].url.replace('/cell/','/word/')},{url:original.artifacts[0].url.replace('1.0.0','1.0.1')},{url:original.artifacts[0].url.replace('works.vora.im','evil.test')},{url:original.artifacts[0].url+'?token=unexpected'},{size:0},{sha256:'0'.repeat(63)}];
  for(const patch of variants)assert.equal(validArtifacts({...original,artifacts:[{...original.artifacts[0],...patch}]},siteUrl,'cell').length,0);
  for(const product of ['word','slide','cell']) assert.equal(validArtifacts(fixture(product,'windows','msi').manifest,siteUrl,product).length,1);
  assert.equal(validArtifacts(fixture('hwp','windows','msi').manifest,siteUrl,'hwp').length,0);
});

test('cross-product archives and tampered bytes fail before publishing a stable feed',async()=>{
  for(const tampered of [false,true])await workspace(async({root,dist})=>{
    const release=fixture('word');
    if(!tampered)release.assets[Object.keys(release.assets)[0]]='https://api.github.com/repos/saxoji/vora_works_cell/releases/assets/123';
    await catalog(root,'word',release);
    await assert.rejects(publishProductReleases({root,dist,product:'word',siteUrl,fetcher:async()=>new Response(Buffer.alloc(data.length))}),tampered?/checksum/:/Untrusted/);
    await assert.rejects(stat(new URL('releases/word/stable.json',dist)));
  });
});

test('Windows user downloads and SEO prefer ZIP while the installer remains in the update feed', async()=>{
  const {renderDesktopPage}=await import('../scripts/desktop-pages.mjs');
  for(const product of ['word','slide','cell','hwp']) {
    const installer=fixture(product,'windows',product==='hwp'?'exe':'msi').manifest.artifacts[0];
    const zip=fixture(product,'windows','zip').manifest.artifacts[0];
    const manifest={schemaVersion:1,product,version:'1.0.0',artifacts:[installer,zip]};
    const artifacts=validArtifacts(manifest,siteUrl,product);
    assert.equal(preferredArtifact(artifacts,'windows'),zip);
    assert.equal(preferredArtifact([installer],'windows'),installer);
    const config={siteUrl,companyUrl:'https://horizonai.ai',voraUrl:'https://vora.im',voraSignupUrl:'https://vora.im',products:{[product]:{web:'https://example.org/'}}};
    for(const language of ['ko','en','ja']) {
      const html=renderDesktopPage(config,product,language,manifest);
      const button=html.match(/class="button primary download-button" href="([^"]+)/);
      assert.equal(button?.[1],zip.url);
      const structured=JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
      assert.deepEqual(structured.downloadUrl,[zip.url]);
    }
    assert.equal(manifest.artifacts[0],installer,'raw installer retained for automatic update');
  }
});
