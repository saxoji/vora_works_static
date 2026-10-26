import { cp, mkdir, rm, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { generateConfig } from './config.mjs';
import { publishDesktopReleases } from './desktop-releases.mjs';
import { buildDesktopPages, desktopRoutes } from './desktop-pages.mjs';
import { renderDocument, routes } from './document.mjs';
const config = await generateConfig();
const root = fileURLToPath(new URL('../', import.meta.url));
const dist = new URL('../dist/', import.meta.url);
await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
const template = await readFile(`${root}index.html`, 'utf8');
for (const route of routes) {
  const directory = new URL(`.${route.path}`, dist);
  await mkdir(directory, { recursive: true });
  await writeFile(new URL('index.html', directory), renderDocument(template, config, route));
}
await cp(`${root}src`, new URL('src/', dist), { recursive: true });
await cp(`${root}public`, dist, { recursive: true });
const siteUrl = config.siteUrl;
await writeFile(new URL('robots.txt', dist), `User-agent: *\nAllow: /\n${siteUrl ? `Sitemap: ${new URL('/sitemap.xml', siteUrl).href}\n` : ''}`);
if (siteUrl) {
  const urls = [...routes, ...desktopRoutes.map(path => ({path}))].map(route => `<url><loc>${new URL(route.path, siteUrl).href.replaceAll('&', '&amp;')}</loc></url>`).join('\n  ');
  await writeFile(new URL('sitemap.xml', dist), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  ${urls}\n</urlset>\n`);
}

await publishDesktopReleases({ root: new URL('../', import.meta.url), dist, siteUrl: config.siteUrl });

await buildDesktopPages(config, dist);

console.log('Built static site → dist/ (20 prerendered pages, 3 languages, no runtime dependencies)');
