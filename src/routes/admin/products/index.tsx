// 📦 Admin Products - The soap inventory control room
// "I bent my Wookiee!" - Ralph on product management

import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { Plus, Search, Edit, Trash2, MoreHorizontal, Package, AlertTriangle } from 'lucide-react';
import { cn, formatPrice } from '../../../utils';

export const Route = createFileRoute('/admin/products/')({
  head: () => ({
    meta: [
      { title: "Products | Admin | Karen's Beautiful Soap" },
      { name: 'description', content: 'Manage your product catalog.' },
    ],
  }),
  component: AdminProducts,
});

// ═══════════════════════════════════════════════════════════
// SAMPLE DATA
// ═══════════════════════════════════════════════════════════

const PRODUCTS = [
  {
    id: '1',
    name: 'Lavender Dreams',
    slug: 'lavender-dreams',
    price: 12.00,
    category: 'Relaxation',
    stock: 5,
    image: 'https://images.unsplash.com/photo-1600857062241-98e5dba7f214?w=80&h=80&fit=crop',
    status: 'low_stock',
  },
  {
    id: '2',
    name: 'Honey Oat Comfort',
    slug: 'honey-oat-comfort',
    price: 14.00,
    category: 'Exfoliating',
    stock: 24,
    image: 'https://images.unsplash.com/photo-1607006344380-b6775a0824a7?w=80&h=80&fit=crop',
    status: 'in_stock',
  },
  {
    id: '3',
    name: 'Rose Petal Luxury',
    slug: 'rose-petal-luxury',
    price: 16.00,
    category: 'Luxury',
    stock: 3,
    image: 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?w=80&h=80&fit=crop',
    status: 'low_stock',
  },
  {
    id: '4',
    name: 'Citrus Burst',
    slug: 'citrus-burst',
    price: 11.00,
    category: 'Energizing',
    stock: 45,
    image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=80&h=80&fit=crop',
    status: 'in_stock',
  },
  {
    id: '5',
    name: 'Coconut Milk Bliss',
    slug: 'coconut-milk-bliss',
    price: 13.00,
    category: 'Moisturizing',
    stock: 0,
    image: 'https://images.unsplash.com/photo-1584305574647-0cc949a2bb9f?w=80&h=80&fit=crop',
    status: 'out_of_stock',
  },
];

function AdminProducts() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());

  const filteredProducts = PRODUCTS.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleProduct = (id: string) => {
    setSelectedProducts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedProducts.size === filteredProducts.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(filteredProducts.map((p) => p.id)));
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
            <nav className="flex items-center gap-6">
              <Link to="/admin" className="text-gray-600 hover:text-[#2D5A4A]">Dashboard</Link>
              <Link to="/admin/products" className="text-[#2D5A4A] font-medium">Products</Link>
              <Link to="/admin/orders" className="text-gray-600 hover:text-[#2D5A4A]">Orders</Link>
              <Link to="/admin/customers" className="text-gray-600 hover:text-[#2D5A4A]">Customers</Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-[#1A1A1A] font-display">Products</h2>
            <p className="text-gray-600">{PRODUCTS.length} products in your catalog</p>
          </div>
          <Link
            to="/admin/products/new"
            className="flex items-center gap-2 bg-[#2D5A4A] text-white px-4 py-2 rounded-lg hover:bg-[#1A1A1A] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </Link>
        </div>

        {/* Search & Filters */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-[#F5EBE0] focus:outline-none focus:border-[#2D5A4A]"
            />
          </div>
          {selectedProducts.size > 0 && (
            <button className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
              <Trash2 className="w-4 h-4" />
              Delete ({selectedProducts.size})
            </button>
          )}
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-xl border border-[#F5EBE0] overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#F5EBE0]/50">
              <tr>
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedProducts.size === filteredProducts.length && filteredProducts.length > 0}
                    onChange={toggleAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Product</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Category</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Price</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Stock</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
                <th className="w-20 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id} className="border-t border-[#F5EBE0] hover:bg-[#FDFCFB]">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedProducts.has(product.id)}
                      onChange={() => toggleProduct(product.id)}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                      <div>
                        <p className="font-medium text-[#1A1A1A]">{product.name}</p>
                        <p className="text-xs text-gray-500">/{product.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{product.category}</td>
                  <td className="px-4 py-3 font-medium">{formatPrice(product.price)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'text-sm',
                        product.stock === 0 ? 'text-red-600' : product.stock < 10 ? 'text-amber-600' : 'text-gray-600'
                      )}>
                        {product.stock}
                      </span>
                      {product.stock < 10 && product.stock > 0 && (
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StockStatus status={product.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        to="/admin/products/$productId"
                        params={{ productId: product.id }}
                        className="p-2 text-gray-400 hover:text-[#2D5A4A] hover:bg-[#F5EBE0] rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No products found</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function StockStatus({ status }: { status: string }) {
  const styles: Record<string, string> = {
    in_stock: 'bg-green-100 text-green-700',
    low_stock: 'bg-amber-100 text-amber-700',
    out_of_stock: 'bg-red-100 text-red-700',
  };

  const labels: Record<string, string> = {
    in_stock: 'In Stock',
    low_stock: 'Low Stock',
    out_of_stock: 'Out of Stock',
  };

  return (
    <span className={`text-xs px-2 py-1 rounded-full ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
      {labels[status] || status}
    </span>
  );
}
