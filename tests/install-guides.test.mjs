import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { installCopy, installationGuide, renderInstallGuide } from '../src/install.js';
import { copyFor, products, languages, desktopSocialImagePath } from '../public/downloads/shared/content.js';
import { currentManifest, preferredArtifact, validArtifacts } from '../public/downloads/shared/releases.js';
import { renderDesktopPage, desktopRoutes } from '../scripts/desktop-pages.mjs';
import { renderDocument, routes } from '../scripts/document.mjs';
import { createView } from '../src/view.js';
import { copy } from '../src/content.js';
import { socialImagePath } from '../src/seo.js';

const siteUrl = 'https://works.vora.im';
const config = {siteUrl, companyUrl:'https://www.horizonai.ai/',voraUrl:'https://www.vora.im/',voraSignupUrl:'https://www.vora.im/auth/sign-in',
  products:Object.fromEntries(Object.keys(products).map(product=>[product,{web:`https://v${product}.vora.im`,downloadPageURL:`${siteUrl}/downloads/${product}/`,downloads:Object.fromEntries(['macos','windows','linux'].map(os=>[os,`${siteUrl}/downloads/${product}/?os=${os}`]))}]))};
const fixture = (product, platform, format) => ({platform,format,arch:platform==='macos'?'arm64':'x64',size:4096,sha256:'a'.repeat(64),
  url:`${siteUrl}/releases/${product}/1.0.0/VORA-${product.toUpperCase()}-1.0.0-${{macos:'mac',windows:'win',linux:'linux'}[platform]}-${platform==='macos'?'arm64':'x64'}.${format}`,
  ...(product==='slide'&&platform==='windows'&&format==='zip'?{bundleKind:'windows-msi-cab-v1'}:{})});
const manifest = product => ({schemaVersion:1,product,version:'1.0.0',artifacts:[fixture(product,'macos','dmg'),fixture(product,'windows','zip'),fixture(product,'linux','AppImage')]});
const plain = guide => guide.steps.map(step=>`${step.title} ${step.text}`).join('\n');
const jsonLd = html => JSON.parse(html.match(/<script type="application\/ld\+json"[^>]*>(.*?)<\/script>/s)[1]);

test('all 36 product/language/OS guides use complete translated copy and safe official help', () => {
  const keys = Object.keys(installCopy.en).sort();
  for (const lang of languages) {
    assert.deepEqual(Object.keys(installCopy[lang]).sort(), keys);
    for (const product of Object.keys(products)) for (const platform of ['macos','windows','linux']) {
      const artifact = manifest(product).artifacts.find(a=>a.platform===platform);
      const guide = installationGuide(lang,platform,artifact,product);
      const html = renderInstallGuide(lang,platform,artifact,product);
      assert.ok(guide.steps.length >= 2);
      assert.ok(guide.steps.every(step=>step.title && step.text));
      assert.doesNotMatch(html,/undefined|null|\{app\}|\{format\}|spctl|xattr|codesign|sudo/i);
      assert.match(html,new RegExp(`id="${platform}-install"`));
      for (const [,url] of guide.links) {
        assert.equal(new URL(url).protocol,'https:');
        assert.ok(['support.apple.com','support.microsoft.com','docs.appimage.org'].includes(new URL(url).hostname));
      }
      if (lang!=='en') assert.doesNotMatch(html,/Download the|Run the installer|Copy to Applications/);
    }
  }
});

test('Mac guides distinguish DMG and ZIP, developer verification and damaged-file alerts', () => {
  for (const lang of languages) for (const product of Object.keys(products)) {
    const t=installCopy[lang], dmg=installationGuide(lang,'macos',fixture(product,'macos','dmg'),product), zip=installationGuide(lang,'macos',fixture(product,'macos','zip'),product);
    assert.equal(dmg.steps[0].text,t.macDownload);
    assert.equal(zip.steps[0].text,t.macZip);
    assert.match(dmg.steps[1].text,/Applications/);
    assert.equal(dmg.steps[3].text,t.macBlocked);
    assert.equal(dmg.note,t.macDamaged);
    assert.notEqual(dmg.note,dmg.steps[3].text);
  }
});

