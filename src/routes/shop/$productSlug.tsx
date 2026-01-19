// 🧼 Product Detail Page - Where you fall in love with soap
// "That's where I'm a Viking!" - Ralph on finding the perfect soap
//
// 🎭 Now featuring REAL reviews with moderation!
// Customers can submit reviews, Karen approves them, everyone wins.

import { createFileRoute, Link, notFound } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { useState } from 'react';
import { ArrowLeft, ShoppingBag, Plus, Minus, Truck, Leaf, Shield, Star, Heart, Check, MessageSquare, Send, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../utils';
import { useCart } from '../../lib/cart';
import { getDb, productReviews, products } from '../../db';
import { eq, and, desc, avg, count } from 'drizzle-orm';
import { getSession } from '../../lib/auth-guards';

// ═══════════════════════════════════════════════════════════
// SERVER FUNCTIONS
// ═══════════════════════════════════════════════════════════

const getProductWithReviews = createServerFn({ method: 'GET' })
  .handler(async (slug: string) => {
    const db = getDb();

    // Get product by slug
    const product = await db.query.products.findFirst({
      where: eq(products.slug, slug),
    });

    if (!product) {
      return { product: null, reviews: [], stats: null };
    }

    // Get approved reviews for this product
    const reviews = await db
      .select()
      .from(productReviews)
      .where(
        and(
          eq(productReviews.productId, product.id),
          eq(productReviews.status, 'approved')
        )
      )
      .orderBy(desc(productReviews.createdAt));

    // Calculate review stats
    const statsResult = await db
      .select({
        avgRating: avg(productReviews.rating),
        totalReviews: count(),
      })
      .from(productReviews)
      .where(
        and(
          eq(productReviews.productId, product.id),
          eq(productReviews.status, 'approved')
        )
      );

    const stats = {
      averageRating: Number(statsResult[0]?.avgRating || 0),
      totalReviews: Number(statsResult[0]?.totalReviews || 0),
    };

    return { product, reviews, stats };
  });

const submitReview = createServerFn({ method: 'POST' })
  .handler(async (data: {
    productId: string;
    rating: number;
    title?: string;
    body?: string;
  }) => {
    const { productId, rating, title, body } = data;

    // Validate rating
    if (rating < 1 || rating > 5) {
      return { success: false, error: 'Rating must be between 1 and 5' };
    }

    // Get user session (optional - allow guest reviews)
    const session = await getSession();

    if (!session) {
      return { success: false, error: 'Please sign in to leave a review' };
    }

    const db = getDb();

    // Check if user already reviewed this product
    const existingReview = await db.query.productReviews.findFirst({
      where: and(
        eq(productReviews.productId, productId),
        eq(productReviews.userId, session.id)
      ),
    });

    if (existingReview) {
      return { success: false, error: 'You have already reviewed this product' };
    }

    // Check if user has purchased this product (for verified badge)
    // TODO: Add order check for verified purchase badge

    try {
      await db.insert(productReviews).values({
        productId,
        userId: session.id,
        rating,
        title: title || null,
        body: body || null,
        status: 'pending', // 🎭 Requires admin approval!
        verified: false, // TODO: Check purchase history
      });

      return {
        success: true,
        message: 'Thank you! Your review has been submitted and is awaiting approval.',
      };
    } catch (error) {
      console.error('Failed to submit review:', error);
      return { success: false, error: 'Failed to submit review. Please try again.' };
    }
  });

// ═══════════════════════════════════════════════════════════
// SAMPLE PRODUCTS DATA (fallback until database is seeded)
// ═══════════════════════════════════════════════════════════

const SAMPLE_PRODUCTS: Record<string, {
  id: string;
  name: string;
  slug: string;
  price: number;
  description: string;
  shortDescription: string;
  category: string;
  ingredients: string;
  imageUrl: string;
  images: string[];
  inStock: boolean;
  weight: string;
}> = {
  'lavender-dreams': {
    id: '1',
    name: 'Lavender Dreams',
    slug: 'lavender-dreams',
    price: 12.00,
    description: 'Drift off with the soothing scent of French lavender. This calming bar is perfect for your evening routine, helping you unwind after a long day. The gentle formula cleanses without stripping, leaving your skin soft and lightly scented.',
    shortDescription: 'French lavender for ultimate relaxation',
    category: 'Relaxation',
    ingredients: 'Olive Oil, Coconut Oil, Shea Butter, French Lavender Essential Oil, Vitamin E, Dried Lavender Buds',
    imageUrl: 'https://images.unsplash.com/photo-1600857062241-98e5dba7f214?w=800&h=800&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1600857062241-98e5dba7f214?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1611073615830-6f2e82d00f6e?w=800&h=800&fit=crop',
    ],
    inStock: true,
    weight: '4.5 oz',
  },
  'honey-oat-comfort': {
    id: '2',
    name: 'Honey Oat Comfort',
    slug: 'honey-oat-comfort',
    price: 14.00,
    description: "Nature's gentlest exfoliation. This nourishing bar combines the moisturizing properties of raw honey with the gentle exfoliation of organic oats. Perfect for sensitive skin that needs a little extra care.",
    shortDescription: 'Gentle exfoliation with raw honey',
    category: 'Exfoliating',
    ingredients: 'Olive Oil, Coconut Oil, Organic Oatmeal, Raw Honey, Shea Butter, Vitamin E',
    imageUrl: 'https://images.unsplash.com/photo-1607006344380-b6775a0824a7?w=800&h=800&fit=crop',
    images: ['https://images.unsplash.com/photo-1607006344380-b6775a0824a7?w=800&h=800&fit=crop'],
    inStock: true,
    weight: '5 oz',
  },
  'rose-petal-luxury': {
    id: '3',
    name: 'Rose Petal Luxury',
    slug: 'rose-petal-luxury',
    price: 16.00,
    description: 'Feel like royalty with every wash. This luxurious bar is infused with real rose petals and rosehip oil, known for its skin-loving properties. The delicate floral scent transports you to a garden in bloom.',
    shortDescription: 'Premium rose petals and rosehip oil',
    category: 'Luxury',
    ingredients: 'Olive Oil, Rosehip Oil, Shea Butter, Rose Petals, Rose Essential Oil, Vitamin E',
    imageUrl: 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?w=800&h=800&fit=crop',
    images: ['https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?w=800&h=800&fit=crop'],
    inStock: true,
    weight: '4 oz',
  },
  'citrus-burst': {
    id: '4',
    name: 'Citrus Burst',
    slug: 'citrus-burst',
    price: 11.00,
    description: 'Wake up your senses with this energizing blend of orange, lemon, and grapefruit essential oils. The perfect morning soap to start your day refreshed and invigorated.',
    shortDescription: 'Energizing citrus blend',
    category: 'Energizing',
    ingredients: 'Olive Oil, Coconut Oil, Sweet Orange Oil, Lemon Zest, Grapefruit Essential Oil, Vitamin E',
    imageUrl: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800&h=400&fit=crop',
    images: ['https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800&h=800&fit=crop'],
    inStock: true,
    weight: '4 oz',
  },
  'coconut-milk-bliss': {
    id: '5',
    name: 'Coconut Milk Bliss',
    slug: 'coconut-milk-bliss',
    price: 13.00,
    description: 'Tropical hydration in a bar. Creamy coconut milk and a hint of vanilla create a luxuriously moisturizing experience that leaves your skin feeling silky smooth.',
    shortDescription: 'Creamy coconut milk and vanilla',
    category: 'Moisturizing',
    ingredients: 'Coconut Oil, Coconut Milk, Shea Butter, Vanilla Extract, Vitamin E',
    imageUrl: 'https://images.unsplash.com/photo-1584305574647-0cc949a2bb9f?w=800&h=800&fit=crop',
    images: ['https://images.unsplash.com/photo-1584305574647-0cc949a2bb9f?w=800&h=800&fit=crop'],
    inStock: true,
    weight: '4.5 oz',
  },
  'forest-pine-freshness': {
    id: '6',
    name: 'Forest Pine Freshness',
    slug: 'forest-pine-freshness',
    price: 12.00,
    description: 'Bring the outdoors in with this invigorating forest-inspired soap. Pine needles, cedarwood, and eucalyptus create a fresh, woodsy scent that clears the mind and refreshes the body.',
    shortDescription: 'Pine needles, cedarwood, eucalyptus',
    category: 'Fresh',
    ingredients: 'Olive Oil, Pine Needle Extract, Cedarwood Oil, Eucalyptus Oil, Shea Butter',
    imageUrl: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&h=800&fit=crop',
    images: ['https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&h=800&fit=crop'],
    inStock: true,
    weight: '4.5 oz',
  },
};

