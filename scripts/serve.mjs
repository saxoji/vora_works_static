import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { generateConfig } from './config.mjs';
const built = process.argv.includes('dist');
if (!built) await generateConfig();
const root = path.resolve(built ? 'dist' : '.');
const port = Number(process.env.PORT || 4173);
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2', '.jpg': 'image/jpeg', '.txt': 'text/plain' };
http.createServer(async (req, res) => {
  try {
    const requested = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const resource = requested === '/' ? '/index.html' : requested;
    const asset = !built && !resource.startsWith('/src/') && resource !== '/index.html' ? `/public${resource}` : resource;
    const file = path.resolve(root, `.${asset}`);
    if (!file.startsWith(`${root}${path.sep}`) || !(await stat(file)).isFile()) throw new Error('Not found');
    res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(await readFile(file));
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  }
}).listen(port, '127.0.0.1', () => console.log(`VORA WORKS preview: http://127.0.0.1:${port}`));
