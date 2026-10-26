import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { publishHwpReleases } from '../scripts/hwp-releases.mjs';
test('Render publisher only publishes verified archived installers and stable manifest', async()=>{
 const directory=await mkdtemp(join(tmpdir(),'vora-release-test-'));const root=pathToFileURL(directory+'/');const dist=new URL('dist/',root);
 const data=Buffer.from('installer fixture'),name='VORA-HWP-1.0.0-mac-arm64.dmg';
 const manifest={schemaVersion:1,product:'hwp',version:'1.0.0',artifacts:[{platform:'macos',arch:'arm64',format:'dmg',url:'https://works.vora.im/releases/hwp/1.0.0/'+name,size:data.length,sha256:createHash('sha256').update(data).digest('hex')}]};
 const release={manifest,assets:{[name]:'https://api.github.com/repos/saxoji/vora_works_hwp/releases/assets/123'}};
 try{
  await mkdir(new URL('releases/hwp/',root),{recursive:true});await mkdir(dist);
  const catalog=new URL('releases/hwp/catalog.json',root);
  await writeFile(catalog,JSON.stringify({schemaVersion:1,stableVersion:'1.0.0',releases:[release]}));
  await publishHwpReleases({root,dist,siteUrl:'https://works.vora.im',fetcher:async()=>new Response(data)});
  assert.deepEqual(JSON.parse(await readFile(new URL('releases/hwp/stable.json',dist))),manifest);
  await rm(dist,{recursive:true});await mkdir(dist);
  await assert.rejects(publishHwpReleases({root,dist,siteUrl:'https://works.vora.im',fetcher:async()=>new Response('corrupt')}),/checksum/);
  await assert.rejects(stat(new URL('releases/hwp/stable.json',dist)));
  release.assets[name]='https://evil.test/file';await writeFile(catalog,JSON.stringify({schemaVersion:1,stableVersion:'1.0.0',releases:[release]}));
  await assert.rejects(publishHwpReleases({root,dist,siteUrl:'https://works.vora.im'}),/Untrusted/);
 }finally{await rm(directory,{recursive:true,force:true});}
});
