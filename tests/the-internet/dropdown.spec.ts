/**
 * TC03: DropDown : Select option
1. Open browser
2. Navigate to https://the-internet.herokuapp.com/dropdown
3. Select "option 1"
4Validate "option 1" is selected
 */
import { test, expect } from '@playwright/test';

test('Select option', async ({ page }) => {
  await page.goto('https://the-internet.herokuapp.com/dropdown');
  await page.locator('select').selectOption('option 1');
  await expect(page.locator('select')).toHaveValue('option 1');
});

test('Dropdown', async ({ page }) => {
    await page.goto('https://the-internet.herokuapp.com/dropdown');


    await page.locator(`#dropdown`).selectOption({ label: 'Option 1' });
    // await expect(page.locator(`#dropdown`)).toHaveValue('1');
    await expect(page.locator(`#dropdown > option:checked`)).toHaveText('Option 1');
});
test('Dropdown with multiple options', async ({ page }) => {
    await page.goto('https://output.jsbin.com/osebed/2');
    await page.locator('#fruits').selectOption(['apple', 'banana']);
    await expect(page.locator('#fruits > option:checked')).toHaveText(['Banana', 'Apple' ]);
    await page.locator('#fruits').selectOption([]);
    await expect(page.locator('#fruits > option:checked')).toHaveText([]);
});