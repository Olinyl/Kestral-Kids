// piezas-scenario: S-050 v=cd850990a962
import {expect,test} from '@playwright/test';
async function account(page,role){await page.getByTestId('account-menu').click();await page.getByTestId('account-choice-'+role).click();}
async function alerts(page,role){await page.getByTestId('workspace-nav').getByRole('button',{name:/^Alerts(?:,.*)?$/}).click();}

test('original role landmarks, top Account entry and action buttons survive shared alert navigation',async({page})=>{
 await page.goto('/prototype');
 for(const [role,home,landmark] of [['guardian','My children','.g-schedule-card'],['desk','Roster','[data-testid="desk-roster"]'],['instructor','Group roster','[data-testid="instructor-medical"]'],['patrol','Active alerts','[data-testid="patrol-alert"]'],['director','Overview','[data-testid="director-missing-consent"]']]) {
  await account(page,role);await expect(page.locator(landmark)).toBeVisible();
  await expect(page.getByTestId('account-menu')).toBeVisible();
  await expect(page.getByTestId('workspace-nav').getByRole('button',{name:'Account',exact:true})).toHaveCount(0);
  await alerts(page,role);await expect(page.getByTestId('shared-alerts')).toBeVisible();
  await page.getByTestId('workspace-nav').getByRole('button',{name:home,exact:true}).click();await expect(page.locator(landmark)).toBeVisible();
 }
 await account(page,'patrol');await expect(page.getByTestId('patrol-request-lift-scan')).toBeVisible();await expect(page.getByTestId('patrol-copy-report')).toBeVisible();
 await account(page,'instructor');await expect(page.getByTestId('instructor-report-missing')).toBeVisible();
});
