// 👥 Users Management - All platform users in one place
// "Every user is a person with a purpose"
//
// ╭────────────────────────────────────────────────────────────╮
// │  USER DIRECTORY                                            │
// │  View and manage all users across the EnrollSage platform.  │
// │  Superadmins, school staff, and parents all in one view.  │
// ╰────────────────────────────────────────────────────────────╯

import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { useState } from 'react';
import {
  Users,
  Search,
  ChevronRight,
  Crown,
  Shield,
  User,
  Mail,
  Calendar,
  LogOut,
} from 'lucide-react';
import { validateSession, parseSessionCookie, createLogoutCookie } from '../../lib/auth';
import { getDb, users, schoolMembers, schools } from '../../db';
import { eq, desc, count, ne } from 'drizzle-orm';
import { cn } from '../../utils';

// ═══════════════════════════════════════════════════════════
// SERVER FUNCTIONS
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

const getUsers = createServerFn({ method: 'GET' }).handler(async () => {
  const db = getDb();

  try {
    const userList = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        emailVerified: users.emailVerified,
        createdAt: users.createdAt,
        lastLoginAt: users.lastLoginAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt));

    // Get school associations for admin users
    const usersWithSchools = await Promise.all(
      userList.map(async (user) => {
        if (user.role === 'admin') {
          const memberSchools = await db
            .select({
              schoolName: schools.name,
              schoolRole: schoolMembers.role,
            })
            .from(schoolMembers)
            .innerJoin(schools, eq(schools.id, schoolMembers.schoolId))
            .where(eq(schoolMembers.userId, user.id));

          return {
            ...user,
            schools: memberSchools,
          };
        }
        return { ...user, schools: [] };
      })
    );

    // Get stats
    const [totalCount] = await db.select({ count: count() }).from(users);
    const [superadminCount] = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.role, 'superadmin'));
    const [adminCount] = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.role, 'admin'));
    const [customerCount] = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.role, 'customer'));

    return {
      success: true,
      users: usersWithSchools,
      stats: {
        total: Number(totalCount?.count || 0),
        superadmins: Number(superadminCount?.count || 0),
        admins: Number(adminCount?.count || 0),
        customers: Number(customerCount?.count || 0),
      },
    };
  } catch (error) {
    console.error('Error fetching users:', error);
    return {
      success: false,
      users: [],
      stats: { total: 0, superadmins: 0, admins: 0, customers: 0 },
    };
  }
});

const logoutUser = createServerFn({ method: 'POST' }).handler(async () => {
  return { cookie: createLogoutCookie() };
});

// Helper for relative time
function formatRelativeTime(date: Date | null | undefined): string {
  if (!date) return 'Never';
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}

// ═══════════════════════════════════════════════════════════
// ROUTE DEFINITION
// ═══════════════════════════════════════════════════════════

export const Route = createFileRoute('/super-admin/users')({
  head: () => ({
    meta: [
      { title: 'Users | EnrollSage Super Admin' },
      { name: 'description', content: 'View and manage all users on the EnrollSage platform.' },
    ],
  }),
  loader: async () => {
    const [session, usersData] = await Promise.all([
      getSessionUser(),
      getUsers(),
    ]);
    return { ...session, ...usersData };
  },
  component: UsersPage,
});

// ═══════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════

