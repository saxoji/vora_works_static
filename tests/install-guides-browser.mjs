import assert from 'node:assert/strict';
import { chromium, webkit } from 'playwright';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { installCopy } from '../src/install.js';
import { products, languages } from '../public/downloads/shared/content.js';
import { currentManifest } from '../public/downloads/shared/releases.js';

const base=process.env.PREVIEW_URL||'http://127.0.0.1:4190';
const folder='output/playwright/install177';
await mkdir(folder,{recursive:true});
const manifests=Object.fromEntries(await Promise.all(Object.keys(products).map(async product=>[product,currentManifest(JSON.parse(await readFile(`releases/${product}/catalog.json`)),product)])));
const configSource=await readFile('public/config.js','utf8');
const report={pages:0,popups:0,edgeCases:0,webkit:0,errors:[],screenshots:[]};
const safe=async(page,label)=> {
  const state=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,broken:[...document.images].filter(i=>!i.complete||!i.naturalWidth).map(i=>i.src)}));
  assert.equal(state.overflow,false,label);assert.deepEqual(state.broken,[],label);
};
const shot=async(page,name)=>{const path=`${folder}/${name}.png`;await page.screenshot({path,fullPage:!name.startsWith('popup-')&&!name.startsWith('synthetic-')});report.screenshots.push(path);};
const browser=await chromium.launch({headless:true,channel:'chrome'});
try {
  const context=await browser.newContext();
  await context.route('https://works.vora.im/releases/*/stable.json',route=>route.fulfill({status:503,body:'local page evidence'}));
  const page=await context.newPage();page.on('pageerror',error=>report.errors.push(error.message));
  for(const product of Object.keys(products)) for(const lang of languages) for(const theme of ['light','dark']) for(const width of [320,1440]) {
    await page.setViewportSize({width,height:900});
    await page.goto(`${base}/downloads/${product}/${lang}/?os=windows&theme=${theme}`);
    await page.evaluate(()=>document.fonts.ready);
    assert.equal(await page.locator('#windows-install').getAttribute('open'),'');
    assert.equal(await page.locator('#macos-install').getAttribute('open'),null);
    await page.locator('a.install-help[href="#linux-install"]').click();
    assert.equal(await page.locator('#linux-install').getAttribute('open'),'');
    await page.locator('#macos-install summary').focus();await page.keyboard.press('Enter');
    assert.equal(await page.locator('#macos-install').getAttribute('open'),'');
    assert.ok((await page.locator('#macos-install').textContent()).includes(installCopy[lang].macBlocked));
    assert.ok((await page.locator('#macos-install').textContent()).includes(installCopy[lang].macDamaged));
    const available=new Set(manifests[product].artifacts.map(a=>a.platform));
    assert.equal(await page.locator('.guide-pending').count(),3-available.size);
    assert.equal(await page.locator('a.download-button').count(),available.size);
    await safe(page,`${product}/${lang}/${theme}/${width}`);
    if((width===1440&&theme==='dark')||(width===320&&theme==='light'&&lang==='ko')) await shot(page,`${product}-${lang}-${theme}-${width}-all-guides`);
    report.pages++;
  }
  await context.close();

  const popupContext=await browser.newContext();
  await popupContext.route('https://works.vora.im/releases/*/stable.json',route=>{
    const product=new URL(route.request().url()).pathname.split('/')[2];
    return route.fulfill({json:manifests[product]});
  });
  const popup=await popupContext.newPage();popup.on('pageerror',error=>report.errors.push(error.message));
  for(const lang of languages) for(const theme of ['light','dark']) for(const width of [320,1440]) {
    await popup.setViewportSize({width,height:900});await popup.goto(`${base}/${lang}/?theme=${theme}`);await popup.evaluate(()=>document.fonts.ready);
    for(const product of Object.keys(products)) {
      const trigger=popup.locator(`.install-guide-trigger[data-download="${product}"]`);
      const response=popup.waitForResponse(`https://works.vora.im/releases/${product}/stable.json`);
      await trigger.click();await response;
      await popup.locator('#download-dialog[open]').waitFor();
      await popup.waitForFunction(()=>document.querySelector('#dialog-content .installation-guide'));
      assert.equal(await popup.locator('#dialog-content .installation-guide').count(),3);
      assert.equal(await popup.locator('#dialog-title').textContent(),installCopy[lang].title);
      await popup.locator('#dialog-windows-install summary').click();
      assert.equal(await popup.locator('#dialog-windows-install').getAttribute('open'),'');
      await safe(popup,`popup ${product}/${lang}/${theme}/${width}`);
      const bounds=await popup.locator('#download-dialog').evaluate(dialog=>({width:dialog.clientWidth,scrollWidth:dialog.scrollWidth}));
      assert.ok(bounds.scrollWidth<=bounds.width+1,`popup overflow ${product}/${lang}/${width}`);
      if(product==='cell'&&((width===1440&&theme==='dark')||(width===320&&theme==='light'))) {
        await popup.locator('#dialog-content').evaluate(element=>{element.scrollTop=0;});
        await shot(popup,`popup-${product}-${lang}-${theme}-${width}`);
      }
      assert.equal(await popup.locator('.dialog-close').isVisible(),true);
      await popup.keyboard.press('Escape');assert.equal(await popup.locator('#download-dialog').getAttribute('open'),null);
      assert.equal(await trigger.evaluate(element=>element===document.activeElement),true);
      report.popups++;
    }
  }
  await popupContext.close();

  // Use a synthetic, valid feed and configuration to exercise currently withdrawn
  // package formats without changing any real release or enabling public downloads.
  const edge=await browser.newContext();
  await edge.route('**/config.js',route=>route.fulfill({contentType:'text/javascript',body:configSource.replace('export default {','const config = {')+`for(const product of ['word','slide','cell','hwp']) for(const os of ['macos','windows','linux']) config.products[product].downloads[os]='https://works.vora.im/downloads/'+product+'/?os='+os; export default config;`}));
  let mode='bundle', resolveDelayed;
  const synthetic=product=>({schemaVersion:1,product,version:'1.0.0',artifacts:[{platform:'windows',arch:'x64',format:'zip',size:4096,sha256:'a'.repeat(64),url:`https://works.vora.im/releases/${product}/1.0.0/VORA-${product.toUpperCase()}-1.0.0-win-x64.zip`,...(product==='slide'?{bundleKind:'windows-msi-cab-v1'}:{})}]});
  await edge.route('https://works.vora.im/releases/*/stable.json',async route=>{
    const product=new URL(route.request().url()).pathname.split('/')[2];
    if(mode==='late'&&product==='slide') await new Promise(resolve=>{resolveDelayed=resolve;});
    if(mode==='pending') return route.fulfill({json:{schemaVersion:1,product,version:'1.0.0',status:'pending',artifacts:[]}});
    if(mode==='contradictory') return route.fulfill({json:{...synthetic(product),status:'pending'}});
    return route.fulfill({json:synthetic(product)});
  });
  const p=await edge.newPage();p.on('pageerror',error=>report.errors.push(error.message));await p.goto(`${base}/en/`);
  for(const product of ['word','slide','cell','hwp']) {
    await p.locator(`.install-guide-trigger[data-download="${product}"]`).click();
    const expected=product==='hwp'?'VORA HWP.exe':product==='slide'?'every CAB':'MSI';
    await p.waitForFunction(text=>document.querySelector('#dialog-windows-install').textContent.includes(text),expected);
    const text=await p.locator('#dialog-windows-install').textContent();
    if(product==='hwp') assert.ok(!text.includes('MSI'));
    await p.waitForFunction(()=>document.querySelectorAll('.dialog-platforms a').length===1);
    assert.equal(await p.locator('.dialog-platforms a').count(),1);
    await p.locator('#dialog-windows-install summary').click();
    if(product==='slide'||product==='hwp') await shot(p,`synthetic-${product}-windows-format`);
    await p.keyboard.press('Escape');report.edgeCases++;
  }
  mode='pending';await p.locator('.install-guide-trigger[data-download="cell"]').click();
  await p.waitForFunction(()=>document.querySelectorAll('.dialog-platforms a').length===0);
  assert.equal(await p.locator('#dialog-content .guide-pending').count(),3);await p.keyboard.press('Escape');report.edgeCases++;
  mode='contradictory';const contradictoryResponse=p.waitForResponse('https://works.vora.im/releases/cell/stable.json');
  await p.locator('.install-guide-trigger[data-download="cell"]').click();await contradictoryResponse;
  assert.equal(await p.locator('.dialog-platforms a').count(),3);await p.keyboard.press('Escape');report.edgeCases++;
  mode='late';await p.locator('.install-guide-trigger[data-download="slide"]').click();
  await p.waitForFunction(()=>document.querySelector('#download-dialog').open);
  await p.keyboard.press('Escape');await p.locator('.install-guide-trigger[data-download="hwp"]').click();
  await p.waitForFunction(()=>document.querySelector('#dialog-windows-install').textContent.includes('VORA HWP.exe'));
  assert.ok(resolveDelayed,'delayed feed must be pending');const lateResponse=p.waitForResponse('https://works.vora.im/releases/slide/stable.json');resolveDelayed();await lateResponse;
  assert.ok((await p.locator('#dialog-content .eyebrow').textContent()).includes('HWP'));
  await p.keyboard.press('Escape');report.edgeCases++;await edge.close();
} finally {await browser.close();}

