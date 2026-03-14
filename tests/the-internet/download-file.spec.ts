// Download file

import {test, expect} from '@playwright/test';
import fs from 'fs';

test('download a file', async ({page}) => {
    await page.goto('/download');
    const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.getByRole('link', { name: 'Jpeg_with_exif.jpeg' }).click(),
    ]);
    
    const suggestedFilename = download.suggestedFilename();
    expect(suggestedFilename).toBe('Jpeg_with_exif.jpeg');
    
    const filePath = 'download/'+suggestedFilename;
    await download.saveAs(filePath);
    expect(fs.existsSync(filePath)).toBeTruthy();
});

test('download multiple files', async ({page}) => {
    await page.goto('/download');
    const fileNames = ["doc.txt","bb.txt"];
    
   for (const fileName of fileNames) {
        const [download] = await Promise.all([
            page.waitForEvent('download'),
            page.getByRole('link', { name: fileName }).first().click(),
        ]);
        
        const suggestedFilename = download.suggestedFilename();
        expect(suggestedFilename).toBe(fileName);
        
        const filePath = 'download/'+suggestedFilename;
        await download.saveAs(filePath);
        expect(fs.existsSync(filePath)).toBeTruthy();
    }
});