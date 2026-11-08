// piezas-scenario: S-008 v=dab6450f2216
import { expect, test } from '@playwright/test';
test('S-008: I can find and update a child', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('view-as').selectOption('director');
  await page.getByTestId('director-nav-children').click();
  await page.getByTestId('director-search').fill('Noah');
  await expect(page.getByTestId('director-child-row')).toHaveCount(1);
  await page.getByTestId('child-open-demo-child-02').click();
  await page.getByTestId('child-emergency-phone').fill('abc');
  await page.getByTestId('child-save').click();
  await expect(page.getByTestId('form-error')).toContainText('valid phone');
  await page.getByTestId('child-emergency-phone').fill('+1 604 555 0199');
  await page.getByTestId('child-medical').fill('Carries an inhaler.');
  await page.getByTestId('child-save').click();
  await expect(page.getByTestId('child-dialog')).not.toBeVisible();
  await page.getByTestId('child-open-demo-child-02').click();
  await expect(page.getByTestId('child-emergency-phone')).toHaveValue('+1 604 555 0199');
  await expect(page.getByTestId('child-medical')).toHaveValue('Carries an inhaler.');
  await expect(page.getByTestId('child-consent')).toHaveText('Consent needed \u2014 guardian action required');
  await expect(page.getByTestId('child-dialog').getByRole('checkbox')).toHaveCount(0);
});
