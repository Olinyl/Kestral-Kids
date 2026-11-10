// piezas-scenario: S-017 v=68ea61c415bc
import { expect, test } from '@playwright/test';

test('S-017: role workflow', async ({page}) => {
  await page.setViewportSize({width:1440,height:1000});
  await page.goto('/');
  await page.getByTestId('roster-search').fill('Cedar 1');
  await expect(page.getByTestId('roster-row')).toHaveCount(1);
  await page.getByTestId('ops-open-demo-child-02').click();
  await expect(page.getByTestId('ops-detail')).toContainText('Consent needed');
  await expect(page.getByTestId('ops-detail')).toContainText('Priya Singh');
  await expect(page.getByTestId('ops-detail')).toContainText('Second emergency contact');
  await expect(page.getByTestId('ops-detail')).toContainText('Medical information missing');
  await expect(page.getByTestId('checkin-jacket')).toBeVisible();
  await expect(page.getByTestId('checkin-helmet')).toBeVisible();
});

test('S-017: Saved current clothing appears after reopening', async ({page}) => {
  await page.goto('/');
  await page.getByTestId('ops-open-demo-child-01').click();
  await page.getByTestId('checkin-jacket').selectOption('orange');
  await page.getByTestId('checkin-helmet').selectOption('white');
  await page.getByTestId('checkin-save').click();
  await page.getByTestId('ops-close').click();
  await page.getByTestId('ops-open-demo-child-01').click();
  await expect(page.getByTestId('checkin-jacket')).toHaveValue('orange');
  await expect(page.getByTestId('checkin-helmet')).toHaveValue('white');
  await expect(page.getByTestId('ops-detail')).toContainText('orange jacket, white helmet');
});
