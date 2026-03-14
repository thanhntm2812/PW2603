import {test,expect} from '@playwright/test'
// Take a screenshot of the full page

await page.screenshot({ path: 'screenshot.png', fullPage: true });

// Take a screenshot of a specific element
await page.locator('.element').screenshot({ path: 'element.png' });

// Take a screenshot on test failure
test('visual test', async ({ page }) => {
  await page.goto('https://example.com' );
  try {
    await expect(page.locator('h1')).toHaveText('Expected Text');
  } catch (error) {
    await page.screenshot({ path: `failure-${test.info().title}.png` });
    throw error;
  }
});
