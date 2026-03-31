import { expect, test } from '@playwright/test';
import { getEditorAuthContract } from '../helpers/auth';
import { testIds } from '../helpers/test-ids';

const auth = getEditorAuthContract();

test.skip(!auth.storageStatePath, auth.loginHint ?? 'Authenticated editor flow requires storage state.');

test.describe.serial('Inline editor overlay', () => {
  test('shows overlay controls for editable blocks', async ({ page }) => {
    await page.goto('/?editor=1');

    await expect(page.getByTestId(testIds.editorRoot)).toBeVisible();
    await expect(page.getByTestId(testIds.publishBar)).toBeVisible();
    await expect(page.getByTestId(testIds.blockFrame).first()).toBeVisible();
  });

  test('allows inline text editing and autosaves a draft', async ({ page }) => {
    await page.goto('/?editor=1');

    const titleField = page.getByTestId(testIds.blockField).filter({ hasText: 'title' }).first();
    await expect(titleField).toBeVisible();
    await titleField.click();
    await page.keyboard.press('Control+A');
    await page.keyboard.type('A revised headline');

    await expect(page.getByTestId(testIds.saveStatus)).toContainText(/saved|saving|draft/i);
  });

  test('offers image replacement and add-block insertion controls', async ({ page }) => {
    await page.goto('/?editor=1');

    await expect(page.getByTestId(testIds.mediaReplace).first()).toBeVisible();
    await expect(page.getByTestId(testIds.addBlockSlot).first()).toBeVisible();
  });
});
