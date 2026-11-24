const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const root = __dirname;
const port = Number(process.env.PORT || 3000);
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

http.createServer((request, response) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  } catch {
    response.writeHead(400).end('Bad request');
    return;
  }

  const relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const normalizedPath = path.normalize(relativePath);
  if (path.isAbsolute(normalizedPath) || normalizedPath === '..' || normalizedPath.startsWith(`..${path.sep}`)) {
    response.writeHead(403).end('Forbidden');
    return;
  }

  const rootFile = path.join(root, normalizedPath);
  const publicFile = path.join(root, 'public', normalizedPath);
  const candidates = normalizedPath === 'index.html' ? [rootFile] : [rootFile, publicFile];

  const serveNext = (index) => {
    if (index >= candidates.length) {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Not found');
      return;
    }

    const filePath = candidates[index];
    fs.readFile(filePath, (error, data) => {
      if (error) {
        if (error.code === 'ENOENT' || error.code === 'EISDIR') return serveNext(index + 1);
        response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Server error');
        return;
      }

      response.writeHead(200, {
        'Content-Type': types[path.extname(filePath)] || 'application/octet-stream',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
      });
      response.end(data);
    });
  };

  serveNext(0);
}).listen(port, '0.0.0.0', () => {
  console.log(`Eduardo Duarte gallery listening on http://0.0.0.0:${port}`);
});
