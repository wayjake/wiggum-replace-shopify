// 💰 Family Billing - Manage tuition and payments
// "Transparent billing makes happy families"
//
// ╭────────────────────────────────────────────────────────────╮
// │  BILLING PORTAL                                            │
// │  View invoices, make payments, and manage payment methods. │
// │  Clear visibility into what's owed and what's paid.        │
// ╰────────────────────────────────────────────────────────────╯

import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { useState, useEffect } from 'react';
import {
  validateSession,
  parseSessionCookie,
  createLogoutCookie,
} from '../../lib/auth';
import { getDb, households, guardians, invoices, payments, paymentMethods } from '../../db';
import { eq, desc, sum } from 'drizzle-orm';
import {
  DollarSign,
  CreditCard,
  FileText,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  Plus,
  LogOut,
  ChevronRight,
  X,
  Loader2,
  Lock,
  Shield,
} from 'lucide-react';
import { cn } from '../../utils';
import {
  StripeProvider,
  CardElement,
  useStripe,
  useElements,
  cardElementOptions,
} from '../../lib/stripe-client';

// ═══════════════════════════════════════════════════════════
// SERVER FUNCTIONS
// ═══════════════════════════════════════════════════════════

const getSessionUser = createServerFn({ method: 'GET' }).handler(async () => {
  const request = getRequest();
  const cookieHeader = request?.headers.get('cookie') || '';
  const sessionId = parseSessionCookie(cookieHeader);

  if (!sessionId) {
    return { authenticated: false, user: null };
  }

  const session = await validateSession(sessionId);
  if (!session) {
    return { authenticated: false, user: null };
  }

  return {
    authenticated: true,
    user: session.user,
  };
});

const getBillingData = createServerFn({ method: 'GET' }).handler(async () => {
  const request = getRequest();
  const cookieHeader = request?.headers.get('cookie') || '';
  const sessionId = parseSessionCookie(cookieHeader);

  if (!sessionId) {
    return { success: false, error: 'Not authenticated' };
  }

  const session = await validateSession(sessionId);
  if (!session) {
    return { success: false, error: 'Invalid session' };
  }

  const db = getDb();

  try {
    // Find the guardian record linked to this user
    const [guardian] = await db
      .select()
      .from(guardians)
      .where(eq(guardians.userId, session.user.id));

    if (!guardian) {
      return {
        success: true,
        hasHousehold: false,
        household: null,
        invoices: [],
        payments: [],
        paymentMethods: [],
        summary: { totalDue: 0, totalPaid: 0 },
      };
    }

    // Get household info
    const [household] = await db
      .select()
      .from(households)
      .where(eq(households.id, guardian.householdId));

    // Get all invoices
    const householdInvoices = await db
      .select()
      .from(invoices)
      .where(eq(invoices.householdId, guardian.householdId))
      .orderBy(desc(invoices.dueDate));

    // Get payment history
    const paymentHistory = await db
      .select()
      .from(payments)
      .where(eq(payments.householdId, guardian.householdId))
      .orderBy(desc(payments.paidAt))
      .limit(10);

    // Get payment methods
    const userPaymentMethods = await db
      .select()
      .from(paymentMethods)
      .where(eq(paymentMethods.userId, session.user.id));

    // Calculate summary
    let totalDue = 0;
    let totalPaid = 0;

    householdInvoices.forEach((inv) => {
      totalDue += inv.amountDue || 0;
      totalPaid += (inv.total || 0) - (inv.amountDue || 0);
    });

    return {
      success: true,
      hasHousehold: true,
      household: household
        ? {
            id: household.id,
            name: household.name,
          }
        : null,
      invoices: householdInvoices.map((inv) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        description: inv.description,
        total: inv.total,
        amountDue: inv.amountDue,
        status: inv.status,
        dueDate: inv.dueDate,
        createdAt: inv.createdAt,
      })),
      payments: paymentHistory.map((p) => ({
        id: p.id,
        amount: p.amount,
        paymentMethod: p.paymentMethod,
        status: p.status,
        paidAt: p.paidAt,
      })),
      paymentMethods: userPaymentMethods.map((pm) => ({
        id: pm.id,
        type: pm.type,
        last4: pm.last4,
        expiryMonth: pm.expiryMonth,
        expiryYear: pm.expiryYear,
        isDefault: pm.isDefault,
      })),
      summary: {
        totalDue,
        totalPaid,
      },
    };
  } catch (error) {
    console.error('Billing data error:', error);
    return { success: false, error: 'Failed to load billing data' };
  }
});

