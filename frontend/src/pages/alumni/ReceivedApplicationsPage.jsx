import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Building2, FileText, Mail, Send, Users } from 'lucide-react';
import { applicationApi } from '../../api/endpoints';
import useFetch from '../../hooks/useFetch';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { useToast } from '../../hooks/useToast';
import { formatDate } from '../../utils/format';
import PageHeader from '../../components/PageHeader';
import Avatar from '../../components/Avatar';
import StatusBadge from '../../components/StatusBadge';
import Pagination from '../../components/Pagination';
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

const QUICK_STATUS = [
  { value: 'shortlisted', label: 'Shortlist', tone: 'text-amber-700 hover:bg-amber-50' },
  { value: 'accepted', label: 'Accept', tone: 'text-emerald-700 hover:bg-emerald-50' },
  { value: 'rejected', label: 'Reject', tone: 'text-red-600 hover:bg-red-50' },
];

/** Every application received across all of an alumnus' job posts. */
export default function ReceivedApplicationsPage() {
  useDocumentTitle('Applications');
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [busyId, setBusyId] = useState(null);

  const { data, meta, loading, error, refetch } = useFetch(
    () => applicationApi.received({ page, limit: 15, applicationStatus: status || undefined }),
    [page, status]
  );

  const updateStatus = async (application, applicationStatus) => {
    const id = application._id || application.id;
    setBusyId(id);
    try {
      await applicationApi.updateStatus(id, { applicationStatus });
      toast.success('Application status updated.');
      await refetch();
    } catch (err) {
      toast.error(err.friendlyMessage || 'Unable to update the application.');
    } finally {
      setBusyId(null);
    }
  };

  const applications = data || [];

  return (
    <div>
      <PageHeader
        title="Applications"
        description="Every application students have sent to your job posts."
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
        <LoadingState label="Loading applications..." />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : applications.length ? (
        <>
          <div className="space-y-3">
            {applications.map((application) => {
              const id = application._id || application.id;
              const student = application.student;
              const job = application.job;
              return (
                <div key={id} className="card p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3">
                      <Avatar src={student?.profilePhoto} name={student?.name || application.applicantName} size="md" />
                      <div className="min-w-0">
                        <p className="font-semibold text-navy-900">{student?.name || application.applicantName}</p>
                        <p className="mt-0.5 flex items-center gap-1.5 text-sm text-navy-500">
                          <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                          <span className="truncate">{student?.email || application.applicantEmail}</span>
                        </p>
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-navy-400">
                          <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
                          <span className="truncate">{job?.title || 'Job removed'}</span>
                          {job?.company ? ` · ${job.company}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-start gap-1 sm:items-end">
                      <StatusBadge status={application.applicationStatus} />
                      <span className="text-xs text-navy-400">Applied {formatDate(application.appliedAt)}</span>
                    </div>
                  </div>

                  {application.statusNote ? (
                    <p className="mt-3 rounded-xl bg-navy-50 p-3 text-sm text-navy-600">{application.statusNote}</p>
                  ) : null}

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {application.resume ? (
                      <a href={application.resume} target="_blank" rel="noreferrer" className="btn-secondary btn-sm">
                        <FileText className="h-4 w-4" aria-hidden="true" />
                        Resume
                      </a>
                    ) : null}
                    {job ? (
                      <Link to={`/alumni/jobs/${job._id || job.id}/applicants`} className="btn-ghost btn-sm">
                        <Users className="h-4 w-4" aria-hidden="true" />
                        All applicants
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </Link>
                    ) : null}
                    <div className="ml-auto flex flex-wrap items-center gap-1">
                      {QUICK_STATUS.filter((action) => action.value !== application.applicationStatus).map((action) => (
                        <button
                          key={action.value}
                          type="button"
                          className={`btn-ghost btn-sm ${action.tone}`}
                          disabled={busyId === id}
                          onClick={() => updateStatus(application, action.value)}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
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
          description="Once students apply to your job posts their applications will appear here."
          action={
            <Link to="/alumni/jobs" className="btn-primary btn-sm">
              View my job posts
            </Link>
          }
        />
      )}
    </div>
  );
}
