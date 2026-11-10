// piezas-scenario: S-009 v=dd4be1b01f2b
import { expect, test } from '@playwright/test';
test('S-009: I can update a guardian contact', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('account-menu').click();
      await page.getByTestId('account-choice-'+'director').click();
  await page.getByTestId('director-nav-children').click();
  await page.getByTestId('manage-guardians').click();
  await page.getByTestId('guardian-open-demo-guardian-01').click();
  await page.getByTestId(/^profile-edit-/).click();
  await expect(page.getByTestId('guardian-dialog')).toContainText('Maya Chen');
  await page.getByTestId('guardian-phone').fill('+1 604 555 0188');
  await page.getByTestId('guardian-save').click();
  if(await page.getByTestId(/^(child|guardian|instructor|group)-profile$/).isVisible()) await page.getByTestId("dialog-close").click();
  await expect(page.getByTestId('guardian-dialog')).not.toBeVisible();
  await expect(page.getByTestId('director-guardian-row').filter({ hasText: 'Alyssa Chen' })).toContainText('+1 604 555 0188');
});
