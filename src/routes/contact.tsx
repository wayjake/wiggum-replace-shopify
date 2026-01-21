// 🌿 Contact Page - Get in touch with EnrollSage
// Contact form sends to jake@dubsado.com + newsletter signup with double opt-in

import { createFileRoute, Link } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { useState } from 'react';
import { Mail, CheckCircle2, AlertCircle, Loader2, Menu, X } from 'lucide-react';
import { sendSimpleEmail, addContactToList, BREVO_LISTS } from '../lib/brevo';
import { sendEvent } from '../lib/inngest';
import { cn } from '../utils';

// ═══════════════════════════════════════════════════════════
// SERVER FUNCTIONS
// ═══════════════════════════════════════════════════════════

/**
 * 📧 Contact form submission
 * Sends email to jake@dubsado.com with the inquiry details
 */
const submitContactForm = createServerFn({ method: 'POST' })
  .handler(async (input: { data: {
    name: string;
    email: string;
    schoolName: string;
    studentCount: string;
    message: string;
    subscribeNewsletter: boolean;
  } }) => {
    const { name, email, schoolName, studentCount, message, subscribeNewsletter } = input.data;

    // Validate inputs
    if (!name || name.trim().length < 2) {
      throw new Error('Please enter your name');
    }
    if (!email || !email.includes('@')) {
      throw new Error('Please enter a valid email address');
    }
    if (!message || message.trim().length < 10) {
      throw new Error('Please enter a message (at least 10 characters)');
    }

    try {
      // 📧 Send contact form email to jake@dubsado.com
      await sendSimpleEmail({
        to: { email: 'jake@dubsado.com', name: 'Jake' },
        subject: `[EnrollSage] New inquiry from ${name} at ${schoolName || 'Unknown School'}`,
        htmlContent: `
          <h2>New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>School:</strong> ${schoolName || 'Not provided'}</p>
          <p><strong>Student Count:</strong> ${studentCount || 'Not provided'}</p>
          <p><strong>Newsletter Signup:</strong> ${subscribeNewsletter ? 'Yes' : 'No'}</p>
          <hr />
          <p><strong>Message:</strong></p>
          <p>${message.replace(/\n/g, '<br>')}</p>
        `,
        textContent: `
New Contact Form Submission

Name: ${name}
Email: ${email}
School: ${schoolName || 'Not provided'}
Student Count: ${studentCount || 'Not provided'}
Newsletter Signup: ${subscribeNewsletter ? 'Yes' : 'No'}

Message:
${message}
        `,
      });

      // 📋 If they opted in to newsletter, add to pending list with double opt-in
      if (subscribeNewsletter) {
        await addContactToList({
          email: email,
          listIds: [BREVO_LISTS.NEWSLETTER],
          attributes: {
            FIRSTNAME: name.split(' ')[0],
            SIGNUP_SOURCE: 'contact_form',
            SCHOOL_NAME: schoolName || '',
            CONFIRMED: 'false',
          },
        });

        // Trigger double opt-in email via Inngest
        try {
          await sendEvent('school/newsletter.signup', {
            email: email,
            source: 'contact_form',
            name: name,
          });
        } catch (inngestError) {
          console.error('Failed to send newsletter confirmation:', inngestError);
        }
      }

      console.log('Contact form submitted:', {
        name: name,
        email: email,
        schoolName: schoolName,
        timestamp: new Date().toISOString(),
      });

      return { success: true };
    } catch (error) {
      console.error('Contact form error:', error);
      throw new Error('Failed to send message. Please try again.');
    }
  });

