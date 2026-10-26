import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Building2, FileText, Send } from 'lucide-react';
import { applicationApi } from '../../api/endpoints';
import useFetch from '../../hooks/useFetch';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { useToast } from '../../hooks/useToast';
import { formatDate } from '../../utils/format';
import PageHeader from '../../components/PageHeader';
import Pagination from '../../components/Pagination';
import StatusBadge from '../../components/StatusBadge';
import ConfirmDialog from '../../components/ConfirmDialog';
import LoadingState from '../../components/LoadingState';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';

const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'under_review', label: 'Under review' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'withdrawn', label: 'Withdrawn' },
];

const WITHDRAWABLE = ['submitted', 'under_review', 'shortlisted'];

/** Student's own job applications with status filters and withdraw. */
export default function MyApplicationsPage() {
  useDocumentTitle('My applications');
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);

  const { data, meta, loading, error, refetch } = useFetch(
    () => applicationApi.mine({ page, limit: 10, applicationStatus: status || undefined }),
    [page, status]
  );

  const withdraw = async () => {
    if (!confirm) return;
    setBusy(true);
    try {
      await applicationApi.withdraw(confirm);
      toast.success('Application withdrawn.');
      setConfirm(null);
      await refetch();
    } catch (err) {
      toast.error(err.friendlyMessage || 'Unable to withdraw the application.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="My applications"
        description="Track the roles you have applied for and where they stand."
        icon={Send}
      />

      <div className="mb-6 flex flex-wrap gap-1 overflow-x-auto">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value || 'all'}
            type="button"
            onClick={() => {
              setStatus(tab.value);
              setPage(1);
            }}
            className={`whitespace-nowrap rounded-lg px-3.5 py-1.5 text-sm font-medium transition ${
              status === tab.value ? 'bg-navy-800 text-white' : 'text-navy-600 hover:bg-navy-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingState label="Loading your applications..." />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : data?.length ? (
        <>
          <div className="space-y-3">
            {data.map((application) => {
              const id = application.id || application._id;
              const job = application.job;
              return (
                <div key={id} className="card p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-semibold text-navy-900">{job?.title || 'Job no longer available'}</p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-sm text-navy-500">
                        <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
                        <span className="truncate">{job?.company || '—'}</span>
                      </p>
                      <p className="mt-1 text-xs text-navy-400">Applied {formatDate(application.appliedAt)}</p>
                    </div>
                    <StatusBadge status={application.applicationStatus} />
                  </div>

                  {application.statusNote ? (
                    <p className="mt-3 rounded-xl bg-navy-50 p-3 text-sm text-navy-600">{application.statusNote}</p>
                  ) : null}

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {application.job ? (
                      <Link to={`/student/jobs/${application.job._id || application.job.id}`} className="btn-secondary btn-sm">
                        <Briefcase className="h-4 w-4" aria-hidden="true" />
                        View job
                      </Link>
                    ) : null}
                    {application.resume ? (
                      <a href={application.resume} target="_blank" rel="noreferrer" className="btn-ghost btn-sm">
                        <FileText className="h-4 w-4" aria-hidden="true" />
                        Resume
                      </a>
                    ) : null}
                    {WITHDRAWABLE.includes(application.applicationStatus) ? (
                      <button
                        type="button"
                        className="btn-ghost btn-sm text-red-600 hover:bg-red-50"
                        onClick={() => setConfirm(application._id || application.id)}
                      >
                        Withdraw
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
          <Pagination meta={meta} onChange={setPage} className="mt-6" />
        </>
      ) : (
        <EmptyState
          icon={Send}
          title="No applications yet"
          description="Browse the job board and apply to opportunities posted by alumni."
          action={
            <Link to="/student/jobs" className="btn-primary btn-sm">
              Browse jobs
            </Link>
          }
        />
      )}

      <ConfirmDialog
        open={Boolean(confirm)}
        title="Withdraw application?"
        message="This will withdraw your application. You will not be able to undo this action."
        confirmLabel="Withdraw"
        loading={busy}
        onConfirm={withdraw}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}
