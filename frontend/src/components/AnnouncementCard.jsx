import { Link } from 'react-router-dom';
import { Megaphone } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { formatDate, titleCase } from '../utils/format';

const PRIORITY_BAR = {
  low: 'bg-navy-300',
  normal: 'bg-royal-400',
  high: 'bg-amber-500',
  urgent: 'bg-red-500',
};

/** Announcement card. `to` links to the detail page. */
export default function AnnouncementCard({ announcement, to = null, actions = null, showStatus = false }) {
  if (!announcement) return null;
  const { title, body, audience, priority = 'normal', status, publishedAt, createdAt } = announcement;

  const inner = (
    <>
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-600">
          <Megaphone className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-navy-900">{title}</p>
            {priority && priority !== 'normal' ? <StatusBadge status={priority === 'urgent' ? 'rejected' : 'pending'} label={titleCase(priority)} /> : null}
            {showStatus ? <StatusBadge status={status} /> : null}
          </div>
          <p className="mt-1 line-clamp-3 text-sm text-navy-600">{body}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-navy-400">
            <span>{formatDate(publishedAt || createdAt)}</span>
            <span className="rounded-full bg-surface-100 px-2 py-0.5 font-medium text-navy-500">
              Audience: {titleCase(audience)}
            </span>
          </div>
        </div>
      </div>
      {actions ? <div className="mt-4 flex flex-wrap items-center gap-2">{actions}</div> : null}
    </>
  );

  const bar = (
    <span className={`absolute inset-y-0 left-0 w-1.5 rounded-l-2xl ${PRIORITY_BAR[priority] || PRIORITY_BAR.normal}`} aria-hidden="true" />
  );

  if (to) {
    return (
      <Link to={to} className="card relative block overflow-hidden p-5 pl-6 transition hover:shadow-card-hover">
        {bar}
        {inner}
      </Link>
    );
  }

  return (
    <div className="card relative overflow-hidden p-5 pl-6">
      {bar}
      {inner}
    </div>
  );
}
