import { ChevronLeft, ChevronRight } from 'lucide-react';

/** Accessible pagination control driven by the API pagination meta. */
export default function Pagination({ meta, onChange, className = '' }) {
  if (!meta || !meta.pages || meta.pages <= 1) return null;
  const { page, pages, total } = meta;

  const go = (next) => {
    if (next < 1 || next > pages || next === page) return;
    onChange(next);
  };

  // Show a compact window of page numbers around the current page.
  const windowSize = 5;
  let start = Math.max(1, page - Math.floor(windowSize / 2));
  const end = Math.min(pages, start + windowSize - 1);
  start = Math.max(1, end - windowSize + 1);
  const numbers = [];
  for (let i = start; i <= end; i += 1) numbers.push(i);

  return (
    <nav className={`flex flex-wrap items-center justify-between gap-3 ${className}`} aria-label="Pagination">
      <p className="text-sm text-navy-500">
        Page <span className="font-semibold text-navy-800">{page}</span> of{' '}
        <span className="font-semibold text-navy-800">{pages}</span>
        {typeof total === 'number' ? <span className="hidden sm:inline"> &middot; {total} results</span> : null}
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          className="btn-secondary btn-sm"
          onClick={() => go(page - 1)}
          disabled={!meta.hasPrev}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Previous</span>
        </button>
        {numbers.map((number) => (
          <button
            key={number}
            type="button"
            onClick={() => go(number)}
            aria-current={number === page ? 'page' : undefined}
            className={`h-8 w-8 rounded-lg text-sm font-semibold transition ${
              number === page ? 'bg-navy-800 text-white' : 'text-navy-600 hover:bg-navy-50'
            }`}
          >
            {number}
          </button>
        ))}
        <button
          type="button"
          className="btn-secondary btn-sm"
          onClick={() => go(page + 1)}
          disabled={!meta.hasNext}
          aria-label="Next page"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}
