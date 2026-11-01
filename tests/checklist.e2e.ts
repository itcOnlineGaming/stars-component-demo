import { expect, test } from '@playwright/test';

test.describe('Git Self-Efficacy Checklist (E2E)', () => {
	test('loads Stage 1 mock JSON data and shows date progress bar graph', async ({ page }) => {
		await page.goto('/');

		await expect(
			page.getByRole('heading', { name: 'Git Self-Efficacy Checklist' })
		).toBeVisible();

		await expect(page.getByRole('region', { name: 'Progress by date' })).toBeVisible();
		await expect(page.getByLabel(/Today .* minimum level: 3/)).toBeVisible();
	});

	test('changing a question rating updates the Today bar minimum level', async ({ page }) => {
		await page.goto('/');

		await expect(page.getByLabel(/Today .* minimum level: 3/)).toBeVisible();

		const q3Group = page.getByRole('group', {
			name: /Question 3: I can bring my branch up to date/
		});
		await q3Group.getByRole('radio', { name: '1 Not at all confident' }).click();

		await expect(page.getByLabel(/Today .* minimum level: 1/)).toBeVisible();
	});

	test('resetting the checklist sets the Today bar minimum level to 1', async ({ page }) => {
		await page.goto('/');

		await page.getByRole('button', { name: 'Reset checklist' }).click();

		await expect(page.getByLabel(/Today .* minimum level: 1/)).toBeVisible();
	});
});
