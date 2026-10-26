import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const base = process.env.PREVIEW_URL || 'http://127.0.0.1:4190';
const browser = await chromium.launch({headless:true,channel:'chrome'});
const errors = [];
try {
  const context = await browser.newContext({locale:'ko-KR'});
  // Local tests keep the pre-rendered release even if the online feed is unavailable.
  await context.route('https://works.vora.im/releases/hwp/stable.json',route=>route.fulfill({status:503,body:'offline'}));
  const page = await context.newPage();
  page.on('pageerror',error=>errors.push(error.message));
  for(const lang of ['ko','en','ja']) for(const colorScheme of ['light','dark']) for(const width of [320,390,768,1440]) {
    await page.setViewportSize({width,height:900});
    await page.emulateMedia({colorScheme});
    await page.goto(`${base}/downloads/hwp/${lang}/`);
    await page.evaluate(()=>document.fonts.ready);
    assert.equal(await page.locator('html').getAttribute('lang'),lang);
    assert.equal(await page.locator('#theme').inputValue(),'system');
    assert.equal(await page.locator('.os-card').count(),3);
    const metrics = await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,background:getComputedStyle(document.body).backgroundColor,logoDark:getComputedStyle(document.querySelector('.maker-dark')).display,broken:[...document.images].filter(i=>!i.complete||i.naturalWidth===0).map(i=>i.src)}));
    assert.equal(metrics.overflow,false,`${lang}/${colorScheme}/${width}: horizontal overflow`);
    assert.deepEqual(metrics.broken,[]);
    assert.equal(metrics.background,colorScheme==='dark'?'rgb(21, 23, 24)':'rgb(247, 247, 244)');
    assert.equal(metrics.logoDark,colorScheme==='dark'?'block':'none');
    assert.equal(await page.locator('#vora-signup').getAttribute('href'),'https://www.vora.im/auth/sign-in');
    assert.equal(await page.locator('#maker').getAttribute('href'),'https://www.horizonai.ai/');
    if((width===1440&&colorScheme==='dark')||(width===390&&colorScheme==='light')) await page.screenshot({path:`output/hwp-desktop/${lang}-${colorScheme}-${width}.png`,fullPage:true});
  }
  await page.goto(`${base}/downloads/hwp/ko/`);
  await page.emulateMedia({colorScheme:'light'});
  await page.emulateMedia({colorScheme:'dark'});
  assert.equal(await page.evaluate(()=>getComputedStyle(document.body).backgroundColor),'rgb(21, 23, 24)');
  await page.selectOption('#theme','light');
  await page.reload();
  assert.equal(await page.locator('#theme').inputValue(),'light');
  assert.equal(await page.evaluate(()=>getComputedStyle(document.body).backgroundColor),'rgb(247, 247, 244)');
  await page.selectOption('#language','en');
  await page.waitForURL('**/downloads/hwp/en/');
  assert.equal(await page.locator('html').getAttribute('lang'),'en');
  await page.selectOption('#theme','system');
  await page.locator('.verification summary').click();
  assert.equal(await page.locator('.verification').getAttribute('open'),'');
  assert.match(await page.locator('.verification pre').textContent(),/SHA-256: [a-f0-9]{64}/);
  const staticContext = await browser.newContext({javaScriptEnabled:false});
  const staticPage = await staticContext.newPage();
  for(const lang of ['ko','en','ja']) {
    await staticPage.goto(`${base}/downloads/hwp/${lang}/`);
    assert.equal(await staticPage.locator('h1').count(),1);
    assert.equal(await staticPage.locator('a.download-button').count(),1);
    assert.equal(await staticPage.locator('link[rel=canonical]').getAttribute('href'),`https://works.vora.im/downloads/hwp/${lang}/`);
    assert.equal(await staticPage.locator('link[hreflang]').count(),4);
    const json=JSON.parse(await staticPage.locator('script[type="application/ld+json"]').textContent());
    assert.equal(json['@type'],'SoftwareApplication');
    assert.equal(json.softwareVersion,'1.0.0');
    assert.equal(json.operatingSystem,'macOS (Apple Silicon)');
    const og=await staticPage.locator('meta[property="og:image"]').getAttribute('content');
    const response=await staticContext.request.get(base+new URL(og).pathname);
    assert.equal(response.status(),200);
    const image=await response.body();assert.equal(image.readUInt32BE(16),1200);assert.equal(image.readUInt32BE(20),630);
  }
  assert.deepEqual(errors,[]);
  console.log('PASS 24 language/theme/viewport combinations, system theme updates, saved preferences, links, downloads, SHA details, no-JS content, SEO and OG images');
} finally {await browser.close();}
