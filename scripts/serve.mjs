import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { generateConfig } from './config.mjs';
import { renderDocument, routes } from './document.mjs';
import { renderHwpPage, hwpRoutes } from './hwp-page.mjs';
const built = process.argv.includes('dist');
const config = !built ? await generateConfig() : null;
const root = path.resolve(built ? 'dist' : '.');
const port = Number(process.env.PORT || 4173);
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2', '.jpg': 'image/jpeg', '.txt': 'text/plain', '.xml': 'application/xml' };
http.createServer(async (req, res) => {
  try {
    const requested = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (!built && hwpRoutes.some(route => route === requested || route.slice(0, -1) === requested)) {
      let manifest = null;
      try { const catalog = JSON.parse(await readFile(path.join(root, 'releases/hwp/catalog.json'), 'utf8')); manifest = catalog.releases.find(release => release.manifest.version === catalog.stableVersion)?.manifest || null; } catch {}
      const lang = requested.match(/\/(ko|en|ja)\/?$/)?.[1] || 'ko';
      res.writeHead(200, {'Content-Type':mime['.html'], 'Cache-Control':'no-cache'});
      res.end(renderHwpPage(config, lang, manifest, requested.endsWith('/') ? requested : requested + '/'));
      return;
    }
    const route = routes.find(route => route.path === requested || route.path.slice(0, -1) === requested);
    if (!built && route) {
      res.writeHead(200, { 'Content-Type': mime['.html'], 'Cache-Control': 'no-cache' });
      res.end(renderDocument(await readFile(path.join(root, 'index.html'), 'utf8'), config, route));
      return;
    }
    const resource = route ? `${route.path}index.html` : requested;
    const asset = !built && !resource.startsWith('/src/') && resource !== '/index.html' ? `/public${resource}` : resource;
    let file = path.resolve(root, `.${asset}`);
    if (!file.startsWith(`${root}${path.sep}`)) throw new Error('Not found');
    if ((await stat(file)).isDirectory()) file = path.join(file, 'index.html');
    if (!(await stat(file)).isFile()) throw new Error('Not found');
    res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(await readFile(file));
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  }
}).listen(port, '127.0.0.1', () => console.log(`VORA WORKS preview: http://127.0.0.1:${port}`));
