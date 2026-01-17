// 🧼 Product Detail Page - Where you fall in love with soap
// "That's where I'm a Viking!" - Ralph on finding the perfect soap

import { createFileRoute, Link, notFound } from '@tanstack/react-router';
import { useState } from 'react';
import { ArrowLeft, ShoppingBag, Plus, Minus, Truck, Leaf, Shield, Star, Heart } from 'lucide-react';
import { cn } from '../../utils';

// ═══════════════════════════════════════════════════════════
// SAMPLE PRODUCTS DATA (will be replaced with database data)
// ═══════════════════════════════════════════════════════════

const PRODUCTS: Record<string, {
  id: string;
  name: string;
  slug: string;
  price: number;
  description: string;
  shortDescription: string;
  category: string;
  ingredients: string;
  image: string;
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
    image: 'https://images.unsplash.com/photo-1600857062241-98e5dba7f214?w=800&h=800&fit=crop',
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
    image: 'https://images.unsplash.com/photo-1607006344380-b6775a0824a7?w=800&h=800&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1607006344380-b6775a0824a7?w=800&h=800&fit=crop',
    ],
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
    image: 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?w=800&h=800&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?w=800&h=800&fit=crop',
    ],
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
    image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800&h=800&fit=crop',
    ],
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
    image: 'https://images.unsplash.com/photo-1584305574647-0cc949a2bb9f?w=800&h=800&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1584305574647-0cc949a2bb9f?w=800&h=800&fit=crop',
    ],
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
    image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&h=800&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&h=800&fit=crop',
    ],
    inStock: true,
    weight: '4.5 oz',
  },
};

export const Route = createFileRoute('/shop/$productSlug')({
  head: ({ params }) => {
    const product = PRODUCTS[params.productSlug];
    if (!product) {
      return {
        meta: [{ title: "Product Not Found | Karen's Beautiful Soap" }],
      };
    }
    return {
      meta: [
        { title: `${product.name} | Karen's Beautiful Soap` },
        { name: 'description', content: product.description },
        { property: 'og:title', content: product.name },
        { property: 'og:description', content: product.shortDescription },
        { property: 'og:image', content: product.image },
        { property: 'og:type', content: 'product' },
      ],
    };
  },
  loader: ({ params }) => {
    const product = PRODUCTS[params.productSlug];
    if (!product) {
      throw notFound();
    }
    return product;
  },
  component: ProductDetailPage,
  notFoundComponent: ProductNotFound,
});

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
  const product = Route.useLoaderData();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const decreaseQuantity = () => setQuantity((q) => Math.max(1, q - 1));
  const increaseQuantity = () => setQuantity((q) => Math.min(10, q + 1));

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
              className="flex items-center gap-2 bg-[#2D5A4A] text-white px-4 py-2 rounded-lg hover:bg-[#1A1A1A] transition-colors"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">Cart</span>
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
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="aspect-square rounded-2xl overflow-hidden bg-white shadow-md">
              <img
                src={product.images[selectedImage]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            {product.images.length > 1 && (
              <div className="flex gap-4">
                {product.images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={cn(
                      'w-20 h-20 rounded-lg overflow-hidden border-2 transition-all',
                      selectedImage === index
                        ? 'border-[#2D5A4A]'
                        : 'border-transparent hover:border-[#D4A574]'
                    )}
                  >
                    <img src={img} alt={`${product.name} view ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

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
                  <Star key={i} className="w-4 h-4 fill-[#D4A574] text-[#D4A574]" />
                ))}
                <span className="text-sm text-gray-500 ml-2">(24 reviews)</span>
              </div>
            </div>

            <p className="text-gray-600 mb-6 leading-relaxed">
              {product.description}
            </p>

            {/* Weight */}
            <p className="text-sm text-gray-500 mb-6">
              <span className="font-medium">Weight:</span> {product.weight}
            </p>

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
                disabled={!product.inStock}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-4 rounded-lg font-medium transition-all',
                  product.inStock
                    ? 'bg-[#2D5A4A] text-white hover:bg-[#1A1A1A]'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                )}
              >
                <ShoppingBag className="w-5 h-5" />
                {product.inStock ? 'Add to Cart' : 'Out of Stock'}
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
                  <p className="text-xs text-gray-500">On orders over $35</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#F5EBE0] rounded-lg flex items-center justify-center">
                  <Leaf className="w-5 h-5 text-[#2D5A4A]" />
                </div>
                <div>
                  <p className="font-medium text-sm text-[#1A1A1A]">100% Natural</p>
                  <p className="text-xs text-gray-500">No harsh chemicals</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#F5EBE0] rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-[#2D5A4A]" />
                </div>
                <div>
                  <p className="font-medium text-sm text-[#1A1A1A]">Cruelty Free</p>
                  <p className="text-xs text-gray-500">Never tested on animals</p>
                </div>
              </div>
            </div>

            {/* Ingredients */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-[#1A1A1A] mb-3 font-display">Ingredients</h3>
              <p className="text-gray-600 text-sm">
                {product.ingredients}
              </p>
            </div>
          </div>
        </div>

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
