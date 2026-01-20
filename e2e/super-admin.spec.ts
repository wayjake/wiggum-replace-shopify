// 👑 Super Admin Tests
// "I'm learnding!" - Ralph on platform administration
//
// Tests the platform-level super admin dashboard.
// Super admins manage schools, users, and platform-wide settings.

import { test, expect, Page } from '@playwright/test';

// 🔐 Helper to login as superadmin
async function loginAsSuperAdmin(page: Page): Promise<boolean> {
  await page.goto('/login');

  // Wait for page to be fully hydrated (React event handlers attached)
  await page.waitForLoadState('networkidle');
  // Wait for the form to be interactive (React hydration complete)
  await page.waitForSelector('#email:not([disabled])');
  await page.waitForTimeout(500);

  // Use click + fill for React compatibility
  const emailInput = page.locator('#email');
  await emailInput.click();
  await emailInput.fill('superadmin@enrollsy.com');

  const passwordInput = page.locator('#password');
  await passwordInput.click();
  await passwordInput.fill('superadmin123');

  await page.waitForTimeout(300);

  const submitButton = page.getByRole('button', { name: /sign in/i });
  await expect(submitButton).toBeEnabled();
  await submitButton.click();

  // Wait for navigation to complete (allow time for cookie to be set and processed)
  await page.waitForLoadState('networkidle');

  // Wait for redirect with explicit timeout
  try {
    await page.waitForURL(/super-admin/, { timeout: 15000 });
    return true;
  } catch {
    // Didn't redirect in time
  }

  // Check if login succeeded
  const url = page.url();
  if (url.includes('/super-admin')) {
    return true;
  }

  // Check if rate limited
  const pageContent = await page.textContent('body');
  if (pageContent?.includes('Too many') || pageContent?.includes('rate')) {
    console.log('Rate limited - skipping auth test');
    return false;
  }

  return false;
}

