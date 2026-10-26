import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Briefcase, Handshake, MapPin, Users } from 'lucide-react';
import { mentorshipApi, profileApi } from '../../api/endpoints';
import useFetch from '../../hooks/useFetch';
import useDebounce from '../../hooks/useDebounce';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { useToast } from '../../hooks/useToast';
import PageHeader from '../../components/PageHeader';
import SearchBar from '../../components/SearchBar';
import FilterSelect from '../../components/FilterSelect';
import Avatar from '../../components/Avatar';
import Modal from '../../components/Modal';
import Pagination from '../../components/Pagination';
import { Field, TextArea, TextInput } from '../../components/FormField';
import { CardSkeletonGrid, Spinner } from '../../components/LoadingState';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';

/** Directory of alumni open to mentoring, with a request modal. */
export default function FindMentorPage() {
  useDocumentTitle('Find a mentor');
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [department, setDepartment] = useState('');
  const [graduationYear, setGraduationYear] = useState('');
  const debouncedQ = useDebounce(q, 350);

  const [requesting, setRequesting] = useState(null);
  const [form, setForm] = useState({ message: '', careerGoal: '', areaOfInterest: '' });
  const [submitting, setSubmitting] = useState(false);

  const metadata = useFetch(() => profileApi.metadata(), []);

  const { data, meta, loading, error, refetch } = useFetch(
    () =>
      mentorshipApi.mentors({
        q: debouncedQ || undefined,
        department: department || undefined,
        graduationYear: graduationYear || undefined,
        page,
        limit: 9,
      }),
    [debouncedQ, department, graduationYear, page]
  );

  // Prefill the request modal when a student arrives from an alumni profile.
  const prefillAlumniId = searchParams.get('alumni');
  useEffect(() => {
    if (prefillAlumniId) setRequesting((current) => current || { userId: prefillAlumniId, name: 'this alumnus' });
  }, [prefillAlumniId]);

  const departmentOptions = (metadata.data?.departments || []).map((value) => ({ value, label: value }));
  const yearOptions = (metadata.data?.graduationYears || []).map((value) => ({ value: String(value), label: String(value) }));

  const openRequest = (mentor) => {
    setRequesting(mentor);
    setSearchParams({ alumni: mentor.userId });
  };

  const closeRequest = () => {
    setRequesting(null);
    setForm({ message: '', careerGoal: '', areaOfInterest: '' });
    setSearchParams({});
  };

  const submitRequest = async (event) => {
    event.preventDefault();
    if (!requesting) return;
    if (form.careerGoal.trim().length < 3) {
      toast.error('Please describe your career goal (at least 3 characters).');
      return;
    }
    if (form.message.trim().length < 10) {
      toast.error('Please write a message of at least 10 characters.');
      return;
    }

    setSubmitting(true);
    try {
      await mentorshipApi.create({
        alumniId: requesting.userId || requesting.id,
        careerGoal: form.careerGoal.trim(),
        message: form.message.trim(),
        areaOfInterest: form.areaOfInterest.trim() || undefined,
      });
      toast.success('Mentorship request sent.');
      closeRequest();
    } catch (err) {
      toast.error(err.friendlyMessage || 'Unable to send the mentorship request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Find a mentor"
        description="Connect with alumni who have volunteered to guide students."
        icon={Handshake}
        actions={
          <Link to="/student/mentorship/requests" className="btn-secondary btn-sm">
            My requests
          </Link>
        }
      />

      <div className="card mb-6 p-4">
        <div className="grid gap-3 md:grid-cols-4">
          <div className="md:col-span-2">
            <SearchBar value={q} onChange={(value) => { setQ(value); setPage(1); }} placeholder="Search by name, company or skill..." />
          </div>
          <FilterSelect
            name="mentor-department"
            label=""
            allLabel="All departments"
            value={department}
            onChange={(value) => { setDepartment(value); setPage(1); }}
            options={departmentOptions}
          />
          <FilterSelect
            name="mentor-year"
            label=""
            allLabel="All graduation years"
            value={graduationYear}
            onChange={(value) => { setGraduationYear(value); setPage(1); }}
            options={yearOptions}
          />
        </div>
      </div>

      {loading ? (
        <CardSkeletonGrid count={6} />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : data?.length ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((mentor) => (
              <div key={mentor.userId} className="card flex h-full flex-col p-5">
                <div className="flex items-start gap-3">
                  <Avatar src={mentor.profilePhoto} name={mentor.name} size="md" />
                  <div className="min-w-0 flex-1">
                    <Link to={`/student/alumni/${mentor.userId}`} className="block truncate font-semibold text-navy-900 hover:underline">
                      {mentor.name}
                    </Link>
                    <p className="truncate text-sm text-navy-500">{mentor.jobTitle || 'Alumnus'}</p>
                  </div>
                </div>

                <dl className="mt-4 flex-1 space-y-2 text-sm text-navy-600">
                  {mentor.currentCompany ? (
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 shrink-0 text-navy-400" aria-hidden="true" />
                      <span className="truncate">{mentor.currentCompany}</span>
                    </div>
                  ) : null}
                  {mentor.location ? (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 shrink-0 text-navy-400" aria-hidden="true" />
                      <span className="truncate">{mentor.location}</span>
                    </div>
                  ) : null}
                </dl>

                {mentor.mentorshipAreas?.length ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {mentor.mentorshipAreas.slice(0, 3).map((area) => (
                      <span key={area} className="rounded-full bg-accent-50 px-2.5 py-1 text-xs font-medium text-accent-700">
                        {area}
                      </span>
                    ))}
                  </div>
                ) : null}

                <button type="button" className="btn-primary btn-sm mt-4 w-full" onClick={() => openRequest(mentor)}>
                  <Handshake className="h-4 w-4" aria-hidden="true" />
                  Request mentorship
                </button>
              </div>
            ))}
          </div>
          <Pagination meta={meta} onChange={setPage} className="mt-6" />
        </>
      ) : (
        <EmptyState
          icon={Users}
          title="No mentors found"
          description="Try adjusting your search or clearing the filters."
        />
      )}

      <Modal open={Boolean(requesting)} onClose={closeRequest} title="Request mentorship">
        <p className="text-sm text-navy-500">
          Send a short note to <span className="font-semibold text-navy-800">{requesting?.name}</span> explaining what you
          need help with.
        </p>
        <form className="mt-4 space-y-4" onSubmit={submitRequest}>
          <Field label="Career goal" htmlFor="careerGoal" required hint="What do you want to achieve?">
            <TextInput
              id="careerGoal"
              placeholder="e.g. Become a backend engineer"
              value={form.careerGoal}
              onChange={(event) => setForm((current) => ({ ...current, careerGoal: event.target.value }))}
            />
          </Field>
          <Field label="Area of interest" htmlFor="areaOfInterest">
            <TextInput
              id="areaOfInterest"
              placeholder="e.g. System design"
              value={form.areaOfInterest}
              onChange={(event) => setForm((current) => ({ ...current, areaOfInterest: event.target.value }))}
            />
          </Field>
          <Field label="Message" htmlFor="mentorMessage" required>
            <TextArea
              id="mentorMessage"
              rows={5}
              placeholder="Introduce yourself and explain how the mentor can help."
              value={form.message}
              onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
            />
          </Field>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={closeRequest} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? <Spinner className="h-4 w-4" /> : null}
              {submitting ? 'Sending...' : 'Send request'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
