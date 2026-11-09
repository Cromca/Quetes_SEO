import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const dist = path.resolve(fileURLToPath(new URL('../dist/', import.meta.url)));
const mime = {'.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.xml':'application/xml; charset=utf-8', '.txt':'text/plain; charset=utf-8', '.svg':'image/svg+xml'};

export function createSiteServer() {
  return http.createServer(async (req, res) => {
    if (!['GET', 'HEAD'].includes(req.method)) {
      res.writeHead(405, {Allow:'GET, HEAD'}).end();
      return;
    }
    try {
      const url = new URL(req.url, 'http://localhost');
      let pathname;
      try {
        pathname = decodeURIComponent(url.pathname);
      } catch {
        res.writeHead(400).end('Adresse invalide');
        return;
      }
      if (pathname.includes('\\') || pathname.includes('\0') || pathname.split('/').some(part => part.startsWith('.'))) {
        res.writeHead(400).end('Adresse invalide');
        return;
      }
      let target = path.resolve(dist, '.' + pathname);
      if (target !== dist && !target.startsWith(dist + path.sep)) {
        res.writeHead(400).end('Adresse invalide');
        return;
      }
      let status = 200;
      try {
        if ((await fs.stat(target)).isDirectory()) {
          if (pathname !== '/' && pathname.endsWith('/')) {
            res.writeHead(308, {Location:pathname.slice(0,-1) + url.search}).end();
            return;
          }
          target = path.join(target, 'index.html');
        }
        if (target === path.join(dist, '404.html')) status = 404;
        await fs.access(target);
      } catch {
        status = 404;
        target = path.join(dist, '404.html');
      }
      const body = await fs.readFile(target);
      res.writeHead(status, {'Content-Type':mime[path.extname(target)] || 'application/octet-stream', 'Content-Length':body.length, 'X-Content-Type-Options':'nosniff'});
      res.end(req.method === 'HEAD' ? undefined : body);
    } catch {
      res.writeHead(500, {'Content-Type':'text/plain; charset=utf-8'}).end('Erreur du serveur. Vérifier que le build a été lancé.');
    }
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 5176);
  createSiteServer().listen(port, '127.0.0.1', () => console.log('Site pré-généré : http://localhost:' + port));
}
