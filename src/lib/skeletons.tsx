// 💀 Loading Skeletons - The ghostly placeholders before data arrives
// "I picked one! I picked one!" - Ralph, waiting for data to load

import { cn } from '../utils';

// ═══════════════════════════════════════════════════════════
// BASE SKELETON COMPONENT
// The building block for all shimmer effects
// ═══════════════════════════════════════════════════════════

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-[#F5EBE0]',
        className
      )}
      {...props}
    />
  );
}

// ═══════════════════════════════════════════════════════════
// PRODUCT CARD SKELETON
// Mimics the shape of a product card while loading
// ═══════════════════════════════════════════════════════════

export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-[#F5EBE0]">
      {/* Image placeholder */}
      <Skeleton className="aspect-square w-full rounded-none" />

      {/* Content */}
      <div className="p-5 space-y-3">
        {/* Category */}
        <Skeleton className="h-3 w-20" />

        {/* Title */}
        <Skeleton className="h-6 w-3/4" />

        {/* Description */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>

        {/* Price and button row */}
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-10 w-24 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PRODUCT GRID SKELETON
// Shows a grid of loading product cards
// ═══════════════════════════════════════════════════════════

export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// ORDER ROW SKELETON
// For loading states in order lists
// ═══════════════════════════════════════════════════════════

export function OrderRowSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-[#F5EBE0] p-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Order info */}
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>

        {/* Status badge */}
        <Skeleton className="h-8 w-24 rounded-full" />

        {/* Total */}
        <Skeleton className="h-6 w-20" />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// ORDER LIST SKELETON
// ═══════════════════════════════════════════════════════════

export function OrderListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <OrderRowSkeleton key={i} />
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// TABLE ROW SKELETON
// For admin data tables
// ═══════════════════════════════════════════════════════════

export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <tr className="border-b border-[#F5EBE0]">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-5 w-full max-w-[120px]" />
        </td>
      ))}
    </tr>
  );
}

// ═══════════════════════════════════════════════════════════
// TABLE SKELETON
// ═══════════════════════════════════════════════════════════

export function TableSkeleton({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="bg-white rounded-xl border border-[#F5EBE0] overflow-hidden">
      <table className="w-full">
        <thead className="bg-[#FDFCFB]">
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="px-4 py-3 text-left">
                <Skeleton className="h-4 w-20" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <TableRowSkeleton key={i} columns={columns} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// STAT CARD SKELETON
// For dashboard statistics
// ═══════════════════════════════════════════════════════════

export function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-[#F5EBE0] p-6">
      <div className="flex items-center gap-4">
        <Skeleton className="w-12 h-12 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// DASHBOARD SKELETON
// Full dashboard loading state
// ═══════════════════════════════════════════════════════════

export function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      {/* Table */}
      <TableSkeleton rows={5} columns={5} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// TEXT SKELETON
// For paragraphs of text
// ═══════════════════════════════════════════════════════════

export function TextSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-4"
          style={{ width: i === lines - 1 ? '60%' : '100%' }}
        />
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// CART ITEM SKELETON
// ═══════════════════════════════════════════════════════════

export function CartItemSkeleton() {
  return (
    <div className="flex gap-4 p-4 bg-white rounded-xl border border-[#F5EBE0]">
      {/* Image */}
      <Skeleton className="w-24 h-24 rounded-lg flex-shrink-0" />

      {/* Details */}
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-6 w-16" />
        </div>
      </div>
    </div>
  );
}
