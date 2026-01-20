// 🌿 About Page - The story behind EnrollSage
// Wise guidance for enrollment journeys - why we exist and what we believe

import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowRight, Users, Target, Heart, Zap, Menu, X } from 'lucide-react';
import { useState } from 'react';

export const Route = createFileRoute('/about')({
  head: () => ({
    meta: [
      { title: 'About Us | EnrollSage' },
      {
        name: 'description',
        content: 'EnrollSage was built by people who believe private schools deserve better software. Learn about our mission to bring wisdom and calm to school enrollment.',
      },
      { property: 'og:title', content: 'About Us | EnrollSage' },
      { property: 'og:description', content: 'Wise guidance for enrollment journeys, one school at a time.' },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="min-h-screen bg-[#F8F9F6]">
      <Navigation />
      <HeroSection />
      <MissionSection />
      <ValuesSection />
      <WhyWeBuiltThis />
      <CTASection />
      <Footer />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════════════════════════

function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-6 py-4">
        <nav className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#5B7F6D] rounded flex items-center justify-center">
              <span className="text-white text-lg">🌿</span>
            </div>
            <span className="text-xl font-display text-[#2D4F3E]">EnrollSage</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link to="/about" className="text-[#2D4F3E] font-medium">About</Link>
            <Link to="/contact" className="text-[#5F6368] hover:text-[#2D4F3E] transition-colors">Contact</Link>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link to="/login" className="text-[#5F6368] hover:text-[#2D4F3E] transition-colors">
              Sign In
            </Link>
            <Link
              to="/contact"
              className="bg-[#5B7F6D] text-white px-5 py-2 rounded-md hover:bg-[#4A6B5B] transition-colors font-medium"
            >
              Request Demo
            </Link>
          </div>

          <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </nav>

        {mobileMenuOpen && (
          <div className="md:hidden pt-4 pb-2 border-t border-gray-100 mt-4">
            <div className="flex flex-col gap-4">
              <Link to="/about" className="text-[#2D4F3E] font-medium">About</Link>
              <Link to="/contact" className="text-[#5F6368]">Contact</Link>
              <Link to="/login" className="text-[#5F6368]">Sign In</Link>
              <Link to="/contact" className="bg-[#5B7F6D] text-white px-5 py-2 rounded-md text-center font-medium">
                Request Demo
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
// ═══════════════════════════════════════════════════════════

function HeroSection() {
  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-4xl md:text-5xl font-display text-[#2D4F3E] mb-6 leading-tight">
          Schools deserve software that{' '}
          <span className="text-[#5B7F6D]">guides with wisdom</span>
        </h1>
        <p className="text-lg text-[#5F6368] leading-relaxed">
          We're building the enrollment platform we wished existed when we worked in schools.
          Calm, intuitive, and built specifically for how private schools actually operate.
        </p>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
// MISSION SECTION
// ═══════════════════════════════════════════════════════════

function MissionSection() {
  return (
    <section className="py-20 px-6 bg-[#F8F9F6]">
      <div className="max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-sm font-medium text-[#5B7F6D] mb-4">OUR MISSION</p>
            <h2 className="text-3xl md:text-4xl font-display text-[#2D4F3E] mb-6">
              From first inquiry to tuition paid—with wisdom, not chaos
            </h2>
            <p className="text-[#5F6368] text-lg mb-6">
              Private schools spend too much time fighting their software instead of
              serving families. We're here to change that.
            </p>
            <p className="text-[#5F6368]">
              EnrollSage brings admissions, enrollment, and billing into one calm system
              that school staff actually enjoy using—and parents love.
            </p>
          </div>

          <div className="bg-white p-8 rounded-lg border border-gray-200">
            <h3 className="font-display text-xl text-[#2D4F3E] mb-4">What we believe</h3>
            <ul className="space-y-4 text-[#5F6368]">
              <li className="flex gap-3">
                <span className="text-[#5B7F6D] font-bold">1.</span>
                The best software fades into the background and lets you focus on your work.
              </li>
              <li className="flex gap-3">
                <span className="text-[#5B7F6D] font-bold">2.</span>
                Schools shouldn't need an IT department to manage enrollment.
              </li>
              <li className="flex gap-3">
                <span className="text-[#5B7F6D] font-bold">3.</span>
                Parent experience is just as important as admin efficiency.
              </li>
              <li className="flex gap-3">
                <span className="text-[#5B7F6D] font-bold">4.</span>
                Implementation shouldn't take longer than a semester.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
// VALUES SECTION
// ═══════════════════════════════════════════════════════════

function ValuesSection() {
  const values = [
    {
      icon: Target,
      title: 'Admissions-first',
      description: 'We started with what matters most: filling seats and making a great first impression on families.',
    },
    {
      icon: Users,
      title: 'Household-centric',
      description: 'Families, not just students. Our data model reflects how schools actually think about enrollment.',
    },
    {
      icon: Heart,
      title: 'Parent-approved',
      description: 'If parents hate the software, adoption suffers. We design for delight, not just function.',
    },
    {
      icon: Zap,
      title: 'Fast to launch',
      description: 'Live in weeks, not semesters. No lengthy implementations or surprise consulting fees.',
    },
  ];

  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-display text-[#2D4F3E] mb-4">
            How we're different
          </h2>
          <p className="text-[#5F6368] max-w-2xl mx-auto">
            Built by people who understand the unique challenges of private school operations.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-8">
          {values.map((value, index) => (
            <div key={index} className="p-6 border border-gray-200 rounded-lg hover:border-[#8AA896] transition-colors">
              <div className="w-10 h-10 bg-[#F8F9F6] rounded-lg flex items-center justify-center mb-4">
                <value.icon className="w-5 h-5 text-[#5B7F6D]" />
              </div>
              <h3 className="text-lg font-display text-[#2D4F3E] mb-2">{value.title}</h3>
              <p className="text-[#5F6368]">{value.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
// WHY WE BUILT THIS
// ═══════════════════════════════════════════════════════════

function WhyWeBuiltThis() {
  return (
    <section className="py-20 px-6 bg-[#2D4F3E] text-white">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-display mb-8 text-center">
          Why we built EnrollSage
        </h2>

        <div className="prose prose-lg text-white/80 max-w-none">
          <p className="mb-6">
            We've been in the trenches. We've watched admissions teams drown in spreadsheets.
            We've seen business managers manually enter the same payment data into three different systems.
            We've heard parents complain—loudly—about portals that feel like they were designed in 2005.
          </p>

          <p className="mb-6">
            The school software market is dominated by legacy players who've been around for decades.
            They have deep feature sets, sure. But they've also accumulated decades of technical debt,
            confusing interfaces, and a general resistance to change.
          </p>

          <p className="mb-6">
            We started EnrollSage because we believed there had to be a wiser way. A system that's
            powerful enough for complex enrollment workflows, but intuitive enough that anyone can
            use it without a training manual.
          </p>

          <p className="text-white font-medium">
            We're not trying to replace your entire SIS on day one. We're focused on nailing the
            front door—admissions, enrollment, and payments—because that's where the biggest pain is,
            and where the biggest opportunity lies to create a great experience for families.
          </p>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
// CTA SECTION
// ═══════════════════════════════════════════════════════════

function CTASection() {
  return (
    <section className="py-20 px-6 bg-[#F8F9F6]">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-3xl font-display text-[#2D4F3E] mb-4">
          Ready to see it in action?
        </h2>
        <p className="text-[#5F6368] mb-8">
          Schedule a demo and we'll show you how EnrollSage can transform your enrollment process.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/contact"
            className="inline-flex items-center justify-center gap-2 bg-[#5B7F6D] text-white px-8 py-4 rounded-md hover:bg-[#4A6B5B] transition-colors font-medium"
          >
            Request a Demo
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/contact"
            className="inline-flex items-center justify-center gap-2 border border-[#2D4F3E] text-[#2D4F3E] px-8 py-4 rounded-md hover:bg-[#2D4F3E] hover:text-white transition-colors font-medium"
          >
            Contact Us
          </Link>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
// FOOTER
// ═══════════════════════════════════════════════════════════

function Footer() {
  return (
    <footer className="bg-[#2D4F3E] text-white py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
                <span className="text-lg">🌿</span>
              </div>
              <span className="text-lg font-display">EnrollSage</span>
            </div>
            <p className="text-white/60 text-sm">
              Wise guidance for enrollment journeys.
            </p>
          </div>

          <div>
            <h4 className="font-medium mb-4">Product</h4>
            <ul className="space-y-2 text-white/60 text-sm">
              <li><Link to="/about" className="hover:text-white transition-colors">Features</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">Pricing</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">Request Demo</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-4">Company</h4>
            <ul className="space-y-2 text-white/60 text-sm">
              <li><Link to="/about" className="hover:text-white transition-colors">About</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>

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
