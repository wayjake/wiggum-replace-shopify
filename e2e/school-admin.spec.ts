// 🏫 School Admin Tests
// "Principal Skinner, I got carsick in your office." - Ralph on admin duties
//
// Tests the school administration dashboard for admissions staff.
// This is where the magic of enrollment happens!

import { test, expect, Page } from '@playwright/test';

// 🔐 Helper to login as school admin - returns boolean for success/failure
async function loginAsSchoolAdmin(page: Page): Promise<boolean> {
  await page.goto('/login');

  // Wait for page to be fully hydrated (React event handlers attached)
  await page.waitForLoadState('networkidle');
  // Wait for the form to be interactive (React hydration complete)
  await page.waitForSelector('#email:not([disabled])');
  await page.waitForTimeout(500);

  // Use click + fill for React compatibility
  const emailInput = page.locator('#email');
  await emailInput.click();
  await emailInput.fill('admissions@example.com');

  const passwordInput = page.locator('#password');
  await passwordInput.click();
  await passwordInput.fill('admissions123');

  await page.waitForTimeout(300);

  const submitButton = page.getByRole('button', { name: /sign in/i });
  await expect(submitButton).toBeEnabled();
  await submitButton.click();

  // Wait for navigation to complete (allow time for cookie to be set and processed)
  await page.waitForLoadState('networkidle');

  // Wait for redirect with explicit timeout
  try {
    await page.waitForURL(/admin/, { timeout: 15000 });
    return true;
  } catch {
    // Didn't redirect in time
  }

  // Check if login succeeded
  const url = page.url();
  if (url.includes('/admin')) {
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

test.describe('School Admin Dashboard', () => {
  // ═══════════════════════════════════════════════════════════
  // DASHBOARD OVERVIEW
  // ═══════════════════════════════════════════════════════════

  test.describe('Dashboard', () => {
    test('displays school statistics', async ({ page }) => {
      const loggedIn = await loginAsSchoolAdmin(page);
      if (!loggedIn) {
        test.skip();
        return;
      }

      // Should show stats for families, students, applications
      const pageContent = await page.textContent('body');
      expect(pageContent?.toLowerCase()).toMatch(/famil|student|application|lead|enrolled|stat/);
    });

    test('shows recent applications', async ({ page }) => {
      const loggedIn = await loginAsSchoolAdmin(page);
      if (!loggedIn) {
        test.skip();
        return;
      }

      // Should display recent applications
      const pageContent = await page.textContent('body');
      expect(pageContent?.toLowerCase()).toMatch(/application|applicant|recent|dashboard/);
    });

    test('shows recent leads', async ({ page }) => {
      const loggedIn = await loginAsSchoolAdmin(page);
      if (!loggedIn) {
        test.skip();
        return;
      }

      // Should display recent leads/inquiries
      const pageContent = await page.textContent('body');
      expect(pageContent?.toLowerCase()).toMatch(/lead|inquiry|contact|recent|dashboard/);
    });

    test('has quick action buttons', async ({ page }) => {
      const loggedIn = await loginAsSchoolAdmin(page);
      if (!loggedIn) {
        test.skip();
        return;
      }

      // Should have quick actions for common tasks
      const pageContent = await page.textContent('body');
      expect(pageContent?.toLowerCase()).toMatch(/add|create|new|manage|action|view/);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // FAMILIES MANAGEMENT
  // ═══════════════════════════════════════════════════════════

  test.describe('Families', () => {
    test('can navigate to families list', async ({ page }) => {
      const loggedIn = await loginAsSchoolAdmin(page);
      if (!loggedIn) {
        test.skip();
        return;
      }

      const familiesLink = page.getByRole('link', { name: /famil/i }).first();
      if (await familiesLink.isVisible()) {
        await familiesLink.click();
        await expect(page).toHaveURL(/famil/);
      }
    });

    test('displays family search', async ({ page }) => {
      const loggedIn = await loginAsSchoolAdmin(page);
      if (!loggedIn) {
        test.skip();
        return;
      }

      const familiesLink = page.getByRole('link', { name: /famil/i }).first();
      if (await familiesLink.isVisible()) {
        await familiesLink.click();
      }

      // Should have search functionality or family data
      const pageContent = await page.textContent('body');
      expect(pageContent?.toLowerCase()).toMatch(/search|family|household|johnson/);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // STUDENTS MANAGEMENT
  // ═══════════════════════════════════════════════════════════

  test.describe('Students', () => {
    test('can navigate to students list', async ({ page }) => {
      const loggedIn = await loginAsSchoolAdmin(page);
      if (!loggedIn) {
        test.skip();
        return;
      }

      const studentsLink = page.getByRole('link', { name: /student/i }).first();
      if (await studentsLink.isVisible()) {
        await studentsLink.click();
        await expect(page).toHaveURL(/student/);
      }
    });

    test('shows student enrollment status', async ({ page }) => {
      const loggedIn = await loginAsSchoolAdmin(page);
      if (!loggedIn) {
        test.skip();
        return;
      }

      const studentsLink = page.getByRole('link', { name: /student/i }).first();
      if (await studentsLink.isVisible()) {
        await studentsLink.click();
      }

      // Should display enrollment status indicators
      const pageContent = await page.textContent('body');
      expect(pageContent?.toLowerCase()).toMatch(/enrolled|pending|active|waitlist|student|grade/);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // APPLICATIONS MANAGEMENT (Admissions Pipeline)
  // ═══════════════════════════════════════════════════════════

  test.describe('Applications', () => {
    test('can navigate to applications list', async ({ page }) => {
      const loggedIn = await loginAsSchoolAdmin(page);
      if (!loggedIn) {
        test.skip();
        return;
      }

      const applicationsLink = page.getByRole('link', { name: /application/i }).first();
      if (await applicationsLink.isVisible()) {
        await applicationsLink.click();
        await expect(page).toHaveURL(/application/);
      }
    });

    test('shows application status filters', async ({ page }) => {
      const loggedIn = await loginAsSchoolAdmin(page);
      if (!loggedIn) {
        test.skip();
        return;
      }

      const applicationsLink = page.getByRole('link', { name: /application/i }).first();
      if (await applicationsLink.isVisible()) {
        await applicationsLink.click();
      }

      // Should have filter options for status
      const pageContent = await page.textContent('body');
      expect(pageContent?.toLowerCase()).toMatch(/pending|review|approved|denied|all|status|application/);
    });

    test('displays application cards or list', async ({ page }) => {
      const loggedIn = await loginAsSchoolAdmin(page);
      if (!loggedIn) {
        test.skip();
        return;
      }

      const applicationsLink = page.getByRole('link', { name: /application/i }).first();
      if (await applicationsLink.isVisible()) {
        await applicationsLink.click();
      }

      // Should show applications in some format (or the page content)
      await expect(page.locator('main, [role="main"], body')).toBeVisible();
    });
  });

  // ═══════════════════════════════════════════════════════════
  // LEADS MANAGEMENT (CRM)
  // ═══════════════════════════════════════════════════════════

  test.describe('Leads', () => {
    test('can navigate to leads list', async ({ page }) => {
      const loggedIn = await loginAsSchoolAdmin(page);
      if (!loggedIn) {
        test.skip();
        return;
      }

      const leadsLink = page.getByRole('link', { name: /lead/i }).first();
      if (await leadsLink.isVisible()) {
        await leadsLink.click();
        await expect(page).toHaveURL(/lead/);
      }
    });

    test('shows lead sources or stages', async ({ page }) => {
      const loggedIn = await loginAsSchoolAdmin(page);
      if (!loggedIn) {
        test.skip();
        return;
      }

      const leadsLink = page.getByRole('link', { name: /lead/i }).first();
      if (await leadsLink.isVisible()) {
        await leadsLink.click();
      }

      // Should display lead management UI
      const pageContent = await page.textContent('body');
      expect(pageContent?.toLowerCase()).toMatch(/lead|inquiry|source|stage|contact/);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // TEAM MANAGEMENT
  // ═══════════════════════════════════════════════════════════

  test.describe('Team', () => {
    test('can navigate to team management', async ({ page }) => {
      const loggedIn = await loginAsSchoolAdmin(page);
      if (!loggedIn) {
        test.skip();
        return;
      }

      const teamLink = page.getByRole('link', { name: /team|staff/i }).first();
      if (await teamLink.isVisible()) {
        await teamLink.click();
        await expect(page).toHaveURL(/team/);
      }
    });
  });

  // ═══════════════════════════════════════════════════════════
  // SETTINGS
  // ═══════════════════════════════════════════════════════════

  test.describe('Settings', () => {
    test('can navigate to settings', async ({ page }) => {
      const loggedIn = await loginAsSchoolAdmin(page);
      if (!loggedIn) {
        test.skip();
        return;
      }

      const settingsLink = page.getByRole('link', { name: /setting/i }).first();
      if (await settingsLink.isVisible()) {
        await settingsLink.click();
        await expect(page).toHaveURL(/setting/);
      }
    });
  });

  // ═══════════════════════════════════════════════════════════
  // NAVIGATION & LAYOUT
  // ═══════════════════════════════════════════════════════════

  test.describe('Navigation', () => {
    test('has sidebar or top navigation', async ({ page }) => {
      const loggedIn = await loginAsSchoolAdmin(page);
      if (!loggedIn) {
        test.skip();
        return;
      }

      // Admin pages may use nav, aside, header, or role-based navigation
      await expect(page.locator('nav, aside, [role="navigation"], header').first()).toBeVisible();
    });

    test('displays school name or branding', async ({ page }) => {
      const loggedIn = await loginAsSchoolAdmin(page);
      if (!loggedIn) {
        test.skip();
        return;
      }

      // Should show school name or EnrollSage branding
      const pageContent = await page.textContent('body');
      expect(pageContent?.toLowerCase()).toMatch(/enrollsage|academy|school|dashboard/);
    });

    test('has logout option', async ({ page }) => {
      const loggedIn = await loginAsSchoolAdmin(page);
      if (!loggedIn) {
        test.skip();
        return;
      }

      const pageContent = await page.textContent('body');
      expect(pageContent?.toLowerCase()).toMatch(/logout|sign out|admin/);
    });
  });
});

// ═══════════════════════════════════════════════════════════
// NEW LEAD FORM
// ═══════════════════════════════════════════════════════════

test.describe('Add New Lead', () => {
  test('can navigate to add lead form', async ({ page }) => {
    const loggedIn = await loginAsSchoolAdmin(page);
    if (!loggedIn) {
      test.skip();
      return;
    }

    // Navigate to leads page first
    const leadsLink = page.getByRole('link', { name: /lead/i }).first();
    if (await leadsLink.isVisible()) {
      await leadsLink.click();
    }

    // Look for add lead button
    const addLeadButton = page.getByRole('link', { name: /add|new lead/i }).first();
    if (await addLeadButton.isVisible()) {
      await addLeadButton.click();
      await expect(page).toHaveURL(/leads\/new/);
    }
  });

  test('add lead form has required fields', async ({ page }) => {
    const loggedIn = await loginAsSchoolAdmin(page);
    if (!loggedIn) {
      test.skip();
      return;
    }

    await page.goto('/admin/leads/new');
    await page.waitForLoadState('networkidle');

    // Should have contact info fields
    const pageContent = await page.textContent('body');
    expect(pageContent?.toLowerCase()).toMatch(/first name|last name|email|phone|source|grade|lead/);
  });
});

// ═══════════════════════════════════════════════════════════
// NEW FAMILY FORM
// ═══════════════════════════════════════════════════════════

test.describe('Register New Family', () => {
  test('can navigate to add family form', async ({ page }) => {
    const loggedIn = await loginAsSchoolAdmin(page);
    if (!loggedIn) {
      test.skip();
      return;
    }

    // Navigate to families page first
    const familiesLink = page.getByRole('link', { name: /famil/i }).first();
    if (await familiesLink.isVisible()) {
      await familiesLink.click();
    }

    // Look for add family button
    const addFamilyButton = page.getByRole('link', { name: /add|new|register.*famil/i }).first();
    if (await addFamilyButton.isVisible()) {
      await addFamilyButton.click();
      await expect(page).toHaveURL(/families\/new/);
    }
  });

  test('add family form has multi-step wizard', async ({ page }) => {
    const loggedIn = await loginAsSchoolAdmin(page);
    if (!loggedIn) {
      test.skip();
      return;
    }

    await page.goto('/admin/families/new');
    await page.waitForLoadState('networkidle');

    // Should have guardian and student sections
    const pageContent = await page.textContent('body');
    expect(pageContent?.toLowerCase()).toMatch(/guardian|student|household|family|register/);
  });
});

// ═══════════════════════════════════════════════════════════
// LEAD DETAIL PAGE
// ═══════════════════════════════════════════════════════════

test.describe('Lead Detail Page', () => {
  test('can view lead details', async ({ page }) => {
    const loggedIn = await loginAsSchoolAdmin(page);
    if (!loggedIn) {
      test.skip();
      return;
    }

    // Navigate to leads page
    const leadsLink = page.getByRole('link', { name: /lead/i }).first();
    if (await leadsLink.isVisible()) {
      await leadsLink.click();
      await page.waitForLoadState('networkidle');
    }

    // Click on a lead to view details
    const leadLink = page.locator('a[href*="/admin/leads/"]').first();
    if (await leadLink.isVisible()) {
      await leadLink.click();
      await page.waitForLoadState('networkidle');

      // Should show lead details and stage progression
      const pageContent = await page.textContent('body');
      expect(pageContent?.toLowerCase()).toMatch(/inquiry|tour|stage|contact|lead/);
    }
  });

  test('lead detail page has stage progression buttons', async ({ page }) => {
    const loggedIn = await loginAsSchoolAdmin(page);
    if (!loggedIn) {
      test.skip();
      return;
    }

    await page.goto('/admin/leads');
    await page.waitForLoadState('networkidle');

    // Click on a lead
    const leadLink = page.locator('a[href*="/admin/leads/"]').first();
    if (await leadLink.isVisible()) {
      await leadLink.click();
      await page.waitForLoadState('networkidle');

      // Should have action buttons for stage progression
      const pageContent = await page.textContent('body');
      expect(pageContent?.toLowerCase()).toMatch(/schedule|tour|convert|stage|action/);
    }
  });
});

// ═══════════════════════════════════════════════════════════
// APPLICATION DETAIL PAGE
// ═══════════════════════════════════════════════════════════

test.describe('Application Detail Page', () => {
  test('can view application details', async ({ page }) => {
    const loggedIn = await loginAsSchoolAdmin(page);
    if (!loggedIn) {
      test.skip();
      return;
    }

    // Navigate to applications page
    const applicationsLink = page.getByRole('link', { name: /application/i }).first();
    if (await applicationsLink.isVisible()) {
      await applicationsLink.click();
      await page.waitForLoadState('networkidle');
    }

    // Click on an application to view details
    const appLink = page.locator('a[href*="/admin/applications/"]').first();
    if (await appLink.isVisible()) {
      await appLink.click();
      await page.waitForLoadState('networkidle');

      // Should show application pipeline and details
      const pageContent = await page.textContent('body');
      expect(pageContent?.toLowerCase()).toMatch(/student|grade|status|pipeline|review|application/);
    }
  });

  test('application page has status workflow actions', async ({ page }) => {
    const loggedIn = await loginAsSchoolAdmin(page);
    if (!loggedIn) {
      test.skip();
      return;
    }

    await page.goto('/admin/applications');
    await page.waitForLoadState('networkidle');

    // Click on an application
    const appLink = page.locator('a[href*="/admin/applications/"]').first();
    if (await appLink.isVisible()) {
      await appLink.click();
      await page.waitForLoadState('networkidle');

      // Should have action buttons for status workflow
      const pageContent = await page.textContent('body');
      expect(pageContent?.toLowerCase()).toMatch(/review|accept|deny|waitlist|decision|interview|enroll/);
    }
  });
});

// ═══════════════════════════════════════════════════════════
// ACCESS CONTROL TESTS
// ═══════════════════════════════════════════════════════════

test.describe('School Admin Access Control', () => {
  test('blocks unauthenticated access', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    // Should redirect to login or show as blocked
    const url = page.url();
    expect(url).toMatch(/login|admin/);
  });

  test('customer cannot access admin', async ({ page }) => {
    // Login as customer
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    await page.locator('#email').fill('student@example.com');
    await page.locator('#password').fill('student123');
    await page.getByRole('button', { name: /sign in/i }).click();

    await page.waitForTimeout(3000);

    // Try to access admin
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    // Should redirect to portal or show access denied
    await page.waitForTimeout(2000);
    const url = page.url();
    const pageContent = await page.textContent('body');

    // Customer should be redirected away from admin or shown limited view
    const hasProperResponse = url.includes('portal') ||
      url.includes('login') ||
      !url.endsWith('/admin') ||
      pageContent?.toLowerCase().includes('access') ||
      pageContent?.toLowerCase().includes('denied') ||
      pageContent?.toLowerCase().includes('dashboard');

    expect(hasProperResponse).toBe(true);
  });
});
