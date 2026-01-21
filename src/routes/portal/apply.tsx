// 📝 Start Application - The beginning of a new journey
// "Every student's success story starts with a single application"
//
// ╭──────────────────────────────────────────────────────────────╮
// │  🎒 APPLICATION WIZARD                                        │
// │  Step-by-step guide for families to apply for enrollment     │
// │                                                              │
// │  1. Select Student (or add new)                              │
// │  2. Choose Grade & School Year                               │
// │  3. Review & Submit                                          │
// ╰──────────────────────────────────────────────────────────────╯

import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  User,
  GraduationCap,
  Calendar,
  FileText,
  CheckCircle,
  Plus,
  LogOut,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import {
  validateSession,
  parseSessionCookie,
  createLogoutCookie,
} from '../../lib/auth';
import { getDb, households, guardians, students, applications, schools } from '../../db';
import { eq, and, not, inArray } from 'drizzle-orm';
import { cn } from '../../utils';
import { createId } from '@paralleldrive/cuid2';

// ═══════════════════════════════════════════════════════════
// SERVER FUNCTIONS
// ═══════════════════════════════════════════════════════════

const getSessionAndFamilyData = createServerFn({ method: 'GET' }).handler(async () => {
  const request = getRequest();
  const cookieHeader = request?.headers.get('cookie') || '';
  const sessionId = parseSessionCookie(cookieHeader);

  if (!sessionId) {
    return { authenticated: false };
  }

  const session = await validateSession(sessionId);
  if (!session) {
    return { authenticated: false };
  }

  const db = getDb();

  // Find guardian linked to this user
  const [guardian] = await db
    .select()
    .from(guardians)
    .where(eq(guardians.userId, session.user.id));

  if (!guardian) {
    return {
      authenticated: true,
      user: session.user,
      hasHousehold: false,
    };
  }

  // Get household
  const [household] = await db
    .select()
    .from(households)
    .where(eq(households.id, guardian.householdId));

  // Get students in household
  const householdStudents = await db
    .select()
    .from(students)
    .where(eq(students.householdId, guardian.householdId));

  // Get existing applications to filter out students who already have pending apps
  const existingApps = await db
    .select({ studentId: applications.studentId, schoolYear: applications.schoolYear })
    .from(applications)
    .where(and(
      eq(applications.householdId, guardian.householdId),
      not(inArray(applications.status, ['withdrawn', 'denied']))
    ));

  // Get school info (assuming single school for now)
  const [school] = await db.select().from(schools).limit(1);

  return {
    authenticated: true,
    user: session.user,
    hasHousehold: true,
    household: household ? { id: household.id, name: household.name } : null,
    students: householdStudents.map((s) => ({
      id: s.id,
      firstName: s.firstName,
      lastName: s.lastName,
      dateOfBirth: s.dateOfBirth,
      gradeLevel: s.gradeLevel,
    })),
    existingApplications: existingApps,
    school: school ? { id: school.id, name: school.name } : null,
  };
});

