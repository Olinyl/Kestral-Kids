import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { liveHandler, reportProblemRoute, initializeLive } from './lib/live-workflow.js';

const routes = new Map([
  ['/', ['public/index.html', 'text/html; charset=utf-8']],
  ['/workspace.js', ['public/workspace.js', 'text/javascript; charset=utf-8']],
  ['/store-import.js', ['public/store-import.js', 'text/javascript; charset=utf-8']],
  ['/live.js', ['public/live.js', 'text/javascript; charset=utf-8']],
  ['/report-problem-widget.js', ['node_modules/@piezas/sdk/dist/report-problem/widget.js', 'text/javascript; charset=utf-8']],
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
  if (pathname.startsWith('/api/')) {
    try {
      const forwardedProto=String(request.headers['x-forwarded-proto']||'http').split(',')[0].trim();
      const webRequest = new Request(new URL(request.url, `${forwardedProto}://${request.headers.host || 'localhost'}`), {
        method: request.method,
        headers: request.headers,
        body: ['GET','HEAD'].includes(request.method) ? undefined : await new Promise((resolve,reject) => {
          const chunks=[]; request.on('data',chunk=>chunks.push(chunk)); request.on('end',()=>resolve(Buffer.concat(chunks))); request.on('error',reject);
        }),
      });
      let result = await liveHandler(webRequest);
      if (!result && pathname === '/api/piezas/report') {
        const handlers=reportProblemRoute();
        result=request.method==='GET'?await handlers.GET(webRequest):await handlers.POST(webRequest);
      }
      if (!result) { response.writeHead(404).end(); return; }
      response.writeHead(result.status,Object.fromEntries(result.headers));
      response.end(Buffer.from(await result.arrayBuffer()));
    } catch (error) { console.error(error.message); response.writeHead(500).end('The live workflow could not complete.'); }
    return;
  }
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
  if (process.env.PIEZAS_API_KEY) initializeLive().catch(error => console.error('Piezas startup:',error.message));
});
