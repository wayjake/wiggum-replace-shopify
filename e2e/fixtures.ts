// 🎭 Test Fixtures & Utilities
// "I found a moonrock in my nose!" - Ralph on test utilities
//
// ╭────────────────────────────────────────────────────────────╮
// │  Reusable authentication and helper functions              │
// │  Import these in your tests for consistent login flows     │
// ╰────────────────────────────────────────────────────────────╯

import { test as base, expect, Page } from '@playwright/test';

// ═══════════════════════════════════════════════════════════
// TEST CREDENTIALS
// These match the seed data in src/db/seed.ts
// ═══════════════════════════════════════════════════════════

export const TEST_USERS = {
  superadmin: {
    email: 'superadmin@enrollsage.com',
    password: 'superadmin123',
    role: 'superadmin',
    redirectUrl: '/super-admin',
  },
  admin: {
    email: 'admissions@example.com',
    password: 'admissions123',
    role: 'admin',
    redirectUrl: '/admin',
  },
  customer: {
    email: 'student@example.com',
    password: 'student123',
    role: 'customer',
    redirectUrl: '/portal',
  },
  applicant: {
    email: 'apply@example.com',
    password: 'apply123',
    role: 'customer',
    redirectUrl: '/portal',
  },
} as const;

// ═══════════════════════════════════════════════════════════
// AUTHENTICATION HELPERS
// ═══════════════════════════════════════════════════════════

/**
 * Login as any user role
 * @param page - Playwright page object
 * @param userType - One of: superadmin, admin, customer, applicant
 */
export async function loginAs(
  page: Page,
  userType: keyof typeof TEST_USERS
): Promise<void> {
  const user = TEST_USERS[userType];

  await page.goto('/login');
  await page.getByLabel(/email/i).fill(user.email);
  await page.getByLabel(/password/i).fill(user.password);
  await page.getByRole('button', { name: /sign in/i }).click();

  // Wait for redirect to appropriate dashboard
  await expect(page).toHaveURL(new RegExp(user.redirectUrl), { timeout: 15000 });
}

/**
 * Logout current user
 */
export async function logout(page: Page): Promise<void> {
  // Find and click logout button
  const logoutButton = page.locator('text=/logout|sign out/i').first();
  if (await logoutButton.isVisible()) {
    await logoutButton.click();
    await expect(page).toHaveURL(/login|^\/$/, { timeout: 10000 });
  } else {
    // Clear cookies manually
    await page.context().clearCookies();
    await page.goto('/login');
  }
}

/**
 * Check if user is logged in
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  // Try accessing a protected route
  await page.goto('/portal');
  const url = page.url();
  return !url.includes('/login');
}

// ═══════════════════════════════════════════════════════════
// PAGE NAVIGATION HELPERS
// ═══════════════════════════════════════════════════════════

/**
 * Navigate to a section within the current dashboard
 */
export async function navigateToSection(
  page: Page,
  sectionName: string
): Promise<void> {
  const link = page.getByRole('link', { name: new RegExp(sectionName, 'i') }).first();
  if (await link.isVisible()) {
    await link.click();
    await page.waitForLoadState('networkidle');
  }
}

// ═══════════════════════════════════════════════════════════
// ASSERTION HELPERS
// ═══════════════════════════════════════════════════════════

/**
 * Assert that a page has proper SEO elements
 */
export async function assertSeoElements(page: Page): Promise<void> {
  // Title should exist
  const title = await page.title();
  expect(title).toBeTruthy();
  expect(title.length).toBeGreaterThan(0);

  // Should have a main heading
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
}

/**
 * Assert that navigation is present
 */
export async function assertNavigationExists(page: Page): Promise<void> {
  const nav = page.locator('nav, aside, [role="navigation"]');
  await expect(nav).toBeVisible();
}

/**
 * Assert that branding is visible
 */
export async function assertBrandingVisible(page: Page): Promise<void> {
  await expect(page.locator('text=EnrollSage').first()).toBeVisible();
}

// ═══════════════════════════════════════════════════════════
// FORM HELPERS
// ═══════════════════════════════════════════════════════════

/**
 * Fill a contact form
 */
export async function fillContactForm(
  page: Page,
  data: { name: string; email: string; message: string }
): Promise<void> {
  await page.getByLabel(/name/i).fill(data.name);
  await page.getByLabel(/email/i).fill(data.email);
  await page.getByLabel(/message/i).fill(data.message);
}

// ═══════════════════════════════════════════════════════════
// WAIT HELPERS
// ═══════════════════════════════════════════════════════════

/**
 * Wait for page to be fully loaded
 */
export async function waitForPageLoad(page: Page): Promise<void> {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle');
}

// ═══════════════════════════════════════════════════════════
// EXTENDED TEST FIXTURE
// Use this for tests that need pre-authenticated state
// ═══════════════════════════════════════════════════════════

type AuthFixtures = {
  authenticatedPage: Page;
  userType: keyof typeof TEST_USERS;
};

export const test = base.extend<AuthFixtures>({
  userType: ['customer', { option: true }],

  authenticatedPage: async ({ page, userType }, use) => {
    await loginAs(page, userType);
    await use(page);
  },
});

export { expect };
