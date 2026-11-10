// piezas-scenario: S-031 v=a7daa9930b7c
import {expect,test} from '@playwright/test';

for (const width of [390,1440]) {
  test(`all roles share the app frame at ${width}px`, async ({page}) => {
    await page.setViewportSize({width,height:900});
    await page.goto('/?view=director');
    for (const role of ['director','guardian','desk','instructor','patrol']) {
      await page.getByTestId('account-menu').click();
      await page.getByTestId('account-choice-'+role).click();
      await expect(page.locator('#app-shell > .top .brand')).toBeVisible();
      await expect(page.locator('#app-shell > main')).toBeVisible();
      await expect(page.getByTestId('workspace-nav')).toBeVisible();
      const frame = await page.locator('#app-shell').boundingBox();
      expect(frame!.x).toBeGreaterThanOrEqual(0);
      expect(frame!.x+frame!.width).toBeLessThanOrEqual(width);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      await page.screenshot({path:`.piezas/design-review/frame-${role}-${width}.png`,fullPage:true});
    }
  });
}

