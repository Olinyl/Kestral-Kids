import {expect,test} from '@playwright/test';

for (const width of [390,1440]) {
  test(`workspace scroll stays between the header and tabs at ${width}px`,async({page})=>{
    await page.setViewportSize({width,height:900});
    await page.goto('/prototype?view=director&data=200');
    for (const role of ['director','guardian','instructor','patrol','desk']) {
      await page.getByTestId('view-as').selectOption(role);
      const header=page.locator('#app-shell > .top');
      const main=page.locator('#app-shell > main');
      const nav=page.getByTestId('workspace-nav');
      const beforeHeader=await header.boundingBox();
      const beforeNav=await nav.boundingBox();
      expect(await page.evaluate(()=>document.documentElement.scrollHeight)).toBeLessThanOrEqual(900);
      const content=await main.boundingBox();
      expect(content!.y).toBeGreaterThanOrEqual(beforeHeader!.y+beforeHeader!.height);
      expect(content!.y+content!.height).toBeLessThanOrEqual(beforeNav!.y);
      await main.evaluate(element=>element.scrollTop=element.scrollHeight);
      await expect(header).toBeVisible();
      await expect(nav).toBeVisible();
      expect(await header.boundingBox()).toEqual(beforeHeader);
      expect(await nav.boundingBox()).toEqual(beforeNav);
      await page.screenshot({path:`.piezas/design-review/scroll-${role}-${width}.png`});
    }
  });
}
