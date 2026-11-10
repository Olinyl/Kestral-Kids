// piezas-scenario: S-042 v=225162245c11
import { expect, test } from '@playwright/test';

test('S-042: I can mark a reported child found from the instructor roster', async ({page}) => {
  await page.goto('/?view=instructor');
  await page.getByTestId('instructor-report-missing').click();
  await page.getByTestId('radio-child').selectOption('demo-child-01');
  await page.getByTestId('radio-place').fill('Lower lodge entrance');
  await page.getByTestId('radio-save').click();
  await page.getByTestId('ops-close').click();
  await expect(page.getByTestId('instructor-found-demo-child-01')).toBeVisible();
  await page.getByTestId('instructor-found-demo-child-01').click();
  await expect(page.getByTestId('instructor-found-demo-child-01')).toHaveCount(0);
  await expect(page.getByTestId('roster-row').first()).not.toContainText('Alert Sent · Searching');
});
