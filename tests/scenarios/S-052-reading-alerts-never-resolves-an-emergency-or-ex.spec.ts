// piezas-scenario: S-052 v=ffaced505aee
import {expect,test} from '@playwright/test';
async function account(page,role){await page.getByTestId('account-menu').click();await page.getByTestId('account-choice-'+role).click();}
async function alerts(page,role){await page.getByTestId('workspace-nav').getByRole('button',{name:/^Alerts(?:,.*)?$/}).click();}

test('reading alerts leaves the case active and found ends Patrol detail access',async({page})=>{
 await page.goto('/prototype');await account(page,'patrol');await alerts(page,'patrol');
 await expect(page.getByTestId('shared-alert-card').filter({hasText:'Missing child'})).toHaveCount(1);await page.getByTestId('shared-alert-mark-all').click();await page.getByTestId('shared-alert-clear').click();await expect(page.getByTestId('shared-alert-card').filter({hasText:'Missing child'})).toHaveCount(1);
 await page.getByTestId('shared-alert-open').click();await expect(page.getByTestId('patrol-alert')).toBeVisible();
 await page.getByTestId('patrol-log-found-mobile').click();await page.locator('[data-found-confirm]').click();
 await alerts(page,'patrol');await expect(page.getByTestId('shared-alert-card')).toHaveCount(0);await expect(page.getByTestId('shared-alerts')).not.toContainText('Owen Parr');
});
