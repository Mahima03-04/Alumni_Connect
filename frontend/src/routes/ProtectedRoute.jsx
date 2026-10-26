import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LoadingState from '../components/LoadingState';

/**
 * Blocks anonymous visitors and redirects them to the sign in page, remembering
 * where they were headed. Authorisation is always re-checked by the API, this
 * route guard only improves the user experience.
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingState label="Checking your session..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
