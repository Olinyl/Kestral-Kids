// piezas-scenario: S-036 v=724bf8150a27
import {expect,test} from '@playwright/test';

test('top alerts update immediately and can be cleared',async({page})=>{
 await page.goto('/?view=director');
 await page.getByTestId('director-nav-children').click();
 await page.getByTestId('parent-alert-demo-child-02').click();
 await page.getByTestId('parent-alert-message').fill('Please complete your consent form.');
 await page.getByTestId('parent-alert-submit').click();
 await expect(page.getByTestId('director-notifications')).toContainText('(1)');
 await page.getByTestId('director-notifications').click();
 await expect(page.getByTestId('director-notification-list')).toContainText('Priya Singh');
 await page.getByRole('button',{name:'Clear notifications'}).click();
 await expect(page.getByTestId('director-notification-list')).toContainText('No new preview activity');
});
