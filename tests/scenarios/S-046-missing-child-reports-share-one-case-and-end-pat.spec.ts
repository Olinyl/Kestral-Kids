// piezas-scenario: S-046 v=02ed8ec4f773
import {expect,test} from '@playwright/test';

test('S-046: Desk and Patrol see one active missing-child case until it is resolved',async({page})=>{
 await page.goto('/?view=desk');
 await page.getByTestId('desk-child-card-demo-child-01').locator('.o-child').click();
 await expect(page.getByTestId('desk-report-missing')).toBeVisible();
 await page.getByTestId('desk-report-missing').click();
 await page.getByTestId('radio-time').fill('08:20');
 await page.getByTestId('radio-place').fill('Lower lodge entrance');
 await page.getByTestId('radio-clothing').fill('Green jacket and white helmet');
 await page.getByTestId('radio-equipment').fill('Skis and poles');
 await page.getByTestId('radio-injuries').fill('None reported');
 await page.getByTestId('radio-staff').fill('Jordan Lee');
 await page.getByTestId('radio-save').click();
 await page.getByTestId('account-menu').click();
 await page.getByTestId('account-choice-patrol').click();
 const alert=page.getByTestId('patrol-alert').filter({hasText:'Maya Chen'});
 await expect(alert).toContainText('Lower lodge entrance');
 await alert.getByTestId('patrol-log-found-mobile').click();
 await alert.locator('[data-found-confirm]').click();
 await expect(page.getByTestId('patrol-alert').filter({hasText:'Maya Chen'})).toHaveCount(0);
});
