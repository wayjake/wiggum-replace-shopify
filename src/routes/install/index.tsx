// 🔧 Installation Wizard - The magical onboarding journey
// Configure your Enrollsy instance with the required environment variables

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
  Chrome,
} from 'lucide-react';
import { cn } from '../../utils';
import { checkAllEnvVars, ENV_CONFIG } from '../../lib/env';

// ═══════════════════════════════════════════════════════════
// SERVER FUNCTIONS
// ═══════════════════════════════════════════════════════════

/**
 * 🔍 Check if the Inngest dev server is running locally
 * When running `npx inngest-cli@latest dev`, it starts on port 8288
 */
async function checkInngestDevServer(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1000);

    const response = await fetch('http://localhost:8288/', {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
}

const getEnvStatus = createServerFn({ method: 'GET' }).handler(async () => {
  const status = checkAllEnvVars();
  const isDev = process.env.NODE_ENV !== 'production';

  let inngestDevRunning = false;
  if (isDev) {
    inngestDevRunning = await checkInngestDevServer();
  }

  const results = status.results.map((r) => {
    const isInngestKey = r.key === 'INNGEST_SIGNING_KEY' || r.key === 'INNGEST_EVENT_KEY';

    if (isDev && inngestDevRunning && isInngestKey && !r.present) {
      return {
        key: r.key,
        label: ENV_CONFIG[r.key].key,
        present: true,
        valid: true,
        error: undefined,
        description: ENV_CONFIG[r.key].description,
        helpUrl: ENV_CONFIG[r.key].helpUrl,
        required: ENV_CONFIG[r.key].required,
        inngestDevDetected: true,
      };
    }

    return {
      key: r.key,
      label: ENV_CONFIG[r.key].key,
      present: r.present,
      valid: r.valid,
      error: r.error,
      description: ENV_CONFIG[r.key].description,
      helpUrl: ENV_CONFIG[r.key].helpUrl,
      required: ENV_CONFIG[r.key].required,
      inngestDevDetected: false,
    };
  });

  const allConfigured = results.every((r) => !ENV_CONFIG[r.key as keyof typeof ENV_CONFIG].required || (r.present && r.valid));

  return {
    configured: allConfigured,
    isDev,
    inngestDevRunning,
    results,
  };
});

/**
 * 🔧 Update local .env file with provided keys
 * Only available in development mode for security!
 */
const updateEnvFile = createServerFn({ method: 'POST' })
  .handler(async (data: { key: string; value: string }) => {
    const isDev = process.env.NODE_ENV !== 'production';

    if (!isDev) {
      throw new Error('This feature is only available in development mode');
    }

    const { key, value } = data;

    const validKeys = Object.values(ENV_CONFIG).map((c) => c.key);
    if (!validKeys.includes(key)) {
      throw new Error(`Unknown environment variable: ${key}`);
    }

    const fs = await import('fs/promises');
    const path = await import('path');
    const envPath = path.join(process.cwd(), '.env');

    let envContent = '';
    try {
      envContent = await fs.readFile(envPath, 'utf-8');
    } catch {
      // File doesn't exist, we'll create it
    }

    const lines = envContent.split('\n');
    const envVars = new Map<string, number>();

    lines.forEach((line, index) => {
      const match = line.match(/^([A-Z_]+)=/);
      if (match) {
        envVars.set(match[1], index);
      }
    });

    const newLine = `${key}=${value}`;
    if (envVars.has(key)) {
      lines[envVars.get(key)!] = newLine;
    } else {
      const lastNonEmptyIndex = lines.findLastIndex((l) => l.trim() !== '');
      if (lastNonEmptyIndex === -1) {
        lines.push(newLine);
      } else {
        lines.splice(lastNonEmptyIndex + 1, 0, newLine);
      }
    }

    await fs.writeFile(envPath, lines.join('\n'));

    return {
      success: true,
      message: `Updated ${key}. Restart the dev server for changes to take effect.`,
    };
  });

/**
 * 🔍 Check if the database has been seeded
 */
const checkDatabaseStatus = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const { getDb, schools, users } = await import('../../db');
    const { count } = await import('drizzle-orm');
    const db = getDb();

    const [schoolCount] = await db.select({ count: count() }).from(schools);
    const [userCount] = await db.select({ count: count() }).from(users);

    return {
      success: true,
      hasData: (userCount?.count ?? 0) > 0,
      counts: {
        schools: schoolCount?.count ?? 0,
        users: userCount?.count ?? 0,
      },
    };
  } catch (error) {
    return {
      success: false,
      hasData: false,
      error: error instanceof Error ? error.message : 'Database check failed',
      counts: { schools: 0, users: 0 },
    };
  }
});

