// 👧 Students - The reason we do what we do
// "Every student deserves to be seen, heard, and educated"
//
// ╭────────────────────────────────────────────────────────────╮
// │  STUDENT DIRECTORY                                          │
// │  View and manage all students across the school.           │
// │  Filter by grade, enrollment status, and more.             │
// ╰────────────────────────────────────────────────────────────╯

import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { useState, useEffect } from 'react';
import {
  GraduationCap,
  Search,
  Filter,
  ChevronRight,
  User,
  Home,
  Calendar,
  LogOut,
} from 'lucide-react';
import { requireAdmin } from '../../lib/auth-guards';
import { getDb, students, households } from '../../db';
import { eq, desc, count } from 'drizzle-orm';
import { cn } from '../../utils';
import { createLogoutCookie } from '../../lib/auth';

// ═══════════════════════════════════════════════════════════
// SERVER FUNCTIONS
// ═══════════════════════════════════════════════════════════

const getStudents = createServerFn({ method: 'GET' }).handler(async () => {
  const db = getDb();

  try {
    const studentList = await db
      .select({
        id: students.id,
        firstName: students.firstName,
        lastName: students.lastName,
        preferredName: students.preferredName,
        dateOfBirth: students.dateOfBirth,
        gender: students.gender,
        gradeLevel: students.gradeLevel,
        enrollmentStatus: students.enrollmentStatus,
        enrolledDate: students.enrolledDate,
        householdId: students.householdId,
        createdAt: students.createdAt,
      })
      .from(students)
      .orderBy(desc(students.createdAt));

    // Get household names for each student
    const studentsWithHouseholds = await Promise.all(
      studentList.map(async (s) => {
        const [household] = await db
          .select({ name: households.name })
          .from(households)
          .where(eq(households.id, s.householdId));

        return {
          ...s,
          householdName: household?.name || 'Unknown',
        };
      })
    );

    // Get stats
    const [totalCount] = await db.select({ count: count() }).from(students);
    const [enrolledCount] = await db
      .select({ count: count() })
      .from(students)
      .where(eq(students.enrollmentStatus, 'enrolled'));
    const [applicantCount] = await db
      .select({ count: count() })
      .from(students)
      .where(eq(students.enrollmentStatus, 'applicant'));

    return {
      success: true,
      students: studentsWithHouseholds,
      stats: {
        total: Number(totalCount?.count || 0),
        enrolled: Number(enrolledCount?.count || 0),
        applicants: Number(applicantCount?.count || 0),
      },
    };
  } catch (error) {
    console.error('Error fetching students:', error);
    return {
      success: false,
      students: [],
      stats: { total: 0, enrolled: 0, applicants: 0 },
    };
  }
});

const logoutUser = createServerFn({ method: 'POST' }).handler(async () => {
  return { cookie: createLogoutCookie() };
});

// ═══════════════════════════════════════════════════════════
// ROUTE DEFINITION
// ═══════════════════════════════════════════════════════════

export const Route = createFileRoute('/admin/students')({
  head: () => ({
    meta: [
      { title: 'Students | School Dashboard | Enrollsy' },
      { name: 'description', content: 'View and manage all students in your school.' },
    ],
  }),
  loader: async () => {
    const [authResult, studentsData] = await Promise.all([
      requireAdmin(),
      getStudents(),
    ]);
    return { authResult, ...studentsData };
  },
  component: StudentsPage,
});

// ═══════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════

