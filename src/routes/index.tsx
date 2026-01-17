// 🏠 Landing Page - The front door to our soap wonderland
// "I'm learnding!" - Ralph, every visitor discovering our soaps

import { createFileRoute, Link } from '@tanstack/react-router';
import { ShoppingBag, Leaf, Heart, Sparkles, Star, ArrowRight } from 'lucide-react';

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      {
        title: "Karen's Beautiful Soap | Handcrafted Luxury Soaps",
      },
      {
        name: 'description',
        content: 'Discover artisanal handcrafted soaps made with love and natural ingredients. From soothing lavender to invigorating citrus, find your perfect bar.',
      },
      { property: 'og:title', content: "Karen's Beautiful Soap" },
      { property: 'og:description', content: 'Handcrafted luxury soaps made with natural ingredients' },
      { property: 'og:type', content: 'website' },
    ],
  }),
  component: LandingPage,
});

// ═══════════════════════════════════════════════════════════
// SAMPLE PRODUCTS (will be replaced with database data)
// ═══════════════════════════════════════════════════════════

const FEATURED_PRODUCTS = [
  {
    id: '1',
    name: 'Lavender Dreams',
    slug: 'lavender-dreams',
    price: 12.00,
    description: 'Drift off with the soothing scent of French lavender',
    category: 'Relaxation',
    image: 'https://images.unsplash.com/photo-1600857062241-98e5dba7f214?w=400&h=400&fit=crop',
  },
  {
    id: '2',
    name: 'Honey Oat Comfort',
    slug: 'honey-oat-comfort',
    price: 14.00,
    description: "Nature's gentlest exfoliation with raw honey and oats",
    category: 'Exfoliating',
    image: 'https://images.unsplash.com/photo-1607006344380-b6775a0824a7?w=400&h=400&fit=crop',
  },
  {
    id: '3',
    name: 'Rose Petal Luxury',
    slug: 'rose-petal-luxury',
    price: 16.00,
    description: 'Feel like royalty with every wash',
    category: 'Luxury',
    image: 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?w=400&h=400&fit=crop',
  },
  {
    id: '4',
    name: 'Citrus Burst',
    slug: 'citrus-burst',
    price: 11.00,
    description: 'Wake up your senses with zesty orange and lemon',
    category: 'Energizing',
    image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=400&fit=crop',
  },
];

const TESTIMONIALS = [
  {
    name: 'Sarah M.',
    text: "The Lavender Dreams soap has completely transformed my evening routine. I've never felt so relaxed!",
    rating: 5,
  },
  {
    name: 'Michael T.',
    text: "Finally found soaps that don't irritate my sensitive skin. Karen's soaps are a game changer.",
    rating: 5,
  },
  {
    name: 'Emily R.',
    text: 'Bought these as gifts and everyone loved them. The packaging is beautiful too!',
    rating: 5,
  },
];

// ═══════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════

function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <Navigation />

      {/* Hero Section */}
      <HeroSection />

      {/* Features */}
      <FeaturesSection />

      {/* Featured Products */}
      <FeaturedProductsSection />

      {/* Testimonials */}
      <TestimonialsSection />

      {/* Newsletter */}
      <NewsletterSection />

      {/* Footer */}
      <Footer />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════════════════════════

