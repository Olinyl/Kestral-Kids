// piezas-scenario: S-033 v=090bd085a93e
import {expect,test} from '@playwright/test';

test('all overview profiles remain available on a phone',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/prototype?data=200');
 await page.getByTestId('account-menu').click();
      await page.getByTestId('account-choice-'+'director').click();
 const consent=page.getByTestId('director-missing-consent').locator('.d-overview-scroll');
 const medical=page.getByTestId('director-medical-list');
 expect(await consent.getByTestId('director-overview-profile').count()).toBeGreaterThan(5);
 expect(await medical.getByTestId('director-overview-profile').count()).toBeGreaterThan(5);
 await consent.scrollIntoViewIfNeeded();
 await consent.evaluate(e=>e.scrollTop=e.scrollHeight);
 await expect(consent.getByTestId('director-overview-profile').last()).toBeInViewport();
 await medical.scrollIntoViewIfNeeded();
 await medical.evaluate(e=>e.scrollTop=e.scrollHeight);
 await expect(medical.getByTestId('director-overview-profile').last()).toBeInViewport();
 await expect(page.getByTestId('workspace-nav')).toBeInViewport();
 await expect(page.locator('#app-shell > .top')).toBeInViewport();
 await page.screenshot({path:'.piezas/design-review/director-overview-phone.png'});
});
