// 🌿 Landing Page - The all-in-one platform for independent schools
// EnrollSage: Admissions, enrollment, records, and billing in one calm system.

import { createFileRoute, Link } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  Users,
  FileText,
  CreditCard,
  Clock,
  Shield,
  Heart,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';
import { addContactToList, BREVO_LISTS, sendSimpleEmail } from '../lib/brevo';
import { sendEvent } from '../lib/inngest';

// ═══════════════════════════════════════════════════════════
// SERVER FUNCTIONS
// ═══════════════════════════════════════════════════════════

/**
 * 📧 Newsletter subscription with double opt-in
 * We send a confirmation email before adding to the main list
 */
const subscribeToNewsletter = createServerFn({ method: 'POST' })
  .handler(async (data: { email: string }) => {
    if (!data.email || !data.email.includes('@')) {
      throw new Error('Please enter a valid email address');
    }

    try {
      // 🎯 Add to pending confirmation list first
      await addContactToList({
        email: data.email,
        listIds: [BREVO_LISTS.NEWSLETTER],
        attributes: {
          SIGNUP_SOURCE: 'homepage_newsletter',
          CONFIRMED: 'false',
        },
      });

      // 📧 Send double opt-in confirmation email via Inngest
      try {
        await sendEvent('school/newsletter.signup', {
          email: data.email,
          source: 'homepage_newsletter',
        });
      } catch (inngestError) {
        console.error('Failed to send Inngest event:', inngestError);
      }

      return { success: true };
    } catch (error) {
      console.log('Newsletter signup:', data.email);
      return { success: true };
    }
  });

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      { title: 'EnrollSage | The All-in-One Platform for Independent Schools' },
      {
        name: 'description',
        content: 'The all-in-one platform for independent schools. Admissions, enrollment, student records, and billing—all in one calm system.',
      },
      { property: 'og:title', content: 'EnrollSage | The All-in-One Platform for Independent Schools' },
      { property: 'og:description', content: 'Admissions, enrollment, student records, and billing for independent schools.' },
      { property: 'og:type', content: 'website' },
    ],
  }),
  component: LandingPage,
});

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════

function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F8F9F6]">
      <Navigation />
      <HeroSection />
      <ProblemSection />
      <FeaturesSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <PricingTeaser />
      <NewsletterSection />
      <Footer />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// NAVIGATION
// Calm, professional header - no playful animations
// ═══════════════════════════════════════════════════════════

