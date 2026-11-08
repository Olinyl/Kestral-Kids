// piezas-scenario: S-027 v=21b386b9ad72
import {expect,test} from '@playwright/test';
test('S-027: Desktop check-in keeps both panes visible',async({page})=>{
  await page.setViewportSize({width:1440,height:1000});
  await page.goto('/');
  await page.getByTestId('ops-open-demo-child-02').click();
  await expect(page.getByTestId('desk-detail')).toBeVisible();
  await expect(page.getByTestId('checkin-save')).toBeDisabled();
  await expect(page.getByTestId('roster-row')).toHaveCount(2);
  const roster=await page.getByTestId('desk-roster').boundingBox();
  const details=await page.getByTestId('desk-detail').boundingBox();
  expect(roster.x+roster.width).toBeLessThanOrEqual(details.x);
  await page.getByTestId('ops-open-demo-child-01').click();
  await page.getByTestId('checkin-clothing').fill('Red jacket, blue helmet');
  await page.getByTestId('checkin-save').click();
  await expect(page.getByTestId('desk-detail')).toContainText('Red jacket, blue helmet');
  await expect(page.getByTestId('roster-row')).toHaveCount(2);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
});
test('S-027: Phone shows one child detail at a time',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('/');
  await page.getByTestId('ops-open-demo-child-01').click();
  await expect(page.getByTestId('ops-dialog')).toBeVisible();
  await expect(page.getByTestId('ops-detail')).toContainText('Peanut allergy');
  await page.getByTestId('ops-close').click();
  await expect(page.getByTestId('roster-row')).toHaveCount(2);
});
