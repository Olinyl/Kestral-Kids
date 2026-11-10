import {expect,test} from '@playwright/test';

test('Guardian consent requires contacts and signature, and shares saved details with the desk',async({page})=>{
  await page.goto('/?view=guardian');
  await page.locator('[data-consent]').click();
  await page.getByTestId('consent-emergencyName').fill('Updated Contact');
  await page.getByRole('button',{name:'Save changes',exact:true}).click();
  await expect(page.getByTestId('consent-guardianSignature')).toBeVisible();
  for(const [name,value] of Object.entries({emergencyName:'Updated Contact',emergencyPhone:'6045550101',emergencyRelationship:'Parent',emergencyName2:'Second Contact',emergencyPhone2:'6045550102',emergencyRelationship2:'Aunt',guardianSignature:'Demo Guardian',consentDate:'2026-12-12',medical:'Updated medical details',medications:'None',allergies:'None'})) {
    await page.getByTestId('consent-'+name).fill(value);
  }
  await page.getByTestId('consent-emergencyPhone').fill('123');
  await page.getByRole('button',{name:'Save changes',exact:true}).click();
  await expect(page.getByTestId('consent-guardianSignature')).toBeVisible();
  await page.getByTestId('consent-emergencyPhone').fill('6045550101');
  await page.locator('[data-required-check]').nth(0).check();
  await page.locator('[data-required-check]').nth(1).check();
  await page.getByRole('button',{name:'Save changes',exact:true}).click();
  await page.locator('[data-consent]').click();
  await expect(page.getByTestId('consent-emergencyName')).toHaveValue('Updated Contact');
  await expect(page.getByTestId('consent-medical')).toHaveValue('Updated medical details');
  await page.getByTestId('account-menu').click();
      await page.getByTestId('account-choice-'+'desk').click();
  await page.getByTestId('ops-open-demo-child-01').click();
  await expect(page.getByTestId('ops-detail')).toContainText('Updated Contact');
  await expect(page.getByTestId('ops-detail')).toContainText('Updated medical details');
});
