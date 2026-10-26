import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

/**
 * Consistent page heading with an optional breadcrumb, description and
 * right-aligned action buttons.
 */
export default function PageHeader({ title, description = '', breadcrumb = [], actions = null, icon: Icon = null }) {
  return (
    <div className="mb-6">
      {breadcrumb.length ? (
        <nav className="mb-2 flex flex-wrap items-center gap-1 text-xs font-medium text-navy-400" aria-label="Breadcrumb">
          {breadcrumb.map((crumb, index) => {
            const isLast = index === breadcrumb.length - 1;
            return (
              <span key={`${crumb.label}-${index}`} className="flex items-center gap-1">
                {crumb.to && !isLast ? (
                  <Link to={crumb.to} className="hover:text-navy-700">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className={isLast ? 'text-navy-600' : ''}>{crumb.label}</span>
                )}
                {!isLast ? <ChevronRight className="h-3 w-3" aria-hidden="true" /> : null}
              </span>
            );
          })}
        </nav>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          {Icon ? (
            <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-700">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
          ) : null}
          <div>
            <h1 className="text-xl font-bold tracking-tight text-navy-900 sm:text-2xl">{title}</h1>
            {description ? <p className="mt-1 max-w-3xl text-sm text-navy-500">{description}</p> : null}
          </div>
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}
