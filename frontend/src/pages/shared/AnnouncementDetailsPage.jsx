import { useParams } from 'react-router-dom';
import { ArrowLeft, Megaphone } from 'lucide-react';
import { announcementApi } from '../../api/endpoints';
import useFetch from '../../hooks/useFetch';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { formatDate, titleCase } from '../../utils/format';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import LoadingState from '../../components/LoadingState';
import ErrorState from '../../components/ErrorState';

/** Read-only view of a single announcement. */
export default function AnnouncementDetailsPage() {
  const { id } = useParams();
  const { data: announcement, loading, error, refetch } = useFetch(() => announcementApi.get(id), [id]);
  useDocumentTitle(announcement?.title || 'Announcement');

  if (loading) return <LoadingState label="Loading announcement..." />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!announcement) return null;

  return (
    <div>
      <button type="button" className="btn-ghost btn-sm mb-3" onClick={() => window.history.back()}>
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back
      </button>

      <PageHeader
        title={announcement.title}
        icon={Megaphone}
        description={`Published ${formatDate(announcement.publishedAt || announcement.createdAt)}`}
      />

      <div className="card max-w-3xl p-6">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={announcement.status} />
          <span className="badge bg-navy-100 text-navy-600">Audience: {titleCase(announcement.audience)}</span>
          {announcement.priority && announcement.priority !== 'normal' ? (
            <StatusBadge status={announcement.priority === 'urgent' ? 'rejected' : 'pending'} label={titleCase(announcement.priority)} />
          ) : null}
        </div>
        <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-navy-700">{announcement.body}</p>
        {announcement.expiresAt ? (
          <p className="mt-6 text-xs text-navy-400">Expires {formatDate(announcement.expiresAt)}</p>
        ) : null}
      </div>
    </div>
  );
}
