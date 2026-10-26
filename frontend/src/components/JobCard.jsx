import { Link } from 'react-router-dom';
import { Building2, CalendarClock, MapPin } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { formatDate, formatSalary, titleCase } from '../utils/format';
import { WORK_MODE_LABELS } from '../utils/constants';

/** Job summary card used on job boards and dashboards. */
export default function JobCard({ job, to, footer = null, showStatus = false }) {
  if (!job) return null;
  const {
    title,
    company,
    location,
    workMode,
    employmentType,
    experienceLevel,
    salaryMin,
    salaryMax,
    salaryCurrency,
    salaryPeriod,
    skillsRequired = [],
    applicationDeadline,
    approvalStatus,
    jobStatus,
    myApplicationStatus,
  } = job;

  const expiry = applicationDeadline ? formatDate(applicationDeadline) : null;
  const deadlinePassed = applicationDeadline ? new Date(applicationDeadline) < new Date() : false;

  const inner = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold text-navy-900">{title}</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm text-navy-500">
            <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="truncate">{company}</span>
          </p>
        </div>
        {showStatus ? <StatusBadge status={jobStatus} /> : null}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
        {workMode ? (
          <span className="rounded-full bg-navy-50 px-2.5 py-1 font-medium text-navy-600">
            {WORK_MODE_LABELS[workMode] || titleCase(workMode)}
          </span>
        ) : null}
        {employmentType ? (
          <span className="rounded-full bg-navy-50 px-2.5 py-1 font-medium text-navy-600">{titleCase(employmentType)}</span>
        ) : null}
        {experienceLevel ? (
          <span className="rounded-full bg-navy-50 px-2.5 py-1 font-medium text-navy-600">{titleCase(experienceLevel)}</span>
        ) : null}
        {approvalStatus && approvalStatus !== 'approved' ? (
          <StatusBadge status={approvalStatus} label={`Approval: ${titleCase(approvalStatus)}`} />
        ) : null}
      </div>

      <dl className="mt-4 space-y-1.5 text-sm text-navy-600">
        {location ? (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0 text-navy-400" aria-hidden="true" />
            <span className="truncate">{location}</span>
          </div>
        ) : null}
        <div className="flex items-center gap-2">
          <CalendarClock className="h-4 w-4 shrink-0 text-navy-400" aria-hidden="true" />
          <span>
            {expiry ? (deadlinePassed ? `Closed ${expiry}` : `Apply by ${expiry}`) : 'No deadline advertised'}
          </span>
        </div>
        <p className="font-medium text-navy-700">
          {salaryMin || salaryMax
            ? formatSalary(salaryMin, salaryMax, salaryCurrency || 'INR', salaryPeriod || 'year')
            : 'Not disclosed'}
        </p>
      </dl>

      {skillsRequired.length ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {skillsRequired.slice(0, 4).map((skill) => (
            <span key={skill} className="rounded-full bg-accent-50 px-2.5 py-1 text-xs font-medium text-accent-700">
              {skill}
            </span>
          ))}
        </div>
      ) : null}

      {myApplicationStatus ? (
        <p className="mt-3 text-xs font-medium text-navy-500">
          Your application: <StatusBadge status={myApplicationStatus} />
        </p>
      ) : null}

      {footer ? <div className="mt-4 flex flex-wrap items-center gap-2">{footer}</div> : null}
    </>
  );

  if (to) {
    return (
      <Link to={to} className="card block p-5 transition hover:shadow-card-hover">
        {inner}
      </Link>
    );
  }

  return <div className="card p-5">{inner}</div>;
}
