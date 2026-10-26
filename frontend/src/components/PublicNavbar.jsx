import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { LayoutDashboard, Menu, X } from 'lucide-react';
import Logo from './Logo';
import { useAuth } from '../hooks/useAuth';
import { ROLE_HOME } from '../utils/constants';

const LINKS = [
  { label: 'Home', to: '/' },
  { label: 'About', to: '/about' },
  { label: 'Events', to: '/events' },
];

function navClasses({ isActive }) {
  return `rounded-lg px-3 py-2 text-sm font-medium transition ${
    isActive ? 'bg-navy-50 text-navy-900' : 'text-navy-600 hover:bg-navy-50 hover:text-navy-900'
  }`;
}

/** Marketing site header shown to visitors and signed-in users. */
export default function PublicNavbar() {
  const { isAuthenticated, role } = useAuth();
  const [open, setOpen] = useState(false);

  const dashboard = ROLE_HOME[role] || '/';

  return (
    <header className="sticky top-0 z-30 border-b border-navy-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Logo showTagline />

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
          {LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} className={navClasses} end={link.to === '/'}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {isAuthenticated ? (
            <Link to={dashboard} className="btn-primary btn-sm">
              <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
              Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn-secondary btn-sm">
                Sign in
              </Link>
              <Link to="/register" className="btn-primary btn-sm">
                Get started
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="rounded-lg p-2 text-navy-600 hover:bg-navy-50 md:hidden"
          onClick={() => setOpen((value) => !value)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
        </button>
      </div>

      {open ? (
        <nav className="border-t border-navy-100 bg-white px-4 py-3 md:hidden" aria-label="Mobile navigation">
          <div className="flex flex-col gap-1">
            {LINKS.map((link) => (
              <NavLink key={link.to} to={link.to} className={navClasses} end={link.to === '/'} onClick={() => setOpen(false)}>
                {link.label}
              </NavLink>
            ))}
          </div>
          <div className="mt-3 flex flex-col gap-2 border-t border-navy-100 pt-3">
            {isAuthenticated ? (
              <Link to={dashboard} className="btn-primary" onClick={() => setOpen(false)}>
                Go to dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn-secondary" onClick={() => setOpen(false)}>
                  Sign in
                </Link>
                <Link to="/register" className="btn-primary" onClick={() => setOpen(false)}>
                  Create an account
                </Link>
              </>
            )}
          </div>
        </nav>
      ) : null}
    </header>
  );
}
