import { useAuthContext } from '../context/AuthContext';

/** Convenience hook that re-exports the auth context. */
export function useAuth() {
  return useAuthContext();
}

export default useAuth;