// ═══════════════════════════════════════════════════════════
// ROUTE DEFINITION
// ═══════════════════════════════════════════════════════════

export const Route = createFileRoute('/shop/$productSlug')({
  head: ({ params }) => {
    const sample = SAMPLE_PRODUCTS[params.productSlug];
    return {
      meta: [
        { title: sample ? `${sample.name} | Karen's Beautiful Soap` : "Product | Karen's Beautiful Soap" },
        { name: 'description', content: sample?.description || 'Beautiful handcrafted soap' },
      ],
    };
  },
  loader: async ({ params }) => {
    // Try to fetch from database first
    const data = await getProductWithReviews(params.productSlug);

    // Fall back to sample data if no product in DB
    if (!data.product) {
      const sample = SAMPLE_PRODUCTS[params.productSlug];
      if (!sample) {
        throw notFound();
      }
      return {
        product: {
          ...sample,
          images: [sample.imageUrl, ...(sample.images || [])].filter((v, i, a) => a.indexOf(v) === i),
        },
        reviews: [],
        stats: { averageRating: 0, totalReviews: 0 },
        isSampleData: true,
      };
    }

    return {
      product: {
        ...data.product,
        images: data.product.images || [data.product.imageUrl],
      },
      reviews: data.reviews,
      stats: data.stats,
      isSampleData: false,
    };
  },
  component: ProductDetailPage,
  notFoundComponent: ProductNotFound,
});

