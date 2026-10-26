import { Link, Outlet } from 'react-router-dom';
import { LogoMark } from '../components/Logo';

/** Centered card layout used by the sign in / register / password flows. */
export default function AuthLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800">
      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-6 flex items-center justify-center gap-2.5">
            <LogoMark className="h-10 w-10" />
            <span className="text-xl font-bold tracking-tight text-white">
              Alumni<span className="text-accent-400">Connect</span>
            </span>
          </Link>
          <div className="rounded-2xl border border-white/10 bg-white p-6 shadow-card-hover sm:p-8">
            <Outlet />
          </div>
          <p className="mt-6 text-center text-xs text-navy-200">
            Connecting Graduates. Empowering Students. Building Futures.
          </p>
        </div>
      </div>
    </div>
  );
}
