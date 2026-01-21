// 👨‍👩‍👧‍👦 Register New Family - Building relationships that last
// "Every family has a story, we help them write the next chapter"
//
// ╭────────────────────────────────────────────────────────────╮
// │  FAMILY REGISTRATION                                        │
// │  Create a new household with guardians and students.        │
// │  The foundation of the enrollment journey.                 │
// ╰────────────────────────────────────────────────────────────╯

import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { useState, useEffect } from 'react';
import {
  Home,
  ArrowLeft,
  ArrowRight,
  User,
  Users,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  Plus,
  Trash2,
  LogOut,
  AlertCircle,
  Check,
} from 'lucide-react';
import { requireAdmin } from '../../../lib/auth-guards';
import { getDb, schools, households, guardians, students } from '../../../db';
import { cn } from '../../../utils';
import { createLogoutCookie } from '../../../lib/auth';

// ═══════════════════════════════════════════════════════════
// SERVER FUNCTIONS
// ═══════════════════════════════════════════════════════════

const getSchoolData = createServerFn({ method: 'GET' }).handler(async () => {
  const db = getDb();
  const [school] = await db.select().from(schools).limit(1);

  return {
    school: school ? {
      id: school.id,
      name: school.name,
      currentSchoolYear: school.currentSchoolYear || '2025-2026',
      gradesOffered: school.gradesOffered ? JSON.parse(school.gradesOffered) : [],
    } : null,
  };
});

const createFamily = createServerFn({ method: 'POST' }).handler(
  async (input: {
    data: {
      schoolId: string;
      householdName?: string;
      addressLine1?: string;
      addressLine2?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      guardians: Array<{
        firstName: string;
        lastName: string;
        email?: string;
        phone?: string;
        relationship?: string;
        isPrimary?: boolean;
      }>;
      students: Array<{
        firstName: string;
        lastName: string;
        dateOfBirth?: string;
        gradeLevel?: string;
        gender?: string;
      }>;
    };
  }) => {
    const { data } = input;
    const db = getDb();

    try {
      // Derive household name from primary guardian if not provided
      const primaryGuardian = data.guardians.find(g => g.isPrimary) || data.guardians[0];
      const householdName = data.householdName || `The ${primaryGuardian.lastName} Family`;

      // Create household
      const [newHousehold] = await db
        .insert(households)
        .values({
          schoolId: data.schoolId,
          name: householdName,
          primaryEmail: primaryGuardian?.email || null,
          primaryPhone: primaryGuardian?.phone || null,
          addressLine1: data.addressLine1 || null,
          addressLine2: data.addressLine2 || null,
          city: data.city || null,
          state: data.state || null,
          postalCode: data.postalCode || null,
          status: 'active',
        })
        .returning({ id: households.id });

      // Create guardians
      for (const guardian of data.guardians) {
        await db.insert(guardians).values({
          householdId: newHousehold.id,
          firstName: guardian.firstName,
          lastName: guardian.lastName,
          email: guardian.email || null,
          phone: guardian.phone || null,
          relationship: guardian.relationship as any || null,
          isPrimary: guardian.isPrimary || false,
          hasPortalAccess: true,
          isBillingContact: guardian.isPrimary || false,
        });
      }

      // Create students
      for (const student of data.students) {
        await db.insert(students).values({
          schoolId: data.schoolId,
          householdId: newHousehold.id,
          firstName: student.firstName,
          lastName: student.lastName,
          dateOfBirth: student.dateOfBirth || null,
          gradeLevel: student.gradeLevel || null,
          gender: student.gender as any || null,
          enrollmentStatus: 'prospective',
        });
      }

      return { success: true, householdId: newHousehold.id };
    } catch (error) {
      console.error('Create family error:', error);
      return { success: false, error: 'Failed to create family' };
    }
  }
);

const logoutUser = createServerFn({ method: 'POST' }).handler(async () => {
  return { cookie: createLogoutCookie() };
});

// ═══════════════════════════════════════════════════════════
// ROUTE DEFINITION
// ═══════════════════════════════════════════════════════════

