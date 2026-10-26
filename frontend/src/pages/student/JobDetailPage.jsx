import { useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Briefcase,
  Building2,
  CalendarClock,
  CheckCircle2,
  FileText,
  MapPin,
  Send,
  Upload,
  Users,
} from 'lucide-react';
import { jobApi } from '../../api/endpoints';
import useFetch from '../../hooks/useFetch';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { WORK_MODE_LABELS } from '../../utils/constants';
import { formatDate, formatDateTime, titleCase } from '../../utils/format';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import LoadingState, { Spinner } from '../../components/LoadingState';
import ErrorState from '../../components/ErrorState';

/** Full job advert with the apply flow for students. */
export default function JobDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { profile } = useAuth();
  const fileRef = useRef(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { data: job, loading, error, refetch } = useFetch(() => jobApi.get(id), [id]);
  useDocumentTitle(job?.title || 'Job details');

  if (loading) return <LoadingState label="Loading job..." />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!job) return null;

  const deadlinePassed = job.applicationDeadline ? new Date(job.applicationDeadline) < new Date() : false;
  const canApply = job.approvalStatus === 'approved' && job.jobStatus === 'open' && !deadlinePassed;
  const hasApplied = Boolean(job.myApplication);
  const savedResume = profile?.resume;

  const onSubmit = async (event) => {
    event.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file && !savedResume) {
      toast.error('Please upload a resume (PDF or Word document) before applying.');
      return;
    }

    setSubmitting(true);
    try {
      const form = new FormData();
      if (file) form.append('resume', file);
      if (coverLetter.trim()) form.append('coverLetter', coverLetter.trim());
      await jobApi.apply(id, form);
      toast.success('Application submitted successfully.');
      setCoverLetter('');
      if (fileRef.current) fileRef.current.value = '';
      await refetch();
    } catch (err) {
      toast.error(err.friendlyMessage || 'Unable to submit your application.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <button type="button" className="btn-ghost btn-sm mb-3" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to jobs
      </button>

      <PageHeader
        title={job.title}
        description={job.company}
        icon={Briefcase}
        breadcrumb={[{ label: 'Job board', to: '/student/jobs' }, { label: job.title }]}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="card p-6">
            <div className="flex flex-wrap gap-2">
              {job.workMode ? (
                <span className="rounded-full bg-navy-50 px-3 py-1 text-xs font-medium text-navy-600">
                  {WORK_MODE_LABELS[job.workMode] || titleCase(job.workMode)}
                </span>
              ) : null}
              {job.employmentType ? (
                <span className="rounded-full bg-navy-50 px-3 py-1 text-xs font-medium text-navy-600">
                  {titleCase(job.employmentType)}
                </span>
              ) : null}
              {job.experienceLevel ? (
                <span className="rounded-full bg-navy-50 px-3 py-1 text-xs font-medium text-navy-600">
                  {titleCase(job.experienceLevel)}
                </span>
              ) : null}
            </div>

            <h2 className="mt-5 text-base font-semibold text-navy-900">Job description</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-navy-700">{job.description}</p>

            {job.skillsRequired?.length ? (
              <>
                <h2 className="mt-6 text-base font-semibold text-navy-900">Skills required</h2>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {job.skillsRequired.map((skill) => (
                    <span key={skill} className="rounded-full bg-royal-50 px-2.5 py-1 text-xs font-medium text-royal-700">
                      {skill}
                    </span>
                  ))}
                </div>
              </>
            ) : null}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <dl className="space-y-3 text-sm text-navy-700">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-navy-400" aria-hidden="true" />
                <span>{job.company}</span>
              </div>
              {job.location ? (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-navy-400" aria-hidden="true" />
                  <span>{job.location}</span>
                </div>
              ) : null}
              <div className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-navy-400" aria-hidden="true" />
                <span>
                  {job.applicationDeadline
                    ? deadlinePassed
                      ? `Closed ${formatDate(job.applicationDeadline)}`
                      : `Apply by ${formatDate(job.applicationDeadline)}`
                    : 'No deadline advertised'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-navy-400" aria-hidden="true" />
                <span>{job.openings > 1 ? `${job.openings} openings` : '1 opening'}</span>
              </div>
            </dl>

            <dl className="mt-4 space-y-2 border-t border-navy-50 pt-4 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-navy-400">Salary</dt>
                <dd className="text-right font-medium text-navy-800">
                  {job.salaryMin || job.salaryMax
                    ? `${job.salaryCurrency || 'INR'} ${Number(job.salaryMin || job.salaryMax).toLocaleString()} ${
                        job.salaryMax && job.salaryMin ? `- ${Number(job.salaryMax).toLocaleString()}` : ''
                      }/${job.salaryPeriod || 'year'}`
                    : 'Not disclosed'}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-navy-400">Posted</dt>
                <dd className="text-right font-medium text-navy-800">{formatDate(job.createdAt)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-navy-400">Posted by</dt>
                <dd className="text-right font-medium text-navy-800">{job.postedBy?.name || 'Alumni'}</dd>
              </div>
            </dl>
          </div>

          <div className="card p-6">
            {hasApplied ? (
              <>
                <h2 className="flex items-center gap-2 text-base font-semibold text-navy-900">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" aria-hidden="true" />
                  Application submitted
                </h2>
                <div className="mt-3">
                  <StatusBadge status={job.myApplication.applicationStatus} />
                </div>
                <p className="mt-3 text-sm text-navy-500">Applied on {formatDateTime(job.myApplication.appliedAt)}</p>
                <Link to="/student/applications" className="btn-secondary btn-sm mt-4 w-full">
                  View my applications
                </Link>
              </>
            ) : canApply ? (
              <form onSubmit={onSubmit}>
                <h2 className="text-base font-semibold text-navy-900">Apply for this role</h2>
                <p className="mt-1 text-sm text-navy-500">
                  {savedResume
                    ? 'Your saved resume will be used unless you upload a different one.'
                    : 'Upload a resume to apply.'}
                </p>

                {savedResume ? (
                  <p className="mt-3 flex items-center gap-2 text-sm text-navy-700">
                    <FileText className="h-4 w-4 text-navy-400" aria-hidden="true" />
                    <a href={savedResume} target="_blank" rel="noreferrer" className="link">
                      Current resume
                    </a>
                  </p>
                ) : null}

                <label className="label mt-4" htmlFor="apply-cover-letter">
                  Cover letter
                </label>
                <textarea
                  id="apply-cover-letter"
                  className="input"
                  rows={4}
                  maxLength={4000}
                  placeholder="Optional message to the recruiter"
                  value={coverLetter}
                  onChange={(event) => setCoverLetter(event.target.value)}
                />

                <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" className="hidden" />
                <button type="button" className="btn-secondary btn-sm mt-3 w-full" onClick={() => fileRef.current?.click()}>
                  <Upload className="h-4 w-4" aria-hidden="true" />
                  {savedResume ? 'Upload a different resume' : 'Choose resume file'}
                </button>

                <button type="submit" className="btn-primary mt-4 w-full" disabled={submitting}>
                  {submitting ? <Spinner className="h-4 w-4" /> : <Send className="h-4 w-4" aria-hidden="true" />}
                  {submitting ? 'Submitting...' : 'Submit application'}
                </button>
              </form>
            ) : (
              <>
                <h2 className="text-base font-semibold text-navy-900">Applications closed</h2>
                <p className="mt-2 text-sm text-navy-500">
                  {deadlinePassed
                    ? 'The application deadline for this role has passed.'
                    : 'This role is no longer accepting applications.'}
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
