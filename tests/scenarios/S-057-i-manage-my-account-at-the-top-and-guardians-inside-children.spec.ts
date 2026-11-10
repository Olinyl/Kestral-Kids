// piezas-scenario: S-057 v=bbe888c8433f
import {expect,test} from '@playwright/test';

test('each original role keeps its operational tabs and one top Account entry',async({page})=>{
 for(const [role,tabs] of Object.entries({desk:['Roster','Alerts'],guardian:['My children','Alerts'],instructor:['Group roster','Alerts'],patrol:['Active alerts','Alerts'],director:['Overview','Children','Instructors','Lesson groups','Alerts']})){
  await page.goto('/?view='+role);
  await expect(page.locator('#workspace-nav button')).toHaveCount(tabs.length);
  for(const tab of tabs)await expect(page.locator('#workspace-nav').getByRole('button',{name:new RegExp('^'+tab+'(?:,.*)?$')})).toBeVisible();
  await page.getByTestId('account-menu').click();
  await expect(page.getByTestId('account-details-form')).toBeVisible();
  await expect(page.getByTestId('account-sign-out')).toBeVisible();
  await expect(page.locator('#account-switcher [data-account-id]')).toHaveCount(5);
  await page.getByRole('button',{name:'Close accounts',exact:true}).click();
 }
});

test('own details validate and update shared guardian data without changing another account',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/?view=guardian');
 await page.getByTestId('account-menu').click();
 await page.getByTestId('account-detail-name').fill('Updated Parent');
 await page.getByTestId('account-detail-email').fill('parent.updated@example.test');
 await page.getByTestId('account-detail-phone').fill('123');
 await page.getByTestId('account-details-save').click();
 await expect(page.getByTestId('account-details-error')).toContainText('phone');
 await page.getByTestId('account-detail-phone').fill('+1 604 555 0199');
 await page.getByTestId('account-details-save').click();
 await expect(page.getByTestId('account-details-status')).toContainText('saved');
 await page.getByTestId('account-choice-director').click();
 await page.getByTestId('director-nav-children').click();
 await page.getByTestId('manage-guardians').click();
 await page.getByTestId('director-search').fill('Updated Parent');
 await expect(page.getByTestId('director-list')).toContainText('parent.updated@example.test');
 await expect(page.getByTestId('director-list')).toContainText('+1 604 555 0199');
 await page.getByTestId('back-to-children').click();
 await expect(page.getByTestId('director-add')).toHaveText('Add child');
 await page.getByTestId('account-menu').click();
 await expect(page.getByTestId('account-detail-name')).toHaveValue('Taylor Reed');
});

test('child profile links to the existing guardian editor and back to the child',async({page})=>{
 await page.goto('/?view=director');
 await page.getByTestId('director-nav-children').click();
 await page.locator('[data-action="child-open"]').first().click();
 const title=await page.locator('#director-dialog-title').innerText();
 await page.getByTestId('child-guardian-details').click();
 await expect(page.getByTestId('profile-details')).toContainText('Linked children');
 await page.locator('[data-action="profile-edit"]').click();
 await page.getByTestId('guardian-phone').fill('+1 604 555 0123');
 await page.getByTestId('guardian-save').click();
 await expect(page.getByTestId('profile-details')).toContainText('+1 604 555 0123');
 await page.getByTestId('back-to-child').click();
 await expect(page.locator('#director-dialog-title')).toHaveText(title);
 await expect(page.getByTestId('profile-details')).toContainText('+1 604 555 0123');
});

