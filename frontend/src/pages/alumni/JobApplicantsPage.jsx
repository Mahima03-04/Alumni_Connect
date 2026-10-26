import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Building2, CheckCircle2, FileText, Filter, Mail, Users } from 'lucide-react';
import { jobApi, applicationApi } from '../../api/endpoints';
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
import LoadingState from '../../components/LoadingState';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import { Field, TextArea } from '../../components/FormField';

const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'under_review', label: 'Under review' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'withdrawn', label: 'Withdrawn' },
];

const NEXT_STATUS = [
  { value: 'under_review', label: 'Mark under review' },
  { value: 'shortlisted', label: 'Shortlist' },
  { value: 'accepted', label: 'Accept' },
  { value: 'rejected', label: 'Reject' },
];

/** Applicants for a single alumni job post, with status updates. */
export default function JobApplicantsPage() {
  const { id } = useParams();
  useDocumentTitle('Applicants');
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ applicationStatus: 'under_review', statusNote: '' });
  const [saving, setSaving] = useState(false);

  const { data, meta, loading, error, refetch } = useFetch(
    () => jobApi.applications(id, { page, limit: 15, applicationStatus: status || undefined }),
    [id, page, status]
  );

  const job = data?.job;
  const applications = data?.applications || [];

  const openEditor = (application) => {
    setEditing(application);
    setForm({
      applicationStatus:
        application.applicationStatus === 'submitted' ? 'under_review' : application.applicationStatus,
      statusNote: application.statusNote || '',
    });
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!editing) return;
    setSaving(true);
    try {
      await applicationApi.updateStatus(editing._id || editing.id, form);
      toast.success('Application status updated.');
      setEditing(null);
      await refetch();
    } catch (err) {
      toast.error(err.friendlyMessage || 'Unable to update the application.');
    } finally {
      setSaving(false);
    }
  };

  const quickUpdate = async (application, applicationStatus) => {
    try {
      await applicationApi.updateStatus(application._id || application.id, { applicationStatus });
      toast.success('Application status updated.');
      await refetch();
    } catch (err) {
      toast.error(err.friendlyMessage || 'Unable to update the application.');
    }
  };

  return (
    <div>
      <PageHeader
        title={job?.title ? `Applicants · ${job.title}` : 'Applicants'}
        description="Review the students who applied and keep their status up to date."
        icon={Users}
        breadcrumb={[{ label: 'My job posts', to: '/alumni/jobs' }, { label: 'Applicants' }]}
        actions={
          <Link to="/alumni/jobs" className="btn-secondary btn-sm">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to job posts
          </Link>
        }
      />

      {job ? (
        <div className="card mb-6 flex flex-wrap items-center gap-4 p-4">
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-sm font-medium text-navy-900">
              <Building2 className="h-4 w-4 text-navy-400" aria-hidden="true" />
              {job.company}
            </p>
            <p className="mt-0.5 text-xs text-navy-400">
              {meta?.total ?? applications.length} application{(meta?.total ?? applications.length) === 1 ? '' : 's'} in total
            </p>
          </div>
        </div>
      ) : null}

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1">
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
        <div className="sm:hidden">
          <FilterSelect
            name="applicant-status"
            label=""
            allLabel="All statuses"
            value={status}
            onChange={(value) => {
              setStatus(value);
              setPage(1);
            }}
            options={STATUS_TABS.filter((tab) => tab.value).map((tab) => ({ value: tab.value, label: tab.label }))}
          />
        </div>
      </div>

      {loading ? (
        <LoadingState label="Loading applicants..." />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : applications.length ? (
        <>
          <div className="space-y-3">
            {applications.map((application) => {
              const applicant = application.applicant;
              return (
                <div key={application._id || application.id} className="card p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3">
                      <Avatar src={applicant?.profilePhoto} name={applicant?.name || application.applicantName} size="md" />
                      <div className="min-w-0">
                        <p className="font-semibold text-navy-900">{applicant?.name || application.applicantName}</p>
                        <p className="mt-0.5 flex items-center gap-1.5 text-sm text-navy-500">
                          <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                          <span className="truncate">{applicant?.email || application.applicantEmail}</span>
                        </p>
                        <p className="mt-1 text-xs text-navy-400">Applied {formatDate(application.appliedAt)}</p>
                      </div>
                    </div>
                    <StatusBadge status={application.applicationStatus} />
                  </div>

                  {application.coverLetter ? (
                    <p className="mt-4 whitespace-pre-line rounded-xl bg-navy-50 p-3 text-sm text-navy-600">
                      {application.coverLetter}
                    </p>
                  ) : null}

                  {application.statusNote ? (
                    <p className="mt-3 rounded-xl border border-navy-100 p-3 text-sm text-navy-500">
                      <span className="font-medium text-navy-700">Note: </span>
                      {application.statusNote}
                    </p>
                  ) : null}

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {application.resume ? (
                      <a href={application.resume} target="_blank" rel="noreferrer" className="btn-secondary btn-sm">
                        <FileText className="h-4 w-4" aria-hidden="true" />
                        Resume
                      </a>
                    ) : null}
                    {application.applicationStatus !== 'accepted' ? (
                      <button
                        type="button"
                        className="btn-ghost btn-sm text-emerald-700 hover:bg-emerald-50"
                        onClick={() => quickUpdate(application, 'accepted')}
                      >
                        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                        Accept
                      </button>
                    ) : null}
                    <button type="button" className="btn-ghost btn-sm ml-auto" onClick={() => openEditor(application)}>
                      <Filter className="h-4 w-4" aria-hidden="true" />
                      Update status
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
          icon={Users}
          title={status ? 'No applications in this category' : 'No applications yet'}
          description="Students who apply to this job will appear here."
        />
      )}

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title="Update application status"
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setEditing(null)} disabled={saving}>
              Cancel
            </button>
            <button type="submit" form="applicant-status-form" className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </>
        }
      >
        <form id="applicant-status-form" onSubmit={submit}>
          <p className="mb-4 text-sm text-navy-600">
            Updating the status for <span className="font-semibold text-navy-900">{editing?.applicant?.name || 'this applicant'}</span>.
            The student is notified automatically.
          </p>
          <Field label="New status" htmlFor="applicationStatus">
            <select
              id="applicationStatus"
              className="input"
              value={form.applicationStatus}
              onChange={(event) => setForm((prev) => ({ ...prev, applicationStatus: event.target.value }))}
            >
              {NEXT_STATUS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Note for the applicant" htmlFor="statusNote" className="mt-4" hint="Optional. Shared with the student.">
            <TextArea
              id="statusNote"
              rows={3}
              value={form.statusNote}
              onChange={(event) => setForm((prev) => ({ ...prev, statusNote: event.target.value }))}
            />
          </Field>
        </form>
      </Modal>
    </div>
  );
}
