// piezas-scenario: S-047 v=81f0daa3da15
import { expect, test } from '@playwright/test';

test('Desk can release to a verified adult and record a later bib return', async ({page}) => {
  await page.goto('/?view=desk');
  await page.getByTestId('desk-action-demo-child-01').click();
  const adults = page.getByTestId('pickup-adult');
  await expect(adults).toContainText('Daniel Chen');
  await expect(adults).not.toContainText('Unlisted');
  await adults.selectOption({label:'Daniel Chen — Father'});
  await page.getByTestId('pickup-staff').fill('Desk Demo');
  await page.getByTestId('pickup-bib-return').selectOption('outstanding');
  await page.getByTestId('pickup-verified').check();
  await page.getByTestId('pickup-save').click();
  await expect(page.getByTestId('ops-detail')).toContainText('Released to Daniel Chen');
  await expect(page.getByTestId('ops-detail')).toContainText('Desk Demo');
  await expect(page.getByTestId('release-time')).toHaveText(/\d{2}:\d{2}/);
  await expect(page.getByTestId('bib-return-status')).toHaveText('Bib still outstanding');
  await page.getByTestId('record-bib-return').click();
  await expect(page.getByTestId('bib-return-status')).toHaveText('Bib returned');
  await expect(page.getByTestId('release-time')).toHaveText(/\d{2}:\d{2}/);
});