/**
 * 🌱 Run database migrations and seed
 */
const runDatabaseSetup = createServerFn({ method: 'POST' }).handler(async () => {
  const isDev = process.env.NODE_ENV !== 'production';

  if (!isDev) {
    throw new Error('Database setup is only available in development mode');
  }

  try {
    const { execSync } = await import('child_process');

    console.log('📦 Running database migrations...');
    execSync('npx drizzle-kit push', {
      stdio: 'pipe',
      cwd: process.cwd(),
    });

    console.log('🌱 Running database seed...');
    execSync('npx tsx src/db/seed.ts', {
      stdio: 'pipe',
      cwd: process.cwd(),
    });

    return {
      success: true,
      message: 'Database initialized with migrations and seed data!',
    };
  } catch (error) {
    console.error('Database setup error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Database setup failed',
    };
  }
});

// ═══════════════════════════════════════════════════════════
// ROUTE DEFINITION
// ═══════════════════════════════════════════════════════════

export const Route = createFileRoute('/install/')({
  head: () => ({
    meta: [
      { title: 'Setup Wizard | Enrollsy' },
      {
        name: 'description',
        content: 'Configure your Enrollsy instance environment variables to get started.',
      },
    ],
  }),
  loader: async () => {
    const [envStatus, dbStatus] = await Promise.all([
      getEnvStatus(),
      checkDatabaseStatus(),
    ]);
    return { ...envStatus, dbStatus };
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

Turso is SQLite at the edge - fast, cheap, and perfect for multi-tenant SaaS.

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
turso db create enrollsy
\`\`\`

### Step 4: Get Your Credentials

\`\`\`bash
turso db show enrollsy --url
# Copy this as TURSO_DATABASE_URL

turso db tokens create enrollsy
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
    id: 'database-init',
    title: 'Initialize Database',
    icon: Database,
    description: 'Create tables and seed sample data',
    envKeys: [],
    isDbInit: true,
    instructions: `
## Database Initialization

After connecting to Turso (or local SQLite), you need to create the tables and add sample data.

### What This Does

1. **Creates Tables** - Runs Drizzle migrations to create all database tables
2. **Creates Test School** - Adds a sample school for testing
3. **Creates Test Users** - Adds admin and family accounts for testing

### Manual Setup (Alternative)

If you prefer to run commands manually:

\`\`\`bash
# Apply database migrations
npx drizzle-kit push

# Seed with sample data
npx tsx src/db/seed.ts
\`\`\`

### Test Credentials

After seeding, you can log in with:

- **Superadmin**: superadmin@enrollsy.com / admin123
- **School Admin**: admin@demo-school.edu / admin123
- **Parent**: parent@example.com / customer123

### Note

This step is only available in development mode. For production, run the migrations manually or via CI/CD.
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

Stripe handles all tuition payment processing securely.

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

Brevo (formerly Sendinblue) handles all notification emails.

### Step 1: Create Brevo Account

Go to [brevo.com](https://www.brevo.com) and sign up (300 emails/day free).

### Step 2: Get Your API Key

1. Go to Settings → API Keys (or SMTP & API)
2. Click "Generate a new API key"
3. Name it (e.g., "Enrollsy Production")
4. Copy the key immediately (shown only once!)

### Step 3: Verify Your Sender

1. Go to Settings → Senders & IP
2. Add your sender email (e.g., notifications@yourschool.edu)
3. Verify the domain or email address

### Email Templates

Set up these transactional templates in Brevo:
- Welcome Email (new family registration)
- Application Received
- Application Status Update
- Payment Confirmation
- Payment Reminder
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

Inngest handles all async operations like email sequences and notification workflows.

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
  {
    id: 'google',
    title: 'Google Sign-In (Optional)',
    icon: Chrome,
    description: 'Let users sign in with their Google account',
    envKeys: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'],
    instructions: `
## Google OAuth Setup

Enable "Sign in with Google" to make registration and login easier.

### Step 1: Go to Google Cloud Console

Visit [Google Cloud Console](https://console.cloud.google.com/) and sign in.

### Step 2: Create or Select a Project

1. Click the project dropdown in the top bar
2. Click "New Project" or select an existing one
3. Give it a name like "Enrollsy"

### Step 3: Enable the Google+ API

1. Go to "APIs & Services" → "Library"
2. Search for "Google+ API" and enable it
3. Also enable "Google People API" if prompted

### Step 4: Configure OAuth Consent Screen

1. Go to "APIs & Services" → "OAuth consent screen"
2. Choose "External" (for any Google user)
3. Fill in required fields:
   - App name: "Enrollsy"
   - User support email: your email
   - Developer contact: your email
4. Add scopes: \`email\`, \`profile\`, \`openid\`
5. Save and continue

### Step 5: Create OAuth Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Application type: "Web application"
4. Name: "Enrollsy Web Client"
5. Authorized JavaScript origins:
   - \`http://localhost:3000\` (development)
   - \`https://yourdomain.com\` (production)
6. Authorized redirect URIs:
   - \`http://localhost:3000/api/auth/google/callback\` (development)
   - \`https://yourdomain.com/api/auth/google/callback\` (production)
7. Click "Create"

### Step 6: Copy Your Credentials

After creation, you'll see:
- **Client ID** (ends with \`.apps.googleusercontent.com\`)
- **Client Secret** (starts with \`GOCSPX-\`)

Add these to your environment variables.

### Note

Google OAuth is completely optional. Users can always register with email/password.
The "Sign in with Google" button only appears if these credentials are configured.
`,
  },
];

// ═══════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════

function InstallWizard() {
  const { configured, isDev, inngestDevRunning, results, dbStatus } = Route.useLoaderData();
  const [activeStep, setActiveStep] = useState(0);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [envInputs, setEnvInputs] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<{ key: string; message: string } | null>(null);
  const [isRunningDbSetup, setIsRunningDbSetup] = useState(false);
  const [dbSetupMessage, setDbSetupMessage] = useState<{ success: boolean; message: string } | null>(null);

  const getStepStatus = (step: (typeof SETUP_STEPS)[number]) => {
    if (step.id === 'database-init') {
      return {
        complete: dbStatus.hasData,
        results: [],
        isDbInit: true,
      };
    }

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

  const handleDbSetup = async () => {
    setIsRunningDbSetup(true);
    setDbSetupMessage(null);

    try {
      const result = await runDatabaseSetup();
      setDbSetupMessage({
        success: result.success,
        message: result.success
          ? result.message
          : result.error || 'Database setup failed',
      });
      if (result.success) {
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch (error) {
      setDbSetupMessage({
        success: false,
        message: error instanceof Error ? error.message : 'Database setup failed',
      });
    } finally {
      setIsRunningDbSetup(false);
    }
  };

  const copyToClipboard = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const saveEnvVar = async (key: string) => {
    const value = envInputs[key];
    if (!value) return;

    setSavingKey(key);
    setSaveMessage(null);

    try {
      const result = await updateEnvFile({ key, value });
      setSaveMessage({ key, message: result.message });
      setEnvInputs((prev) => ({ ...prev, [key]: '' }));
    } catch (error) {
      setSaveMessage({
        key,
        message: error instanceof Error ? error.message : 'Failed to save',
      });
    } finally {
      setSavingKey(null);
    }
  };

  if (configured) {
    return (
      <div className="min-h-screen bg-[#F7F5F2] flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-[#2F5D50] rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-[#1F2A44] mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
            All Set!
          </h1>
          <p className="text-gray-600 mb-8">
            Your environment is configured. You're ready to start using Enrollsy!
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-2 bg-[#2F5D50] text-white px-6 py-3 rounded-lg hover:bg-[#1F2A44] transition-colors"
          >
            Go to Dashboard
            <ChevronRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    );
  }

  const currentStep = SETUP_STEPS[activeStep];
  const stepStatus = getStepStatus(currentStep);

  return (
    <div className="min-h-screen bg-[#F7F5F2]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <div className="w-10 h-10 bg-[#2F5D50] rounded-lg flex items-center justify-center">
            <span className="text-white text-xl">🎓</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#1F2A44]" style={{ fontFamily: "'Playfair Display', serif" }}>
              Enrollsy
            </h1>
            <p className="text-sm text-gray-500">Setup Wizard</p>
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
                const configuredCount = status.results.filter((r) => r.present && r.valid).length;
                const totalCount = status.results.length;

                return (
                  <button
                    key={step.id}
                    onClick={() => setActiveStep(index)}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all',
                      isActive
                        ? 'bg-[#2F5D50] text-white shadow-md'
                        : 'bg-white hover:bg-gray-100 text-[#1F2A44] border border-gray-200'
                    )}
                  >
                    <div
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                        status.complete
                          ? 'bg-green-500 text-white'
                          : isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-gray-100 text-[#2F5D50]'
                      )}
                    >
                      {status.complete ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <Icon className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium truncate">{step.title}</p>
                        {step.id === 'database-init' ? (
                          <span
                            className={cn(
                              'text-xs px-2 py-0.5 rounded-full flex-shrink-0',
                              status.complete
                                ? isActive
                                  ? 'bg-green-400/30 text-green-100'
                                  : 'bg-green-100 text-green-700'
                                : isActive
                                  ? 'bg-white/20 text-white/80'
                                  : 'bg-amber-100 text-amber-700'
                            )}
                          >
                            {status.complete ? 'Seeded' : 'Action'}
                          </span>
                        ) : (
                          <span
                            className={cn(
                              'text-xs px-2 py-0.5 rounded-full flex-shrink-0',
                              status.complete
                                ? isActive
                                  ? 'bg-green-400/30 text-green-100'
                                  : 'bg-green-100 text-green-700'
                                : isActive
                                  ? 'bg-white/20 text-white/80'
                                  : 'bg-red-100 text-red-700'
                            )}
                          >
                            {configuredCount}/{totalCount}
                          </span>
                        )}
                      </div>
                      <p
                        className={cn(
                          'text-xs truncate',
                          isActive ? 'text-white/70' : 'text-gray-500'
                        )}
                      >
                        {step.id === 'database-init'
                          ? status.complete
                            ? '✓ Database seeded'
                            : 'Run setup'
                          : status.complete
                            ? '✓ All configured'
                            : `${totalCount - configuredCount} remaining`}
                      </p>
                    </div>
                  </button>
                );
              })}
            </nav>

            {/* Overall Progress */}
            <div className="mt-6 bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm font-medium text-[#1F2A44] mb-2">
                Setup Progress
              </p>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#2F5D50] transition-all duration-500"
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
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
              <div className="flex items-center gap-4 mb-4">
                <div
                  className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center',
                    stepStatus.complete
                      ? 'bg-green-100 text-green-600'
                      : 'bg-gray-100 text-[#2F5D50]'
                  )}
                >
                  {stepStatus.complete ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    <currentStep.icon className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-[#1F2A44]" style={{ fontFamily: "'Playfair Display', serif" }}>
                    {currentStep.title}
                  </h2>
                  <p className="text-gray-500">{currentStep.description}</p>
                </div>
              </div>

              {/* Inngest Dev Server Notice */}
              {inngestDevRunning && currentStep.id === 'inngest' && (
                <div className="mb-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Zap className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-purple-800">Inngest Dev Server Detected!</p>
                      <p className="text-sm text-purple-600">
                        Running on localhost:8288 — no API keys needed for local development.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Environment Variables Status */}
              <div className="space-y-3">
                {stepStatus.results.map((result) => (
                  <div
                    key={result.key}
                    className={cn(
                      'p-3 rounded-lg border',
                      result.inngestDevDetected
                        ? 'bg-purple-50 border-purple-200'
                        : result.present && result.valid
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {result.inngestDevDetected ? (
                          <Zap className="w-5 h-5 text-purple-600 flex-shrink-0" />
                        ) : result.present && result.valid ? (
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
                          {result.inngestDevDetected && (
                            <span className="ml-2 text-xs text-purple-600 font-medium">
                              (dev server detected)
                            </span>
                          )}
                          {result.error && (
                            <p className="text-xs text-red-600 mt-0.5">
                              {result.error}
                            </p>
                          )}
                        </div>
                      </div>
                      {result.helpUrl && !result.inngestDevDetected && (
                        <a
                          href={result.helpUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-[#2F5D50] hover:underline flex items-center gap-1"
                        >
                          Get key
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>

                    {/* Dev mode: Show input to set this env var */}
                    {isDev && !(result.present && result.valid) && !result.inngestDevDetected && (
                      <div className="mt-3 pt-3 border-t border-red-200">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder={`Enter ${result.label} value...`}
                            value={envInputs[result.label] || ''}
                            onChange={(e) =>
                              setEnvInputs((prev) => ({
                                ...prev,
                                [result.label]: e.target.value,
                              }))
                            }
                            className="flex-1 px-3 py-2 text-sm font-mono border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2F5D50]/20 focus:border-[#2F5D50]"
                          />
                          <button
                            onClick={() => saveEnvVar(result.label)}
                            disabled={!envInputs[result.label] || savingKey === result.label}
                            className="px-4 py-2 bg-[#2F5D50] text-white text-sm rounded-lg hover:bg-[#1F2A44] disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            {savingKey === result.label ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              'Save'
                            )}
                          </button>
                        </div>
                        {saveMessage?.key === result.label && (
                          <p className="mt-2 text-xs text-[#2F5D50]">
                            {saveMessage.message}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Database Init Step - Special UI */}
              {currentStep.id === 'database-init' && (
                <div className="mt-4 space-y-4">
                  <div
                    className={cn(
                      'p-4 rounded-lg border',
                      dbStatus.hasData
                        ? 'bg-green-50 border-green-200'
                        : 'bg-amber-50 border-amber-200'
                    )}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      {dbStatus.hasData ? (
                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                      ) : (
                        <Database className="w-6 h-6 text-amber-600" />
                      )}
                      <div>
                        <p className="font-medium text-[#1F2A44]">
                          {dbStatus.hasData
                            ? 'Database is seeded and ready!'
                            : 'Database needs initialization'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {dbStatus.hasData
                            ? `${dbStatus.counts.schools} schools, ${dbStatus.counts.users} users`
                            : 'Run setup to create tables and add sample data'}
                        </p>
                      </div>
                    </div>

                    {isDev && !dbStatus.hasData && (
                      <div className="mt-4 pt-4 border-t border-amber-200">
                        <button
                          onClick={handleDbSetup}
                          disabled={isRunningDbSetup}
                          className={cn(
                            'w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-colors',
                            isRunningDbSetup
                              ? 'bg-gray-200 text-gray-500 cursor-wait'
                              : 'bg-[#2F5D50] text-white hover:bg-[#1F2A44]'
                          )}
                        >
                          {isRunningDbSetup ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              Running migrations & seed...
                            </>
                          ) : (
                            <>
                              <Database className="w-5 h-5" />
                              Initialize Database
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {dbSetupMessage && (
                      <div
                        className={cn(
                          'mt-4 p-3 rounded-lg text-sm',
                          dbSetupMessage.success
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        )}
                      >
                        {dbSetupMessage.message}
                        {dbSetupMessage.success && (
                          <span className="block text-xs mt-1 opacity-70">
                            Refreshing page...
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {dbStatus.hasData && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Already initialized!</strong> Your database has sample data. To reset, delete your database file and run setup again.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Dev mode notice */}
              {isDev && currentStep.id !== 'database-init' && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Dev Mode:</strong> You can directly enter values above to save them to your <code className="bg-blue-100 px-1 rounded">.env</code> file. Restart the dev server after saving.
                  </p>
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-[#1F2A44] mb-4">
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
                className="px-4 py-2 text-[#2F5D50] hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Previous
              </button>
              <div className="flex gap-3">
                <a
                  href="/install"
                  className="px-4 py-2 text-[#2F5D50] hover:bg-gray-100 rounded-lg flex items-center gap-2"
                >
                  <Loader2 className="w-4 h-4" />
                  Refresh Status
                </a>
                {activeStep < SETUP_STEPS.length - 1 ? (
                  <button
                    onClick={() => setActiveStep((prev) => prev + 1)}
                    className="px-4 py-2 bg-[#2F5D50] text-white rounded-lg hover:bg-[#1F2A44] flex items-center gap-2"
                  >
                    Next Step
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <a
                    href="/"
                    className="px-4 py-2 bg-[#2F5D50] text-white rounded-lg hover:bg-[#1F2A44] flex items-center gap-2"
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
// INSTRUCTIONS RENDERER
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

    if (line.startsWith('```')) {
      if (inCodeBlock) {
        const code = codeBlock.join('\n');
        const blockKey = `code-${codeBlockIndex++}`;
        elements.push(
          <div key={blockKey} className="relative group my-4">
            <pre className="bg-[#1F2A44] text-green-400 p-4 rounded-lg overflow-x-auto text-sm font-mono">
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

    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={i} className="text-xl font-bold text-[#1F2A44] mt-6 mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
          {line.slice(3)}
        </h2>
      );
      continue;
    }

    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={i} className="text-lg font-semibold text-[#1F2A44] mt-4 mb-2">
          {line.slice(4)}
        </h3>
      );
      continue;
    }

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
            className="text-[#2F5D50] hover:underline"
          >
            {text}
          </a>
          {afterLink}
        </p>
      );
      continue;
    }

    if (line.includes('`')) {
      const parts = line.split(/(`[^`]+`)/g);
      elements.push(
        <p key={i} className="my-2 text-gray-700">
          {parts.map((part, j) =>
            part.startsWith('`') && part.endsWith('`') ? (
              <code
                key={j}
                className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono text-[#2F5D50]"
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

    if (line.startsWith('- ')) {
      elements.push(
        <li key={i} className="ml-4 text-gray-700">
          {line.slice(2)}
        </li>
      );
      continue;
    }

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
