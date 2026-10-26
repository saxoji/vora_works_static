// Authoring only: PNGs are committed; production builds need no browser.
import { chromium } from 'playwright';
import { copy, languages } from '../public/downloads/hwp/content.js';
import { mkdir } from 'node:fs/promises';
const origin = process.env.PREVIEW_URL || 'http://127.0.0.1:4190';
const browser = await chromium.launch({headless:true,channel:'chrome'});
const page = await browser.newPage({viewport:{width:1200,height:630},deviceScaleFactor:1});
await mkdir('public/brand',{recursive:true});
try {
  await page.goto(origin);
  for (const lang of languages) {
    const t = copy[lang];
    await page.setContent(`<!doctype html><html lang="${lang}"><head><style>
      @font-face{font-family:Manrope;src:url('${origin}/fonts/manrope.woff2')}@font-face{font-family:Pretendard;src:url('${origin}/fonts/pretendard.woff2')}
      *{box-sizing:border-box}body{margin:0;width:1200px;height:630px;background:#151718;color:#efefea;font-family:Manrope,Pretendard,sans-serif;overflow:hidden}
      .top{position:absolute;left:48px;right:48px;top:32px;border-bottom:1px solid #333937;padding-bottom:19px;font-size:11px;color:#a9afaa;letter-spacing:2.5px;display:flex;justify-content:space-between}
      main{position:absolute;left:280px;right:280px;top:113px;text-align:center}.icon{width:86px;height:86px;display:block;margin:auto}h1{font-size:82px;line-height:1.15;letter-spacing:-4px;margin:24px -20px 16px;font-weight:650;white-space:nowrap}h1 span{color:#83d4be}.tagline{font-size:28px;letter-spacing:-.7px;white-space:nowrap;margin:0 -40px}.description{font-size:15px;color:#a9afaa;margin-top:17px}.formats{display:flex;justify-content:center;gap:17px;margin-top:25px}.formats span{font-size:13px;padding:7px 13px;border:1px solid #3c4741;border-radius:6px;color:#c2c9c1}.bottom{position:absolute;left:48px;right:48px;bottom:29px;border-top:1px solid #333937;padding-top:20px;display:flex;align-items:center;justify-content:space-between}.bottom span{font-size:11px;letter-spacing:2px;color:#a9afaa}.bottom img{width:164px;height:auto}
    </style></head><body><div class="top"><span>VORA WORKS / DESKTOP</span><span>${t.download.toUpperCase()}</span></div><main><img class="icon" src="${origin}/brand/vora-hwp.svg" alt=""><h1>VORA <span>HWP.</span></h1><p class="tagline">${t.shareTitle}</p><div class="description">${t.shareDescription}</div><div class="formats"><span>HWP</span><span>HWPX</span><span>PDF</span><span>DOCX</span></div></main><div class="bottom"><span>WORKS.VORA.IM</span><img src="${origin}/brand/horizon-dark.webp" alt="Linkbricks Horizon-AI"></div></body></html>`);
    await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(image=>image.decode()));});
    const bounds = await page.locator('h1').evaluate(element=>{const range=document.createRange();range.selectNodeContents(element);const r=range.getBoundingClientRect();return {left:r.left,right:r.right};});
    if(bounds.left<285||bounds.right>915)throw new Error(`${lang}: product title is outside the square crop safe area`);
    await page.screenshot({path:`public/brand/hwp-desktop-${lang}-v1.png`});
    console.log(`HWP OG ${lang}: 1200x630, centered product title verified`);
  }
} finally {await browser.close();}
