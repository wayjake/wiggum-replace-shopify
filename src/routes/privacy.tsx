// 🔒 Privacy Policy - Protecting school and family data
// GDPR-compliant with clear data rights and processing explanations

import { createFileRoute, Link } from '@tanstack/react-router';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

export const Route = createFileRoute('/privacy')({
  head: () => ({
    meta: [
      { title: 'Privacy Policy | Enrollsy' },
      {
        name: 'description',
        content: 'Learn how Enrollsy protects your data. Our privacy policy explains what data we collect, how we use it, and your rights under GDPR and other privacy regulations.',
      },
      { property: 'og:title', content: 'Privacy Policy | Enrollsy' },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#F7F5F2]">
      <Navigation />
      <main className="py-16 px-6">
        <article className="max-w-3xl mx-auto">
          <header className="mb-12">
            <h1 className="text-4xl font-display text-[#1F2A44] mb-4">Privacy Policy</h1>
            <p className="text-[#5F6368]">Last updated: January 2026</p>
          </header>

          {/* Quick summary box */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 mb-12">
            <h2 className="text-lg font-display text-[#1F2A44] mb-4">Privacy at a Glance</h2>
            <ul className="space-y-2 text-[#5F6368] text-sm">
              <li><strong className="text-[#1E1E1E]">What we collect:</strong> Information you provide (contact details, school data, student records) and usage data</li>
              <li><strong className="text-[#1E1E1E]">How we use it:</strong> To provide our enrollment platform services and improve the product</li>
              <li><strong className="text-[#1E1E1E]">Who we share with:</strong> Only service providers necessary to operate (payment processors, email services)</li>
              <li><strong className="text-[#1E1E1E]">Your rights:</strong> Access, correct, delete, or export your data at any time</li>
              <li><strong className="text-[#1E1E1E]">Security:</strong> Bank-level encryption and security practices</li>
            </ul>
          </div>

          <div className="prose prose-lg max-w-none">
            <Section title="1. Introduction">
              <p>
                Enrollsy ("we," "us," or "our") respects your privacy and is committed to protecting
                the personal data of schools, families, and students who use our enrollment platform.
              </p>
              <p>
                This Privacy Policy explains how we collect, use, disclose, and safeguard your
                information when you use our website and services. Please read this policy carefully.
                If you do not agree with the terms of this policy, please do not access the Service.
              </p>
              <p>
                We comply with the General Data Protection Regulation (GDPR), the California Consumer
                Privacy Act (CCPA), and other applicable data protection laws.
              </p>
            </Section>

            <Section title="2. Information We Collect">
              <h3 className="text-lg font-medium text-[#1F2A44] mt-6 mb-3">2.1 Information You Provide</h3>
              <p>We collect information you voluntarily provide, including:</p>
              <ul>
                <li><strong>Account Information:</strong> Name, email address, phone number, and role (administrator, staff, parent)</li>
                <li><strong>School Information:</strong> School name, address, enrollment capacity, and administrative contacts</li>
                <li><strong>Student Records:</strong> Student names, dates of birth, grade levels, enrollment status, and academic records</li>
                <li><strong>Family Information:</strong> Parent/guardian names, contact details, emergency contacts, and household information</li>
                <li><strong>Payment Information:</strong> Billing addresses and payment method details (processed securely by our payment provider)</li>
                <li><strong>Communications:</strong> Messages you send through our contact forms or support channels</li>
              </ul>

              <h3 className="text-lg font-medium text-[#1F2A44] mt-6 mb-3">2.2 Information Collected Automatically</h3>
              <p>When you use our Service, we automatically collect:</p>
              <ul>
                <li><strong>Usage Data:</strong> Pages visited, features used, time spent on the Service</li>
                <li><strong>Device Information:</strong> Browser type, operating system, device identifiers</li>
                <li><strong>Log Data:</strong> IP addresses, access times, and referring URLs</li>
                <li><strong>Cookies:</strong> See our Cookie section below for details</li>
              </ul>
            </Section>

            <Section title="3. How We Use Your Information">
              <p>We use the information we collect to:</p>
              <ul>
                <li><strong>Provide the Service:</strong> Process enrollments, manage admissions, and facilitate payments</li>
                <li><strong>Communicate:</strong> Send service-related notifications, respond to inquiries, and provide support</li>
                <li><strong>Improve:</strong> Analyze usage patterns to enhance features and user experience</li>
                <li><strong>Secure:</strong> Detect and prevent fraud, unauthorized access, and other security threats</li>
                <li><strong>Comply:</strong> Meet legal obligations and respond to lawful requests</li>
                <li><strong>Marketing:</strong> Send newsletters and updates (only with your consent, and you can unsubscribe anytime)</li>
              </ul>
            </Section>

            <Section title="4. Legal Basis for Processing (GDPR)">
              <p>
                For users in the European Economic Area (EEA) and UK, we process personal data
                based on the following legal grounds:
              </p>
              <ul>
                <li><strong>Contract Performance:</strong> Processing necessary to provide our services to you</li>
                <li><strong>Legitimate Interests:</strong> Improving our services, preventing fraud, and ensuring security</li>
                <li><strong>Consent:</strong> Marketing communications and optional data collection (you can withdraw consent anytime)</li>
                <li><strong>Legal Obligation:</strong> Compliance with applicable laws and regulations</li>
              </ul>
            </Section>

            <Section title="5. Data Sharing and Disclosure">
              <p>We do not sell your personal data. We may share your information with:</p>
              <ul>
                <li><strong>Service Providers:</strong> Third parties who help us operate the Service, including:
                  <ul>
                    <li>Payment processors (Stripe) for secure payment handling</li>
                    <li>Email service providers (Brevo) for transactional and marketing emails</li>
                    <li>Cloud hosting providers for data storage</li>
                    <li>Analytics providers for usage insights</li>
                  </ul>
                </li>
                <li><strong>School Administrators:</strong> Information about students and families is shared with authorized school staff</li>
                <li><strong>Legal Requirements:</strong> When required by law, court order, or government request</li>
                <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets (with notice to you)</li>
              </ul>
              <p>
                All service providers are contractually bound to protect your data and use it only
                for the purposes we specify.
              </p>
            </Section>

            <Section title="6. Your Rights">
              <p>
                Depending on your location, you have certain rights regarding your personal data:
              </p>

              <h3 className="text-lg font-medium text-[#1F2A44] mt-6 mb-3">6.1 Rights Under GDPR (EEA/UK Users)</h3>
              <ul>
                <li><strong>Right to Access:</strong> Request a copy of your personal data</li>
                <li><strong>Right to Rectification:</strong> Correct inaccurate or incomplete data</li>
                <li><strong>Right to Erasure:</strong> Request deletion of your data ("right to be forgotten")</li>
                <li><strong>Right to Restriction:</strong> Limit how we process your data</li>
                <li><strong>Right to Data Portability:</strong> Receive your data in a structured, machine-readable format</li>
                <li><strong>Right to Object:</strong> Object to processing based on legitimate interests or direct marketing</li>
                <li><strong>Right to Withdraw Consent:</strong> Withdraw consent at any time for consent-based processing</li>
                <li><strong>Right to Lodge a Complaint:</strong> File a complaint with your local data protection authority</li>
              </ul>

              <h3 className="text-lg font-medium text-[#1F2A44] mt-6 mb-3">6.2 Rights Under CCPA (California Users)</h3>
              <ul>
                <li><strong>Right to Know:</strong> Request information about data collection, use, and sharing</li>
                <li><strong>Right to Delete:</strong> Request deletion of your personal information</li>
                <li><strong>Right to Opt-Out:</strong> Opt out of the sale of personal information (we don't sell data)</li>
                <li><strong>Right to Non-Discrimination:</strong> We will not discriminate against you for exercising these rights</li>
              </ul>

              <p className="mt-4">
                <strong>To exercise your rights:</strong> Contact us at{' '}
                <a href="mailto:jake@dubsado.com" className="text-[#2F5D50] hover:underline">jake@dubsado.com</a>{' '}
                or use our <Link to="/contact" className="text-[#2F5D50] hover:underline">contact form</Link>.
                We will respond within 30 days (or sooner as required by law).
              </p>
            </Section>

            <Section title="7. Data Retention">
              <p>
                We retain your personal data only as long as necessary to fulfill the purposes
                described in this policy, unless a longer retention period is required by law.
              </p>
              <ul>
                <li><strong>Account Data:</strong> Retained while your account is active, plus 7 years for legal compliance</li>
                <li><strong>Student Records:</strong> Retained according to your school's retention policy and applicable education laws</li>
                <li><strong>Payment Records:</strong> Retained for 7 years for tax and accounting purposes</li>
                <li><strong>Marketing Preferences:</strong> Retained until you unsubscribe or request deletion</li>
              </ul>
              <p>
                Upon account termination, we will delete or anonymize your data within 90 days,
                unless retention is required by law.
              </p>
            </Section>

            <Section title="8. Data Security">
              <p>
                We implement robust security measures to protect your data:
              </p>
              <ul>
                <li><strong>Encryption:</strong> All data is encrypted in transit (TLS 1.3) and at rest (AES-256)</li>
                <li><strong>Access Controls:</strong> Role-based access ensures only authorized personnel can access data</li>
                <li><strong>Infrastructure:</strong> We use secure cloud providers with SOC 2 Type II compliance</li>
                <li><strong>Monitoring:</strong> Continuous security monitoring and regular penetration testing</li>
                <li><strong>Employee Training:</strong> All staff receive regular security and privacy training</li>
                <li><strong>Incident Response:</strong> We have procedures to detect, respond to, and notify you of any data breaches</li>
              </ul>
              <p>
                While we strive to protect your data, no method of transmission or storage is
                100% secure. Please notify us immediately if you suspect any unauthorized access.
              </p>
            </Section>

            <Section title="9. International Data Transfers">
              <p>
                Your data may be transferred to and processed in countries outside your location,
                including the United States. When we transfer data internationally, we ensure
                appropriate safeguards are in place:
              </p>
              <ul>
                <li>Standard Contractual Clauses (SCCs) approved by the European Commission</li>
                <li>Data Processing Agreements with all service providers</li>
                <li>Compliance with the EU-U.S. Data Privacy Framework where applicable</li>
              </ul>
            </Section>

            <Section title="10. Cookies and Tracking">
              <p>
                We use cookies and similar technologies to improve your experience:
              </p>
              <ul>
                <li><strong>Essential Cookies:</strong> Required for the Service to function (authentication, security)</li>
                <li><strong>Functional Cookies:</strong> Remember your preferences and settings</li>
                <li><strong>Analytics Cookies:</strong> Help us understand how you use the Service</li>
              </ul>
              <p>
                You can control cookies through your browser settings. Note that disabling certain
                cookies may affect the functionality of the Service.
              </p>
            </Section>

            <Section title="11. Children's Privacy">
              <p>
                Our Service is designed for use by schools and does process data about students,
                including minors. We comply with the Children's Online Privacy Protection Act (COPPA)
                and similar regulations:
              </p>
              <ul>
                <li>We only collect student data as directed by schools (acting as the school's data processor)</li>
                <li>Schools are responsible for obtaining necessary parental consent</li>
                <li>We do not use student data for advertising or create student profiles</li>
                <li>Parents can request to review, correct, or delete their child's information through the school</li>
              </ul>
            </Section>

            <Section title="12. Changes to This Policy">
              <p>
                We may update this Privacy Policy from time to time. We will notify you of
                material changes by:
              </p>
              <ul>
                <li>Posting the updated policy on this page</li>
                <li>Updating the "Last updated" date</li>
                <li>Sending an email notification for significant changes</li>
              </ul>
              <p>
                We encourage you to review this policy periodically. Your continued use of the
                Service after changes constitutes acceptance of the updated policy.
              </p>
            </Section>

            <Section title="13. Contact Us">
              <p>
                If you have questions about this Privacy Policy or wish to exercise your data rights,
                please contact us:
              </p>
              <ul>
                <li><strong>Email:</strong> <a href="mailto:jake@dubsado.com" className="text-[#2F5D50] hover:underline">jake@dubsado.com</a></li>
                <li><strong>Contact Form:</strong> <Link to="/contact" className="text-[#2F5D50] hover:underline">enrollsy.com/contact</Link></li>
              </ul>
              <p className="mt-4">
                For GDPR-related inquiries, you may also contact your local data protection authority.
                A list of EU data protection authorities can be found at{' '}
                <a href="https://edpb.europa.eu/about-edpb/board/members_en" target="_blank" rel="noopener noreferrer" className="text-[#2F5D50] hover:underline">
                  edpb.europa.eu
                </a>.
              </p>
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
      <div className="text-[#5F6368] space-y-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2 [&_li]:text-[#5F6368] [&_ul_ul]:mt-2">
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
              <li><Link to="/privacy" className="text-white transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
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
