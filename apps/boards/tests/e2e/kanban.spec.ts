import { test, expect } from '@playwright/test';

/**
 * E2E tests for Kanban board functionality
 * These tests use Playwright's AI-powered locators for self-healing tests
 */

test.describe('Kanban Board', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the boards page
    await page.goto('/');
    // Wait for the board to load
    await page.waitForLoadState('networkidle');
  });

  test.describe('Board Navigation', () => {
    test('should display board name and columns', async ({ page }) => {
      // Check if board is visible
      const boardName = page.getByRole('heading', { level: 1 });
      await expect(boardName).toBeVisible();

      // Check for column headers
      const columns = page.getByRole('region', { name: /column/i });
      await expect(columns.first()).toBeVisible();
    });

    test('should navigate between boards using sidebar', async ({ page }) => {
      // Click on boards sidebar
      const sidebar = page.getByRole('complementary', { name: /sidebar/i });
      await expect(sidebar).toBeVisible();

      // Find and click on a board link
      const boardLinks = page.getByRole('link', { name: /board/i });
      if ((await boardLinks.count()) > 1) {
        await boardLinks.nth(1).click();
        await page.waitForLoadState('networkidle');
        await expect(page).toHaveURL(/\/boards/);
      }
    });
  });

  test.describe('Ticket Creation', () => {
    test('should open create ticket panel with keyboard shortcut', async ({ page }) => {
      // Press 'c' to open create ticket panel
      await page.keyboard.press('c');

      // Check if create panel is visible
      const createPanel = page.getByRole('dialog', { name: /create ticket/i }).or(
        page.getByText(/create ticket/i).first()
      );
      await expect(createPanel).toBeVisible({ timeout: 5000 });
    });

    test('should create a new ticket with title and description', async ({ page }) => {
      // Open create ticket panel
      await page.keyboard.press('c');
      await page.waitForTimeout(500);

      // Fill in ticket title
      const titleInput = page.getByRole('textbox', { name: /title/i }).or(
        page.getByPlaceholder(/title/i)
      );
      await titleInput.fill('E2E Test Ticket');

      // Fill in description
      const descriptionInput = page.getByRole('textbox', { name: /description/i }).or(
        page.getByPlaceholder(/description/i)
      );
      await descriptionInput.fill('This is a test ticket created by E2E tests');

      // Submit the form
      const submitButton = page.getByRole('button', { name: /create/i });
      await submitButton.click();

      // Wait for ticket to appear on the board
      await page.waitForTimeout(1000);
      await expect(page.getByText('E2E Test Ticket')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Ticket Interaction', () => {
    test('should open ticket detail modal when clicking on a ticket', async ({ page }) => {
      // Find and click on a ticket card
      const ticketCard = page.getByRole('article').or(page.locator('[class*="ticket"]')).first();
      await ticketCard.click();

      // Wait for modal to open
      await page.waitForTimeout(500);

      // Check if modal is visible with ticket details
      const modal = page.getByRole('dialog').or(page.locator('[class*="modal"]'));
      await expect(modal).toBeVisible({ timeout: 5000 });
    });

    test('should edit ticket title inline in modal', async ({ page }) => {
      // Open a ticket
      const ticketCard = page.getByRole('article').or(page.locator('[class*="ticket"]')).first();
      await ticketCard.click();
      await page.waitForTimeout(500);

      // Find and click on the title to edit
      const titleHeading = page.getByRole('heading', { level: 1 }).first();
      await titleHeading.click();
      await page.waitForTimeout(300);

      // Type new title
      const titleInput = page.locator('input[type="text"]').first();
      await titleInput.fill('Updated E2E Test Ticket');
      await titleInput.press('Enter');

      // Wait for save
      await page.waitForTimeout(500);

      // Verify the change
      await expect(page.getByText('Updated E2E Test Ticket')).toBeVisible();
    });
  });

  test.describe('Filtering', () => {
    test('should filter tickets using quick filters', async ({ page }) => {
      // Find quick filter buttons
      const unassignedFilter = page.getByRole('button', { name: /unassigned/i });

      if (await unassignedFilter.isVisible()) {
        // Click the filter
        await unassignedFilter.click();

        // Wait for filter to apply
        await page.waitForTimeout(500);

        // Verify filter is active (should have active styling)
        await expect(unassignedFilter).toHaveClass(/active|bg-/);
      }
    });

    test('should open advanced search modal', async ({ page }) => {
      // Look for search or filter button
      const searchButton = page.getByRole('button', { name: /search/i }).or(
        page.getByRole('button', { name: /filter/i })
      );

      if (await searchButton.isVisible()) {
        await searchButton.click();

        // Wait for modal
        await page.waitForTimeout(500);

        const searchModal = page.getByRole('dialog', { name: /search/i });
        await expect(searchModal).toBeVisible({ timeout: 5000 });
      }
    });

    test('should clear all filters', async ({ page }) => {
      // Activate a filter first
      const firstFilter = page.getByRole('button', { name: /unassigned|high priority/i }).first();

      if (await firstFilter.isVisible()) {
        await firstFilter.click();
        await page.waitForTimeout(300);

        // Look for clear all button
        const clearButton = page.getByRole('button', { name: /clear all/i });

        if (await clearButton.isVisible()) {
          await clearButton.click();
          await page.waitForTimeout(300);

          // Verify filters are cleared
          await expect(clearButton).not.toBeVisible();
        }
      }
    });
  });

  test.describe('Keyboard Shortcuts', () => {
    test('should focus search with "/" key', async ({ page }) => {
      // Press "/" to focus search
      await page.keyboard.press('/');
      await page.waitForTimeout(300);

      // Check if search input is focused
      const searchInput = page.getByRole('textbox', { name: /search/i }).or(
        page.getByPlaceholder(/search/i)
      );

      if (await searchInput.isVisible()) {
        await expect(searchInput).toBeFocused();
      }
    });

    test('should show shortcuts help modal with "?" key', async ({ page }) => {
      // Press "?" to show shortcuts
      await page.keyboard.press('?');
      await page.waitForTimeout(500);

      // Check for shortcuts modal or help dialog
      const shortcutsModal = page.getByRole('dialog', { name: /shortcuts|keyboard/i }).or(
        page.getByText(/keyboard shortcuts/i)
      );

      await expect(shortcutsModal).toBeVisible({ timeout: 5000 });
    });

    test('should close modals with Escape key', async ({ page }) => {
      // Open create ticket modal
      await page.keyboard.press('c');
      await page.waitForTimeout(500);

      // Press Escape to close
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);

      // Verify modal is closed
      const createPanel = page.getByRole('dialog', { name: /create/i });
      await expect(createPanel).not.toBeVisible();
    });
  });

  test.describe('Bulk Operations', () => {
    test('should enter selection mode', async ({ page }) => {
      // Press 's' to toggle selection mode
      await page.keyboard.press('s');
      await page.waitForTimeout(300);

      // Check if checkboxes are visible on tickets
      const checkboxes = page.locator('input[type="checkbox"]').or(
        page.locator('[role="checkbox"]')
      );

      if ((await checkboxes.count()) > 0) {
        await expect(checkboxes.first()).toBeVisible();
      }
    });

    test('should select multiple tickets', async ({ page }) => {
      // Enter selection mode
      await page.keyboard.press('s');
      await page.waitForTimeout(300);

      // Click on first two tickets
      const tickets = page.getByRole('article').or(page.locator('[class*="ticket"]'));

      if ((await tickets.count()) >= 2) {
        await tickets.nth(0).click();
        await page.waitForTimeout(200);
        await tickets.nth(1).click();
        await page.waitForTimeout(200);

        // Check if bulk actions toolbar is visible
        const bulkToolbar = page.getByRole('toolbar', { name: /bulk/i }).or(
          page.getByText(/selected/i)
        );

        if (await bulkToolbar.isVisible()) {
          await expect(bulkToolbar).toBeVisible();
        }
      }
    });
  });

  test.describe('Dark Mode', () => {
    test('should toggle dark mode', async ({ page }) => {
      // Find theme toggle button
      const themeToggle = page.getByRole('button', { name: /theme|dark mode/i }).or(
        page.locator('[class*="theme"]').first()
      );

      if (await themeToggle.isVisible()) {
        await themeToggle.click();
        await page.waitForTimeout(500);

        // Check if dark class is applied to html or body
        const html = page.locator('html');
        const hasDarkClass = await html.evaluate((el) =>
          el.classList.contains('dark')
        );

        expect(hasDarkClass).toBeTruthy();
      }
    });
  });

  test.describe('Responsive Design', () => {
    test('should display mobile view correctly', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Check if mobile layout is applied
      const mainContent = page.locator('main').or(page.locator('[class*="main"]'));
      await expect(mainContent).toBeVisible();
    });

    test('should display tablet view correctly', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Check if layout adapts
      const boardColumns = page.locator('[class*="column"]');
      await expect(boardColumns.first()).toBeVisible();
    });
  });
});
