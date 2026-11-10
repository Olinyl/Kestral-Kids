// piezas-scenario: S-043 v=c67b5a148c7f
import { expect, test } from '@playwright/test';

test('S-043: Staff can review alerts in a consistent style', async ({page}) => {
  await page.goto('/?view=instructor');
  const alerts=page.getByTestId('instructor-nav-alerts');
  await expect(alerts).toBeVisible();
  await alerts.click();
  await expect(page.getByTestId('instructor-alerts')).toContainText('You’re all caught up');

  await page.getByRole('button',{name:'Group roster'}).click();
  await page.getByTestId('instructor-report-missing').click();
  await page.getByTestId('radio-child').selectOption('demo-child-01');
  await page.getByTestId('radio-place').fill('Lower lodge entrance');
  await page.getByTestId('radio-save').click();
  await page.getByTestId('ops-close').click();
  await alerts.click();
  await expect(page.getByTestId('instructor-alerts')).toContainText('Missing-child report sent for Maya Chen');
  await page.getByTestId('instructor-alerts').getByRole('button',{name:'Clear alerts'}).click();
  await expect(alerts.locator('.nav-alert-count')).toHaveCount(0);

  await page.getByRole('button',{name:'Group roster'}).click();
  await page.getByTestId('instructor-report-missing').click();
  await page.getByTestId('radio-child').selectOption('demo-child-01');
  await page.getByTestId('radio-place').fill('Lower lodge entrance');
  await page.getByTestId('radio-save').click();
  await page.getByTestId('ops-close').click();
  await expect(alerts.locator('.nav-alert-count')).toHaveText('1');
  await alerts.click();
  await expect(alerts.locator('.nav-alert-count')).toHaveCount(0);
  await expect(page.getByTestId('instructor-alerts')).toContainText('Missing-child report updated for Maya Chen');

  await page.goto('/?view=director');
  const directorAlerts=page.getByTestId('director-nav-alerts');
  await expect(directorAlerts).toBeVisible();
  await directorAlerts.click();
  await expect(page.getByTestId('director-alerts')).toContainText('School updates and safety reports');
  await expect(page.getByTestId('director-alerts').locator('.i-notification-empty')).toBeVisible();
});
