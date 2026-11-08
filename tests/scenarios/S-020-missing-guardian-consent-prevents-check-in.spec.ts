// piezas-scenario: S-020 v=1ed9531f699d
import {expect,test} from '@playwright/test';

test('S-020: role requirement',async({page})=>{
  await page.goto('/');
  await page.getByTestId('ops-open-demo-child-02').click();
  await page.getByTestId('checkin-clothing').fill('Blue jacket, black helmet');
  await expect(page.getByTestId('checkin-save')).toBeDisabled();
  await expect(page.getByTestId('ops-detail')).toContainText('Guardian consent is required before check-in');
  await page.getByTestId('ops-close').click();
  await expect(page.getByTestId('roster-row').filter({hasText:'Noah Singh'})).toContainText('Expected');
  await page.getByTestId('ops-open-demo-child-02').click();
  await expect(page.getByTestId('checkin-save')).toBeDisabled();
});
