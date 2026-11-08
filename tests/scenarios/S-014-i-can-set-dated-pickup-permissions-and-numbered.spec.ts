// piezas-scenario: S-014 v=ed93441ee802
import { expect, test } from '@playwright/test';
test('S-014: Dated pickup permissions and numbered levels', async ({ page }) => {
 await page.goto('/?view=director');
 await page.getByTestId('director-nav-children').click();
 await page.getByTestId('child-open-demo-child-01').click();
 await page.getByTestId('pickup-0-until').fill('2026-12-11');
 await page.getByTestId('child-save').click();
 await page.getByTestId('child-open-demo-child-01').click();
 await expect(page.getByTestId('pickup-0-status')).toHaveText('Expired');
 await page.keyboard.press('Escape');
 await page.getByTestId('director-nav-groups').click();
 await page.getByTestId('group-open-spruce-3').click();
 await page.getByTestId('group-level').selectOption('Level 3');
 await page.getByTestId('group-save').click();
 await expect(page.getByTestId('director-group-row').filter({ hasText: 'Spruce 3' })).toContainText('Level 3');
});
