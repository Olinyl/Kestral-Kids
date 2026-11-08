// piezas-scenario: S-016 v=5b3d5c3482b6
import { expect, test } from '@playwright/test';

test('S-016: role workflow', async ({page}) => {
  await page.goto('/?view=instructor');
  await page.getByTestId('ops-open-demo-child-01').click();
  await page.getByTestId('radio-start').click();
  await page.getByTestId('radio-time').fill('10:35');
  await page.getByTestId('radio-place').fill('Green run junction');
  await page.getByTestId('radio-equipment').fill('Blue skis');
  await page.getByTestId('radio-injuries').fill('None observed');
  await page.getByTestId('radio-save').click();
  await expect(page.getByTestId('radio-checklist')).toContainText('Maya Chen');
  await expect(page.getByTestId('radio-checklist')).toContainText('214');
  await expect(page.getByTestId('radio-checklist')).toContainText('Green run junction');
  await expect(page.getByTestId('radio-checklist')).toContainText('Blue skis');
  await expect(page.getByTestId('radio-checklist')).toContainText('None observed');
  await expect(page.getByTestId('radio-checklist')).toContainText('Not sent');
});
