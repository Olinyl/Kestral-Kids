import { defineConfig, devices } from '@playwright/test';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const projectBrowsers = resolve('node_modules/.cache/ms-playwright');
if (!process.env.PLAYWRIGHT_BROWSERS_PATH && existsSync(projectBrowsers)) {
  process.env.PLAYWRIGHT_BROWSERS_PATH = projectBrowsers;
}

// The Piezas scenario harness. `npx piezas test` runs this suite against a
// SEPARATE test copy of the app (PIEZAS_TEST_API_KEY, from `piezas test --setup`),
// never the live one, and writes .piezas/test-attestation.json — the record
// `npx piezas deploy` requires. The app is started here on its own port with
// the test copy's key. PW_BASE_URL points the suite at an app that is already
// running (previews, clips); `piezas test` ignores it unless
// PIEZAS_TEST_ALLOW_EXTERNAL_SERVER=1, since that app may use the live key.
const port = Number(process.env.PIEZAS_TEST_PORT || 3100);

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  outputDir: './.piezas/test-results/raw',
  fullyParallel: true,
  forbidOnly: true,
  retries: 1,
  reporter: 'list',
  use: {
    baseURL: process.env.PW_BASE_URL || `http://localhost:${port}`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: process.env.PW_BASE_URL
    ? undefined
    : {
        command: process.env.PIEZAS_TEST_SERVER_CMD || 'node server.js',
        port,
        reuseExistingServer: false,
        timeout: 120_000,
        env: { PORT: String(port), HOST: '127.0.0.1' },
      },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
