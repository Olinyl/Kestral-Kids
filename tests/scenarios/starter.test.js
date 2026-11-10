import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { before, after, test } from 'node:test';

const { chromium } = await import(process.env.KESTREL_PLAYWRIGHT_MODULE || 'playwright');
let server;
let browser;
let url;

before(async () => {
  server = spawn(process.execPath, ['server.js'], {
    cwd: process.env.KESTREL_TEST_ROOT || new URL('../../', import.meta.url),
    env: { ...process.env, PORT: '0', HOST: '127.0.0.1' },
    stdio: ['ignore', 'pipe', 'inherit'],
  });
  const [line] = await once(server.stdout, 'data');
  url = 'http://127.0.0.1:' + line.toString().match(/port (\d+)/)[1];
  browser = await chromium.launch({ executablePath: process.env.KESTREL_BROWSER });
});

after(async () => {
  try { await browser?.close(); } finally { server?.kill(); }
});

test('S-001: switching to Patrol changes the title and navigation', async () => {
  const page = await browser.newPage();
  try {
    assert.equal((await page.goto(url)).status(), 200);
    await page.getByTestId('account-menu').click(); await page.getByTestId('account-choice-patrol').click();
    assert.equal(await page.getByTestId('workspace-title').textContent(), 'Patrol workspace');
    assert.equal(await page.getByTestId('workspace-nav').textContent(), 'Active alerts');
    assert.ok(await page.getByTestId('demo-banner').isVisible());
  } finally { await page.close(); }
});

test('S-002: Desk and Instructor share the same seeded child and bib', async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  try {
    assert.equal((await page.goto(url)).status(), 200);
    await page.getByTestId('roster-search').fill('214', { timeout: 2500 });
    const rows = page.getByTestId('roster-row');
    assert.equal(await rows.count(), 1);
    assert.equal(await rows.first().locator('strong').textContent(), 'Maya Chen');
    assert.equal(await rows.first().locator('.bib').textContent(), 'Bib 214');
    await page.getByTestId('account-menu').click(); await page.getByTestId('account-choice-instructor').click();
    await rows.first().waitFor({ state: 'visible', timeout: 2500 });
    assert.equal(await rows.count(), 1);
    assert.equal(await rows.first().locator('strong').textContent(), 'Maya Chen');
    assert.equal(await rows.first().locator('.bib').textContent(), 'Bib 214');
    await page.reload();
    await page.getByTestId('roster-search').waitFor({ timeout: 2500 });
    assert.equal(await rows.count(), 2);
  } finally { await page.close(); }
});
