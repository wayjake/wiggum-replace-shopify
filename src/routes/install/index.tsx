// 🔧 Installation Wizard - The magical onboarding journey
// "I'm helping!" - What you'll say when this actually works

import { createFileRoute } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { useState } from 'react';
import {
  Database,
  CreditCard,
  Mail,
  Zap,
  Key,
  CheckCircle2,
  XCircle,
  ChevronRight,
  ExternalLink,
  Copy,
  Check,
  Loader2,
} from 'lucide-react';
import { cn } from '../../utils';
import { checkAllEnvVars, ENV_CONFIG } from '../../lib/env';

// ═══════════════════════════════════════════════════════════
// SERVER FUNCTIONS
// ═══════════════════════════════════════════════════════════

const getEnvStatus = createServerFn({ method: 'GET' }).handler(async () => {
  const status = checkAllEnvVars();
  return {
    configured: status.allPresent && status.allValid,
    results: status.results.map((r) => ({
      key: r.key,
      label: ENV_CONFIG[r.key].key,
      present: r.present,
      valid: r.valid,
      error: r.error,
      description: ENV_CONFIG[r.key].description,
      helpUrl: ENV_CONFIG[r.key].helpUrl,
      required: ENV_CONFIG[r.key].required,
    })),
  };
});

// ═══════════════════════════════════════════════════════════
// ROUTE DEFINITION
// ═══════════════════════════════════════════════════════════

export const Route = createFileRoute('/install/')({
  head: () => ({
    meta: [
      {
        title: "Setup Wizard | Karen's Beautiful Soap",
      },
      {
        name: 'description',
        content: "Configure your store's environment variables to get started with Karen's Beautiful Soap e-commerce platform.",
      },
    ],
  }),
  loader: async () => {
    return await getEnvStatus();
  },
  component: InstallWizard,
});

// ═══════════════════════════════════════════════════════════
// SETUP STEPS DATA
// ═══════════════════════════════════════════════════════════

