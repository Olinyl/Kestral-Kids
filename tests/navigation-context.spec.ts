import {expect,test} from '@playwright/test';

test('peer Director tabs use tabs, while dialogs use X and preserve the search',async({page})=>{
  await page.goto('/?view=director');
  for(const tab of ['children','guardians','instructors','groups']) {
    await page.getByTestId('director-nav-'+tab).click();
    await expect(page.getByTestId('director-back')).toHaveCount(0);
  }
  await page.getByTestId('director-nav-children').click();
  await page.getByTestId('director-search').fill('Maya');
  await page.screenshot({path:'.piezas/design-review/director-tabs-navigation.png'});
  await page.getByTestId('child-open-demo-child-01').click();
  await expect(page.getByTestId('dialog-close')).toHaveText('×');
  await page.getByTestId('dialog-close').click();
  await expect(page.getByTestId('director-search')).toHaveValue('Maya');
});

test('guardian consent has an integrated arrow that returns to children',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('/?view=guardian');
  await page.locator('[data-consent]').first().click();
  const heading=page.locator('.g-form-heading');
  await expect(heading.getByRole('heading')).toHaveText('Maya Chen');
  await page.screenshot({path:'.piezas/design-review/guardian-consent-back-phone.png'});
  await heading.getByRole('button',{name:'Back to my children'}).click();
  await expect(page.locator('[data-consent]').first()).toBeVisible();
  await expect(page.locator('.g-form-heading')).toHaveCount(0);
});
