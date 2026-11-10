// piezas-scenario: S-010 v=12deff189ccb
import { expect, test } from '@playwright/test';
test('S-010: I can manage groups without overloading an instructor', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('account-menu').click();
      await page.getByTestId('account-choice-'+'director').click();
  await page.getByTestId('director-nav-instructors').click();
  await page.getByTestId('director-add').click();
  await page.getByTestId('instructor-name').fill('Taylor Reed');
  await page.getByTestId('instructor-email').fill('taylor@example.test');
  await page.getByTestId('instructor-phone').fill('+1 604 555 0108');
  await page.getByTestId('instructor-save').click();
  if(await page.getByTestId(/^(child|guardian|instructor|group)-profile$/).isVisible()) await page.getByTestId("dialog-close").click();
  await expect(page.getByTestId('director-instructor-row').filter({ hasText: 'Taylor Reed' })).toBeVisible();
  await page.getByTestId('director-nav-groups').click();
  await page.getByTestId('director-add').click();
  await page.getByTestId('group-name').fill('Aspen 2');
  await page.getByTestId('group-instructor').selectOption({ label: 'Taylor Reed' });
  await page.getByTestId('group-save').click();
  if(await page.getByTestId(/^(child|guardian|instructor|group)-profile$/).isVisible()) await page.getByTestId("dialog-close").click();
  await expect(page.getByTestId('director-group-row').filter({ hasText: 'Aspen 2' })).toBeVisible();
  await page.getByTestId('director-nav-children').click();
  for (const id of ['demo-child-01', 'demo-child-02']) {
    await page.getByTestId('child-open-' + id).click();
  await page.getByTestId(/^profile-edit-/).click();
    await page.getByTestId('child-group').selectOption({ label: 'Aspen 2' });
    await page.getByTestId('child-save').click();
  if(await page.getByTestId(/^(child|guardian|instructor|group)-profile$/).isVisible()) await page.getByTestId("dialog-close").click();
    await expect(page.getByTestId('child-dialog')).not.toBeVisible();
  }
  for (let i = 0; i < 5; i++) {
    await page.getByTestId('director-add').click();
    await page.getByTestId('child-name').fill('Demo Child ' + i);
    await page.getByTestId('child-emergency-name').fill('Demo Adult');
    await page.getByTestId('child-emergency-phone').fill('+1 604 555 0100');
    await page.getByTestId('child-group').selectOption({ label: 'Aspen 2' });
    await page.getByTestId('child-save').click();
  if(await page.getByTestId(/^(child|guardian|instructor|group)-profile$/).isVisible()) await page.getByTestId("dialog-close").click();
    if (i < 4) await expect(page.getByTestId('child-dialog')).not.toBeVisible();
  }
  await expect(page.getByTestId('form-error')).toContainText('six children');
  await page.keyboard.press('Escape');
  if(await page.getByTestId(/^(child|guardian|instructor|group)-profile$/).isVisible()) await page.getByTestId("dialog-close").click();
  await page.getByTestId('director-nav-groups').click();
  await expect(page.getByTestId('director-group-row').filter({ hasText: 'Aspen 2' })).toContainText('6 / 6');
});
