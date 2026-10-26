import { Inbox } from 'lucide-react';

/** Friendly empty state with an optional action. */
export default function EmptyState({
  icon: Icon = Inbox,
  title = 'Nothing here yet',
  description = '',
  action = null,
  className = '',
}) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-navy-200 bg-white px-6 py-14 text-center ${className}`}>
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-navy-50 text-navy-400">
        <Icon className="h-7 w-7" aria-hidden="true" />
      </span>
      <div>
        <h3 className="text-base font-semibold text-navy-900">{title}</h3>
        {description ? <p className="mx-auto mt-1 max-w-md text-sm text-navy-500">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
