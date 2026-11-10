// piezas-scenario: S-053 v=5a4fcfa2d097
import {expect,test} from '@playwright/test';

test('Director reads, edits, saves and cancels a child profile',async({page})=>{
 await page.goto('/prototype');
 await page.getByTestId('account-menu').click();
 await page.getByTestId('account-choice-director').click();
 await page.getByTestId('child-open-demo-child-01').click();
 await expect(page.getByTestId('child-profile')).toBeVisible();
 await expect(page.getByTestId('profile-details').locator('input,select,textarea')).toHaveCount(0);
 await page.getByTestId('profile-edit-demo-child-01').click();
 await page.getByTestId('child-medical').fill('Health note updated for preview');
 await page.getByTestId('child-save').click();
 await expect(page.getByTestId('child-profile')).toContainText('Health note updated for preview');
 await page.getByTestId('profile-edit-demo-child-01').click();
 await page.getByTestId('child-medical').fill('Unsaved note');
 await page.getByTestId('close').click();
 await expect(page.getByTestId('child-profile')).toContainText('Health note updated for preview');
 await expect(page.getByTestId('child-profile')).not.toContainText('Unsaved note');
});

for(const [kind,tab,id] of [['guardian','guardians','demo-guardian-01'],['instructor','instructors','demo-instructor-01'],['group','groups','spruce-3']]) {
 test(`${kind} details are read-only until edited and save or cancel returns to the profile`,async({page})=>{
  await page.goto('/prototype');
  await page.getByTestId('account-menu').click();
  await page.getByTestId('account-choice-director').click();
  await page.getByTestId('director-nav-'+tab).click();
  await page.getByTestId(kind+'-open-'+id).click();
  await expect(page.getByTestId('profile-details').locator('input,select,textarea')).toHaveCount(0);
  await page.getByTestId('profile-edit-'+id).click();
  await page.getByTestId(kind+'-name').fill('Updated '+kind);
  await page.getByTestId(kind+'-save').click();
  await expect(page.getByTestId(kind+'-profile')).toContainText('Updated '+kind);
  await page.getByTestId('profile-edit-'+id).click();
  await page.getByTestId(kind+'-name').fill('Unsaved change');
  await page.getByTestId('close').click();
  await expect(page.getByTestId(kind+'-profile')).toContainText('Updated '+kind);
  await expect(page.getByTestId(kind+'-profile')).not.toContainText('Unsaved change');
 });
}

