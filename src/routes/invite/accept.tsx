// 🎟️ Accept Invitation - Join a school team
// "The beginning of a new adventure in education"
//
// ╭────────────────────────────────────────────────────────────╮
// │  INVITATION ACCEPTANCE                                      │
// │  When staff click the invite link, they come here to       │
// │  create their account and join the school.                  │
// ╰────────────────────────────────────────────────────────────╯

import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { useState } from 'react';
import {
  UserPlus,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Building2,
} from 'lucide-react';
import { cn } from '../../utils';
import { getDb, staffInvitations, users, schools, schoolMembers } from '../../db';
import { eq, and, gt } from 'drizzle-orm';
import { hashPassword, createSession, createSessionCookie } from '../../lib/auth';

// ═══════════════════════════════════════════════════════════
// SERVER FUNCTIONS
// ═══════════════════════════════════════════════════════════

const validateInvitation = createServerFn({ method: 'GET' })
  .handler(async (data: { token: string }) => {
    const db = getDb();

    try {
      // Find the invitation
      const invitation = await db.query.staffInvitations.findFirst({
        where: and(
          eq(staffInvitations.token, data.token),
          eq(staffInvitations.status, 'pending'),
          gt(staffInvitations.expiresAt, new Date())
        ),
      });

      if (!invitation) {
        return {
          valid: false,
          error: 'This invitation is invalid, expired, or has already been used.',
        };
      }

      // Get school info
      const school = await db.query.schools.findFirst({
        where: eq(schools.id, invitation.schoolId),
        columns: {
          id: true,
          name: true,
          logoUrl: true,
        },
      });

      if (!school) {
        return { valid: false, error: 'School not found.' };
      }

      // Check if user already exists
      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, invitation.email),
      });

      return {
        valid: true,
        invitation: {
          id: invitation.id,
          email: invitation.email,
          schoolRole: invitation.schoolRole,
          expiresAt: invitation.expiresAt,
        },
        school: {
          id: school.id,
          name: school.name,
          logoUrl: school.logoUrl,
        },
        userExists: !!existingUser,
      };
    } catch (error) {
      console.error('Error validating invitation:', error);
      return { valid: false, error: 'Failed to validate invitation.' };
    }
  });

const acceptInvitation = createServerFn({ method: 'POST' })
  .handler(async (data: {
    token: string;
    firstName: string;
    lastName: string;
    password: string;
  }) => {
    const db = getDb();

    try {
      // Find the invitation
      const invitation = await db.query.staffInvitations.findFirst({
        where: and(
          eq(staffInvitations.token, data.token),
          eq(staffInvitations.status, 'pending'),
          gt(staffInvitations.expiresAt, new Date())
        ),
      });

      if (!invitation) {
        return { success: false, error: 'Invalid or expired invitation.' };
      }

      // Check if user already exists
      let userId: string;
      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, invitation.email),
      });

      if (existingUser) {
        userId = existingUser.id;
      } else {
        // Create new user
        const passwordHash = await hashPassword(data.password);
        const [newUser] = await db
          .insert(users)
          .values({
            email: invitation.email,
            passwordHash,
            firstName: data.firstName,
            lastName: data.lastName,
            role: 'admin', // Staff members get admin role
            emailVerified: true, // Email is verified via invitation
          })
          .returning({ id: users.id });

        userId = newUser.id;
      }

      // Check if already a member of this school
      const existingMember = await db.query.schoolMembers.findFirst({
        where: and(
          eq(schoolMembers.userId, userId),
          eq(schoolMembers.schoolId, invitation.schoolId)
        ),
      });

      if (!existingMember) {
        // Add user to school
        await db.insert(schoolMembers).values({
          userId,
          schoolId: invitation.schoolId,
          role: invitation.schoolRole,
          invitedBy: invitation.invitedById,
          invitedAt: invitation.createdAt,
          acceptedAt: new Date(),
          status: 'active',
        });
      }

      // Mark invitation as accepted
      await db
        .update(staffInvitations)
        .set({
          status: 'accepted',
          acceptedAt: new Date(),
        })
        .where(eq(staffInvitations.id, invitation.id));

      // Create session for the user
      const sessionId = await createSession(userId);
      const cookie = createSessionCookie(sessionId);

      return { success: true, cookie };
    } catch (error) {
      console.error('Error accepting invitation:', error);
      return { success: false, error: 'Failed to accept invitation.' };
    }
  });

// For existing users who just need to link their account
const linkExistingAccount = createServerFn({ method: 'POST' })
  .handler(async (data: { token: string; password: string }) => {
    const db = getDb();

    try {
      // Find the invitation
      const invitation = await db.query.staffInvitations.findFirst({
        where: and(
          eq(staffInvitations.token, data.token),
          eq(staffInvitations.status, 'pending'),
          gt(staffInvitations.expiresAt, new Date())
        ),
      });

      if (!invitation) {
        return { success: false, error: 'Invalid or expired invitation.' };
      }

      // Find the existing user
      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, invitation.email),
      });

      if (!existingUser) {
        return { success: false, error: 'User not found. Please create an account.' };
      }

      // Verify password
      const bcrypt = await import('bcryptjs');
      if (!existingUser.passwordHash) {
        return { success: false, error: 'Please sign in with Google to link your account.' };
      }

      const validPassword = await bcrypt.compare(data.password, existingUser.passwordHash);
      if (!validPassword) {
        return { success: false, error: 'Invalid password.' };
      }

      // Check if already a member of this school
      const existingMember = await db.query.schoolMembers.findFirst({
        where: and(
          eq(schoolMembers.userId, existingUser.id),
          eq(schoolMembers.schoolId, invitation.schoolId)
        ),
      });

      if (!existingMember) {
        // Add user to school
        await db.insert(schoolMembers).values({
          userId: existingUser.id,
          schoolId: invitation.schoolId,
          role: invitation.schoolRole,
          invitedBy: invitation.invitedById,
          invitedAt: invitation.createdAt,
          acceptedAt: new Date(),
          status: 'active',
        });
      }

      // Mark invitation as accepted
      await db
        .update(staffInvitations)
        .set({
          status: 'accepted',
          acceptedAt: new Date(),
        })
        .where(eq(staffInvitations.id, invitation.id));

      // Create session
      const sessionId = await createSession(existingUser.id);
      const cookie = createSessionCookie(sessionId);

      return { success: true, cookie };
    } catch (error) {
      console.error('Error linking account:', error);
      return { success: false, error: 'Failed to link account.' };
    }
  });

