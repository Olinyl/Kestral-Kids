// piezas-scenario: S-035 v=f9df3cbd905a
import {expect,test} from '@playwright/test';

test('group combobox Enter stages membership without closing or saving',async({page})=>{
  await page.goto('/?view=director');
  await page.getByTestId('director-nav-groups').click();
  await expect(page.locator('.d-child-link')).toHaveCount(0);
  await page.getByTestId('group-open-spruce-3').click();
  const search=page.getByTestId('group-child-search');
  await expect(search).toHaveAttribute('role','combobox');
  await search.fill('Noah');
  await page.screenshot({path:'.piezas/design-review/director-group-combobox.png'});
  await search.press('ArrowDown');
  await search.press('Enter');
  await expect(page.getByTestId('group-dialog')).toBeVisible();
  await expect(page.getByTestId('group-members')).toContainText('Noah Singh');
  await page.getByTestId('dialog-close').click();
  await page.getByTestId('group-open-spruce-3').click();
  await expect(page.getByTestId('group-members')).not.toContainText('Noah Singh');
});
