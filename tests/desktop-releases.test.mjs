import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { publishProductReleases, publishDesktopReleases } from '../scripts/desktop-releases.mjs';
import { validArtifact, validArtifacts, preferredArtifact, currentManifest } from '../public/downloads/shared/releases.js';

const siteUrl = 'https://works.vora.im';
const data = Buffer.from('verified desktop installer fixture');
function fixture(product, platform='macos', format='dmg') {
  const arch=platform==='macos'?'arm64':'x64';
  const name=`VORA-${product.toUpperCase()}-1.0.0-${{macos:'mac',windows:'win',linux:'linux'}[platform]}-${arch}.${format}`;
  return {manifest:{schemaVersion:1,product,version:'1.0.0',artifacts:[{platform,arch,format,url:`${siteUrl}/releases/${product}/1.0.0/${name}`,size:data.length,sha256:createHash('sha256').update(data).digest('hex')}]},assets:{[name]:`https://api.github.com/repos/saxoji/vora_works_${product}/releases/assets/123`}};
}
function multipartFixture(product='slide') {
  const release=fixture(product);
  const name=Object.keys(release.assets)[0];
  const bodies=[data.subarray(0,10),data.subarray(10)];
  const parts=bodies.map((body,index)=>({url:`https://api.github.com/repos/saxoji/vora_works_${product}/releases/assets/${123+index}`,
    size:body.length,sha256:createHash('sha256').update(body).digest('hex')}));
  release.assets[name]={parts};
  return {release,name,bodies,parts};
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

test('withdrawn platforms disappear from current downloads but immutable versioned files remain available', async()=>{
  for (const withdrawnPlatforms of [['windows'], ['macos','windows','linux']]) await workspace(async({root,dist})=>{
    const release=fixture('word');
    const windows=fixture('word','windows','zip');
    release.manifest.artifacts.push(...windows.manifest.artifacts);
    Object.assign(release.assets,windows.assets);
    await catalog(root,'word',release);
    await writeFile(new URL('releases/word/catalog.json',root),JSON.stringify({schemaVersion:1,stableVersion:'1.0.0',withdrawnPlatforms,releases:[release]}));
    await publishProductReleases({root,dist,product:'word',siteUrl,fetcher:async()=>new Response(data)});
    const current=JSON.parse(await readFile(new URL('releases/word/stable.json',dist)));
    assert.deepEqual(current.artifacts,release.manifest.artifacts.filter(a=>!withdrawnPlatforms.includes(a.platform)));
    assert.equal(current.status,withdrawnPlatforms.length===3?'pending':undefined);
    assert.deepEqual(JSON.parse(await readFile(new URL('releases/word/1.0.0/manifest.json',dist))),release.manifest);
    for (const name of Object.keys(release.assets)) assert.deepEqual(await readFile(new URL(`releases/word/1.0.0/${name}`,dist)),data);
    const {renderDesktopPage}=await import('../scripts/desktop-pages.mjs');
    const config={siteUrl,companyUrl:siteUrl,voraUrl:siteUrl,voraSignupUrl:siteUrl,products:{word:{web:siteUrl}}};
    for (const lang of ['ko','en','ja']) {
      const html=renderDesktopPage(config,'word',lang,current);
      assert.ok(!html.includes(windows.manifest.artifacts[0].url));
      assert.equal((html.match(/class="button primary download-button"/g)||[]).length,withdrawnPlatforms.length===3?0:1);
    }
  });
});

test('invalid platform withdrawal configuration fails before fetching or publishing anything', async()=>{
  for (const withdrawnPlatforms of ['windows',['unknown'],['windows','windows']]) await workspace(async({root,dist})=>{
    const release=fixture('word');await catalog(root,'word',release);
    await writeFile(new URL('releases/word/catalog.json',root),JSON.stringify({schemaVersion:1,stableVersion:'1.0.0',withdrawnPlatforms,releases:[release]}));
    await assert.rejects(publishProductReleases({root,dist,product:'word',siteUrl,fetcher:async()=>{throw Error('unexpected fetch');}}),/Invalid withdrawn/);
    await assert.rejects(stat(new URL('releases/word/stable.json',dist)));
  });
});

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
    if(product === 'slide') zip.bundleKind='windows-msi-cab-v1';
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

test('only SLIDE DMG, AppImage and marked Windows bundles allow up to 4 GiB',()=>{
  for(const product of ['word','slide','cell','hwp']) {
    for(const [platform,format] of [['macos','dmg'],['macos','zip'],['linux','AppImage'],['windows','zip'],['windows','exe'],['windows','msi']]) {
      if(product === 'hwp' && format === 'msi') continue;
      const artifact=fixture(product,platform,format).manifest.artifacts[0];
      const slideZip=product === 'slide' && platform === 'windows' && format === 'zip';
      if(slideZip) artifact.bundleKind='windows-msi-cab-v1';
      const large=product === 'slide' && (format === 'dmg' || format === 'AppImage' || slideZip);
      const limit=(large?4:2)*1024**3;
      assert.equal(validArtifact({...artifact,size:limit},product,'1.0.0',siteUrl),true,`${product}/${platform}/${format} at limit`);
      for(const size of [limit+1,0,-1,1.5,NaN,Infinity,Number.MAX_SAFE_INTEGER+1]) {
        assert.equal(validArtifact({...artifact,size},product,'1.0.0',siteUrl),false,`${product}/${platform}/${format} rejects ${size}`);
      }
    }
  }
});

test('SLIDE bundle marker is required only for its Windows ZIP and cannot relabel another installer',()=>{
  const slide=fixture('slide','windows','zip').manifest.artifacts[0];
  for(const bundleKind of [undefined,null,'','windows-msi-cab-v2']) {
    assert.equal(validArtifact({...slide,bundleKind},'slide','1.0.0',siteUrl),false);
  }
  assert.equal(validArtifact(slide,'slide','1.0.0',siteUrl),false);
  for(const product of ['word','slide','cell','hwp']) {
    for(const [platform,format] of [['macos','dmg'],['linux','AppImage'],['windows','msi'],['windows','zip']]) {
      if(product === 'slide' && format === 'zip') continue;
      const artifact=fixture(product,platform,format).manifest.artifacts[0];
      assert.equal(validArtifact({...artifact,bundleKind:'windows-msi-cab-v1'},product,'1.0.0',siteUrl),false);
    }
  }
});

test('verified SLIDE wrapper keeps its marker and bytes in both manifests while bare ZIP is rejected before download',async()=>{
  for(const marked of [false,true]) await workspace(async({root,dist})=>{
    const release=fixture('slide','windows','zip');
    if(marked) release.manifest.artifacts[0].bundleKind='windows-msi-cab-v1';
    await catalog(root,'slide',release);
    let requests=0;
    const publish=()=>publishProductReleases({root,dist,product:'slide',siteUrl,fetcher:async()=>{requests++;return new Response(data);}});
    if(!marked) {
      await assert.rejects(publish(),/Invalid release artifact/);
      assert.equal(requests,0);
      await assert.rejects(stat(new URL('releases/slide/stable.json',dist)));
      return;
    }
    await publish();
    for(const name of ['stable.json','1.0.0/manifest.json']) {
      assert.deepEqual(JSON.parse(await readFile(new URL(`releases/slide/${name}`,dist))),release.manifest);
    }
    assert.deepEqual(await readFile(new URL(`releases/slide/1.0.0/${Object.keys(release.assets)[0]}`,dist)),data);
  });
});

test('SLIDE source parts stream into one byte-identical installer without exposing private part locations',async()=>workspace(async({root,dist})=>{
  const {release,name,bodies,parts}=multipartFixture();await catalog(root,'slide',release);
  const fetched=[];
  await publishProductReleases({root,dist,product:'slide',siteUrl,fetcher:async(url)=>{
    fetched.push(url.href);return new Response(bodies[parts.findIndex(part=>part.url===url.href)]);
  }});
  assert.deepEqual(fetched,parts.map(part=>part.url));
  assert.deepEqual(await readFile(new URL(`releases/slide/1.0.0/${name}`,dist)),data);
  for(const path of ['stable.json','1.0.0/manifest.json']) {
    const raw=await readFile(new URL(`releases/slide/${path}`,dist),'utf8');
    assert.deepEqual(JSON.parse(raw),release.manifest);assert.ok(!raw.includes('api.github.com'));
  }
}));

test('invalid multipart bounds, hashes, URLs and product bindings are rejected before any download',async()=>{
  const patches=[
    value=>{value.release.assets[value.name].extra=true;},
    value=>{value.parts.length=1;},
    value=>{value.parts.push(...value.parts,...value.parts);},
    value=>{value.parts[0].size=0;},
    value=>{value.parts[0].size=1024**3+1;},
    value=>{value.parts[0].size+=1;},
    value=>{value.parts[0].sha256='invalid';},
    value=>{value.parts[1].url=value.parts[0].url;},
    value=>{value.parts[1].url=value.parts[1].url.replace('/vora_works_slide/','/vora_works_word/');},
    value=>{value.parts[1].url=value.parts[1].url.replace('https:','http:');},
    value=>{value.parts[1].url=value.parts[1].url.replace('api.github.com','api.github.com:8443');},
    value=>{value.parts[1].url+='?token=not-allowed';},
    value=>{value.parts[1]=null;},
  ];
  for(const patch of patches) await workspace(async({root,dist})=>{
    const value=multipartFixture();patch(value);await catalog(root,'slide',value.release);
    let fetched=0;
    await assert.rejects(publishProductReleases({root,dist,product:'slide',siteUrl,fetcher:async()=>{fetched++;return new Response(data);}}),/Invalid release source parts|Untrusted build archive/);
    assert.equal(fetched,0);await assert.rejects(stat(new URL('releases/slide/stable.json',dist)));
  });
  for(const product of ['word','cell','hwp']) await workspace(async({root,dist})=>{
    const {release}=multipartFixture(product);await catalog(root,product,release);
    await assert.rejects(publishProductReleases({root,dist,product,siteUrl,fetcher:async()=>{throw Error('unexpected fetch');}}),/Invalid release source parts/);
  });
});

test('part download failures, truncation, corruption and wrong assembly remove partial installers and never publish a feed',async()=>{
  for(const mode of ['http','truncated','oversized','corrupt','reversed','whole-hash']) await workspace(async({root,dist})=>{
    const {release,name,bodies,parts}=multipartFixture();
    const sourceBodies=new Map(parts.map((part,index)=>[part.url,bodies[index]]));
    if(mode==='reversed') parts.reverse();
    if(mode==='whole-hash') release.manifest.artifacts[0].sha256='0'.repeat(64);
    await catalog(root,'slide',release);
    await assert.rejects(publishProductReleases({root,dist,product:'slide',siteUrl,fetcher:async(url)=>{
      let body=sourceBodies.get(url.href);
      if(url.href.endsWith('/124')) {
        if(mode==='http') return new Response('unavailable',{status:503});
        if(mode==='truncated') body=body.subarray(1);
        if(mode==='oversized') body=Buffer.concat([body,Buffer.from('x')]);
        if(mode==='corrupt') body=Buffer.alloc(body.length);
      }
      return new Response(body);
    }}),/checksum|expected size|Cannot retrieve/);
    await assert.rejects(stat(new URL(`releases/slide/1.0.0/${name}`,dist)));
    await assert.rejects(stat(new URL('releases/slide/stable.json',dist)));
  });
});

test('a GitHub source URL cannot claim an unsplit asset of 2 GiB or larger',async()=>workspace(async({root,dist})=>{
  const release=fixture('slide');release.manifest.artifacts[0].size=3*1024**3;await catalog(root,'slide',release);
  await assert.rejects(publishProductReleases({root,dist,product:'slide',siteUrl,fetcher:async()=>{throw Error('unexpected fetch');}}),/require verified SLIDE source parts/);
}));

test('platform downloads retain their verified old version without advertising it to native updaters', async () => {
  const source = JSON.parse(await readFile(new URL('../releases/cell/catalog.json', import.meta.url)));
  // Model an incomplete platform rollout explicitly. The live catalog may
  // later receive its verified Windows installer without changing this policy.
  source.stableVersion = '1.0.2';
  source.withdrawnPlatforms = [];
  source.downloadFallbacks = {windows:'1.0.1'};
  const rolling = source.releases.find(r => r.manifest.version === '1.0.2');
  rolling.manifest.artifacts = rolling.manifest.artifacts.filter(a => a.platform !== 'windows');
  const previous = source.releases.find(r => r.manifest.version === '1.0.1').manifest;
  const current = currentManifest(source, 'cell');
  assert.equal(current.version, '1.0.2');
  assert.deepEqual(current.artifacts.map(a => a.platform), ['macos', 'linux']);
  const downloads = validArtifacts(current, siteUrl, 'cell');
  assert.deepEqual(downloads.filter(a => a.platform === 'windows').map(({version,...a}) => a), previous.artifacts.filter(a => a.platform === 'windows'));
  assert(downloads.filter(a => a.platform === 'windows').every(a => a.version === '1.0.1'));
  assert.equal(preferredArtifact(downloads, 'windows').format, 'zip');
  assert.deepEqual(validArtifacts({...current, downloadFallbacks:[...current.downloadFallbacks, ...current.downloadFallbacks]}, siteUrl, 'cell'), downloads);
  assert.deepEqual(validArtifacts({...current, downloadFallbacks:[null, {version:'1.0.1', artifacts:[null, false, {}, ...current.downloadFallbacks[0].artifacts]}]}, siteUrl, 'cell'), downloads);
  const native = JSON.parse(JSON.stringify(current));
  assert.equal(native.artifacts.find(a => a.platform === 'windows'), undefined, 'existing Windows updater returns no update');
  assert(native.artifacts.every(a => validArtifact(a, 'cell', native.version, siteUrl)));
  const withdrawn = currentManifest({...source, withdrawnPlatforms:['windows']}, 'cell');
  assert.equal(validArtifacts(withdrawn, siteUrl, 'cell').some(a => a.platform === 'windows'), false);
  assert.throws(() => currentManifest({...source, downloadFallbacks:{windows:'9.9.9'}}, 'cell'));
  assert.throws(() => currentManifest({...source, downloadFallbacks:{android:'1.0.1'}}, 'cell'));
  const tampered = structuredClone(current); tampered.downloadFallbacks[0].artifacts[0].url = 'https://evil.example/installer';
  assert.equal(validArtifacts(tampered, siteUrl, 'cell').length, downloads.length - 1);
});
