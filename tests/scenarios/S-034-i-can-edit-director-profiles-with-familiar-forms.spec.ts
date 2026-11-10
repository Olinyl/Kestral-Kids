// piezas-scenario: S-034 v=67e8f1833e9a
import {expect,test} from '@playwright/test';

test('child alerts, guardian cards, back buttons and qualifications are consistent',async({page})=>{
  await page.goto('/prototype?view=director&data=200');
  await page.getByTestId('director-nav-children').click();
  await page.getByTestId('parent-alert-prototype-child-0003').click();
  await page.getByTestId('parent-alert-message').fill('Please check your child’s pickup details.');
  await page.getByTestId('parent-alert-submit').click();
  await expect(page.getByTestId('director-feedback')).toContainText('No real message');
  await page.getByTestId('director-nav-guardians').click();
  await expect(page.getByTestId('director-guardian-row').first()).toContainText('Saturday');
  await expect(page.getByTestId('director-guardian-row').first()).toContainText('Spruce 3');
  await expect(page.getByTestId('director-guardian-row').first()).not.toContainText('Born');
  await page.screenshot({path:'.piezas/design-review/director-guardian-cards.png'});
  await expect(page.getByTestId('director-back')).toHaveCount(0);
  await page.getByTestId('director-nav-children').click();
  await expect(page.getByTestId('director-search')).toHaveAttribute('placeholder','Child name, bib or group');
  await page.getByTestId('director-nav-instructors').click();
  await page.getByTestId('instructor-open-demo-instructor-01').click();
  await expect(page.getByTestId('instructor-qualification')).toHaveJSProperty('tagName','SELECT');
  await page.getByTestId('instructor-qualification').selectOption('CSIA Level 3');
  await page.screenshot({path:'.piezas/design-review/director-instructor-form.png'});
  await page.getByTestId('instructor-save').click();
  await expect(page.getByTestId('director-instructor-row').first()).toContainText('CSIA Level 3');
});
test('director accepts either one complete emergency contact',async({page})=>{
  await page.goto('/?view=director');
  await page.getByTestId('director-nav-children').click();
  await page.getByTestId('child-open-demo-child-01').click();
  await page.getByTestId('child-emergency-name').fill('');
  await page.getByTestId('child-emergency-phone').fill('');
  await page.getByTestId('child-save').click();
  await expect(page.getByTestId('child-dialog')).not.toBeVisible();
  await expect(page.getByTestId('director-feedback')).toContainText('Maya Chen');
});
