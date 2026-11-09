import {test, before, after} from 'node:test';
import assert from 'node:assert/strict';
import {createSiteServer} from '../scripts/serve.mjs';

let server;
let base;
before(async () => {
  server = createSiteServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  base = 'http://127.0.0.1:' + server.address().port;
});
after(async () => {
  await new Promise(resolve => server.close(resolve));
});

const pages = [
  ['/', 'Restaurant La Table'],
  ['/menu/pizza-margherita', 'Pizza Margherita'],
  ['/menu/risotto-champignons', 'Risotto aux champignons'],
];

test('Le HTML brut contient le contenu et les métadonnées de chaque route', async () => {
  const titles = new Set();
  const descriptions = new Set();
  for (const [route, name] of pages) {
    const response = await fetch(base + route);
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.ok(html.includes('<h1>' + name + '</h1>'));
    assert.equal((html.match(/<h1>/g) || []).length, 1);
    const head = html.split('</head>')[0];
    const title = head.match(/<title>(.*?)<\/title>/)[1];
    const description = head.match(/<meta name="description" content="([^"]+)"/)[1];
    assert.ok(title.length > 10 && title.length <= 60);
    assert.ok(description.length > 100);
    titles.add(title);
    descriptions.add(description);
    assert.equal((head.match(/rel="canonical"/g) || []).length, 1);
    assert.ok(head.includes('content="index,follow"'));
    assert.ok(!html.includes('<!--app-html-->'));
    assert.ok(!html.includes('<!--page-head-->'));
  }
  assert.equal(titles.size, 3);
  assert.equal(descriptions.size, 3);
});

test('Les liens des plats sont explorables sans hash routing', async () => {
  const html = await (await fetch(base)).text();
  assert.ok(html.includes('href="/menu/pizza-margherita"'));
  assert.ok(html.includes('href="/menu/risotto-champignons"'));
  assert.ok(!html.includes('href="#/'));
});

test('Le suivi Facebook ne change pas la canonical ni le contenu', async () => {
  const normal = await (await fetch(base + '/menu/pizza-margherita')).text();
  const tracked = await (await fetch(base + '/menu/pizza-margherita?utm_source=facebook')).text();
  assert.equal(normal, tracked);
  const canonical = normal.match(/rel="canonical" href="([^"]+)"/)[1];
  assert.ok(canonical.endsWith('/menu/pizza-margherita'));
  assert.ok(!canonical.includes('?'));
});

test('Un plat absent renvoie un vrai 404 avec noindex', async () => {
  for (const route of ['/menu/plat-absent', '/page-absente']) {
    const response = await fetch(base + route);
    assert.equal(response.status, 404);
    const html = await response.text();
    assert.ok(html.includes('<h1>Page introuvable</h1>'));
    assert.ok(html.includes('content="noindex,follow"'));
    assert.ok(!html.includes('rel="canonical"'));
  }
});

test('Le slash final est redirigé et le paramètre conservé', async () => {
  const response = await fetch(base + '/menu/pizza-margherita/?utm_source=facebook', {redirect:'manual'});
  assert.equal(response.status, 308);
  assert.equal(response.headers.get('location'), '/menu/pizza-margherita?utm_source=facebook');
});

test('Le sitemap ne contient que les trois pages indexables', async () => {
  const response = await fetch(base + '/sitemap.xml');
  assert.equal(response.status, 200);
  const xml = await response.text();
  assert.equal((xml.match(/<loc>/g) || []).length, 3);
  assert.ok(!xml.includes('/404'));
  const robots = await (await fetch(base + '/robots.txt')).text();
  assert.ok(robots.includes('Allow: /'));
  assert.ok(robots.includes('/sitemap.xml'));
});

test('Les scripts produits sont servis comme JavaScript et HEAD ne renvoie pas de corps', async () => {
  const html = await (await fetch(base)).text();
  const script = html.match(/<script[^>]*src="([^"]+)"/)[1];
  const response = await fetch(base + script);
  assert.equal(response.status, 200);
  assert.ok(response.headers.get('content-type').includes('javascript'));
  const head = await fetch(base + '/menu/pizza-margherita', {method:'HEAD'});
  assert.equal(head.status, 200);
  assert.equal(await head.text(), '');
});
