// piezas-scenario: S-018 v=e54958c03e99
import { expect, test } from '@playwright/test';

test('S-018: role workflow', async ({page}) => {
  await page.goto('/');
  await page.getByRole('button',{name:'Pickup',exact:true}).click();
  await page.getByTestId('ops-open-demo-child-01').click();
  await expect(page.getByTestId('pickup-adult')).not.toContainText('Unlisted');
  await expect(page.getByTestId('pickup-adult')).toContainText('Daniel Chen');
  await page.getByTestId('pickup-adult').selectOption('1');
  await page.getByTestId('pickup-staff').fill('Desk Demo');
  await page.getByTestId('pickup-verified').check();
  await page.getByTestId('pickup-save').click();
  await expect(page.getByTestId('ops-detail')).toContainText('Released to Daniel Chen');
  await expect(page.getByTestId('ops-detail')).toContainText('Desk Demo');
  await expect(page.getByTestId('pickup-save')).toHaveCount(0);
  await expect(page.getByTestId('release-time')).toContainText(/\d{2}:\d{2}/);
  await page.getByTestId('ops-close').click();
  await page.getByTestId('view-as').selectOption('director');
  await expect(page.getByTestId('director-checked-count')).toHaveText('0 / 2');
  await page.getByTestId('director-nav-children').click();
  await expect(page.getByTestId('director-child-row').filter({hasText:'Maya Chen'})).toContainText('Released');
});
