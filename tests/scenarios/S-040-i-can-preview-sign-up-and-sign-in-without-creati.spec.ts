// piezas-scenario: S-040 v=51bd7d00b1a0
import {expect,test} from '@playwright/test';

test('create-account preview validates input without storing a password or granting staff access',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/?view=guardian');
 await page.getByTestId('account-menu').click();
 await page.getByTestId('account-create').click();
 await page.getByTestId('account-name').fill('New Guardian');
 await page.getByTestId('account-email').fill('new.guardian@example.test');
 await page.getByTestId('account-password').fill('Example-test-42');
 await page.getByTestId('account-confirm').fill('Example-test-42');
 await page.screenshot({path:'.piezas/design-review/account-create-phone.png'});
 await page.getByTestId('account-submit').click();
 await expect(page.getByTestId('account-auth-dialog')).toContainText('No email was sent');
 await page.getByTestId('account-preview-verify').click();
 await expect(page.getByTestId('workspace-title')).toHaveText('Hello, New Guardian');
 await expect(page.getByTestId('guardian')).toContainText('No registrations linked');
 expect(await page.evaluate(()=>JSON.stringify({...localStorage,...sessionStorage}))).not.toContain('Example-test-42');
 await page.getByTestId('account-menu').click();
 await expect(page.getByTestId('account-switcher')).toContainText('Preview account');
});
test('signed-out demo profiles can be resumed from the sign-in screen',async({page})=>{
 await page.goto('/?view=patrol');
 await page.getByTestId('account-menu').click();
 await page.getByTestId('account-sign-out').click();
 await page.getByTestId('account-continue-patrol').click();
 await expect(page.getByTestId('account-auth-dialog')).toContainText('Sign in');
 await page.getByRole('button',{name:'Use this demo account without a password'}).click();
 await expect(page.getByTestId('workspace-title')).toHaveText('Patrol workspace');
});
