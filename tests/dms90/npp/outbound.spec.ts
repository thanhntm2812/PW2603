import { test, expect } from '@playwright/test';
/**
 * TC04: outbound successful with sell-out order
 * 
 * pre-condition: User has an account and valid credentials

1. Open browser
2. Navigate to https://ht-portal-uat.finviet.com.vn/auth/login
3. Fill in username with PWQCMT
4. Fill in the password with PWtest@123
5. Click on Login button
6. And the home page is appear
  * Actions:
7. Click on menu Quản Lý bán Hàng
8. Click on sub-menu Xuất kho 
9. Click on button Tạo phiếu xuất kho
10. Fill in the required fields
11. Click on button Lưu và duyệt
  * Assertions:
12. Verify that status = Đã duyệt
 */

test('outbound successful with an sell-out order', async ({ page }) => {

  await page.goto('https://ht-portal-uat.finviet.com.vn/auth/login');
  
  await page.getByRole('textbox', { name: 'Nhập vào tài khoản.' }).fill('PWQC0011');
  await page.getByRole('textbox', { name: 'Nhập vào mật khẩu.' }).fill('Abc@123123');
  await page.getByRole('button', { name: 'Đăng nhập' }).click();

  
  await page.getByText('Quản Lý Bán Hàng').click();
  await page.getByRole('link', { name: 'Xuất Kho' }).click();
  await page.getByRole('button', { name: 'plus Tạo mới' }).click();

  await page.locator('.ant-select.ant-select-outlined.ant-select-in-form-item > .ant-select-selector > .ant-select-selection-wrap > .ant-select-selection-search').first().click();
  await page.getByText('Kho bán').click();

  await page.locator('div:nth-child(3) > .ant-form-item > .ant-row > .ant-col.ant-form-item-control > .ant-form-item-control-input > .ant-form-item-control-input-content > .ant-select > .ant-select-selector > .ant-select-selection-wrap > .ant-select-selection-search').click();
  await page.getByRole('combobox', { name: '* Kênh bán hàng' }).fill('chung');
  await page.getByTitle('CHUNG').nth(1).click();

  await page.getByRole('textbox', { name: 'Tìm kiếm theo Mã đơn hàng' }).click();
  await page.locator('.ant-table-cell > .ant-checkbox-wrapper').first().click();

  await page.getByRole('button', { name: 'Hoàn tất' }).click();
  //await expect(page.getByRole('button', { name: 'plus', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Lưu & Duyệt' }).click();
  await page.getByRole('button', { name: 'Đồng ý' }).click();

  await expect(page.getByText('Dữ liệu đang được thêm.')).toBeVisible();
  await expect(page.getByText('Thêm thành công')).toBeVisible();
});
  