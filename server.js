import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';

const routes = new Map([
  ['/', ['public/index.html', 'text/html; charset=utf-8']],
  ['/workspace.js', ['public/workspace.js', 'text/javascript; charset=utf-8']],
  ['/styles.css', ['public/styles.css', 'text/css; charset=utf-8']],
  ['/demo-fixture.json', ['demo-fixture.json', 'application/json; charset=utf-8']],
]);

const server = createServer(async (request, response) => {
  const route = routes.get(request.url.split('?')[0]);
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
