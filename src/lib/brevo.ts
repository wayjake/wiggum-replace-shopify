// 📬 Brevo Email Integration - The postal service of our soap empire
// "The doctor said I wouldn't have so many nosebleeds if I kept my finger outta there."
// - Ralph on email deliverability

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
  WELCOME: 1, // Welcome email for new customers
  ORDER_CONFIRMATION: 2, // Order placed confirmation
  SHIPPING_NOTIFICATION: 3, // Order shipped with tracking
  DELIVERY_FOLLOWUP: 4, // Post-delivery check-in
  REVIEW_REQUEST: 5, // Ask for a product review
  ORDER_CANCELLED: 7, // Order cancellation notification

  // Educational/nurture emails
  SOAP_TIPS: 6, // Tips for using your soap

  // TODO: Update these IDs after creating templates in Brevo!
} as const;

/**
 * Default sender information.
 * Update this with your verified sender in Brevo.
 */
export const DEFAULT_SENDER = {
  name: "Karen's Beautiful Soap",
  email: 'hello@karenssoap.com', // Must be verified in Brevo!
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
  ALL_CUSTOMERS: 1, // All customers who have purchased
  NEWSLETTER: 2, // Newsletter subscribers
  VIP: 3, // High-value customers
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
 * Sends a welcome email to a new customer.
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
      FIRSTNAME: firstName || 'Soap Lover',
      STORE_URL: process.env.APP_URL || 'https://karenssoap.com',
    },
  });

  // Also add to contacts list
  await addContactToList({
    email,
    listIds: [BREVO_LISTS.ALL_CUSTOMERS],
    attributes: {
      FIRSTNAME: firstName,
    },
  });
}

/**
 * Sends an order confirmation email.
 */
export async function sendOrderConfirmationEmail({
  email,
  firstName,
  orderNumber,
  orderTotal,
  orderItems,
  shippingAddress,
}: {
  email: string;
  firstName?: string;
  orderNumber: string;
  orderTotal: string;
  orderItems: string; // HTML formatted list
  shippingAddress: string;
}): Promise<void> {
  await sendTransactionalEmail({
    to: { email, name: firstName },
    templateId: BREVO_TEMPLATES.ORDER_CONFIRMATION,
    params: {
      FIRSTNAME: firstName || 'Soap Lover',
      ORDER_NUMBER: orderNumber,
      ORDER_TOTAL: orderTotal,
      ORDER_ITEMS: orderItems,
      SHIPPING_ADDRESS: shippingAddress,
    },
  });
}

/**
 * Sends a shipping notification email.
 */
export async function sendShippingNotificationEmail({
  email,
  firstName,
  orderNumber,
  trackingNumber,
  trackingUrl,
  estimatedDelivery,
}: {
  email: string;
  firstName?: string;
  orderNumber: string;
  trackingNumber: string;
  trackingUrl: string;
  estimatedDelivery?: string;
}): Promise<void> {
  await sendTransactionalEmail({
    to: { email, name: firstName },
    templateId: BREVO_TEMPLATES.SHIPPING_NOTIFICATION,
    params: {
      FIRSTNAME: firstName || 'Soap Lover',
      ORDER_NUMBER: orderNumber,
      TRACKING_NUMBER: trackingNumber,
      TRACKING_URL: trackingUrl,
      ESTIMATED_DELIVERY: estimatedDelivery || 'in 3-5 business days',
    },
  });
}

/**
 * Sends a review request email.
 */
export async function sendReviewRequestEmail({
  email,
  firstName,
  productName,
  reviewUrl,
}: {
  email: string;
  firstName?: string;
  productName: string;
  reviewUrl: string;
}): Promise<void> {
  await sendTransactionalEmail({
    to: { email, name: firstName },
    templateId: BREVO_TEMPLATES.REVIEW_REQUEST,
    params: {
      FIRSTNAME: firstName || 'Soap Lover',
      PRODUCT_NAME: productName,
      REVIEW_URL: reviewUrl,
    },
  });
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
