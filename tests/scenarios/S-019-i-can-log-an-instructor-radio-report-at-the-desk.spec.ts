// piezas-scenario: S-019 v=0af267020486
import { expect, test } from '@playwright/test';

test('S-019: role workflow', async ({page}) => {
  await page.goto('/');
  await page.getByRole('button',{name:'Incidents',exact:true}).click();
  await page.getByTestId('desk-radio-new').click();
  await page.getByTestId('radio-child').selectOption('demo-child-01');
  await page.getByTestId('radio-time').fill('10:35');
  await page.getByTestId('radio-place').fill('Green run junction');
  await page.getByTestId('radio-clothing').fill('Green jacket');
  await page.getByTestId('radio-equipment').fill('Blue skis');
  await page.getByTestId('radio-injuries').fill('Unknown');
  await page.getByTestId('radio-staff').fill('Desk Demo');
  await page.getByTestId('radio-save').click();
  await expect(page.getByTestId('incident-row')).toContainText('Bib 214');
  await expect(page.getByTestId('incident-row')).toContainText('Green run junction');
  await expect(page.getByTestId('incident-row')).toContainText('Blue skis');
  await expect(page.getByTestId('incident-row')).toContainText('Unknown');
  await expect(page.getByTestId('incident-row')).toContainText('Desk Demo');
  await expect(page.getByTestId('operations')).toContainText('Contact patrol by radio');
});