// ═══════════════════════════════════════════════════════════
// ROUTE DEFINITION
// ═══════════════════════════════════════════════════════════

export const Route = createFileRoute('/invite/accept')({
  head: () => ({
    meta: [
      { title: 'Accept Invitation | Enrollsy' },
      { name: 'description', content: 'Accept your invitation to join a school on Enrollsy.' },
    ],
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    token: (search.token as string) || '',
  }),
  loader: async ({ search }) => {
    if (!search.token) {
      return { valid: false, error: 'No invitation token provided.' };
    }
    return validateInvitation({ token: search.token });
  },
  component: AcceptInvitePage,
});

// ═══════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════

function AcceptInvitePage() {
  const navigate = useNavigate();
  const { token } = Route.useSearch();
  const loaderData = Route.useLoaderData();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const roleLabels: Record<string, string> = {
    owner: 'Owner',
    admin: 'Administrator',
    admissions: 'Admissions Staff',
    business_office: 'Business Office Staff',
    readonly: 'View-Only Member',
  };

  // Invalid invitation
  if (!loaderData.valid) {
    return (
      <div className="min-h-screen bg-[#F7F5F2] flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-xl font-bold text-[#1F2A44] mb-2 font-display">
            Invalid Invitation
          </h1>
          <p className="text-gray-600 mb-6">
            {loaderData.error || 'This invitation link is invalid or has expired.'}
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 bg-[#2F5D50] text-white px-6 py-3 rounded-lg hover:bg-[#1F2A44] transition-colors"
          >
            Go to Login
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  const { invitation, school, userExists } = loaderData;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (userExists) {
      // Existing user - just need password
      if (!password) {
        setError('Please enter your password');
        return;
      }

      setIsLoading(true);
      try {
        const result = await linkExistingAccount({ token, password });
        if (result.success && result.cookie) {
          document.cookie = result.cookie;
          navigate({ to: '/admin' });
        } else {
          setError(result.error || 'Failed to link account');
        }
      } catch (err) {
        setError('An error occurred');
      } finally {
        setIsLoading(false);
      }
    } else {
      // New user - need full registration
      if (!firstName || !lastName || !password) {
        setError('Please fill in all fields');
        return;
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      if (password.length < 8) {
        setError('Password must be at least 8 characters');
        return;
      }

      setIsLoading(true);
      try {
        const result = await acceptInvitation({
          token,
          firstName,
          lastName,
          password,
        });

        if (result.success && result.cookie) {
          document.cookie = result.cookie;
          navigate({ to: '/admin' });
        } else {
          setError(result.error || 'Failed to accept invitation');
        }
      } catch (err) {
        setError('An error occurred');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F5F2] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-[#2F5D50] text-white p-6 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            {school?.logoUrl ? (
              <img src={school.logoUrl} alt={school.name} className="w-10 h-10 rounded-full" />
            ) : (
              <Building2 className="w-8 h-8" />
            )}
          </div>
          <h1 className="text-xl font-bold font-display mb-1">
            Join {school?.name}
          </h1>
          <p className="text-white/80 text-sm">
            You've been invited as {roleLabels[invitation?.schoolRole || 'readonly']}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Email (readonly) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={invitation?.email || ''}
                readOnly
                className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-600"
              />
            </div>
          </div>

          {/* New user fields */}
          {!userExists && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="John"
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:border-[#2F5D50] focus:ring-2 focus:ring-[#2F5D50]/10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:border-[#2F5D50] focus:ring-2 focus:ring-[#2F5D50]/10"
                  />
                </div>
              </div>
            </>
          )}

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {userExists ? 'Your Password' : 'Create Password'}
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={userExists ? 'Enter your password' : 'Min 8 characters'}
                className="w-full pl-12 pr-12 py-3 rounded-lg border border-gray-200 focus:outline-none focus:border-[#2F5D50] focus:ring-2 focus:ring-[#2F5D50]/10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Confirm Password (new users only) */}
          {!userExists && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:border-[#2F5D50] focus:ring-2 focus:ring-[#2F5D50]/10"
                />
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Info for existing users */}
          {userExists && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm">
              You already have an Enrollsy account. Enter your password to join this school.
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className={cn(
              'w-full flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all',
              isLoading
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-[#2F5D50] text-white hover:bg-[#1F2A44]'
            )}
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                {userExists ? 'Joining...' : 'Creating Account...'}
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                {userExists ? 'Join School' : 'Create Account & Join'}
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="px-6 pb-6 text-center">
          <p className="text-xs text-gray-500">
            Invitation expires {new Date(invitation?.expiresAt!).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
}
