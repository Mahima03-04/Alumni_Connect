import { AlertTriangle, RefreshCw } from 'lucide-react';

/** Shown when a request fails. Offers a retry when a handler is supplied. */
export default function ErrorState({
  title = 'Something went wrong',
  message = 'We could not load this content. Please try again.',
  onRetry = null,
  className = '',
}) {
  return (
    <div
      role="alert"
      className={`flex flex-col items-center justify-center gap-3 rounded-2xl border border-red-100 bg-red-50 px-6 py-12 text-center ${className}`}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
        <AlertTriangle className="h-6 w-6" aria-hidden="true" />
      </span>
      <div>
        <h3 className="text-base font-semibold text-red-900">{title}</h3>
        <p className="mx-auto mt-1 max-w-md text-sm text-red-700">{message}</p>
      </div>
      {onRetry ? (
        <button type="button" className="btn-secondary btn-sm" onClick={onRetry}>
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          Try again
        </button>
      ) : null}
    </div>
  );
}
