// piezas-scenario: S-055 v=ab194afd2b6a
import {expect,test} from '@playwright/test';

test('S-055: repeating the 300-row registration import creates no duplicate children or consent',async({page})=>{
 await page.goto('/prototype?view=director&data=empty');
 await page.getByTestId('registration-import').click();
 await page.getByTestId('registration-sample').click();
 await expect(page.getByTestId('registration-review')).toContainText('300 new');
 await page.getByTestId('registration-apply').click();
 await expect(page.getByTestId('director-today-count')).toHaveText('150');
 await page.getByTestId('director-nav-children').click();
 await page.getByTestId('registration-import').click();
 await page.getByTestId('registration-sample').click();
 await expect(page.getByTestId('registration-review')).toContainText('0 new');
 await page.getByTestId('registration-apply').click();
 await expect(page.getByTestId('director-feedback')).toContainText('300 unchanged');
 await page.getByTestId('director-search').fill('Owen Parr');
 await page.locator('[data-action="child-open"]').click();
 await expect(page.getByTestId('profile-details')).toContainText('Owen gets cold easily!');
 await expect(page.getByTestId('profile-details')).toContainText('No pickup adults recorded');
 await expect(page.getByTestId('profile-details')).toContainText('Consent needed');
 await expect(page.getByTestId('profile-details').getByTestId('profile-group')).toContainText('Unassigned');
 await expect(page.getByTestId('profile-details').getByTestId('profile-bib')).toContainText('Not assigned');
});
