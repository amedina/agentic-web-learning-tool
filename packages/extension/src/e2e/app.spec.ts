import { test, expect } from '@playwright/test';

test('increments counter button', async ({ page }) => {
	// Go to app
	await page.goto('/');

	// Find button
	const button = page.getByRole('button', { name: /count is 0/i });

	// Click it
	await button.click();

	// Verify count updated
	await expect(
		page.getByRole('button', { name: /count is 1/i })
	).toBeVisible();
});
