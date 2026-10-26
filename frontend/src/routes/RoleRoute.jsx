import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LoadingState from '../components/LoadingState';

/**
 * Restricts a subtree to one or more roles. This is a convenience guard; the
 * backend independently enforces role and ownership rules on every request.
 */
export default function RoleRoute({ roles = [], children }) {
  const { isAuthenticated, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingState label="Checking your permissions..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!roles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
