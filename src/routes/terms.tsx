// 📜 Terms of Service - The legal foundation
// Professional, clear language that schools can trust

import { createFileRoute, Link } from '@tanstack/react-router';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

export const Route = createFileRoute('/terms')({
  head: () => ({
    meta: [
      { title: 'Terms of Service | Enrollsy' },
      {
        name: 'description',
        content: 'Read the Terms of Service for Enrollsy, the modern enrollment platform for private schools.',
      },
      { property: 'og:title', content: 'Terms of Service | Enrollsy' },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="min-h-screen bg-[#F7F5F2]">
      <Navigation />
      <main className="py-16 px-6">
        <article className="max-w-3xl mx-auto">
          <header className="mb-12">
            <h1 className="text-4xl font-display text-[#1F2A44] mb-4">Terms of Service</h1>
            <p className="text-[#5F6368]">Last updated: January 2026</p>
          </header>

          <div className="prose prose-lg max-w-none">
            <Section title="1. Agreement to Terms">
              <p>
                By accessing or using Enrollsy ("Service"), you agree to be bound by these
                Terms of Service ("Terms"). If you disagree with any part of these terms,
                you may not access the Service.
              </p>
              <p>
                These Terms apply to all visitors, users, and others who access or use the Service,
                including school administrators, staff, parents, and guardians.
              </p>
            </Section>

            <Section title="2. Description of Service">
              <p>
                Enrollsy provides a cloud-based platform for private schools to manage admissions,
                enrollment, and tuition payments. Our Service includes:
              </p>
              <ul>
                <li>Admissions and lead management tools</li>
                <li>Online application and enrollment forms</li>
                <li>Electronic signature capabilities</li>
                <li>Payment processing and billing management</li>
                <li>Parent portal access</li>
                <li>Communication and notification features</li>
              </ul>
            </Section>

            <Section title="3. Account Registration">
              <p>
                To use certain features of the Service, you must register for an account.
                When you register, you agree to:
              </p>
              <ul>
                <li>Provide accurate, current, and complete information</li>
                <li>Maintain and update your information to keep it accurate</li>
                <li>Keep your password secure and confidential</li>
                <li>Accept responsibility for all activities under your account</li>
                <li>Notify us immediately of any unauthorized use</li>
              </ul>
            </Section>

            <Section title="4. Acceptable Use">
              <p>You agree not to use the Service to:</p>
              <ul>
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe on the rights of others, including intellectual property rights</li>
                <li>Transmit any harmful, threatening, or objectionable content</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Interfere with or disrupt the Service or servers</li>
                <li>Collect or harvest user data without consent</li>
                <li>Use the Service for any unauthorized commercial purpose</li>
              </ul>
            </Section>

            <Section title="5. School Data and Content">
              <p>
                <strong>Your Data:</strong> You retain all rights to the data you submit to
                the Service ("Your Data"). This includes student records, family information,
                and any other content you upload or create.
              </p>
              <p>
                <strong>License to Us:</strong> By submitting Your Data, you grant us a limited
                license to use, store, and process that data solely for the purpose of providing
                the Service to you.
              </p>
              <p>
                <strong>Data Protection:</strong> We take data protection seriously. Please review
                our <Link to="/privacy" className="text-[#2F5D50] hover:underline">Privacy Policy</Link> for
                details on how we collect, use, and protect your information.
              </p>
            </Section>

            <Section title="6. Payment Terms">
              <p>
                <strong>Fees:</strong> Certain features of the Service require payment of fees.
                You agree to pay all fees associated with your subscription plan.
              </p>
              <p>
                <strong>Billing:</strong> Fees are billed in advance on a yearly basis.
                Your subscription will automatically renew unless you cancel before the
                renewal date.
              </p>
              <p>
                <strong>Payment Processing:</strong> We use third-party payment processors
                (such as Stripe) to process payments. Your use of these services is subject
                to their terms and conditions.
              </p>
              <p>
                <strong>Refunds:</strong> Refunds may be provided at our discretion. Please
                contact us to discuss any billing concerns.
              </p>
            </Section>

            <Section title="7. Intellectual Property">
              <p>
                The Service and its original content (excluding Your Data), features, and
                functionality are owned by Enrollsy and are protected by copyright, trademark,
                and other intellectual property laws.
              </p>
              <p>
                You may not copy, modify, distribute, or create derivative works based on
                our Service without our express written permission.
              </p>
            </Section>

            <Section title="8. Third-Party Services">
              <p>
                Our Service may integrate with or link to third-party services. We are not
                responsible for the content, terms, or practices of these third parties.
                Your use of third-party services is at your own risk.
              </p>
            </Section>

            <Section title="9. Service Availability">
              <p>
                We strive to maintain high availability of the Service. However, we do not
                guarantee uninterrupted access and may need to perform maintenance or updates
                that temporarily affect availability.
              </p>
              <p>
                We reserve the right to modify, suspend, or discontinue the Service (or any
                part thereof) at any time with reasonable notice.
              </p>
            </Section>

            <Section title="10. Disclaimer of Warranties">
              <p>
                THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY
                KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES
                OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
              </p>
              <p>
                We do not warrant that the Service will be error-free, secure, or uninterrupted.
              </p>
            </Section>

            <Section title="11. Limitation of Liability">
              <p>
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, ENROLLSY SHALL NOT BE LIABLE FOR ANY
                INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING
                BUT NOT LIMITED TO LOSS OF PROFITS, DATA, OR GOODWILL.
              </p>
              <p>
                Our total liability for any claims arising from or related to the Service
                shall not exceed the amount you paid us in the twelve (12) months preceding
                the claim.
              </p>
            </Section>

            <Section title="12. Indemnification">
              <p>
                You agree to indemnify and hold harmless Enrollsy and its officers, directors,
                employees, and agents from any claims, damages, losses, or expenses arising
                from your use of the Service or violation of these Terms.
              </p>
            </Section>

            <Section title="13. Termination">
              <p>
                We may terminate or suspend your account and access to the Service at our
                sole discretion, without notice, for conduct that we believe violates these
                Terms or is harmful to other users, us, or third parties.
              </p>
              <p>
                Upon termination, your right to use the Service will immediately cease.
                We will provide you with a reasonable opportunity to export Your Data
                before deletion.
              </p>
            </Section>

            <Section title="14. Changes to Terms">
              <p>
                We reserve the right to modify these Terms at any time. We will notify you
                of any material changes by posting the new Terms on this page and updating
                the "Last updated" date.
              </p>
              <p>
                Your continued use of the Service after any changes constitutes acceptance
                of the new Terms.
              </p>
            </Section>

            <Section title="15. Governing Law">
              <p>
                These Terms shall be governed by and construed in accordance with the laws
                of the State of California, without regard to its conflict of law provisions.
              </p>
            </Section>

            <Section title="16. Dispute Resolution">
              <p>
                Any disputes arising from these Terms or the Service shall first be attempted
                to be resolved through good-faith negotiation. If negotiation fails, disputes
                shall be resolved through binding arbitration in accordance with the rules
                of the American Arbitration Association.
              </p>
            </Section>

            <Section title="17. Contact Us">
              <p>
                If you have any questions about these Terms, please contact us at:
              </p>
              <ul>
                <li>Email: <a href="mailto:jake@dubsado.com" className="text-[#2F5D50] hover:underline">jake@dubsado.com</a></li>
                <li>Contact form: <Link to="/contact" className="text-[#2F5D50] hover:underline">enrollsy.com/contact</Link></li>
              </ul>
            </Section>
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// SECTION COMPONENT
// ═══════════════════════════════════════════════════════════

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-xl font-display text-[#1F2A44] mb-4">{title}</h2>
      <div className="text-[#5F6368] space-y-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2 [&_li]:text-[#5F6368]">
        {children}
      </div>
    </section>
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
            <div className="w-8 h-8 bg-[#1F2A44] rounded flex items-center justify-center">
              <span className="text-white font-display font-bold text-sm">E</span>
            </div>
            <span className="text-xl font-display text-[#1F2A44]">Enrollsy</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link to="/about" className="text-[#5F6368] hover:text-[#1F2A44] transition-colors">About</Link>
            <Link to="/contact" className="text-[#5F6368] hover:text-[#1F2A44] transition-colors">Contact</Link>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link to="/login" className="text-[#5F6368] hover:text-[#1F2A44] transition-colors">
              Sign In
            </Link>
            <Link
              to="/contact"
              className="bg-[#2F5D50] text-white px-5 py-2 rounded-md hover:bg-[#234840] transition-colors font-medium"
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
              <Link to="/contact" className="text-[#5F6368]">Contact</Link>
              <Link to="/login" className="text-[#5F6368]">Sign In</Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

// ═══════════════════════════════════════════════════════════
// FOOTER
// ═══════════════════════════════════════════════════════════

function Footer() {
  return (
    <footer className="bg-[#1F2A44] text-white py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
                <span className="text-[#1F2A44] font-display font-bold text-sm">E</span>
              </div>
              <span className="text-lg font-display">Enrollsy</span>
            </div>
            <p className="text-white/60 text-sm">
              The modern front door for private schools.
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
              <li><Link to="/terms" className="text-white transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-white/40 text-sm">
            &copy; {new Date().getFullYear()} Enrollsy. All rights reserved.
          </p>
          <p className="text-white/40 text-sm">
            Made with care for schools that care.
          </p>
        </div>
      </div>
    </footer>
  );
}
