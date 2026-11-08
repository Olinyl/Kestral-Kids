// piezas-scenario: S-015 v=df77ee1d9b4d
import { expect, test } from '@playwright/test';

test('S-015: role workflow', async ({page}) => {
  await page.setViewportSize({width:390,height:844});
  await page.goto('/?view=instructor');
  await page.getByTestId('ops-open-demo-child-01').click();
  await expect(page.getByTestId('ops-detail')).toContainText('Peanut allergy');
  await expect(page.getByTestId('ops-detail')).toContainText('Green jacket, white helmet');
  await expect(page.getByTestId('ops-detail')).not.toContainText('604');
  await page.getByTestId('ops-close').click();
  await expect(page.getByTestId('roster-row')).toHaveCount(1);
  await expect(page.getByTestId('roster-row')).toContainText('Bib 214');
  await expect(page.getByTestId('operations')).not.toContainText('Noah');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
});
