import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { useAuth } from '../../hooks/useAuth';
import { ROLE_HOME } from '../../utils/constants';

/** Shown when a signed-in user reaches a page their role cannot access. */
export default function UnauthorizedPage() {
  useDocumentTitle('Access denied');
  const { role, isAuthenticated } = useAuth();
  const home = isAuthenticated ? ROLE_HOME[role] || '/' : '/login';

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600">
        <ShieldAlert className="h-8 w-8" aria-hidden="true" />
      </span>
      <p className="mt-6 text-sm font-bold uppercase tracking-widest text-red-600">Error 403</p>
      <h1 className="mt-2 text-3xl font-bold text-navy-900">Access denied</h1>
      <p className="mt-3 max-w-md text-sm text-navy-500">
        Your account does not have permission to view this page. If you believe this is a mistake, contact an
        administrator.
      </p>
      <Link to={home} className="btn-primary mt-8">
        {isAuthenticated ? 'Back to dashboard' : 'Sign in'}
      </Link>
    </div>
  );
}
