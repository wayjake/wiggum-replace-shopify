// 📬 Brevo Email Integration - Communication backbone for Enrollsy
// Handles transactional emails, newsletter signups, and contact management

import * as Brevo from '@getbrevo/brevo';

/**
 * ╭─────────────────────────────────────────────────────────╮
 * │  BREVO EMAIL TEMPLATE IDS                                │
 * │  ─────────────────────────────────────────────────────── │
 * │  Store your Brevo template IDs here after creating them  │
 * │  in the Brevo dashboard. Update these values!            │
 * ╰─────────────────────────────────────────────────────────╯
 */
export const BREVO_TEMPLATES = {
  // Transactional emails
  WELCOME: 1, // Welcome email for new families
  APPLICATION_RECEIVED: 2, // Application confirmation
  APPLICATION_STATUS: 3, // Application status update
  ENROLLMENT_CONFIRMED: 4, // Enrollment confirmed
  PAYMENT_RECEIVED: 5, // Tuition payment received
  PAYMENT_REMINDER: 6, // Tuition payment reminder

  // Staff emails
  STAFF_INVITATION: 8, // Staff invitation to join school

  // Educational/nurture emails
  ENROLLMENT_TIPS: 7, // Tips for school enrollment process

  // TODO: Update these IDs after creating templates in Brevo!
} as const;

/**
 * Default sender information.
 * Update this with your verified sender in Brevo.
 */
export const DEFAULT_SENDER = {
  name: 'Enrollsy',
  email: 'jake@dubsado.com', // Must be verified in Brevo!
};

// ═══════════════════════════════════════════════════════════
// API CLIENTS
// ═══════════════════════════════════════════════════════════

let _transactionalApi: Brevo.TransactionalEmailsApi | null = null;
let _contactsApi: Brevo.ContactsApi | null = null;

function getApiKey(): string {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    throw new Error('BREVO_API_KEY is not set');
  }
  return apiKey;
}

function getTransactionalApi(): Brevo.TransactionalEmailsApi {
  if (!_transactionalApi) {
    _transactionalApi = new Brevo.TransactionalEmailsApi();
    _transactionalApi.setApiKey(
      Brevo.TransactionalEmailsApiApiKeys.apiKey,
      getApiKey()
    );
  }
  return _transactionalApi;
}

function getContactsApi(): Brevo.ContactsApi {
  if (!_contactsApi) {
    _contactsApi = new Brevo.ContactsApi();
    _contactsApi.setApiKey(Brevo.ContactsApiApiKeys.apiKey, getApiKey());
  }
  return _contactsApi;
}

// ═══════════════════════════════════════════════════════════
// TRANSACTIONAL EMAILS
// ═══════════════════════════════════════════════════════════

export type EmailRecipient = {
  email: string;
  name?: string;
};

/**
 * Sends a transactional email using a Brevo template.
 *
 * @param to - Recipient email and optional name
 * @param templateId - Brevo template ID (use BREVO_TEMPLATES constants)
 * @param params - Dynamic variables to inject into the template
 */
export async function sendTransactionalEmail({
  to,
  templateId,
  params,
  subject,
}: {
  to: EmailRecipient;
  templateId: number;
  params: Record<string, string | number>;
  subject?: string; // Override template subject
}): Promise<{ messageId: string }> {
  const api = getTransactionalApi();

  const sendSmtpEmail = new Brevo.SendSmtpEmail();
  sendSmtpEmail.to = [{ email: to.email, name: to.name }];
  sendSmtpEmail.templateId = templateId;
  sendSmtpEmail.params = params;
  sendSmtpEmail.sender = DEFAULT_SENDER;

  if (subject) {
    sendSmtpEmail.subject = subject;
  }

  try {
    const result = await api.sendTransacEmail(sendSmtpEmail);
    console.log(`[Brevo] Email sent to ${to.email}, messageId: ${result.body.messageId}`);
    return { messageId: result.body.messageId || 'unknown' };
  } catch (error) {
    console.error('[Brevo] Failed to send email:', error);
    throw error;
  }
}

/**
 * Sends a simple text email (no template).
 * Useful for quick notifications or testing.
 */
