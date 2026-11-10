import {expect,test} from '@playwright/test';

for(const width of [390,1440]) {
 test(`profiles and overview entries use consistent cards at ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:900});
  await page.goto('/?view=director');
  await expect(page.getByTestId('director-overview-profile').first()).toBeVisible();
  const cardStyle=async(locator)=>locator.evaluate(el=>({border:getComputedStyle(el).borderTopWidth,radius:getComputedStyle(el).borderRadius}));
  expect(await cardStyle(page.getByTestId('director-overview-profile').first())).toEqual({border:'1px',radius:'12px'});
  const fullRow=async(container,selector)=>{
   const bounds=await container.evaluate((el,selector)=>{
    const row=el.getBoundingClientRect();
    return {width:row.width,buttons:[...el.querySelectorAll(selector)].map(button=>({width:button.getBoundingClientRect().width,y:button.getBoundingClientRect().y,text:button.textContent}))};
   },selector);
   expect(bounds.buttons.length).toBeGreaterThan(0);
   const expected=(bounds.width-(bounds.buttons.length-1)*8)/bounds.buttons.length;
   for(const button of bounds.buttons) {expect(Math.abs(button.width-expected)).toBeLessThanOrEqual(1);expect(button.text).not.toContain('›');}
   expect(new Set(bounds.buttons.map(button=>button.y)).size).toBe(1);
  };
  for(const [tab,kind] of [['children','child'],['instructors','instructor'],['groups','group']]) {
   await page.getByTestId('director-nav-'+tab).click();
   const card=page.getByTestId('director-'+kind+'-row').first();
   await expect(card).toBeVisible();
   await expect(card).toHaveJSProperty('tagName','ARTICLE');
   expect(await cardStyle(card)).toEqual({border:'1px',radius:'12px'});
   await fullRow(card.locator('.d-card-actions'),'.d-button');
   await card.getByRole('button',{name:'View details'}).click();
   await expect(page.locator('dialog[open]')).toBeVisible();
   await page.locator('dialog[open]').getByRole('button',{name:'Close form'}).click();
  }
  await page.getByTestId('account-menu').click();
  await page.getByTestId('account-choice-instructor').click();
  const child=page.getByTestId('roster-row').first();
  await expect(child).toBeVisible();
  expect(await cardStyle(child)).toEqual({border:'1px',radius:'12px'});
  await fullRow(child.locator('.o-card-footer'),'.o-button');
  await child.getByRole('button',{name:'View details'}).click();
  await expect(page.getByTestId('ops-dialog')).toBeVisible();
  await page.getByTestId('ops-close').click();
  await page.getByTestId('account-menu').click();
  await page.getByTestId('account-choice-desk').click();
  await fullRow(page.getByTestId('roster-row').first().locator('.o-row-actions'),'.o-button');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  await page.screenshot({path:`.piezas/design-review/profile-cards-${width}.png`});
 });
}
