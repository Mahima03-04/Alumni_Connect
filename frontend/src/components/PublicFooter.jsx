import { Link } from 'react-router-dom';
import { Mail, MapPin } from 'lucide-react';
import { LogoMark } from './Logo';

/** Marketing site footer. */
export default function PublicFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-navy-100 bg-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2.5">
            <LogoMark className="h-9 w-9" />
            <span className="font-bold tracking-tight text-navy-900">
              Alumni<span className="text-accent-600">Connect</span>
            </span>
          </div>
          <p className="mt-3 max-w-xs text-sm text-navy-500">
            Connecting graduates, empowering students and building futures together.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-navy-900">Explore</h3>
          <ul className="mt-3 space-y-2 text-sm text-navy-500">
            <li>
              <Link to="/" className="hover:text-navy-800">
                Home
              </Link>
            </li>
            <li>
              <Link to="/about" className="hover:text-navy-800">
                About
              </Link>
            </li>
            <li>
              <Link to="/events" className="hover:text-navy-800">
                Events
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-navy-900">Account</h3>
          <ul className="mt-3 space-y-2 text-sm text-navy-500">
            <li>
              <Link to="/login" className="hover:text-navy-800">
                Sign in
              </Link>
            </li>
            <li>
              <Link to="/register" className="hover:text-navy-800">
                Create an account
              </Link>
            </li>
            <li>
              <Link to="/forgot-password" className="hover:text-navy-800">
                Reset password
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-navy-900">Contact</h3>
          <ul className="mt-3 space-y-2 text-sm text-navy-500">
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-navy-400" aria-hidden="true" />
              alumni@alumniconnect.example.com
            </li>
            <li className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-navy-400" aria-hidden="true" />
              Sunrise Institute of Technology
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-navy-100 px-4 py-4">
        <p className="mx-auto max-w-6xl text-center text-xs text-navy-400">
          &copy; {year} AlumniConnect. Academic demonstration project. Demo data is fictional.
        </p>
      </div>
    </footer>
  );
}
