import { test, expect } from '@playwright/test';
/**
 * TC03: Create PO : Login successful with valid credentials
 * 
 * pre-condition: User has an account and valid credentials
1. Open browser
2. Navigate to https://ht-portal-uat.finviet.com.vn/auth/login
3. Fill in username with PWQCMT
4. Fill in the password with PWtest@123
5. Click on Login button And the home page is appear

 * Actions:
6. Click on menu Quản Lý Mua Hàng
7. Click on sub-menu Purchase Orders
8. Click on button Approve

 * Assertions:
9. Verify that status = Đã duyệt
 */
test('Login successful with valid credentials', async ({ page }) => {
  await page.goto('https://ht-portal-uat.finviet.com.vn/auth/login');

  await page.getByRole('textbox', { name: 'Nhập vào tài khoản.' }).fill('PWQCMT');
  await page.getByRole('textbox', { name: 'Nhập vào mật khẩu.' }).fill('PWtest@123');
  await page.getByRole('button', { name: 'Đăng nhập' }).click();

  await expect(page.getByText('Nhà phân phối: VPDD RECKITT')).toBeVisible();

  
});