const SETUP_STEPS = [
  {
    id: 'database',
    title: 'Database (Turso)',
    icon: Database,
    description: 'Connect to your SQLite database',
    envKeys: ['TURSO_DATABASE_URL', 'TURSO_AUTH_TOKEN'],
    instructions: `
## Turso Database Setup

Turso is SQLite at the edge - fast, cheap, and perfect for our soap store.

### Step 1: Install Turso CLI

\`\`\`bash
# macOS
brew install tursodatabase/tap/turso

# Linux
curl -sSfL https://get.tur.so/install.sh | bash
\`\`\`

### Step 2: Sign Up & Login

\`\`\`bash
turso auth signup   # First time
turso auth login    # Returning user
\`\`\`

### Step 3: Create Your Database

\`\`\`bash
turso db create soap-store
\`\`\`

### Step 4: Get Your Credentials

\`\`\`bash
turso db show soap-store --url
# Copy this as TURSO_DATABASE_URL

turso db tokens create soap-store
# Copy this as TURSO_AUTH_TOKEN
\`\`\`

### Local Development Tip

For offline development, use a local file:
\`\`\`
TURSO_DATABASE_URL=file:./local.db
\`\`\`
No auth token needed for local files!
`,
  },
  {
    id: 'stripe',
    title: 'Payments (Stripe)',
    icon: CreditCard,
    description: 'Enable payment processing',
    envKeys: ['STRIPE_PUBLIC_KEY', 'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'],
    instructions: `
## Stripe Payment Setup

Stripe handles all payment processing securely.

### Step 1: Create a Stripe Account

Go to [stripe.com](https://stripe.com) and sign up for free.

### Step 2: Get Your API Keys

1. Go to [Stripe Dashboard → Developers → API Keys](https://dashboard.stripe.com/apikeys)
2. Copy your **Publishable key** (starts with \`pk_test_\` or \`pk_live_\`)
3. Copy your **Secret key** (starts with \`sk_test_\` or \`sk_live_\`)

### Step 3: Set Up Webhook (Local Development)

For local development, use the Stripe CLI:

\`\`\`bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to your local server
stripe listen --forward-to localhost:3000/api/stripe/webhook
\`\`\`

Copy the webhook signing secret (starts with \`whsec_\`).

### For Production

Create a webhook endpoint in the Stripe Dashboard pointing to:
\`https://yourdomain.com/api/stripe/webhook\`
`,
  },
  {
    id: 'email',
    title: 'Email (Brevo)',
    icon: Mail,
    description: 'Configure transactional emails',
    envKeys: ['BREVO_API_KEY'],
    instructions: `
## Brevo Email Setup

Brevo (formerly Sendinblue) handles all customer emails.

### Step 1: Create Brevo Account

Go to [brevo.com](https://www.brevo.com) and sign up (300 emails/day free).

### Step 2: Get Your API Key

1. Go to Settings → API Keys (or SMTP & API)
2. Click "Generate a new API key"
3. Name it (e.g., "Soap Store Production")
4. Copy the key immediately (shown only once!)

### Step 3: Verify Your Sender

1. Go to Settings → Senders & IP
2. Add your sender email (e.g., hello@karenssoap.com)
3. Verify the domain or email address

### Email Templates

Set up these transactional templates in Brevo:
- Welcome Email (new customer)
- Order Confirmation
- Shipping Notification
- Review Request (post-delivery)
`,
  },
  {
    id: 'inngest',
    title: 'Events (Inngest)',
    icon: Zap,
    description: 'Background jobs & workflows',
    envKeys: ['INNGEST_SIGNING_KEY', 'INNGEST_EVENT_KEY'],
    instructions: `
## Inngest Event System Setup

Inngest handles all async operations like email sequences and fulfillment workflows.

### Step 1: Create Inngest Account

Go to [inngest.com](https://www.inngest.com) and sign up (generous free tier).

### Step 2: Get Your Keys

1. Go to your app's settings
2. Copy the **Signing Key** and **Event Key**
3. Add to environment variables

### Local Development

No keys needed for local development! Just run the dev server:

\`\`\`bash
npx inngest-cli@latest dev
\`\`\`

This opens http://localhost:8288 for testing events locally.

### Note

Inngest keys are optional for local development. The app will work without them
in dev mode, but you'll need them for production.
`,
  },
  {
    id: 'session',
    title: 'Security',
    icon: Key,
    description: 'Session encryption secret',
    envKeys: ['SESSION_SECRET'],
    instructions: `
## Session Secret Setup

The session secret is used to encrypt user session cookies.

### Generate a Secure Secret

You need a random string of at least 32 characters. Here are some ways to generate one:

\`\`\`bash
# Using openssl
openssl rand -base64 32

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Using Python
python3 -c "import secrets; print(secrets.token_hex(32))"
\`\`\`

### Important Notes

- **Never reuse** session secrets across different projects
- **Never commit** the session secret to version control
- Use a **different secret** for each environment (dev, staging, production)
- If you suspect the secret has been compromised, **rotate it immediately**
`,
  },
];

// ═══════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════

