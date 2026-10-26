import { Link } from 'react-router-dom';

/**
 * AlumniConnect logo: a graduation cap combined with connected network nodes.
 * Drawn inline as SVG so the app never depends on an external image service.
 */
export function LogoMark({ className = 'h-9 w-9' }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="AlumniConnect logo">
      <defs>
        <linearGradient id="acLogoGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2b4b86" />
          <stop offset="100%" stopColor="#16a394" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="60" height="60" rx="14" fill="url(#acLogoGrad)" />
      <path d="M32 14 L52 23 L32 32 L12 23 Z" fill="#ffffff" />
      <path d="M20 27 L20 38 C20 41 25 44 32 44 C39 44 44 41 44 38 L44 27 L32 33 Z" fill="#dbe6ff" />
      <path d="M50 24 L50 36" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
      <circle cx="50" cy="38" r="3.2" fill="#5cd8c8" />
      <circle cx="22" cy="50" r="3" fill="#ffffff" />
      <circle cx="32" cy="52" r="3" fill="#ffffff" />
      <circle cx="42" cy="50" r="3" fill="#ffffff" />
      <path d="M22 50 L32 52 L42 50 M32 52 L32 45" stroke="#5cd8c8" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export default function Logo({ to = '/', showTagline = false, markClassName = 'h-9 w-9', textClassName = 'text-lg' }) {
  return (
    <Link to={to} className="flex items-center gap-2.5 rounded-lg focus-visible:ring-2" aria-label="AlumniConnect home">
      <LogoMark className={markClassName} />
      <span className="leading-tight">
        <span className={`block font-bold tracking-tight text-navy-900 ${textClassName}`}>
          Alumni<span className="text-accent-600">Connect</span>
        </span>
        {showTagline ? (
          <span className="block text-[11px] font-medium text-navy-500">
            Connecting Graduates. Empowering Students.
          </span>
        ) : null}
      </span>
    </Link>
  );
}
