// Optional authoring tool; generated PNGs are committed, so Render needs no browser.
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { copy, products } from '../src/content.js';
import { socialImagePath } from '../src/seo.js';
import { installCopy } from '../src/install.js';
const origin = process.env.PREVIEW_URL || 'http://127.0.0.1:4173';
const browser = await chromium.launch({ headless: true, channel: process.env.BROWSER_CHANNEL || 'chrome' });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.goto(origin);
await mkdir(new URL('../public/brand/', import.meta.url), { recursive: true });
try {
  // Favicons are official PNG exports from vora_word/docs/brand; do not regenerate.
  for (const lang of ['ko', 'ja', 'en']) {
    const text = copy[lang];
    await page.setContent(`<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><style>
      @font-face { font-family: Manrope; src: url('${origin}/fonts/manrope.woff2'); }
      @font-face { font-family: Editorial; src: url('${origin}/fonts/instrument-serif.woff2'); font-style: italic; }
      @font-face { font-family: Pretendard; src: url('${origin}/fonts/pretendard.woff2'); }
      * { box-sizing: border-box; }
      html, body { margin: 0; width: 1200px; height: 630px; overflow: hidden; }
      body { background: #151619; color: #f3f1eb; font-family: Manrope, Pretendard, 'Hiragino Sans', sans-serif; }
      .edition { position: absolute; inset: 40px 48px auto; display: flex; justify-content: space-between; color: #9da29c; font-size: 11px; letter-spacing: 2px; }
      .rule { position: absolute; left: 48px; right: 48px; top: 78px; height: 1px; background: #363a37; }
      /* The central 570px survives a 630px square center crop with room to spare. */
      main { position: absolute; top: 29px; left: 315px; width: 570px; text-align: center; }
      .symbol { display: block; width: 72px; height: 72px; margin: 0 auto 21px; background: #151619; }
      .title { margin: 0; font-size: 142px; font-weight: 650; line-height: .95; letter-spacing: -8px; }
      .title-line { display: inline-block; white-space: nowrap; }
      .title em { font-family: Editorial, serif; font-weight: 400; color: #a9c5ff; letter-spacing: -5px; }
      .title .works { display: block; letter-spacing: -6px; }
      .tagline { margin: 18px 0 0; font-size: 27px; font-weight: 500; letter-spacing: -1px; color: #c0c4bd; white-space: nowrap; }
      .claim { display: inline-block; position: relative; margin-top: 10px; padding-bottom: 8px; font-size: 20px; font-weight: 600; letter-spacing: -.3px; }
      .download-note { margin-top: 4px; font-size: 14px; color: #a9c5ff; }
      .claim:after { content: ''; position: absolute; left: -4px; right: -4px; bottom: 0; height: 7px; background: url('${origin}/brand/hand-underline.svg') center / 100% 100% no-repeat; }
      .tools { position: absolute; left: 345px; right: 345px; bottom: 34px; display: flex; justify-content: space-between; border-top: 1px solid #363a37; padding-top: 18px; }
      .tool { display: flex; align-items: center; gap: 8px; }
      .tool img { width: 32px; height: 32px; }
      .tool span { color: #c7cbc4; font-size: 13px; font-weight: 650; letter-spacing: .4px; }
      .bottom { position: absolute; left: 48px; right: 48px; bottom: 34px; display: flex; justify-content: space-between; align-items: end; }
      .bottom span { color: #939a91; font-size: 11px; letter-spacing: 2px; }
      .bottom img { width: 155px; height: auto; max-height: 36px; object-fit: contain; }
      </style></head><body>
        <div class="edition"><span>THE DOCS COLLECTION</span><span>01 — 04 &nbsp; / &nbsp; ${lang.toUpperCase()}</span></div><div class="rule"></div>
        <main><img class="symbol" src="${origin}/brand/vora-works.svg" alt=""><h1 class="title"><span class="title-line">VORA <em>AI</em></span><span class="title-line works">DOCS</span></h1><p class="tagline">${text.hero1} ${text.hero2}</p><div class="claim">${text.free}</div><div class="download-note">${installCopy[lang].title}</div></main>
        <section class="tools">${products.map(product=>`<div class="tool"><img src="${origin}/brand/vora-${product.id}.svg" alt=""><span>${product.name}</span></div>`).join('')}</section>
        <footer class="bottom"><span>VORA.IM</span><img src="${origin}/brand/horizon-dark.webp" alt="Linkbricks Horizon-AI"></footer>
      </body></html>`);
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all(Array.from(document.images, image => image.decode()));
    });
    const brandBounds = await page.locator('.title-line').evaluateAll(lines => lines.map(line => {
      const range = document.createRange();
      range.selectNodeContents(line);
      const rect = range.getBoundingClientRect();
      return { left: rect.left, right: rect.right };
    }));
    if (brandBounds.some(bounds => bounds.left < 300 || bounds.right > 900)) throw new Error(`${lang}: brand would be clipped by a square thumbnail`);
    const vertical = await page.evaluate(() => ({ note: document.querySelector('.download-note').getBoundingClientRect().bottom, tools: document.querySelector('.tools').getBoundingClientRect().top }));
    if (vertical.note + 12 > vertical.tools) throw new Error(`${lang}: installation title overlaps product row: ${JSON.stringify(vertical)}`);
    const file = new URL(`../public${socialImagePath(lang)}`, import.meta.url).pathname;
    await page.screenshot({ path: file });
    console.log(`Generated ${lang} social card · 1200 × 630 · centered brand verified`);
  }
} finally {
  await browser.close();
}
