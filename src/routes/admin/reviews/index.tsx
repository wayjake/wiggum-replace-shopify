// 🎭 Admin Reviews - The moderation station for customer feedback
// "I'm helping!" - Ralph, approving quality reviews
//
// This is where Karen decides which reviews make it to the shop floor.
// Pending reviews await their fate, approved ones shine, rejected ones... well.

import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { useState, useEffect } from 'react';
import {
  Star,
  Check,
  X,
  MessageSquare,
  Filter,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { cn } from '../../../utils';
import { requireAdmin } from '../../../lib/auth-guards';
import { getDb, productReviews, products } from '../../../db';
import { eq, desc, and, count } from 'drizzle-orm';

// ═══════════════════════════════════════════════════════════
// SERVER FUNCTIONS
// ═══════════════════════════════════════════════════════════

const getReviews = createServerFn({ method: 'GET' })
  .handler(async () => {
    const db = getDb();

    // Get all reviews with product info
    const reviews = await db
      .select({
        review: productReviews,
        productName: products.name,
        productSlug: products.slug,
      })
      .from(productReviews)
      .leftJoin(products, eq(productReviews.productId, products.id))
      .orderBy(desc(productReviews.createdAt));

    // Get counts by status
    const pendingCount = await db
      .select({ count: count() })
      .from(productReviews)
      .where(eq(productReviews.status, 'pending'));

    const approvedCount = await db
      .select({ count: count() })
      .from(productReviews)
      .where(eq(productReviews.status, 'approved'));

    const rejectedCount = await db
      .select({ count: count() })
      .from(productReviews)
      .where(eq(productReviews.status, 'rejected'));

    return {
      reviews,
      counts: {
        pending: pendingCount[0]?.count || 0,
        approved: approvedCount[0]?.count || 0,
        rejected: rejectedCount[0]?.count || 0,
        total: reviews.length,
      },
    };
  });

const updateReviewStatus = createServerFn({ method: 'POST' })
  .handler(async (data: {
    reviewId: string;
    status: 'approved' | 'rejected';
    adminNotes?: string;
    adminId: string;
  }) => {
    const { reviewId, status, adminNotes, adminId } = data;

    const db = getDb();

    await db
      .update(productReviews)
      .set({
        status,
        adminNotes,
        reviewedAt: new Date(),
        reviewedBy: adminId,
        updatedAt: new Date(),
      })
      .where(eq(productReviews.id, reviewId));

    return { success: true };
  });

// ═══════════════════════════════════════════════════════════
// ROUTE DEFINITION
// ═══════════════════════════════════════════════════════════

export const Route = createFileRoute('/admin/reviews/')({
  head: () => ({
    meta: [
      { title: "Reviews | Admin | Karen's Beautiful Soap" },
      { name: 'description', content: 'Moderate customer reviews for your soap store.' },
    ],
  }),
  loader: async () => {
    const authResult = await requireAdmin();
    if (!authResult.authenticated || !authResult.isAdmin) {
      return { authResult, reviews: [], counts: { pending: 0, approved: 0, rejected: 0, total: 0 } };
    }
    const data = await getReviews();
    return { authResult, ...data };
  },
  component: AdminReviews,
});

// ═══════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════

function AdminReviews() {
  const navigate = useNavigate();
  const { authResult, reviews, counts } = Route.useLoaderData();
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Handle auth redirects
  useEffect(() => {
    if (!authResult.authenticated || !authResult.isAdmin) {
      navigate({ to: authResult.redirect || '/login' });
    }
  }, [authResult, navigate]);

  // Don't render if not authenticated/admin
  if (!authResult.authenticated || !authResult.isAdmin) {
    return (
      <div className="min-h-screen bg-[#FDFCFB] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#2D5A4A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const filteredReviews = reviews.filter((r) =>
    filter === 'all' ? true : r.review.status === filter
  );

  const handleStatusUpdate = async (reviewId: string, status: 'approved' | 'rejected') => {
    setProcessingId(reviewId);
    try {
      await updateReviewStatus({
        reviewId,
        status,
        adminId: authResult.user!.id,
      });
      // Refresh the page to get updated data
      window.location.reload();
    } catch (error) {
      console.error('Failed to update review:', error);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB]">
      {/* Admin Header */}
      <header className="bg-white border-b border-[#F5EBE0]">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link to="/" className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#2D5A4A] rounded-full flex items-center justify-center">
                  <span className="text-xl">🧼</span>
                </div>
                <div>
                  <h1 className="text-lg font-bold text-[#1A1A1A] font-display">Admin Dashboard</h1>
                  <p className="text-xs text-gray-500">Karen's Beautiful Soap</p>
                </div>
              </Link>
            </div>

            {/* Admin Nav */}
            <nav className="flex items-center gap-6">
              <Link to="/admin" className="text-gray-600 hover:text-[#2D5A4A]">Dashboard</Link>
              <Link to="/admin/products" className="text-gray-600 hover:text-[#2D5A4A]">Products</Link>
              <Link to="/admin/orders" className="text-gray-600 hover:text-[#2D5A4A]">Orders</Link>
              <Link to="/admin/customers" className="text-gray-600 hover:text-[#2D5A4A]">Customers</Link>
              <Link to="/admin/reviews" className="text-[#2D5A4A] font-medium">Reviews</Link>
              <Link to="/" className="text-gray-500 hover:text-[#2D5A4A] text-sm">View Store →</Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-[#1A1A1A] font-display flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-[#2D5A4A]" />
              Review Moderation
            </h2>
            <p className="text-gray-600">Approve or reject customer reviews before they go live.</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Pending"
            count={counts.pending}
            icon={Clock}
            color="amber"
            active={filter === 'pending'}
            onClick={() => setFilter('pending')}
          />
          <StatCard
            label="Approved"
            count={counts.approved}
            icon={CheckCircle}
            color="green"
            active={filter === 'approved'}
            onClick={() => setFilter('approved')}
          />
          <StatCard
            label="Rejected"
            count={counts.rejected}
            icon={XCircle}
            color="red"
            active={filter === 'rejected'}
            onClick={() => setFilter('rejected')}
          />
          <StatCard
            label="All Reviews"
            count={counts.total}
            icon={MessageSquare}
            color="blue"
            active={filter === 'all'}
            onClick={() => setFilter('all')}
          />
        </div>

        {/* Reviews List */}
        <div className="bg-white rounded-xl border border-[#F5EBE0]">
          {filteredReviews.length === 0 ? (
            <div className="text-center py-16">
              <MessageSquare className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">
                {filter === 'pending'
                  ? 'No pending reviews to moderate!'
                  : `No ${filter} reviews found.`}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#F5EBE0]">
              {filteredReviews.map(({ review, productName, productSlug }) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  productName={productName || 'Unknown Product'}
                  productSlug={productSlug || ''}
                  isProcessing={processingId === review.id}
                  onApprove={() => handleStatusUpdate(review.id, 'approved')}
                  onReject={() => handleStatusUpdate(review.id, 'rejected')}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// HELPER COMPONENTS
// ═══════════════════════════════════════════════════════════

function StatCard({
  label,
  count,
  icon: Icon,
  color,
  active,
  onClick,
}: {
  label: string;
  count: number;
  icon: typeof Clock;
  color: 'amber' | 'green' | 'red' | 'blue';
  active: boolean;
  onClick: () => void;
}) {
  const colors = {
    amber: { bg: 'bg-amber-100', text: 'text-amber-600', border: 'border-amber-400' },
    green: { bg: 'bg-green-100', text: 'text-green-600', border: 'border-green-400' },
    red: { bg: 'bg-red-100', text: 'text-red-600', border: 'border-red-400' },
    blue: { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-400' },
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        'p-4 rounded-xl border-2 transition-all text-left',
        active
          ? `${colors[color].bg} ${colors[color].border}`
          : 'bg-white border-[#F5EBE0] hover:border-gray-300'
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', colors[color].bg)}>
          <Icon className={cn('w-5 h-5', colors[color].text)} />
        </div>
        <div>
          <p className="text-2xl font-bold text-[#1A1A1A]">{count}</p>
          <p className="text-sm text-gray-500">{label}</p>
        </div>
      </div>
    </button>
  );
}

function ReviewCard({
  review,
  productName,
  productSlug,
  isProcessing,
  onApprove,
  onReject,
}: {
  review: typeof productReviews.$inferSelect;
  productName: string;
  productSlug: string;
  isProcessing: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  const statusColors = {
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
  };

  return (
    <div className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          {/* Product & Status */}
          <div className="flex items-center gap-3 mb-2">
            <Link
              to="/shop/$productSlug"
              params={{ productSlug }}
              className="text-sm text-[#2D5A4A] hover:underline font-medium"
            >
              {productName}
            </Link>
            <span className={cn('text-xs px-2 py-0.5 rounded-full capitalize', statusColors[review.status])}>
              {review.status}
            </span>
            {review.verified && (
              <span className="text-xs text-green-600 flex items-center gap-1">
                <Check className="w-3 h-3" /> Verified Purchase
              </span>
            )}
          </div>

          {/* Rating */}
          <div className="flex items-center gap-1 mb-2">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={cn(
                  'w-4 h-4',
                  i < review.rating ? 'fill-[#D4A574] text-[#D4A574]' : 'text-gray-200'
                )}
              />
            ))}
          </div>

          {/* Title & Body */}
          {review.title && (
            <h4 className="font-medium text-[#1A1A1A] mb-1">{review.title}</h4>
          )}
          {review.body && (
            <p className="text-gray-600 text-sm">{review.body}</p>
          )}

          {/* Metadata */}
          <p className="text-xs text-gray-400 mt-3">
            Submitted {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : 'Unknown date'}
          </p>
        </div>

        {/* Actions */}
        {review.status === 'pending' && (
          <div className="flex items-center gap-2">
            <button
              onClick={onApprove}
              disabled={isProcessing}
              className={cn(
                'flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isProcessing
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              )}
            >
              <Check className="w-4 h-4" />
              Approve
            </button>
            <button
              onClick={onReject}
              disabled={isProcessing}
              className={cn(
                'flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isProcessing
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-red-100 text-red-700 hover:bg-red-200'
              )}
            >
              <X className="w-4 h-4" />
              Reject
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
