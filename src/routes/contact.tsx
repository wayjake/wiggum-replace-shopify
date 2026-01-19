// 📬 Contact Page - Where soap lovers reach out
// "I bent my wookiee!" - Ralph when the form validation fails

import { createFileRoute, Link } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { useState } from 'react';
import { Mail, Phone, MapPin, Clock, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '../utils';

// ═══════════════════════════════════════════════════════════
// SERVER FUNCTION
// ═══════════════════════════════════════════════════════════

const submitContactForm = createServerFn({ method: 'POST' })
  .handler(async (data: { name: string; email: string; message: string }) => {
    // Validate inputs
    if (!data.name || data.name.trim().length < 2) {
      throw new Error('Please enter your name');
    }
    if (!data.email || !data.email.includes('@')) {
      throw new Error('Please enter a valid email address');
    }
    if (!data.message || data.message.trim().length < 10) {
      throw new Error('Please enter a message (at least 10 characters)');
    }

    // 🎭 In a real app, this would send to Brevo or your email service
    // For now, we'll simulate success after a brief delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    console.log('Contact form submission:', {
      name: data.name,
      email: data.email,
      message: data.message,
      timestamp: new Date().toISOString(),
    });

    return { success: true };
  });

// ═══════════════════════════════════════════════════════════
// ROUTE
// ═══════════════════════════════════════════════════════════

export const Route = createFileRoute('/contact')({
  head: () => ({
    meta: [
      { title: "Contact Us | Karen's Beautiful Soap" },
      {
        name: 'description',
        content:
          "Get in touch with Karen's Beautiful Soap. Find us at the Studio City Farmers Market or reach out with questions about our handcrafted natural soaps.",
      },
      { property: 'og:title', content: "Contact Us | Karen's Beautiful Soap" },
      {
        property: 'og:description',
        content: 'Questions? We would love to hear from you!',
      },
    ],
  }),
  component: ContactPage,
});

// ═══════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════

