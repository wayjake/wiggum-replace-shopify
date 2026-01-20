// 👥 Team Management - Invite and manage school staff
// "A school runs on the dedication of its people"
//
// ╭────────────────────────────────────────────────────────────╮
// │  TEAM MANAGEMENT                                            │
// │  View current staff, send invitations, and manage roles.   │
// │  Only school owners and admins can invite new members.      │
// ╰────────────────────────────────────────────────────────────╯

import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Mail,
  Send,
  X,
  CheckCircle2,
  Clock,
  XCircle,
  LogOut,
  Shield,
  Crown,
  Eye,
  Briefcase,
  UserCog,
} from 'lucide-react';
import { requireAdmin, getSession } from '../../lib/auth-guards';
import { getDb, schools, schoolMembers, users, staffInvitations } from '../../db';
import { eq, and, desc } from 'drizzle-orm';
import { cn } from '../../utils';
import { createLogoutCookie, hashPassword, createUser } from '../../lib/auth';
import { createId } from '@paralleldrive/cuid2';
import crypto from 'crypto';
import { sendStaffInvitationEmail } from '../../lib/brevo';

// ═══════════════════════════════════════════════════════════
// SERVER FUNCTIONS
// ═══════════════════════════════════════════════════════════

const getTeamData = createServerFn({ method: 'GET' }).handler(async () => {
  const db = getDb();
  const session = await getSession();

  if (!session || (session.user.role !== 'admin' && session.user.role !== 'superadmin')) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    // Get user's school membership
    const membership = await db.query.schoolMembers.findFirst({
      where: and(
        eq(schoolMembers.userId, session.user.id),
        eq(schoolMembers.status, 'active')
      ),
      with: {
        school: true,
      },
    });

    if (!membership?.school) {
      return { success: false, error: 'No school found' };
    }

    const school = membership.school;

    // Get all team members
    const members = await db
      .select({
        id: schoolMembers.id,
        userId: schoolMembers.userId,
        role: schoolMembers.role,
        status: schoolMembers.status,
        acceptedAt: schoolMembers.acceptedAt,
        createdAt: schoolMembers.createdAt,
        userEmail: users.email,
        userFirstName: users.firstName,
        userLastName: users.lastName,
      })
      .from(schoolMembers)
      .innerJoin(users, eq(users.id, schoolMembers.userId))
      .where(eq(schoolMembers.schoolId, school.id))
      .orderBy(desc(schoolMembers.createdAt));

    // Get pending invitations
    const invitations = await db
      .select({
        id: staffInvitations.id,
        email: staffInvitations.email,
        schoolRole: staffInvitations.schoolRole,
        status: staffInvitations.status,
        expiresAt: staffInvitations.expiresAt,
        createdAt: staffInvitations.createdAt,
        invitedByFirstName: users.firstName,
        invitedByLastName: users.lastName,
      })
      .from(staffInvitations)
      .innerJoin(users, eq(users.id, staffInvitations.invitedById))
      .where(
        and(
          eq(staffInvitations.schoolId, school.id),
          eq(staffInvitations.status, 'pending')
        )
      )
      .orderBy(desc(staffInvitations.createdAt));

    return {
      success: true,
      school: {
        id: school.id,
        name: school.name,
      },
      userRole: membership.role,
      currentUserId: session.user.id,
      members,
      invitations,
    };
  } catch (error) {
    console.error('Error fetching team data:', error);
    return { success: false, error: 'Failed to load team data' };
  }
});

