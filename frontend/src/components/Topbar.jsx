import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, ChevronDown, LogOut, Menu, Settings, UserSquare2 } from 'lucide-react';
import Avatar from './Avatar';
import { LogoMark } from './Logo';
import { useAuth } from '../hooks/useAuth';
import useUnreadNotifications from '../hooks/useUnreadNotifications';
import { ROLE_HOME, ROLE_LABELS } from '../utils/constants';

/** Sticky application header shown above every authenticated page. */
export default function Topbar({ onMenuClick }) {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const { count } = useUnreadNotifications();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [menuOpen]);

  const home = ROLE_HOME[role] || '/';

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-navy-100 bg-white/90 px-4 backdrop-blur lg:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-lg p-2 text-navy-600 hover:bg-navy-50 lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>
        <Link to={home} className="flex items-center gap-2 lg:hidden">
          <LogoMark className="h-7 w-7" />
          <span className="font-bold tracking-tight text-navy-900">
            Alumni<span className="text-accent-600">Connect</span>
          </span>
        </Link>
        <p className="hidden text-sm font-medium text-navy-500 lg:block">
          {ROLE_LABELS[role] || 'Member'} workspace
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Link
          to="/notifications"
          className="relative rounded-lg p-2 text-navy-600 hover:bg-navy-50"
          aria-label={count ? `${count} unread notifications` : 'Notifications'}
        >
          <Bell className="h-5 w-5" aria-hidden="true" />
          {count > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {count > 99 ? '99+' : count}
            </span>
          ) : null}
        </Link>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="flex items-center gap-2 rounded-xl border border-navy-100 bg-white px-2 py-1.5 text-sm hover:bg-navy-50"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <Avatar src={user?.profilePhoto} name={user?.name} size="sm" />
            <span className="hidden max-w-[10rem] truncate font-medium text-navy-800 sm:block">{user?.name}</span>
            <ChevronDown className="h-4 w-4 text-navy-400" aria-hidden="true" />
          </button>

          {menuOpen ? (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-navy-100 bg-white py-1 shadow-card-hover"
            >
              <div className="border-b border-navy-100 px-4 py-2.5">
                <p className="truncate text-sm font-semibold text-navy-900">{user?.name}</p>
                <p className="truncate text-xs text-navy-400">{user?.email}</p>
              </div>
              {role === 'student' || role === 'alumni' ? (
                <Link
                  to={role === 'student' ? '/student/profile' : '/alumni/profile'}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-navy-700 hover:bg-navy-50"
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                >
                  <UserSquare2 className="h-4 w-4" aria-hidden="true" /> My profile
                </Link>
              ) : null}
              <Link
                to="/settings"
                className="flex items-center gap-2 px-4 py-2 text-sm text-navy-700 hover:bg-navy-50"
                role="menuitem"
                onClick={() => setMenuOpen(false)}
              >
                <Settings className="h-4 w-4" aria-hidden="true" /> Settings
              </Link>
              <button
                type="button"
                role="menuitem"
                onClick={async () => {
                  setMenuOpen(false);
                  await logout();
                  navigate('/login');
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" /> Sign out
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