// Safari engine smoke checks the shared details/overflow behavior at a narrow width.
const safari=await webkit.launch({headless:true,...(process.env.WEBKIT_EXECUTABLE_PATH?{executablePath:process.env.WEBKIT_EXECUTABLE_PATH}:{})});
try {
  const context=await safari.newContext({viewport:{width:390,height:844}});
  await context.route('https://works.vora.im/releases/*/stable.json',route=>route.fulfill({status:503,body:'offline'}));
  const page=await context.newPage();page.on('pageerror',error=>report.errors.push(error.message));
  for(const lang of languages) {
    await page.goto(`${base}/downloads/cell/${lang}/?os=linux`);await page.evaluate(()=>document.fonts.ready);
    assert.equal(await page.locator('#linux-install').getAttribute('open'),'');
    await page.locator('#macos-install summary').click();await safe(page,`webkit ${lang}`);
    await shot(page,`webkit-cell-${lang}-390`);
    await page.goto(`${base}/${lang}/`);await page.locator('.install-guide-trigger[data-download="cell"]').click();
    assert.equal(await page.locator('#download-dialog[open]').count(),1);await page.keyboard.press('Escape');
    assert.equal(await page.locator('#download-dialog[open]').count(),0);report.webkit++;
  }
} finally {await safari.close();}
assert.deepEqual(report.errors,[]);
await writeFile(`${folder}/result.json`,JSON.stringify(report,null,2)+'\n');
console.log(`PASS install guides: ${report.pages} pages, ${report.popups} popups, ${report.edgeCases} live-feed/format boundaries, ${report.webkit} WebKit language cases; no page errors.`);