const sendInvitation = createServerFn({ method: 'POST' })
  .handler(async (data: { email: string; role: string }) => {
    const db = getDb();
    const session = await getSession();

    if (!session || (session.user.role !== 'admin' && session.user.role !== 'superadmin')) {
      return { success: false, error: 'Unauthorized' };
    }

    const { email, role } = data;

    // Validate email
    if (!email || !email.includes('@')) {
      return { success: false, error: 'Invalid email address' };
    }

    // Validate role
    const validRoles = ['owner', 'admin', 'admissions', 'business_office', 'readonly'];
    if (!validRoles.includes(role)) {
      return { success: false, error: 'Invalid role' };
    }

    try {
      // Get user's school membership
      const membership = await db.query.schoolMembers.findFirst({
        where: and(
          eq(schoolMembers.userId, session.user.id),
          eq(schoolMembers.status, 'active')
        ),
        with: {
          school: true,
        },
      });

      if (!membership?.school) {
        return { success: false, error: 'No school found' };
      }

      // Only owner and admin can send invitations
      if (membership.role !== 'owner' && membership.role !== 'admin') {
        return { success: false, error: 'Insufficient permissions' };
      }

      // Check if user already exists in this school
      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, email.toLowerCase()),
      });

      if (existingUser) {
        const existingMember = await db.query.schoolMembers.findFirst({
          where: and(
            eq(schoolMembers.userId, existingUser.id),
            eq(schoolMembers.schoolId, membership.schoolId)
          ),
        });

        if (existingMember) {
          return { success: false, error: 'This user is already a member of your school' };
        }
      }

      // Check for existing pending invitation
      const existingInvite = await db.query.staffInvitations.findFirst({
        where: and(
          eq(staffInvitations.email, email.toLowerCase()),
          eq(staffInvitations.schoolId, membership.schoolId),
          eq(staffInvitations.status, 'pending')
        ),
      });

      if (existingInvite) {
        return { success: false, error: 'An invitation is already pending for this email' };
      }

      // Generate secure token
      const token = crypto.randomBytes(32).toString('hex');

      // Create expiration date (7 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      // Create invitation
      await db.insert(staffInvitations).values({
        email: email.toLowerCase(),
        token,
        schoolId: membership.schoolId,
        schoolRole: role as 'owner' | 'admin' | 'admissions' | 'business_office' | 'readonly',
        invitedById: session.user.id,
        expiresAt,
      });

      // Send invitation email
      await sendStaffInvitationEmail({
        to: email.toLowerCase(),
        inviterName: `${session.user.firstName || ''} ${session.user.lastName || ''}`.trim() || session.user.email,
        schoolName: membership.school.name,
        role,
        inviteUrl: `${process.env.APP_URL || 'http://localhost:3000'}/invite/accept?token=${token}`,
        expiresAt,
      });

      return { success: true };
    } catch (error) {
      console.error('Error sending invitation:', error);
      return { success: false, error: 'Failed to send invitation' };
    }
  });

const revokeInvitation = createServerFn({ method: 'POST' })
  .handler(async (data: { invitationId: string }) => {
    const db = getDb();
    const session = await getSession();

    if (!session || (session.user.role !== 'admin' && session.user.role !== 'superadmin')) {
      return { success: false, error: 'Unauthorized' };
    }

    try {
      // Get user's school membership
      const membership = await db.query.schoolMembers.findFirst({
        where: and(
          eq(schoolMembers.userId, session.user.id),
          eq(schoolMembers.status, 'active')
        ),
      });

      if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
        return { success: false, error: 'Insufficient permissions' };
      }

      // Update invitation status
      await db
        .update(staffInvitations)
        .set({ status: 'revoked' })
        .where(
          and(
            eq(staffInvitations.id, data.invitationId),
            eq(staffInvitations.schoolId, membership.schoolId)
          )
        );

      return { success: true };
    } catch (error) {
      console.error('Error revoking invitation:', error);
      return { success: false, error: 'Failed to revoke invitation' };
    }
  });

const logoutUser = createServerFn({ method: 'POST' }).handler(async () => {
  return { cookie: createLogoutCookie() };
});

// ═══════════════════════════════════════════════════════════
// ROUTE DEFINITION
// ═══════════════════════════════════════════════════════════

export const Route = createFileRoute('/admin/team')({
  head: () => ({
    meta: [
      { title: 'Team | School Dashboard | EnrollSage' },
      { name: 'description', content: 'Manage your school staff and send invitations.' },
    ],
  }),
  loader: async () => {
    const [authResult, teamData] = await Promise.all([
      requireAdmin(),
      getTeamData(),
    ]);
    return { authResult, ...teamData };
  },
  component: TeamPage,
});

