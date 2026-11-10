// piezas-scenario: S-024 v=af14120c9b38
import {expect,test} from '@playwright/test';

test('S-024: director workflow',async({page})=>{
  await page.goto('/?view=director');
  await page.getByTestId('director-nav-groups').click();
  await page.getByTestId('group-open-spruce-3').click();
  await page.getByTestId(/^profile-edit-/).click();
  await page.getByTestId('group-remove-demo-child-01').click();
  await page.getByTestId('group-child-search').fill('Noah');
  await page.getByTestId('group-child-option-demo-child-02').click();
  await expect(page.getByTestId('group-members')).toContainText('Noah Singh');
  await expect(page.getByTestId('group-members')).not.toContainText('Maya Chen');
  await page.getByTestId('group-save').click();
  if(await page.getByTestId(/^(child|guardian|instructor|group)-profile$/).isVisible()) await page.getByTestId("dialog-close").click();
  const spruce=page.getByTestId('director-group-row').filter({hasText:'Spruce 3'});
  const cedar=page.getByTestId('director-group-row').filter({hasText:'Cedar 1'});
  await expect(spruce).toContainText('Noah Singh');
  await expect(spruce).not.toContainText('Maya Chen');
  await expect(cedar).not.toContainText('Noah Singh');
  await page.getByTestId('director-nav-children').click();
  await page.getByTestId('child-open-demo-child-02').click();
  await page.getByTestId(/^profile-edit-/).click();
  await page.getByTestId('child-name').fill('Noah Demo');
  await page.getByTestId('child-save').click();
  if(await page.getByTestId(/^(child|guardian|instructor|group)-profile$/).isVisible()) await page.getByTestId("dialog-close").click();
  await page.getByTestId('director-nav-groups').click();
  await expect(spruce).toContainText('Noah Demo');
});

test('S-024: Group editing rejects a seventh child and cancel preserves membership',async({page})=>{
  await page.goto('/prototype?data=200&view=director');
  await page.getByTestId('director-nav-groups').click();
  await page.getByTestId('group-open-spruce-3').click();
  await page.getByTestId(/^profile-edit-/).click();
  await page.getByTestId('group-child-search').fill('1006');
  await page.getByTestId('group-child-option-prototype-child-0007').click();
  await page.getByTestId('group-save').click();
  if(await page.getByTestId(/^(child|guardian|instructor|group)-profile$/).isVisible()) await page.getByTestId("dialog-close").click();
  await expect(page.getByTestId('form-error')).toContainText('six children');
  await page.getByTestId('dialog-close').click();
  if(await page.getByTestId(/^(child|guardian|instructor|group)-profile$/).isVisible()) await page.getByTestId("dialog-close").click();
  await page.getByTestId('group-open-spruce-3').click();
  await page.getByTestId(/^profile-edit-/).click();
  await expect(page.getByTestId('group-members').locator('[data-group-remove]')).toHaveCount(6);
});
