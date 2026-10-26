import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Award,
  Building2,
  CalendarDays,
  FileText,
  GraduationCap,
  Handshake,
  Link2,
  LogIn,
  Mail,
  MapPin,
  Phone,
  Send,
  Briefcase,
  UserSquare2,
} from 'lucide-react';
import { adminApi } from '../../api/endpoints';
import useFetch from '../../hooks/useFetch';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { ROLE_LABELS } from '../../utils/constants';
import { fileUrl, formatDate, formatDateTime, titleCase } from '../../utils/format';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import Avatar from '../../components/Avatar';
import StatusBadge from '../../components/StatusBadge';
import LoadingState from '../../components/LoadingState';
import ErrorState from '../../components/ErrorState';
import { Select, TextArea } from '../../components/FormField';

const ACCOUNT_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'suspended', label: 'Suspended' },
];

const EDITABLE_ROLE_OPTIONS = [
  { value: 'student', label: 'Student' },
  { value: 'alumni', label: 'Alumni' },
];

/** Detail view for a single user with profile data and status controls. */
export default function UserDetailPage() {
  useDocumentTitle('User details');
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const toast = useToast();

  const { data, loading, error, refetch } = useFetch(() => adminApi.user(id), [id]);

  const [form, setForm] = useState({ accountStatus: 'active', role: 'student', reason: '' });
  const [saving, setSaving] = useState(false);

  const user = data?.user;
  const profile = data?.profile;
  const stats = data?.stats || {};

  useEffect(() => {
    if (user) {
      setForm({
        accountStatus: user.accountStatus || 'active',
        role: user.role === 'admin' ? 'admin' : user.role || 'student',
        reason: '',
      });
    }
  }, [user]);

  const saveStatus = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const payload = {
        accountStatus: form.accountStatus,
        reason: form.reason.trim() || undefined,
      };
      if (user.role !== 'admin') payload.role = form.role;
      await adminApi.updateUserStatus(user._id || user.id, payload);
      toast.success('User status updated.');
      setForm((prev) => ({ ...prev, reason: '' }));
      await refetch();
    } catch (err) {
      toast.error(err.friendlyMessage || 'Unable to update this user.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState label="Loading user details..." />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!user) {
    return (
      <div>
        <PageHeader title="User not found" />
        <ErrorState title="User not found" message="This user does not exist or is no longer available." />
      </div>
    );
  }

  const isSelf = (() => {
    const userId = user._id || user.id;
    const selfId = currentUser?._id || currentUser?.id;
    return Boolean(userId && selfId && userId === selfId);
  })();
  const locked = user.role === 'admin' || isSelf;

  const profileFields = [];
  if (profile) {
    if (profile.university) profileFields.push({ icon: GraduationCap, label: 'University', value: profile.university });
    if (profile.department) profileFields.push({ icon: GraduationCap, label: 'Department', value: profile.department });
    if (profile.degree) profileFields.push({ icon: Award, label: 'Degree', value: profile.degree });
    if (profile.course) profileFields.push({ icon: Award, label: 'Course', value: profile.course });
    if (profile.batch) profileFields.push({ icon: GraduationCap, label: 'Batch', value: profile.batch });
    if (profile.graduationYear) profileFields.push({ icon: CalendarDays, label: 'Graduation year', value: profile.graduationYear });
    if (profile.currentSemester) profileFields.push({ icon: CalendarDays, label: 'Current semester', value: profile.currentSemester });
    if (profile.currentCompany) profileFields.push({ icon: Building2, label: 'Current company', value: profile.currentCompany });
    if (profile.jobTitle) profileFields.push({ icon: Briefcase, label: 'Job title', value: profile.jobTitle });
    if (profile.workExperience) profileFields.push({ icon: Briefcase, label: 'Work experience', value: profile.workExperience });
    if (profile.location) profileFields.push({ icon: MapPin, label: 'Location', value: profile.location });
    if (typeof profile.openToMentorship === 'boolean') {
      profileFields.push({ icon: Handshake, label: 'Open to mentorship', value: profile.openToMentorship ? 'Yes' : 'No' });
    }
  }

  return (
    <div>
      <PageHeader
        title={user.name}
        breadcrumb={[{ label: 'Users', to: '/admin/users' }, { label: user.name || 'User' }]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <span className="badge bg-navy-100 text-navy-600">{ROLE_LABELS[user.role] || titleCase(user.role)}</span>
            <StatusBadge status={user.accountStatus} />
            <StatusBadge status={user.approvalStatus} />
          </div>
        }
      />

      <div className="card mb-6 flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
        <Avatar src={user.profilePhoto} name={user.name} size="lg" />
        <div className="min-w-0">
          <p className="text-lg font-semibold text-navy-900">{user.name}</p>
          <p className="flex items-center gap-1.5 text-sm text-navy-500">
            <Mail className="h-4 w-4" aria-hidden="true" />
            {user.email}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard icon={Send} label="Applications" value={stats.applicationCount ?? 0} accent="royal" />
        <StatCard icon={Briefcase} label="Jobs posted" value={stats.jobCount ?? 0} accent="accent" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="card p-6">
          <h2 className="text-base font-semibold text-navy-900">Account details</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-navy-400" aria-hidden="true" />
              <div>
                <dt className="text-navy-400">Phone</dt>
                <dd className="text-navy-700">{user.phone || '—'}</dd>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-navy-400" aria-hidden="true" />
              <div>
                <dt className="text-navy-400">Joined</dt>
                <dd className="text-navy-700">{formatDate(user.createdAt)}</dd>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <LogIn className="mt-0.5 h-4 w-4 shrink-0 text-navy-400" aria-hidden="true" />
              <div>
                <dt className="text-navy-400">Last login</dt>
                <dd className="text-navy-700">{user.lastLogin ? formatDateTime(user.lastLogin) : '—'}</dd>
              </div>
            </div>
            {user.approvalReason ? (
              <div className="flex items-start gap-2">
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-navy-400" aria-hidden="true" />
                <div>
                  <dt className="text-navy-400">Approval reason</dt>
                  <dd className="text-navy-700">{user.approvalReason}</dd>
                </div>
              </div>
            ) : null}
          </dl>
        </section>

        <section className="card p-6">
          <h2 className="text-base font-semibold text-navy-900">
            {user.role === 'alumni' ? 'Alumni profile' : 'Student profile'}
          </h2>
          {profile ? (
            <dl className="mt-4 space-y-3 text-sm">
              {profileFields.map((field) => (
                <div key={field.label} className="flex items-start gap-2">
                  <field.icon className="mt-0.5 h-4 w-4 shrink-0 text-navy-400" aria-hidden="true" />
                  <div className="min-w-0">
                    <dt className="text-navy-400">{field.label}</dt>
                    <dd className="break-words text-navy-700">{field.value}</dd>
                  </div>
                </div>
              ))}

              {profile.skills?.length ? (
                <div>
                  <dt className="text-navy-400">Skills</dt>
                  <dd className="mt-1 flex flex-wrap gap-1.5">
                    {profile.skills.map((skill) => (
                      <span key={skill} className="rounded-full bg-royal-50 px-2.5 py-1 text-xs font-medium text-royal-700">
                        {skill}
                      </span>
                    ))}
                  </dd>
                </div>
              ) : null}

              {profile.interests?.length ? (
                <div>
                  <dt className="text-navy-400">Interests</dt>
                  <dd className="mt-1 flex flex-wrap gap-1.5">
                    {profile.interests.map((interest) => (
                      <span key={interest} className="rounded-full bg-accent-50 px-2.5 py-1 text-xs font-medium text-accent-700">
                        {interest}
                      </span>
                    ))}
                  </dd>
                </div>
              ) : null}

              {profile.mentorshipAreas?.length ? (
                <div>
                  <dt className="text-navy-400">Mentorship areas</dt>
                  <dd className="mt-1 flex flex-wrap gap-1.5">
                    {profile.mentorshipAreas.map((area) => (
                      <span key={area} className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                        {area}
                      </span>
                    ))}
                  </dd>
                </div>
              ) : null}

              {profile.biography ? (
                <div>
                  <dt className="text-navy-400">Biography</dt>
                  <dd className="mt-1 rounded-xl bg-navy-50 p-3 text-navy-600">{profile.biography}</dd>
                </div>
              ) : null}

              {profile.linkedinUrl ? (
                <div className="flex items-center gap-2">
                  <Link2 className="h-4 w-4 shrink-0 text-navy-400" aria-hidden="true" />
                  <a href={profile.linkedinUrl} target="_blank" rel="noreferrer" className="link truncate">
                    LinkedIn profile
                  </a>
                </div>
              ) : null}

              {profile.resume ? (
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 shrink-0 text-navy-400" aria-hidden="true" />
                  <a href={fileUrl(profile.resume)} target="_blank" rel="noreferrer" className="link truncate">
                    View resume
                  </a>
                </div>
              ) : null}
            </dl>
          ) : (
            <p className="mt-4 flex items-center gap-2 text-sm text-navy-400">
              <UserSquare2 className="h-4 w-4" aria-hidden="true" />
              No profile details.
            </p>
          )}
        </section>
      </div>

      <section className="card mt-6 p-6">
        <h2 className="text-base font-semibold text-navy-900">Update status</h2>
        {locked ? (
          <p className="mt-4 rounded-xl bg-navy-50 p-3 text-sm text-navy-500">
            {isSelf
              ? 'You cannot change the status of your own account.'
              : 'Administrator accounts cannot be modified here.'}
          </p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="detail-account">
                Account status
              </label>
              <Select
                id="detail-account"
                value={form.accountStatus}
                onChange={(event) => setForm((prev) => ({ ...prev, accountStatus: event.target.value }))}
              >
                {ACCOUNT_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="label" htmlFor="detail-role">
                Role
              </label>
              <Select
                id="detail-role"
                value={form.role}
                onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value }))}
              >
                {EDITABLE_ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="detail-reason">
                Reason <span className="text-navy-400">(optional)</span>
              </label>
              <TextArea
                id="detail-reason"
                value={form.reason}
                onChange={(event) => setForm((prev) => ({ ...prev, reason: event.target.value }))}
                rows={3}
                placeholder="Add a short note about this change"
                maxLength={500}
              />
            </div>
            <div className="sm:col-span-2">
              <button type="button" className="btn-primary" onClick={saveStatus} disabled={saving}>
                {saving ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
