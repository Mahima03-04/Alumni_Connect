import { useState } from 'react';
import { Briefcase, Check, Eye, Trash2, X } from 'lucide-react';
import { adminApi, jobApi } from '../../api/endpoints';
import useFetch from '../../hooks/useFetch';
import useDebounce from '../../hooks/useDebounce';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { useToast } from '../../hooks/useToast';
import { formatDate, formatSalary, titleCase } from '../../utils/format';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import StatusBadge from '../../components/StatusBadge';
import SearchBar from '../../components/SearchBar';
import FilterSelect from '../../components/FilterSelect';
import Pagination from '../../components/Pagination';
import ErrorState from '../../components/ErrorState';
import { Field, TextArea } from '../../components/FormField';

const APPROVAL_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

const JOB_STATUS_OPTIONS = [
  { value: 'open', label: 'Open' },
  { value: 'closed', label: 'Closed' },
];

/** Admin table of every job post with filters and moderation actions. */
export default function AllJobsPage() {
  useDocumentTitle('All job posts');
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [approvalStatus, setApprovalStatus] = useState('');
  const [jobStatus, setJobStatus] = useState('');
  const [viewing, setViewing] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const [actingId, setActingId] = useState(null);
  const debouncedQ = useDebounce(q, 350);

  const { data, meta, loading, error, refetch } = useFetch(
    () =>
      adminApi.jobs({
        q: debouncedQ || undefined,
        approvalStatus: approvalStatus || undefined,
        jobStatus: jobStatus || undefined,
        page,
        limit: 15,
      }),
    [debouncedQ, approvalStatus, jobStatus, page]
  );

  const jobs = data || [];

  const approve = async (job) => {
    const id = job.id || job._id;
    setActingId(id);
    try {
      await adminApi.updateJobApproval(id, { approvalStatus: 'approved' });
      toast.success('Job approved.');
      await refetch();
    } catch (err) {
      toast.error(err.friendlyMessage || 'Unable to approve the job.');
    } finally {
      setActingId(null);
    }
  };

  const openReject = (job) => {
    setRejecting(job);
    setReason('');
  };

  const submitReject = async (event) => {
    event.preventDefault();
    if (!rejecting) return;
    const id = rejecting.id || rejecting._id;
    if (!reason.trim()) {
      toast.error('Please provide a reason for rejecting this job post.');
      return;
    }
    setSaving(true);
    try {
      await adminApi.updateJobApproval(id, { approvalStatus: 'rejected', reason: reason.trim() });
      toast.success('Job rejected.');
      setRejecting(null);
      setReason('');
      await refetch();
    } catch (err) {
      toast.error(err.friendlyMessage || 'Unable to reject the job.');
    } finally {
      setSaving(false);
    }
  };

  const runDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await jobApi.remove(deleting);
      toast.success('Job deleted.');
      setDeleting(null);
      await refetch();
    } catch (err) {
      toast.error(err.friendlyMessage || 'Unable to delete the job.');
    } finally {
      setBusy(false);
    }
  };

  const columns = [
    {
      key: 'job',
      header: 'Job',
      render: (job) => (
        <div className="min-w-0">
          <p className="font-semibold text-navy-900">{job.title}</p>
          <p className="text-xs text-navy-500">{job.company || '—'}</p>
        </div>
      ),
    },
    {
      key: 'postedBy',
      header: 'Posted by',
      render: (job) => <span className="text-sm text-navy-600">{job.postedBy?.name || '—'}</span>,
    },
    {
      key: 'approvalStatus',
      header: 'Approval',
      render: (job) => <StatusBadge status={job.approvalStatus} />,
    },
    {
      key: 'jobStatus',
      header: 'Status',
      render: (job) => <StatusBadge status={job.jobStatus} />,
    },
    {
      key: 'createdAt',
      header: 'Posted',
      render: (job) => <span className="whitespace-nowrap text-sm text-navy-500">{formatDate(job.createdAt)}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      headerClassName: 'text-right',
      className: 'text-right',
      render: (job) => {
        const id = job.id || job._id;
        return (
          <div className="flex flex-wrap items-center justify-end gap-1">
            <button type="button" className="btn-ghost btn-sm" onClick={() => setViewing(job)}>
              <Eye className="h-4 w-4" aria-hidden="true" />
              View
            </button>
            {job.approvalStatus !== 'approved' ? (
              <button
                type="button"
                className="btn-ghost btn-sm text-emerald-700 hover:bg-emerald-50"
                onClick={() => approve(job)}
                disabled={actingId === id}
              >
                <Check className="h-4 w-4" aria-hidden="true" />
                Approve
              </button>
            ) : null}
            {job.approvalStatus !== 'rejected' ? (
              <button
                type="button"
                className="btn-ghost btn-sm text-amber-700 hover:bg-amber-50"
                onClick={() => openReject(job)}
                disabled={actingId === id}
              >
                <X className="h-4 w-4" aria-hidden="true" />
                Reject
              </button>
            ) : null}
            <button
              type="button"
              className="btn-ghost btn-sm text-red-600 hover:bg-red-50"
              onClick={() => setDeleting(id)}
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Delete
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <PageHeader
        title="All job posts"
        description="Every job post across approval and open/closed states."
        icon={Briefcase}
      />

      <div className="card mb-6 p-4">
        <div className="grid gap-3 md:grid-cols-3">
          <SearchBar
            value={q}
            onChange={(value) => {
              setQ(value);
              setPage(1);
            }}
            placeholder="Search title, company or skill..."
          />
          <FilterSelect
            name="approval-status"
            label=""
            allLabel="All approval states"
            value={approvalStatus}
            onChange={(value) => {
              setApprovalStatus(value);
              setPage(1);
            }}
            options={APPROVAL_OPTIONS}
          />
          <FilterSelect
            name="job-status"
            label=""
            allLabel="All job statuses"
            value={jobStatus}
            onChange={(value) => {
              setJobStatus(value);
              setPage(1);
            }}
            options={JOB_STATUS_OPTIONS}
          />
        </div>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={jobs}
            loading={loading}
            emptyTitle="No job posts found"
            emptyDescription="Try adjusting the search terms or clearing the filters."
          />
          <Pagination meta={meta} onChange={setPage} className="mt-6" />
        </>
      )}

      <Modal
        open={Boolean(viewing)}
        onClose={() => setViewing(null)}
        title={viewing?.title || 'Job details'}
        size="lg"
        footer={
          <button type="button" className="btn-secondary" onClick={() => setViewing(null)}>
            Close
          </button>
        }
      >
        {viewing ? (
          <div className="space-y-4 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={viewing.approvalStatus} />
              <StatusBadge status={viewing.jobStatus} />
            </div>

            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-navy-400">Company</dt>
                <dd className="text-navy-800">{viewing.company || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-navy-400">Posted by</dt>
                <dd className="text-navy-800">{viewing.postedBy?.name || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-navy-400">Location</dt>
                <dd className="text-navy-800">{viewing.location || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-navy-400">Work mode</dt>
                <dd className="text-navy-800">{titleCase(viewing.workMode) || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-navy-400">Employment type</dt>
                <dd className="text-navy-800">{titleCase(viewing.employmentType) || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-navy-400">Experience level</dt>
                <dd className="text-navy-800">{titleCase(viewing.experienceLevel) || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-navy-400">Salary</dt>
                <dd className="text-navy-800">
                  {formatSalary(
                    viewing.salaryMin,
                    viewing.salaryMax,
                    viewing.salaryCurrency || 'INR',
                    viewing.salaryPeriod || 'year'
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-navy-400">Openings</dt>
                <dd className="text-navy-800">{viewing.openings ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-navy-400">Application deadline</dt>
                <dd className="text-navy-800">{viewing.applicationDeadline ? formatDate(viewing.applicationDeadline) : '—'}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-navy-400">Contact email</dt>
                <dd className="truncate text-navy-800">{viewing.contactEmail || '—'}</dd>
              </div>
            </dl>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-navy-400">Description</p>
              <p className="mt-1 whitespace-pre-line text-navy-700">{viewing.description || '—'}</p>
            </div>

            {viewing.skillsRequired?.length ? (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-navy-400">Skills</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {viewing.skillsRequired.map((skill) => (
                    <span key={skill} className="rounded-full bg-accent-50 px-2.5 py-1 text-xs font-medium text-accent-700">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {viewing.approvalStatus === 'rejected' && viewing.rejectionReason ? (
              <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
                <span className="font-semibold">Rejected: </span>
                {viewing.rejectionReason}
              </p>
            ) : null}
          </div>
        ) : null}
      </Modal>

      <Modal
        open={Boolean(rejecting)}
        onClose={() => setRejecting(null)}
        title="Reject job post"
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setRejecting(null)} disabled={saving}>
              Cancel
            </button>
            <button type="submit" form="reject-all-job-form" className="btn-danger" disabled={saving}>
              {saving ? 'Rejecting...' : 'Reject job'}
            </button>
          </>
        }
      >
        <form id="reject-all-job-form" onSubmit={submitReject}>
          <p className="mb-4 text-sm text-navy-600">
            Rejecting <span className="font-semibold text-navy-900">{rejecting?.title}</span> will close the post and
            notify the poster. Please explain why.
          </p>
          <Field label="Reason for rejection" htmlFor="rejectionReason" required>
            <TextArea
              id="rejectionReason"
              rows={4}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="e.g. Missing salary details or unclear requirements."
            />
          </Field>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete job post?"
        message="This permanently removes the job and all applications it received."
        confirmLabel="Delete job"
        loading={busy}
        onConfirm={runDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
