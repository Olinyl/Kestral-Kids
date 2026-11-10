// piezas-scenario: S-032 v=aff490ac2248
import {expect,test} from '@playwright/test';

test('overview shows all consent and medical profiles and previews reminders',async({page})=>{
  await page.goto('/prototype?view=director&data=200');
  await expect(page.getByTestId('director-missing-consent')).toContainText('Missing consent forms');
  expect(await page.getByTestId('director-medical-list').getByTestId('director-overview-profile').count()).toBeGreaterThan(5);
  await page.getByTestId('consent-remind-all').click();
  await expect(page.getByTestId('parent-alert-dialog')).toContainText('No real messages');
  await page.getByTestId('parent-alert-submit').click();
  await expect(page.getByTestId('director-feedback')).toContainText('preview');
  await page.getByTestId('director-notifications').click();
  await expect(page.getByTestId('director-notification-list')).toContainText('Consent reminders');
});
