// ⚡ Inngest Event System - The nervous system of our async operations
// Handles email workflows for applications, enrollments, and payments

import { Inngest } from 'inngest';
import {
  sendWelcomeEmail,
  sendApplicationReceivedEmail,
  sendApplicationStatusEmail,
  sendPaymentReminderEmail,
  sendTransactionalEmail,
  BREVO_TEMPLATES,
} from './brevo';

/**
 * ╭─────────────────────────────────────────────────────────╮
 * │  INNGEST CLIENT                                          │
 * │  ─────────────────────────────────────────────────────── │
 * │  The central hub for all our event-driven workflows.     │
 * │  Events go in, magic comes out!                          │
 * ╰─────────────────────────────────────────────────────────╯
 */
export const inngest = new Inngest({
  id: 'enrollsy',
  // Event keys are optional for local dev
});

// ═══════════════════════════════════════════════════════════
// EVENT TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════

export type SchoolEvents = {
  // Application lifecycle events
  'school/application.submitted': {
    data: {
      applicationId: string;
      studentName: string;
      email: string;
      firstName?: string;
      schoolName: string;
      schoolId: string;
    };
  };

  'school/application.status-changed': {
    data: {
      applicationId: string;
      studentName: string;
      email: string;
      firstName?: string;
      status: 'under_review' | 'approved' | 'waitlisted' | 'denied';
      message?: string;
    };
  };

  'school/enrollment.confirmed': {
    data: {
      enrollmentId: string;
      studentName: string;
      email: string;
      firstName?: string;
      schoolName: string;
      gradeLevel: string;
    };
  };

  // Payment events
  'school/payment.received': {
    data: {
      paymentId: string;
      email: string;
      firstName?: string;
      amount: number;
      studentName: string;
    };
  };

  'school/payment.reminder': {
    data: {
      householdId: string;
      email: string;
      firstName?: string;
      amountDue: number;
      dueDate: string;
    };
  };

  // Family lifecycle events
  'school/family.created': {
    data: {
      householdId: string;
      email: string;
      firstName?: string;
      lastName?: string;
    };
  };

  // Newsletter events
  'school/newsletter.signup': {
    data: {
      email: string;
      source: string;
      name?: string;
    };
  };

  // Admin events
  'school/admin.new-application-alert': {
    data: {
      applicationId: string;
      studentName: string;
      schoolId: string;
      schoolName: string;
    };
  };
};

// ═══════════════════════════════════════════════════════════
// APPLICATION SUBMITTED WORKFLOW
// ═══════════════════════════════════════════════════════════

/**
 * Triggered when a family submits an application.
 * Sends confirmation email and notifies school admin.
 */
export const applicationSubmittedWorkflow = inngest.createFunction(
  { id: 'application-submitted-workflow', name: 'Application Submitted Workflow' },
  { event: 'school/application.submitted' },
  async ({ event, step }) => {
    const { applicationId, email, firstName, studentName, schoolName } = event.data;

    // Step 1: Send application confirmation email
    await step.run('send-confirmation-email', async () => {
      await sendApplicationReceivedEmail({
        email,
        firstName,
        applicationId,
        studentName,
        schoolName,
      });
      console.log(`[Inngest] Application confirmation sent to ${email}`);
    });

    // Step 2: Log the application submission
    await step.run('log-application', async () => {
      console.log(`[Inngest] Application ${applicationId} submitted for ${studentName}`);
    });

    return { success: true, applicationId };
  }
);

// ═══════════════════════════════════════════════════════════
// APPLICATION STATUS CHANGED WORKFLOW
// ═══════════════════════════════════════════════════════════

/**
 * Triggered when application status changes.
 * Sends status update email to the family.
 */
export const applicationStatusWorkflow = inngest.createFunction(
  { id: 'application-status-workflow', name: 'Application Status Workflow' },
  { event: 'school/application.status-changed' },
  async ({ event, step }) => {
    const { applicationId, email, firstName, studentName, status, message } = event.data;

    await step.run('send-status-email', async () => {
      const statusMessages: Record<string, string> = {
        under_review: 'is now under review',
        approved: 'has been approved! 🎉',
        waitlisted: 'has been placed on our waitlist',
        denied: 'was not accepted at this time',
      };

      await sendApplicationStatusEmail({
        email,
        firstName,
        applicationId,
        studentName,
        status: statusMessages[status] || status,
        message,
      });
      console.log(`[Inngest] Status update sent for application ${applicationId}`);
    });

    return { success: true, applicationId, status };
  }
);

// ═══════════════════════════════════════════════════════════
// WELCOME DRIP CAMPAIGN
// ═══════════════════════════════════════════════════════════

/**
 * Triggered when a new family creates an account.
 * Runs a multi-day email sequence with helpful information.
 */