// ═══════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════

function TeamPage() {
  const navigate = useNavigate();
  const { authResult, success, school, userRole, currentUserId, members, invitations, error } = Route.useLoaderData();

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('admissions');
  const [inviteSending, setInviteSending] = useState(false);
  const [inviteMessage, setInviteMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

  const handleSendInvite = async () => {
    setInviteSending(true);
    setInviteMessage(null);

    try {
      const result = await sendInvitation({ email: inviteEmail, role: inviteRole });

      if (result.success) {
        setInviteMessage({ type: 'success', text: 'Invitation sent!' });
        setInviteEmail('');
        setTimeout(() => {
          setShowInviteModal(false);
          setInviteMessage(null);
          // Refresh the page to show the new invitation
          window.location.reload();
        }, 1500);
      } else {
        setInviteMessage({ type: 'error', text: result.error || 'Failed to send' });
      }
    } catch (err) {
      setInviteMessage({ type: 'error', text: 'An error occurred' });
    } finally {
      setInviteSending(false);
    }
  };

  const handleRevokeInvite = async (invitationId: string) => {
    if (!confirm('Are you sure you want to revoke this invitation?')) return;

    const result = await revokeInvitation({ invitationId });
    if (result.success) {
      window.location.reload();
    }
  };

  const canManageTeam = userRole === 'owner' || userRole === 'admin';

  const roleLabels: Record<string, string> = {
    owner: 'Owner',
    admin: 'Administrator',
    admissions: 'Admissions',
    business_office: 'Business Office',
    readonly: 'View Only',
  };

  const roleIcons: Record<string, typeof Crown> = {
    owner: Crown,
    admin: Shield,
    admissions: UserCog,
    business_office: Briefcase,
    readonly: Eye,
  };

  return (
    <div className="min-h-screen bg-[#F8F9F6]">
      {/* Admin Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link to="/" className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#5B7F6D] rounded-lg flex items-center justify-center">
                  <span className="text-xl">🎓</span>
                </div>
                <div>
                  <h1 className="text-lg font-bold text-[#2D4F3E] font-display">School Dashboard</h1>
                  <p className="text-xs text-gray-500">{school?.name || 'Loading...'}</p>
                </div>
              </Link>
            </div>
            <nav className="flex items-center gap-6">
              <Link to="/admin" className="text-gray-600 hover:text-[#5B7F6D]">Dashboard</Link>
              <Link to="/admin/applications" className="text-gray-600 hover:text-[#5B7F6D]">Applications</Link>
              <Link to="/admin/families" className="text-gray-600 hover:text-[#5B7F6D]">Families</Link>
              <Link to="/admin/team" className="text-[#5B7F6D] font-medium">Team</Link>
              <Link to="/admin/settings" className="text-gray-600 hover:text-[#5B7F6D]">Settings</Link>
              <button onClick={handleLogout} className="flex items-center gap-1 text-gray-500 hover:text-[#5B7F6D] text-sm">
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-[#2D4F3E] font-display flex items-center gap-3">
              <Users className="w-7 h-7 text-[#5B7F6D]" />
              Team
            </h2>
            <p className="text-gray-600">
              Manage your school's staff members and roles.
            </p>
          </div>
          {canManageTeam && (
            <button
              onClick={() => setShowInviteModal(true)}
              className="flex items-center gap-2 bg-[#5B7F6D] text-white px-4 py-2 rounded-lg hover:bg-[#2D4F3E] transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Invite Staff
            </button>
          )}
        </div>

        {!success ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">
            {error || 'Failed to load team data'}
          </div>
        ) : (
          <div className="space-y-8">
            {/* Team Members */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h3 className="font-semibold text-[#2D4F3E] font-display">
                  Staff Members ({members?.length || 0})
                </h3>
              </div>
              <div className="divide-y divide-gray-100">
                {members && members.length > 0 ? (
                  members.map((member) => {
                    const RoleIcon = roleIcons[member.role || 'readonly'] || Eye;
                    return (
                      <div key={member.id} className="p-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            'w-10 h-10 rounded-full flex items-center justify-center',
                            member.role === 'owner' ? 'bg-purple-100' :
                              member.role === 'admin' ? 'bg-blue-100' : 'bg-gray-100'
                          )}>
                            <RoleIcon className={cn(
                              'w-5 h-5',
                              member.role === 'owner' ? 'text-purple-600' :
                                member.role === 'admin' ? 'text-blue-600' : 'text-gray-600'
                            )} />
                          </div>
                          <div>
                            <p className="font-medium text-[#2D4F3E]">
                              {member.userFirstName} {member.userLastName}
                              {member.userId === currentUserId && (
                                <span className="text-xs text-gray-500 font-normal ml-2">(you)</span>
                              )}
                            </p>
                            <p className="text-sm text-gray-500">{member.userEmail}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className={cn(
                            'text-xs px-3 py-1 rounded-full font-medium',
                            member.role === 'owner' ? 'bg-purple-100 text-purple-700' :
                              member.role === 'admin' ? 'bg-blue-100 text-blue-700' :
                                'bg-gray-100 text-gray-700'
                          )}>
                            {roleLabels[member.role || 'readonly']}
                          </span>
                          {member.status !== 'active' && (
                            <span className="text-xs px-2 py-1 rounded bg-amber-100 text-amber-700">
                              {member.status}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-12 text-center text-gray-500">
                    No team members yet
                  </div>
                )}
              </div>
            </div>

            {/* Pending Invitations */}
            {invitations && invitations.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <h3 className="font-semibold text-[#2D4F3E] font-display flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-500" />
                    Pending Invitations ({invitations.length})
                  </h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {invitations.map((invite) => (
                    <div key={invite.id} className="p-6 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                          <Mail className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                          <p className="font-medium text-[#2D4F3E]">{invite.email}</p>
                          <p className="text-xs text-gray-500">
                            Invited by {invite.invitedByFirstName} {invite.invitedByLastName} •
                            Expires {new Date(invite.expiresAt!).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-700">
                          {roleLabels[invite.schoolRole || 'readonly']}
                        </span>
                        {canManageTeam && (
                          <button
                            onClick={() => handleRevokeInvite(invite.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Revoke
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md mx-4 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-[#2D4F3E] font-display flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#5B7F6D]" />
                Invite Staff Member
              </h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@school.edu"
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:border-[#5B7F6D] focus:ring-2 focus:ring-[#5B7F6D]/10"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:border-[#5B7F6D]"
                >
                  <option value="admin">Administrator (full access)</option>
                  <option value="admissions">Admissions (leads & applications)</option>
                  <option value="business_office">Business Office (billing & payments)</option>
                  <option value="readonly">View Only (read-only access)</option>
                </select>
                <p className="text-xs text-gray-500 mt-2">
                  {inviteRole === 'admin' && 'Can manage all school settings and staff'}
                  {inviteRole === 'admissions' && 'Can manage leads, applications, and families'}
                  {inviteRole === 'business_office' && 'Can manage invoices, payments, and billing'}
                  {inviteRole === 'readonly' && 'Can view but not modify any data'}
                </p>
              </div>

              {inviteMessage && (
                <div className={cn(
                  'p-3 rounded-lg text-sm flex items-center gap-2',
                  inviteMessage.type === 'success'
                    ? 'bg-green-50 border border-green-200 text-green-700'
                    : 'bg-red-50 border border-red-200 text-red-700'
                )}>
                  {inviteMessage.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                  {inviteMessage.text}
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setShowInviteModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSendInvite}
                disabled={inviteSending || !inviteEmail}
                className={cn(
                  'flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-colors',
                  inviteSending || !inviteEmail
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-[#5B7F6D] text-white hover:bg-[#2D4F3E]'
                )}
              >
                {inviteSending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Invitation
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
