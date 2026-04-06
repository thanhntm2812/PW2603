import { test as base } from "@playwright/test";
import { LoginPage } from "../pages/login.page";
import { InternalTransferPage } from "../pages/internalTransfer.page";
import { InventoryPage } from "../pages/inventory.page";

type Dms90uatFixtures = {
    loginPage: LoginPage;
    internalTransferPage: InternalTransferPage;
    inventoryPage: InventoryPage;
};

export const test = base.extend<Dms90uatFixtures>({
    loginPage: async ({ page }, use) => {
        const loginPage = new LoginPage(page);
        await use(loginPage);
    },
    internalTransferPage: async ({ page }, use) => {
        const internalTransferPage = new InternalTransferPage(page);
        await use(internalTransferPage);
    },
    inventoryPage: async ({ page }, use) => {
        const inventoryPage = new InventoryPage(page);
        await use(inventoryPage);
    },
});

export { expect } from "@playwright/test";
