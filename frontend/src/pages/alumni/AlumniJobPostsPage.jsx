import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Pencil, Plus, Trash2, Users, XCircle, RotateCcw } from 'lucide-react';
import { jobApi } from '../../api/endpoints';
import useFetch from '../../hooks/useFetch';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { formatDate, titleCase } from '../../utils/format';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import Pagination from '../../components/Pagination';
import ConfirmDialog from '../../components/ConfirmDialog';
import LoadingState from '../../components/LoadingState';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';

const APPROVAL_TABS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending approval' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

/** Alumni view of every job they have posted, across all approval states. */
export default function AlumniJobPostsPage() {
  useDocumentTitle('My job posts');
  const { user } = useAuth();
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState('');
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);

  const { data, meta, loading, error, refetch } = useFetch(
    () => jobApi.list({ postedBy: user?._id, page, limit: 12, sortBy: 'recent' }),
    [page, user?._id]
  );

  const jobs = data || [];
  const filtered = tab ? jobs.filter((job) => job.approvalStatus === tab) : jobs;
  const countFor = (value) => jobs.filter((job) => job.approvalStatus === value).length;

  const toggleStatus = async (job) => {
    const id = job.id || job._id;
    const nextStatus = job.jobStatus === 'open' ? 'closed' : 'open';
    try {
      await jobApi.update(id, { jobStatus: nextStatus });
      toast.success(nextStatus === 'open' ? 'Job re-opened.' : 'Job closed.');
      await refetch();
    } catch (err) {
      toast.error(err.friendlyMessage || 'Unable to update the job status.');
    }
  };

  const runDelete = async () => {
    if (!confirm) return;
    setBusy(true);
    try {
      await jobApi.remove(confirm);
      toast.success('Job deleted.');
      setConfirm(null);
      await refetch();
    } catch (err) {
      toast.error(err.friendlyMessage || 'Unable to delete the job.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="My job posts"
        description="Create and manage the openings you share with students."
        icon={Briefcase}
        actions={
          <Link to="/alumni/jobs/new" className="btn-primary btn-sm">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Post a job
          </Link>
        }
      />

      <div className="mb-6 flex flex-wrap gap-1">
        {APPROVAL_TABS.map((item) => (
          <button
            key={item.value || 'all'}
            type="button"
            onClick={() => setTab(item.value)}
            className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition ${
              tab === item.value ? 'bg-navy-800 text-white' : 'text-navy-600 hover:bg-navy-50'
            }`}
          >
            {item.label}
            {item.value ? <span className="ml-1.5 text-xs opacity-80">{countFor(item.value)}</span> : null}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingState label="Loading your job posts..." />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : filtered.length ? (
        <>
          <div className="space-y-3">
            {filtered.map((job) => {
              const id = job.id || job._id;
              return (
                <div key={id} className="card p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-semibold text-navy-900">{job.title}</p>
                      <p className="text-sm text-navy-500">
                        {job.company} · {titleCase(job.employmentType)} · {titleCase(job.workMode)}
                      </p>
                      <p className="mt-1 text-xs text-navy-400">
                        Posted {formatDate(job.createdAt)} · {job.applicants ?? job.applicationCount ?? 0} applications
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={job.approvalStatus} label={`Approval: ${titleCase(job.approvalStatus)}`} />
                      <StatusBadge status={job.jobStatus} />
                    </div>
                  </div>

                  {job.approvalStatus === 'rejected' && job.rejectionReason ? (
                    <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">
                      <span className="font-semibold">Rejected: </span>
                      {job.rejectionReason}
                    </p>
                  ) : null}

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Link to={`/alumni/jobs/${id}/applicants`} className="btn-secondary btn-sm">
                      <Users className="h-4 w-4" aria-hidden="true" />
                      Applicants
                    </Link>
                    <Link to={`/alumni/jobs/${id}/edit`} className="btn-secondary btn-sm">
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                      Edit
                    </Link>
                    <button type="button" className="btn-ghost btn-sm" onClick={() => toggleStatus(job)}>
                      {job.jobStatus === 'open' ? (
                        <>
                          <XCircle className="h-4 w-4" aria-hidden="true" />
                          Close
                        </>
                      ) : (
                        <>
                          <RotateCcw className="h-4 w-4" aria-hidden="true" />
                          Re-open
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      className="btn-ghost btn-sm ml-auto text-red-600 hover:bg-red-50"
                      onClick={() => setConfirm(id)}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <Pagination meta={meta} onChange={setPage} className="mt-6" />
        </>
      ) : (
        <EmptyState
          icon={Briefcase}
          title={tab ? 'No job posts in this category' : 'No job posts yet'}
          description="Share an opening with the community. Your post appears once an administrator approves it."
          action={
            <Link to="/alumni/jobs/new" className="btn-primary btn-sm">
              Post a job
            </Link>
          }
        />
      )}

      <ConfirmDialog
        open={Boolean(confirm)}
        title="Delete job post?"
        message="This permanently removes the job and all applications it received."
        confirmLabel="Delete job"
        loading={busy}
        onConfirm={runDelete}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}
