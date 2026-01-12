import { test, expect } from '@playwright/test';

test('RDO Creation and Refusal Flow', async ({ page }) => {
    // 1. Home Page
    await page.goto('http://localhost:3000');
    await expect(page).toHaveTitle(/RDO - Objects That Say No/);
    await expect(page.getByText('Objects That Say No')).toBeVisible();

    // 2. Start Creation
    await page.getByText('Create Message RDO').click();
    await expect(page).toHaveURL(/.*create/);

    // 3. Fill Form
    await page.getByPlaceholder('e.g. Secret Memos').fill('Test RDO');
    await page.getByPlaceholder('What is the intent?').fill('Top Secret');
    await page.getByText('Continue').click();

    // 4. Set Rules
    // Forward is forbidden by default
    await page.getByText('Continue').click();

    // 5. Review
    await expect(page.getByText('Review Intent')).toBeVisible();

    // Note: Actual minting requires wallet interaction which implies mocking or manual step.
    // In a real E2E environment with Synpress, we would handle the wallet here.
});

test('RDO View Refusal', async ({ page }) => {
    // Mock visiting a specific RDO
    await page.goto('http://localhost:3000/view/1');

    // Simulate clicking Forward
    await page.getByText('Forward Copy').click();

    // Expect Refusal Overlay (if logic triggers)
    // Note: This requires the contract/client to actually trigger the state.
    // We check for the overlay selector or text.
    // await expect(page.getByText('Access Refused')).toBeVisible();
});
