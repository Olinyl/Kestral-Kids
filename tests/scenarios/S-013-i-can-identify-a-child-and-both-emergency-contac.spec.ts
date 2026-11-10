// piezas-scenario: S-013 v=c2505ef2966d
import { expect, test } from '@playwright/test';
test('S-013: Both emergency contacts and one child identity', async ({ page }) => {
 await page.goto('/?view=director');
 await page.getByTestId('director-nav-children').click();
 await page.getByTestId('director-search').fill('Noah Kaur-Singh');
 await expect(page.getByTestId('director-child-row')).toHaveCount(1);
 await page.getByTestId('child-open-demo-child-02').click();
  await page.getByTestId(/^profile-edit-/).click();
 await expect(page.getByTestId('child-record-id')).toContainText('demo-child-02');
 await page.getByTestId('child-emergency-name2').fill('Arjun Singh');
 await page.getByTestId('child-emergency-phone2').fill('6045550112');
 await page.getByTestId('child-medical-status').selectOption('none');
 await page.getByTestId('child-medical').fill('No conditions or allergies reported by guardian.');
 await page.getByTestId('child-save').click();
  if(await page.getByTestId(/^(child|guardian|instructor|group)-profile$/).isVisible()) await page.getByTestId("dialog-close").click();
 await expect(page.getByTestId('director-child-row')).toContainText('Consent needed');
 await page.getByTestId('child-open-demo-child-02').click();
  await page.getByTestId(/^profile-edit-/).click();
 await expect(page.getByTestId('child-emergency-name')).toHaveValue('Priya Singh');
 await expect(page.getByTestId('child-emergency-name2')).toHaveValue('Arjun Singh');
 await expect(page.getByTestId('child-emergency-phone2')).toHaveValue('+1 604 555 0112');
});

test('S-013: Empty medical notes keep a profile incomplete', async ({ page }) => {
  await page.goto('/?view=director');
  await page.getByTestId('director-nav-children').click();
  await page.getByTestId('child-open-demo-child-01').click();
  await page.getByTestId(/^profile-edit-/).click();
  await page.getByTestId('child-medical-status').selectOption('none');
  await page.getByTestId('child-medical').fill('');
  await page.getByTestId('child-save').click();
  if(await page.getByTestId(/^(child|guardian|instructor|group)-profile$/).isVisible()) await page.getByTestId("dialog-close").click();
  const maya = page.getByTestId('director-child-row').filter({ hasText: 'Maya Chen' });
  await expect(maya).toContainText('Medical information missing');
  await expect(maya).toContainText('Needs attention');
});
