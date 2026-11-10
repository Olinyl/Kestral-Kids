// piezas-scenario: S-049 v=ee81b3d1866a
import {expect,test} from '@playwright/test';

async function switchAccount(page,role){await page.getByTestId('account-menu').click();await page.getByTestId('account-choice-'+role).click();}

test('S-049: changes are recorded in a read-only history and the preview stays clearly fictional',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/prototype');
 await expect(page.getByTestId('demo-banner')).toBeVisible();
 await switchAccount(page,'desk');
 await page.getByTestId('desk-action-demo-child-01').click();
 await page.getByTestId('pickup-adult').selectOption('0');
 await page.getByTestId('pickup-staff').fill('Jordan Lee');
 await page.getByTestId('pickup-verified').check();
 await page.getByTestId('pickup-save').click();
 await switchAccount(page,'director');
 await expect(page.getByTestId('director-activity')).toContainText('Child released');
 await expect(page.getByTestId('director-activity')).toContainText('Jordan Lee');
 await expect(page.getByTestId('director-activity-entry').first().getByRole('button')).toHaveCount(0);
 await expect(page.getByTestId('director-activity')).toContainText('resets when the preview reloads');
});
