import { NavLink } from 'react-router-dom';
import { LogOut, X } from 'lucide-react';
import { LogoMark } from './Logo';
import { NAV_BY_ROLE, ROLE_LABELS } from '../utils/constants';
import { useAuth } from '../hooks/useAuth';

function linkClasses({ isActive }) {
  return [
    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
    isActive ? 'bg-navy-800 text-white shadow-sm' : 'text-navy-600 hover:bg-navy-50 hover:text-navy-900',
  ].join(' ');
}

/** Role aware navigation drawer. Rendered inline on desktop and as a drawer on mobile. */
export default function Sidebar({ open = false, onClose }) {
  const { role, user, logout } = useAuth();
  const items = NAV_BY_ROLE[role] || [];

  const handleLogout = async () => {
    onClose?.();
    await logout();
  };

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-navy-950/50 transition-opacity lg:hidden ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-navy-100 bg-white transition-transform lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Sidebar navigation"
      >
        <div className="flex h-16 items-center justify-between gap-2 border-b border-navy-100 px-4">
          <NavLink to={role ? `/${role}/dashboard` : '/'} className="flex items-center gap-2.5">
            <LogoMark className="h-8 w-8" />
            <span className="font-bold tracking-tight text-navy-900">
              Alumni<span className="text-accent-600">Connect</span>
            </span>
          </NavLink>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-navy-400 hover:bg-navy-50 lg:hidden"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="border-b border-navy-100 px-4 py-3">
          <p className="truncate text-sm font-semibold text-navy-900">{user?.name}</p>
          <p className="text-xs font-medium text-navy-400">{ROLE_LABELS[role] || 'Member'}</p>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink key={item.to} to={item.to} className={linkClasses} onClick={onClose} end>
                <Icon className="h-5 w-5" aria-hidden="true" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t border-navy-100 p-3">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
          >
            <LogOut className="h-5 w-5" aria-hidden="true" />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
