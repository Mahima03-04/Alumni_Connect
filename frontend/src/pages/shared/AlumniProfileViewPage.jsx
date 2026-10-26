import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Briefcase, Building2, GraduationCap, Handshake, Linkedin, Mail, MapPin } from 'lucide-react';
import { profileApi } from '../../api/endpoints';
import useFetch from '../../hooks/useFetch';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { useAuth } from '../../hooks/useAuth';
import { formatDate } from '../../utils/format';
import Avatar from '../../components/Avatar';
import StatusBadge from '../../components/StatusBadge';
import LoadingState from '../../components/LoadingState';
import ErrorState from '../../components/ErrorState';

/** Full read-only alumni profile used by the student and alumni directories. */
export default function AlumniProfileViewPage() {
  const { id } = useParams();
  const { role } = useAuth();
  const { data: profile, loading, error, refetch } = useFetch(() => profileApi.get(id), [id]);
  useDocumentTitle(profile?.name || 'Alumni profile');

  if (loading) return <LoadingState label="Loading profile..." />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!profile) return null;

  const {
    userId,
    name,
    email,
    profilePhoto,
    jobTitle,
    currentCompany,
    department,
    degree,
    course,
    graduationYear,
    batch,
    location,
    biography,
    linkedinUrl,
    skills = [],
    mentorshipAreas = [],
    openToMentorship,
    workExperience = [],
    recentJobs = [],
  } = profile;

  return (
    <div>
      <button type="button" className="btn-ghost btn-sm mb-3" onClick={() => window.history.back()}>
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back
      </button>

      <div className="card overflow-hidden">
        <div className="h-28 bg-gradient-to-br from-navy-800 via-navy-700 to-royal-700" />
        <div className="px-6 pb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <div className="-mt-10">
                <Avatar src={profilePhoto} name={name} size="lg" />
              </div>
              <div className="pb-1">
                <h1 className="text-xl font-bold text-navy-900">{name}</h1>
                <p className="text-sm text-navy-500">{jobTitle || 'Alumnus'}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {openToMentorship ? <StatusBadge status="approved" label="Open to mentorship" /> : null}
              {role === 'student' && openToMentorship ? (
                <Link to={`/student/mentorship?alumni=${userId || id}`} className="btn-primary btn-sm">
                  <Handshake className="h-4 w-4" aria-hidden="true" />
                  Request mentorship
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {biography ? (
            <div className="card p-6">
              <h2 className="text-base font-semibold text-navy-900">About</h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-navy-700">{biography}</p>
            </div>
          ) : null}

          {workExperience.length ? (
            <div className="card p-6">
              <h2 className="flex items-center gap-2 text-base font-semibold text-navy-900">
                <Briefcase className="h-4 w-4 text-navy-400" aria-hidden="true" />
                Experience
              </h2>
              <ol className="mt-4 space-y-5">
                {workExperience.map((role_, index) => (
                  <li key={role_._id || `${role_.company}-${index}`} className="relative border-l border-navy-100 pl-5">
                    <span className="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full border-2 border-white bg-accent-500" aria-hidden="true" />
                    <p className="font-semibold text-navy-900">{role_.title}</p>
                    <p className="text-sm text-navy-600">{role_.company}</p>
                    <p className="mt-0.5 text-xs text-navy-400">
                      {formatDate(role_.from)} — {role_.current ? 'Present' : formatDate(role_.to)}
                    </p>
                    {role_.description ? <p className="mt-2 text-sm text-navy-600">{role_.description}</p> : null}
                  </li>
                ))}
              </ol>
            </div>
          ) : null}

          {recentJobs.length ? (
            <div className="card p-6">
              <h2 className="text-base font-semibold text-navy-900">Open roles from {name.split(' ')[0]}</h2>
              <ul className="mt-4 divide-y divide-navy-50">
                {recentJobs.map((job) => (
                  <li key={job._id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-navy-900">{job.title}</p>
                      <p className="truncate text-xs text-navy-500">
                        {job.company} · {job.location || 'Location flexible'}
                      </p>
                    </div>
                    <span className="text-xs text-navy-400">{formatDate(job.createdAt)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="text-base font-semibold text-navy-900">Details</h2>
            <dl className="mt-4 space-y-3 text-sm text-navy-700">
              {email ? (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 shrink-0 text-navy-400" aria-hidden="true" />
                  <a href={`mailto:${email}`} className="truncate hover:text-navy-900">
                    {email}
                  </a>
                </div>
              ) : null}
              {currentCompany ? (
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-navy-400" aria-hidden="true" />
                  <span>{currentCompany}</span>
                </div>
              ) : null}
              {department ? (
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-navy-400" aria-hidden="true" />
                  <span>
                    {department}
                    {degree ? ` · ${degree}` : ''}
                  </span>
                </div>
              ) : null}
              {location ? (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-navy-400" aria-hidden="true" />
                  <span>{location}</span>
                </div>
              ) : null}
            </dl>

            <dl className="mt-4 space-y-2 border-t border-navy-50 pt-4 text-sm text-navy-600">
              {course ? (
                <div className="flex justify-between gap-3">
                  <dt className="text-navy-400">Course</dt>
                  <dd className="text-right">{course}</dd>
                </div>
              ) : null}
              {degree ? (
                <div className="flex justify-between gap-3">
                  <dt className="text-navy-400">Degree</dt>
                  <dd className="text-right">{degree}</dd>
                </div>
              ) : null}
              {graduationYear ? (
                <div className="flex justify-between gap-3">
                  <dt className="text-navy-400">Graduated</dt>
                  <dd className="text-right">{graduationYear}</dd>
                </div>
              ) : null}
              {batch ? (
                <div className="flex justify-between gap-3">
                  <dt className="text-navy-400">Batch</dt>
                  <dd className="text-right">{batch}</dd>
                </div>
              ) : null}
            </dl>

            {email || linkedinUrl ? (
              <div className="mt-4 space-y-2 border-t border-navy-50 pt-4">
                {email ? (
                  <a href={`mailto:${email}`} className="btn-secondary btn-sm w-full">
                    <Mail className="h-4 w-4" aria-hidden="true" />
                    Email
                  </a>
                ) : null}
                {linkedinUrl ? (
                  <a href={linkedinUrl} target="_blank" rel="noreferrer" className="btn-secondary btn-sm w-full">
                    <Linkedin className="h-4 w-4" aria-hidden="true" />
                    LinkedIn
                  </a>
                ) : null}
              </div>
            ) : null}
          </div>

          {skills.length ? (
            <div className="card p-6">
              <h2 className="text-base font-semibold text-navy-900">Skills</h2>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {skills.map((skill) => (
                  <span key={skill} className="rounded-full bg-royal-50 px-2.5 py-1 text-xs font-medium text-royal-700">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {mentorshipAreas.length ? (
            <div className="card p-6">
              <h2 className="text-base font-semibold text-navy-900">Mentorship areas</h2>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {mentorshipAreas.map((area) => (
                  <span key={area} className="rounded-full bg-accent-50 px-2.5 py-1 text-xs font-medium text-accent-700">
                    {area}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
