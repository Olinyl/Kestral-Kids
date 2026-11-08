// piezas-scenario: S-021 v=f61ad616f393
import {expect,test} from '@playwright/test';

test('S-021: role requirement',async({page})=>{
  for (const size of [200,1000]) {
    await page.goto('/prototype?data='+size);
    await expect(page.getByTestId('roster-row')).toHaveCount(25);
    await expect(page.getByTestId('roster-page-summary')).toContainText('of '+size.toLocaleString('en-CA'));
    await page.getByTestId('roster-next').click();
    await expect(page.getByTestId('roster-page-summary')).toContainText('26');
    await expect(page.getByTestId('roster-row')).toHaveCount(25);
    await page.getByTestId('roster-search').fill(String(1000+size-1));
    await expect(page.getByTestId('roster-row')).toHaveCount(1);
    await expect(page.getByTestId('roster-row')).toContainText('Zara Winters');
    await page.getByTestId('roster-search').fill('');
    await page.getByTestId('roster-status').selectOption('consent');
    for(const row of await page.getByTestId('roster-row').all()) await expect(row).toContainText('Consent needed');
    await page.getByTestId('roster-status').selectOption('all');
    await page.getByTestId('roster-group').selectOption('spruce-3');
    await expect(page.getByTestId('roster-row')).toHaveCount(6);
    await page.getByTestId('view-as').selectOption('director');
    await page.getByTestId('director-nav-children').click();
    await expect(page.getByTestId('director-child-row')).toHaveCount(25);
    await page.getByTestId('director-search').fill('Zara Winters');
    await expect(page.getByTestId('director-child-row')).toHaveCount(1);
    await expect(page.getByTestId('director-child-row')).toContainText(String(1000+size-1));
  }
});
