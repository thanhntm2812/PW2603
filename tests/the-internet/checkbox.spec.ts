/**
 * TC02: Checkboxes : Check to a box
 * 
Open browser --Accessibility testing
Navigate to https://the-internet.herokuapp.com/checkboxes  --Accessibility testing
Check on checkbox1 --Actions
Verify checkbox1 is checked --Assertions
Check on checkbox2 --Actions
Verify checkbox2 is checked --Assertions
 */
import { test, expect } from '@playwright/test';

test('Check to a box', async ({ page }) => {
 
  await page.goto('https://the-internet.herokuapp.com/checkboxes');

  // Check the checkbox
  await page.getByRole('checkbox').first().check();

  //Assert that the checkbox is checked
  const locator = page.getByRole('checkbox').first();
  await expect(locator).toBeChecked();
});