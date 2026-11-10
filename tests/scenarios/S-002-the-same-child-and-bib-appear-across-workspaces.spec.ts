// piezas-scenario: S-002 v=21ff2e29489c
import { expect, test } from '@playwright/test';

test('S-002: The same child and bib appear across workspaces', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  expect((await page.goto('/'))?.status()).toBe(200);
  await page.getByTestId('roster-search').fill('214');
  const rows = page.getByTestId('roster-row');
  await expect(rows).toHaveCount(1);
  await expect(rows.first().locator('strong')).toHaveText('Maya Chen');
  await expect(rows.first().locator('.bib')).toHaveText('Bib 214');
  await page.getByTestId('account-menu').click();
      await page.getByTestId('account-choice-'+'instructor').click();
  await expect(rows).toHaveCount(1);
  await expect(rows.first().locator('strong')).toHaveText('Maya Chen');
  await expect(rows.first().locator('.bib')).toHaveText('Bib 214');
  await page.reload();
  await expect(page.getByTestId('roster-search')).toBeVisible();
  await expect(rows).toHaveCount(2);
});