export const Route = createFileRoute('/contact')({
  head: () => ({
    meta: [
      { title: 'Contact Us | EnrollSage' },
      {
        name: 'description',
        content: 'Get in touch with EnrollSage. Schedule a demo, ask questions, or learn how we can bring wise guidance to your school enrollment process.',
      },
      { property: 'og:title', content: 'Contact Us | EnrollSage' },
      { property: 'og:description', content: 'Schedule a demo or get answers to your questions.' },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <div className="min-h-screen bg-[#F8F9F6]">
      <Navigation />
      <HeroSection />
      <ContactSection />
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
            <Link to="/about" className="text-[#5F6368] hover:text-[#2D4F3E] transition-colors">About</Link>
            <Link to="/contact" className="text-[#2D4F3E] font-medium">Contact</Link>
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
              <Link to="/about" className="text-[#5F6368]">About</Link>
              <Link to="/contact" className="text-[#2D4F3E] font-medium">Contact</Link>
              <Link to="/login" className="text-[#5F6368]">Sign In</Link>
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
    <section className="py-16 px-6 bg-white">
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-4xl md:text-5xl font-display text-[#2D4F3E] mb-6">
          Let's talk about your school
        </h1>
        <p className="text-lg text-[#5F6368]">
          Whether you're ready for a demo or just have questions, we're here to help.
          No pressure, no sales pitch—just a wise conversation about what you need.
        </p>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
// CONTACT SECTION
// ═══════════════════════════════════════════════════════════

function ContactSection() {
  return (
    <section className="py-16 px-6 bg-[#F8F9F6]">
      <div className="max-w-5xl mx-auto">
        <div className="grid md:grid-cols-5 gap-12">
          {/* Form - takes 3 columns */}
          <div className="md:col-span-3">
            <div className="bg-white p-8 rounded-lg border border-gray-200">
              <h2 className="text-2xl font-display text-[#2D4F3E] mb-6">
                Send us a message
              </h2>
              <ContactForm />
            </div>
          </div>

          {/* Sidebar - takes 2 columns */}
          <div className="md:col-span-2 space-y-8">
            {/* What to expect */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="font-display text-lg text-[#2D4F3E] mb-4">What happens next?</h3>
              <ul className="space-y-3 text-[#5F6368] text-sm">
                <li className="flex gap-3">
                  <span className="text-[#5B7F6D] font-bold">1.</span>
                  We'll respond within 24 hours (usually faster)
                </li>
                <li className="flex gap-3">
                  <span className="text-[#5B7F6D] font-bold">2.</span>
                  Schedule a 30-minute discovery call
                </li>
                <li className="flex gap-3">
                  <span className="text-[#5B7F6D] font-bold">3.</span>
                  See EnrollSage in action with a personalized demo
                </li>
              </ul>
            </div>

            {/* Direct contact */}
            <div className="bg-[#2D4F3E] p-6 rounded-lg text-white">
              <h3 className="font-display text-lg mb-4">Prefer email?</h3>
              <p className="text-white/70 text-sm mb-4">
                Reach out directly and we'll get back to you.
              </p>
              <a
                href="mailto:jake@dubsado.com"
                className="inline-flex items-center gap-2 text-white hover:underline"
              >
                <Mail className="w-4 h-4" />
                jake@dubsado.com
              </a>
            </div>

            {/* FAQ teaser */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="font-display text-lg text-[#2D4F3E] mb-4">Common questions</h3>
              <ul className="space-y-3 text-[#5F6368] text-sm">
                <li>
                  <strong className="text-[#1E1E1E]">How long does setup take?</strong>
                  <p>Most schools are live within 30 days.</p>
                </li>
                <li>
                  <strong className="text-[#1E1E1E]">What's the pricing?</strong>
                  <p>Starting at $55/student/year. No setup fees.</p>
                </li>
                <li>
                  <strong className="text-[#1E1E1E]">Can we migrate from FACTS?</strong>
                  <p>Yes! We help with data migration.</p>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
// CONTACT FORM
// ═══════════════════════════════════════════════════════════

function ContactForm() {
  // 🌿 Using refs + FormData to capture browser autofill values
  // (onChange doesn't fire for autofilled inputs, so we read directly on submit)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [subscribedToNewsletter, setSubscribedToNewsletter] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    // Read values directly from form to capture autofill
    const form = e.currentTarget;
    const formData = {
      name: (form.elements.namedItem('name') as HTMLInputElement).value,
      email: (form.elements.namedItem('email') as HTMLInputElement).value,
      schoolName: (form.elements.namedItem('schoolName') as HTMLInputElement).value,
      studentCount: (form.elements.namedItem('studentCount') as HTMLSelectElement).value,
      message: (form.elements.namedItem('message') as HTMLTextAreaElement).value,
      subscribeNewsletter: (form.elements.namedItem('subscribeNewsletter') as HTMLInputElement).checked,
    };

    try {
      await submitContactForm({ data: formData });
      setSubscribedToNewsletter(formData.subscribeNewsletter);
      setStatus('success');
      form.reset();
    } catch (err) {
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'Something went wrong');
    }
  };

  if (status === 'success') {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-[#5B7F6D]/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-[#5B7F6D]" />
        </div>
        <h3 className="text-xl font-display text-[#2D4F3E] mb-2">Message sent!</h3>
        <p className="text-[#5F6368] mb-6">
          Thanks for reaching out. We'll get back to you within 24 hours.
        </p>
        {subscribedToNewsletter && (
          <p className="text-sm text-[#5F6368] mb-6">
            Check your inbox to confirm your newsletter subscription.
          </p>
        )}
        <button
          onClick={() => setStatus('idle')}
          className="text-[#5B7F6D] font-medium hover:underline"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {status === 'error' && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-[#8B4444]/20 rounded-md text-[#8B4444]">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>{errorMessage}</p>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-[#1E1E1E] mb-2">
            Your name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            className="w-full px-4 py-3 rounded-md border border-gray-200 focus:outline-none focus:border-[#5B7F6D] focus:ring-2 focus:ring-[#5B7F6D]/10"
            placeholder="Jane Smith"
            autoComplete="name"
            required
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-[#1E1E1E] mb-2">
            Email address *
          </label>
          <input
            type="email"
            id="email"
            name="email"
            className="w-full px-4 py-3 rounded-md border border-gray-200 focus:outline-none focus:border-[#5B7F6D] focus:ring-2 focus:ring-[#5B7F6D]/10"
            placeholder="jane@yourschool.edu"
            autoComplete="email"
            required
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="schoolName" className="block text-sm font-medium text-[#1E1E1E] mb-2">
            School name
          </label>
          <input
            type="text"
            id="schoolName"
            name="schoolName"
            className="w-full px-4 py-3 rounded-md border border-gray-200 focus:outline-none focus:border-[#5B7F6D] focus:ring-2 focus:ring-[#5B7F6D]/10"
            placeholder="Westlake Academy"
            autoComplete="organization"
          />
        </div>

        <div>
          <label htmlFor="studentCount" className="block text-sm font-medium text-[#1E1E1E] mb-2">
            Number of students
          </label>
          <select
            id="studentCount"
            name="studentCount"
            defaultValue=""
            className="w-full px-4 py-3 rounded-md border border-gray-200 focus:outline-none focus:border-[#5B7F6D] focus:ring-2 focus:ring-[#5B7F6D]/10 bg-white"
          >
            <option value="">Select...</option>
            <option value="under-200">Under 200</option>
            <option value="200-400">200-400</option>
            <option value="400-600">400-600</option>
            <option value="600-800">600-800</option>
            <option value="800+">800+</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium text-[#1E1E1E] mb-2">
          How can we help? *
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          className="w-full px-4 py-3 rounded-md border border-gray-200 focus:outline-none focus:border-[#5B7F6D] focus:ring-2 focus:ring-[#5B7F6D]/10 resize-none"
          placeholder="Tell us about your school and what you're looking for..."
          required
        />
      </div>

      {/* Newsletter opt-in */}
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          id="subscribeNewsletter"
          name="subscribeNewsletter"
          className="mt-1 w-4 h-4 text-[#5B7F6D] border-gray-300 rounded focus:ring-[#5B7F6D]"
        />
        <label htmlFor="subscribeNewsletter" className="text-sm text-[#5F6368]">
          Subscribe to our newsletter for practical insights on school enrollment and EdTech.
          (We'll send a confirmation email first.)
        </label>
      </div>

      <button
        type="submit"
        disabled={status === 'loading'}
        className={cn(
          'w-full flex items-center justify-center gap-2 px-6 py-4 rounded-md font-medium transition-colors',
          status === 'loading'
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-[#5B7F6D] text-white hover:bg-[#4A6B5B]'
        )}
      >
        {status === 'loading' ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Sending...
          </>
        ) : (
          'Send Message'
        )}
      </button>

      <p className="text-xs text-[#9AA0A6] text-center">
        By submitting, you agree to our{' '}
        <Link to="/privacy" className="underline hover:text-[#5F6368]">Privacy Policy</Link>.
      </p>
    </form>
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
