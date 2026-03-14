/**
 * TC05: Web Table: Validate largest due person from a table

1. Open browser
2. Navigate to https://the-internet.herokuapp.com/tables
3. Focus on table 1
4. The person who has largest due is "Doe Jacson"
 */

import {test,expect} from '@playwright/test'

test('verify fullname of max due person', async ({page}) =>{

    await page.goto('https://the-internet.herokuapp.com/tables');

    // const tableContents =  await page.locator("#table1 tbody tr td").allTextContents();
    // //print table content
    // console.log(tableContents);

    const dueAmounts = await page.locator("#table1 tbody tr td:nth-child(4)").allTextContents();
    // console.log(dueAmounts);
    //Give array  [ '$50.00', '$51.00', '$100.00', '$50.00' ]  find the index of item has max value?
    const maxDueValue = Math.max(...dueAmounts.map(amount => parseFloat(amount.replace('$', ''))));
    const maxDueIndex = dueAmounts.indexOf('$' + maxDueValue.toFixed(2));
    // console.log(maxDueIndex);
    const firstName = await page.locator(`#table1 tbody tr:nth-child(${maxDueIndex + 1}) td:nth-child(2)`).textContent();
    const lastName = await page.locator(`#table1 tbody tr:nth-child(${maxDueIndex + 1}) td:nth-child(1)`).textContent();
    // console.log(`Full name of person with max due: ${firstName} ${lastName}`);
    expect(`${firstName} ${lastName}`).toBe('Jason Doe');

});

test('verify fullname of min due person with loop', async ({page}) =>{  
    await page.goto('https://the-internet.herokuapp.com/tables');

    const dueAmounts = await page.locator("#table1 tbody tr td:nth-child(4)").allTextContents();
    let minDueValue = Number.POSITIVE_INFINITY;
    let minDueIndex = -1;
    for (let i = 0; i < dueAmounts.length; i++) {
        const amount = parseFloat(dueAmounts[i].replace('$', ''));
        if (amount < minDueValue) {
            minDueValue = amount;
            minDueIndex = i;
        }
    }
    const firstName = await page.locator(`#table1 tbody tr:nth-child(${minDueIndex + 1}) td:nth-child(2)`).textContent();   
    const lastName = await page.locator(`#table1 tbody tr:nth-child(${minDueIndex + 1}) td:nth-child(1)`).textContent();
    expect(`${firstName} ${lastName}`).toBe('John Smith');
});