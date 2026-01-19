// 🎁 Admin Gift Cards - Where soap dreams are wrapped up nicely
// "I'm a gift card!" - Ralph, being Ralph
//
// ╭────────────────────────────────────────────────────────────╮
// │  GIFT CARD MANAGEMENT                                       │
// │  • Create gift cards with custom amounts                    │
// │  • View balance and transaction history                     │
// │  • Disable/enable cards                                     │
// │  • Manually adjust balances                                 │
// ╰────────────────────────────────────────────────────────────╯

import { createFileRoute, Link } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { useState } from 'react';
import {
  Plus,
  Gift,
  DollarSign,
  Calendar,
  Mail,
  Trash2,
  Eye,
  Check,
  X,
  Copy,
  ToggleLeft,
  ToggleRight,
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
  ArrowDownLeft,
  User,
} from 'lucide-react';
import { cn, formatPrice } from '../../utils';
import { requireAdmin } from '../../lib/auth-guards';
import { getDb, giftCards, giftCardTransactions } from '../../db';
import { eq, desc } from 'drizzle-orm';
import {
  createGiftCard,
  activateGiftCard,
  disableGiftCard,
  adjustGiftCardBalance,
  getGiftCardWithTransactions,
} from '../../lib/giftcards';

// ═══════════════════════════════════════════════════════════
// SERVER FUNCTIONS
// ═══════════════════════════════════════════════════════════

const getGiftCards = createServerFn({ method: 'GET' }).handler(async () => {
  const db = getDb();
  const cards = await db.query.giftCards.findMany({
    orderBy: (giftCards, { desc }) => [desc(giftCards.createdAt)],
    with: {
      purchaser: {
        columns: { email: true, firstName: true, lastName: true },
      },
    },
  });
  return cards;
});

const createGiftCardFn = createServerFn({ method: 'POST' }).handler(
  async (data: {
    amount: number;
    recipientEmail?: string;
    recipientName?: string;
    personalMessage?: string;
    expiresInDays?: number;
    activateImmediately?: boolean;
  }) => {
    try {
      const giftCard = await createGiftCard({
        amount: data.amount,
        recipientEmail: data.recipientEmail || undefined,
        recipientName: data.recipientName || undefined,
        personalMessage: data.personalMessage || undefined,
        expiresInDays: data.expiresInDays || undefined,
      });

      // If activating immediately (admin-created cards), activate it
      if (data.activateImmediately) {
        await activateGiftCard(giftCard.id, 'admin-created');
      }

      return { success: true, giftCard };
    } catch (error) {
      console.error('Failed to create gift card:', error);
      return { success: false, error: 'Failed to create gift card' };
    }
  }
);

const toggleGiftCardFn = createServerFn({ method: 'POST' }).handler(
  async (data: { id: string; enable: boolean }) => {
    const db = getDb();

    if (data.enable) {
      // Re-enable a disabled card
      await db
        .update(giftCards)
        .set({
          status: 'active',
          updatedAt: new Date(),
        })
        .where(eq(giftCards.id, data.id));
    } else {
      // Disable the card
      await disableGiftCard(data.id);
    }

    return { success: true };
  }
);

const adjustBalanceFn = createServerFn({ method: 'POST' }).handler(
  async (data: { id: string; adjustment: number; reason: string }) => {
    try {
      await adjustGiftCardBalance(data.id, data.adjustment, data.reason, 'admin');
      return { success: true };
    } catch (error) {
      console.error('Failed to adjust balance:', error);
      return { success: false, error: 'Failed to adjust balance' };
    }
  }
);

const getTransactionsFn = createServerFn({ method: 'GET' }).handler(
  async (data: { id: string }) => {
    const result = await getGiftCardWithTransactions(data.id);
    return result?.transactions || [];
  }
);

const deleteGiftCardFn = createServerFn({ method: 'POST' }).handler(
  async (data: { id: string }) => {
    const db = getDb();
    // Only allow deleting pending/unused cards
    const card = await db.query.giftCards.findFirst({
      where: eq(giftCards.id, data.id),
    });

    if (!card) {
      return { success: false, error: 'Gift card not found' };
    }

    if (card.status !== 'pending' && card.currentBalance !== card.initialBalance) {
      return { success: false, error: 'Cannot delete a gift card that has been used' };
    }

    await db.delete(giftCards).where(eq(giftCards.id, data.id));
    return { success: true };
  }
);

