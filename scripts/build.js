import { cp, mkdir, writeFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const output = new URL('build/runtime/', root);
await mkdir(output, { recursive: true });
for (const name of ['server.js', 'demo-fixture.json', 'public']) {
  await cp(new URL(name, root), new URL(name, output), { recursive: true });
}
await writeFile(new URL('package.json', output), JSON.stringify({
  name: 'kestral-kids-demo', private: true, type: 'module',
  scripts: { start: 'node server.js' },
}, null, 2) + '\n');
console.log('Demo build saved to build/runtime');
