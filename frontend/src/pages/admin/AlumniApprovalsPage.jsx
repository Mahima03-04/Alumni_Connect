import { useState } from 'react';
import {
  Briefcase,
  Building2,
  CheckCircle2,
  GraduationCap,
  Mail,
  UserCheck,
  XCircle,
} from 'lucide-react';
import { adminApi } from '../../api/endpoints';
import useFetch from '../../hooks/useFetch';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { useToast } from '../../hooks/useToast';
import { formatDate } from '../../utils/format';
import PageHeader from '../../components/PageHeader';
import Avatar from '../../components/Avatar';
import StatusBadge from '../../components/StatusBadge';
import Pagination from '../../components/Pagination';
import Modal from '../../components/Modal';
import FilterSelect from '../../components/FilterSelect';
import { Field, TextArea } from '../../components/FormField';
import LoadingState from '../../components/LoadingState';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';

const APPROVAL_OPTIONS = [
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

/** Admin queue for reviewing alumni registrations. */
export default function AlumniApprovalsPage() {
  useDocumentTitle('Alumni approvals');
  const toast = useToast();
  const [tab, setTab] = useState('pending');
  const [page, setPage] = useState(1);
  const [approvalStatus, setApprovalStatus] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState('');

  const { data, meta, loading, error, refetch } = useFetch(
    () =>
      tab === 'pending'
        ? adminApi.pendingAlumni({ page, limit: 10 })
        : adminApi.reviewedAlumni({ page, limit: 10, approvalStatus: approvalStatus || undefined }),
    [tab, page, approvalStatus]
  );

  const switchTab = (value) => {
    setTab(value);
    setPage(1);
    setApprovalStatus('');
  };

  const approve = async (user) => {
    const id = user._id || user.id;
    setBusyId(id);
    try {
      await adminApi.updateAlumniApproval(id, { approvalStatus: 'approved' });
      toast.success(`${user.name} approved.`);
      await refetch();
    } catch (err) {
      toast.error(err.friendlyMessage || 'Unable to approve this applicant.');
    } finally {
      setBusyId(null);
    }
  };

  const openReject = (user) => {
    setRejecting(user);
    setReason('');
    setReasonError('');
  };

  const confirmReject = async () => {
    if (!rejecting) return;
    if (!reason.trim()) {
      setReasonError('Please provide a reason for rejecting this applicant.');
      return;
    }
    const id = rejecting._id || rejecting.id;
    setBusyId(id);
    try {
      await adminApi.updateAlumniApproval(id, { approvalStatus: 'rejected', reason: reason.trim() });
      toast.success(`${rejecting.name} rejected.`);
      setRejecting(null);
      setReason('');
      await refetch();
    } catch (err) {
      toast.error(err.friendlyMessage || 'Unable to reject this applicant.');
    } finally {
      setBusyId(null);
    }
  };

  const items = data || [];

  return (
    <div>
      <PageHeader
        title="Alumni approvals"
        description="Review new alumni registrations and decide who joins the network."
        icon={UserCheck}
      />

      <div className="mb-6 inline-flex rounded-xl border border-navy-200 bg-white p-1">
        {[
          { value: 'pending', label: 'Pending' },
          { value: 'reviewed', label: 'Reviewed' },
        ].map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => switchTab(option.value)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${
              tab === option.value ? 'bg-navy-800 text-white' : 'text-navy-600 hover:bg-navy-50'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {tab === 'reviewed' ? (
        <div className="mb-4 max-w-xs">
          <FilterSelect
            label="Approval status"
            name="filter-approval-status"
            allLabel="All statuses"
            value={approvalStatus}
            onChange={(value) => {
              setApprovalStatus(value);
              setPage(1);
            }}
            options={APPROVAL_OPTIONS}
          />
        </div>
      ) : null}

      {loading ? (
        <LoadingState label="Loading alumni..." />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : items.length ? (
        <>
          <div className="space-y-3">
            {items.map((item) => {
              const user = tab === 'pending' ? item.user : item;
              const profile = tab === 'pending' ? item.profile : null;
              if (!user) return null;
              const id = user._id || user.id;
              const isBusy = busyId === id;
              return (
                <div key={id} className="card p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 gap-3">
                      <Avatar src={user.profilePhoto} name={user.name} size="md" />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-navy-900">{user.name}</p>
                        <p className="flex items-center gap-1.5 truncate text-sm text-navy-500">
                          <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                          {user.email}
                        </p>
                        <p className="mt-0.5 text-xs text-navy-400">
                          Registered {formatDate(user.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {tab === 'pending' ? (
                        <>
                          <button
                            type="button"
                            className="btn-primary btn-sm"
                            disabled={isBusy}
                            onClick={() => approve(user)}
                          >
                            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                            Approve
                          </button>
                          <button
                            type="button"
                            className="btn-ghost btn-sm text-red-600 hover:bg-red-50"
                            disabled={isBusy}
                            onClick={() => openReject(user)}
                          >
                            <XCircle className="h-4 w-4" aria-hidden="true" />
                            Reject
                          </button>
                        </>
                      ) : (
                        <StatusBadge status={user.approvalStatus} />
                      )}
                    </div>
                  </div>

                  {tab === 'pending' && profile ? (
                    <dl className="mt-4 grid gap-2 text-sm text-navy-600 sm:grid-cols-2">
                      {profile.department ? (
                        <div className="flex items-center gap-2">
                          <GraduationCap className="h-4 w-4 shrink-0 text-navy-400" aria-hidden="true" />
                          <span className="truncate">
                            {profile.department}
                            {profile.graduationYear ? ` · Class of ${profile.graduationYear}` : ''}
                          </span>
                        </div>
                      ) : null}
                      {profile.currentCompany ? (
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 shrink-0 text-navy-400" aria-hidden="true" />
                          <span className="truncate">{profile.currentCompany}</span>
                        </div>
                      ) : null}
                      {profile.jobTitle ? (
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4 shrink-0 text-navy-400" aria-hidden="true" />
                          <span className="truncate">{profile.jobTitle}</span>
                        </div>
                      ) : null}
                    </dl>
                  ) : null}

                  {tab === 'pending' && profile?.biography ? (
                    <p className="mt-3 rounded-xl bg-navy-50 p-3 text-sm text-navy-600">{profile.biography}</p>
                  ) : null}

                  {tab === 'reviewed' ? (
                    <div className="mt-3 space-y-1 text-sm text-navy-600">
                      <p className="text-xs text-navy-400">
                        {user.approvedAt ? `Reviewed ${formatDate(user.approvedAt)}` : 'Reviewed'}
                        {user.approvedBy?.name ? ` by ${user.approvedBy.name}` : ''}
                      </p>
                      {user.approvalReason ? (
                        <p className="rounded-xl bg-navy-50 p-3 text-sm text-navy-600">
                          <span className="font-semibold">Reason: </span>
                          {user.approvalReason}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
          <Pagination meta={meta} onChange={setPage} className="mt-6" />
        </>
      ) : (
        <EmptyState
          icon={UserCheck}
          title={tab === 'pending' ? 'No pending approvals' : 'No reviewed applicants'}
          description={
            tab === 'pending'
              ? 'New alumni registrations awaiting review will appear here.'
              : 'Applicants you have reviewed will appear here.'
          }
        />
      )}

      <Modal
        open={Boolean(rejecting)}
        onClose={() => setRejecting(null)}
        title="Reject applicant"
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setRejecting(null)} disabled={Boolean(busyId)}>
              Cancel
            </button>
            <button type="button" className="btn-danger" onClick={confirmReject} disabled={Boolean(busyId)}>
              {busyId ? 'Working...' : 'Reject applicant'}
            </button>
          </>
        }
      >
        <p className="text-sm text-navy-600">
          Please explain why {rejecting?.name || 'this applicant'} is being rejected. They will see this reason.
        </p>
        <div className="mt-4">
          <Field label="Reason" htmlFor="reject-reason" error={reasonError} required>
            <TextArea
              id="reject-reason"
              value={reason}
              onChange={(event) => {
                setReason(event.target.value);
                if (reasonError) setReasonError('');
              }}
              rows={4}
              placeholder="Reason for rejection"
              error={reasonError}
              maxLength={500}
            />
          </Field>
        </div>
      </Modal>
    </div>
  );
}
