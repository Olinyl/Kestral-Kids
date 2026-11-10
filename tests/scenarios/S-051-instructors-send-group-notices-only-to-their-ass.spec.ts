// piezas-scenario: S-051 v=1c6c586b9bd8
import {expect,test} from '@playwright/test';
async function account(page,role){await page.getByTestId('account-menu').click();await page.getByTestId('account-choice-'+role).click();}
async function alerts(page,role){await page.getByTestId('workspace-nav').getByRole('button',{name:/^Alerts(?:,.*)?$/}).click();}

test('an instructor sends only to their group and a parent receives the same alert design',async({page})=>{
 await page.goto('/prototype');await account(page,'instructor');await alerts(page,'instructor');await page.getByTestId('shared-alert-compose').click();
 await expect(page.getByTestId('shared-notice-group')).toHaveCount(1);await expect(page.getByTestId('shared-notice-scope')).toHaveCount(0);
 await page.getByTestId('shared-notice-category').selectOption('Lesson delayed');await page.getByTestId('shared-notice-group').check();await page.getByTestId('shared-notice-message').fill('Meet at the green flag at 10 AM.');await page.getByTestId('shared-notice-send').click();
 await expect(page.getByTestId('shared-alert-feedback')).toContainText('Notice sent');
 await account(page,'guardian');await alerts(page,'guardian');await expect(page.getByTestId('shared-alert-card').filter({hasText:'Meet at the green flag at 10 AM.'})).toBeVisible();
 await account(page,'desk');await alerts(page,'desk');await page.getByTestId('shared-alert-compose').click();await expect(page.getByTestId('shared-notice-scope')).toBeVisible();
 await page.getByTestId('shared-alert-close').click();await page.setViewportSize({width:390,height:844});await page.getByTestId('shared-alert-compose').click();await expect(page.getByTestId('shared-notice-send')).toBeInViewport();await page.screenshot({path:'.piezas/tmp/shared-notice-phone.png'});
});