export async function sendSimpleEmail({
  to,
  subject,
  htmlContent,
  textContent,
}: {
  to: EmailRecipient;
  subject: string;
  htmlContent: string;
  textContent?: string;
}): Promise<{ messageId: string }> {
  const api = getTransactionalApi();

  const sendSmtpEmail = new Brevo.SendSmtpEmail();
  sendSmtpEmail.to = [{ email: to.email, name: to.name }];
  sendSmtpEmail.subject = subject;
  sendSmtpEmail.htmlContent = htmlContent;
  sendSmtpEmail.textContent = textContent;
  sendSmtpEmail.sender = DEFAULT_SENDER;

  try {
    const result = await api.sendTransacEmail(sendSmtpEmail);
    return { messageId: result.body.messageId || 'unknown' };
  } catch (error) {
    console.error('[Brevo] Failed to send email:', error);
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════
// CONTACT MANAGEMENT
// ═══════════════════════════════════════════════════════════

/**
 * Brevo list IDs for contact segmentation.
 * Update these after creating lists in Brevo.
 */
export const BREVO_LISTS = {
  ALL_FAMILIES: 1, // All registered families
  NEWSLETTER: 2, // Newsletter subscribers
  SCHOOL_LEADS: 3, // Schools interested in Enrollsy
} as const;

/**
 * Adds a contact to Brevo and optionally to specific lists.
 *
 * @param email - Contact's email address
 * @param listIds - Brevo list IDs to add the contact to
 * @param attributes - Custom attributes (firstName, lastName, etc.)
 */
export async function addContactToList({
  email,
  listIds,
  attributes,
}: {
  email: string;
  listIds?: number[];
  attributes?: {
    FIRSTNAME?: string;
    LASTNAME?: string;
    [key: string]: string | number | boolean | undefined;
  };
}): Promise<void> {
  const api = getContactsApi();

  const createContact = new Brevo.CreateContact();
  createContact.email = email;
  createContact.listIds = listIds;
  createContact.attributes = attributes;
  createContact.updateEnabled = true; // Update if contact exists

  try {
    await api.createContact(createContact);
    console.log(`[Brevo] Contact added/updated: ${email}`);
  } catch (error) {
    // Check if contact already exists (that's okay)
    if ((error as { statusCode?: number }).statusCode === 400) {
      console.log(`[Brevo] Contact already exists: ${email}`);
      return;
    }
    console.error('[Brevo] Failed to add contact:', error);
    throw error;
  }
}

/**
 * Updates a contact's attributes.
 */
export async function updateContact({
  email,
  attributes,
}: {
  email: string;
  attributes: Record<string, string | number | boolean>;
}): Promise<void> {
  const api = getContactsApi();

  const updateContact = new Brevo.UpdateContact();
  updateContact.attributes = attributes;

  try {
    await api.updateContact(email, updateContact);
    console.log(`[Brevo] Contact updated: ${email}`);
  } catch (error) {
    console.error('[Brevo] Failed to update contact:', error);
    throw error;
  }
}

/**
 * Removes a contact from specific lists.
 * The contact remains in Brevo but is removed from the lists.
 */
export async function removeContactFromLists({
  email,
  listIds,
}: {
  email: string;
  listIds: number[];
}): Promise<void> {
  const api = getContactsApi();

  const updateContact = new Brevo.UpdateContact();
  updateContact.unlinkListIds = listIds;

  try {
    await api.updateContact(email, updateContact);
    console.log(`[Brevo] Contact removed from lists: ${email}`);
  } catch (error) {
    console.error('[Brevo] Failed to remove contact from lists:', error);
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════
// HELPER FUNCTIONS FOR COMMON EMAIL SCENARIOS
// ═══════════════════════════════════════════════════════════

/**
 * Sends a welcome email to a new family.
 */
export async function sendWelcomeEmail({
  email,
  firstName,
}: {
  email: string;
  firstName?: string;
}): Promise<void> {
  await sendTransactionalEmail({
    to: { email, name: firstName },
    templateId: BREVO_TEMPLATES.WELCOME,
    params: {
      FIRSTNAME: firstName || 'there',
      STORE_URL: process.env.APP_URL || 'https://enrollsy.com',
    },
  });

  // Also add to contacts list
  await addContactToList({
    email,
    listIds: [BREVO_LISTS.ALL_FAMILIES],
    attributes: {
      FIRSTNAME: firstName,
    },
  });
}

/**
 * Sends an application received email.
 */
export async function sendApplicationReceivedEmail({
  email,
  firstName,
  applicationId,
  studentName,
  schoolName,
}: {
  email: string;
  firstName?: string;
  applicationId: string;
  studentName: string;
  schoolName: string;
}): Promise<void> {
  await sendTransactionalEmail({
    to: { email, name: firstName },
    templateId: BREVO_TEMPLATES.APPLICATION_RECEIVED,
    params: {
      FIRSTNAME: firstName || 'there',
      APPLICATION_ID: applicationId,
      STUDENT_NAME: studentName,
      SCHOOL_NAME: schoolName,
    },
  });
}

/**
 * Sends an application status update email.
 */
export async function sendApplicationStatusEmail({
  email,
  firstName,
  applicationId,
  studentName,
  status,
  message,
}: {
  email: string;
  firstName?: string;
  applicationId: string;
  studentName: string;
  status: string;
  message?: string;
}): Promise<void> {
  await sendTransactionalEmail({
    to: { email, name: firstName },
    templateId: BREVO_TEMPLATES.APPLICATION_STATUS,
    params: {
      FIRSTNAME: firstName || 'there',
      APPLICATION_ID: applicationId,
      STUDENT_NAME: studentName,
      STATUS: status,
      MESSAGE: message || '',
    },
  });
}

/**
 * Sends a payment reminder email.
 */
export async function sendPaymentReminderEmail({
  email,
  firstName,
  amountDue,
  dueDate,
  paymentUrl,
}: {
  email: string;
  firstName?: string;
  amountDue: string;
  dueDate: string;
  paymentUrl: string;
}): Promise<void> {
  await sendTransactionalEmail({
    to: { email, name: firstName },
    templateId: BREVO_TEMPLATES.PAYMENT_REMINDER,
    params: {
      FIRSTNAME: firstName || 'there',
      AMOUNT_DUE: amountDue,
      DUE_DATE: dueDate,
      PAYMENT_URL: paymentUrl,
    },
  });
}

/**
 * Sends a staff invitation email to join a school.
 */
export async function sendStaffInvitationEmail({
  to,
  inviterName,
  schoolName,
  role,
  inviteUrl,
  expiresAt,
}: {
  to: string;
  inviterName: string;
  schoolName: string;
  role: string;
  inviteUrl: string;
  expiresAt: Date;
}): Promise<void> {
  const roleLabels: Record<string, string> = {
    owner: 'Owner',
    admin: 'Administrator',
    admissions: 'Admissions',
    business_office: 'Business Office',
    readonly: 'View Only',
  };

  // Try to use template, fall back to simple email
  try {
    await sendTransactionalEmail({
      to: { email: to },
      templateId: BREVO_TEMPLATES.STAFF_INVITATION,
      params: {
        INVITER_NAME: inviterName,
        SCHOOL_NAME: schoolName,
        ROLE: roleLabels[role] || role,
        INVITE_URL: inviteUrl,
        EXPIRES_DATE: expiresAt.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
      },
    });
  } catch (error) {
    // Fallback to simple HTML email if template fails
    console.log('[Brevo] Template failed, sending simple email instead');
    await sendSimpleEmail({
      to: { email: to },
      subject: `You've been invited to join ${schoolName} on Enrollsy`,
      htmlContent: `
        <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1F2A44;">You're Invited! 🎉</h1>
          <p>${inviterName} has invited you to join <strong>${schoolName}</strong> on Enrollsy as a <strong>${roleLabels[role] || role}</strong>.</p>
          <p>Enrollsy is the all-in-one enrollment management platform that makes school admissions simple.</p>
          <div style="margin: 30px 0;">
            <a href="${inviteUrl}" style="display: inline-block; background-color: #2F5D50; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">
              Accept Invitation
            </a>
          </div>
          <p style="color: #6B7280; font-size: 14px;">
            This invitation expires on ${expiresAt.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}.
          </p>
          <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;" />
          <p style="color: #9CA3AF; font-size: 12px;">
            If you weren't expecting this invitation, you can safely ignore this email.
          </p>
        </div>
      `,
      textContent: `
You're Invited!

${inviterName} has invited you to join ${schoolName} on Enrollsy as a ${roleLabels[role] || role}.

Accept your invitation: ${inviteUrl}

This invitation expires on ${expiresAt.toLocaleDateString()}.

If you weren't expecting this invitation, you can safely ignore this email.
      `,
    });
  }
}

// ═══════════════════════════════════════════════════════════
// CONNECTION VERIFICATION
// ═══════════════════════════════════════════════════════════

/**
 * Verifies that Brevo is properly configured and accessible.
 */
export async function verifyBrevoConnection(): Promise<{
  valid: boolean;
  error?: string;
}> {
  try {
    const api = getTransactionalApi();
    // Try to get SMTP details as a connection test
    await api.getSmtpReport();
    return { valid: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { valid: false, error: message };
  }
}
