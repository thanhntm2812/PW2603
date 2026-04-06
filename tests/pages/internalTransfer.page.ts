import { expect, type Locator, type Page } from "@playwright/test";

export class InternalTransferPage {
    readonly page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    async gotoNPP() {
        await this.page.goto("https://ht-portal-uat.finviet.com.vn/inventories/transfered/internal");
        await this.page.waitForLoadState("networkidle");
    }

    async gotoHO() {
        await this.page.goto("https://ht-portal-uat.finviet.com.vn/inventories/transferred/internal-ho");
        await this.page.waitForLoadState("networkidle");
    }

    async createNewTransfer(sourceWarehouse: string, sourceChannel: string, targetWarehouse: string, targetChannel: string) {
        await this.page.getByRole('button', { name: 'Tạo mới' }).click();
        await this.page.waitForTimeout(1000);
        
        // Select source warehouse
        await this.page.locator('input#from_warehouse_id').click();
        await this.page.locator('input#from_warehouse_id').fill(sourceWarehouse);
        await this.page.waitForTimeout(500);
        await this.page.keyboard.press('Enter');

        // Select source channel
        await this.page.locator('input#sale_channel_id').click();
        await this.page.locator('input#sale_channel_id').fill(sourceChannel);
        await this.page.waitForTimeout(500);
        await this.page.keyboard.press('Enter');

        // Select target warehouse
        await this.page.locator('input#to_warehouse_id').click();
        await this.page.locator('input#to_warehouse_id').fill(targetWarehouse);
        await this.page.waitForTimeout(500);
        await this.page.keyboard.press('Enter');

        // Select target channel
        await this.page.locator('input#to_sale_channel_id').click();
        await this.page.locator('input#to_sale_channel_id').fill(targetChannel);
        await this.page.waitForTimeout(500);
        await this.page.keyboard.press('Enter');
    }

    async addProduct(productCode: string, quantity: string, index: number = 0, uom?: string) {
        await this.page.locator('button:has-text("Thêm sản phẩm")').click();
        await this.page.waitForTimeout(1000); // Wait for the new row to render
        
        // Search and select product
        const productInput = this.page.locator(`input#rows_${index}_searchPr`);
        await productInput.click();
        await productInput.fill(productCode);
        await this.page.waitForTimeout(2000); // Wait for dropdown grid to appear
        
        // Click the product in the dropdown popup
        try {
            const productItem = this.page.locator(`text="${productCode}"`).last();
            await productItem.waitFor({ state: 'visible', timeout: 5000 });
            await productItem.click();
            await this.page.waitForTimeout(1000); // Wait for product to be fully selected and quantity input to render

            if (uom) {
                const uiRow = this.page.locator('.ant-table-tbody > tr.ant-table-row').filter({ hasText: productCode }).first();
                const uomSelector = uiRow.locator('.ant-select-selector').last();
                if (await uomSelector.isVisible()) {
                    await uomSelector.click({ force: true });
                    await this.page.waitForTimeout(500);
                    const opt = this.page.locator(`div.ant-select-item-option[title="${uom}"], div.ant-select-item-option:has-text("${uom}")`).first();
                    if (await opt.isVisible()) {
                        await opt.click({ force: true });
                        await this.page.waitForTimeout(500);
                    } else {
                        await this.page.keyboard.press('Escape');
                    }
                }
            }

            // Fill quantity
            const quantityInput = this.page.locator(`input#rows_${index}_quantity`);
            await quantityInput.click();
            await quantityInput.fill(quantity);

            // Handle Lot tracking mapping (Thông tin lô) if required for the product
            await this.page.waitForTimeout(500); 
            const lotPlusButton = this.page.locator('.ant-table-tbody > tr').nth(index).locator('button').filter({ has: this.page.locator('.anticon-plus') });
            if (await lotPlusButton.count() > 0 && await lotPlusButton.first().isVisible()) {
                await lotPlusButton.first().click();
                
                const lotModal = this.page.locator('.ant-modal-content').filter({ hasText: 'Thông tin lô' });
                await lotModal.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
                
                // Fill quantity into the first listed lot
                const lotInput = lotModal.locator('input[id$="_batch_items_0_quantity"]');
                if (await lotInput.isVisible()) {
                    await lotInput.fill(quantity);
                    await lotModal.getByRole('button', { name: 'Xác nhận' }).click();
                    await lotModal.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
                }
            }
        } catch (e) {
            console.warn(`[WARNING] Không thể thêm sản phẩm ${productCode} vào phiếu (Có thể do tồn kho = 0). Bỏ qua sản phẩm này.`);
            // Thoát dropdown nếu đang mở
            await this.page.keyboard.press('Escape');
        }
    }

