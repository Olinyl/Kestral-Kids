// piezas-scenario: S-026 v=9c1d9075db0c
import {expect,test} from '@playwright/test';

test('S-026: director workflow',async({page})=>{
  for(const width of [390,820]) {
    await page.setViewportSize({width,height:900});
    await page.goto('/');
    for(const role of ['director','desk','guardian','instructor','patrol']) {
      await page.getByTestId('account-menu').click();
      await page.getByTestId('account-choice-'+role).click();
      const tabs=page.getByTestId('workspace-nav').getByRole('button');
      if(role==='director') await expect(tabs).toHaveCount(6);
      for(const tab of await tabs.all()) {
        await tab.click();
        await expect(tab).toHaveAttribute('aria-current','page');
        const box=await tab.boundingBox();
        expect(box.y).toBeGreaterThan(800);
        expect(box.y+box.height).toBeLessThanOrEqual(900);
      }
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
    }
  }
});
