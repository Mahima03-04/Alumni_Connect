import { Link } from 'react-router-dom';
import { CalendarDays, MapPin, TicketCheck, Users } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { formatDateTime, titleCase } from '../utils/format';

const BANNER_STYLES = {
  navy: 'from-navy-700 to-navy-900',
  royal: 'from-royal-600 to-royal-800',
  accent: 'from-accent-500 to-accent-700',
  amber: 'from-amber-500 to-amber-700',
};

/** Event summary card used on public and dashboard event lists. */
export default function EventCard({ event, to, footer = null, showStatus = false }) {
  if (!event) return null;
  const {
    title,
    description,
    eventType,
    mode,
    venue,
    startDate,
    registeredCount,
    seatsLeft,
    capacity,
    isRegistered,
    status,
    bannerColor = 'navy',
  } = event;

  const banner = BANNER_STYLES[bannerColor] || BANNER_STYLES.navy;

  const inner = (
    <>
      <div className={`-mx-5 -mt-5 mb-4 h-24 rounded-t-2xl bg-gradient-to-br ${banner} p-5`}>
        <div className="flex items-start justify-between gap-2">
          <span className="rounded-full bg-white/20 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">
            {titleCase(eventType)}
          </span>
          <div className="flex items-center gap-1.5">
            {showStatus ? <StatusBadge status={status} /> : null}
            {isRegistered ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-xs font-semibold text-white">
                <TicketCheck className="h-3 w-3" aria-hidden="true" /> Registered
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <p className="line-clamp-2 font-semibold text-navy-900">{title}</p>
      <p className="mt-1 line-clamp-2 text-sm text-navy-500">{description}</p>

      <dl className="mt-4 space-y-1.5 text-sm text-navy-600">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 shrink-0 text-navy-400" aria-hidden="true" />
          <span>{formatDateTime(startDate)}</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 shrink-0 text-navy-400" aria-hidden="true" />
          <span className="truncate">{venue || titleCase(mode)}</span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 shrink-0 text-navy-400" aria-hidden="true" />
          <span>
            {typeof registeredCount === 'number' ? `${registeredCount} registered` : 'Open to register'}
            {typeof capacity === 'number' ? ` · ${seatsLeft} of ${capacity} seats left` : ''}
          </span>
        </div>
      </dl>

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
