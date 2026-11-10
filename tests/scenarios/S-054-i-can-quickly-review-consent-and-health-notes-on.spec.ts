// piezas-scenario: S-054 v=93287b9719d8
import {expect,test} from '@playwright/test';

for(const width of [1440,390,320]) test(`Overview is compact with working health filter at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:900});
 await page.goto('/prototype?data=200');
 await page.getByTestId('account-menu').click();
 await page.getByTestId('account-choice-director').click();
 await expect(page.getByTestId('view-children')).toHaveCount(0);
 const headers=await page.locator('.d-overview-heading').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().height));
 expect(new Set(headers).size).toBe(1);
 expect(headers[0]).toBeLessThan(65);
 if(width>850) {
  const health=await page.getByTestId('health-notes').boundingBox();
  for(const id of ['consent-remind-all','director-incomplete-link']) {
   const consent=await page.getByTestId(id).boundingBox();
   expect(Math.abs(health!.y-consent!.y)).toBeLessThan(1);
  }
 }
 if(width<600) {
  for(const id of ['consent-remind-all','director-incomplete-link','health-notes','view-groups']) {
   const button=page.getByTestId(id);
   expect(await button.evaluate(e=>Math.abs(e.getBoundingClientRect().width-e.parentElement!.getBoundingClientRect().width))).toBeLessThan(1);
  }
 }
 await page.screenshot({path:`.piezas/tmp/director-overview-new-${width}.png`});
 await page.getByTestId('health-notes').click();
 await expect(page.getByTestId('director-filter')).toHaveValue('health');
 await expect(page.getByTestId('director-child-row').first()).toBeVisible();
 await expect(page.getByTestId('director-child-row').first()).toContainText('Health note');
});
