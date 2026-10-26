import { useMemo, useState } from 'react';
import { Activity, FileText } from 'lucide-react';
import { adminApi } from '../../api/endpoints';
import useFetch from '../../hooks/useFetch';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { formatDateTime, formatRelativeTime, titleCase } from '../../utils/format';
import PageHeader from '../../components/PageHeader';
import SearchBar from '../../components/SearchBar';
import Pagination from '../../components/Pagination';
import LoadingState from '../../components/LoadingState';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';

const ACTION_STYLES = {
  create: 'bg-emerald-50 text-emerald-600',
  update: 'bg-royal-50 text-royal-600',
  delete: 'bg-red-50 text-red-600',
  approve: 'bg-emerald-50 text-emerald-600',
  reject: 'bg-red-50 text-red-600',
  login: 'bg-navy-100 text-navy-600',
};

/** Audit trail of everything that happens on the platform. */
export default function ActivityPage() {
  useDocumentTitle('Activity log');
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');

  const { data, meta, loading, error, refetch } = useFetch(
    () => adminApi.activity({ page, limit: 20 }),
    [page]
  );

  const entries = data || [];

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return entries;
    return entries.filter((entry) =>
      [entry.description, entry.action, entry.actorName, entry.entity].some((value) =>
        String(value || '').toLowerCase().includes(term)
      )
    );
  }, [entries, q]);

  return (
    <div>
      <PageHeader
        title="Activity log"
        description="A chronological record of actions across the platform."
        icon={FileText}
      />

      <div className="mb-6 max-w-md">
        <SearchBar
          value={q}
          onChange={setQ}
          placeholder="Filter by description, action or actor..."
          label="Filter activity"
        />
      </div>

      {loading ? (
        <LoadingState label="Loading activity..." />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : filtered.length ? (
        <>
          <ol className="space-y-3">
            {filtered.map((entry) => (
              <li key={entry._id} className="card flex items-start gap-3 p-4">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy-50 text-navy-500">
                  <Activity className="h-4 w-4" aria-hidden="true" />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-navy-900">{entry.actorName || 'System'}</p>
                    {entry.actorRole ? (
                      <span className="badge bg-navy-100 text-navy-600">{titleCase(entry.actorRole)}</span>
                    ) : null}
                    {entry.action ? (
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          ACTION_STYLES[entry.action] || 'bg-surface-100 text-navy-500'
                        }`}
                      >
                        {titleCase(entry.action)}
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-1 text-sm text-navy-600">{entry.description}</p>

                  <p className="mt-1 text-xs text-navy-400">
                    <span title={formatDateTime(entry.createdAt)}>{formatRelativeTime(entry.createdAt)}</span>
                    <span className="mx-1.5">&middot;</span>
                    {formatDateTime(entry.createdAt)}
                  </p>
                </div>
              </li>
            ))}
          </ol>
          <Pagination meta={meta} onChange={setPage} className="mt-6" />
        </>
      ) : (
        <EmptyState
          icon={FileText}
          title={q ? 'No matching activity' : 'No activity yet'}
          description={
            q
              ? 'Try a different search term to find the activity you are looking for.'
              : 'Actions performed by users will be logged here.'
          }
        />
      )}
    </div>
  );
}
