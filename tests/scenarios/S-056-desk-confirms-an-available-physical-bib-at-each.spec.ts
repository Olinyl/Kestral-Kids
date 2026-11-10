// piezas-scenario: S-056 v=f53b362356be
import {expect,test} from '@playwright/test';

async function switchAccount(page,role){await page.getByTestId('account-menu').click();await page.getByTestId('account-choice-'+role).click();}

test('S-056: Desk assigns a valid bib and the assigned instructor sees it while parents do not',async({page})=>{
 await page.goto('/?view=director');
 await page.getByTestId('director-nav-children').click();
 await page.getByTestId('director-add').click();
 await page.getByTestId('child-name').fill('Bib Stock Demo');
 await page.getByTestId('child-guardian').selectOption({label:'Alyssa Chen'});
 await page.getByTestId('child-group').selectOption('spruce-3');
 await page.getByTestId('child-level').selectOption('Level 1');
 await page.getByTestId('child-emergency-name').fill('Alyssa Chen');
 await page.getByTestId('child-emergency-phone').fill('6045550199');
 await page.getByTestId('child-save').click();

 await switchAccount(page,'guardian');
 const child=page.locator('.g-child-row').filter({hasText:'Bib Stock Demo'});
 await child.getByRole('button',{name:'Fill consent form'}).click();
 const consent=page.getByRole('dialog');
 await consent.getByTestId('consent-emergencyRelationship').selectOption('Mother');
 await consent.getByTestId('consent-medical').fill('None');
 await consent.getByTestId('consent-medications').fill('None');
 await consent.getByTestId('consent-allergies').fill('None');
 await consent.locator('[data-pickup-name]').fill('Alyssa Chen');
 await consent.locator('[data-pickup-relationship]').selectOption('Mother');
 await consent.locator('[data-pickup-add]').click();
 await consent.getByTestId('consent-guardianSignature').fill('Alyssa Chen');
 await consent.locator('[data-required-check]').nth(0).check();
 await consent.locator('[data-required-check]').nth(1).check();
 await consent.getByRole('button',{name:'Submit consent'}).click();

 await switchAccount(page,'desk');
 const deskChild=page.locator('[data-testid^="desk-child-card-"]').filter({hasText:'Bib Stock Demo'});
 await deskChild.getByRole('button',{name:'Check-in'}).click();
 await page.getByTestId('checkin-bib').fill('401');
 await page.getByTestId('checkin-jacket').selectOption('blue');
 await page.getByTestId('checkin-helmet').selectOption('black');
 await page.getByTestId('checkin-save').click();
 await expect(page.getByTestId('checkin-bib')).toHaveJSProperty('validationMessage','Enter a bib number from 1 to 400.');
 await page.getByTestId('checkin-bib').fill('225');
 await page.getByTestId('checkin-save').click();
 await expect(deskChild).toContainText('Checked in');

 await switchAccount(page,'instructor');
 const instructorChild=page.getByTestId('roster-row').filter({hasText:'Bib Stock Demo'});
 await expect(instructorChild).toContainText('225');
 await expect(page.locator('.o-heading h2')).toContainText('Spruce 3');
 await switchAccount(page,'guardian');
 await expect(page.getByTestId('guardian')).toContainText('Bib Stock Demo');
 await expect(page.getByTestId('guardian')).not.toContainText('225');
});