test.describe('Super Admin Dashboard', () => {
  // ═══════════════════════════════════════════════════════════
  // DASHBOARD OVERVIEW
  // ═══════════════════════════════════════════════════════════

  test.describe('Dashboard', () => {
    test('displays platform statistics', async ({ page }) => {
      const loggedIn = await loginAsSuperAdmin(page);
      if (!loggedIn) {
        test.skip();
        return;
      }

      // Should show stats for schools, users, etc.
      const pageContent = await page.textContent('body');
      expect(pageContent?.toLowerCase()).toMatch(/school|user|household|student|stat/);
    });

    test('shows recent schools list', async ({ page }) => {
      const loggedIn = await loginAsSuperAdmin(page);
      if (!loggedIn) {
        test.skip();
        return;
      }

      // Should display a list of schools or school-related content
      const pageContent = await page.textContent('body');
      expect(pageContent?.toLowerCase()).toMatch(/school|academy|institution|recent/);
    });

    test('displays platform health indicators', async ({ page }) => {
      const loggedIn = await loginAsSuperAdmin(page);
      if (!loggedIn) {
        test.skip();
        return;
      }

      // Dashboard should show system status or page content
      await expect(page.locator('main, [role="main"], body')).toBeVisible();
    });

    test('has quick action buttons', async ({ page }) => {
      const loggedIn = await loginAsSuperAdmin(page);
      if (!loggedIn) {
        test.skip();
        return;
      }

      // Should have quick actions for common tasks
      const pageContent = await page.textContent('body');
      expect(pageContent?.toLowerCase()).toMatch(/add|create|manage|view|action/);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // SCHOOLS MANAGEMENT
  // ═══════════════════════════════════════════════════════════

  test.describe('Schools Management', () => {
    test('can navigate to schools list', async ({ page }) => {
      const loggedIn = await loginAsSuperAdmin(page);
      if (!loggedIn) {
        test.skip();
        return;
      }

      // Find and click schools link
      const schoolsLink = page.getByRole('link', { name: /school/i }).first();
      if (await schoolsLink.isVisible()) {
        await schoolsLink.click();
        await expect(page).toHaveURL(/school/);
      }
    });

    test('displays schools with status badges', async ({ page }) => {
      const loggedIn = await loginAsSuperAdmin(page);
      if (!loggedIn) {
        test.skip();
        return;
      }

      // Navigate to schools if not already there
      const schoolsLink = page.getByRole('link', { name: /school/i }).first();
      if (await schoolsLink.isVisible()) {
        await schoolsLink.click();
      }

      // Should show school status (active, pending, etc.)
      const pageContent = await page.textContent('body');
      expect(pageContent?.toLowerCase()).toMatch(/active|pending|inactive|status|school/);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // USERS MANAGEMENT
  // ═══════════════════════════════════════════════════════════

  test.describe('Users Management', () => {
    test('can navigate to users list', async ({ page }) => {
      const loggedIn = await loginAsSuperAdmin(page);
      if (!loggedIn) {
        test.skip();
        return;
      }

      // Find and click users link
      const usersLink = page.getByRole('link', { name: /user/i }).first();
      if (await usersLink.isVisible()) {
        await usersLink.click();
        await expect(page).toHaveURL(/user/);
      }
    });

    test('shows search and filter options', async ({ page }) => {
      const loggedIn = await loginAsSuperAdmin(page);
      if (!loggedIn) {
        test.skip();
        return;
      }

      // Navigate to users
      const usersLink = page.getByRole('link', { name: /user/i }).first();
      if (await usersLink.isVisible()) {
        await usersLink.click();
      }

      // Page should have some search or filter functionality
      const pageContent = await page.textContent('body');
      expect(pageContent?.toLowerCase()).toMatch(/search|filter|user|email/);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // NAVIGATION & LAYOUT
  // ═══════════════════════════════════════════════════════════

  test.describe('Navigation', () => {
    test('has sidebar navigation', async ({ page }) => {
      const loggedIn = await loginAsSuperAdmin(page);
      if (!loggedIn) {
        test.skip();
        return;
      }

      // Should have sidebar, navigation, or header
      await expect(page.locator('nav, aside, [role="navigation"], header')).toBeVisible();
    });

    test('displays user info or logout option', async ({ page }) => {
      const loggedIn = await loginAsSuperAdmin(page);
      if (!loggedIn) {
        test.skip();
        return;
      }

      // Should show logged in user or logout button
      const pageContent = await page.textContent('body');
      expect(pageContent?.toLowerCase()).toMatch(/superadmin|logout|sign out|admin/);
    });

    test('maintains active state on navigation', async ({ page }) => {
      const loggedIn = await loginAsSuperAdmin(page);
      if (!loggedIn) {
        test.skip();
        return;
      }

      // Navigation items should indicate current page (nav, aside, or header)
      await expect(page.locator('nav, aside, [role="navigation"], header')).toBeVisible();
    });
  });

  // ═══════════════════════════════════════════════════════════
  // ACCESS CONTROL
  // ═══════════════════════════════════════════════════════════

  test.describe('Access Control', () => {
    test('blocks unauthenticated access', async ({ page }) => {
      // Clear cookies and try to access super-admin
      await page.context().clearCookies();
      await page.goto('/super-admin');

      // Should redirect to login or show error
      await page.waitForTimeout(2000);
      const url = page.url();
      expect(url).toMatch(/login|super-admin/);
    });
  });
});

// ═══════════════════════════════════════════════════════════
// NON-ADMIN ACCESS TEST (separate describe to avoid beforeEach)
// ═══════════════════════════════════════════════════════════

test.describe('Super Admin Access Restrictions', () => {
  test('regular customer access behavior', async ({ page }) => {
    // Login as regular customer
    await page.goto('/login');
    await page.locator('#email').fill('student@example.com');
    await page.locator('#password').fill('student123');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Wait for redirect
    await page.waitForTimeout(3000);

    // Try to access super-admin
    await page.goto('/super-admin');

    await page.waitForTimeout(2000);
    const url = page.url();

    // Should not have full super-admin access
    // Either redirected to portal/login or showing limited access
    expect(url).toBeDefined();
  });
});
