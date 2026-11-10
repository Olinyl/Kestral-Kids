// piezas-scenario: S-039 v=7e96c62dd86a
import {expect,test} from '@playwright/test';


for(const width of [390,768,1440]) {
 test(`workspace actions use a consistent button system at ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:900});
  await page.goto('/?view=guardian');
  for(const role of ['guardian','director','instructor','desk','patrol']) {
   await page.getByTestId('account-menu').click();
      await page.getByTestId('account-choice-'+role).click();
   await expect(page.getByTestId('workspace-nav')).toBeVisible();
   const actions=page.locator('#app-shell :is(.d-button,.o-button,.g-button,.p-action-button,.p-log-button,.p-signout):visible');
   for(const action of await actions.all()) {
    const style=await action.evaluate(e=>({font:getComputedStyle(e).fontSize,radius:getComputedStyle(e).borderRadius,height:e.getBoundingClientRect().height}));
    expect(style.font).toBe('14px');
    expect(style.radius).toBe('8px');
    expect(style.height).toBeGreaterThanOrEqual(44);
   }
  }
  await page.getByTestId('account-menu').click();
      await page.getByTestId('account-choice-'+'guardian').click();
  const review=page.locator('.g-review').first();
  await expect(review).toBeVisible();
  const button=await review.boundingBox(),row=await review.locator('..').boundingBox();
  expect(Math.abs(button!.width-row!.width)).toBeLessThanOrEqual(1);
  await page.screenshot({path:`.piezas/design-review/buttons-guardian-${width}.png`});
 });
}
