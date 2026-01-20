// 🌱 Database Seeding Script - Planting the seeds of knowledge
// "Every great school starts with one enrolled student"
//
// Run this script to populate the database with:
// - A sample school (Westlake Academy)
// - Example staff members (admissions, business office)
// - A sample family with students
// - Test applications
//
// Usage: npx tsx src/db/seed.ts

import { getDb, users, schools, schoolMembers, schoolYears, households, guardians, students, leads, applications } from './index';
import { hashPassword } from '../lib/auth';

/**
 * ╭─────────────────────────────────────────────────────────╮
 * │  SEED FUNCTION                                           │
 * │  ─────────────────────────────────────────────────────── │
 * │  The main planting ceremony. 🌱                          │
 * │  Creates test data for the school enrollment system.     │
 * ╰─────────────────────────────────────────────────────────╯
 */
async function seed() {
  console.log('🌱 Starting database seeding...\n');

  const db = getDb();

  // ═══════════════════════════════════════════════════════════
  // 🏫 ENROLLSY SCHOOL DATA
  // ═══════════════════════════════════════════════════════════

  console.log('🏫 Setting up EnrollSage school enrollment data...\n');

  // --- Create Super Admin (Platform Level) ---
  console.log('👑 Creating super admin...');
  let superAdminId: string | undefined;
  try {
    const superAdminPassword = await hashPassword('superadmin123');
    const result = await db.insert(users).values({
      email: 'superadmin@enrollsy.com',
      passwordHash: superAdminPassword,
      role: 'superadmin',
      firstName: 'Platform',
      lastName: 'Admin',
      emailVerified: true,
    }).onConflictDoNothing().returning({ id: users.id });
    superAdminId = result[0]?.id;
    console.log('   ✓ superadmin@enrollsy.com (password: superadmin123)');
  } catch (error) {
    console.log('   ⚠ Super admin already exists or error');
  }

  // --- Create Sample School ---
  console.log('\n🏛️ Creating Westlake Academy...');
  let schoolId: string | undefined;
  try {
    const result = await db.insert(schools).values({
      name: 'Westlake Academy',
      slug: 'westlake-academy',
      subdomain: 'westlake',
      timezone: 'America/Chicago',
      currentSchoolYear: '2025-2026',
      gradesOffered: JSON.stringify(['PK', 'K', '1', '2', '3', '4', '5', '6', '7', '8']),
      primaryColor: '#5B7F6D',
      accentColor: '#2D4F3E',
      email: 'info@westlakeacademy.edu',
      phone: '(512) 555-0100',
      addressLine1: '1234 Education Lane',
      city: 'Austin',
      state: 'TX',
      postalCode: '78701',
      country: 'US',
      status: 'active',
    }).onConflictDoNothing().returning({ id: schools.id });
    schoolId = result[0]?.id;
    console.log('   ✓ Westlake Academy created');
  } catch (error) {
    console.log('   ⚠ School already exists or error');
  }

  if (schoolId) {
    // --- Create School Year ---
    console.log('\n📅 Creating school years...');
    try {
      await db.insert(schoolYears).values({
        schoolId,
        name: '2025-2026',
        startDate: new Date('2025-08-18'),
        endDate: new Date('2026-05-22'),
        enrollmentOpenDate: new Date('2025-01-15'),
        enrollmentCloseDate: new Date('2025-07-31'),
        isCurrent: true,
      }).onConflictDoNothing();
      console.log('   ✓ 2025-2026 school year');
    } catch (error) {
      console.log('   ⚠ School year already exists');
    }

    // --- Create Admissions Staff User ---
    console.log('\n👤 Creating admissions staff user...');
    let admissionsUserId: string | undefined;
    try {
      const password = await hashPassword('admissions123');
      const result = await db.insert(users).values({
        email: 'admissions@example.com',
        passwordHash: password,
        role: 'admin',
        firstName: 'Sarah',
        lastName: 'Admissions',
        emailVerified: true,
      }).onConflictDoNothing().returning({ id: users.id });
      admissionsUserId = result[0]?.id;
      console.log('   ✓ admissions@example.com (password: admissions123)');
    } catch (error) {
      console.log('   ⚠ Admissions user already exists');
    }

    // Link admissions user to school
    if (admissionsUserId) {
      try {
        await db.insert(schoolMembers).values({
          userId: admissionsUserId,
          schoolId,
          role: 'admissions',
          status: 'active',
          acceptedAt: new Date(),
        }).onConflictDoNothing();
        console.log('   ✓ Linked to Westlake Academy as admissions');
      } catch (error) {
        console.log('   ⚠ School member link already exists');
      }
    }

    // --- Create Family/Parent User ---
    console.log('\n👨‍👩‍👧‍👦 Creating sample family...');
    let parentUserId: string | undefined;
    let householdId: string | undefined;

    try {
      const password = await hashPassword('student123');
      const result = await db.insert(users).values({
        email: 'student@example.com',
        passwordHash: password,
        role: 'customer',
        firstName: 'Michael',
        lastName: 'Johnson',
        emailVerified: true,
      }).onConflictDoNothing().returning({ id: users.id });
      parentUserId = result[0]?.id;
      console.log('   ✓ student@example.com (password: student123)');
    } catch (error) {
      console.log('   ⚠ Parent user already exists');
    }

    // Create household
    try {
      const result = await db.insert(households).values({
        schoolId,
        name: 'The Johnson Family',
        primaryEmail: 'student@example.com',
        primaryPhone: '(512) 555-0199',
        addressLine1: '456 Family Way',
        city: 'Austin',
        state: 'TX',
        postalCode: '78702',
        country: 'US',
        status: 'active',
      }).onConflictDoNothing().returning({ id: households.id });
      householdId = result[0]?.id;
      console.log('   ✓ Johnson Family household created');
    } catch (error) {
      console.log('   ⚠ Household already exists');
    }

    if (householdId) {
      // Create guardians
      if (parentUserId) {
        try {
          await db.insert(guardians).values({
            householdId,
            userId: parentUserId,
            firstName: 'Michael',
            lastName: 'Johnson',
            email: 'student@example.com',
            phone: '(512) 555-0199',
            relationship: 'father',
            isPrimary: true,
            hasPortalAccess: true,
            isBillingContact: true,
            isEmergencyContact: true,
          }).onConflictDoNothing();
          console.log('   ✓ Michael Johnson (father, primary contact)');
        } catch (error) {
          console.log('   ⚠ Guardian already exists');
        }
      }

      // Create second guardian (no portal access yet)
      try {
        await db.insert(guardians).values({
          householdId,
          firstName: 'Jennifer',
          lastName: 'Johnson',
          email: 'jennifer.johnson@email.com',
          phone: '(512) 555-0198',
          relationship: 'mother',
          isPrimary: false,
          hasPortalAccess: false,
          isBillingContact: false,
          isEmergencyContact: true,
        }).onConflictDoNothing();
        console.log('   ✓ Jennifer Johnson (mother, emergency contact)');
      } catch (error) {
        console.log('   ⚠ Second guardian already exists');
      }

      // Create students
      console.log('\n👧 Creating students...');
      let student1Id: string | undefined;
      let student2Id: string | undefined;

      try {
        const result = await db.insert(students).values({
          schoolId,
          householdId,
          firstName: 'Emma',
          lastName: 'Johnson',
          preferredName: 'Emmy',
          dateOfBirth: '2018-03-15',
          gender: 'female',
          gradeLevel: '1',
          enrollmentStatus: 'enrolled',
          enrolledDate: '2024-08-19',
          expectedGraduationYear: 2036,
        }).onConflictDoNothing().returning({ id: students.id });
        student1Id = result[0]?.id;
        console.log('   ✓ Emma Johnson (Grade 1, enrolled)');
      } catch (error) {
        console.log('   ⚠ Student 1 already exists');
      }

      try {
        const result = await db.insert(students).values({
          schoolId,
          householdId,
          firstName: 'Noah',
          lastName: 'Johnson',
          dateOfBirth: '2020-07-22',
          gender: 'male',
          gradeLevel: 'PK',
          enrollmentStatus: 'applicant',
          expectedGraduationYear: 2038,
        }).onConflictDoNothing().returning({ id: students.id });
        student2Id = result[0]?.id;
        console.log('   ✓ Noah Johnson (Pre-K, applicant)');
      } catch (error) {
        console.log('   ⚠ Student 2 already exists');
      }

      // Create application for Noah
      if (student2Id) {
        console.log('\n📝 Creating application for Noah...');
        try {
          await db.insert(applications).values({
            schoolId,
            studentId: student2Id,
            householdId,
            applicationType: 'new',
            schoolYear: '2025-2026',
            gradeApplyingFor: 'K',
            status: 'submitted',
            submittedAt: new Date('2025-01-20'),
            applicationFeeAmount: 7500, // $75.00 in cents
            applicationFeePaid: true,
            applicationFeePaidAt: new Date('2025-01-20'),
          }).onConflictDoNothing();
          console.log('   ✓ Application for Noah (K, submitted)');
        } catch (error) {
          console.log('   ⚠ Application already exists');
        }
      }
    }

    // --- Create Prospective Lead (apply@example.com) ---
    console.log('\n🎯 Creating prospective lead...');
    let applyUserId: string | undefined;
    try {
      const password = await hashPassword('apply123');
      const result = await db.insert(users).values({
        email: 'apply@example.com',
        passwordHash: password,
        role: 'customer',
        firstName: 'David',
        lastName: 'Wilson',
        emailVerified: true,
      }).onConflictDoNothing().returning({ id: users.id });
      applyUserId = result[0]?.id;
      console.log('   ✓ apply@example.com (password: apply123)');
    } catch (error) {
      console.log('   ⚠ Apply user already exists');
    }

    // Create lead for prospective family
    try {
      await db.insert(leads).values({
        schoolId,
        firstName: 'David',
        lastName: 'Wilson',
        email: 'apply@example.com',
        phone: '(512) 555-0177',
        source: 'website',
        sourceDetail: 'Clicked "Apply Now" on homepage',
        stage: 'tour_scheduled',
        interestedGrades: JSON.stringify(['K', '2']),
        interestedSchoolYear: '2025-2026',
        numberOfStudents: 2,
        notes: 'Interested in kindergarten for younger child and 2nd grade for older child. Very enthusiastic about the arts program.',
        tourScheduledAt: new Date('2025-02-01T10:00:00'),
      }).onConflictDoNothing();
      console.log('   ✓ Wilson family lead (tour scheduled)');
    } catch (error) {
      console.log('   ⚠ Lead already exists');
    }
  }

  // ═══════════════════════════════════════════════════════════
  // 📋 SUMMARY
  // ═══════════════════════════════════════════════════════════

  console.log('\n✨ Database seeding complete!');
  console.log('\n' + '═'.repeat(50));
  console.log('📋 SUMMARY');
  console.log('═'.repeat(50));

  console.log('\n🏫 EnrollSage School Data:');
  console.log('   - 1 school (Westlake Academy)');
  console.log('   - 1 school year (2025-2026)');
  console.log('   - 1 household (Johnson Family)');
  console.log('   - 2 guardians');
  console.log('   - 2 students (1 enrolled, 1 applicant)');
  console.log('   - 1 application');
  console.log('   - 1 lead');

  console.log('\n' + '═'.repeat(50));
  console.log('🔐 TEST CREDENTIALS');
  console.log('═'.repeat(50));
  console.log('\n👑 Platform Admin:');
  console.log('   superadmin@enrollsy.com / superadmin123');
  console.log('\n🏫 School Staff:');
  console.log('   admissions@example.com / admissions123');
  console.log('\n👨‍👩‍👧‍👦 Parent Portal:');
  console.log('   student@example.com / student123');
  console.log('\n🎯 Prospective Family:');
  console.log('   apply@example.com / apply123');
  console.log('\n' + '═'.repeat(50));
}

// Run the seed function
seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });
