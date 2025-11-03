# Testing Guide for OpenDock Boards

This document provides comprehensive guidance on testing the OpenDock Boards application using AI-powered testing tools.

## Table of Contents

- [Overview](#overview)
- [Test Stack](#test-stack)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [AI-Powered Features](#ai-powered-features)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

The OpenDock Boards application uses a multi-layered testing approach:

1. **Unit/Component Tests** - Test individual React components in isolation
2. **E2E Tests** - Test complete user workflows with Playwright
3. **Visual Regression Tests** - Catch visual changes automatically

## Test Stack

### Component Testing
- **Vitest** - Fast unit test framework compatible with Vite
- **Testing Library** - React component testing utilities
- **jsdom** - DOM environment for tests

### E2E Testing
- **Playwright** - Cross-browser testing with AI-powered locators
- **Playwright UI Mode** - Interactive test debugging

### Coverage
- **v8** - Native V8 coverage provider for accurate metrics

## Running Tests

### Component Tests

```bash
# Run all component tests
bun test

# Run tests in watch mode
bun test:watch

# Run tests with coverage
bun test:coverage

# Run tests with UI
bun test:ui
```

### E2E Tests

```bash
# Run all E2E tests
bun test:e2e

# Run E2E tests in UI mode (interactive)
bun test:e2e:ui

# Run E2E tests in headed mode (see browser)
bun test:e2e:headed

# Run specific test file
bunx playwright test tests/e2e/kanban.spec.ts

# Run tests for specific project (browser)
bunx playwright test --project=chromium
```

### Visual Regression Tests

```bash
# Run visual tests
bunx playwright test tests/e2e/visual.spec.ts

# Update visual snapshots (after intentional UI changes)
bunx playwright test tests/e2e/visual.spec.ts --update-snapshots
```

### Install Playwright Browsers

```bash
# First time setup - install browser binaries
bunx playwright install
```

## Writing Tests

### Component Test Example

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('renders with correct props', () => {
    render(<MyComponent title="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('handles user interaction', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(<MyComponent onClick={onClick} />);
    await user.click(screen.getByRole('button'));

    expect(onClick).toHaveBeenCalled();
  });
});
```

### E2E Test Example

```typescript
import { test, expect } from '@playwright/test';

test('user can create a ticket', async ({ page }) => {
  await page.goto('/');

  // AI-powered locators - self-healing!
  await page.getByRole('button', { name: /create ticket/i }).click();
  await page.getByPlaceholder(/title/i).fill('New Task');
  await page.getByRole('button', { name: /save/i }).click();

  // Verify ticket appears
  await expect(page.getByText('New Task')).toBeVisible();
});
```

### Visual Regression Test Example

```typescript
import { test, expect } from '@playwright/test';

test('ticket card matches design', async ({ page }) => {
  await page.goto('/');
  const ticketCard = page.locator('[data-testid="ticket-card"]').first();

  // Playwright automatically detects visual differences
  await expect(ticketCard).toHaveScreenshot('ticket-card.png');
});
```

## AI-Powered Features

### 1. Self-Healing Locators

Playwright uses AI-powered locators that automatically adapt when your UI changes:

```typescript
// ✅ Good - Uses semantic locators (self-healing)
await page.getByRole('button', { name: /create/i });
await page.getByLabel('Email');
await page.getByPlaceholder('Search...');

// ❌ Avoid - Brittle CSS selectors
await page.locator('.btn-primary-123');
await page.locator('#email-input');
```

### 2. Codegen - AI Test Generation

Generate tests automatically by recording your actions:

```bash
# Record a new test
bunx playwright codegen http://localhost:5175

# Record test in specific browser
bunx playwright codegen --browser=firefox http://localhost:5175
```

The codegen tool will:
- Record your clicks, typing, and navigation
- Generate test code with AI-optimized locators
- Suggest assertions based on your actions

### 3. Visual AI Testing

Playwright's visual comparison uses pixel-perfect AI to detect:
- Layout shifts
- Color changes
- Font rendering issues
- Responsive design breakage

```typescript
// Takes screenshot and compares with baseline
await expect(page).toHaveScreenshot('homepage.png', {
  maxDiffPixels: 100, // Allow minor differences
  threshold: 0.2,     // Similarity threshold
});
```

### 4. Trace Viewer

When tests fail, Playwright automatically captures:
- Screenshots at each step
- Network requests
- Console logs
- DOM snapshots

```bash
# View trace for failed test
bunx playwright show-trace trace.zip
```

## Best Practices

### Component Tests

1. **Test User Behavior, Not Implementation**
   ```typescript
   // ✅ Good - Tests what user sees
   expect(screen.getByText('Success')).toBeInTheDocument();

   // ❌ Bad - Tests implementation detail
   expect(component.state.isSuccess).toBe(true);
   ```

2. **Use Testing Library Queries in Priority Order**
   1. `getByRole` - Most accessible
   2. `getByLabelText` - Form elements
   3. `getByPlaceholderText` - Inputs
   4. `getByText` - Text content
   5. `getByTestId` - Last resort

3. **Clean Up Side Effects**
   ```typescript
   afterEach(() => {
     cleanup(); // Automatically done in setup.ts
   });
   ```

### E2E Tests

1. **Use Page Object Pattern for Complex Flows**
   ```typescript
   class BoardPage {
     constructor(private page: Page) {}

     async createTicket(title: string) {
       await this.page.getByRole('button', { name: /create/i }).click();
       await this.page.getByPlaceholder(/title/i).fill(title);
       await this.page.getByRole('button', { name: /save/i }).click();
     }
   }
   ```

2. **Wait for Network Idle on Navigation**
   ```typescript
   await page.goto('/', { waitUntil: 'networkidle' });
   ```

3. **Use Soft Assertions for Multiple Checks**
   ```typescript
   await expect.soft(page.getByText('Title')).toBeVisible();
   await expect.soft(page.getByText('Description')).toBeVisible();
   // Test continues even if assertions fail
   ```

### Visual Tests

1. **Disable Animations**
   ```typescript
   await expect(element).toHaveScreenshot({
     animations: 'disabled', // Prevents flaky tests
   });
   ```

2. **Test Both Light and Dark Modes**
   ```typescript
   test('supports dark mode', async ({ page }) => {
     await page.emulateMedia({ colorScheme: 'dark' });
     await expect(page).toHaveScreenshot('dark-mode.png');
   });
   ```

3. **Update Snapshots After Intentional Changes**
   ```bash
   # Only update when you intentionally changed the UI
   bun test:e2e -- --update-snapshots
   ```

## Test Organization

```
apps/boards/
├── src/
│   └── components/
│       ├── MyComponent.tsx
│       └── MyComponent.test.tsx        # Co-located with component
├── tests/
│   ├── setup.ts                        # Global test setup
│   └── e2e/
│       ├── kanban.spec.ts              # E2E tests
│       └── visual.spec.ts              # Visual regression
├── vitest.config.ts                    # Vitest configuration
└── playwright.config.ts                # Playwright configuration
```

## Coverage Goals

- **Component Coverage**: 70%+ for critical components
- **E2E Coverage**: All major user flows
- **Visual Coverage**: Key UI states (light/dark, mobile/desktop)

### Viewing Coverage

```bash
bun test:coverage
```

Then open `coverage/index.html` in your browser.

## Troubleshooting

### Component Tests

**Issue**: Tests fail with "Cannot find module"
```bash
# Solution: Check vitest.config.ts path aliases
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
  },
},
```

**Issue**: Tests timeout
```typescript
// Solution: Increase timeout for slow operations
test('slow operation', async () => {
  // ...
}, { timeout: 10000 });
```

### E2E Tests

**Issue**: Locator not found
```typescript
// Solution: Add explicit waits
await page.waitForSelector('[data-testid="my-element"]');
// Or use built-in waiting
await expect(page.getByText('Text')).toBeVisible({ timeout: 10000 });
```

**Issue**: Tests pass locally but fail in CI
```bash
# Solution: Run in headed mode to see what's happening
bunx playwright test --headed --project=chromium
```

**Issue**: Visual tests are flaky
```typescript
// Solution: Increase threshold or disable animations
await expect(element).toHaveScreenshot({
  threshold: 0.3,           // More lenient comparison
  maxDiffPixels: 100,       // Allow some differences
  animations: 'disabled',   // Prevent animation flakiness
});
```

### General Issues

**Issue**: Tests are slow
- Use `test.concurrent()` for independent tests
- Mock API calls in component tests
- Use `page.route()` to mock network in E2E tests

**Issue**: Need to debug a test
```bash
# Component tests - use VS Code debugger or:
bun test --inspect-brk

# E2E tests - use Playwright UI mode:
bun test:e2e:ui
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1

      - name: Install dependencies
        run: bun install

      - name: Run component tests
        run: bun test --coverage

      - name: Install Playwright browsers
        run: bunx playwright install --with-deps

      - name: Run E2E tests
        run: bun test:e2e

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

## Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Docs](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Visual Testing Guide](https://playwright.dev/docs/test-snapshots)

## Getting Help

- Check existing test files for examples
- Use Playwright's `codegen` to see how to write locators
- Ask in the team chat or create an issue

---

**Happy Testing! 🧪**
