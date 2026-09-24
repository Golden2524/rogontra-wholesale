import { createReadStream, existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, resolve, sep } from 'node:path';

const root = resolve('.');
const port = Number(process.env.STOREFRONT_PORT ?? 5500);
const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml'
};

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('STOREFRONT_PORT must be an integer between 1 and 65535.');
}

const server = createServer((request, response) => {
  const pathname = new URL(request.url, `http://${request.headers.host}`).pathname;
  const relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const target = resolve(root, relativePath);
  if (!target.startsWith(`${root}${sep}`) || !existsSync(target)) {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Not found');
    return;
  }
  response.writeHead(200, {
    'Content-Type': contentTypes[extname(target)] ?? 'application/octet-stream'
  });
  createReadStream(target).pipe(response);
});

server.listen(port, '127.0.0.1', () => {
  console.info(`Rogontra storefront is available at http://127.0.0.1:${port}.`);
});

function closeServer() {
  server.close(() => process.exit(0));
}

process.once('SIGINT', closeServer);
process.once('SIGTERM', closeServer);