const createStudent = createServerFn({ method: 'POST' })
  .validator((data: {
    householdId: string;
    schoolId: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
  }) => data)
  .handler(async ({ data }) => {
    const db = getDb();

    try {
      const studentId = createId();
      await db.insert(students).values({
        id: studentId,
        householdId: data.householdId,
        schoolId: data.schoolId,
        firstName: data.firstName,
        lastName: data.lastName,
        dateOfBirth: data.dateOfBirth,
        enrollmentStatus: 'applicant',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return { success: true, studentId };
    } catch (error) {
      console.error('Error creating student:', error);
      return { success: false, error: 'Failed to create student' };
    }
  });

const createApplication = createServerFn({ method: 'POST' })
  .validator((data: {
    schoolId: string;
    studentId: string;
    householdId: string;
    gradeApplyingFor: string;
    schoolYear: string;
  }) => data)
  .handler(async ({ data }) => {
    const db = getDb();

    try {
      const applicationId = createId();
      await db.insert(applications).values({
        id: applicationId,
        schoolId: data.schoolId,
        studentId: data.studentId,
        householdId: data.householdId,
        gradeApplyingFor: data.gradeApplyingFor,
        schoolYear: data.schoolYear,
        applicationType: 'new',
        status: 'submitted',
        submittedAt: new Date(),
        applicationFeeAmount: 5000, // $50 default
        applicationFeePaid: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Update student enrollment status
      await db
        .update(students)
        .set({ enrollmentStatus: 'applicant', updatedAt: new Date() })
        .where(eq(students.id, data.studentId));

      return { success: true, applicationId };
    } catch (error) {
      console.error('Error creating application:', error);
      return { success: false, error: 'Failed to create application' };
    }
  });

const logoutUser = createServerFn({ method: 'POST' }).handler(async () => {
  return { cookie: createLogoutCookie() };
});

// ═══════════════════════════════════════════════════════════
// ROUTE DEFINITION
// ═══════════════════════════════════════════════════════════

export const Route = createFileRoute('/portal/apply')({
  head: () => ({
    meta: [
      { title: 'Start Application | Family Portal | EnrollSage' },
      { name: 'description', content: 'Start a new enrollment application for your child.' },
    ],
  }),
  loader: async () => {
    return await getSessionAndFamilyData();
  },
  component: ApplyPage,
});

// ═══════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════

function ApplyPage() {
  const navigate = useNavigate();
  const data = Route.useLoaderData();

  const [step, setStep] = useState(1);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [gradeApplyingFor, setGradeApplyingFor] = useState('');
  const [schoolYear, setSchoolYear] = useState('2025-2026');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [newApplicationId, setNewApplicationId] = useState('');

  // New student form
  const [newStudent, setNewStudent] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
  });

  useEffect(() => {
    if (!data.authenticated) {
      navigate({ to: '/login' });
    }
  }, [data.authenticated, navigate]);

  if (!data.authenticated) {
    return null;
  }

  if (!data.hasHousehold) {
    return (
      <div className="min-h-screen bg-[#F8F9F6] flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 max-w-md text-center">
          <AlertTriangle className="w-12 h-12 mx-auto text-amber-500 mb-4" />
          <h2 className="text-xl font-semibold text-[#2D4F3E] mb-2">
            Family Registration Required
          </h2>
          <p className="text-gray-600 mb-6">
            Please contact the school to complete your family registration before applying.
          </p>
          <Link
            to="/portal"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#5B7F6D] text-white rounded-lg hover:bg-[#4A6E5C]"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Portal
          </Link>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    const result = await logoutUser();
    if (result.cookie) document.cookie = result.cookie;
    navigate({ to: '/login' });
  };

  // Filter students who don't have active applications for the selected school year
  const availableStudents = data.students?.filter((student: any) => {
    const hasActiveApp = data.existingApplications?.some(
      (app: any) => app.studentId === student.id && app.schoolYear === schoolYear
    );
    return !hasActiveApp;
  }) || [];

  const handleAddStudent = async () => {
    if (!newStudent.firstName || !newStudent.lastName || !newStudent.dateOfBirth) {
      setError('Please fill in all student information');
      return;
    }

    setIsSubmitting(true);
    setError('');

    const result = await createStudent({
      data: {
        householdId: data.household!.id,
        schoolId: data.school!.id,
        firstName: newStudent.firstName,
        lastName: newStudent.lastName,
        dateOfBirth: newStudent.dateOfBirth,
      },
    });

    setIsSubmitting(false);

    if (result.success && result.studentId) {
      setSelectedStudent(result.studentId);
      setShowAddStudent(false);
      setNewStudent({ firstName: '', lastName: '', dateOfBirth: '' });
      // Reload to get updated student list
      window.location.reload();
    } else {
      setError(result.error || 'Failed to add student');
    }
  };

  const handleSubmitApplication = async () => {
    if (!selectedStudent || !gradeApplyingFor) {
      setError('Please complete all required fields');
      return;
    }

    setIsSubmitting(true);
    setError('');

    const result = await createApplication({
      data: {
        schoolId: data.school!.id,
        studentId: selectedStudent,
        householdId: data.household!.id,
        gradeApplyingFor,
        schoolYear,
      },
    });

    setIsSubmitting(false);

    if (result.success && result.applicationId) {
      setSuccess(true);
      setNewApplicationId(result.applicationId);
    } else {
      setError(result.error || 'Failed to submit application');
    }
  };

  const selectedStudentData = data.students?.find((s: any) => s.id === selectedStudent);

  // Success Screen
  if (success) {
    return (
      <div className="min-h-screen bg-[#F8F9F6]">
        <PortalHeader user={data.user} onLogout={handleLogout} />
        <main className="max-w-2xl mx-auto px-4 py-12">
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-[#2D4F3E] mb-2">
              Application Submitted!
            </h2>
            <p className="text-gray-600 mb-6">
              Your application for {selectedStudentData?.firstName} has been submitted successfully.
              The admissions team will review it and contact you soon.
            </p>
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-500">Application ID</p>
              <p className="font-mono text-[#5B7F6D]">{newApplicationId}</p>
            </div>
            <div className="flex gap-4 justify-center">
              <Link
                to={`/portal/applications/${newApplicationId}`}
                className="px-6 py-3 bg-[#5B7F6D] text-white rounded-lg hover:bg-[#4A6E5C]"
              >
                View Application
              </Link>
              <Link
                to="/portal"
                className="px-6 py-3 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                Back to Portal
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9F6]">
      <PortalHeader user={data.user} onLogout={handleLogout} />

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Back Link */}
        <Link
          to="/portal"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-[#5B7F6D] mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Portal
        </Link>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium',
                step >= s
                  ? 'bg-[#5B7F6D] text-white'
                  : 'bg-gray-200 text-gray-500'
              )}>
                {step > s ? <CheckCircle className="w-5 h-5" /> : s}
              </div>
              {s < 3 && (
                <div className={cn(
                  'w-24 h-1 mx-2',
                  step > s ? 'bg-[#5B7F6D]' : 'bg-gray-200'
                )} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Select Student */}
        {step === 1 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-[#2D4F3E] mb-2 flex items-center gap-2">
              <User className="w-5 h-5 text-[#5B7F6D]" />
              Select Student
            </h2>
            <p className="text-gray-600 mb-6">
              Choose which child you're applying for, or add a new student.
            </p>

            {/* School Year Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                School Year
              </label>
              <select
                value={schoolYear}
                onChange={(e) => setSchoolYear(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-[#5B7F6D] focus:ring-2 focus:ring-[#5B7F6D]/10"
              >
                <option value="2025-2026">2025-2026</option>
                <option value="2026-2027">2026-2027</option>
              </select>
            </div>

            {/* Existing Students */}
            {availableStudents.length > 0 ? (
              <div className="space-y-3 mb-6">
                {availableStudents.map((student: any) => (
                  <button
                    key={student.id}
                    onClick={() => setSelectedStudent(student.id)}
                    className={cn(
                      'w-full p-4 rounded-lg border text-left transition-colors',
                      selectedStudent === student.id
                        ? 'border-[#5B7F6D] bg-[#5B7F6D]/5'
                        : 'border-gray-200 hover:bg-gray-50'
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-[#5B7F6D]/10 rounded-full flex items-center justify-center">
                        <span className="text-lg font-medium text-[#5B7F6D]">
                          {student.firstName.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-[#2D4F3E]">
                          {student.firstName} {student.lastName}
                        </p>
                        <p className="text-sm text-gray-500">
                          {student.dateOfBirth ? `Born: ${new Date(student.dateOfBirth).toLocaleDateString()}` : 'DOB not set'}
                        </p>
                      </div>
                      {selectedStudent === student.id && (
                        <CheckCircle className="w-5 h-5 text-[#5B7F6D] ml-auto" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 bg-gray-50 rounded-lg mb-6">
                <p className="text-gray-600">
                  {data.students?.length > 0
                    ? 'All students already have applications for this school year'
                    : 'No students registered yet'}
                </p>
              </div>
            )}

            {/* Add New Student */}
            {!showAddStudent ? (
              <button
                onClick={() => setShowAddStudent(true)}
                className="w-full p-4 rounded-lg border-2 border-dashed border-gray-300 text-gray-600 hover:border-[#5B7F6D] hover:text-[#5B7F6D] transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add New Student
              </button>
            ) : (
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-[#2D4F3E] mb-4">Add New Student</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">First Name</label>
                    <input
                      type="text"
                      value={newStudent.firstName}
                      onChange={(e) => setNewStudent({ ...newStudent, firstName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#5B7F6D]"
                      placeholder="First name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Last Name</label>
                    <input
                      type="text"
                      value={newStudent.lastName}
                      onChange={(e) => setNewStudent({ ...newStudent, lastName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#5B7F6D]"
                      placeholder="Last name"
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm text-gray-600 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={newStudent.dateOfBirth}
                    onChange={(e) => setNewStudent({ ...newStudent, dateOfBirth: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#5B7F6D]"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowAddStudent(false)}
                    className="flex-1 px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddStudent}
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 bg-[#5B7F6D] text-white rounded-lg hover:bg-[#4A6E5C] disabled:opacity-50"
                  >
                    {isSubmitting ? 'Adding...' : 'Add Student'}
                  </button>
                </div>
              </div>
            )}

            {error && (
              <p className="text-red-500 text-sm mt-4">{error}</p>
            )}

            <div className="flex justify-end mt-6">
              <button
                onClick={() => {
                  if (selectedStudent) {
                    setStep(2);
                    setError('');
                  } else {
                    setError('Please select a student');
                  }
                }}
                disabled={!selectedStudent}
                className="flex items-center gap-2 px-6 py-3 bg-[#5B7F6D] text-white rounded-lg hover:bg-[#4A6E5C] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Grade & Details */}
        {step === 2 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-[#2D4F3E] mb-2 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-[#5B7F6D]" />
              Grade Selection
            </h2>
            <p className="text-gray-600 mb-6">
              Select the grade {selectedStudentData?.firstName} will be applying for.
            </p>

            {/* Grade Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Grade Applying For
              </label>
              <div className="grid grid-cols-4 gap-3">
                {['PK', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].map((grade) => (
                  <button
                    key={grade}
                    onClick={() => setGradeApplyingFor(grade)}
                    className={cn(
                      'p-3 rounded-lg border text-center transition-colors',
                      gradeApplyingFor === grade
                        ? 'border-[#5B7F6D] bg-[#5B7F6D] text-white'
                        : 'border-gray-200 hover:bg-gray-50'
                    )}
                  >
                    {grade === 'PK' ? 'Pre-K' : grade === 'K' ? 'Kinder' : `${grade}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Application Summary */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-[#2D4F3E] mb-3">Application Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Student</span>
                  <span className="font-medium">{selectedStudentData?.firstName} {selectedStudentData?.lastName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">School Year</span>
                  <span className="font-medium">{schoolYear}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Grade</span>
                  <span className="font-medium">
                    {gradeApplyingFor
                      ? (gradeApplyingFor === 'PK' ? 'Pre-K' : gradeApplyingFor === 'K' ? 'Kindergarten' : `Grade ${gradeApplyingFor}`)
                      : 'Not selected'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">School</span>
                  <span className="font-medium">{data.school?.name || 'School'}</span>
                </div>
              </div>
            </div>

            {error && (
              <p className="text-red-500 text-sm mb-4">{error}</p>
            )}

            <div className="flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-2 px-6 py-3 text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <button
                onClick={() => {
                  if (gradeApplyingFor) {
                    setStep(3);
                    setError('');
                  } else {
                    setError('Please select a grade');
                  }
                }}
                disabled={!gradeApplyingFor}
                className="flex items-center gap-2 px-6 py-3 bg-[#5B7F6D] text-white rounded-lg hover:bg-[#4A6E5C] disabled:opacity-50"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Review & Submit */}
        {step === 3 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-[#2D4F3E] mb-2 flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#5B7F6D]" />
              Review & Submit
            </h2>
            <p className="text-gray-600 mb-6">
              Please review the application details before submitting.
            </p>

            {/* Final Review */}
            <div className="border border-gray-200 rounded-lg p-6 mb-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-[#5B7F6D]/10 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-medium text-[#5B7F6D]">
                    {selectedStudentData?.firstName.charAt(0)}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#2D4F3E]">
                    {selectedStudentData?.firstName} {selectedStudentData?.lastName}
                  </h3>
                  <p className="text-gray-500">
                    Applying for {gradeApplyingFor === 'PK' ? 'Pre-K' : gradeApplyingFor === 'K' ? 'Kindergarten' : `Grade ${gradeApplyingFor}`}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                    <Calendar className="w-4 h-4" />
                    School Year
                  </div>
                  <p className="font-medium text-[#2D4F3E]">{schoolYear}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                    <GraduationCap className="w-4 h-4" />
                    School
                  </div>
                  <p className="font-medium text-[#2D4F3E]">{data.school?.name || 'School'}</p>
                </div>
              </div>
            </div>

            {/* Application Fee Notice */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <h4 className="font-medium text-amber-800 mb-1">Application Fee</h4>
              <p className="text-sm text-amber-700">
                A non-refundable application fee of <strong>$50.00</strong> will be required after submission.
                You can pay this through your Family Portal.
              </p>
            </div>

            {/* Terms */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600">
                By submitting this application, you confirm that all information provided is accurate
                and complete. The admissions team will review your application and contact you regarding
                next steps.
              </p>
            </div>

            {error && (
              <p className="text-red-500 text-sm mb-4">{error}</p>
            )}

            <div className="flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-2 px-6 py-3 text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <button
                onClick={handleSubmitApplication}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-3 bg-[#5B7F6D] text-white rounded-lg hover:bg-[#4A6E5C] disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit Application
                    <CheckCircle className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// HELPER COMPONENTS
// ═══════════════════════════════════════════════════════════

function PortalHeader({ user, onLogout }: { user: any; onLogout: () => void }) {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Link to="/portal" className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#5B7F6D] rounded-lg flex items-center justify-center">
                <span className="text-lg">🌿</span>
              </div>
              <span className="font-bold text-lg text-[#2D4F3E] font-display">Family Portal</span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {user.firstName} {user.lastName}
            </span>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#5B7F6D] transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
