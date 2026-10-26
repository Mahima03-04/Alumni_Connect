import { Link } from 'react-router-dom';
import { Compass, Home } from 'lucide-react';
import useDocumentTitle from '../../hooks/useDocumentTitle';

/** 404 page. Rendered for any unknown route. */
export default function NotFoundPage() {
  useDocumentTitle('Page not found');
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-navy-50 text-navy-500">
        <Compass className="h-8 w-8" aria-hidden="true" />
      </span>
      <p className="mt-6 text-sm font-bold uppercase tracking-widest text-royal-600">Error 404</p>
      <h1 className="mt-2 text-3xl font-bold text-navy-900">Page not found</h1>
      <p className="mt-3 max-w-md text-sm text-navy-500">
        The page you are looking for may have been moved, renamed or never existed.
      </p>
      <Link to="/" className="btn-primary mt-8">
        <Home className="h-4 w-4" aria-hidden="true" />
        Back to home
      </Link>
    </div>
  );
}