const logoutUser = createServerFn({ method: 'POST' }).handler(async () => {
  return { cookie: createLogoutCookie() };
});

// Create a payment intent for paying invoices
const createPaymentIntent = createServerFn({ method: 'POST' })
  .validator((data: { amount: number; invoiceId?: string }) => data)
  .handler(async ({ data }) => {
    const request = getRequest();
    const cookieHeader = request?.headers.get('cookie') || '';
    const sessionId = parseSessionCookie(cookieHeader);

    if (!sessionId) {
      return { success: false, error: 'Not authenticated' };
    }

    const session = await validateSession(sessionId);
    if (!session) {
      return { success: false, error: 'Invalid session' };
    }

    // Check if Stripe is configured
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      return { success: false, error: 'Payment processing is not configured. Please contact the school.' };
    }

    try {
      // Import Stripe dynamically
      const Stripe = (await import('stripe')).default;
      const stripe = new Stripe(stripeSecretKey);

      // Create a payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: data.amount,
        currency: 'usd',
        metadata: {
          userId: session.user.id,
          invoiceId: data.invoiceId || '',
        },
      });

      return {
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      };
    } catch (error: any) {
      console.error('Error creating payment intent:', error);
      return { success: false, error: error.message || 'Failed to create payment' };
    }
  });

// Get Stripe publishable key
const getStripePublishableKey = createServerFn({ method: 'GET' }).handler(async () => {
  const key = process.env.VITE_STRIPE_PUBLISHABLE_KEY || process.env.STRIPE_PUBLIC_KEY;
  return { publishableKey: key || null };
});

// Save a new payment method (stub - would integrate with Stripe Setup Intents)
const createSetupIntent = createServerFn({ method: 'POST' }).handler(async () => {
  const request = getRequest();
  const cookieHeader = request?.headers.get('cookie') || '';
  const sessionId = parseSessionCookie(cookieHeader);

  if (!sessionId) {
    return { success: false, error: 'Not authenticated' };
  }

  const session = await validateSession(sessionId);
  if (!session) {
    return { success: false, error: 'Invalid session' };
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    return { success: false, error: 'Payment processing is not configured' };
  }

  try {
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(stripeSecretKey);

    // Create a setup intent for saving a card
    const setupIntent = await stripe.setupIntents.create({
      metadata: {
        userId: session.user.id,
      },
    });

    return {
      success: true,
      clientSecret: setupIntent.client_secret,
    };
  } catch (error: any) {
    console.error('Error creating setup intent:', error);
    return { success: false, error: error.message || 'Failed to setup payment method' };
  }
});

// ═══════════════════════════════════════════════════════════
// ROUTE DEFINITION
// ═══════════════════════════════════════════════════════════

export const Route = createFileRoute('/portal/billing')({
  head: () => ({
    meta: [
      { title: 'Billing | Family Portal | EnrollSage' },
      { name: 'description', content: 'View invoices, make payments, and manage payment methods.' },
    ],
  }),
  loader: async () => {
    const [session, billingData, stripeKey] = await Promise.all([
      getSessionUser(),
      getBillingData(),
      getStripePublishableKey(),
    ]);
    return { ...session, ...billingData, stripePublishableKey: stripeKey.publishableKey };
  },
  component: BillingPage,
});

