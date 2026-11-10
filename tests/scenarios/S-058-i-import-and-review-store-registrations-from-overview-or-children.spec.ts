// piezas-scenario: S-058 v=af9f15d20839
import {expect,test} from '@playwright/test';

test('Overview and Children share one reviewed import and original role records',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/prototype?view=director&data=empty');
 await page.getByTestId('registration-import').click();
 await expect(page.getByTestId('registration-apply')).toBeDisabled();
 await page.getByTestId('registration-sample').click();
 await expect(page.getByTestId('registration-review')).toContainText('300 new');
 await expect(page.getByTestId('registration-apply')).toBeInViewport({ratio:1});
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
 await page.getByTestId('dialog-close').click();
 await page.getByTestId('account-menu').click();await page.getByTestId('account-choice-desk').click();
 await page.getByTestId('roster-search').fill('Owen Parr');
 await expect(page.getByTestId('desk-child-card-import-child-KM-2025-118204')).toContainText('Consent needed');
 await page.getByTestId('account-menu').click();await page.getByTestId('account-choice-guardian').click();
 await expect(page.locator('#guardian')).toContainText('Owen Parr');
 await expect(page.locator('#guardian')).toContainText('Maya Parr');
 await expect(page.locator('#guardian').getByTestId('profile-bib')).toHaveCount(0);
});

test('invalid registration file reports the row and cannot import partially',async({page})=>{
 await page.goto('/prototype?view=director&data=empty');
 await page.getByTestId('registration-import').click();
 const csv='Order number,Child,Birth date,Program,Level,Account holder,Email\nORDER1,Test Child,2017-06-14,Saturday,9,Test Parent,parent@example.test';
 await page.getByTestId('registration-file').setInputFiles({name:'invalid.csv',mimeType:'text/csv',buffer:Buffer.from(csv)});
 await expect(page.getByTestId('registration-error')).toContainText('Row 1');
 await expect(page.getByTestId('registration-apply')).toBeDisabled();
 await page.getByTestId('dialog-close').click();
 await expect(page.getByTestId('director-today-count')).toHaveText('0');
});
