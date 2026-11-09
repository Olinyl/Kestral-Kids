// piezas-scenario: S-028 v=36caa003a49c
import { expect, test } from '@playwright/test';

test('S-028: Patrol can review active missing-child alerts', async ({ page }) => {
  await page.goto('/?view=patrol');

  await expect(page.getByTestId('workspace-title')).toHaveText('Patrol workspace');
  await expect(page.getByTestId('demo-banner')).toBeVisible();
  await expect(page.getByTestId('patrol-alert')).toContainText('Owen Parr');
  await expect(page.getByTestId('patrol-alert')).toContainText('Owen Okafor-Parr');
  await expect(page.getByTestId('patrol-alert')).toContainText('KKS-2026-014');
  await expect(page.getByTestId('patrol-alert')).toContainText('Group 14 · Level 3');
  await expect(page.getByTestId('patrol-alert')).toContainText('Feb 7, 2:30 PM');
  await expect(page.getByTestId('patrol-alert')).toContainText('Top of Pigeon chair');
  await expect(page.getByTestId('patrol-alert')).toContainText('Under 20 metres');
  await expect(page.getByTestId('patrol-alert')).toContainText('Injuries: Unknown');
  await expect(page.getByTestId('patrol-alert')).toContainText('Mild asthma');
  await expect(page.getByTestId('patrol-alert')).toContainText('unverified');
  await expect(page.getByTestId('patrol-alert')).toContainText('Not recorded by instructor');
  await expect(page.getByTestId('patrol-alert')).toContainText('Pass number is unknown');
  await expect(page.getByTestId('patrol-alert')).toContainText('Melissa Parr');
  await expect(page.getByTestId('patrol-alert')).toContainText('416-555-0142');
  await expect(page.getByTestId('patrol-alert')).toContainText('Daniel Okafor');
  await expect(page.getByTestId('patrol-alert')).toContainText('Incomplete number');
  await expect(page.getByTestId('patrol-escalation')).toContainText('3:30 PM');
  await expect(page.getByTestId('patrol-alert')).toContainText('Police lead family communication once engaged');

  await page.getByTestId('patrol-request-lift-scan').click();
  await expect(page.getByTestId('patrol-action-message')).toContainText('No scan request was sent');
  await page.getByTestId('patrol-call-police').click();
  await expect(page.getByTestId('patrol-action-message')).toContainText('This preview does not place calls');

  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.getByTestId('patrol-copy-report').click();
  await expect(page.getByTestId('patrol-action-message')).toContainText('Police report details copied');
  const copiedReport = await page.evaluate(() => navigator.clipboard.readText());
  expect(copiedReport).toContain('Owen Okafor-Parr');
  expect(copiedReport).toContain('Blue inhaler kept in jacket pocket');
  expect(copiedReport).toContain('604-555-187');
});