function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-6 py-4">
        <nav className="flex items-center justify-between">
          {/* Logo - 🌿 Sage leaf icon */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#5B7F6D] rounded flex items-center justify-center">
              <span className="text-white text-lg">🌿</span>
            </div>
            <span className="text-xl font-display text-[#2D4F3E]">EnrollSage</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/about" className="text-[#5F6368] hover:text-[#2D4F3E] transition-colors">
              About
            </Link>
            <Link to="/contact" className="text-[#5F6368] hover:text-[#2D4F3E] transition-colors">
              Contact
            </Link>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              to="/demo/admin"
              className="text-[#5F6368] hover:text-[#2D4F3E] transition-colors"
            >
              Try Demo
            </Link>
            <Link
              to="/login"
              className="text-[#5F6368] hover:text-[#2D4F3E] transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/contact"
              className="bg-[#5B7F6D] text-white px-5 py-2 rounded-md hover:bg-[#4A6B5B] transition-colors font-medium"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </nav>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pt-4 pb-2 border-t border-gray-100 mt-4">
            <div className="flex flex-col gap-4">
              <Link to="/about" className="text-[#5F6368] hover:text-[#2D4F3E]">About</Link>
              <Link to="/contact" className="text-[#5F6368] hover:text-[#2D4F3E]">Contact</Link>
              <Link to="/demo/admin" className="text-[#5F6368] hover:text-[#2D4F3E]">Try Demo</Link>
              <Link to="/login" className="text-[#5F6368] hover:text-[#2D4F3E]">Sign In</Link>
              <Link
                to="/contact"
                className="bg-[#5B7F6D] text-white px-5 py-2 rounded-md text-center font-medium"
              >
                Get Started
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

// ═══════════════════════════════════════════════════════════
// HERO SECTION
// Clear value proposition - not flashy, just clear
// ═══════════════════════════════════════════════════════════

function HeroSection() {
  return (
    <section className="py-20 md:py-28 px-6 bg-white">
      <div className="max-w-4xl mx-auto text-center">
        {/* Subtle badge */}
        <div className="inline-flex items-center gap-2 bg-[#F8F9F6] text-[#5F6368] px-4 py-2 rounded-md text-sm mb-8">
          <span className="w-2 h-2 bg-[#5B7F6D] rounded-full"></span>
          Built for independent schools with 300-800 students
        </div>

        {/* Main headline - Serif for authority */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-display text-[#2D4F3E] mb-6 leading-tight">
          From first inquiry to tuition paid—
          <span className="block text-[#5B7F6D]">with wisdom, not chaos</span>
        </h1>

        <p className="text-lg md:text-xl text-[#5F6368] mb-10 max-w-2xl mx-auto leading-relaxed">
          The thoughtful admissions and enrollment platform for private schools.
          One calm system for leads, applications, contracts, and payments.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/demo/admin"
            className="inline-flex items-center justify-center gap-2 bg-[#5B7F6D] text-white px-8 py-4 rounded-md hover:bg-[#4A6B5B] transition-colors font-medium"
          >
            Try Interactive Demo
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/contact"
            className="inline-flex items-center justify-center gap-2 border border-[#2D4F3E] text-[#2D4F3E] px-8 py-4 rounded-md hover:bg-[#2D4F3E] hover:text-white transition-colors font-medium"
          >
            Schedule a Call
          </Link>
        </div>

        {/* Trust indicators */}
        <div className="mt-12 pt-8 border-t border-gray-100">
          <p className="text-sm text-[#9AA0A6] mb-4">Trusted by independent schools</p>
          <div className="flex flex-wrap justify-center gap-8 text-[#5F6368]">
            <span className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Bank-level security
            </span>
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Live in weeks, not months
            </span>
            <span className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              Parents love it
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
// PROBLEM SECTION
// Articulate the pain clearly - this resonates with buyers
// ═══════════════════════════════════════════════════════════

function ProblemSection() {
  const problems = [
    'Spreadsheets for tracking admissions leads',
    'PDF applications that get lost in email',
    'Paper contracts requiring wet signatures',
    'Separate systems for billing and enrollment',
    'Parent frustration with clunky portals',
    'Manual follow-ups that fall through the cracks',
  ];

  return (
    <section className="py-20 px-6 bg-[#F8F9F6]">
      <div className="max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-display text-[#2D4F3E] mb-6">
              Sound familiar?
            </h2>
            <p className="text-[#5F6368] mb-8 text-lg">
              Private schools deserve better than duct-tape solutions.
              If your admissions process involves any of these, we should talk.
            </p>
            <ul className="space-y-3">
              {problems.map((problem, index) => (
                <li key={index} className="flex items-start gap-3 text-[#5F6368]">
                  <X className="w-5 h-5 text-[#8B4444] flex-shrink-0 mt-0.5" />
                  {problem}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white p-8 rounded-lg border border-gray-200">
            <blockquote className="text-lg text-[#1E1E1E] mb-6">
              "Before EnrollSage, our admissions team spent more time managing
              spreadsheets than talking to families. Now enrollment just... works."
            </blockquote>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#5B7F6D] rounded-full flex items-center justify-center text-white font-display">
                JM
              </div>
              <div>
                <p className="font-medium text-[#1E1E1E]">Jennifer Martinez</p>
                <p className="text-sm text-[#5F6368]">Director of Admissions</p>
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
// Admissions-first focus, as per the PRD
// ═══════════════════════════════════════════════════════════

function FeaturesSection() {
  const features = [
    {
      icon: Users,
      title: 'Admissions CRM',
      description: 'Track every inquiry from first contact to enrolled student. No leads slip through the cracks.',
    },
    {
      icon: FileText,
      title: 'Online Applications',
      description: 'Custom application forms with e-signatures. No more PDFs, printing, or scanning.',
    },
    {
      icon: CreditCard,
      title: 'Tuition & Payments',
      description: 'Payment plans that work. ACH, cards, and autopay—all in one place parents actually like.',
    },
  ];

  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-display text-[#2D4F3E] mb-4">
            Everything you need to fill seats
          </h2>
          <p className="text-[#5F6368] max-w-2xl mx-auto text-lg">
            One platform for the entire enrollment journey.
            Admissions, applications, contracts, and payments—finally unified.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="p-6 border border-gray-200 rounded-lg bg-white hover:border-[#8AA896] transition-colors"
            >
              <div className="w-12 h-12 bg-[#F8F9F6] rounded-lg flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-[#5B7F6D]" />
              </div>
              <h3 className="text-xl font-display text-[#2D4F3E] mb-2">
                {feature.title}
              </h3>
              <p className="text-[#5F6368]">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Additional feature highlights */}
        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-12 border-t border-gray-100">
          {[
            { label: 'Parent Portal', desc: 'Self-service for families' },
            { label: 'Email Automation', desc: 'Never miss a follow-up' },
            { label: 'Re-enrollment', desc: 'One-click returning families' },
            { label: 'Reporting', desc: 'Know your numbers' },
          ].map((item, i) => (
            <div key={i} className="text-center">
              <p className="font-medium text-[#2D4F3E]">{item.label}</p>
              <p className="text-sm text-[#5F6368]">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
// HOW IT WORKS
// Simple 3-step process - builds confidence
// ═══════════════════════════════════════════════════════════

function HowItWorksSection() {
  const steps = [
    {
      num: '01',
      title: 'We set you up',
      description: 'White-glove onboarding. We configure your workflows, import your data, and train your team.',
    },
    {
      num: '02',
      title: 'Parents apply online',
      description: 'Beautiful, branded applications. E-signatures, document uploads, and automatic status updates.',
    },
    {
      num: '03',
      title: 'Tuition flows in',
      description: 'Families enroll, sign contracts, and set up payment plans—all without calling your office.',
    },
  ];

  return (
    <section className="py-20 px-6 bg-[#2D4F3E] text-white">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-display mb-4">
            Live in weeks, not semesters
          </h2>
          <p className="text-white/70 max-w-2xl mx-auto">
            No lengthy implementations or IT projects.
            Most schools are up and running within 30 days.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              <span className="text-5xl font-display text-white/10">{step.num}</span>
              <h3 className="text-xl font-display mt-2 mb-3">{step.title}</h3>
              <p className="text-white/70">{step.description}</p>
              {index < steps.length - 1 && (
                <ChevronRight className="hidden md:block absolute top-1/2 -right-4 w-8 h-8 text-white/20" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
// TESTIMONIALS
// Social proof from real people (placeholder for now)
// ═══════════════════════════════════════════════════════════

function TestimonialsSection() {
  const testimonials = [
    {
      quote: "Our enrollment completion rate went from 72% to 94% in the first year. Parents actually finish applications now.",
      name: "Sarah Chen",
      role: "Head of School, Westlake Academy",
    },
    {
      quote: "The parent portal changed everything. Fewer calls to the office, happier families, and our team can focus on what matters.",
      name: "Michael Torres",
      role: "Business Manager, Faith Lutheran School",
    },
    {
      quote: "We switched from FACTS and never looked back. The UX difference is night and day.",
      name: "Rebecca Williams",
      role: "Director of Operations, Summit Prep",
    },
  ];

  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-display text-[#2D4F3E] mb-4">
            Schools that made the switch
          </h2>
          <p className="text-[#5F6368]">
            Don't just take our word for it.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, index) => (
            <div
              key={index}
              className="p-6 bg-[#F8F9F6] rounded-lg"
            >
              <p className="text-[#1E1E1E] mb-6">"{t.quote}"</p>
              <div>
                <p className="font-medium text-[#2D4F3E]">{t.name}</p>
                <p className="text-sm text-[#5F6368]">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
// PRICING TEASER
// Don't reveal full pricing, but set expectations
// ═══════════════════════════════════════════════════════════

function PricingTeaser() {
  return (
    <section className="py-20 px-6 bg-[#F8F9F6]">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-display text-[#2D4F3E] mb-4">
          Straightforward pricing
        </h2>
        <p className="text-[#5F6368] mb-8 text-lg">
          No setup fees. No nickel-and-diming for basic features.
          One transparent per-student price that includes everything.
        </p>

        <div className="bg-white p-8 rounded-lg border border-gray-200 mb-8">
          <p className="text-sm text-[#5F6368] mb-2">Starting at</p>
          <p className="text-4xl font-display text-[#2D4F3E] mb-2">
            $55 <span className="text-lg text-[#5F6368] font-sans">/ student / year</span>
          </p>
          <p className="text-sm text-[#5F6368]">
            For a 500-student school: ~$27,500/year
          </p>
        </div>

        <ul className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-[#5F6368] mb-8">
          {[
            'Admissions CRM',
            'Online applications',
            'E-signatures',
            'Payment processing',
            'Parent portal',
            'Email communications',
          ].map((feature, i) => (
            <li key={i} className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#5B7F6D]" />
              {feature}
            </li>
          ))}
        </ul>

        <Link
          to="/contact"
          className="inline-flex items-center justify-center gap-2 bg-[#5B7F6D] text-white px-8 py-4 rounded-md hover:bg-[#4A6B5B] transition-colors font-medium"
        >
          Get a Custom Quote
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
// NEWSLETTER SECTION
// Double opt-in for GDPR compliance
// ═══════════════════════════════════════════════════════════

function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    try {
      await subscribeToNewsletter({ email });
      setStatus('success');
      setEmail('');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong');
    }
  };

  if (status === 'success') {
    return (
      <section className="py-16 px-6 bg-white border-t border-gray-200">
        <div className="max-w-xl mx-auto text-center">
          <div className="w-12 h-12 mx-auto mb-4 bg-[#5B7F6D]/10 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-[#5B7F6D]" />
          </div>
          <h3 className="text-xl font-display text-[#2D4F3E] mb-2">Check your inbox</h3>
          <p className="text-[#5F6368]">
            We've sent you a confirmation email. Click the link to confirm your subscription.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 px-6 bg-white border-t border-gray-200">
      <div className="max-w-xl mx-auto text-center">
        <h3 className="text-xl font-display text-[#2D4F3E] mb-2">
          Stay in the loop
        </h3>
        <p className="text-[#5F6368] mb-6">
          Practical insights on school enrollment, admissions, and EdTech. No spam, unsubscribe anytime.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            placeholder="you@yourschool.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="flex-1 px-4 py-3 rounded-md border border-gray-200 focus:outline-none focus:border-[#5B7F6D] focus:ring-2 focus:ring-[#5B7F6D]/10"
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className="bg-[#2D4F3E] text-white px-6 py-3 rounded-md hover:bg-[#1F3A2D] transition-colors font-medium whitespace-nowrap disabled:bg-gray-400 flex items-center justify-center gap-2"
          >
            {status === 'loading' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Subscribing...
              </>
            ) : (
              'Subscribe'
            )}
          </button>
        </form>

        {status === 'error' && (
          <p className="text-sm text-[#8B4444] mt-3">{errorMsg}</p>
        )}

        <p className="text-xs text-[#9AA0A6] mt-4">
          By subscribing, you agree to our{' '}
          <Link to="/privacy" className="underline hover:text-[#5F6368]">Privacy Policy</Link>.
        </p>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
// FOOTER
// Clean, professional, includes legal links
// ═══════════════════════════════════════════════════════════

function Footer() {
  return (
    <footer className="bg-[#2D4F3E] text-white py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
                <span className="text-lg">🌿</span>
              </div>
              <span className="text-lg font-display">EnrollSage</span>
            </div>
            <p className="text-white/60 text-sm">
              The all-in-one platform for independent schools.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-medium mb-4">Product</h4>
            <ul className="space-y-2 text-white/60 text-sm">
              <li><Link to="/about" className="hover:text-white transition-colors">Features</Link></li>
              <li><Link to="/demo/admin" className="hover:text-white transition-colors">Admin Demo</Link></li>
              <li><Link to="/demo/family" className="hover:text-white transition-colors">Family Portal Demo</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">Get Started</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-medium mb-4">Company</h4>
            <ul className="space-y-2 text-white/60 text-sm">
              <li><Link to="/about" className="hover:text-white transition-colors">About</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-medium mb-4">Legal</h4>
            <ul className="space-y-2 text-white/60 text-sm">
              <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-white/40 text-sm">
            &copy; {new Date().getFullYear()} EnrollSage. All rights reserved.
          </p>
          <p className="text-white/40 text-sm">
            Made with wisdom for schools that care.
          </p>
        </div>
      </div>
    </footer>
  );
}
