import {expect,test} from '@playwright/test';

for(const width of [390,1440]) {
 test(`lesson details use the same compact presentation across roles at ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:900});
  await page.goto('/prototype?view=director&data=200');
  await page.getByTestId('director-nav-children').click();
  const director=page.getByTestId('director-child-row').first();
  await expect(director).toBeVisible();
  const read=async(card,includeBib=true)=>{
   const values=[];
   for(const key of includeBib?['group','program','level','bib']:['group','program','level']) {
    const item=card.getByTestId('profile-'+key);
    await expect(item).toBeVisible();
    values.push(await item.evaluate(el=>({text:el.textContent,background:getComputedStyle(el).backgroundColor,color:getComputedStyle(el).color,padding:getComputedStyle(el).padding})));
   }
   return values;
  };
  const expected=await read(director);
  expect(expected[0].text).toContain('GroupSpruce 3');
  expect(expected[1].text).toContain('ProgramSaturday');
  expect(expected[0].background).not.toBe(expected[1].background);
  expect((await director.boundingBox())!.height).toBeLessThan(430);
  await page.screenshot({path:`.piezas/design-review/compact-director-${width}.png`});
  await page.getByTestId('director-nav-children').click();
  await page.getByTestId('manage-guardians').click();
  const guardianChild=page.getByTestId('director-guardian-row').first().locator('.g-child-row').first();
  expect(await read(guardianChild)).toEqual(expected);
  for(const role of ['guardian','desk','instructor']) {
   await page.getByTestId('account-menu').click();
   await page.getByTestId('account-choice-'+role).click();
   const card=role==='guardian' ? page.locator('#guardian .g-child-row').first() : page.getByTestId('roster-row').first();
   expect(await read(card,role!=='guardian')).toEqual(role==='guardian'?expected.slice(0,3):expected);
   if(role==='guardian')await expect(card.getByTestId('profile-bib')).toHaveCount(0);
   expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
   await page.screenshot({path:`.piezas/design-review/compact-${role}-${width}.png`});
  }
 });
}

test('missing group and program information stays explicit',async({page})=>{
 await page.goto('/?view=director');
 await page.getByTestId('director-nav-children').click();
 const card=page.getByTestId('director-child-row').first();
 await expect(card.getByTestId('profile-program')).toContainText('Not recorded');
 await expect(card.getByTestId('profile-group')).toContainText('Spruce 3');
});

test('group identity and program day determine color while level and bib stay neutral',async({page})=>{
 await page.goto('/?view=director');
 await page.getByTestId('director-nav-groups').click();
 for(const [group,day] of [['spruce-3','Saturday'],['cedar-1','Sunday']]) {
  await page.getByTestId('group-open-'+group).click();
  await page.getByTestId(/^profile-edit-/).click();
  await page.getByTestId('group-program').selectOption(day);
  await page.getByTestId('group-save').click();
  if(await page.getByTestId(/^(child|guardian|instructor|group)-profile$/).isVisible()) await page.getByTestId("dialog-close").click();
 }
 await page.getByTestId('director-nav-children').click();
 const cards=page.getByTestId('director-child-row');
 const color=async(card,key)=>card.getByTestId('profile-'+key).evaluate(el=>getComputedStyle(el).backgroundColor);
 const spruce=await color(cards.nth(0),'group'),cedar=await color(cards.nth(1),'group');
 const saturday=await color(cards.nth(0),'program'),sunday=await color(cards.nth(1),'program');
 expect(spruce).not.toBe(cedar);
 expect(saturday).not.toBe(sunday);
 await expect(cards.nth(0).getByTestId('profile-program')).toContainText('Saturday');
 await expect(cards.nth(1).getByTestId('profile-program')).toContainText('Sunday');
 expect(await color(cards.nth(0),'level')).toBe(await color(cards.nth(0),'bib'));
 await page.getByTestId('account-menu').click();
 await page.getByTestId('account-choice-desk').click();
 const desk=page.getByTestId('roster-row');
 expect(await color(desk.nth(0),'group')).toBe(spruce);
 expect(await color(desk.nth(1),'group')).toBe(cedar);
 expect(await color(desk.nth(0),'program')).toBe(saturday);
 expect(await color(desk.nth(1),'program')).toBe(sunday);
 await page.screenshot({path:'.piezas/design-review/group-day-colors.png'});
});
