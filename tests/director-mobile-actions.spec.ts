import {expect,test} from '@playwright/test';
for(const width of [320,390]) {
 test(`lesson group actions share a row at ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:844});
  await page.goto('/?view=director');
  await page.getByTestId('director-nav-groups').click();
  const auto=page.getByTestId('group-autoassign'),create=page.getByTestId('director-add');
  const a=await auto.boundingBox(),b=await create.boundingBox();
  expect(a!.y).toBe(b!.y);
  expect(a!.x+a!.width).toBeLessThanOrEqual(b!.x);
  await page.screenshot({path:`.piezas/design-review/director-actions-${width}.png`});
  await auto.click();
  await expect(page.getByTestId('autoassign-dialog')).toBeVisible();
  await page.getByTestId('autoassign-close').click();
  await create.click();
  await expect(page.getByTestId('group-dialog')).toBeVisible();
 });
}
