// 🛍️ Shop Page - The soap gallery where dreams come true
// "I'm a brick!" - Ralph, describing soap bars probably

import { createFileRoute, Link } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { useState } from 'react';
import { Filter, Search, ShoppingBag, Plus, Check } from 'lucide-react';
import { cn } from '../../utils';
import { getDb, products, categories } from '../../db';
import { asc } from 'drizzle-orm';
import { ProductGridSkeleton, Skeleton } from '../../lib/skeletons';

// ═══════════════════════════════════════════════════════════
// SERVER FUNCTIONS - Fetching the soapy goodness from the DB
// ═══════════════════════════════════════════════════════════

const getProducts = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const db = getDb();

    // Fetch all products ordered by sortOrder
    const productList = await db
      .select()
      .from(products)
      .orderBy(asc(products.sortOrder));

    // Fetch all categories
    const categoryList = await db
      .select()
      .from(categories)
      .orderBy(asc(categories.sortOrder));

    return {
      products: productList.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: p.price,
        description: p.description || '',
        shortDescription: p.shortDescription || '',
        category: p.category || 'Uncategorized',
        image: p.imageUrl || 'https://images.unsplash.com/photo-1600857062241-98e5dba7f214?w=400&h=400&fit=crop',
        inStock: p.inStock ?? true,
        featured: p.featured ?? false,
      })),
      categories: ['All', ...categoryList.map((c) => c.name)],
    };
  } catch (error) {
    // If database isn't set up yet, return sample data
    // 🎭 This fallback keeps the store functional during setup
    console.warn('Database not available, using sample data:', error);
    return {
      products: SAMPLE_PRODUCTS,
      categories: SAMPLE_CATEGORIES,
    };
  }
});

// ═══════════════════════════════════════════════════════════
// SAMPLE DATA - Fallback when database isn't configured
// "I sleep in a drawer!" - Ralph, storing backup data
// ═══════════════════════════════════════════════════════════

const SAMPLE_PRODUCTS = [
  {
    id: '1',
    name: 'Lavender Dreams',
    slug: 'lavender-dreams',
    price: 12.00,
    description: 'Drift off with the soothing scent of French lavender',
    shortDescription: 'French lavender for ultimate relaxation',
    category: 'Relaxation',
    image: 'https://images.unsplash.com/photo-1600857062241-98e5dba7f214?w=400&h=400&fit=crop',
    inStock: true,
    featured: true,
  },
  {
    id: '2',
    name: 'Honey Oat Comfort',
    slug: 'honey-oat-comfort',
    price: 14.00,
    description: "Nature's gentlest exfoliation with raw honey and oats",
    shortDescription: 'Gentle exfoliation with raw honey',
    category: 'Exfoliating',
    image: 'https://images.unsplash.com/photo-1607006344380-b6775a0824a7?w=400&h=400&fit=crop',
    inStock: true,
    featured: true,
  },
  {
    id: '3',
    name: 'Rose Petal Luxury',
    slug: 'rose-petal-luxury',
    price: 16.00,
    description: 'Feel like royalty with every wash',
    shortDescription: 'Premium rose petals and rosehip oil',
    category: 'Luxury',
    image: 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?w=400&h=400&fit=crop',
    inStock: true,
    featured: true,
  },
  {
    id: '4',
    name: 'Citrus Burst',
    slug: 'citrus-burst',
    price: 11.00,
    description: 'Wake up your senses with zesty orange and lemon',
    shortDescription: 'Energizing citrus blend',
    category: 'Energizing',
    image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=400&fit=crop',
    inStock: true,
    featured: false,
  },
  {
    id: '5',
    name: 'Coconut Milk Bliss',
    slug: 'coconut-milk-bliss',
    price: 13.00,
    description: 'Tropical hydration in a bar',
    shortDescription: 'Creamy coconut milk and vanilla',
    category: 'Moisturizing',
    image: 'https://images.unsplash.com/photo-1584305574647-0cc949a2bb9f?w=400&h=400&fit=crop',
    inStock: true,
    featured: false,
  },
  {
    id: '6',
    name: 'Forest Pine Freshness',
    slug: 'forest-pine-freshness',
    price: 12.00,
    description: 'Bring the outdoors in',
    shortDescription: 'Pine needles, cedarwood, eucalyptus',
    category: 'Fresh',
    image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop',
    inStock: true,
    featured: false,
  },
];

const SAMPLE_CATEGORIES = ['All', 'Relaxation', 'Exfoliating', 'Luxury', 'Energizing', 'Moisturizing', 'Fresh'];

// ═══════════════════════════════════════════════════════════
// ROUTE DEFINITION
// ═══════════════════════════════════════════════════════════

export const Route = createFileRoute('/shop/')({
  head: () => ({
    meta: [
      { title: "Shop | Karen's Beautiful Soap" },
      {
        name: 'description',
        content: 'Browse our collection of handcrafted artisanal soaps. Lavender, honey oat, rose petal, citrus, and more natural luxury soaps.',
      },
      { property: 'og:title', content: "Shop Our Soaps | Karen's Beautiful Soap" },
      { property: 'og:description', content: 'Discover handcrafted luxury soaps made with natural ingredients' },
    ],
  }),
  loader: async () => {
    return await getProducts();
  },
  pendingComponent: ShopPageSkeleton,
  component: ShopPage,
});

