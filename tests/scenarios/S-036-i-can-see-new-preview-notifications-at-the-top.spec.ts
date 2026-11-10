// piezas-scenario: S-036 v=724bf8150a27
import {expect,test} from '@playwright/test';

test('Director alert tab updates immediately and routine notifications can be cleared',async({page})=>{
 await page.goto('/?view=director');
 await page.getByTestId('director-nav-children').click();
 await page.getByTestId('parent-alert-demo-child-02').click();
 await page.getByTestId('parent-alert-message').fill('Please complete your consent form.');
 await page.getByTestId('parent-alert-submit').click();
 await expect(page.getByTestId('director-nav-alerts').locator('.nav-alert-count')).toHaveText('1');
 await page.getByTestId('director-nav-alerts').click();
 await expect(page.getByTestId('director-alerts')).toContainText('Priya Singh');
 await page.getByRole('button',{name:'Clear alerts'}).click();
 await expect(page.getByTestId('director-alerts')).toContainText('No new preview activity');
});
