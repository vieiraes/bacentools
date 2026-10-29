// Servidor estático mínimo do build (out/) para os testes E2E, com os redirecionamentos do firebase.json.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const ROOT = new URL('../out/', import.meta.url).pathname;
const PORT = Number(process.env.PORT ?? 4180);
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.txt': 'text/plain', '.xml': 'application/xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
const REDIRECTS = [[/^\/banks(\/.*)?$/, '/bancos/'], [/^\/pix-participants(\/.*)?$/, '/participantes-pix/']];

createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const r = REDIRECTS.find(([re]) => re.test(path));
  if (r) { res.writeHead(301, { Location: r[1] }); return res.end(); }
  let file = normalize(join(ROOT, path));
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  try {
    if ((await stat(file)).isDirectory()) file = join(file, 'index.html');
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream' });
    res.end(await readFile(file));
  } catch {
    res.writeHead(404, { 'Content-Type': TYPES['.html'] });
    res.end(await readFile(join(ROOT, '404.html')).catch(() => 'not found'));
  }
}).listen(PORT, () => console.log(`servindo out/ em http://localhost:${PORT}`));
