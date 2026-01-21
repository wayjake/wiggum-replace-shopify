// 👨‍👩‍👧‍👦 Families (Households) - The heart of every school
// "Behind every enrolled student is a family making sacrifices for their education"
//
// ╭────────────────────────────────────────────────────────────╮
// │  FAMILY MANAGEMENT                                          │
// │  View, search, and manage family households. Each family   │
// │  can have multiple students and guardians.                  │
// ╰────────────────────────────────────────────────────────────╯

import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { useState, useEffect } from 'react';
import {
  Home,
  Users,
  Search,
  Plus,
  ChevronRight,
  Phone,
  Mail,
  GraduationCap,
  LogOut,
} from 'lucide-react';
import { requireAdmin } from '../../lib/auth-guards';
import { getDb, households, students, guardians } from '../../db';
import { eq, desc, count, like, or } from 'drizzle-orm';
import { cn } from '../../utils';
import { createLogoutCookie } from '../../lib/auth';

// ═══════════════════════════════════════════════════════════
// SERVER FUNCTIONS
// ═══════════════════════════════════════════════════════════

const getFamilies = createServerFn({ method: 'GET' }).handler(async () => {
  const db = getDb();

  try {
    const householdList = await db
      .select({
        id: households.id,
        name: households.name,
        primaryEmail: households.primaryEmail,
        primaryPhone: households.primaryPhone,
        status: households.status,
        createdAt: households.createdAt,
      })
      .from(households)
      .orderBy(desc(households.createdAt));

    // Get student and guardian counts for each household
    const householdsWithCounts = await Promise.all(
      householdList.map(async (h) => {
        const [studentCount] = await db
          .select({ count: count() })
          .from(students)
          .where(eq(students.householdId, h.id));

        const [guardianCount] = await db
          .select({ count: count() })
          .from(guardians)
          .where(eq(guardians.householdId, h.id));

        // Get enrolled student count
        const [enrolledCount] = await db
          .select({ count: count() })
          .from(students)
          .where(
            eq(students.householdId, h.id)
          );

        return {
          ...h,
          studentCount: Number(studentCount?.count || 0),
          guardianCount: Number(guardianCount?.count || 0),
          enrolledCount: Number(enrolledCount?.count || 0),
        };
      })
    );

    return { success: true, families: householdsWithCounts };
  } catch (error) {
    console.error('Error fetching families:', error);
    return { success: false, families: [] };
  }
});

const logoutUser = createServerFn({ method: 'POST' }).handler(async () => {
  return { cookie: createLogoutCookie() };
});

// ═══════════════════════════════════════════════════════════
// ROUTE DEFINITION
// ═══════════════════════════════════════════════════════════

export const Route = createFileRoute('/admin/families')({
  head: () => ({
    meta: [
      { title: 'Families | School Dashboard | EnrollSage' },
      { name: 'description', content: 'Manage family households and their enrolled students.' },
    ],
  }),
  loader: async () => {
    const [authResult, familiesData] = await Promise.all([
      requireAdmin(),
      getFamilies(),
    ]);
    return { authResult, ...familiesData };
  },
  component: FamiliesPage,
});

// ═══════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════

function FamiliesPage() {
  const navigate = useNavigate();
  const { authResult, families } = Route.useLoaderData();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!authResult.authenticated || !authResult.isAdmin) {
      navigate({ to: authResult.redirect || '/login' });
    }
  }, [authResult, navigate]);

  if (!authResult.authenticated || !authResult.isAdmin) {
    return (
      <div className="min-h-screen bg-[#F8F9F6] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#5B7F6D] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleLogout = async () => {
    const result = await logoutUser();
    if (result.cookie) document.cookie = result.cookie;
    navigate({ to: '/login' });
  };

  // Filter families by search query
  const filteredFamilies = families.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.primaryEmail?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F8F9F6]">
      {/* Admin Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link to="/" className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#5B7F6D] rounded-lg flex items-center justify-center">
                  <span className="text-xl">🌿</span>
                </div>
                <div>
                  <h1 className="text-lg font-bold text-[#2D4F3E] font-display">School Dashboard</h1>
                  <p className="text-xs text-gray-500">Westlake Academy</p>
                </div>
              </Link>
            </div>
            <nav className="flex items-center gap-6">
              <Link to="/admin" className="text-gray-600 hover:text-[#5B7F6D]">Dashboard</Link>
              <a href="/admin/applications" className="text-gray-600 hover:text-[#5B7F6D]">Applications</a>
              <a href="/admin/leads" className="text-gray-600 hover:text-[#5B7F6D]">Leads</a>
              <Link to="/admin/families" className="text-[#5B7F6D] font-medium">Families</Link>
              <a href="/admin/students" className="text-gray-600 hover:text-[#5B7F6D]">Students</a>
              <button onClick={handleLogout} className="flex items-center gap-1 text-gray-500 hover:text-[#5B7F6D] text-sm">
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-[#2D4F3E] font-display flex items-center gap-3">
              <Home className="w-7 h-7 text-[#5B7F6D]" />
              Families
            </h2>
            <p className="text-gray-600">{families.length} households registered</p>
          </div>
          <a
            href="/admin/families/new"
            className="flex items-center gap-2 bg-[#5B7F6D] text-white px-4 py-2 rounded-lg hover:bg-[#2D4F3E] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Family
          </a>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search families by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:border-[#5B7F6D] focus:ring-2 focus:ring-[#5B7F6D]/10"
            />
          </div>
        </div>

        {/* Families List */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {filteredFamilies.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {filteredFamilies.map((family) => (
                <Link
                  key={family.id}
                  to={`/admin/families/${family.id}`}
                  className="block p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-[#5B7F6D]/10 rounded-full flex items-center justify-center">
                        <Home className="w-6 h-6 text-[#5B7F6D]" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-[#2D4F3E]">{family.name}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                          {family.primaryEmail && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" /> {family.primaryEmail}
                            </span>
                          )}
                          {family.primaryPhone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" /> {family.primaryPhone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <GraduationCap className="w-4 h-4" />
                          {family.studentCount} student{family.studentCount !== 1 ? 's' : ''}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                          <Users className="w-4 h-4" />
                          {family.guardianCount} guardian{family.guardianCount !== 1 ? 's' : ''}
                        </div>
                      </div>
                      <span className={cn(
                        'text-xs px-2 py-1 rounded-full',
                        family.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      )}>
                        {family.status}
                      </span>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <Home className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <h3 className="font-semibold text-gray-700 mb-2">
                {searchQuery ? 'No families found' : 'No families yet'}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchQuery
                  ? 'Try adjusting your search query'
                  : 'Get started by adding your first family'}
              </p>
              {!searchQuery && (
                <a
                  href="/admin/families/new"
                  className="inline-flex items-center gap-2 bg-[#5B7F6D] text-white px-4 py-2 rounded-lg hover:bg-[#2D4F3E]"
                >
                  <Plus className="w-4 h-4" />
                  Add Family
                </a>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