function StudentsPage() {
  const navigate = useNavigate();
  const { authResult, students: studentList, stats } = Route.useLoaderData();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [gradeFilter, setGradeFilter] = useState<string>('all');

  useEffect(() => {
    if (!authResult.authenticated || !authResult.isAdmin) {
      navigate({ to: authResult.redirect || '/login' });
    }
  }, [authResult, navigate]);

  if (!authResult.authenticated || !authResult.isAdmin) {
    return (
      <div className="min-h-screen bg-[#F7F5F2] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#2F5D50] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleLogout = async () => {
    const result = await logoutUser();
    if (result.cookie) document.cookie = result.cookie;
    navigate({ to: '/login' });
  };

  // Get unique grades
  const grades = [...new Set(studentList.map((s) => s.gradeLevel).filter(Boolean))].sort();

  // Filter students
  const filteredStudents = studentList.filter((s) => {
    const matchesSearch =
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.householdName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || s.enrollmentStatus === statusFilter;
    const matchesGrade = gradeFilter === 'all' || s.gradeLevel === gradeFilter;
    return matchesSearch && matchesStatus && matchesGrade;
  });

  return (
    <div className="min-h-screen bg-[#F7F5F2]">
      {/* Admin Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link to="/" className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#2F5D50] rounded-lg flex items-center justify-center">
                  <span className="text-xl">🎓</span>
                </div>
                <div>
                  <h1 className="text-lg font-bold text-[#1F2A44] font-display">School Dashboard</h1>
                  <p className="text-xs text-gray-500">Westlake Academy</p>
                </div>
              </Link>
            </div>
            <nav className="flex items-center gap-6">
              <Link to="/admin" className="text-gray-600 hover:text-[#2F5D50]">Dashboard</Link>
              <a href="/admin/applications" className="text-gray-600 hover:text-[#2F5D50]">Applications</a>
              <a href="/admin/leads" className="text-gray-600 hover:text-[#2F5D50]">Leads</a>
              <Link to="/admin/families" className="text-gray-600 hover:text-[#2F5D50]">Families</Link>
              <Link to="/admin/students" className="text-[#2F5D50] font-medium">Students</Link>
              <button onClick={handleLogout} className="flex items-center gap-1 text-gray-500 hover:text-[#2F5D50] text-sm">
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
            <h2 className="text-2xl font-bold text-[#1F2A44] font-display flex items-center gap-3">
              <GraduationCap className="w-7 h-7 text-[#2F5D50]" />
              Students
            </h2>
            <p className="text-gray-600">
              {stats.enrolled} enrolled, {stats.applicants} applicants, {stats.total} total
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search students or families..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:border-[#2F5D50] focus:ring-2 focus:ring-[#2F5D50]/10"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:border-[#2F5D50] focus:ring-2 focus:ring-[#2F5D50]/10"
          >
            <option value="all">All Statuses</option>
            <option value="enrolled">Enrolled</option>
            <option value="applicant">Applicant</option>
            <option value="accepted">Accepted</option>
            <option value="withdrawn">Withdrawn</option>
            <option value="graduated">Graduated</option>
          </select>

          {/* Grade Filter */}
          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:border-[#2F5D50] focus:ring-2 focus:ring-[#2F5D50]/10"
          >
            <option value="all">All Grades</option>
            {grades.map((grade) => (
              <option key={grade} value={grade}>
                {grade === 'PK' ? 'Pre-K' : grade === 'K' ? 'Kindergarten' : `Grade ${grade}`}
              </option>
            ))}
          </select>
        </div>

        {/* Students List */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {filteredStudents.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {filteredStudents.map((student) => (
                <Link
                  key={student.id}
                  to={`/admin/students/${student.id}`}
                  className="block p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        'w-12 h-12 rounded-full flex items-center justify-center',
                        student.gender === 'female' ? 'bg-pink-100' : student.gender === 'male' ? 'bg-blue-100' : 'bg-gray-100'
                      )}>
                        <User className={cn(
                          'w-6 h-6',
                          student.gender === 'female' ? 'text-pink-600' : student.gender === 'male' ? 'text-blue-600' : 'text-gray-600'
                        )} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-[#1F2A44]">
                          {student.firstName} {student.lastName}
                          {student.preferredName && student.preferredName !== student.firstName && (
                            <span className="text-gray-500 font-normal"> ({student.preferredName})</span>
                          )}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                          <span className="flex items-center gap-1">
                            <Home className="w-3 h-3" /> {student.householdName}
                          </span>
                          {student.dateOfBirth && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> {student.dateOfBirth}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      {student.gradeLevel && (
                        <div className="text-right">
                          <span className="text-sm font-medium text-[#1F2A44]">
                            {student.gradeLevel === 'PK' ? 'Pre-K' : student.gradeLevel === 'K' ? 'Kindergarten' : `Grade ${student.gradeLevel}`}
                          </span>
                        </div>
                      )}
                      <StatusBadge status={student.enrollmentStatus || 'unknown'} />
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <GraduationCap className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <h3 className="font-semibold text-gray-700 mb-2">
                {searchQuery || statusFilter !== 'all' || gradeFilter !== 'all'
                  ? 'No students found'
                  : 'No students yet'}
              </h3>
              <p className="text-gray-500">
                {searchQuery || statusFilter !== 'all' || gradeFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Students will appear here once families register'}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    enrolled: 'bg-green-100 text-green-700',
    applicant: 'bg-blue-100 text-blue-700',
    accepted: 'bg-purple-100 text-purple-700',
    withdrawn: 'bg-gray-100 text-gray-600',
    graduated: 'bg-[#2F5D50]/20 text-[#2F5D50]',
    unknown: 'bg-gray-100 text-gray-600',
  };

  const labels: Record<string, string> = {
    enrolled: 'Enrolled',
    applicant: 'Applicant',
    accepted: 'Accepted',
    withdrawn: 'Withdrawn',
    graduated: 'Graduated',
    unknown: 'Unknown',
  };

  return (
    <span className={cn('text-xs px-2 py-1 rounded-full', styles[status] || styles.unknown)}>
      {labels[status] || status}
    </span>
  );
}
