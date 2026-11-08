// piezas-scenario: S-022 v=9961e3f5bb3f
import {expect,test} from '@playwright/test';

test('S-022: role requirement',async({page})=>{
  for(const width of [320,1440]) {
    await page.setViewportSize({width,height:844});
    await page.goto('/');
    await expect(page.getByTestId('workspace-nav').getByRole('button')).toHaveCount(2);
    for(const name of ['Roster','Incidents']) {
      const tab=page.getByTestId('workspace-nav').getByRole('button',{name,exact:true});
      await tab.click();
      await expect(tab).toHaveAttribute('aria-current','page');
      await expect(page.getByTestId('operations')).toBeVisible();
      await page.evaluate(()=>scrollTo(0,document.body.scrollHeight));
      const box=await tab.boundingBox();
      expect(box.y+box.height).toBeLessThanOrEqual(844);
      expect(box.y).toBeGreaterThan(750);
    }
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
    const footer=page.getByTestId('operations').locator('.o-warning');
    await expect(footer).toContainText('Contact patrol by radio');
  }
});
