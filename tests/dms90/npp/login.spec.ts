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

test('Login successful with valid credentials', async ({ page }) => {
  await page.goto('https://ht-portal-uat.finviet.com.vn/auth/login');

  await page.getByRole('textbox', { name: 'Nhập vào tài khoản.' }).fill('PWQCMT');
  await page.getByRole('textbox', { name: 'Nhập vào mật khẩu.' }).fill('PWtest@123');
  await page.getByRole('button', { name: 'Đăng nhập' }).click();

  await expect(page.getByText('Nhà phân phối: VPDD RECKITT')).toBeVisible();
  await expect(page.getByText('pwqcmt')).toBeVisible();
  
});