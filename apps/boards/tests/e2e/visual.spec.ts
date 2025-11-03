import { test, expect } from '@playwright/test';

/**
 * Visual Regression Tests
 * Uses Playwright's built-in screenshot comparison to detect visual changes
 * AI-powered visual testing ensures your minimalist design stays consistent
 */

test.describe('Visual Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Board Layout', () => {
    test('should match board layout snapshot (light mode)', async ({ page }) => {
      // Wait for board to fully render
      await page.waitForTimeout(1000);

      // Take screenshot of the entire board
      await expect(page).toHaveScreenshot('board-layout-light.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });

    test('should match board layout snapshot (dark mode)', async ({ page }) => {
      // Toggle dark mode
      const themeToggle = page.getByRole('button', { name: /theme|dark/i }).first();

      if (await themeToggle.isVisible()) {
        await themeToggle.click();
        await page.waitForTimeout(500);
      } else {
        // Alternatively, add dark class directly
        await page.evaluate(() => {
          document.documentElement.classList.add('dark');
        });
      }

      await page.waitForTimeout(1000);

      // Take screenshot in dark mode
      await expect(page).toHaveScreenshot('board-layout-dark.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });
  });

  test.describe('Ticket Cards', () => {
    test('should match ticket card design (light mode)', async ({ page }) => {
      // Find first ticket card
      const ticketCard = page.getByRole('article').or(page.locator('[class*="ticket"]')).first();

      if (await ticketCard.isVisible()) {
        await expect(ticketCard).toHaveScreenshot('ticket-card-light.png', {
          animations: 'disabled',
        });
      }
    });

    test('should match ticket card design (dark mode)', async ({ page }) => {
      // Enable dark mode
      await page.evaluate(() => {
        document.documentElement.classList.add('dark');
      });
      await page.waitForTimeout(500);

      // Find first ticket card
      const ticketCard = page.getByRole('article').or(page.locator('[class*="ticket"]')).first();

      if (await ticketCard.isVisible()) {
        await expect(ticketCard).toHaveScreenshot('ticket-card-dark.png', {
          animations: 'disabled',
        });
      }
    });

    test('should match ticket card with high priority', async ({ page }) => {
      // Find a high priority ticket or modify one for testing
      const highPriorityTicket = page.locator('[title*="Priority: high"]').first();

      if (await highPriorityTicket.isVisible()) {
        const ticketCard = highPriorityTicket.locator('xpath=ancestor::article');
        await expect(ticketCard).toHaveScreenshot('ticket-card-high-priority.png', {
          animations: 'disabled',
        });
      }
    });

    test('should match ticket card with labels', async ({ page }) => {
      // Find ticket with labels
      const ticketsWithLabels = page.locator('[class*="ticket"]').filter({
        has: page.locator('[class*="label"]'),
      });

      if ((await ticketsWithLabels.count()) > 0) {
        await expect(ticketsWithLabels.first()).toHaveScreenshot('ticket-card-with-labels.png', {
          animations: 'disabled',
        });
      }
    });
  });

  test.describe('Ticket Detail Modal', () => {
    test('should match modal design (light mode)', async ({ page }) => {
      // Open first ticket
      const ticketCard = page.getByRole('article').or(page.locator('[class*="ticket"]')).first();
      await ticketCard.click();
      await page.waitForTimeout(1000);

      // Screenshot the modal
      const modal = page.getByRole('dialog').or(page.locator('[class*="modal"]'));

      if (await modal.isVisible()) {
        await expect(modal).toHaveScreenshot('ticket-modal-light.png', {
          animations: 'disabled',
        });
      }
    });

    test('should match modal design (dark mode)', async ({ page }) => {
      // Enable dark mode
      await page.evaluate(() => {
        document.documentElement.classList.add('dark');
      });
      await page.waitForTimeout(500);

      // Open first ticket
      const ticketCard = page.getByRole('article').or(page.locator('[class*="ticket"]')).first();
      await ticketCard.click();
      await page.waitForTimeout(1000);

      // Screenshot the modal
      const modal = page.getByRole('dialog').or(page.locator('[class*="modal"]'));

      if (await modal.isVisible()) {
        await expect(modal).toHaveScreenshot('ticket-modal-dark.png', {
          animations: 'disabled',
        });
      }
    });
  });

  test.describe('Quick Filters', () => {
    test('should match filter bar design', async ({ page }) => {
      // Find quick filters section
      const filterBar = page.locator('text=Quick Filters').locator('xpath=ancestor::div[1]');

      if (await filterBar.isVisible()) {
        await expect(filterBar).toHaveScreenshot('quick-filters.png', {
          animations: 'disabled',
        });
      }
    });

    test('should match active filter state', async ({ page }) => {
      // Activate a filter
      const unassignedFilter = page.getByRole('button', { name: /unassigned/i });

      if (await unassignedFilter.isVisible()) {
        await unassignedFilter.click();
        await page.waitForTimeout(500);

        const filterBar = page.locator('text=Quick Filters').locator('xpath=ancestor::div[1]');
        await expect(filterBar).toHaveScreenshot('quick-filters-active.png', {
          animations: 'disabled',
        });
      }
    });
  });

  test.describe('Sidebar', () => {
    test('should match sidebar design (light mode)', async ({ page }) => {
      const sidebar = page.getByRole('complementary').or(page.locator('[class*="sidebar"]')).first();

      if (await sidebar.isVisible()) {
        await expect(sidebar).toHaveScreenshot('sidebar-light.png', {
          animations: 'disabled',
        });
      }
    });

    test('should match sidebar design (dark mode)', async ({ page }) => {
      await page.evaluate(() => {
        document.documentElement.classList.add('dark');
      });
      await page.waitForTimeout(500);

      const sidebar = page.getByRole('complementary').or(page.locator('[class*="sidebar"]')).first();

      if (await sidebar.isVisible()) {
        await expect(sidebar).toHaveScreenshot('sidebar-dark.png', {
          animations: 'disabled',
        });
      }
    });
  });

  test.describe('Empty States', () => {
    test('should match empty column design', async ({ page }) => {
      // Find an empty column (if any)
      const columns = page.locator('[class*="column"]');

      for (let i = 0; i < await columns.count(); i++) {
        const column = columns.nth(i);
        const tickets = column.locator('[class*="ticket"]');

        if ((await tickets.count()) === 0) {
          await expect(column).toHaveScreenshot(`empty-column-${i}.png`, {
            animations: 'disabled',
          });
          break;
        }
      }
    });
  });

  test.describe('Mobile Views', () => {
    test('should match mobile layout', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      await expect(page).toHaveScreenshot('mobile-layout.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });

    test('should match mobile ticket card', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      const ticketCard = page.getByRole('article').or(page.locator('[class*="ticket"]')).first();

      if (await ticketCard.isVisible()) {
        await expect(ticketCard).toHaveScreenshot('mobile-ticket-card.png', {
          animations: 'disabled',
        });
      }
    });
  });

  test.describe('Hover States', () => {
    test('should match ticket card hover state', async ({ page }) => {
      const ticketCard = page.getByRole('article').or(page.locator('[class*="ticket"]')).first();

      if (await ticketCard.isVisible()) {
        await ticketCard.hover();
        await page.waitForTimeout(300);

        await expect(ticketCard).toHaveScreenshot('ticket-card-hover.png', {
          animations: 'disabled',
        });
      }
    });
  });

  test.describe('Selection Mode', () => {
    test('should match selection mode UI', async ({ page }) => {
      // Enter selection mode
      await page.keyboard.press('s');
      await page.waitForTimeout(500);

      // Take screenshot
      await expect(page).toHaveScreenshot('selection-mode.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });

    test('should match selected tickets', async ({ page }) => {
      // Enter selection mode
      await page.keyboard.press('s');
      await page.waitForTimeout(300);

      // Select first ticket
      const firstTicket = page.getByRole('article').or(page.locator('[class*="ticket"]')).first();
      await firstTicket.click();
      await page.waitForTimeout(300);

      await expect(firstTicket).toHaveScreenshot('ticket-selected.png', {
        animations: 'disabled',
      });
    });
  });
});