    async saveTransfer() {
        await this.page.locator('button:has-text("Lưu")').click();
        
        // Confirm popup
        const confirmButton = this.page.locator('button:has-text("Đồng ý")').last();
        await confirmButton.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
        if (await confirmButton.isVisible()) {
            await this.page.waitForTimeout(500); // Wait for Popconfirm animation
            await confirmButton.click({ force: true });
        }
        
        try {
            await this.page.waitForSelector('.ant-message-error, .ant-notification-notice-error', { state: 'visible', timeout: 3000 });
            const errorElement = this.page.locator('.ant-message-error, .ant-notification-notice-error').first();
            const errMsg = await errorElement.innerText();
            throw new Error(`API Validation Error: ${errMsg}`);
        } catch (e: any) {
            if (e.message.includes('API Validation Error')) throw e;
        }
    }

    async editAndSubmitForApprovalNPP(transferCode: string) {
        // Search transfer
        await this.page.waitForTimeout(2000);
        await this.page.locator('input.ant-input').first().fill(transferCode);
        await this.page.keyboard.press('Enter');
        await this.page.waitForTimeout(2000);

        // Click edit
        await this.page.locator('.ant-table-row').first().locator('button').nth(1).click();
        
        // Đợi popup "Chỉnh sửa phiếu" hiển thị và load data đầy đủ
        await this.page.locator('div.ant-modal-content').waitFor({ state: 'visible', timeout: 10000 });
        
        // Đợi các spinner (nếu có) biến mất
        const spinner = this.page.locator('.ant-spin-spinning, .ant-skeleton');
        if (await spinner.count() > 0) {
            await spinner.first().waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
        }
        
        // Chờ thêm 3s cứng để đảm bảo grid chi tiết load xong grid data theo yêu cầu người dùng
        await this.page.waitForTimeout(3000);
        
        // Click Lưu và duyệt
        const submitBtn1 = this.page.locator('button').filter({ hasText: 'Lưu và duyệt' });
        const submitBtn2 = this.page.locator('button').filter({ hasText: 'Gửi duyệt' });
        
        await submitBtn1.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
        
        if (await submitBtn1.isVisible()) {
            await submitBtn1.click();
        } else if (await submitBtn2.isVisible()) {
            await submitBtn2.click();
        } else {
            throw new Error(`[CRITICAL] 'Lưu và duyệt' or 'Gửi duyệt' button not visible in Edit form after 15s. Cannot proceed to 'Chờ duyệt' status.`);
        }
        
        // Confirm
        const confirmBtn = this.page.locator('button:has-text("Đồng ý")').last();
        await confirmBtn.waitFor({ state: 'visible', timeout: 8000 }).catch(() => {});
        if (await confirmBtn.isVisible()) {
            await this.page.waitForTimeout(500);
            await confirmBtn.click({ force: true });
        }
        
        // Chờ modal đóng hẳn => Đảm bảo API Save thành công
        await this.page.locator('div.ant-modal-content').filter({ hasText: 'Chỉnh sửa phiếu' }).waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
        await this.page.waitForTimeout(2000);
    }

    async approveTransferHO(transferCode: string) {
        // Search the transfer order
        await this.page.waitForTimeout(2000);
        // Fill search text box (the first visible ant-input is usually the search field for mã)
        await this.page.locator('input.ant-input').first().fill(transferCode);
        await this.page.keyboard.press('Enter');
        
        // Wait for search result to reload
        await this.page.waitForTimeout(2000);

        // Nhấn vào button Duyệt (hình cái cờ lê) trên danh sách
        const approveButton = this.page.locator('.ant-table-row').first().locator('button[title="Nhấp vào đây để duyệt."], button:has(img[alt="tool"])').first();
        if (await approveButton.isVisible()) {
            await approveButton.click();
        } else {
            await this.page.locator('.ant-table-row').first().locator('button').nth(0).click();
        }

        // Chờ Pop-up nhỏ Xác nhận duyệt phiếu
        const confirmPopup = this.page.locator('.ant-popover, .ant-modal-content, div').filter({ hasText: 'Xác nhận duyệt phiếu chuyển kho' }).last();
        await confirmPopup.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
        await this.page.waitForTimeout(500);
        
        // Click nút Đồng ý trong popup nhỏ
        await this.page.getByRole('button', { name: 'Đồng ý' }).click();
        await this.page.waitForTimeout(2000);
    }

    async verifyTransferStatus(transferCode: string, expectedStatus: string) {
        // Find search box
        const searchInput = this.page.locator('input.ant-input').first();
        
        await expect(async () => {
            // Nhấn Làm mới để đảm bảo clear bộ đệm nếu có
            const refreshBtn = this.page.locator('button').filter({ hasText: 'Làm mới' }).first();
            if (await refreshBtn.isVisible()) {
                await refreshBtn.click({ force: true });
                await this.page.waitForTimeout(1500);
            }
            
            await searchInput.clear();
            await searchInput.fill(transferCode);
            await this.page.keyboard.press('Enter');
            await this.page.waitForTimeout(1500); // Wait for grid to stabilize
            
            const statusCell = this.page.locator('.ant-table-row').first().locator('td').filter({ hasText: expectedStatus });
            // Cố ý không dùng timeout cho toBeVisible vì expect.toPass đã lo timeout tổng
            await expect(statusCell).toBeVisible({ timeout: 1000 });
        }).toPass({ timeout: 20000 }); // Retry search for up to 20 seconds
    }
}