function ContactPage() {
  return (
    <div className="min-h-screen bg-[#FDFCFB]">
      {/* Navigation */}
      <Navigation />

      {/* Hero */}
      <section className="relative py-16 px-6 bg-gradient-to-br from-[#F5EBE0] via-white to-[#F5EBE0]">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block px-4 py-2 bg-[#2D5A4A]/10 text-[#2D5A4A] rounded-full text-sm font-medium mb-6">
            📬 Get in Touch
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-[#1A1A1A] mb-4 font-display">
            We'd Love to{' '}
            <span className="text-[#2D5A4A]">Hear from You</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-xl mx-auto">
            Whether you have a question about our soaps, need a recommendation,
            or just want to say hello - we're here to help!
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div className="bg-white rounded-2xl shadow-sm border border-[#F5EBE0] p-8">
              <h2 className="text-2xl font-bold text-[#1A1A1A] mb-6 font-display">
                Send Us a Message
              </h2>
              <ContactForm />
            </div>

            {/* Contact Info */}
            <div className="space-y-8">
              {/* Info Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {CONTACT_INFO.map((item, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-xl border border-[#F5EBE0] p-6"
                  >
                    <div className="w-12 h-12 bg-[#2D5A4A]/10 rounded-xl flex items-center justify-center mb-4">
                      <item.icon className="w-6 h-6 text-[#2D5A4A]" />
                    </div>
                    <h3 className="font-semibold text-[#1A1A1A] mb-1">
                      {item.title}
                    </h3>
                    {item.link ? (
                      <a
                        href={item.link}
                        className="text-gray-600 hover:text-[#2D5A4A] transition-colors"
                      >
                        {item.value}
                      </a>
                    ) : (
                      <p className="text-gray-600">{item.value}</p>
                    )}
                    {item.note && (
                      <p className="text-sm text-gray-400 mt-1">{item.note}</p>
                    )}
                  </div>
                ))}
              </div>

              {/* Map / Location Visual */}
              <div className="bg-white rounded-2xl border border-[#F5EBE0] overflow-hidden">
                <div className="aspect-video bg-[#F5EBE0] relative">
                  {/* 🗺️ Placeholder for map - in production, embed Google Maps */}
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#2D5A4A]/5 to-[#D4A574]/5">
                    <div className="text-center">
                      <MapPin className="w-12 h-12 text-[#2D5A4A] mx-auto mb-2" />
                      <p className="font-semibold text-[#1A1A1A]">
                        Studio City Farmers Market
                      </p>
                      <p className="text-sm text-gray-500">
                        Ventura Pl, Studio City, CA
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="font-semibold text-[#1A1A1A] mb-2">
                    Visit Us in Person
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Come smell the soaps, chat with Karen, and get personalized
                    recommendations. We love meeting our customers face-to-face!
                  </p>
                </div>
              </div>

              {/* FAQ Teaser */}
              <div className="bg-[#2D5A4A] rounded-2xl p-6 text-white">
                <h3 className="font-semibold mb-2">Common Questions</h3>
                <ul className="space-y-2 text-white/80 text-sm">
                  <li>• Free shipping on orders over $60</li>
                  <li>• $7 flat rate shipping under $60</li>
                  <li>• Most orders ship within 2-3 business days</li>
                  <li>• 100% satisfaction guaranteed</li>
                </ul>
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
// CONTACT FORM
// ═══════════════════════════════════════════════════════════

function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>(
    'idle'
  );
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    try {
      await submitContactForm(formData);
      setStatus('success');
      setFormData({ name: '', email: '', message: '' });
    } catch (err) {
      setStatus('error');
      setErrorMessage(
        err instanceof Error ? err.message : 'Something went wrong'
      );
    }
  };

  if (status === 'success') {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-semibold text-[#1A1A1A] mb-2">
          Message Sent!
        </h3>
        <p className="text-gray-600 mb-6">
          Thank you for reaching out. We'll get back to you soon.
        </p>
        <button
          onClick={() => setStatus('idle')}
          className="text-[#2D5A4A] font-medium hover:underline"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {status === 'error' && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>{errorMessage}</p>
        </div>
      )}

      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-[#1A1A1A] mb-2"
        >
          Your Name
        </label>
        <input
          type="text"
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-4 py-3 rounded-lg border border-[#F5EBE0] bg-white focus:outline-none focus:border-[#2D5A4A] focus:ring-2 focus:ring-[#2D5A4A]/10 transition-colors"
          placeholder="Karen"
          required
        />
      </div>

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-[#1A1A1A] mb-2"
        >
          Email Address
        </label>
        <input
          type="email"
          id="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full px-4 py-3 rounded-lg border border-[#F5EBE0] bg-white focus:outline-none focus:border-[#2D5A4A] focus:ring-2 focus:ring-[#2D5A4A]/10 transition-colors"
          placeholder="karen@example.com"
          required
        />
      </div>

      <div>
        <label
          htmlFor="message"
          className="block text-sm font-medium text-[#1A1A1A] mb-2"
        >
          Message
        </label>
        <textarea
          id="message"
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          rows={5}
          className="w-full px-4 py-3 rounded-lg border border-[#F5EBE0] bg-white focus:outline-none focus:border-[#2D5A4A] focus:ring-2 focus:ring-[#2D5A4A]/10 transition-colors resize-none"
          placeholder="Tell us what's on your mind..."
          required
        />
      </div>

      <button
        type="submit"
        disabled={status === 'loading'}
        className={cn(
          'w-full flex items-center justify-center gap-2 px-6 py-4 rounded-lg font-medium transition-all',
          status === 'loading'
            ? 'bg-gray-300 cursor-not-allowed'
            : 'bg-[#2D5A4A] text-white hover:bg-[#1A1A1A]'
        )}
      >
        {status === 'loading' ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Sending...
          </>
        ) : (
          <>
            <Send className="w-5 h-5" />
            Send Message
          </>
        )}
      </button>
    </form>
  );
}

// ═══════════════════════════════════════════════════════════
// DATA
// ═══════════════════════════════════════════════════════════

const CONTACT_INFO = [
  {
    icon: Phone,
    title: 'Phone',
    value: '(310) 804-4824',
    link: 'tel:310-804-4824',
    note: 'Call or text',
  },
  {
    icon: Mail,
    title: 'Email',
    value: 'hello@karenssoap.com',
    link: 'mailto:hello@karenssoap.com',
    note: null,
  },
  {
    icon: MapPin,
    title: 'Location',
    value: 'Studio City Farmers Market',
    link: null,
    note: 'Ventura Pl, Studio City',
  },
  {
    icon: Clock,
    title: 'Market Hours',
    value: 'Sundays 8am - 2pm',
    link: null,
    note: 'Rain or shine!',
  },
];

// ═══════════════════════════════════════════════════════════
// NAVIGATION
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
              className="text-gray-600 hover:text-[#2D5A4A] transition-colors"
            >
              About
            </Link>
            <Link
              to="/contact"
              className="text-[#2D5A4A] font-medium transition-colors"
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
// FOOTER
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
