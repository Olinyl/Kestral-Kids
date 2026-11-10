// piezas-scenario: S-011 v=9a368dcca2b1
import { expect, test } from '@playwright/test';
test('S-011: Demo changes stay consistent and reset', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('account-menu').click();
      await page.getByTestId('account-choice-'+'director').click();
  await page.getByTestId('director-nav-children').click();
  await page.getByTestId('child-open-demo-child-01').click();
  await page.getByTestId(/^profile-edit-/).click();
  await page.getByTestId('child-name').fill('Maya Demo');
  await page.getByTestId('child-save').click();
  if(await page.getByTestId(/^(child|guardian|instructor|group)-profile$/).isVisible()) await page.getByTestId("dialog-close").click();
  await page.getByTestId('account-menu').click();
      await page.getByTestId('account-choice-'+'desk').click();
  await expect(page.getByTestId('roster-row').filter({ hasText: 'Bib 214' })).toContainText('Maya Demo');
  await page.getByTestId('account-menu').click();
      await page.getByTestId('account-choice-'+'director').click();
  await page.getByTestId('director-nav-children').click();
  await expect(page.getByTestId('director-child-row').filter({ hasText: 'Maya Demo' })).toBeVisible();
  await page.reload();
  await page.getByTestId('account-menu').click();
      await page.getByTestId('account-choice-'+'director').click();
  await page.getByTestId('director-nav-children').click();
  await expect(page.getByTestId('director-child-row').filter({ hasText: 'Maya Chen' })).toBeVisible();
  await expect(page.getByTestId('demo-banner')).toBeVisible();
});
