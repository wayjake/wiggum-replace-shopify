// 👑 Super Admin Dashboard - The command center for platform operations
// "With great power comes great responsibility" - Uncle Ben, before deploying to prod
//
// ╭────────────────────────────────────────────────────────────╮
// │  🛡️ SUPERADMIN ONLY                                        │
// │  This dashboard is for Enrollsy platform administrators.   │
// │  Manage schools, monitor usage, and configure platform.    │
// ╰────────────────────────────────────────────────────────────╯

import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import {
  validateSession,
  parseSessionCookie,
  createLogoutCookie,
} from '../../lib/auth';
import { getDb, schools, users, households, students } from '../../db';
import { count, desc } from 'drizzle-orm';
import {
  Building2,
  Users,
  GraduationCap,
  Home,
  Plus,
  LogOut,
  Settings,
  Activity,
  TrendingUp,
} from 'lucide-react';
import { cn } from '../../utils';

// ═══════════════════════════════════════════════════════════
// SERVER FUNCTIONS - The data fetchers for our dashboard
// ═══════════════════════════════════════════════════════════

const getSessionUser = createServerFn({ method: 'GET' }).handler(async () => {
  const request = getRequest();
  const cookieHeader = request?.headers.get('cookie') || '';
  const sessionId = parseSessionCookie(cookieHeader);

  if (!sessionId) {
    return { authenticated: false, user: null };
  }

  const session = await validateSession(sessionId);
  if (!session) {
    return { authenticated: false, user: null };
  }

  return {
    authenticated: true,
    user: session.user,
  };
});

const getDashboardStats = createServerFn({ method: 'GET' }).handler(async () => {
  const db = getDb();

  // Get counts for all major entities
  const [schoolCount] = await db.select({ count: count() }).from(schools);
  const [userCount] = await db.select({ count: count() }).from(users);
  const [householdCount] = await db.select({ count: count() }).from(households);
  const [studentCount] = await db.select({ count: count() }).from(students);

  // Get recent schools
  const recentSchools = await db
    .select({
      id: schools.id,
      name: schools.name,
      slug: schools.slug,
      status: schools.status,
      createdAt: schools.createdAt,
    })
    .from(schools)
    .orderBy(desc(schools.createdAt))
    .limit(5);

  return {
    stats: {
      schools: schoolCount?.count || 0,
      users: userCount?.count || 0,
      households: householdCount?.count || 0,
      students: studentCount?.count || 0,
    },
    recentSchools,
  };
});

const logoutUser = createServerFn({ method: 'POST' }).handler(async () => {
  return { cookie: createLogoutCookie() };
});

// ═══════════════════════════════════════════════════════════
// ROUTE DEFINITION
// ═══════════════════════════════════════════════════════════

export const Route = createFileRoute('/super-admin/')({
  head: () => ({
    meta: [
      { title: 'Platform Dashboard | Enrollsy Super Admin' },
      {
        name: 'description',
        content: 'Manage schools, monitor platform usage, and configure Enrollsy settings.',
      },
    ],
  }),
  loader: async () => {
    const [session, dashboard] = await Promise.all([
      getSessionUser(),
      getDashboardStats(),
    ]);

    return {
      ...session,
      ...dashboard,
    };
  },
  component: SuperAdminDashboard,
});

