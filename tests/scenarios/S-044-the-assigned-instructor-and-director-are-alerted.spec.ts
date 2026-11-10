// piezas-scenario: S-044 v=1c7579f7eacc
import {expect,test} from '@playwright/test';
test('the assigned Instructor and Director receive the same found-child event',async({page})=>{
 await page.goto('/prototype');
 await page.getByTestId('account-menu').click();await page.getByTestId('account-choice-instructor').click();
 await page.getByTestId('instructor-report-missing').click();await page.getByTestId('radio-child').selectOption('demo-child-01');await page.getByTestId('radio-place').fill('Lower lodge entrance');await page.getByTestId('radio-save').click();await page.getByTestId('ops-close').click();
 await page.getByTestId('account-menu').click();await page.getByTestId('account-choice-patrol').click();
 const card=page.getByTestId('patrol-alert').filter({hasText:'Maya Chen'});await card.getByTestId('patrol-log-found-mobile').click();await card.locator('[data-found-confirm]').click();
 await page.getByTestId('account-menu').click();await page.getByTestId('account-choice-instructor').click();await page.getByTestId('instructor-nav-alerts').click();
 await expect(page.getByTestId('instructor-alerts')).toContainText('Maya Chen was marked found by Patrol');
 await page.getByTestId('account-menu').click();await page.getByTestId('account-choice-director').click();await page.getByTestId('director-nav-alerts').click();
 await expect(page.getByTestId('director-alerts')).toContainText('Maya Chen was marked found by Patrol');
});
