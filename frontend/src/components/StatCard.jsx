import { ArrowDown, ArrowUp } from 'lucide-react';

/** Statistic card used on every dashboard. */
export default function StatCard({
  icon: Icon,
  label,
  value,
  hint = '',
  trend = null,
  accent = 'navy',
  to = null,
}) {
  const accents = {
    navy: 'bg-navy-50 text-navy-700',
    royal: 'bg-royal-50 text-royal-700',
    accent: 'bg-accent-50 text-accent-700',
    amber: 'bg-amber-50 text-amber-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    red: 'bg-red-50 text-red-700',
  };

  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-navy-500">{label}</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-navy-900">{value}</p>
        </div>
        {Icon ? (
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${accents[accent] || accents.navy}`}>
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
        ) : null}
      </div>
      {(hint || trend) && (
        <div className="mt-3 flex items-center gap-2 text-xs">
          {trend ? (
            <span
              className={`inline-flex items-center gap-1 font-semibold ${
                trend.direction === 'down' ? 'text-red-600' : 'text-emerald-600'
              }`}
            >
              {trend.direction === 'down' ? (
                <ArrowDown className="h-3 w-3" aria-hidden="true" />
              ) : (
                <ArrowUp className="h-3 w-3" aria-hidden="true" />
              )}
              {trend.value}
            </span>
          ) : null}
          {hint ? <span className="text-navy-400">{hint}</span> : null}
        </div>
      )}
    </>
  );

  if (to) {
    return (
      <a href={to} className="card block p-5 transition hover:shadow-card-hover focus-visible:ring-2">
        {content}
      </a>
    );
  }

  return <div className="card p-5">{content}</div>;
}