test('Windows ZIP contains an installer for WORD/CELL/SLIDE and a portable app for HWP', () => {
  for (const lang of languages) {
    for (const product of ['word','cell','slide']) {
      const guide=installationGuide(lang,'windows',fixture(product,'windows','zip'),product);
      assert.equal(guide.steps[0].text,installCopy[lang].unzip);
      assert.match(guide.steps[1].text,/MSI/);
      assert.equal(guide.steps.length,3);
      assert.equal(guide.note.includes(installCopy[lang].bundle),product==='slide');
    }
    const portable=installationGuide(lang,'windows',fixture('hwp','windows','zip'),'hwp');
    assert.equal(portable.steps.length,2);
    assert.match(portable.steps[1].text,/VORA HWP\.exe/);
    assert.doesNotMatch(plain(portable),/MSI/);
    for(const format of ['msi','exe']) {
      const guide=installationGuide(lang,'windows',fixture('cell','windows',format),'cell');
      assert.match(guide.steps[0].text,new RegExp(format.toUpperCase()));
      assert.equal(guide.steps.length,2);
    }
  }
});

test('Linux instructions execute only a fixed validated-style filename, never arbitrary input', () => {
  for(const lang of languages) {
    const good=installationGuide(lang,'linux',fixture('cell','linux','AppImage'),'cell');
    assert.equal(good.command,'chmod +x "VORA-CELL-1.0.0-linux-x64.AppImage"\n./"VORA-CELL-1.0.0-linux-x64.AppImage"');
    assert.ok(plain(good).includes(installCopy[lang].linuxTerminal));
    for(const url of [undefined,'https://example.test/$(touch bad).AppImage','https://example.test/<script>.AppImage','https://example.test/a.AppImage?x=1']) {
      const guide=installationGuide(lang,'linux',{url},'cell');
      assert.equal(guide.command,null);
      assert.ok(!plain(guide).includes(installCopy[lang].linuxTerminal));
      assert.doesNotMatch(renderInstallGuide(lang,'linux',{url},'cell'),/<script>|touch bad|<pre>/);
    }
  }
});

test('main downloads retain localized actions and withdrawal rules without installation guides', () => {
  for(const lang of languages) for(const product of Object.keys(products)) {
    const view=createView({lang,config});
    const pending=view.downloadDialog(product,'Windows',{});
    assert.doesNotMatch(pending,/installation-guide|guide-pending|dialog-windows-install/);
    assert.ok(pending.includes(`<h2 id="dialog-title">${copy[lang].download}</h2>`));
    assert.ok(pending.includes(copy[lang].dialogBody));
    assert.equal((pending.match(/<small>/g)||[]).length,3);
    assert.ok(pending.includes(config.products[product].web));
    assert.ok(!pending.includes(`/downloads/${product}/${lang}/?os=`));
    const live=Object.fromEntries(manifest(product).artifacts.map(a=>[a.platform,a]));
    const ready=view.downloadDialog(product,'macOS',live);
    assert.doesNotMatch(ready,/installation-guide|guide-pending|install-guide-trigger/);
    assert.equal((ready.match(/target="_blank"/g)||[]).length,4);
    assert.ok(ready.includes(`/downloads/${product}/${lang}/?os=windows`));
    const disabled=structuredClone(config); disabled.products[product].downloads.windows='';
    assert.ok(!createView({lang,config:disabled}).downloadDialog(product,'Windows',live).includes(`/downloads/${product}/${lang}/?os=windows`));
  }
});

