// piezas-scenario: S-037 v=f16af1c29504
import {expect,test} from '@playwright/test';

test('auto-assign offers a separate rebalance preview and preserves checked-in children',async({page})=>{
 await page.goto('/prototype?view=director&data=200');
 await page.getByTestId('director-nav-groups').click();
 await page.getByTestId('group-autoassign').click();
 await expect(page.getByTestId('autoassign-mode')).toHaveValue('unassigned');
 await expect(page.getByTestId('autoassign-preview')).toContainText('Every child already has a group');
 await expect(page.getByTestId('autoassign-apply')).toBeDisabled();
 await page.getByTestId('autoassign-mode').selectOption('rebalance');
 await expect(page.getByTestId('autoassign-preview')).toContainText('Checked-in, released and missing children stay in place');
 await expect(page.getByTestId('autoassign-apply')).toBeEnabled();
 await expect(page.locator('#autoassign-rows')).not.toContainText('Owen Parr');
 await page.getByTestId('autoassign-apply').click();
 await expect(page.getByTestId('director-feedback')).toContainText('assigned by recorded ability level');
 await expect(page.getByTestId('director-group-row').filter({hasText:'Spruce 3'})).toContainText('Owen Parr');
});