function UsersPage() {
  const navigate = useNavigate();
  const { authenticated, user: currentUser, users: userList, stats } = Route.useLoaderData();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // 🚫 Auth check
  if (!authenticated || !currentUser || currentUser.role !== 'superadmin') {
    navigate({ to: '/login' });
    return null;
  }

  const handleLogout = async () => {
    const result = await logoutUser();
    if (result.cookie) document.cookie = result.cookie;
    navigate({ to: '/login' });
  };

  // Filter users
  const filteredUsers = userList.filter((user) => {
    const matchesSearch =
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="min-h-screen bg-[#F8F9F6]">
      {/* Top Navigation */}
      <nav className="bg-[#2D4F3E] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Link to="/" className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#5B7F6D] rounded-lg flex items-center justify-center">
                  <span className="text-lg">🌿</span>
                </div>
                <span className="font-bold text-lg font-display">EnrollSage</span>
              </Link>
              <span className="text-xs bg-white/10 px-2 py-1 rounded">Super Admin</span>
            </div>

            <div className="flex items-center gap-6">
              <Link to="/super-admin" className="text-white/70 hover:text-white text-sm">Dashboard</Link>
              <Link to="/super-admin/schools" className="text-white/70 hover:text-white text-sm">Schools</Link>
              <Link to="/super-admin/users" className="text-white text-sm font-medium">Users</Link>
              <button onClick={handleLogout} className="flex items-center gap-2 text-white/70 hover:text-white text-sm">
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#2D4F3E] font-display flex items-center gap-3">
              <Users className="w-8 h-8 text-[#5B7F6D]" />
              Users
            </h1>
            <p className="text-gray-600">
              {stats.superadmins} superadmins, {stats.admins} school staff, {stats.customers} families
            </p>
          </div>
        </div>

        {/* Role Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { value: 'all', label: 'All Users', count: stats.total },
            { value: 'superadmin', label: 'Superadmins', count: stats.superadmins },
            { value: 'admin', label: 'School Staff', count: stats.admins },
            { value: 'customer', label: 'Families', count: stats.customers },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setRoleFilter(tab.value)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors',
                roleFilter === tab.value
                  ? 'bg-[#5B7F6D] text-white border-[#5B7F6D]'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              )}
            >
              {tab.label}
              <span className={cn(
                'text-xs px-2 py-0.5 rounded-full',
                roleFilter === tab.value ? 'bg-white/20' : 'bg-gray-100'
              )}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:border-[#5B7F6D] focus:ring-2 focus:ring-[#5B7F6D]/10"
            />
          </div>
        </div>

        {/* Users List */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {filteredUsers.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        'w-12 h-12 rounded-full flex items-center justify-center',
                        user.role === 'superadmin'
                          ? 'bg-purple-100'
                          : user.role === 'admin'
                            ? 'bg-blue-100'
                            : 'bg-green-100'
                      )}>
                        {user.role === 'superadmin' ? (
                          <Crown className="w-6 h-6 text-purple-600" />
                        ) : user.role === 'admin' ? (
                          <Shield className="w-6 h-6 text-blue-600" />
                        ) : (
                          <User className="w-6 h-6 text-green-600" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-[#2D4F3E]">
                          {user.firstName} {user.lastName}
                          {user.id === currentUser.id && (
                            <span className="text-xs text-gray-500 font-normal ml-2">(you)</span>
                          )}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                          <Mail className="w-3 h-3" /> {user.email}
                          {!user.emailVerified && (
                            <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                              Unverified
                            </span>
                          )}
                        </div>
                        {user.schools && user.schools.length > 0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            {user.schools.map((s, i) => (
                              <span key={i}>
                                {i > 0 && ', '}
                                {s.schoolName} ({s.schoolRole})
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="text-sm text-gray-600">
                          Last login: {formatRelativeTime(user.lastLoginAt)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1 flex items-center gap-1 justify-end">
                          <Calendar className="w-3 h-3" />
                          Joined {formatRelativeTime(user.createdAt)}
                        </div>
                      </div>
                      <RoleBadge role={user.role || 'customer'} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <Users className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <h3 className="font-semibold text-gray-700 mb-2">No users found</h3>
              <p className="text-gray-500">
                {searchQuery || roleFilter !== 'all'
                  ? 'Try adjusting your search or filter'
                  : 'Users will appear here as they register'}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, string> = {
    superadmin: 'bg-purple-100 text-purple-700',
    admin: 'bg-blue-100 text-blue-700',
    customer: 'bg-green-100 text-green-700',
  };

  const labels: Record<string, string> = {
    superadmin: 'Superadmin',
    admin: 'School Staff',
    customer: 'Family',
  };

  return (
    <span className={cn('text-xs px-3 py-1 rounded-full font-medium', styles[role] || 'bg-gray-100 text-gray-600')}>
      {labels[role] || role}
    </span>
  );
}
