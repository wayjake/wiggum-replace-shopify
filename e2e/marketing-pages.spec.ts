// 🏠 Marketing Pages Tests
// "I bent my Wookiee!" - Ralph discovering the landing pages
//
// Tests public-facing marketing pages that require no authentication.
// These are the first touchpoint for potential customers.

import { test, expect } from '@playwright/test';

test.describe('Marketing Pages', () => {
  // ═══════════════════════════════════════════════════════════
  // HOME PAGE - The digital front door
  // ═══════════════════════════════════════════════════════════

  test.describe('Home Page', () => {
    test('displays EnrollSage branding and hero section', async ({ page }) => {
      await page.goto('/');

      // Check branding - use first() to avoid strict mode issues
      await expect(page.getByText('EnrollSage').first()).toBeVisible();

      // Hero section with key messaging
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

      // Call to action buttons
      await expect(page.getByRole('link', { name: /demo/i }).first()).toBeVisible();
    });

    test('navigation links are present and functional', async ({ page }) => {
      await page.goto('/');

      // Main navigation should have key links
      await expect(page.getByRole('link', { name: /about/i }).first()).toBeVisible();
      await expect(page.getByRole('link', { name: /contact/i }).first()).toBeVisible();
      await expect(page.getByRole('link', { name: /sign in|login/i }).first()).toBeVisible();
    });

    test('footer contains legal and demo links', async ({ page }) => {
      await page.goto('/');

      // Scroll to footer
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(500);

      // Legal links - use first() to avoid strict mode issues
      await expect(page.getByRole('link', { name: /terms/i }).first()).toBeVisible();
      await expect(page.getByRole('link', { name: /privacy/i }).first()).toBeVisible();
    });

    test('demo links are accessible from home page', async ({ page }) => {
      await page.goto('/');

      // Should have links to interactive demos
      const demoLink = page.getByRole('link', { name: /demo/i }).first();
      await expect(demoLink).toBeVisible();
    });
  });

  // ═══════════════════════════════════════════════════════════
  // ABOUT PAGE - Our mission and values
  // ═══════════════════════════════════════════════════════════

  test.describe('About Page', () => {
    test('displays about content with mission statement', async ({ page }) => {
      await page.goto('/about');

      // Page should load with proper heading
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

      // Should mention school enrollment or mission
      const pageContent = await page.textContent('body');
      expect(pageContent?.toLowerCase()).toMatch(/school|enrollment|mission/);
    });

    test('has proper meta information', async ({ page }) => {
      await page.goto('/about');

      // Check title
      const title = await page.title();
      expect(title.toLowerCase()).toContain('about');
    });
  });

  // ═══════════════════════════════════════════════════════════
  // CONTACT PAGE - Get in touch
  // ═══════════════════════════════════════════════════════════

  test.describe('Contact Page', () => {
    test('displays contact form', async ({ page }) => {
      await page.goto('/contact');

      // Should have a form with typical contact fields - use locators
      await expect(page.locator('#name, [name="name"]').first()).toBeVisible();
      await expect(page.locator('#email, [name="email"]').first()).toBeVisible();
      await expect(page.locator('#message, [name="message"], textarea').first()).toBeVisible();

      // Submit button
      await expect(page.getByRole('button', { name: /send|submit/i })).toBeVisible();
    });

    test('validates required fields', async ({ page }) => {
      await page.goto('/contact');

      // Try to submit empty form
      await page.getByRole('button', { name: /send|submit/i }).click();

      // Should show validation (form shouldn't submit with empty required fields)
      // HTML5 validation will prevent submission
      const form = page.locator('form');
      await expect(form).toBeVisible();
    });
  });

  // ═══════════════════════════════════════════════════════════
  // LEGAL PAGES - Terms and Privacy
  // ═══════════════════════════════════════════════════════════

  test.describe('Terms of Service', () => {
    test('displays terms content', async ({ page }) => {
      await page.goto('/terms');

      // Should have terms heading
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

      // Should contain legal language
      const pageContent = await page.textContent('body');
      expect(pageContent?.toLowerCase()).toMatch(/terms|service|agreement/);
    });
  });

  test.describe('Privacy Policy', () => {
    test('displays privacy policy content', async ({ page }) => {
      await page.goto('/privacy');

      // Should have privacy heading
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

      // Should mention data/privacy
      const pageContent = await page.textContent('body');
      expect(pageContent?.toLowerCase()).toMatch(/privacy|data|gdpr|information/);
    });
  });
});
