// piezas-scenario: S-012 v=675acdad9e36
import { expect, test } from '@playwright/test';
test('S-012: Director works on phone and keyboard', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByTestId('account-menu').click();
      await page.getByTestId('account-choice-'+'director').click();
  await page.getByTestId('director-nav-children').click();
  await page.getByTestId('director-search').fill('Nobody Matches');
  await expect(page.getByTestId('director-empty')).toContainText('No children match');
  await page.getByTestId('director-search').fill('');
  await expect(page.getByTestId('director-child-row')).toHaveCount(2);
  await page.getByTestId('child-open-demo-child-01').click();
  await page.getByTestId(/^profile-edit-/).click();
  await expect(page.getByTestId('child-dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  if(await page.getByTestId(/^(child|guardian|instructor|group)-profile$/).isVisible()) await page.getByTestId("dialog-close").click();
  await expect(page.getByTestId('child-dialog')).not.toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
