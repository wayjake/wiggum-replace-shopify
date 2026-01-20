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
} from 'lucide-react';
import { cn } from '../../utils';

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

// ═══════════════════════════════════════════════════════════
// ROUTE DEFINITION
// ═══════════════════════════════════════════════════════════

export const Route = createFileRoute('/portal/billing')({
  head: () => ({
    meta: [
      { title: 'Billing | Family Portal | Enrollsy' },
      { name: 'description', content: 'View invoices, make payments, and manage payment methods.' },
    ],
  }),
  loader: async () => {
    const [session, billingData] = await Promise.all([
      getSessionUser(),
      getBillingData(),
    ]);
    return { ...session, ...billingData };
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
  } = Route.useLoaderData();

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

  return (
    <div className="min-h-screen bg-[#F7F5F2]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-6">
              <Link to="/portal" className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#2F5D50] rounded-lg flex items-center justify-center">
                  <span className="text-lg">🎓</span>
                </div>
                <span className="font-bold text-lg text-[#1F2A44] font-display">Family Portal</span>
              </Link>
            </div>
            <nav className="flex items-center gap-6">
              <Link to="/portal" className="text-gray-600 hover:text-[#2F5D50] text-sm">Dashboard</Link>
              <a href="/portal/applications" className="text-gray-600 hover:text-[#2F5D50] text-sm">Applications</a>
              <Link to="/portal/billing" className="text-[#2F5D50] font-medium text-sm">Billing</Link>
              <button onClick={handleLogout} className="flex items-center gap-1 text-gray-500 hover:text-[#2F5D50] text-sm">
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#1F2A44] font-display flex items-center gap-3">
            <DollarSign className="w-7 h-7 text-[#2F5D50]" />
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
                <p className="text-3xl font-bold text-[#1F2A44]">
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
                <p className="text-3xl font-bold text-[#1F2A44]">
                  {formatCurrency(summary?.totalPaid || 0)}
                </p>
              </div>

              <div className="bg-[#2F5D50] rounded-xl p-6 text-white">
                <p className="text-sm text-white/70 mb-2">Make a Payment</p>
                <button className="w-full py-3 px-4 bg-white text-[#2F5D50] rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center justify-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Pay Now
                </button>
              </div>
            </div>

            {/* Invoices */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-[#1F2A44] mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#2F5D50]" />
                Invoices
              </h2>

              {householdInvoices && householdInvoices.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {householdInvoices.map((invoice: any) => (
                    <div key={invoice.id} className="py-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-[#1F2A44]">
                          {invoice.invoiceNumber || 'Invoice'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {invoice.description || 'Tuition'} • Due {formatDate(invoice.dueDate)}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-semibold text-[#1F2A44]">
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
                <h2 className="text-lg font-semibold text-[#1F2A44] flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-[#2F5D50]" />
                  Payment Methods
                </h2>
                <button className="text-sm text-[#2F5D50] hover:underline flex items-center gap-1">
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
                          <p className="font-medium text-[#1F2A44]">
                            {pm.type === 'card' ? 'Card' : pm.type} •••• {pm.last4}
                          </p>
                          <p className="text-sm text-gray-500">
                            Expires {pm.expiryMonth}/{pm.expiryYear}
                          </p>
                        </div>
                      </div>
                      {pm.isDefault && (
                        <span className="text-xs bg-[#2F5D50]/10 text-[#2F5D50] px-2 py-1 rounded">
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
                  <button className="text-[#2F5D50] hover:underline text-sm mt-2">
                    Add a payment method
                  </button>
                </div>
              )}
            </div>

            {/* Payment History */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-[#1F2A44] mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#2F5D50]" />
                Payment History
              </h2>

              {paymentHistory && paymentHistory.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {paymentHistory.map((payment: any) => (
                    <div key={payment.id} className="py-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-[#1F2A44]">
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
