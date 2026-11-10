// piezas-scenario: S-047 v=81f0daa3da15
import {expect,test} from '@playwright/test';

test('S-047: Desk records the authorised adult and bib return separately',async({page})=>{
 await page.goto('/?view=desk');
 await page.getByTestId('desk-action-demo-child-01').click();
 await expect(page.getByTestId('pickup-adult')).toContainText('Daniel Chen');
 await expect(page.getByTestId('pickup-adult')).not.toContainText('Unlisted');
 await page.getByTestId('pickup-adult').selectOption('1');
 await page.getByTestId('pickup-staff').fill('Jordan Lee');
 await page.getByTestId('pickup-verified').check();
 await expect(page.getByTestId('pickup-save')).toBeEnabled();
 await page.getByTestId('pickup-save').click();
 await page.getByTestId('desk-child-card-demo-child-01').locator('.o-child').click();
 await expect(page.getByTestId('ops-detail')).toContainText('Released to Daniel Chen');
 await expect(page.getByTestId('ops-detail')).toContainText('Verified by Jordan Lee');
 await expect(page.getByTestId('ops-detail')).toContainText('Bib returned: No');
 await expect(page.getByTestId('release-time')).toBeVisible();
});
