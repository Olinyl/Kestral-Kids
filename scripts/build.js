import { cp, mkdir, writeFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const output = new URL('build/runtime/', root);
const preview = new URL('build/preview/', root);
await mkdir(output, { recursive: true });
for (const name of ['server.js', 'demo-fixture.json', 'public', 'lib']) {
  await cp(new URL(name, root), new URL(name, output), { recursive: true });
}
await writeFile(new URL('package.json', output), JSON.stringify({
  name: 'kestral-kids-demo', private: true, type: 'module',
  scripts: { start: 'node server.js' },
  dependencies: { '@piezas/sdk': '^0.5.2' },
}, null, 2) + '\n');
console.log('Demo build saved to build/runtime');
await mkdir(preview, { recursive: true });
for (const name of ['index.html', 'workspace.js', 'live.js', 'styles.css', 'director.js', 'director.css', 'operations.js', 'operations.css', 'patrol.js', 'patrol.css', 'grouping.js', 'guardian.js', 'store-import.js']) {
  await cp(new URL('public/' + name, root), new URL(name, preview));
}
await cp(new URL('node_modules/@piezas/sdk/dist/report-problem/widget.js', root), new URL('report-problem-widget.js', preview));
await cp(new URL('demo-fixture.json', root), new URL('demo-fixture.json', preview));
console.log('Static team preview saved to build/preview');
