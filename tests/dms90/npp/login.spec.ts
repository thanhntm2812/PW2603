import { test, expect } from '@playwright/test';
/**
 * TC01: Form Authentication : Login successful with valid credentials

Open browser
Navigate to https://ht-portal-uat.finviet.com.vn/auth/login
Fill in username with PWQCMT
Fill in the password with PWtest@123
Click on Login button
And the home page is appear
 */

test('Login NPP successful', async ({ page }) => {
  await page.goto('https://ht-portal-uat.finviet.com.vn/auth/login');

  const clearAutofillButton = page.getByRole('button', { name: 'close-circle' });
  if (await clearAutofillButton.isVisible()) {
    await clearAutofillButton.click();
  }

  await page.getByRole('textbox', { name: 'Nhập vào tài khoản.' }).fill('PWQCMT');
  await page.getByRole('textbox', { name: 'Nhập vào mật khẩu.' }).fill('Abc@123123');
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
  await page.waitForLoadState('networkidle');

  await expect(page.getByText('Nhà phân phối: VPDD RECKITT')).toBeVisible({ timeout: 15000 });
  await expect(page.getByText('pwqcmt')).toBeVisible({ timeout: 15000 });
  
});