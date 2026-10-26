import { Loader2 } from 'lucide-react';

export function Spinner({ className = 'h-5 w-5' }) {
  return <Loader2 className={`animate-spin ${className}`} aria-hidden="true" />;
}

/** Full panel loading indicator with an accessible label. */
export default function LoadingState({ label = 'Loading...', className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 py-12 text-navy-500 ${className}`} role="status">
      <Spinner className="h-7 w-7 text-royal-500" />
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}

/** Skeleton grid used while cards load. */
export function CardSkeletonGrid({ count = 6, className = '' }) {
  return (
    <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${className}`} aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="card p-5">
          <div className="flex items-center gap-3">
            <div className="skeleton h-12 w-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-4 w-3/4" />
              <div className="skeleton h-3 w-1/2" />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="skeleton h-3 w-full" />
            <div className="skeleton h-3 w-5/6" />
          </div>
          <div className="mt-4 flex gap-2">
            <div className="skeleton h-6 w-16 rounded-full" />
            <div className="skeleton h-6 w-20 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Skeleton rows used for tables. */
export function TableSkeleton({ rows = 6, cols = 5 }) {
  return (
    <div className="table-wrap p-4" aria-hidden="true">
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="grid gap-3" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
            {Array.from({ length: cols }).map((__, c) => (
              <div key={c} className="skeleton h-4 w-full" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