function InstallWizard() {
  const { configured, results } = Route.useLoaderData();
  const [activeStep, setActiveStep] = useState(0);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Group results by step
  const getStepStatus = (step: (typeof SETUP_STEPS)[number]) => {
    const relevantResults = results.filter((r) =>
      step.envKeys.includes(r.label)
    );
    const allPresent = relevantResults.every((r) => r.present);
    const allValid = relevantResults.every((r) => r.valid);
    return {
      complete: allPresent && allValid,
      results: relevantResults,
    };
  };

  const copyToClipboard = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (configured) {
    return (
      <div className="min-h-screen bg-[#FDFCFB] flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-[#2D5A4A] rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-[#1A1A1A] mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
            All Set!
          </h1>
          <p className="text-gray-600 mb-8">
            Your environment is configured. You're ready to start selling beautiful soap!
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-2 bg-[#2D5A4A] text-white px-6 py-3 rounded-lg hover:bg-[#1A1A1A] transition-colors"
          >
            Go to Store
            <ChevronRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    );
  }

  const currentStep = SETUP_STEPS[activeStep];
  const stepStatus = getStepStatus(currentStep);

  return (
    <div className="min-h-screen bg-[#FDFCFB]">
      {/* Header */}
      <header className="bg-white border-b border-[#F5EBE0] px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <div className="w-10 h-10 bg-[#2D5A4A] rounded-lg flex items-center justify-center">
            <span className="text-white text-xl">🧼</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#1A1A1A]" style={{ fontFamily: "'Playfair Display', serif" }}>
              Karen's Beautiful Soap
            </h1>
            <p className="text-sm text-gray-500">Store Setup Wizard</p>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Step Navigation */}
          <div className="lg:col-span-1">
            <nav className="space-y-2">
              {SETUP_STEPS.map((step, index) => {
                const status = getStepStatus(step);
                const Icon = step.icon;
                const isActive = index === activeStep;

                return (
                  <button
                    key={step.id}
                    onClick={() => setActiveStep(index)}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all',
                      isActive
                        ? 'bg-[#2D5A4A] text-white shadow-md'
                        : 'bg-white hover:bg-[#F5EBE0] text-[#1A1A1A] border border-[#F5EBE0]'
                    )}
                  >
                    <div
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                        status.complete
                          ? 'bg-green-500 text-white'
                          : isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-[#F5EBE0] text-[#2D5A4A]'
                      )}
                    >
                      {status.complete ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <Icon className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{step.title}</p>
                      <p
                        className={cn(
                          'text-xs truncate',
                          isActive ? 'text-white/70' : 'text-gray-500'
                        )}
                      >
                        {step.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </nav>

            {/* Overall Progress */}
            <div className="mt-6 bg-white rounded-lg border border-[#F5EBE0] p-4">
              <p className="text-sm font-medium text-[#1A1A1A] mb-2">
                Setup Progress
              </p>
              <div className="h-2 bg-[#F5EBE0] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#2D5A4A] transition-all duration-500"
                  style={{
                    width: `${(results.filter((r) => r.present && r.valid).length / results.length) * 100}%`,
                  }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {results.filter((r) => r.present && r.valid).length} of {results.length} variables configured
              </p>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Step Header */}
            <div className="bg-white rounded-xl border border-[#F5EBE0] p-6 mb-6">
              <div className="flex items-center gap-4 mb-4">
                <div
                  className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center',
                    stepStatus.complete
                      ? 'bg-green-100 text-green-600'
                      : 'bg-[#F5EBE0] text-[#2D5A4A]'
                  )}
                >
                  {stepStatus.complete ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    <currentStep.icon className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-[#1A1A1A]" style={{ fontFamily: "'Playfair Display', serif" }}>
                    {currentStep.title}
                  </h2>
                  <p className="text-gray-500">{currentStep.description}</p>
                </div>
              </div>

              {/* Environment Variables Status */}
              <div className="space-y-3">
                {stepStatus.results.map((result) => (
                  <div
                    key={result.key}
                    className={cn(
                      'flex items-center justify-between p-3 rounded-lg border',
                      result.present && result.valid
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {result.present && result.valid ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                      )}
                      <div>
                        <code className="text-sm font-mono font-medium">
                          {result.label}
                        </code>
                        {!result.required && (
                          <span className="ml-2 text-xs text-gray-500">(optional)</span>
                        )}
                        {result.error && (
                          <p className="text-xs text-red-600 mt-0.5">
                            {result.error}
                          </p>
                        )}
                      </div>
                    </div>
                    {result.helpUrl && (
                      <a
                        href={result.helpUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[#2D5A4A] hover:underline flex items-center gap-1"
                      >
                        Get key
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-white rounded-xl border border-[#F5EBE0] p-6">
              <h3 className="text-lg font-semibold text-[#1A1A1A] mb-4">
                Setup Instructions
              </h3>
              <div className="prose prose-sm max-w-none">
                <InstructionsRenderer markdown={currentStep.instructions} onCopy={copyToClipboard} copiedKey={copiedKey} />
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between mt-6">
              <button
                onClick={() => setActiveStep((prev) => Math.max(0, prev - 1))}
                disabled={activeStep === 0}
                className="px-4 py-2 text-[#2D5A4A] hover:bg-[#F5EBE0] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Previous
              </button>
              <div className="flex gap-3">
                <a
                  href="/install"
                  className="px-4 py-2 text-[#2D5A4A] hover:bg-[#F5EBE0] rounded-lg flex items-center gap-2"
                >
                  <Loader2 className="w-4 h-4" />
                  Refresh Status
                </a>
                {activeStep < SETUP_STEPS.length - 1 ? (
                  <button
                    onClick={() => setActiveStep((prev) => prev + 1)}
                    className="px-4 py-2 bg-[#2D5A4A] text-white rounded-lg hover:bg-[#1A1A1A] flex items-center gap-2"
                  >
                    Next Step
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <a
                    href="/"
                    className="px-4 py-2 bg-[#2D5A4A] text-white rounded-lg hover:bg-[#1A1A1A] flex items-center gap-2"
                  >
                    Complete Setup
                    <ChevronRight className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// INSTRUCTIONS RENDERER (simple markdown-ish parser)
// ═══════════════════════════════════════════════════════════

function InstructionsRenderer({
  markdown,
  onCopy,
  copiedKey,
}: {
  markdown: string;
  onCopy: (text: string, key: string) => void;
  copiedKey: string | null;
}) {
  const lines = markdown.trim().split('\n');
  const elements: React.ReactNode[] = [];
  let codeBlock: string[] = [];
  let inCodeBlock = false;
  let codeBlockIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code block handling
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        const code = codeBlock.join('\n');
        const blockKey = `code-${codeBlockIndex++}`;
        elements.push(
          <div key={blockKey} className="relative group my-4">
            <pre className="bg-[#1A1A1A] text-green-400 p-4 rounded-lg overflow-x-auto text-sm font-mono">
              <code>{code}</code>
            </pre>
            <button
              onClick={() => onCopy(code, blockKey)}
              className="absolute top-2 right-2 p-2 bg-white/10 hover:bg-white/20 rounded transition-colors"
              title="Copy to clipboard"
            >
              {copiedKey === blockKey ? (
                <Check className="w-4 h-4 text-green-400" />
              ) : (
                <Copy className="w-4 h-4 text-white/70" />
              )}
            </button>
          </div>
        );
        codeBlock = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlock.push(line);
      continue;
    }

    // Headings
    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={i} className="text-xl font-bold text-[#1A1A1A] mt-6 mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
          {line.slice(3)}
        </h2>
      );
      continue;
    }

    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={i} className="text-lg font-semibold text-[#1A1A1A] mt-4 mb-2">
          {line.slice(4)}
        </h3>
      );
      continue;
    }

    // Links
    const linkMatch = line.match(/\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch) {
      const [, text, url] = linkMatch;
      const beforeLink = line.slice(0, line.indexOf('['));
      const afterLink = line.slice(line.indexOf(')') + 1);
      elements.push(
        <p key={i} className="my-2 text-gray-700">
          {beforeLink}
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#2D5A4A] hover:underline"
          >
            {text}
          </a>
          {afterLink}
        </p>
      );
      continue;
    }

    // Inline code
    if (line.includes('`')) {
      const parts = line.split(/(`[^`]+`)/g);
      elements.push(
        <p key={i} className="my-2 text-gray-700">
          {parts.map((part, j) =>
            part.startsWith('`') && part.endsWith('`') ? (
              <code
                key={j}
                className="bg-[#F5EBE0] px-1.5 py-0.5 rounded text-sm font-mono text-[#2D5A4A]"
              >
                {part.slice(1, -1)}
              </code>
            ) : (
              part
            )
          )}
        </p>
      );
      continue;
    }

    // List items
    if (line.startsWith('- ')) {
      elements.push(
        <li key={i} className="ml-4 text-gray-700">
          {line.slice(2)}
        </li>
      );
      continue;
    }

    // Regular paragraphs
    if (line.trim()) {
      elements.push(
        <p key={i} className="my-2 text-gray-700">
          {line}
        </p>
      );
    }
  }

  return <>{elements}</>;
}
