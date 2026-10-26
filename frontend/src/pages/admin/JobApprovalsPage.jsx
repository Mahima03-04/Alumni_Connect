import { useState } from 'react';
import { Building2, Check, ClipboardCheck, X } from 'lucide-react';
import { adminApi } from '../../api/endpoints';
import useFetch from '../../hooks/useFetch';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { useToast } from '../../hooks/useToast';
import { formatDate, formatSalary, titleCase } from '../../utils/format';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';
import Pagination from '../../components/Pagination';
import LoadingState, { Spinner } from '../../components/LoadingState';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import { Field, TextArea } from '../../components/FormField';

/** Admin queue of job posts awaiting an approval decision. */
export default function JobApprovalsPage() {
  useDocumentTitle('Job approvals');
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [actingId, setActingId] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const { data, meta, loading, error, refetch } = useFetch(
    () => adminApi.pendingJobs({ page, limit: 15 }),
    [page]
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

  return (
    <div>
      <PageHeader
        title="Job approvals"
        description="Review job posts from alumni before they appear on the job board."
        icon={ClipboardCheck}
      />

      {loading ? (
        <LoadingState label="Loading pending jobs..." />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : jobs.length ? (
        <>
          <div className="space-y-3">
            {jobs.map((job) => {
              const id = job.id || job._id;
              const score = job.matchScore ?? job.score;
              const chips = [
                job.location,
                titleCase(job.workMode),
                titleCase(job.employmentType),
                titleCase(job.experienceLevel),
              ].filter(Boolean);
              return (
                <div key={id} className="card p-5">
                  <div className="min-w-0">
                    <p className="font-semibold text-navy-900">{job.title}</p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-sm text-navy-500">
                      <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
                      <span className="truncate">{job.company || '—'}</span>
                    </p>
                    <p className="mt-1 text-xs text-navy-400">
                      Posted by {job.postedBy?.name || '—'} · {formatDate(job.createdAt)}
                    </p>
                  </div>

                  {job.description ? (
                    <p className="mt-3 line-clamp-3 text-sm text-navy-600">{job.description}</p>
                  ) : null}

                  <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
                    {chips.map((chip) => (
                      <span key={chip} className="rounded-full bg-navy-50 px-2.5 py-1 font-medium text-navy-600">
                        {chip}
                      </span>
                    ))}
                    {typeof score === 'number' ? (
                      <span className="rounded-full bg-royal-50 px-2.5 py-1 font-medium text-royal-700">
                        Match {score}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-navy-600">
                    <span className="font-medium text-navy-700">
                      {formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency || 'INR', job.salaryPeriod || 'year')}
                    </span>
                    <span className="text-xs text-navy-400">
                      Apply by {job.applicationDeadline ? formatDate(job.applicationDeadline) : 'no deadline'}
                    </span>
                  </div>

                  {job.skillsRequired?.length ? (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {job.skillsRequired.map((skill) => (
                        <span key={skill} className="rounded-full bg-accent-50 px-2.5 py-1 text-xs font-medium text-accent-700">
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      className="btn-primary btn-sm"
                      onClick={() => approve(job)}
                      disabled={actingId === id}
                    >
                      {actingId === id ? (
                        <Spinner className="h-4 w-4" />
                      ) : (
                        <Check className="h-4 w-4" aria-hidden="true" />
                      )}
                      Approve
                    </button>
                    <button
                      type="button"
                      className="btn-secondary btn-sm text-red-600"
                      onClick={() => openReject(job)}
                      disabled={actingId === id}
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                      Reject
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
          icon={ClipboardCheck}
          title="No job posts pending approval"
          description="New job posts submitted by alumni will appear here for review."
        />
      )}

      <Modal
        open={Boolean(rejecting)}
        onClose={() => setRejecting(null)}
        title="Reject job post"
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setRejecting(null)} disabled={saving}>
              Cancel
            </button>
            <button type="submit" form="reject-job-form" className="btn-danger" disabled={saving}>
              {saving ? 'Rejecting...' : 'Reject job'}
            </button>
          </>
        }
      >
        <form id="reject-job-form" onSubmit={submitReject}>
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
    </div>
  );
}
