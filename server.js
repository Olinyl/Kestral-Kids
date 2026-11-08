import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';

const routes = new Map([
  ['/', ['public/index.html', 'text/html; charset=utf-8']],
  ['/workspace.js', ['public/workspace.js', 'text/javascript; charset=utf-8']],
  ['/guardian.js', ['public/guardian.js', 'text/javascript; charset=utf-8']],
  ['/styles.css', ['public/styles.css', 'text/css; charset=utf-8']],
  ['/director.js', ['public/director.js', 'text/javascript; charset=utf-8']],
  ['/grouping.js', ['public/grouping.js', 'text/javascript; charset=utf-8']],
  ['/director.css', ['public/director.css', 'text/css; charset=utf-8']],
  ['/operations.js', ['public/operations.js', 'text/javascript; charset=utf-8']],
  ['/operations.css', ['public/operations.css', 'text/css; charset=utf-8']],
  ['/patrol.js', ['public/patrol.js', 'text/javascript; charset=utf-8']],
  ['/patrol.css', ['public/patrol.css', 'text/css; charset=utf-8']],
  ['/demo-fixture.json', ['demo-fixture.json', 'application/json; charset=utf-8']],
]);

const server = createServer(async (request, response) => {
  const pathname = request.url.split('?')[0];
  const local = ['127.0.0.1','::1','::ffff:127.0.0.1'].includes(request.socket.remoteAddress);
  const prototypeRoutes = new Map([
    ['/prototype', ['public/index.html', 'text/html; charset=utf-8']],
    ['/prototype-fixtures.js', ['prototype/fixtures.js', 'text/javascript; charset=utf-8']],
  ]);
  const route = routes.get(pathname) ?? (local ? prototypeRoutes.get(pathname) : undefined);
  if (!route || !['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(route ? 405 : 404).end();
    return;
  }

  try {
    const [filename, contentType] = route;
    const file = await readFile(new URL(filename, import.meta.url));
    response.writeHead(200, { 'Content-Type': contentType, 'X-Content-Type-Options': 'nosniff' });
    response.end(request.method === 'HEAD' ? undefined : file);
  } catch (error) {
    console.error(error.message);
    response.writeHead(500).end('Unable to load the demo.');
  }
});

server.listen(Number(process.env.PORT ?? 3000), process.env.HOST ?? (process.env.PORT ? '0.0.0.0' : '127.0.0.1'), () => {
  console.log('Kestrel Kids ready on port ' + server.address().port);
});
