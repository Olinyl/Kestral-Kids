// piezas-scenario: S-025 v=20dc3f09c8dd
import {expect,test} from '@playwright/test';

test('S-025: director workflow',async({page})=>{
  await page.goto('/?view=director');
  await page.getByTestId('director-nav-children').click();
  for(let i=0;i<8;i++) {
    await page.getByTestId('director-add').click();
    await page.getByTestId('child-name').fill('Learner '+i);
    await page.getByTestId('child-emergency-name').fill('Demo Guardian');
    await page.getByTestId('child-emergency-phone').fill('+1 604 555 0100');
    if(i<7) await page.getByTestId('child-level').selectOption('Level 1');
    await page.getByTestId('child-save').click();
  if(await page.getByTestId(/^(child|guardian|instructor|group)-profile$/).isVisible()) await page.getByTestId("dialog-close").click();
  }
  await page.getByTestId('director-nav-groups').click();
  await page.getByTestId('group-autoassign').click();
  await expect(page.getByTestId('autoassign-preview')).toContainText('5 children can be assigned');
  await expect(page.getByTestId('autoassign-preview')).toContainText('No capacity');
  await expect(page.getByTestId('autoassign-preview')).toContainText('No recorded ability level');
  await page.getByTestId('autoassign-apply').click();
  const spruce=page.getByTestId('director-group-row').filter({hasText:'Spruce 3'});
  await expect(spruce).toContainText('6 / 6');
  await expect(spruce).toContainText('Maya Chen');
  await expect(page.getByTestId('director-group-row').filter({hasText:'Cedar 1'})).toContainText('Noah Singh');
  await page.getByTestId('director-nav-children').click();
  await page.getByTestId('director-search').fill('Learner 7');
  await expect(page.getByTestId('director-child-row')).toContainText('Unassigned');
});

test('S-025: No matching level stays unassigned and preview does not save',async({page})=>{
  await page.goto('/?view=director');
  await page.getByTestId('director-nav-children').click();
  await page.getByTestId('director-add').click();
  await page.getByTestId('child-name').fill('Level Six Learner');
  await page.getByTestId('child-emergency-name').fill('Demo Guardian');
  await page.getByTestId('child-emergency-phone').fill('+1 604 555 0100');
  await page.getByTestId('child-level').selectOption('Level 6');
  await page.getByTestId('child-save').click();
  if(await page.getByTestId(/^(child|guardian|instructor|group)-profile$/).isVisible()) await page.getByTestId("dialog-close").click();
  await page.getByTestId('director-nav-groups').click();
  await page.getByTestId('group-autoassign').click();
  await expect(page.getByTestId('autoassign-preview')).toContainText('No matching group with an instructor');
  await expect(page.getByTestId('autoassign-apply')).toBeDisabled();
  await page.getByTestId('autoassign-close').click();
  await page.getByTestId('director-nav-children').click();
  await page.getByTestId('director-search').fill('Level Six Learner');
  await expect(page.getByTestId('director-child-row')).toContainText('Unassigned');
});
