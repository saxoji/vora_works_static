// Local page/SEO QA only. Never writes dist or downloads/publishes installers.
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { generateConfig } from './config.mjs';
import { renderDocument, routes } from './document.mjs';
import { buildDesktopPages, desktopRoutes } from './desktop-pages.mjs';
import { products } from '../public/downloads/shared/content.js';
import { currentManifest } from '../public/downloads/shared/releases.js';
const root = new URL('../', import.meta.url);
const output = new URL('output/install-guide-preview/', root);
const config = await generateConfig();
await rm(output, {recursive:true,force:true});
await mkdir(output, {recursive:true});
await cp(new URL('public/',root), output, {recursive:true});
await cp(new URL('src/',root), new URL('src/',output), {recursive:true});
const template = await readFile(new URL('index.html',root),'utf8');
for (const route of routes) {
  const directory = new URL(`.${route.path}`,output);
  await mkdir(directory,{recursive:true});
  await writeFile(new URL('index.html',directory),renderDocument(template,config,route));
}
for (const product of Object.keys(products)) {
  const catalog = JSON.parse(await readFile(new URL(`releases/${product}/catalog.json`,root),'utf8'));
  const directory = new URL(`releases/${product}/`,output);
  await mkdir(directory,{recursive:true});
  await writeFile(new URL('stable.json',directory),JSON.stringify(currentManifest(catalog,product),null,2));
}
await buildDesktopPages(config,output);
const paths=[...routes.map(route=>route.path),...desktopRoutes];
await writeFile(new URL('sitemap.xml',output),`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map(path=>`<url><loc>${new URL(path,config.siteUrl).href}</loc></url>`).join('')}</urlset>`);
await writeFile(new URL('robots.txt',output),`User-agent: *\nDisallow: /\n`);
console.log(`Built ${paths.length} local preview pages → output/install-guide-preview/; installer files intentionally omitted. Production build unchanged: npm run build.`);