function BillingPage() {
  const navigate = useNavigate();
  const {
    authenticated,
    user,
    hasHousehold,
    invoices: householdInvoices,
    payments: paymentHistory,
    paymentMethods: userPaymentMethods,
    summary,
    stripePublishableKey,
  } = Route.useLoaderData();

  // Modal and payment state
  const [showPayModal, setShowPayModal] = useState(false);
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [setupClientSecret, setSetupClientSecret] = useState<string | null>(null);

  if (!authenticated || !user) {
    navigate({ to: '/login' });
    return null;
  }

  if (user.role !== 'customer') {
    navigate({ to: user.role === 'superadmin' ? '/super-admin' : '/admin' });
    return null;
  }

  const handleLogout = async () => {
    const result = await logoutUser();
    if (result.cookie) document.cookie = result.cookie;
    navigate({ to: '/login' });
  };

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (dateStr: string | Date | null) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Open pay modal with optional invoice selection
  const openPayModal = async (invoice?: any) => {
    setSelectedInvoice(invoice || null);
    const amount = invoice ? (invoice.amountDue || 0) : (summary?.totalDue || 0);
    setPaymentAmount(String(amount / 100));
    setClientSecret(null);
    setShowPayModal(true);

    // Create payment intent for the amount
    if (amount > 0) {
      try {
        const result = await createPaymentIntent({
          data: {
            amount: amount,
            invoiceId: invoice?.id,
          },
        });
        if (result.success && result.clientSecret) {
          setClientSecret(result.clientSecret);
        }
      } catch (error) {
        console.error('Failed to create payment intent:', error);
      }
    }
  };

  // Open add card modal
  const openAddCardModal = async () => {
    setSetupClientSecret(null);
    setShowAddCardModal(true);

    // Create setup intent for saving a card
    try {
      const result = await createSetupIntent();
      if (result.success && result.clientSecret) {
        setSetupClientSecret(result.clientSecret);
      }
    } catch (error: any) {
      setCardError(error.message || 'Failed to save card');
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9F6]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-6">
              <Link to="/portal" className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#5B7F6D] rounded-lg flex items-center justify-center">
                  <span className="text-lg">🌿</span>
                </div>
                <span className="font-bold text-lg text-[#2D4F3E] font-display">Family Portal</span>
              </Link>
            </div>
            <nav className="flex items-center gap-6">
              <Link to="/portal" className="text-gray-600 hover:text-[#5B7F6D] text-sm">Dashboard</Link>
              <a href="/portal/applications" className="text-gray-600 hover:text-[#5B7F6D] text-sm">Applications</a>
              <Link to="/portal/billing" className="text-[#5B7F6D] font-medium text-sm">Billing</Link>
              <button onClick={handleLogout} className="flex items-center gap-1 text-gray-500 hover:text-[#5B7F6D] text-sm">
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#2D4F3E] font-display flex items-center gap-3">
            <DollarSign className="w-7 h-7 text-[#5B7F6D]" />
            Billing
          </h1>
          <p className="text-gray-600">Manage your tuition payments and view invoices</p>
        </div>

        {!hasHousehold ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <DollarSign className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <h2 className="text-lg font-semibold text-gray-700 mb-2">No Billing Information</h2>
            <p className="text-gray-500">Complete your family registration to view billing.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-amber-600" />
                  </div>
                  <span className="text-sm text-gray-500">Amount Due</span>
                </div>
                <p className="text-3xl font-bold text-[#2D4F3E]">
                  {formatCurrency(summary?.totalDue || 0)}
                </p>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <span className="text-sm text-gray-500">Total Paid</span>
                </div>
                <p className="text-3xl font-bold text-[#2D4F3E]">
                  {formatCurrency(summary?.totalPaid || 0)}
                </p>
              </div>

              <div className="bg-[#5B7F6D] rounded-xl p-6 text-white">
                <p className="text-sm text-white/70 mb-2">Make a Payment</p>
                <button
                  onClick={() => openPayModal()}
                  disabled={(summary?.totalDue || 0) <= 0}
                  className="w-full py-3 px-4 bg-white text-[#5B7F6D] rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CreditCard className="w-4 h-4" />
                  Pay Now
                </button>
              </div>
            </div>

            {/* Invoices */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-[#2D4F3E] mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#5B7F6D]" />
                Invoices
              </h2>

              {householdInvoices && householdInvoices.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {householdInvoices.map((invoice: any) => (
                    <div key={invoice.id} className="py-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-[#2D4F3E]">
                          {invoice.invoiceNumber || 'Invoice'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {invoice.description || 'Tuition'} • Due {formatDate(invoice.dueDate)}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-semibold text-[#2D4F3E]">
                            {formatCurrency(invoice.amountDue || 0)}
                          </p>
                          <p className="text-xs text-gray-500">
                            of {formatCurrency(invoice.total || 0)}
                          </p>
                        </div>
                        <InvoiceStatusBadge status={invoice.status || 'pending'} />
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No invoices yet</p>
                </div>
              )}
            </div>

            {/* Payment Methods */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[#2D4F3E] flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-[#5B7F6D]" />
                  Payment Methods
                </h2>
                <button
                  onClick={() => openAddCardModal()}
                  className="text-sm text-[#5B7F6D] hover:underline flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Add Card
                </button>
              </div>

              {userPaymentMethods && userPaymentMethods.length > 0 ? (
                <div className="space-y-3">
                  {userPaymentMethods.map((pm: any) => (
                    <div
                      key={pm.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                          <CreditCard className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium text-[#2D4F3E]">
                            {pm.type === 'card' ? 'Card' : pm.type} •••• {pm.last4}
                          </p>
                          <p className="text-sm text-gray-500">
                            Expires {pm.expiryMonth}/{pm.expiryYear}
                          </p>
                        </div>
                      </div>
                      {pm.isDefault && (
                        <span className="text-xs bg-[#5B7F6D]/10 text-[#5B7F6D] px-2 py-1 rounded">
                          Default
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No payment methods saved</p>
                  <button
                    onClick={() => openAddCardModal()}
                    className="text-[#5B7F6D] hover:underline text-sm mt-2"
                  >
                    Add a payment method
                  </button>
                </div>
              )}
            </div>

            {/* Payment History */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-[#2D4F3E] mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#5B7F6D]" />
                Payment History
              </h2>

              {paymentHistory && paymentHistory.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {paymentHistory.map((payment: any) => (
                    <div key={payment.id} className="py-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-[#2D4F3E]">
                          {formatCurrency(payment.amount || 0)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {payment.paymentMethod || 'Card'} • {formatDate(payment.paidAt)}
                        </p>
                      </div>
                      <PaymentStatusBadge status={payment.status || 'completed'} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No payment history yet</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pay Now Modal */}
        {showPayModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-[#2D4F3E]">Make a Payment</h3>
                <button
                  onClick={() => setShowPayModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {selectedInvoice && (
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-500">Paying for</p>
                  <p className="font-medium text-[#2D4F3E]">
                    {selectedInvoice.invoiceNumber || 'Invoice'} - {selectedInvoice.description || 'Tuition'}
                  </p>
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Amount
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-[#5B7F6D] focus:ring-2 focus:ring-[#5B7F6D]/10"
                  />
                </div>
              </div>

              {stripePublishableKey && clientSecret ? (
                <StripeProvider publishableKey={stripePublishableKey}>
                  <PaymentForm
                    clientSecret={clientSecret}
                    amount={paymentAmount}
                    onSuccess={() => {
                      setShowPayModal(false);
                      window.location.reload();
                    }}
                    onCancel={() => setShowPayModal(false)}
                  />
                </StripeProvider>
              ) : (
                <div className="text-center py-8">
                  {!stripePublishableKey ? (
                    <div className="text-amber-600">
                      <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm">Payment processing is not configured.</p>
                      <p className="text-xs text-gray-500 mt-1">Please contact the school.</p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2 text-gray-500">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Preparing payment...</span>
                    </div>
                  )}
                  <button
                    onClick={() => setShowPayModal(false)}
                    className="mt-4 px-6 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Add Card Modal */}
        {showAddCardModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-[#2D4F3E]">Add Payment Method</h3>
                <button
                  onClick={() => setShowAddCardModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {stripePublishableKey && setupClientSecret ? (
                <StripeProvider publishableKey={stripePublishableKey}>
                  <AddCardForm
                    clientSecret={setupClientSecret}
                    onSuccess={() => {
                      setShowAddCardModal(false);
                      window.location.reload();
                    }}
                    onCancel={() => setShowAddCardModal(false)}
                  />
                </StripeProvider>
              ) : (
                <div className="text-center py-8">
                  {!stripePublishableKey ? (
                    <div className="text-amber-600">
                      <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm">Payment processing is not configured.</p>
                      <p className="text-xs text-gray-500 mt-1">Please contact the school.</p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2 text-gray-500">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Preparing form...</span>
                    </div>
                  )}
                  <button
                    onClick={() => setShowAddCardModal(false)}
                    className="mt-4 px-6 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function InvoiceStatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; text: string; icon: typeof Clock }> = {
    draft: { bg: 'bg-gray-100', text: 'text-gray-600', icon: FileText },
    pending: { bg: 'bg-amber-100', text: 'text-amber-700', icon: Clock },
    sent: { bg: 'bg-blue-100', text: 'text-blue-700', icon: FileText },
    paid: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
    overdue: { bg: 'bg-red-100', text: 'text-red-700', icon: AlertTriangle },
    void: { bg: 'bg-gray-100', text: 'text-gray-500', icon: FileText },
  };

  const config = styles[status] || styles.pending;
  const Icon = config.icon;

  return (
    <span className={cn('inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full', config.bg, config.text)}>
      <Icon className="w-3 h-3" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function PaymentStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    completed: 'bg-green-100 text-green-700',
    pending: 'bg-amber-100 text-amber-700',
    failed: 'bg-red-100 text-red-700',
    refunded: 'bg-purple-100 text-purple-700',
  };

  return (
    <span className={cn('text-xs px-2 py-1 rounded-full', styles[status] || 'bg-gray-100 text-gray-600')}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════
// STRIPE PAYMENT FORM COMPONENT
// Uses Stripe Elements for secure card collection
// ═══════════════════════════════════════════════════════════

function PaymentForm({
  clientSecret,
  amount,
  onSuccess,
  onCancel,
}: {
  clientSecret: string;
  amount: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [succeeded, setSucceeded] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError('Card element not found');
      setIsProcessing(false);
      return;
    }

    const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
      clientSecret,
      {
        payment_method: {
          card: cardElement,
        },
      }
    );

    if (stripeError) {
      setError(stripeError.message || 'Payment failed');
      setIsProcessing(false);
    } else if (paymentIntent?.status === 'succeeded') {
      setSucceeded(true);
      setIsProcessing(false);
    } else {
      setError('Unexpected payment status');
      setIsProcessing(false);
    }
  };

  if (succeeded) {
    return (
      <div className="text-center py-6">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h4 className="text-lg font-semibold text-[#2D4F3E] mb-2">Payment Successful!</h4>
        <p className="text-gray-600 text-sm mb-4">
          Thank you for your payment. Your account has been updated.
        </p>
        <button
          onClick={onSuccess}
          className="px-6 py-2 bg-[#5B7F6D] text-white rounded-lg hover:bg-[#4A6E5C]"
        >
          Done
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Card Details
        </label>
        <div className="p-4 border border-gray-200 rounded-lg bg-white">
          <CardElement options={cardElementOptions} />
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
        <Shield className="w-4 h-4" />
        <span>Your payment info is secure and encrypted by Stripe</span>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isProcessing}
          className="flex-1 px-4 py-3 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isProcessing || !stripe}
          className="flex-1 px-4 py-3 bg-[#5B7F6D] text-white rounded-lg hover:bg-[#4A6E5C] disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Lock className="w-4 h-4" />
              Pay ${amount || '0.00'}
            </>
          )}
        </button>
      </div>
    </form>
  );
}

// ═══════════════════════════════════════════════════════════
// STRIPE ADD CARD FORM COMPONENT
// Uses Stripe Setup Intents to save card for future use
// ═══════════════════════════════════════════════════════════

function AddCardForm({
  clientSecret,
  onSuccess,
  onCancel,
}: {
  clientSecret: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [succeeded, setSucceeded] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError('Card element not found');
      setIsProcessing(false);
      return;
    }

    const { error: stripeError, setupIntent } = await stripe.confirmCardSetup(
      clientSecret,
      {
        payment_method: {
          card: cardElement,
        },
      }
    );

    if (stripeError) {
      setError(stripeError.message || 'Failed to save card');
      setIsProcessing(false);
    } else if (setupIntent?.status === 'succeeded') {
      setSucceeded(true);
      setIsProcessing(false);
    } else {
      setError('Unexpected status');
      setIsProcessing(false);
    }
  };

  if (succeeded) {
    return (
      <div className="text-center py-6">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h4 className="text-lg font-semibold text-[#2D4F3E] mb-2">Card Saved!</h4>
        <p className="text-gray-600 text-sm mb-4">
          Your card has been securely saved for future payments.
        </p>
        <button
          onClick={onSuccess}
          className="px-6 py-2 bg-[#5B7F6D] text-white rounded-lg hover:bg-[#4A6E5C]"
        >
          Done
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Card Details
        </label>
        <div className="p-4 border border-gray-200 rounded-lg bg-white">
          <CardElement options={cardElementOptions} />
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
        <Shield className="w-4 h-4" />
        <span>Your card info is securely stored by Stripe</span>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isProcessing}
          className="flex-1 px-4 py-3 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isProcessing || !stripe}
          className="flex-1 px-4 py-3 bg-[#5B7F6D] text-white rounded-lg hover:bg-[#4A6E5C] disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4" />
              Save Card
            </>
          )}
        </button>
      </div>
    </form>
  );
}