function Navigation() {
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#F5EBE0]">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <nav className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#2D5A4A] rounded-full flex items-center justify-center">
              <span className="text-xl">🧼</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#1A1A1A] font-display">Karen's Beautiful Soap</h1>
              <p className="text-xs text-gray-500">Handcrafted with love</p>
            </div>
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/shop" className="text-gray-600 hover:text-[#2D5A4A] transition-colors">
              Shop
            </Link>
            <a href="#about" className="text-gray-600 hover:text-[#2D5A4A] transition-colors">
              About
            </a>
            <a href="#contact" className="text-gray-600 hover:text-[#2D5A4A] transition-colors">
              Contact
            </a>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-gray-600 hover:text-[#2D5A4A] transition-colors hidden sm:block">
              Sign In
            </Link>
            <Link
              to="/cart"
              className="flex items-center gap-2 bg-[#2D5A4A] text-white px-4 py-2 rounded-lg hover:bg-[#1A1A1A] transition-colors"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">Cart</span>
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}

// ═══════════════════════════════════════════════════════════
// HERO SECTION
// ═══════════════════════════════════════════════════════════

function HeroSection() {
  return (
    <section className="relative py-20 md:py-32 px-6 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#F5EBE0] via-white to-[#F5EBE0] opacity-50" />
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%232D5A4A' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />

      <div className="relative max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="text-center lg:text-left">
            <span className="inline-block px-4 py-2 bg-[#2D5A4A]/10 text-[#2D5A4A] rounded-full text-sm font-medium mb-6">
              ✨ Handcrafted in Small Batches
            </span>
            <h1 className="text-4xl md:text-6xl font-bold text-[#1A1A1A] mb-6 font-display leading-tight">
              Gentle on Your Skin,{' '}
              <span className="text-[#2D5A4A]">Kind to the Earth</span>
            </h1>
            <p className="text-lg text-gray-600 mb-8 max-w-lg mx-auto lg:mx-0">
              Experience the luxury of artisanal soaps made with natural ingredients.
              Every bar is crafted with love for your skin and our planet.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link
                to="/shop"
                className="inline-flex items-center justify-center gap-2 bg-[#2D5A4A] text-white px-8 py-4 rounded-lg hover:bg-[#1A1A1A] transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
              >
                Shop Now
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#about"
                className="inline-flex items-center justify-center gap-2 border-2 border-[#D4A574] text-[#1A1A1A] px-8 py-4 rounded-lg hover:bg-[#D4A574] hover:text-white transition-all duration-200 font-medium"
              >
                Our Story
              </a>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative">
            <div className="aspect-square rounded-3xl overflow-hidden shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1600857062241-98e5dba7f214?w=800&h=800&fit=crop"
                alt="Artisanal handcrafted soaps arranged beautifully"
                className="w-full h-full object-cover"
              />
            </div>
            {/* Floating badge */}
            <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-xl p-4 flex items-center gap-3">
              <div className="w-12 h-12 bg-[#D4A574] rounded-full flex items-center justify-center">
                <Leaf className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-[#1A1A1A]">100% Natural</p>
                <p className="text-sm text-gray-500">No harsh chemicals</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
// FEATURES SECTION
// ═══════════════════════════════════════════════════════════

function FeaturesSection() {
  const features = [
    {
      icon: Leaf,
      title: 'All Natural Ingredients',
      description: 'We use only the finest organic oils, butters, and botanicals in every bar.',
    },
    {
      icon: Heart,
      title: 'Made with Love',
      description: 'Each soap is handcrafted in small batches to ensure the highest quality.',
    },
    {
      icon: Sparkles,
      title: 'Cruelty Free',
      description: 'Never tested on animals. Our soaps are as kind to creatures as they are to you.',
    },
  ];

  return (
    <section className="py-20 px-6 bg-white" id="about">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-[#1A1A1A] mb-4 font-display">
            Why Choose Our Soaps?
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            We believe skincare should be simple, effective, and sustainable.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="text-center p-8 rounded-2xl bg-[#FDFCFB] border border-[#F5EBE0] hover:shadow-lg transition-all duration-300"
            >
              <div className="w-16 h-16 bg-[#2D5A4A]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <feature.icon className="w-8 h-8 text-[#2D5A4A]" />
              </div>
              <h3 className="text-xl font-semibold text-[#1A1A1A] mb-3 font-display">
                {feature.title}
              </h3>
              <p className="text-gray-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
// FEATURED PRODUCTS SECTION
// ═══════════════════════════════════════════════════════════

function FeaturedProductsSection() {
  return (
    <section className="py-20 px-6 bg-[#FDFCFB]">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-[#1A1A1A] mb-4 font-display">
              Featured Soaps
            </h2>
            <p className="text-gray-600 max-w-lg">
              Our most loved creations, ready to transform your daily routine.
            </p>
          </div>
          <Link
            to="/shop"
            className="mt-4 md:mt-0 inline-flex items-center gap-2 text-[#2D5A4A] font-medium hover:gap-3 transition-all"
          >
            View All Products
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURED_PRODUCTS.map((product) => (
            <Link
              key={product.id}
              to="/shop/$productSlug"
              params={{ productSlug: product.slug }}
              className="group"
            >
              <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-[#F5EBE0]">
                <div className="aspect-square overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-4">
                  <span className="text-xs text-[#D4A574] font-medium uppercase tracking-wider">
                    {product.category}
                  </span>
                  <h3 className="text-lg font-semibold text-[#1A1A1A] mt-1 group-hover:text-[#2D5A4A] transition-colors font-display">
                    {product.name}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                    {product.description}
                  </p>
                  <p className="text-lg font-bold text-[#2D5A4A] mt-3">
                    ${product.price.toFixed(2)}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
// TESTIMONIALS SECTION
// ═══════════════════════════════════════════════════════════

function TestimonialsSection() {
  return (
    <section className="py-20 px-6 bg-[#2D5A4A]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 font-display">
            What Our Customers Say
          </h2>
          <p className="text-white/70 max-w-2xl mx-auto">
            Don't just take our word for it - hear from our happy customers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((testimonial, index) => (
            <div
              key={index}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
            >
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-[#D4A574] text-[#D4A574]" />
                ))}
              </div>
              <p className="text-white/90 mb-4">
                "{testimonial.text}"
              </p>
              <p className="text-white font-semibold">
                — {testimonial.name}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
// NEWSLETTER SECTION
// ═══════════════════════════════════════════════════════════

function NewsletterSection() {
  return (
    <section className="py-20 px-6 bg-[#F5EBE0]">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-[#1A1A1A] mb-4 font-display">
          Join the Soap Lovers Club
        </h2>
        <p className="text-gray-600 mb-8">
          Get exclusive offers, soap care tips, and be the first to know about new products.
        </p>
        <form className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
          <input
            type="email"
            placeholder="Enter your email"
            className="flex-1 px-6 py-4 rounded-lg border border-[#D4A574]/30 bg-white focus:outline-none focus:border-[#2D5A4A] focus:ring-2 focus:ring-[#2D5A4A]/10"
          />
          <button
            type="submit"
            className="bg-[#2D5A4A] text-white px-8 py-4 rounded-lg hover:bg-[#1A1A1A] transition-colors font-medium whitespace-nowrap"
          >
            Subscribe
          </button>
        </form>
        <p className="text-sm text-gray-500 mt-4">
          We respect your privacy. Unsubscribe anytime.
        </p>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
// FOOTER
// ═══════════════════════════════════════════════════════════

function Footer() {
  return (
    <footer className="bg-[#1A1A1A] text-white py-16 px-6" id="contact">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[#2D5A4A] rounded-full flex items-center justify-center">
                <span className="text-xl">🧼</span>
              </div>
              <h3 className="text-xl font-bold font-display">Karen's Beautiful Soap</h3>
            </div>
            <p className="text-gray-400 max-w-sm">
              Handcrafted luxury soaps made with natural ingredients and love.
              Gentle on your skin, kind to the Earth.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-gray-400">
              <li><Link to="/shop" className="hover:text-white transition-colors">Shop</Link></li>
              <li><a href="#about" className="hover:text-white transition-colors">About Us</a></li>
              <li><Link to="/account/orders" className="hover:text-white transition-colors">Track Order</Link></li>
              <li><Link to="/login" className="hover:text-white transition-colors">Sign In</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <ul className="space-y-2 text-gray-400">
              <li>hello@karenssoap.com</li>
              <li>Portland, Oregon</li>
              <li>Made with 💚 in the USA</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} Karen's Beautiful Soap. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