export const Route = createFileRoute('/admin/families/new')({
  head: () => ({
    meta: [
      { title: 'Register Family | School Dashboard | EnrollSage' },
      { name: 'description', content: 'Register a new family in the school.' },
    ],
  }),
  loader: async () => {
    const [authResult, schoolData] = await Promise.all([
      requireAdmin(),
      getSchoolData(),
    ]);
    return { authResult, ...schoolData };
  },
  component: RegisterFamilyPage,
});

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

type GuardianForm = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  relationship: string;
  isPrimary: boolean;
};

type StudentForm = {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gradeLevel: string;
  gender: string;
};

// ═══════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════

function RegisterFamilyPage() {
  const navigate = useNavigate();
  const { authResult, school } = Route.useLoaderData();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);

  // Form state
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');

  const [guardiansList, setGuardiansList] = useState<GuardianForm[]>([
    { id: '1', firstName: '', lastName: '', email: '', phone: '', relationship: 'mother', isPrimary: true },
  ]);

  const [studentsList, setStudentsList] = useState<StudentForm[]>([
    { id: '1', firstName: '', lastName: '', dateOfBirth: '', gradeLevel: '', gender: '' },
  ]);

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

  const addGuardian = () => {
    setGuardiansList([
      ...guardiansList,
      { id: Date.now().toString(), firstName: '', lastName: '', email: '', phone: '', relationship: 'father', isPrimary: false },
    ]);
  };

  const removeGuardian = (id: string) => {
    if (guardiansList.length > 1) {
      const updated = guardiansList.filter(g => g.id !== id);
      // Make sure at least one is primary
      if (!updated.some(g => g.isPrimary)) {
        updated[0].isPrimary = true;
      }
      setGuardiansList(updated);
    }
  };

  const updateGuardian = (id: string, field: keyof GuardianForm, value: string | boolean) => {
    setGuardiansList(guardiansList.map(g => {
      if (g.id === id) {
        if (field === 'isPrimary' && value === true) {
          // Only one primary
          return { ...g, isPrimary: true };
        }
        return { ...g, [field]: value };
      }
      if (field === 'isPrimary' && value === true) {
        return { ...g, isPrimary: false };
      }
      return g;
    }));
  };

  const addStudent = () => {
    setStudentsList([
      ...studentsList,
      { id: Date.now().toString(), firstName: '', lastName: '', dateOfBirth: '', gradeLevel: '', gender: '' },
    ]);
  };

  const removeStudent = (id: string) => {
    if (studentsList.length > 1) {
      setStudentsList(studentsList.filter(s => s.id !== id));
    }
  };

  const updateStudent = (id: string, field: keyof StudentForm, value: string) => {
    setStudentsList(studentsList.map(s =>
      s.id === id ? { ...s, [field]: value } : s
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate guardians
    const hasValidGuardian = guardiansList.some(g => g.firstName.trim() && g.lastName.trim());
    if (!hasValidGuardian) {
      setError('At least one guardian with a name is required');
      return;
    }

    // Validate students
    const hasValidStudent = studentsList.some(s => s.firstName.trim() && s.lastName.trim());
    if (!hasValidStudent) {
      setError('At least one student with a name is required');
      return;
    }

    if (!school) {
      setError('No school configured');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createFamily({
        data: {
          schoolId: school.id,
          addressLine1: addressLine1.trim() || undefined,
          addressLine2: addressLine2.trim() || undefined,
          city: city.trim() || undefined,
          state: state.trim() || undefined,
          postalCode: postalCode.trim() || undefined,
          guardians: guardiansList
            .filter(g => g.firstName.trim() && g.lastName.trim())
            .map(g => ({
              firstName: g.firstName.trim(),
              lastName: g.lastName.trim(),
              email: g.email.trim() || undefined,
              phone: g.phone.trim() || undefined,
              relationship: g.relationship || undefined,
              isPrimary: g.isPrimary,
            })),
          students: studentsList
            .filter(s => s.firstName.trim() && s.lastName.trim())
            .map(s => ({
              firstName: s.firstName.trim(),
              lastName: s.lastName.trim(),
              dateOfBirth: s.dateOfBirth || undefined,
              gradeLevel: s.gradeLevel || undefined,
              gender: s.gender || undefined,
            })),
        },
      });

      if (!result.success) {
        setError(result.error || 'Failed to create family');
        setIsSubmitting(false);
        return;
      }

      navigate({ to: '/admin/families' });
    } catch (err) {
      console.error('Submit error:', err);
      setError('An unexpected error occurred');
      setIsSubmitting(false);
    }
  };

  const grades = school?.gradesOffered?.length > 0
    ? school.gradesOffered
    : ['PK', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

  const relationships = [
    { value: 'mother', label: 'Mother' },
    { value: 'father', label: 'Father' },
    { value: 'stepmother', label: 'Stepmother' },
    { value: 'stepfather', label: 'Stepfather' },
    { value: 'grandmother', label: 'Grandmother' },
    { value: 'grandfather', label: 'Grandfather' },
    { value: 'guardian', label: 'Guardian' },
    { value: 'other', label: 'Other' },
  ];

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
                  <p className="text-xs text-gray-500">{school?.name || 'EnrollSage'}</p>
                </div>
              </Link>
            </div>
            <nav className="flex items-center gap-6">
              <Link to="/admin" className="text-gray-600 hover:text-[#5B7F6D]">Dashboard</Link>
              <Link to="/admin/applications" className="text-gray-600 hover:text-[#5B7F6D]">Applications</Link>
              <Link to="/admin/leads" className="text-gray-600 hover:text-[#5B7F6D]">Leads</Link>
              <Link to="/admin/families" className="text-[#5B7F6D] font-medium">Families</Link>
              <button onClick={handleLogout} className="flex items-center gap-1 text-gray-500 hover:text-[#5B7F6D] text-sm">
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Back Link */}
        <Link
          to="/admin/families"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-[#5B7F6D] mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Families
        </Link>

        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-[#2D4F3E] font-display flex items-center gap-3">
            <Home className="w-7 h-7 text-[#5B7F6D]" />
            Register New Family
          </h2>
          <p className="text-gray-600 mt-1">
            Create a new household with guardians and students
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center gap-4 mb-8">
          {[
            { num: 1, label: 'Guardians' },
            { num: 2, label: 'Students' },
            { num: 3, label: 'Address' },
          ].map((s) => (
            <div key={s.num} className="flex items-center gap-2">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                  step >= s.num
                    ? 'bg-[#5B7F6D] text-white'
                    : 'bg-gray-200 text-gray-500'
                )}
              >
                {step > s.num ? <Check className="w-4 h-4" /> : s.num}
              </div>
              <span
                className={cn(
                  'text-sm',
                  step >= s.num ? 'text-[#2D4F3E] font-medium' : 'text-gray-500'
                )}
              >
                {s.label}
              </span>
              {s.num < 3 && <div className="w-8 h-px bg-gray-300 mx-2" />}
            </div>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Step 1: Guardians */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[#2D4F3E] flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#5B7F6D]" />
                  Parent/Guardian Information
                </h3>
                <button
                  type="button"
                  onClick={addGuardian}
                  className="flex items-center gap-1 text-sm text-[#5B7F6D] hover:underline"
                >
                  <Plus className="w-4 h-4" />
                  Add Guardian
                </button>
              </div>

              {guardiansList.map((guardian, index) => (
                <div key={guardian.id} className="p-4 bg-gray-50 rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-[#2D4F3E]">
                      Guardian {index + 1}
                      {guardian.isPrimary && (
                        <span className="ml-2 text-xs bg-[#5B7F6D]/10 text-[#5B7F6D] px-2 py-0.5 rounded">
                          Primary
                        </span>
                      )}
                    </h4>
                    {guardiansList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeGuardian(guardian.id)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                      <input
                        type="text"
                        value={guardian.firstName}
                        onChange={(e) => updateGuardian(guardian.id, 'firstName', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-[#5B7F6D]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                      <input
                        type="text"
                        value={guardian.lastName}
                        onChange={(e) => updateGuardian(guardian.id, 'lastName', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-[#5B7F6D]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <Mail className="w-3 h-3 inline mr-1" /> Email
                      </label>
                      <input
                        type="email"
                        value={guardian.email}
                        onChange={(e) => updateGuardian(guardian.id, 'email', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-[#5B7F6D]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <Phone className="w-3 h-3 inline mr-1" /> Phone
                      </label>
                      <input
                        type="tel"
                        value={guardian.phone}
                        onChange={(e) => updateGuardian(guardian.id, 'phone', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-[#5B7F6D]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Relationship</label>
                      <select
                        value={guardian.relationship}
                        onChange={(e) => updateGuardian(guardian.id, 'relationship', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-[#5B7F6D]"
                      >
                        {relationships.map(r => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-end">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={guardian.isPrimary}
                          onChange={(e) => updateGuardian(guardian.id, 'isPrimary', e.target.checked)}
                          className="w-4 h-4 rounded border-gray-300 text-[#5B7F6D] focus:ring-[#5B7F6D]"
                        />
                        <span className="text-sm text-gray-700">Primary Contact</span>
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Step 2: Students */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[#2D4F3E] flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-[#5B7F6D]" />
                  Student Information
                </h3>
                <button
                  type="button"
                  onClick={addStudent}
                  className="flex items-center gap-1 text-sm text-[#5B7F6D] hover:underline"
                >
                  <Plus className="w-4 h-4" />
                  Add Student
                </button>
              </div>

              {studentsList.map((student, index) => (
                <div key={student.id} className="p-4 bg-gray-50 rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-[#2D4F3E]">Student {index + 1}</h4>
                    {studentsList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeStudent(student.id)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                      <input
                        type="text"
                        value={student.firstName}
                        onChange={(e) => updateStudent(student.id, 'firstName', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-[#5B7F6D]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                      <input
                        type="text"
                        value={student.lastName}
                        onChange={(e) => updateStudent(student.id, 'lastName', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-[#5B7F6D]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                      <input
                        type="date"
                        value={student.dateOfBirth}
                        onChange={(e) => updateStudent(student.id, 'dateOfBirth', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-[#5B7F6D]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Grade Level</label>
                      <select
                        value={student.gradeLevel}
                        onChange={(e) => updateStudent(student.id, 'gradeLevel', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-[#5B7F6D]"
                      >
                        <option value="">Select grade</option>
                        {grades.map((grade: string) => (
                          <option key={grade} value={grade}>{grade}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                      <select
                        value={student.gender}
                        onChange={(e) => updateStudent(student.id, 'gender', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-[#5B7F6D]"
                      >
                        <option value="">Select</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="non_binary">Non-binary</option>
                        <option value="prefer_not_to_say">Prefer not to say</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Step 3: Address */}
          {step === 3 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-[#2D4F3E] flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#5B7F6D]" />
                Address (Optional)
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
                <input
                  type="text"
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  placeholder="1234 Main Street"
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:border-[#5B7F6D]"
                />
                <input
                  type="text"
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                  placeholder="Apt 100 (optional)"
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:border-[#5B7F6D] mt-2"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Austin"
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:border-[#5B7F6D]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="TX"
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:border-[#5B7F6D]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code</label>
                  <input
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="78701"
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:border-[#5B7F6D]"
                  />
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-[#2D4F3E] mb-2">Summary</h4>
                <p className="text-sm text-gray-600">
                  Registering <strong>{guardiansList.filter(g => g.firstName).length}</strong> guardian(s) and{' '}
                  <strong>{studentsList.filter(s => s.firstName).length}</strong> student(s)
                </p>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="flex items-center gap-2 text-gray-600 hover:text-[#5B7F6D]"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            ) : (
              <Link to="/admin/families" className="text-gray-600 hover:text-[#5B7F6D]">
                Cancel
              </Link>
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className="flex items-center gap-2 px-6 py-3 bg-[#5B7F6D] text-white rounded-lg hover:bg-[#2D4F3E]"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className={cn(
                  'flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors',
                  isSubmitting
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-[#5B7F6D] text-white hover:bg-[#2D4F3E]'
                )}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                    Registering...
                  </>
                ) : (
                  <>
                    <Home className="w-4 h-4" />
                    Register Family
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </main>
    </div>
  );
}
