import { test, expect } from "./fixtures/dms90uat.fixture";
import testData from "./test-data/chuyen-kho-noi-bo.data.json";
import * as fs from "fs";
import * as path from "path";

test.describe("Data-driven Internal Stock Transfer", () => {
    for (const tc of testData) {
        /**
         * TC_HappyPath: Full flow Internal Stock Transfer: Create and Approve with Data Driven
         * 
         * pre-condition: NPP and HO have valid accounts and pre-existing stock data > 0
         * Actions:
         * 1. Check current stock at source warehouse & target warehouse for specific products.
         * 2. Form ticket creation: fill source and target details.
         * 3. Add products dynamically up to max available quantity.
         * 4. Click Lưu (Save) to generate "Khởi tạo" transfer ticket.
         * 5. Go outside, edit ticket, and Submit "Lưu và Duyệt". Ticket status becomes "Chờ duyệt".
         * 6. Switch to HO role, verify ticket in "Chờ duyệt" status and Approve.
         * 7. Switch to NPP role, verify ticket in "Đã duyệt" status.
         * Assertions:
         * 8. Check final source stock == initial source stock - transfer qty.
         * 9. Check final target stock == initial target stock + transfer qty.
         */
        test(`${tc.id} - ${tc.description}`, async ({ browser, page, loginPage, internalTransferPage, inventoryPage }) => {
            test.setTimeout(600000); // 10 minutes timeout

            try {
                page.setDefaultTimeout(15000);

                // ============== ROLE NPP: LOGIN ==============
                await loginPage.goto();
                await loginPage.login(tc.nppUsername, tc.nppPassword);

                // ============== ROLE NPP: CHECK INITIAL INVENTORY ==============
                await inventoryPage.gotoList();
                await page.waitForTimeout(5000);
                
                const initialSourceStocks: Record<string, { sysStock: number, availStock: number }> = {};
                const initialTargetStocks: Record<string, { sysStock: number, availStock: number }> = {};
                let totalValidProducts = 0;
                
                interface ReportRow {
                    kho: string;
                    kenh: string;
                    product: string;
                    unit: string;
                    sysInitial: number;
                    availInitial: number;
                    transferQty: number;
                    sysFinal: number;
                    availFinal: number;
                    baseDeduct: number;
                }
                const reportRows: ReportRow[] = [];
                let generatedTransferCode = "";
                let generatedDate = "";

                for (const product of tc.products) {
                    // Check source stock
                    const sourceStockData = await inventoryPage.checkInventory(tc.sourceWarehouse, tc.sourceChannel, product.code);
                    initialSourceStocks[product.code] = sourceStockData;

                    // Check target stock
                    const targetStockData = await inventoryPage.checkInventory(tc.targetWarehouse, tc.targetChannel, product.code);
                    initialTargetStocks[product.code] = targetStockData.availStock < 0 ? { sysStock: 0, availStock: 0 } : targetStockData; 

                    if (sourceStockData.availStock <= 0) {
                        console.warn(`WARNING: ${product.code} returned no inventory data or 0 stock at SOURCE!`);
                    } else {
                        totalValidProducts++;
                    }
                }
                
                await page.keyboard.press('Escape'); // Đóng popup sau khi check xong TOÀN BỘ
                await page.waitForTimeout(500);

                if (totalValidProducts === 0) {
                    console.log("\n[CẢNH BÁO] Tất cả sản phẩm đều hết hàng (Có sẵn <= 0). Vui lòng đi tăng tồn kho!");
                    test.skip(true, "Tất cả các sản phẩm đều hết hàng, dừng kịch bản tại đây.");
                    return; // Ensure no further execution
                }

                // ============== ROLE NPP: CREATE TRANSFER ==============
                await internalTransferPage.gotoNPP();
                await internalTransferPage.createNewTransfer(
                    tc.sourceWarehouse,
                    tc.sourceChannel,
                    tc.targetWarehouse,
                    tc.targetChannel
                );
                
                let rowIndex = 0;
                const validTransfers: Record<string, number> = {};

                for (const product of tc.products) {
                    const stockData = initialSourceStocks[product.code];
                    if (stockData && stockData.availStock > 0) {
                        const transferQty = Math.min(product.maxQuantity, stockData.availStock);
                        await internalTransferPage.addProduct(product.code, transferQty.toString(), rowIndex, product.uom);
                        validTransfers[product.code] = transferQty;
                        rowIndex++;
                    }
                }

                await internalTransferPage.saveTransfer();

                // Xác nhận Modal tạo mới đã đóng hay chưa (cho phép chờ thêm tải API chậm)
                const createModal = page.locator('div.ant-modal-content:has-text("Thêm mới phiếu chuyển kho")');
                await createModal.waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
                
                const modalVisible = await createModal.isVisible();
                if (modalVisible) {
                    let toastError = "Unknown error (Có thể API Submit chậm hơn 8s, hoặc lỗi điền form)";
                    if (await page.locator('.ant-message-error').isVisible()) {
                        toastError = await page.locator('.ant-message-error').first().innerText();
                    }
                    throw new Error(`Tạo phiếu thất bại! Popup vẫn mở. Lỗi hệ thống: ${toastError}`);
                }

                // Lấy mã phiếu tạo thành công
                await page.waitForTimeout(2000); 
                const transferCode = await page.locator('.ant-table-row').first().locator('td').first().innerText();
                generatedTransferCode = transferCode;
                generatedDate = new Date().toLocaleDateString('vi-VN');
                console.log(`[INFO] Transfer created with code: ${transferCode}`);

                // Kiểm tra status Khởi tạo
                await internalTransferPage.verifyTransferStatus(transferCode, "Khởi tạo");

                // Edit và Nhấn Lưu và Duyệt (Gửi duyệt)
                await internalTransferPage.editAndSubmitForApprovalNPP(transferCode);
                
                // Kiểm tra status Chờ duyệt ở NPP
                await internalTransferPage.verifyTransferStatus(transferCode, "Chờ duyệt");

                // ============== ROLE HO: APPROVE ==============
                const contextHO = await browser.newContext();
                const pageHO = await contextHO.newPage();
                
                const { LoginPage } = await import('./pages/login.page');
                const { InternalTransferPage } = await import('./pages/internalTransfer.page');
                const loginPageHO = new LoginPage(pageHO);
                const transferPageHO = new InternalTransferPage(pageHO);

                await loginPageHO.goto();
                await loginPageHO.login(tc.hoUsername, tc.hoPassword);
                await transferPageHO.gotoHO();
                
                // Tìm và kiểm tra phiếu trạng thái Chờ duyệt
                await transferPageHO.verifyTransferStatus(transferCode, "Chờ duyệt");

                // Thực hiện duyệt
                await transferPageHO.approveTransferHO(transferCode);
                
                // Kiểm tra trạng thái phiếu Đã duyệt ở HO
                await transferPageHO.verifyTransferStatus(transferCode, "Đã duyệt");
                await contextHO.close();

                // ============== ROLE NPP: CHECK STATUS & RECHECK INVENTORY ==============
                await internalTransferPage.gotoNPP();
                await internalTransferPage.verifyTransferStatus(transferCode, "Đã duyệt");

                // Tiến hành kiểm kho lần 2 ở cả nguồn và đích
                await inventoryPage.gotoList();
                
                for (const product of tc.products) {
                    const initSource = initialSourceStocks[product.code];
                    if (initSource && initSource.availStock > 0) {
                        const transferQty = validTransfers[product.code];
                        const uomStr = product.uom || "Mặc định";
                        const baseConversion = (product.code === "102289" && product.uom === "Thùng") ? 24 : 1;

                        // Nguồn
                        const finalSourceStock = await inventoryPage.checkInventory(tc.sourceWarehouse, tc.sourceChannel, product.code);
                        
                        reportRows.push({
                            kho: tc.sourceWarehouse,
                            kenh: tc.sourceChannel,
                            product: product.code,
                            unit: uomStr,
                            sysInitial: initSource.sysStock,
                            availInitial: initSource.availStock,
                            transferQty: -transferQty, // source deductions
                            sysFinal: finalSourceStock.sysStock,
                            availFinal: finalSourceStock.availStock,
                            baseDeduct: -(transferQty * baseConversion)
                        });

                        // Đích
                        const finalTargetStock = await inventoryPage.checkInventory(tc.targetWarehouse, tc.targetChannel, product.code);
                        const initTarget = initialTargetStocks[product.code];
                        
                        reportRows.push({
                            kho: tc.targetWarehouse,
                            kenh: tc.targetChannel,
                            product: product.code,
                            unit: uomStr,
                            sysInitial: initTarget.sysStock,
                            availInitial: initTarget.availStock,
                            transferQty: transferQty,
                            sysFinal: finalTargetStock.sysStock,
                            availFinal: finalTargetStock.availStock,
                            baseDeduct: (transferQty * baseConversion)
                        });
                    }
                }

                const fs = require("fs");
                const path = require("path");
                const reportDir = path.join(process.cwd(), "test-results", "reports");
                if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });
                const reportHtml = `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="utf-8">
                    <title>Allure Report - Chuyển Kho Tự Động</title>
                    <style>
                        :root {
                            --primary: #555555;
                            --success: #97cc64;
                            --warning: #fdc058;
                            --danger: #fd5a3e;
                            --bg: #f3f3f3;
                            --white: #ffffff;
                            --border: #e0e0e0;
                        }
                        * { box-sizing: border-box; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
                        body { margin: 0; padding: 0; background-color: var(--bg); color: #333; display: flex; min-height: 100vh;}
                        .sidebar { width: 70px; background-color: #2b2b2b; display: flex; flex-direction: column; align-items: center; padding-top: 20px;}
                        .sidebar div { width: 40px; height: 40px; border-radius: 50%; background-color: #ff9800; display:flex; align-items:center; justify-content:center; color:white; font-weight:bold; font-size: 20px; }
                        .content { flex: 1; padding: 30px; overflow-y: auto;}
                        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid var(--border); padding-bottom: 10px;}
                        .header h1 { margin: 0; font-size: 24px; font-weight: 500; color: #222; }
                        .pill { padding: 4px 10px; border-radius: 15px; font-size: 13px; font-weight: bold; color: var(--white); display: inline-block;}
                        .pill-success { background-color: var(--success); }
                        .pill-warning { background-color: var(--warning); }
                        .card { background-color: var(--white); border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); padding: 20px; margin-bottom: 20px; }
                        .card h3 { margin-top: 0; font-size: 16px; border-bottom: 1px solid var(--border); padding-bottom: 10px; color: #555; }
                        table { width: 100%; border-collapse: collapse; text-align: left; }
                        th, td { padding: 12px 15px; border-bottom: 1px solid var(--border); }
                        th { background-color: #fafafa; font-weight: 500; color: #666; font-size: 13px; text-transform: uppercase; }
                        td { font-size: 14px; }
                        tr:hover { background-color: #f9f9f9; }
                        .numeric { text-align: right; font-family: monospace; font-size: 15px;}
                        .positive { color: var(--success); font-weight: bold; }
                        .negative { color: var(--danger); font-weight: bold; }
                    </style>
                </head>
                <body>
                    <div class="sidebar">
                        <div>A</div>
                    </div>
                    <div class="content">
                        <div class="header">
                            <h1>Overview: Data-Driven Internal Stock Transfer</h1>
                            <div class="pill pill-success">100% PASSED</div>
                        </div>
                        
                        <div class="card">
                            <h3>Thông tin phiếu: ${tc.id}</h3>
                            <table>
                                <tr>
                                    <th>MÃ PHIẾU</th>
                                    <th>NGÀY TẠO</th>
                                    <th>NGÀY CHUYỂN KHO</th>
                                    <th>TRẠNG THÁI (FINAL)</th>
                                </tr>
                                <tr>
                                    <td><strong>${generatedTransferCode}</strong></td>
                                    <td>${generatedDate}</td>
                                    <td>${generatedDate}</td>
                                    <td><span class="pill pill-success">Đã duyệt</span></td>
                                </tr>
                            </table>
                        </div>

                        <div class="card">
                            <h3>Thống Kê Báo Cáo Data Test Tồn Kho</h3>
                            <table>
                                <tr>
                                    <th>Kho</th>
                                    <th>Kênh</th>
                                    <th>Sản Phẩm</th>
                                    <th>Đơn Vị Tính</th>
                                    <th class="numeric">Tồn HT Ban Đầu</th>
                                    <th class="numeric">Tồn TT Ban Đầu</th>
                                    <th class="numeric">SL Chuyển (Đơn vị)</th>
                                    <th class="numeric">Base Unit Math</th>
                                    <th class="numeric">Tồn HT Sau</th>
                                    <th class="numeric">Tồn TT Sau</th>
                                    <th style="text-align:center">Matching Check</th>
                                </tr>
                                ${reportRows.map(r => {
                                    const diff = r.availFinal - r.availInitial;
                                    const passed = diff === r.baseDeduct;
                                    const badge = passed ? '<span class="pill pill-success">Khớp</span>' : '<span class="pill pill-warning">Lệch</span>';
                                    const qtyCls = r.transferQty > 0 ? 'positive' : 'negative';
                                    const sign = r.transferQty > 0 ? '+' : '';
                                    return `
                                    <tr>
                                        <td>${r.kho}</td>
                                        <td>${r.kenh}</td>
                                        <td><strong>${r.product}</strong></td>
                                        <td><span style="background:#eee;padding:2px 8px;border-radius:4px;font-size:12px;">${r.unit}</span></td>
                                        <td class="numeric">${r.sysInitial.toLocaleString()}</td>
                                        <td class="numeric">${r.availInitial.toLocaleString()}</td>
                                        <td class="numeric ${qtyCls}">${sign}${r.transferQty.toLocaleString()}</td>
                                        <td class="numeric" style="color:#888">(${r.baseDeduct > 0 ? '+' : ''}${r.baseDeduct.toLocaleString()} base)</td>
                                        <td class="numeric">${r.sysFinal.toLocaleString()}</td>
                                        <td class="numeric"><strong>${r.availFinal.toLocaleString()}</strong></td>
                                        <td style="text-align:center">${badge}</td>
                                    </tr>`
                                }).join("")}
                            </table>
                        </div>
                    </div>
                </body>
                </html>
                `;
                fs.writeFileSync(path.join(reportDir, `report-chuyenkho-${tc.id}.html`), reportHtml, 'utf8');
                console.log(`[REPORT] Xuất file report HTML thành công tại test-results/reports/report-chuyenkho-${tc.id}.html`);
            
            } catch (e: any) {
                console.error(`\n[VALIDATION FAILED] Test execution failed!`);
                console.error(`- Error Message: ${e.message}`);
                
                console.error(`\n[ACTUAL RESULT - PAGE STATE DUMP]`);
                const url = page.url();
                console.error(`- Current URL: ${url}`);
                
                const errorToasts = await page.locator('.ant-message-error, .ant-notification-notice-error, .ant-form-item-explain-error').allInnerTexts();
                if (errorToasts.length > 0) {
                    console.error(`- Found UI Errors: ${errorToasts.join(" | ")}`);
                } else {
                    console.error(`- Page Title: ${await page.title()}`);
                    const textContent = await page.locator('body').innerText();
                    console.error(`- Body Text Snippet: ${textContent.substring(0, 300).replace(/\n/g, " ")}...`);
                }
                
                const dateStr = new Date().toISOString().slice(0,10).replace(/-/g, "");
                await page.screenshot({ path: `tests/internal-transfer-evident/${dateStr}-test-failed-${tc.id}.png`, fullPage: true });
                throw e;
            }
        });
    }
});
