// 📖 About Page - Our soapy origin story
// "Me fail English? That's unpossible!" - Ralph on our brand narrative

import { createFileRoute, Link } from '@tanstack/react-router';
import { Leaf, Heart, Sparkles, Users, Award, ArrowRight } from 'lucide-react';

export const Route = createFileRoute('/about')({
  head: () => ({
    meta: [
      { title: "Our Story | Karen's Beautiful Soap" },
      {
        name: 'description',
        content:
          "Discover the story behind Karen's Beautiful Soap - handcrafted luxury soaps made with natural ingredients, born from a personal journey to find gentle skincare for sensitive skin.",
      },
      { property: 'og:title', content: "Our Story | Karen's Beautiful Soap" },
      {
        property: 'og:description',
        content: 'Learn about our commitment to natural, cruelty-free skincare',
      },
    ],
  }),
  component: AboutPage,
});

// ═══════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════

function AboutPage() {
  return (
    <div className="min-h-screen bg-[#FDFCFB]">
      {/* Navigation */}
      <Navigation />

      {/* Hero Section */}
      <section className="relative py-20 px-6 bg-gradient-to-br from-[#F5EBE0] via-white to-[#F5EBE0]">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block px-4 py-2 bg-[#2D5A4A]/10 text-[#2D5A4A] rounded-full text-sm font-medium mb-6">
            ✨ Our Story
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-[#1A1A1A] mb-6 font-display">
            Born from Necessity,{' '}
            <span className="text-[#2D5A4A]">Crafted with Love</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            When commercial soaps proved too harsh for sensitive skin, Karen
            turned to nature. What started as a personal quest for gentle
            skincare became a passion for handcrafting beautiful, natural soaps.
          </p>
        </div>
      </section>

      {/* Origin Story */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-[#1A1A1A] mb-6 font-display">
                The Journey Begins
              </h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  It all started with frustration. After years of dealing with
                  dry, irritated skin from commercial soaps loaded with sulfates,
                  parabens, and synthetic fragrances, Karen decided to take
                  matters into her own hands.
                </p>
                <p>
                  Armed with research and a passion for natural ingredients, she
                  began experimenting in her kitchen. Batch after batch, she
                  refined her recipes until she created soaps that were not only
                  gentle enough for her sensitive skin but also luxuriously
                  nourishing.
                </p>
                <p>
                  Friends and family were the first to notice the difference.
                  Word spread, and soon Karen found herself at the Studio City
                  Farmers Market every Sunday, connecting with customers who
                  shared her frustration with commercial products.
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1607006344380-b6775a0824a7?w=800&h=800&fit=crop"
                  alt="Handcrafted soap making process"
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Floating element */}
              <div className="absolute -bottom-6 -right-6 bg-white rounded-2xl shadow-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#D4A574] rounded-full flex items-center justify-center">
                    <Heart className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#1A1A1A]">Made with Love</p>
                    <p className="text-sm text-gray-500">Every single bar</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Our Soaps - Features Section */}
      <section className="py-20 px-6 bg-white">
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
            {FEATURES.map((feature, index) => (
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
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 px-6 bg-[#2D5A4A]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 font-display">
              Our Commitment
            </h2>
            <p className="text-white/70 max-w-2xl mx-auto">
              Every bar we make reflects our core values and dedication to quality.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUES.map((value, index) => (
              <div
                key={index}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 text-center"
              >
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <value.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {value.title}
                </h3>
                <p className="text-white/70 text-sm">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Farmers Market Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=800&h=600&fit=crop"
                  alt="Farmers market setting"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <span className="inline-block px-4 py-2 bg-[#D4A574]/20 text-[#D4A574] rounded-full text-sm font-medium mb-6">
                📍 Find Us
              </span>
              <h2 className="text-3xl font-bold text-[#1A1A1A] mb-6 font-display">
                Studio City Farmers Market
              </h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  Every Sunday, rain or shine, you'll find us at the Studio City
                  Farmers Market. It's where our journey began, and it remains
                  the heart of our business.
                </p>
                <p>
                  Stop by to smell the soaps, chat about ingredients, and get
                  personalized recommendations. There's nothing quite like
                  meeting our customers face-to-face and hearing how our soaps
                  have made a difference in their skincare routine.
                </p>
              </div>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link
                  to="/shop"
                  className="inline-flex items-center justify-center gap-2 bg-[#2D5A4A] text-white px-6 py-3 rounded-lg hover:bg-[#1A1A1A] transition-colors font-medium"
                >
                  Shop Online
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/contact"
                  className="inline-flex items-center justify-center gap-2 border-2 border-[#D4A574] text-[#1A1A1A] px-6 py-3 rounded-lg hover:bg-[#D4A574] hover:text-white transition-colors font-medium"
                >
                  Get in Touch
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// DATA
// ═══════════════════════════════════════════════════════════

const FEATURES = [
  {
    icon: Leaf,
    title: 'No Harsh Chemicals',
    description:
      'Free of sulfates, mineral oil, alcohol, and parabens. Only the highest quality natural ingredients.',
  },
  {
    icon: Heart,
    title: 'Made for Sensitive Skin',
    description:
      'Born from personal necessity - created when commercial soaps proved too harsh for sensitive skin.',
  },
  {
    icon: Sparkles,
    title: 'Farmers Market Tested',
    description:
      'Perfected through direct customer feedback at local farmers markets. Real people, real results.',
  },
];

const VALUES = [
  {
    icon: Leaf,
    title: 'Natural Ingredients',
    description: 'We source only the finest natural ingredients for every bar.',
  },
  {
    icon: Heart,
    title: 'Cruelty-Free',
    description: 'Never tested on animals. Always made with compassion.',
  },
  {
    icon: Users,
    title: 'Community First',
    description: 'Built through farmers market feedback and customer love.',
  },
  {
    icon: Award,
    title: 'Quality Guaranteed',
    description: "If you're not happy, we'll make it right. Always.",
  },
];

// ═══════════════════════════════════════════════════════════
// NAVIGATION (shared with home page)
// ═══════════════════════════════════════════════════════════

function Navigation() {
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#F5EBE0]">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <nav className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#2D5A4A] rounded-full flex items-center justify-center">
              <span className="text-xl">🧼</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#1A1A1A] font-display">
                Karen's Beautiful Soap
              </h1>
              <p className="text-xs text-gray-500">Handcrafted with love</p>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link
              to="/shop"
              className="text-gray-600 hover:text-[#2D5A4A] transition-colors"
            >
              Shop
            </Link>
            <Link
              to="/about"
              className="text-[#2D5A4A] font-medium transition-colors"
            >
              About
            </Link>
            <Link
              to="/contact"
              className="text-gray-600 hover:text-[#2D5A4A] transition-colors"
            >
              Contact
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="text-gray-600 hover:text-[#2D5A4A] transition-colors hidden sm:block"
            >
              Sign In
            </Link>
            <Link
              to="/cart"
              className="flex items-center gap-2 bg-[#2D5A4A] text-white px-4 py-2 rounded-lg hover:bg-[#1A1A1A] transition-colors"
            >
              <span className="hidden sm:inline">Cart</span>
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}

// ═══════════════════════════════════════════════════════════
// FOOTER (shared with home page)
// ═══════════════════════════════════════════════════════════

function Footer() {
  return (
    <footer className="bg-[#1A1A1A] text-white py-16 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[#2D5A4A] rounded-full flex items-center justify-center">
                <span className="text-xl">🧼</span>
              </div>
              <h3 className="text-xl font-bold font-display">
                Karen's Beautiful Soap
              </h3>
            </div>
            <p className="text-gray-400 max-w-sm">
              Handcrafted luxury soaps made with natural ingredients and love.
              Gentle on your skin, kind to the Earth.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-gray-400">
              <li>
                <Link to="/shop" className="hover:text-white transition-colors">
                  Shop
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  to="/account/orders"
                  className="hover:text-white transition-colors"
                >
                  Track Order
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-white transition-colors">
                  Sign In
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <ul className="space-y-2 text-gray-400">
              <li>
                <a
                  href="tel:310-804-4824"
                  className="hover:text-white transition-colors"
                >
                  (310) 804-4824
                </a>
              </li>
              <li>Studio City Farmers Market</li>
              <li>Open Sundays</li>
              <li className="pt-2 text-sm">Free shipping over $60</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-500 text-sm">
          <p>
            &copy; {new Date().getFullYear()} Karen's Beautiful Soap. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
