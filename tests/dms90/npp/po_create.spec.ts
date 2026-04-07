import { test, expect } from '@playwright/test';
/**
 * TC02: Create PO : Login successful with valid credentials
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
8. Click on button Tạo mới

9. Click on combobox Kho and select 2BD11 - BACH DANG - kho bán
10. Click on button Thêm sản phẩm
11. Click on textbox Tìm kiếm theo Mã | Tên sản ph and fill in kinder
12. Click on cell 182052
13. Click on spinbutton Nhập vào Số lượng and fill in 10
14. Click on button Lưu
15. Click on button Đồng ý

 * Assertions:
16. Verify that the message Thêm thành công is displayed
17. Verify that the total price 237,600 is displayed

 */

test('DMS90 - Create PO with valid data', async ({ page }) => {
  await page.goto('https://ht-portal-uat.finviet.com.vn/auth/login');

  await page.getByRole('textbox', { name: 'Nhập vào tài khoản.' }).fill('PWQCMT');
  await page.getByRole('textbox', { name: 'Nhập vào mật khẩu.' }).fill('Abc@123123');
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
  await expect(page.getByText('Nhà phân phối: VPDD RECKITT')).toBeVisible();

  await page.getByRole('menuitem', { name: 'idcard Quản Lý Mua Hàng' }).click();
  await page.getByRole('link', { name: 'Purchase Orders' }).click();
  await page.getByRole('button', { name: 'plus Tạo mới' }).click();

  await page.getByRole('combobox', { name: '* Kho' }).click();
  await page.getByText('2BD11 - BACH DANG - kho bán (').click();
  await page.getByRole('button', { name: 'Thêm sản phẩm' }).click();
  await page.getByRole('textbox', { name: 'Tìm kiếm theo Mã | Tên sản ph' }).click();
  await page.getByRole('textbox', { name: 'Tìm kiếm theo Mã | Tên sản ph' }).fill('KINDER');
  await page.getByRole('cell', { name: '182077' }).click();

  await page.getByRole('spinbutton', { name: 'Nhập vào Số lượng' }).click();
  await page.getByRole('spinbutton', { name: 'Nhập vào Số lượng' }).fill('10');

  await expect(page.getByLabel('Tạo mới đơn đặt hàng (PO)').locator('form')).toContainText('725,000');

  await page.getByRole('button', { name: 'Lưu' }).click();

  //await page.getByRole('tooltip', { name: 'exclamation-circle Bạn có chắ' }).click();
  //await page.getByText('Bạn có chắc chắn thao tác thê').click();
  await page.getByRole('button', { name: 'Đồng ý' }).click();

  await expect(page.getByText('Dữ liệu đang được thêm.')).toBeVisible();
  await expect(page.getByText('Thêm thành công')).toBeVisible();
  //await expect(page.locator('tbody')).toContainText('725,000');
});