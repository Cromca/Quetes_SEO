import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {render, routes, origin} from '../dist-server/entry-server.js';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const template = await fs.readFile(path.join(dist, 'index.html'), 'utf8');
if (!template.includes('<!--page-head-->') || !template.includes('<!--app-html-->')) {
  throw new Error('Les emplacements de pré-rendu sont absents du HTML.');
}
const escape = value => value.replace(/[&<>"']/g, char => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[char]));
for (const route of [...routes, '/404']) {
  const {html, metadata} = render(route);
  const head = [
    '<title>' + escape(metadata.title) + '</title>',
    '<meta name="description" content="' + escape(metadata.description) + '">',
    '<meta name="robots" content="' + metadata.robots + '">',
    ...(metadata.canonical ? ['<link rel="canonical" href="' + escape(metadata.canonical) + '">'] : []),
  ].join('\n    ');
  const output = route === '/404' ? path.join(dist, '404.html') : path.join(dist, route.slice(1), 'index.html');
  await fs.mkdir(path.dirname(output), {recursive:true});
  await fs.writeFile(output, template.replace('<!--page-head-->', head).replace('<!--app-html-->', html));
}
await fs.writeFile(path.join(dist, 'sitemap.xml'),
  '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
  routes.map(route => '<url><loc>' + escape(origin + route) + '</loc></url>').join('') + '</urlset>\n');
await fs.writeFile(path.join(dist, 'robots.txt'), 'User-agent: *\nAllow: /\nSitemap: ' + origin + '/sitemap.xml\n');
console.log(routes.length + ' pages HTML pré-générées, une page 404 et un sitemap.');