// ═══════════════════════════════════════════════════════════
// ROUTE
// ═══════════════════════════════════════════════════════════

export const Route = createFileRoute('/admin/giftcards')({
  beforeLoad: () => requireAdmin(),
  loader: async () => {
    const cards = await getGiftCards();
    return { giftCards: cards };
  },
  head: () => ({
    meta: [
      { title: "Gift Cards | Admin | Karen's Beautiful Soap" },
      { name: 'description', content: 'Manage gift cards for your store.' },
    ],
  }),
  component: AdminGiftCardsPage,
});

// ═══════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════

function AdminGiftCardsPage() {
  const { giftCards: initialCards } = Route.useLoaderData();
  const [cards, setCards] = useState(initialCards);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Record<string, any[]>>({});
  const [showAdjustModal, setShowAdjustModal] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const refreshCards = async () => {
    const updated = await getGiftCards();
    setCards(updated);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleToggle = async (id: string, enable: boolean) => {
    await toggleGiftCardFn({ id, enable });
    await refreshCards();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this gift card?')) return;
    const result = await deleteGiftCardFn({ id });
    if (!result.success) {
      alert(result.error);
      return;
    }
    await refreshCards();
  };

  const handleExpandCard = async (id: string) => {
    if (expandedCard === id) {
      setExpandedCard(null);
      return;
    }

    setExpandedCard(id);

    // Load transactions if not already loaded
    if (!transactions[id]) {
      const txns = await getTransactionsFn({ id });
      setTransactions((prev) => ({ ...prev, [id]: txns }));
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      active: 'bg-green-100 text-green-800',
      depleted: 'bg-gray-100 text-gray-800',
      expired: 'bg-red-100 text-red-800',
      disabled: 'bg-red-100 text-red-600',
    };

    return (
      <span className={cn('px-2 py-1 text-xs font-medium rounded-full', styles[status] || styles.pending)}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // Stats
  const totalValue = cards.reduce((sum, c) => sum + c.currentBalance, 0);
  const activeCards = cards.filter((c) => c.status === 'active').length;
  const depletedCards = cards.filter((c) => c.status === 'depleted').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A] font-display">Gift Cards</h1>
          <p className="text-gray-500 text-sm mt-1">
            Create and manage gift cards for your customers
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-[#2D5A4A] text-white px-4 py-2 rounded-lg hover:bg-[#1A1A1A] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Gift Card
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-[#F5EBE0] p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Gift className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Cards</p>
              <p className="text-xl font-bold text-[#1A1A1A]">{cards.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[#F5EBE0] p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Outstanding Balance</p>
              <p className="text-xl font-bold text-[#1A1A1A]">{formatPrice(totalValue)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[#F5EBE0] p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Check className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Active Cards</p>
              <p className="text-xl font-bold text-[#1A1A1A]">{activeCards}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[#F5EBE0] p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <X className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Depleted</p>
              <p className="text-xl font-bold text-[#1A1A1A]">{depletedCards}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Gift Cards List */}
      <div className="bg-white rounded-xl border border-[#F5EBE0] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#F5EBE0]/50">
              <tr>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                  Code
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                  Balance
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                  Status
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                  Recipient
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                  Created
                </th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5EBE0]">
              {cards.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <Gift className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No gift cards yet</p>
                    <p className="text-sm mt-1">Create your first gift card to get started</p>
                  </td>
                </tr>
              ) : (
                cards.map((card) => (
                  <>
                    <tr key={card.id} className="hover:bg-[#F5EBE0]/30">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <code className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                            {card.code}
                          </code>
                          <button
                            onClick={() => handleCopyCode(card.code)}
                            className="text-gray-400 hover:text-[#2D5A4A]"
                            title="Copy code"
                          >
                            {copiedCode === card.code ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <span className="font-semibold text-[#2D5A4A]">
                            {formatPrice(card.currentBalance)}
                          </span>
                          {card.currentBalance !== card.initialBalance && (
                            <span className="text-xs text-gray-400 ml-1">
                              / {formatPrice(card.initialBalance)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(card.status)}</td>
                      <td className="px-6 py-4">
                        {card.recipientEmail ? (
                          <div>
                            <p className="text-sm">{card.recipientName || 'Unknown'}</p>
                            <p className="text-xs text-gray-500">{card.recipientEmail}</p>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-500">
                          {card.createdAt ? new Date(card.createdAt).toLocaleDateString() : '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleExpandCard(card.id)}
                            className="text-gray-400 hover:text-[#2D5A4A] p-1"
                            title="View transactions"
                          >
                            {expandedCard === card.id ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                          {card.status === 'active' && (
                            <button
                              onClick={() => setShowAdjustModal(card.id)}
                              className="text-gray-400 hover:text-blue-500 p-1"
                              title="Adjust balance"
                            >
                              <DollarSign className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleToggle(card.id, card.status === 'disabled')}
                            className={cn(
                              'p-1',
                              card.status === 'disabled'
                                ? 'text-gray-400 hover:text-green-500'
                                : 'text-green-500 hover:text-red-500'
                            )}
                            title={card.status === 'disabled' ? 'Enable' : 'Disable'}
                          >
                            {card.status === 'disabled' ? (
                              <ToggleLeft className="w-5 h-5" />
                            ) : (
                              <ToggleRight className="w-5 h-5" />
                            )}
                          </button>
                          {(card.status === 'pending' ||
                            card.currentBalance === card.initialBalance) && (
                            <button
                              onClick={() => handleDelete(card.id)}
                              className="text-gray-400 hover:text-red-500 p-1"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {/* Expanded transaction history */}
                    {expandedCard === card.id && (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 bg-gray-50">
                          <div className="text-sm">
                            <h4 className="font-semibold text-gray-700 mb-3">Transaction History</h4>
                            {transactions[card.id]?.length ? (
                              <div className="space-y-2">
                                {transactions[card.id].map((tx: any) => (
                                  <div
                                    key={tx.id}
                                    className="flex items-center justify-between bg-white rounded-lg px-4 py-2 border border-gray-200"
                                  >
                                    <div className="flex items-center gap-3">
                                      {tx.amount > 0 ? (
                                        <ArrowDownLeft className="w-4 h-4 text-green-500" />
                                      ) : (
                                        <ArrowUpRight className="w-4 h-4 text-red-500" />
                                      )}
                                      <div>
                                        <p className="font-medium text-gray-800">
                                          {tx.type === 'purchase'
                                            ? 'Activated'
                                            : tx.type === 'redemption'
                                            ? 'Redeemed'
                                            : tx.type === 'refund'
                                            ? 'Refunded'
                                            : 'Adjustment'}
                                        </p>
                                        <p className="text-xs text-gray-500">{tx.description}</p>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <p
                                        className={cn(
                                          'font-semibold',
                                          tx.amount > 0 ? 'text-green-600' : 'text-red-600'
                                        )}
                                      >
                                        {tx.amount > 0 ? '+' : ''}
                                        {formatPrice(tx.amount)}
                                      </p>
                                      <p className="text-xs text-gray-400">
                                        Balance: {formatPrice(tx.balanceAfter)}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-gray-500">No transactions yet</p>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateGiftCardModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            refreshCards();
          }}
        />
      )}

      {/* Adjust Balance Modal */}
      {showAdjustModal && (
        <AdjustBalanceModal
          cardId={showAdjustModal}
          onClose={() => setShowAdjustModal(null)}
          onSuccess={() => {
            setShowAdjustModal(null);
            refreshCards();
            // Also refresh transactions for this card
            if (expandedCard === showAdjustModal) {
              getTransactionsFn({ id: showAdjustModal }).then((txns) => {
                setTransactions((prev) => ({ ...prev, [showAdjustModal]: txns }));
              });
            }
          }}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// CREATE MODAL
// ═══════════════════════════════════════════════════════════

function CreateGiftCardModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [amount, setAmount] = useState(25);
  const [customAmount, setCustomAmount] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [personalMessage, setPersonalMessage] = useState('');
  const [expiresInDays, setExpiresInDays] = useState<number | ''>('');
  const [activateImmediately, setActivateImmediately] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const presetAmounts = [25, 50, 75, 100];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const finalAmount = customAmount ? parseFloat(customAmount) : amount;
    if (!finalAmount || finalAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setIsSubmitting(true);

    const result = await createGiftCardFn({
      amount: finalAmount,
      recipientEmail: recipientEmail || undefined,
      recipientName: recipientName || undefined,
      personalMessage: personalMessage || undefined,
      expiresInDays: expiresInDays ? Number(expiresInDays) : undefined,
      activateImmediately,
    });

    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error || 'Failed to create gift card');
      return;
    }

    onSuccess();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-[#F5EBE0]">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#1A1A1A]">Create Gift Card</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Amount Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
            <div className="grid grid-cols-4 gap-2 mb-2">
              {presetAmounts.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setAmount(preset);
                    setCustomAmount('');
                  }}
                  className={cn(
                    'py-2 rounded-lg text-sm font-medium transition-colors',
                    amount === preset && !customAmount
                      ? 'bg-[#2D5A4A] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  )}
                >
                  ${preset}
                </button>
              ))}
            </div>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="number"
                value={customAmount}
                onChange={(e) => {
                  setCustomAmount(e.target.value);
                  setAmount(0);
                }}
                placeholder="Custom amount"
                min="1"
                step="0.01"
                className="w-full pl-9 pr-3 py-2 border border-[#F5EBE0] rounded-lg focus:outline-none focus:border-[#2D5A4A]"
              />
            </div>
          </div>

          {/* Recipient Info (optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recipient Email <span className="text-gray-400">(optional)</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="recipient@example.com"
                className="w-full pl-9 pr-3 py-2 border border-[#F5EBE0] rounded-lg focus:outline-none focus:border-[#2D5A4A]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recipient Name <span className="text-gray-400">(optional)</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="John Doe"
                className="w-full pl-9 pr-3 py-2 border border-[#F5EBE0] rounded-lg focus:outline-none focus:border-[#2D5A4A]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Personal Message <span className="text-gray-400">(optional)</span>
            </label>
            <textarea
              value={personalMessage}
              onChange={(e) => setPersonalMessage(e.target.value)}
              placeholder="Enjoy some beautiful soap!"
              rows={2}
              className="w-full px-3 py-2 border border-[#F5EBE0] rounded-lg focus:outline-none focus:border-[#2D5A4A]"
            />
          </div>

          {/* Expiration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expires In <span className="text-gray-400">(optional)</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="number"
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(e.target.value ? parseInt(e.target.value) : '')}
                placeholder="Leave empty for no expiration"
                min="1"
                className="w-full pl-9 pr-12 py-2 border border-[#F5EBE0] rounded-lg focus:outline-none focus:border-[#2D5A4A]"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                days
              </span>
            </div>
          </div>

          {/* Activate Immediately */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setActivateImmediately(!activateImmediately)}
              className={cn(
                'relative w-11 h-6 rounded-full transition-colors',
                activateImmediately ? 'bg-[#2D5A4A]' : 'bg-gray-300'
              )}
            >
              <span
                className={cn(
                  'absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform',
                  activateImmediately && 'translate-x-5'
                )}
              />
            </button>
            <label className="text-sm text-gray-700">Activate immediately (skip payment)</label>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-[#F5EBE0] rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-[#2D5A4A] text-white rounded-lg hover:bg-[#1A1A1A] disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Gift Card'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// ADJUST BALANCE MODAL
// ═══════════════════════════════════════════════════════════

function AdjustBalanceModal({
  cardId,
  onClose,
  onSuccess,
}: {
  cardId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [adjustment, setAdjustment] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const adjustmentValue = parseFloat(adjustment);
    if (isNaN(adjustmentValue) || adjustmentValue === 0) {
      setError('Please enter a valid adjustment amount');
      return;
    }

    if (!reason.trim()) {
      setError('Please provide a reason for the adjustment');
      return;
    }

    setIsSubmitting(true);

    const result = await adjustBalanceFn({
      id: cardId,
      adjustment: adjustmentValue,
      reason: reason.trim(),
    });

    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error || 'Failed to adjust balance');
      return;
    }

    onSuccess();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full">
        <div className="p-6 border-b border-[#F5EBE0]">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#1A1A1A]">Adjust Balance</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Adjustment Amount
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Use positive number to add funds, negative to remove
            </p>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="number"
                value={adjustment}
                onChange={(e) => setAdjustment(e.target.value)}
                placeholder="e.g., 10 or -5"
                step="0.01"
                className="w-full pl-9 pr-3 py-2 border border-[#F5EBE0] rounded-lg focus:outline-none focus:border-[#2D5A4A]"
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason for adjustment..."
              rows={2}
              className="w-full px-3 py-2 border border-[#F5EBE0] rounded-lg focus:outline-none focus:border-[#2D5A4A]"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-[#F5EBE0] rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-[#2D5A4A] text-white rounded-lg hover:bg-[#1A1A1A] disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Apply Adjustment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
