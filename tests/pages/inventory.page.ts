import { expect, type Locator, type Page } from "@playwright/test";

export class InventoryPage {
    readonly page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    async gotoList() {
        await this.page.goto("https://ht-portal-uat.finviet.com.vn/inventories/list");
        await this.page.waitForLoadState("networkidle");
    }

    async checkInventory(warehouse: string, channel: string, productCode: string): Promise<{ sysStock: number, availStock: number }> {
        console.log(`Checking inventory for ${productCode} in ${warehouse} - ${channel}`);
        
        // 1. Kiểm tra xem Popup "Tạo mới phiếu kiểm kho" đã mở chưa
        const modalContent = this.page.locator('div.ant-modal-content:visible').first();
        if (!(await modalContent.isVisible())) {
            await this.page.locator('button.ant-btn:has-text("Tạo mới")').click();
            await this.page.waitForTimeout(2000);
        }
        
        // 2. Chọn Kho (xóa data cũ nếu đang mở form)
        const warehouseInput = modalContent.locator('input#warehouse_id');
        await warehouseInput.clear();
        await warehouseInput.click({ force: true });
        await warehouseInput.clear();
        await this.page.keyboard.type(warehouse, { delay: 50 });
        const whItem = this.page.locator(`div.ant-select-item-option[title="${warehouse}"]`).first();
        await whItem.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
        if (await whItem.isVisible()) {
            await whItem.click({ force: true });
        } else {
            await this.page.keyboard.press('Enter');
        }

        // 3. Chọn Kênh
        const channelInput = modalContent.locator('input#sale_channel_id');
        await channelInput.click({ force: true });
        await channelInput.clear();
        await this.page.keyboard.type(channel, { delay: 50 });
        const chItem = this.page.locator(`div.ant-select-item-option[title="${channel}"]`).first();
        await chItem.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
        if (await chItem.isVisible()) {
            await chItem.click({ force: true });
        } else {
            await this.page.keyboard.press('Enter');
        }

        // 4. Tìm kiếm Mã sản phẩm
        const searchInput = modalContent.locator('input.ant-input[placeholder*="Tìm kiếm theo Mã sản phẩm"]');
        await searchInput.clear();
        await searchInput.fill(productCode);
        await searchInput.focus();
        await this.page.waitForTimeout(500);
        await this.page.keyboard.press('Enter');
        await this.page.waitForTimeout(2000); // Wait for grid to load

        try {
            // Lấy cột 3 (Tồn kho hệ thống) và cột 4 (Có sẵn) từ bảng lưới trong dialog
            const rowLocator = modalContent.locator(`tr:has-text("${productCode}")`).first();
            // Wait for row explicitly
            await rowLocator.waitFor({ state: 'visible', timeout: 5000 });
            const sysStockStr = await rowLocator.locator('td').nth(2).innerText();
            const availStockStr = await rowLocator.locator('td').nth(3).innerText();
            
            const availStock = parseInt(availStockStr.replace(/,/g, ''), 10) || 0;

            const sysStock = parseInt(sysStockStr.replace(/,/g, ''), 10) || 0;

            console.log(`[INVENTORY] Sản phẩm ${productCode}: Tồn hệ thống = ${sysStockStr.trim()} | Có sẵn = ${availStockStr.trim()} (Parsed: ${sysStock} | ${availStock})`);
            return { sysStock, availStock };
        } catch (e) {
            // Để dễ debug nếu tìm không ra, mình sẽ dump xem DOM lưới có những gì (nếu có row nào đó)
            const gridText = await modalContent.locator('table tbody').innerText().catch(() => "Empty Table");
            console.error(`Không thể đọc được tồn kho cho mã ${productCode} hoặc Lưới hiển thị rỗng.\nDữ liệu lưới hiện tại: ${gridText.substring(0, 50)}...`);
            return { sysStock: -1, availStock: -1 };
        }
    }
}
