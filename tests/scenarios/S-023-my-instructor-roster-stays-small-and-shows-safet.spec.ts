// piezas-scenario: S-023 v=aff596b577c8
import {expect,test} from '@playwright/test';

test('S-023: role requirement',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('/prototype?data=200&view=instructor');
  await expect(page.getByTestId('roster-row')).toHaveCount(6);
  await expect(page.getByTestId('instructor-medical')).toContainText('Peanut allergy');
  await expect(page.getByTestId('operations')).not.toContainText('Roster saved for offline use');
  await page.getByTestId('ops-open-demo-child-01').click();
  await expect(page.getByTestId('ops-dialog')).toContainText('Maya');
  await page.getByTestId('ops-close').click();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
});
