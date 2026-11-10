// piezas-scenario: S-007 v=b6690ea1681b
import { expect, test } from '@playwright/test';
test('S-007: I can see what needs attention today', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('account-menu').click();
      await page.getByTestId('account-choice-'+'director').click();
  await expect(page.getByTestId('director-today-count')).toHaveText('2');
  await expect(page.getByTestId('director-group-count')).toHaveText('2');
  await page.getByTestId('director-incomplete-link').click();
  await expect(page.getByTestId('director-child-row')).toHaveCount(1);
  await expect(page.getByTestId('director-child-row')).toContainText('Noah Singh');
  await page.getByTestId('child-open-demo-child-02').click();
  await expect(page.getByTestId('child-dialog')).toContainText('Consent needed');
});