export const welcomeDripCampaign = inngest.createFunction(
  { id: 'welcome-drip-campaign', name: 'Welcome Drip Campaign' },
  { event: 'school/family.created' },
  async ({ event, step }) => {
    const { email, firstName, householdId } = event.data;

    // Day 0: Welcome email (immediate)
    await step.run('welcome-email', async () => {
      await sendWelcomeEmail({ email, firstName });
      console.log(`[Inngest] Welcome email sent to ${email}`);
    });

    // Day 3: Enrollment tips
    await step.sleep('wait-3-days', '3 days');
    await step.run('tips-email', async () => {
      await sendTransactionalEmail({
        to: { email, name: firstName },
        templateId: BREVO_TEMPLATES.ENROLLMENT_TIPS,
        params: {
          FIRSTNAME: firstName || 'there',
        },
      });
      console.log(`[Inngest] Enrollment tips email sent to ${email}`);
    });

    return { success: true, householdId, emailsSent: 2 };
  }
);

// ═══════════════════════════════════════════════════════════
// ENROLLMENT CONFIRMED WORKFLOW
// ═══════════════════════════════════════════════════════════

/**
 * Triggered when enrollment is confirmed.
 * Sends welcome packet and next steps.
 */
export const enrollmentConfirmedWorkflow = inngest.createFunction(
  { id: 'enrollment-confirmed-workflow', name: 'Enrollment Confirmed Workflow' },
  { event: 'school/enrollment.confirmed' },
  async ({ event, step }) => {
    const { enrollmentId, email, firstName, studentName, schoolName, gradeLevel } = event.data;

    await step.run('send-enrollment-confirmation', async () => {
      await sendTransactionalEmail({
        to: { email, name: firstName },
        templateId: BREVO_TEMPLATES.ENROLLMENT_CONFIRMED,
        params: {
          FIRSTNAME: firstName || 'there',
          STUDENT_NAME: studentName,
          SCHOOL_NAME: schoolName,
          GRADE_LEVEL: gradeLevel,
        },
      });
      console.log(`[Inngest] Enrollment confirmation sent for ${studentName}`);
    });

    return { success: true, enrollmentId };
  }
);

// ═══════════════════════════════════════════════════════════
// PAYMENT REMINDER WORKFLOW
// ═══════════════════════════════════════════════════════════

/**
 * Triggered to send payment reminders.
 * Sends reminder email with payment link.
 */
export const paymentReminderWorkflow = inngest.createFunction(
  { id: 'payment-reminder-workflow', name: 'Payment Reminder Workflow' },
  { event: 'school/payment.reminder' },
  async ({ event, step }) => {
    const { householdId, email, firstName, amountDue, dueDate } = event.data;

    await step.run('send-payment-reminder', async () => {
      await sendPaymentReminderEmail({
        email,
        firstName,
        amountDue: `$${amountDue.toFixed(2)}`,
        dueDate,
        paymentUrl: `${process.env.APP_URL || ''}/portal/billing`,
      });
      console.log(`[Inngest] Payment reminder sent to ${email}`);
    });

    return { success: true, householdId };
  }
);

// ═══════════════════════════════════════════════════════════
// NEWSLETTER WELCOME WORKFLOW
// ═══════════════════════════════════════════════════════════

/**
 * Triggered when someone subscribes to the newsletter.
 * Sends a welcome/confirmation email.
 */
export const newsletterWelcomeWorkflow = inngest.createFunction(
  { id: 'newsletter-welcome', name: 'Newsletter Welcome Email' },
  { event: 'school/newsletter.signup' },
  async ({ event, step }) => {
    const { email, source, name } = event.data;

    await step.run('send-welcome-email', async () => {
      await sendTransactionalEmail({
        to: { email, name },
        templateId: BREVO_TEMPLATES.WELCOME,
        params: {
          FIRSTNAME: name || 'there',
          STORE_URL: process.env.APP_URL || 'https://enrollsy.com',
          SIGNUP_SOURCE: source,
        },
      });
      console.log(`[Inngest] Newsletter welcome email sent to ${email}`);
    });

    return { success: true, email };
  }
);

// ═══════════════════════════════════════════════════════════
// EXPORT ALL FUNCTIONS FOR REGISTRATION
// ═══════════════════════════════════════════════════════════

export const inngestFunctions = [
  applicationSubmittedWorkflow,
  applicationStatusWorkflow,
  welcomeDripCampaign,
  enrollmentConfirmedWorkflow,
  paymentReminderWorkflow,
  newsletterWelcomeWorkflow,
];

// ═══════════════════════════════════════════════════════════
// HELPER: Send Event
// ═══════════════════════════════════════════════════════════

/**
 * Type-safe helper to send events to Inngest.
 * Use this instead of inngest.send() directly for type safety.
 */
export async function sendEvent<T extends keyof SchoolEvents>(
  name: T,
  data: SchoolEvents[T]['data']
): Promise<void> {
  await inngest.send({
    name,
    data,
  });
}