// ═══════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════

function ShopPage() {
  const { products: productList, categories: categoryList } = Route.useLoaderData();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cartItems, setCartItems] = useState<Set<string>>(new Set());

  // Filter products
  const filteredProducts = productList.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const addToCart = (productId: string) => {
    setCartItems((prev) => new Set([...prev, productId]));
    // In a real app, this would also update localStorage or send to server
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#F5EBE0]">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <nav className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#2D5A4A] rounded-full flex items-center justify-center">
                <span className="text-xl">🧼</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-[#1A1A1A] font-display">Karen's Beautiful Soap</h1>
                <p className="text-xs text-gray-500">Handcrafted with love</p>
              </div>
            </Link>
            <Link
              to="/cart"
              className="flex items-center gap-2 bg-[#2D5A4A] text-white px-4 py-2 rounded-lg hover:bg-[#1A1A1A] transition-colors relative"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">Cart</span>
              {cartItems.size > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-[#D4A574] text-white text-xs rounded-full flex items-center justify-center">
                  {cartItems.size}
                </span>
              )}
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-[#1A1A1A] mb-4 font-display">
            Our Soap Collection
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Each bar is handcrafted with love using natural ingredients. Find your perfect match.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-6 mb-8">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search soaps..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-lg border border-[#F5EBE0] bg-white focus:outline-none focus:border-[#2D5A4A] focus:ring-2 focus:ring-[#2D5A4A]/10"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-5 h-5 text-gray-400" />
            {categoryList.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-medium transition-all',
                  selectedCategory === category
                    ? 'bg-[#2D5A4A] text-white'
                    : 'bg-[#F5EBE0] text-[#1A1A1A] hover:bg-[#D4A574] hover:text-white'
                )}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg">No soaps found matching your criteria.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
              }}
              className="mt-4 text-[#2D5A4A] font-medium hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                inCart={cartItems.has(product.id)}
                onAddToCart={() => addToCart(product.id)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PRODUCT CARD COMPONENT
// ═══════════════════════════════════════════════════════════

function ProductCard({
  product,
  inCart,
  onAddToCart,
}: {
  product: typeof SAMPLE_PRODUCTS[number];
  inCart: boolean;
  onAddToCart: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-[#F5EBE0] group">
      {/* Image */}
      <Link to="/shop/$productSlug" params={{ productSlug: product.slug }}>
        <div className="aspect-square overflow-hidden relative">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {product.featured && (
            <span className="absolute top-4 left-4 px-3 py-1 bg-[#D4A574] text-white text-xs font-medium rounded-full">
              Featured
            </span>
          )}
          {!product.inStock && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white font-semibold">Out of Stock</span>
            </div>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="p-5">
        <span className="text-xs text-[#D4A574] font-medium uppercase tracking-wider">
          {product.category}
        </span>
        <Link to="/shop/$productSlug" params={{ productSlug: product.slug }}>
          <h3 className="text-xl font-semibold text-[#1A1A1A] mt-1 group-hover:text-[#2D5A4A] transition-colors font-display">
            {product.name}
          </h3>
        </Link>
        <p className="text-sm text-gray-500 mt-2 line-clamp-2">
          {product.shortDescription}
        </p>

        <div className="flex items-center justify-between mt-4">
          <p className="text-2xl font-bold text-[#2D5A4A]">
            ${product.price.toFixed(2)}
          </p>
          <button
            onClick={onAddToCart}
            disabled={!product.inStock || inCart}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all',
              inCart
                ? 'bg-green-100 text-green-700'
                : product.inStock
                  ? 'bg-[#2D5A4A] text-white hover:bg-[#1A1A1A]'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            )}
          >
            {inCart ? (
              <>
                <Check className="w-4 h-4" />
                Added
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Add
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// LOADING SKELETON
// Displays while product data is being fetched
// ═══════════════════════════════════════════════════════════

function ShopPageSkeleton() {
  return (
    <div className="min-h-screen bg-[#FDFCFB]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#F5EBE0]">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <nav className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#2D5A4A] rounded-full flex items-center justify-center">
                <span className="text-xl">🧼</span>
              </div>
              <div>
                <div className="text-lg font-bold text-[#1A1A1A] font-display">Karen's Beautiful Soap</div>
                <div className="text-xs text-gray-500">Handcrafted with love</div>
              </div>
            </div>
            <Skeleton className="h-10 w-24 rounded-lg" />
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Page Header */}
        <div className="text-center mb-12">
          <Skeleton className="h-12 w-80 mx-auto mb-4" />
          <Skeleton className="h-5 w-96 mx-auto" />
        </div>

        {/* Filters skeleton */}
        <div className="flex flex-col lg:flex-row gap-6 mb-8">
          <Skeleton className="h-12 w-full max-w-md rounded-lg" />
          <div className="flex items-center gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-20 rounded-full" />
            ))}
          </div>
        </div>

        {/* Products Grid Skeleton */}
        <ProductGridSkeleton count={6} />
      </main>
    </div>
  );
}
