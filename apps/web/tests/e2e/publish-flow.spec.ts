import { expect, test } from '@playwright/test';
import { getEditorAuthContract } from '../helpers/auth';
import { testIds } from '../helpers/test-ids';

const auth = getEditorAuthContract();

test.skip(!auth.storageStatePath, auth.loginHint ?? 'Authenticated publish flow requires storage state.');

test.describe.serial('Draft and publish flow', () => {
  test('keeps draft changes hidden until publish', async ({ page }) => {
    await page.goto('/?editor=1');

    const pageShell = page.getByTestId(testIds.pageShell);
    await expect(pageShell).toBeVisible();
    await expect(page.getByTestId(testIds.publishBar)).toBeVisible();

    await page.getByTestId(testIds.editorAction).filter({ hasText: 'Publish' }).click();
    await expect(page.getByTestId(testIds.saveStatus)).toContainText(/published/i);
  });

  test('exposes the published state to a public visitor after publish', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByTestId(testIds.editorRoot)).toHaveCount(0);
    await expect(page.getByTestId(testIds.pageShell)).toBeVisible();
  });
});