test('current catalog filtering preserves immutable files and never restores withdrawn platforms', async () => {
  for(const product of Object.keys(products)) {
    const catalog=JSON.parse(await readFile(new URL(`../releases/${product}/catalog.json`,import.meta.url)));
    const before=JSON.stringify(catalog), current=currentManifest(catalog,product);
    assert.equal(JSON.stringify(catalog),before);
    const stable=catalog.releases.find(r=>r.manifest.version===catalog.stableVersion)?.manifest;
    const expected=stable?.artifacts.filter(a=>!catalog.withdrawnPlatforms?.includes(a.platform))||[];
    assert.deepEqual(current.artifacts,expected);
    assert.equal(current.status,expected.length?undefined:'pending');
    assert.equal(validArtifacts(current,siteUrl,product).length,expected.length + (current.downloadFallbacks ?? []).reduce((n, group) => n + group.artifacts.length, 0));
  }
  assert.throws(()=>currentManifest({schemaVersion:1,releases:[],withdrawnPlatforms:['windows','windows']},'cell'));
  assert.throws(()=>currentManifest({schemaVersion:1,releases:[{manifest:manifest('cell')}],stableVersion:'2.0.0'},'cell'));
});

test('16 product pages preserve localized SEO, canonical/hreflang, exact downloads and pending metadata', () => {
  for(const path of desktopRoutes) {
    const product=path.split('/')[2],lang=path.match(/\/(ko|en|ja)\/$/)?.[1]||'ko';
    for(const available of [true,false]) {
      const source=available?manifest(product):{schemaVersion:1,product,version:'1.0.0',status:'pending',artifacts:[]};
      const html=renderDesktopPage(config,product,lang,source,path), structured=jsonLd(html),t=copyFor(lang,product);
      assert.ok(html.includes(`href="${siteUrl}${path}"`));
      assert.equal((html.match(/<link[^>]*hreflang=/g)||[]).length,4);
      assert.ok(html.includes(desktopSocialImagePath(product,lang)));
      assert.ok(html.includes(t.shareTitle.replaceAll('&','&amp;')));
      assert.match(html,/og:image:alt/);assert.match(html,/twitter:image:alt/);
      assert.equal((html.match(/class="installation-guide"/g)||[]).length,3);
      assert.equal(structured.inLanguage,lang);
      assert.equal(structured.softwareHelp.url,`${siteUrl}${path}#notice-title`);
      assert.equal(structured.downloadUrl?.length||0,available?3:0);
      if(!available) { assert.equal(structured.operatingSystem,undefined);assert.equal(structured.softwareVersion,undefined); }
      else assert.equal(structured.downloadUrl[1],preferredArtifact(source.artifacts,'windows').url);
    }
  }
});

test('four main pages describe installation help and link all localized product guides in JSON-LD', async () => {
  const template=await readFile(new URL('../index.html',import.meta.url),'utf8');
  for(const route of routes) {
    const html=renderDocument(template,config,route), structured=jsonLd(html), page=structured['@graph'].find(item=>item['@type']==='CollectionPage');
    assert.equal((html.match(/<link[^>]*hreflang=/g)||[]).length,4);
    assert.ok(html.includes(socialImagePath(route.lang)));
    assert.equal(page.hasPart.length,4);
    assert.ok(page.hasPart.every(item=>item.url.endsWith(`/${route.lang}/`) && item.name.includes(installCopy[route.lang].title)));
    assert.match(html,/\/downloads\/shared\/install.css/);
    assert.doesNotMatch(html,/install-guide-trigger|class="installation-guide/);
    assert.equal((html.match(/class="os-button available-download"/g)||[]).length,12);
    for(const product of Object.keys(products)) assert.ok(html.includes(`href="${siteUrl}/downloads/${product}/${route.lang}/"`));
  }
});

test('all 15 committed social cards have the declared 1200 by 630 size', async () => {
  const paths=languages.flatMap(lang=>[socialImagePath(lang),...Object.keys(products).map(product=>desktopSocialImagePath(product,lang))]);
  for(const path of paths) {
    const image=await readFile(new URL(`../public${path}`,import.meta.url));
    assert.equal(image.subarray(1,4).toString(),'PNG');
    assert.equal(image.readUInt32BE(16),1200,path);assert.equal(image.readUInt32BE(20),630,path);
  }
});
