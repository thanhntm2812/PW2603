/**
 * TC04: Hyper link : Hyperlink - link text

1. Open browser
2. Navigate to https://the-internet.herokuapp.com/status_codes

3. Click on "200"
4. Then "200 status code" page appear

5. Click on "go here"
6. Click on "301"
7. Then "301 status code" page appear

8. Click on "go here"
9. Click on "404"
10. Then "404 status code" page appear

11. Click on "go here"
12. Click on "500"
13. Then "500 status code" page appear

14. Click on "go here"
 */
import {test,expect} from '@playwright/test'
import { link } from 'node:fs';

test('verify status code links', async ({page}) =>{

    await page.goto('https://the-internet.herokuapp.com/status_codes')

    await page.getByRole('link').filter({ hasText: '200' }).click();
    
    // await page.getByRole('link', { name: '200' }).click();
    expect(page.url()).toContain('status_codes/200');
    await page.getByRole('link', { name: 'here' }).click();

    await page.getByRole('link', { name: '301' }).click();
    expect(page.url()).toContain('status_codes/301');
    await page.getByRole('link', { name: 'here' }).click();

    await page.getByRole('link', { name: '404' }).click();
    expect(page.url()).toContain('status_codes/404');
    await page.getByRole('link', { name: 'here' }).click();

    await page.getByRole('link', { name: '500' }).click();
    expect(page.url()).toContain('status_codes/500');
    await page.getByRole('link', { name: 'here' }).click();
});