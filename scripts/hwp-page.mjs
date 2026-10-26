import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { copy, languages } from '../public/downloads/hwp/content.js';
import { renderBody, escape, validArtifacts } from '../public/downloads/hwp/view.js';
export const hwpRoutes = ['/downloads/hwp/', ...languages.map(lang => `/downloads/hwp/${lang}/`)];
export function renderHwpPage(config, lang, manifest, path = `/downloads/hwp/${lang}/`) {
  const t = copy[lang], origin = config.siteUrl, absolute = path => new URL(path, origin).href;
  const artifacts = validArtifacts(manifest, origin);
  const title = t.pageTitle, description = t.description, image = absolute(`/brand/hwp-desktop-${lang}-v1.png`);
  const json = data => JSON.stringify(data).replaceAll('<', '\\u003c');
  const structured = {'@context':'https://schema.org','@type':'SoftwareApplication', name:'VORA HWP', applicationCategory:'ProductivityApplication', url:absolute(path), description, image,
    operatingSystem:[...new Set(artifacts.map(a => ({macos:'macOS (Apple Silicon)',windows:'Windows',linux:'Linux'}[a.platform])))].join(', '),
    ...(artifacts.length ? {softwareVersion:manifest.version,downloadUrl:artifacts.filter(a => a.format !== 'zip').map(a => a.url)} : {}),
    author:{'@type':'Organization',name:'Linkbricks Horizon-AI',url:config.companyUrl,logo:absolute('/brand/horizon-light.webp')}, inLanguage:lang};
  return `<!doctype html><html lang="${lang}" data-theme="system"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)}</title><meta name="description" content="${escape(description)}"><meta name="robots" content="index,follow"><link rel="canonical" href="${escape(absolute(path))}">${languages.map(code => `<link rel="alternate" hreflang="${code}" href="${absolute(`/downloads/hwp/${code}/`)}">`).join('')}<link rel="alternate" hreflang="x-default" href="${absolute('/downloads/hwp/')}"><meta property="og:type" content="website"><meta property="og:site_name" content="VORA WORKS"><meta property="og:title" content="${escape(title)}"><meta property="og:description" content="${escape(description)}"><meta property="og:url" content="${escape(absolute(path))}"><meta property="og:locale" content="${{ko:'ko_KR',en:'en_US',ja:'ja_JP'}[lang]}">${languages.filter(code => code !== lang).map(code => `<meta property="og:locale:alternate" content="${{ko:'ko_KR',en:'en_US',ja:'ja_JP'}[code]}">`).join('')}<meta property="og:image" content="${image}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="VORA HWP · ${escape(t.shareDescription)}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escape(title)}"><meta name="twitter:description" content="${escape(description)}"><meta name="twitter:image" content="${image}"><meta name="twitter:image:alt" content="VORA HWP · ${escape(t.shareDescription)}"><meta name="theme-color" content="#151718" media="(prefers-color-scheme:dark)"><meta name="theme-color" content="#f7f7f4" media="(prefers-color-scheme:light)"><link rel="icon" type="image/svg+xml" href="/brand/vora-hwp.svg"><link rel="stylesheet" href="/downloads/hwp/style.css"><script>try{const t=new URL(location.href).searchParams.get('theme')||localStorage.getItem('vora-works-theme-v1');document.documentElement.dataset.theme=['light','dark'].includes(t)?t:'system'}catch{}</script><script type="application/ld+json">${json(structured)}</script><script type="application/json" id="release-data">${json(manifest)}</script><script type="module" src="/downloads/hwp/page.js"></script></head><body><div id="app">${renderBody(lang, config, manifest)}</div></body></html>`;
}
export async function buildHwpPages(config, dist) {
  let manifest = null;
  try { manifest = JSON.parse(await readFile(new URL('releases/hwp/stable.json', dist), 'utf8')); } catch(error) { if(error.code !== 'ENOENT') throw error; }
  for (const path of hwpRoutes) {
    const lang = path.match(/\/(ko|en|ja)\/$/)?.[1] || 'ko';
    const directory = new URL(`.${path}`, dist);
    await mkdir(directory, {recursive:true});
    await writeFile(new URL('index.html', directory), renderHwpPage(config, lang, manifest, path));
  }
}
