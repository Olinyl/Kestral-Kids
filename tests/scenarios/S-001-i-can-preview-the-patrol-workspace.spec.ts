// piezas-scenario: S-001 v=d4d7614f90dd
import { expect, test } from '@playwright/test';

test('S-001: I can preview the Patrol workspace', async ({ page }) => {
  const response = await page.goto('/');
  expect(response?.status()).toBe(200);
  await expect(page.getByTestId('workspace-title')).toHaveText('School desk workspace');
  await page.getByTestId('view-as').selectOption('patrol');
  await expect(page.getByTestId('workspace-title')).toHaveText('Patrol workspace');
  await expect(page.getByTestId('workspace-nav')).toHaveText('Active alerts');
  await expect(page.getByTestId('demo-banner')).toBeVisible();
});
