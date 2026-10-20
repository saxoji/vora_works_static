// Optional authoring tool; the generated PNGs are committed and need no browser on Render.
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { copy, products } from '../src/content.js';
const origin = process.env.PREVIEW_URL || 'http://127.0.0.1:4173';
const browser = await chromium.launch({ headless: true, channel: process.env.BROWSER_CHANNEL || 'chrome' });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.goto(origin);
await mkdir(new URL('../public/brand/', import.meta.url), { recursive: true });
try {
  for (const lang of ['ko', 'ja', 'en']) {
    const text = copy[lang];
    await page.setContent(`<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><style>
      @font-face{font-family:Manrope;src:url('${origin}/fonts/manrope.woff2')}@font-face{font-family:Editorial;src:url('${origin}/fonts/instrument-serif.woff2');font-style:italic}@font-face{font-family:Pretendard;src:url('${origin}/fonts/pretendard.woff2')}
      *{box-sizing:border-box}html,body{margin:0;width:1200px;height:630px;overflow:hidden}body{background:#151619;color:#f3f1eb;font-family:Manrope,Pretendard,'Hiragino Sans',sans-serif;padding:38px 54px}header{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #3c3d3e;padding-bottom:19px;font-size:13px;letter-spacing:2.8px;color:#b2b2ad}header .edition{color:#e5e4de;letter-spacing:1px}main{display:flex;justify-content:space-between;padding-top:30px;height:350px}.title{font-size:127px;line-height:.94;letter-spacing:-8px;font-weight:600;margin:0}.title em{font-family:Editorial,serif;font-weight:400;letter-spacing:-4px;color:#bfe1c6}.title .works{display:block;letter-spacing:-6px}.claim{position:relative;display:inline-block;font-size:18px;font-weight:500;letter-spacing:-.3px;margin-top:24px;padding-bottom:6px}.claim:after{content:'';position:absolute;bottom:-3px;left:-2px;right:-2px;height:8px;background:url('${origin}/brand/hand-underline.svg') center/100% 100% no-repeat}.right{width:380px;display:flex;flex-direction:column;align-items:flex-start;padding:1px 0 0 14px}.symbol{width:70px;height:70px;margin:0 0 21px}.tagline{font-family:Manrope,Pretendard,'Hiragino Sans',sans-serif;font-size:${lang === 'ja' ? '36' : '39'}px;font-weight:500;letter-spacing:-1.8px;line-height:1.42;margin:0}.tagline span{color:#b9bab4}.tools{display:grid;grid-template-columns:repeat(4,1fr);border-top:1px solid #3c3d3e;border-bottom:1px solid #3c3d3e;padding:23px 0;gap:26px}.tool{display:flex;align-items:center;gap:16px}.tool img{width:48px;height:48px}.tool strong{font-size:18px;letter-spacing:-.2px;font-weight:600}.tool small{display:block;font-size:9px;color:#969993;letter-spacing:1.5px;margin-top:6px}.bottom{display:flex;justify-content:space-between;align-items:center;padding-top:18px}.bottom span{color:#8e928d;font-size:10px;letter-spacing:2.4px}.bottom img{width:155px;height:auto;max-height:36px;object-fit:contain}
      </style></head><body><header><span>THE WORKS COLLECTION</span><span class="edition">01 — 04 &nbsp; / &nbsp; ${lang.toUpperCase()}</span></header><main><div><h1 class="title">VORA <em>AI</em><span class="works">WORKS</span></h1><div class="claim">${text.free}</div></div><div class="right"><img class="symbol" src="${origin}/brand/vora-works.svg" alt=""><p class="tagline">${text.hero1}<br><span>${text.hero2}</span></p></div></main><section class="tools">${products.map(product=>`<div class="tool"><img src="${origin}/brand/vora-${product.id}.svg" alt=""><div><strong>VORA ${product.name}</strong><small>${product.category}</small></div></div>`).join('')}</section><footer class="bottom"><span>YOUR WORK. YOUR KNOWLEDGE. &nbsp; VORA.IM</span><img src="${origin}/brand/horizon-dark.webp" alt="Linkbricks Horizon-AI"></footer></body></html>`);
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all(Array.from(document.images, image => image.decode()));
    });
    await page.screenshot({ path: new URL(`../public/brand/social-${lang}.png`, import.meta.url).pathname });
    console.log(`Generated ${lang} social card · 1200 × 630`);
  }
} finally {
  await browser.close();
}
