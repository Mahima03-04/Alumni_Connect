import { Link } from 'react-router-dom';
import { Briefcase, Building2, MapPin, GraduationCap } from 'lucide-react';
import Avatar from './Avatar';

/**
 * Compact alumni card used across directories and the landing page.
 * `to` controls the profile link target (role aware).
 */
export default function ProfileCard({ profile, to = null, actions = null }) {
  if (!profile) return null;
  const {
    userId,
    id,
    name = 'Alumni',
    profilePhoto,
    jobTitle,
    currentCompany,
    department,
    graduationYear,
    location,
    skills = [],
    profileCompletion,
  } = profile;

  const href = to || (userId ? `/directory/${userId}` : null);
  const headline = jobTitle || 'Alumnus';

  const body = (
    <>
      <div className="flex items-start gap-3">
        <Avatar src={profilePhoto} name={name} size="md" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-navy-900">{name}</p>
          <p className="truncate text-sm text-navy-500">{headline}</p>
        </div>
        <span className="rounded-lg bg-navy-50 p-2 text-navy-500">
          <GraduationCap className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>

      <dl className="mt-4 space-y-2 text-sm text-navy-600">
        {currentCompany ? (
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 shrink-0 text-navy-400" aria-hidden="true" />
            <span className="truncate">{currentCompany}</span>
          </div>
        ) : null}
        {department ? (
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 shrink-0 text-navy-400" aria-hidden="true" />
            <span className="truncate">
              {department}
              {graduationYear ? ` · Class of ${graduationYear}` : ''}
            </span>
          </div>
        ) : null}
        {location ? (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0 text-navy-400" aria-hidden="true" />
            <span className="truncate">{location}</span>
          </div>
        ) : null}
      </dl>

      {skills.length ? (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {skills.slice(0, 4).map((skill) => (
            <span key={skill} className="rounded-full bg-royal-50 px-2.5 py-1 text-xs font-medium text-royal-700">
              {skill}
            </span>
          ))}
        </div>
      ) : null}

      {typeof profileCompletion === 'number' ? (
        <div className="mt-4">
          <div className="mb-1 flex items-center justify-between text-xs text-navy-400">
            <span>Profile completion</span>
            <span className="font-semibold text-navy-600">{profileCompletion}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-navy-100">
            <div className="h-full rounded-full bg-accent-500" style={{ width: `${profileCompletion}%` }} />
          </div>
        </div>
      ) : null}

      {actions ? <div className="mt-4 flex items-center gap-2">{actions}</div> : null}
    </>
  );

  if (href) {
    return (
      <Link to={href} className="card block p-5 transition hover:shadow-card-hover">
        {body}
      </Link>
    );
  }

  return <div className="card p-5">{body}</div>;
}
