import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import AppRoutes from './routes/AppRoutes';

/**
 * Top level application shell. The router itself lives in `main.jsx` so that
 * tests can mount <App /> inside a MemoryRouter of their choosing.
 */
export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ToastProvider>
  );
}
