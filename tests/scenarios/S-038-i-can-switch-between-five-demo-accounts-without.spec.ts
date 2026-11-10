// piezas-scenario: S-038 v=a35de50a821d
import {expect,test} from '@playwright/test';

test('account menu switches among five demo profiles and sign-out returns to chooser',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/?view=director');
 await expect(page.getByText('Interactive demo',{exact:true})).toHaveCount(0);
 await page.getByTestId('account-menu').click();
 await expect(page.getByTestId('account-switcher').locator('[data-account-role]')).toHaveCount(5);
 await page.screenshot({path:'.piezas/design-review/account-switcher-phone.png'});
 await page.getByTestId('account-choice-instructor').click();
 await expect(page.getByTestId('workspace-title')).toHaveText('Instructor workspace');
 await page.getByTestId('account-menu').click();
 await page.getByTestId('account-sign-out').click();
 await expect(page.getByTestId('account-workspace')).toContainText('Choose an account');
 await page.screenshot({path:'.piezas/design-review/account-sign-out-phone.png'});
 await page.getByTestId('account-continue-director').click();
 await expect(page.getByTestId('workspace-title')).toHaveText('Director workspace');
});
