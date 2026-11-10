// piezas-scenario: S-016 v=d43b3732dedb
import { expect, test } from '@playwright/test';

test('S-016: I can prepare a clear radio handoff', async ({page}) => {
  await page.goto('/?view=instructor');
  await page.getByTestId('instructor-report-missing').click();
  await page.getByTestId('radio-child').selectOption('demo-child-01');
  await expect(page.getByTestId('radio-time-auto')).toBeVisible();
  await page.getByTestId('radio-place').fill('Green run junction');
  await page.getByTestId('radio-clothing').fill('Green jacket');
  await page.getByTestId('radio-equipment').fill('Blue skis');
  await page.getByTestId('radio-injuries').fill('None observed');
  await page.getByTestId('radio-save').click();
  await expect(page.getByTestId('radio-alert-status')).toContainText('Report saved for Desk and Patrol');
  await expect(page.getByTestId('ops-detail')).toContainText('Maya Chen');
  await expect(page.getByTestId('ops-detail')).toContainText('214');
  await expect(page.getByTestId('ops-detail')).toContainText('Green run junction');
  await expect(page.getByTestId('ops-detail')).toContainText('Blue skis');
  await expect(page.getByTestId('ops-detail')).toContainText('None observed');
  await expect(page.getByTestId('ops-detail')).toContainText('No radio message was sent');
});
