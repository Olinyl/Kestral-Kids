// piezas-scenario: S-041 v=5b6deae4f8b4
import { expect, test } from '@playwright/test';

test('S-041: Patrol receives the latest Guardian update with a missing-child report', async ({page}) => {
  await page.goto('/?view=guardian');
  await page.locator('[data-consent]').first().click();
  for(const [name,value] of Object.entries({
    emergencyName:'Updated Guardian Contact',emergencyPhone:'6045550199',
    medical:'Updated asthma plan',medications:'Rescue inhaler in red jacket pocket',allergies:'Pollen',guardianSignature:'Demo Guardian',
  })) await page.getByTestId(`consent-${name}`).fill(value);
  await page.getByTestId('consent-emergencyRelationship').selectOption('Parent');
  await page.getByTestId('consent-emergencyRelationship2').selectOption('Aunt/Uncle');
  await page.locator('[data-required-check]').nth(0).check();
  await page.locator('[data-required-check]').nth(1).check();
  await page.getByRole('button',{name:'Save changes',exact:true}).click();

  await page.getByTestId('account-menu').click();
  await page.getByTestId('account-choice-instructor').click();
  await page.getByTestId('instructor-report-missing').click();
  await page.getByTestId('radio-child').selectOption('demo-child-01');
  await expect(page.getByTestId('radio-injuries')).toHaveValue(/Updated asthma plan.*Rescue inhaler.*Pollen/);
  await page.getByTestId('radio-place').fill('Lower lodge entrance');
  await page.getByTestId('radio-save').click();
  await expect(page.getByTestId('radio-alert-status')).toBeVisible();
  await page.getByTestId('ops-close').click();
  await page.getByTestId('account-menu').click();
  await page.getByTestId('account-choice-patrol').click();
  const alert=page.getByTestId('patrol-alert').filter({hasText:'Maya Chen'});
  await expect(alert).toContainText('Updated asthma plan');
  await expect(alert).toContainText('Rescue inhaler in red jacket pocket');
  await expect(alert).toContainText('Updated Guardian Contact');
  await expect(alert).toContainText('604-555-0199');
  await expect(alert).toContainText('Pollen');
  await expect(alert).toContainText('Alyssa Chen');
  await expect(alert).toContainText('Daniel Chen');
});
