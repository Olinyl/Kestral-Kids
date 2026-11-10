// piezas-scenario: S-048 v=a7f5fdbbd04c
import {expect,test} from '@playwright/test';

async function switchAccount(page,role){await page.getByTestId('account-menu').click();await page.getByTestId('account-choice-'+role).click();}
async function openAlerts(page){await page.getByTestId('workspace-nav').getByRole('button',{name:/^Alerts(?:,.*)?$/}).click();}

test('S-048: group notices reach the right families and safety alerts remain distinct',async({page})=>{
 await page.goto('/prototype');
 await switchAccount(page,'instructor');
 await openAlerts(page);
 await page.getByTestId('shared-alert-compose').click();
 await page.getByTestId('shared-notice-category').selectOption('Lesson delayed');
 await expect(page.getByTestId('shared-notice-group')).toHaveCount(1);
 await page.getByTestId('shared-notice-group').check();
 await page.getByTestId('shared-notice-message').fill('Meet at the green flag at 10 AM.');
 await page.getByTestId('shared-notice-send').click();
 await expect(page.getByTestId('shared-alert-feedback')).toContainText('Notice sent');
 await switchAccount(page,'guardian');
 await openAlerts(page);
 await expect(page.getByTestId('shared-alert-card').filter({hasText:'Meet at the green flag at 10 AM.'})).toBeVisible();
 await expect(page.getByTestId('shared-alert-card').filter({hasText:'Missing child'})).toHaveCount(0);
 await switchAccount(page,'patrol');
 await openAlerts(page);
 await expect(page.getByTestId('shared-alert-card').filter({hasText:'Missing child'})).toBeVisible();
 await expect(page.getByTestId('shared-alert-card').filter({hasText:'Meet at the green flag at 10 AM.'})).toHaveCount(0);
});
