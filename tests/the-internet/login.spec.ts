import { test, expect } from '@playwright/test';

/**
 * TC01: Form Authentication : Login successful with valid credentials

Open browser
Navigate to https://the-internet.herokuapp.com/login
Fill in username with tomsmith
Fill in the password with SuperSecretPassword!
Click on Login button
And the home page is appear
 */
test('Login successful with valid credentials', async ({ page }) => {
  await page.goto('https://the-internet.herokuapp.com/login');
  await page.locator('html').click();
  await page.getByRole('textbox', { name: 'Username' }).click();
  await page.getByRole('textbox', { name: 'Username' }).fill('tomsmith');
  await page.getByRole('textbox', { name: 'Password' }).click();
  await page.getByRole('textbox', { name: 'Password' }).fill('SuperSecretPassword!');
  await page.getByRole('button', { name: ' Login' }).click();
  await expect(page.getByText('You logged into a secure area')).toBeVisible();
  await expect(page.locator('h4')).toContainText('Welcome to the Secure Area. When you are done click logout below.');
});

test('Login successful by locator', async ({ page }) => {
  await page.goto('https://the-internet.herokuapp.com/login');
  await page.locator('#username').fill('tomsmith');

  await page.locator('#password').fill('SuperSecretPassword!');

  await expect(page.getByText('You logged into a secure area')).toBeVisible();
  await expect(page.locator('h4')).toContainText('Welcome to the Secure Area. When you are done click logout below.');
});

test('Login successful by xpath', async ({ page }) => {
  await page.goto('https://the-internet.herokuapp.com/login');

  await page.locator('//input[@id="username"]').fill('tomsmith');

  await page.locator('//input[@id="password"]').fill('SuperSecretPassword!');
  await page.locator('//button[@type="submit"]').click();
  await expect(page.getByText('You logged into a secure area')).toBeVisible();
  await expect(page.locator('h4')).toContainText('Welcome to the Secure Area. When you are done click logout below.');
});