// ═══════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════

function ProductNotFound() {
  return (
    <div className="min-h-screen bg-[#FDFCFB] flex items-center justify-center p-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-[#1A1A1A] mb-4 font-display">Soap Not Found</h1>
        <p className="text-gray-600 mb-8">We couldn't find the soap you're looking for.</p>
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 bg-[#2D5A4A] text-white px-6 py-3 rounded-lg hover:bg-[#1A1A1A] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Shop
        </Link>
      </div>
    </div>
  );
}

function ProductDetailPage() {
  const { product, reviews, stats } = Route.useLoaderData();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const { addItem, itemCount } = useCart();

  const decreaseQuantity = () => setQuantity((q) => Math.max(1, q - 1));
  const increaseQuantity = () => setQuantity((q) => Math.min(10, q + 1));

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      image: product.imageUrl || product.images?.[0] || '',
    }, quantity);

    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  const images = product.images || [product.imageUrl].filter(Boolean);

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
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-[#D4A574] rounded-full text-xs font-bold flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
          <Link to="/" className="hover:text-[#2D5A4A]">Home</Link>
          <span>/</span>
          <Link to="/shop" className="hover:text-[#2D5A4A]">Shop</Link>
          <span>/</span>
          <span className="text-[#1A1A1A]">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image Gallery Carousel */}
          <ImageCarousel
            images={images}
            productName={product.name}
            selectedImage={selectedImage}
            onSelectImage={setSelectedImage}
          />

          {/* Product Info */}
          <div>
            <span className="inline-block px-3 py-1 bg-[#F5EBE0] text-[#D4A574] text-sm font-medium rounded-full mb-4">
              {product.category}
            </span>

            <h1 className="text-3xl md:text-4xl font-bold text-[#1A1A1A] mb-4 font-display">
              {product.name}
            </h1>

            <div className="flex items-center gap-4 mb-6">
              <p className="text-3xl font-bold text-[#2D5A4A]">${product.price.toFixed(2)}</p>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      'w-4 h-4',
                      i < Math.round(stats?.averageRating || 0)
                        ? 'fill-[#D4A574] text-[#D4A574]'
                        : 'text-gray-200'
                    )}
                  />
                ))}
                <span className="text-sm text-gray-500 ml-2">
                  ({stats?.totalReviews || 0} reviews)
                </span>
              </div>
            </div>

            <p className="text-gray-600 mb-6 leading-relaxed">
              {product.description}
            </p>

            {/* Weight */}
            {product.weight && (
              <p className="text-sm text-gray-500 mb-6">
                <span className="font-medium">Weight:</span> {product.weight} oz
              </p>
            )}

            {/* Quantity Selector */}
            <div className="flex items-center gap-4 mb-6">
              <span className="font-medium text-[#1A1A1A]">Quantity:</span>
              <div className="flex items-center gap-3 bg-[#F5EBE0] rounded-lg p-1">
                <button
                  onClick={decreaseQuantity}
                  className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-8 text-center font-medium">{quantity}</span>
                <button
                  onClick={increaseQuantity}
                  className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 mb-8">
              <button
                onClick={handleAddToCart}
                disabled={!product.inStock}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-4 rounded-lg font-medium transition-all',
                  !product.inStock
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : justAdded
                    ? 'bg-green-600 text-white'
                    : 'bg-[#2D5A4A] text-white hover:bg-[#1A1A1A]'
                )}
              >
                {justAdded ? (
                  <>
                    <Check className="w-5 h-5" />
                    Added to Cart!
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-5 h-5" />
                    {product.inStock ? 'Add to Cart' : 'Out of Stock'}
                  </>
                )}
              </button>
              <button
                onClick={() => setIsWishlisted(!isWishlisted)}
                className={cn(
                  'w-14 h-14 flex items-center justify-center rounded-lg border-2 transition-all',
                  isWishlisted
                    ? 'bg-red-50 border-red-200 text-red-500'
                    : 'border-[#F5EBE0] text-gray-400 hover:border-[#D4A574] hover:text-[#D4A574]'
                )}
              >
                <Heart className={cn('w-5 h-5', isWishlisted && 'fill-current')} />
              </button>
            </div>

            {/* Benefits */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-6 border-t border-b border-[#F5EBE0]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#F5EBE0] rounded-lg flex items-center justify-center">
                  <Truck className="w-5 h-5 text-[#2D5A4A]" />
                </div>
                <div>
                  <p className="font-medium text-sm text-[#1A1A1A]">Free Shipping</p>
                  <p className="text-xs text-gray-500">On orders over $60</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#F5EBE0] rounded-lg flex items-center justify-center">
                  <Leaf className="w-5 h-5 text-[#2D5A4A]" />
                </div>
                <div>
                  <p className="font-medium text-sm text-[#1A1A1A]">No Harsh Chemicals</p>
                  <p className="text-xs text-gray-500">Sulfate & paraben free</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#F5EBE0] rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-[#2D5A4A]" />
                </div>
                <div>
                  <p className="font-medium text-sm text-[#1A1A1A]">Sensitive Skin Safe</p>
                  <p className="text-xs text-gray-500">No mineral oil or alcohol</p>
                </div>
              </div>
            </div>

            {/* Ingredients */}
            {product.ingredients && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-[#1A1A1A] mb-3 font-display">Ingredients</h3>
                <p className="text-gray-600 text-sm">
                  {product.ingredients}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        <ReviewsSection productId={product.id} reviews={reviews} stats={stats} />

        {/* Back to Shop */}
        <div className="mt-12">
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 text-[#2D5A4A] font-medium hover:gap-3 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Continue Shopping
          </Link>
        </div>
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// IMAGE CAROUSEL
// 🖼️ Swipe through beautiful soap photos like a soap sommelier
// ═══════════════════════════════════════════════════════════

function ImageCarousel({
  images,
  productName,
  selectedImage,
  onSelectImage,
}: {
  images: string[];
  productName: string;
  selectedImage: number;
  onSelectImage: (index: number) => void;
}) {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Minimum swipe distance for navigation (in px)
  const minSwipeDistance = 50;

  const goToNext = () => {
    onSelectImage((selectedImage + 1) % images.length);
  };

  const goToPrev = () => {
    onSelectImage((selectedImage - 1 + images.length) % images.length);
  };

  // Touch handlers for swipe support
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      goToNext();
    } else if (isRightSwipe) {
      goToPrev();
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      goToPrev();
    } else if (e.key === 'ArrowRight') {
      goToNext();
    }
  };

  return (
    <div className="space-y-4">
      {/* Main Image with Navigation */}
      <div
        className="relative aspect-square rounded-2xl overflow-hidden bg-white shadow-md group"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="region"
        aria-label="Product image gallery"
      >
        {/* Image with transition */}
        <div className="relative w-full h-full">
          {images.map((img, index) => (
            <img
              key={img}
              src={img}
              alt={`${productName} - View ${index + 1}`}
              className={cn(
                'absolute inset-0 w-full h-full object-cover transition-opacity duration-300',
                index === selectedImage ? 'opacity-100' : 'opacity-0'
              )}
            />
          ))}
        </div>

        {/* Navigation Arrows - Only show if multiple images */}
        {images.length > 1 && (
          <>
            <button
              onClick={goToPrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-5 h-5 text-[#1A1A1A]" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
              aria-label="Next image"
            >
              <ChevronRight className="w-5 h-5 text-[#1A1A1A]" />
            </button>
          </>
        )}

        {/* Image Counter - Only show if multiple images */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white text-sm px-3 py-1 rounded-full">
            {selectedImage + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Thumbnail Strip - Only show if multiple images */}
      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-[#D4A574] scrollbar-track-[#F5EBE0]">
          {images.map((img, index) => (
            <button
              key={index}
              onClick={() => onSelectImage(index)}
              className={cn(
                'flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all',
                selectedImage === index
                  ? 'border-[#2D5A4A] ring-2 ring-[#2D5A4A]/20'
                  : 'border-transparent hover:border-[#D4A574] opacity-70 hover:opacity-100'
              )}
              aria-label={`View image ${index + 1}`}
              aria-current={selectedImage === index ? 'true' : 'false'}
            >
              <img
                src={img}
                alt={`${productName} thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Dot Indicators (mobile-friendly alternative) */}
      {images.length > 1 && images.length <= 6 && (
        <div className="flex justify-center gap-2 sm:hidden">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => onSelectImage(index)}
              className={cn(
                'w-2.5 h-2.5 rounded-full transition-all',
                selectedImage === index
                  ? 'bg-[#2D5A4A] w-6'
                  : 'bg-[#D4A574]/40 hover:bg-[#D4A574]'
              )}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// REVIEWS SECTION
// 🎭 Display approved reviews and allow customers to submit new ones
// ═══════════════════════════════════════════════════════════

function ReviewsSection({
  productId,
  reviews,
  stats,
}: {
  productId: string;
  reviews: Array<typeof productReviews.$inferSelect>;
  stats: { averageRating: number; totalReviews: number } | null;
}) {
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitResult(null);

    try {
      const result = await submitReview({
        productId,
        rating,
        title: title || undefined,
        body: body || undefined,
      });

      setSubmitResult(result);

      if (result.success) {
        // Reset form on success
        setRating(5);
        setTitle('');
        setBody('');
        setShowForm(false);
      }
    } catch (error) {
      setSubmitResult({ success: false, error: 'Something went wrong. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-16 pt-16 border-t border-[#F5EBE0]">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-[#1A1A1A] font-display flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-[#2D5A4A]" />
            Customer Reviews
          </h2>
          {stats && stats.totalReviews > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      'w-4 h-4',
                      i < Math.round(stats.averageRating)
                        ? 'fill-[#D4A574] text-[#D4A574]'
                        : 'text-gray-200'
                    )}
                  />
                ))}
              </div>
              <span className="text-gray-600">
                {stats.averageRating.toFixed(1)} out of 5 ({stats.totalReviews} reviews)
              </span>
            </div>
          )}
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-[#2D5A4A] text-white rounded-lg hover:bg-[#1A1A1A] transition-colors text-sm font-medium"
          >
            Write a Review
          </button>
        )}
      </div>

      {/* Success Message */}
      {submitResult?.success && (
        <div className="mb-8 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {submitResult.message}
        </div>
      )}

      {/* Review Form */}
      {showForm && (
        <div className="mb-8 bg-white rounded-xl border border-[#F5EBE0] p-6">
          <h3 className="text-lg font-semibold text-[#1A1A1A] mb-4">Write Your Review</h3>

          {submitResult?.error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {submitResult.error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Rating
              </label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRating(value)}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={cn(
                        'w-8 h-8 transition-colors',
                        value <= rating
                          ? 'fill-[#D4A574] text-[#D4A574]'
                          : 'text-gray-200 hover:text-[#D4A574]'
                      )}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label htmlFor="review-title" className="block text-sm font-medium text-gray-700 mb-2">
                Review Title (optional)
              </label>
              <input
                id="review-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Sum up your experience"
                className="w-full px-4 py-2 rounded-lg border border-[#F5EBE0] focus:outline-none focus:border-[#2D5A4A] focus:ring-2 focus:ring-[#2D5A4A]/10"
              />
            </div>

            {/* Body */}
            <div>
              <label htmlFor="review-body" className="block text-sm font-medium text-gray-700 mb-2">
                Your Review (optional)
              </label>
              <textarea
                id="review-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Tell others about your experience with this soap..."
                rows={4}
                className="w-full px-4 py-2 rounded-lg border border-[#F5EBE0] focus:outline-none focus:border-[#2D5A4A] focus:ring-2 focus:ring-[#2D5A4A]/10 resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className={cn(
                  'flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-colors',
                  isSubmitting
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-[#2D5A4A] text-white hover:bg-[#1A1A1A]'
                )}
              >
                <Send className="w-4 h-4" />
                {isSubmitting ? 'Submitting...' : 'Submit Review'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-2 border border-[#F5EBE0] rounded-lg text-gray-600 hover:bg-[#F5EBE0] transition-colors"
              >
                Cancel
              </button>
            </div>

            <p className="text-xs text-gray-500">
              Your review will be visible after approval by our team.
            </p>
          </form>
        </div>
      )}

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="text-center py-12 bg-[#F5EBE0]/30 rounded-xl">
          <MessageSquare className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 mb-4">No reviews yet. Be the first to share your experience!</p>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="text-[#2D5A4A] font-medium hover:underline"
            >
              Write a Review
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white rounded-xl border border-[#F5EBE0] p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#F5EBE0] rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-[#D4A574]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[#1A1A1A]">Customer</span>
                      {review.verified && (
                        <span className="text-xs text-green-600 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Verified Purchase
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      {review.createdAt
                        ? new Date(review.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })
                        : 'Unknown date'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
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
              </div>

              {/* Content */}
              {review.title && (
                <h4 className="font-medium text-[#1A1A1A] mb-2">{review.title}</h4>
              )}
              {review.body && (
                <p className="text-gray-600">{review.body}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
