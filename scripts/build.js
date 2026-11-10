import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const output = new URL('build/runtime/', root);
const preview = new URL('build/preview/', root);
await mkdir(output, { recursive: true });
for (const name of ['server.js', 'demo-fixture.json', 'public', 'lib']) {
  await cp(new URL(name, root), new URL(name, output), { recursive: true });
}
const runtimeIndex=new URL('public/index.html',output);
await writeFile(runtimeIndex,(await readFile(runtimeIndex,'utf8')).replace('<body data-account-preview>','<body>'));
await writeFile(new URL('package.json', output), JSON.stringify({
  name: 'kestral-kids-demo', private: true, type: 'module',
  scripts: { start: 'node server.js' },
  dependencies: { '@piezas/sdk': '^0.5.2' },
}, null, 2) + '\n');
console.log('Demo build saved to build/runtime');
await mkdir(preview, { recursive: true });
for (const name of ['index.html', 'workspace.js', 'styles.css', 'director.js', 'director.css', 'operations.js', 'operations.css', 'patrol.js', 'patrol.css', 'grouping.js', 'guardian.js', 'store-import.js', 'profile-ui.js', 'activity-log.js', 'alerts.js', 'alerts.css', 'registration-import.js', 'registration-csv.js']) {
  await cp(new URL('public/' + name, root), new URL(name, preview));
}
let previewIndex=await readFile(new URL('public/index.html',root),'utf8');
previewIndex=previewIndex
  .replace(/\s*<button type="button" class="live-sign-in"[\s\S]*?<\/button>/,'')
  .replace(/\s*<dialog id="staff-dialog"[\s\S]*?<\/dialog>/,'')
  .replace(/\s*<dialog id="live-report-dialog"[\s\S]*?<\/dialog>/,'')
  .replace(/\s*<script type="module" src="\/live\.js"><\/script>/,'');
await writeFile(new URL('index.html',preview),previewIndex);
await cp(new URL('demo-fixture.json', root), new URL('demo-fixture.json', preview));
console.log('Static team preview saved to build/preview');