function SuperAdminDashboard() {
  const navigate = useNavigate();
  const { authenticated, user, stats, recentSchools } = Route.useLoaderData();

  // 🚫 Redirect if not authenticated or not superadmin
  if (!authenticated || !user) {
    navigate({ to: '/login' });
    return null;
  }

  if (user.role !== 'superadmin') {
    // Not authorized - redirect based on role
    if (user.role === 'admin') {
      navigate({ to: '/admin' });
    } else {
      navigate({ to: '/portal' });
    }
    return null;
  }

  const handleLogout = async () => {
    const result = await logoutUser();
    if (result.cookie) {
      document.cookie = result.cookie;
    }
    navigate({ to: '/login' });
  };

  return (
    <div className="min-h-screen bg-[#F7F5F2]">
      {/* Top Navigation */}
      <nav className="bg-[#1F2A44] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#2F5D50] rounded-lg flex items-center justify-center">
                <span className="text-lg">🎓</span>
              </div>
              <span className="font-bold text-lg font-display">Enrollsy</span>
              <span className="text-xs bg-white/10 px-2 py-1 rounded">Super Admin</span>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-white/70">
                {user.firstName} {user.lastName}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#1F2A44] font-display">
            Platform Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Monitor and manage all Enrollsy schools from one place.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={Building2}
            label="Schools"
            value={stats.schools}
            color="bg-[#2F5D50]"
          />
          <StatCard
            icon={Users}
            label="Users"
            value={stats.users}
            color="bg-[#1F2A44]"
          />
          <StatCard
            icon={Home}
            label="Households"
            value={stats.households}
            color="bg-amber-600"
          />
          <StatCard
            icon={GraduationCap}
            label="Students"
            value={stats.students}
            color="bg-blue-600"
          />
        </div>

        {/* Quick Actions & Recent Schools */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-[#1F2A44] mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Quick Actions
              </h2>
              <div className="space-y-3">
                <QuickAction
                  icon={Plus}
                  label="Create New School"
                  href="/super-admin/schools/new"
                />
                <QuickAction
                  icon={Building2}
                  label="View All Schools"
                  href="/super-admin/schools"
                />
                <QuickAction
                  icon={Users}
                  label="Manage Users"
                  href="/super-admin/users"
                />
                <QuickAction
                  icon={Settings}
                  label="Platform Settings"
                  href="/super-admin/settings"
                />
              </div>
            </div>
          </div>

          {/* Recent Schools */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[#1F2A44] flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Recent Schools
                </h2>
                <a
                  href="/super-admin/schools"
                  className="text-sm text-[#2F5D50] hover:underline"
                >
                  View all
                </a>
              </div>

              {recentSchools.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No schools yet</p>
                  <a
                    href="/super-admin/schools/new"
                    className="text-[#2F5D50] hover:underline text-sm"
                  >
                    Create your first school
                  </a>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentSchools.map((school) => (
                    <div
                      key={school.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#2F5D50] rounded-lg flex items-center justify-center text-white">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium text-[#1F2A44]">{school.name}</p>
                          <p className="text-sm text-gray-500">/{school.slug}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            'text-xs px-2 py-1 rounded-full',
                            school.status === 'active'
                              ? 'bg-green-100 text-green-700'
                              : school.status === 'trial'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-gray-100 text-gray-700'
                          )}
                        >
                          {school.status}
                        </span>
                        <a
                          href={`/super-admin/schools/${school.id}`}
                          className="text-[#2F5D50] hover:underline text-sm"
                        >
                          Manage
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Platform Health Section */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-[#1F2A44] mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Platform Health
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <HealthCard
              label="Database"
              status="healthy"
              detail="All connections stable"
            />
            <HealthCard
              label="Email Service"
              status="healthy"
              detail="Brevo connected"
            />
            <HealthCard
              label="Payment Processing"
              status="warning"
              detail="Configure Stripe Connect"
            />
          </div>
        </div>
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// HELPER COMPONENTS
// ═══════════════════════════════════════════════════════════

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-4">
        <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center text-white', color)}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-2xl font-bold text-[#1F2A44]">{value}</p>
          <p className="text-sm text-gray-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

function QuickAction({
  icon: Icon,
  label,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
}) {
  return (
    <a
      href={href}
      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
    >
      <div className="w-8 h-8 bg-[#2F5D50]/10 rounded-lg flex items-center justify-center text-[#2F5D50] group-hover:bg-[#2F5D50] group-hover:text-white transition-colors">
        <Icon className="w-4 h-4" />
      </div>
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </a>
  );
}

function HealthCard({
  label,
  status,
  detail,
}: {
  label: string;
  status: 'healthy' | 'warning' | 'error';
  detail: string;
}) {
  const statusColors = {
    healthy: 'bg-green-100 text-green-700',
    warning: 'bg-amber-100 text-amber-700',
    error: 'bg-red-100 text-red-700',
  };

  const statusDot = {
    healthy: 'bg-green-500',
    warning: 'bg-amber-500',
    error: 'bg-red-500',
  };

  return (
    <div className="p-4 rounded-lg bg-gray-50">
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-[#1F2A44]">{label}</span>
        <span className={cn('text-xs px-2 py-1 rounded-full', statusColors[status])}>
          <span className={cn('inline-block w-2 h-2 rounded-full mr-1', statusDot[status])} />
          {status}
        </span>
      </div>
      <p className="text-sm text-gray-500">{detail}</p>
    </div>
  );
}
