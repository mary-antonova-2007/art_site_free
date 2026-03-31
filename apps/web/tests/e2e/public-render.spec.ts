import { expect, test } from '@playwright/test';
import { testIds } from '../helpers/test-ids';

test.describe('Public rendering', () => {
  test('renders a public editorial page without editor chrome', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByTestId(testIds.pageShell)).toBeVisible();
    await expect(page.getByTestId(testIds.editorRoot)).toHaveCount(0);
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
  });

  test('keeps image and text blocks readable on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    await expect(page.getByTestId(testIds.pageShell)).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
    await expect(page.locator('img').first()).toBeVisible();
  });
});
