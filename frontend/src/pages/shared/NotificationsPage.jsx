import { useState } from 'react';
import { Bell } from 'lucide-react';
import { notificationApi } from '../../api/endpoints';
import useFetch from '../../hooks/useFetch';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { useToast } from '../../hooks/useToast';
import { formatRelativeTime } from '../../utils/format';
import PageHeader from '../../components/PageHeader';
import Pagination from '../../components/Pagination';
import LoadingState from '../../components/LoadingState';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';

const TYPE_CLASSES = {
  success: 'bg-emerald-50 text-emerald-600',
  warning: 'bg-amber-50 text-amber-600',
  error: 'bg-red-50 text-red-600',
  info: 'bg-royal-50 text-royal-600',
};

/** Notification inbox with read/unread filters and bulk actions. */
export default function NotificationsPage() {
  useDocumentTitle('Notifications');
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('all');
  const [busy, setBusy] = useState(false);

  const { data, meta, loading, error, refetch } = useFetch(
    () => notificationApi.list({ page, limit: 20, read: filter === 'unread' ? 'false' : undefined }),
    [page, filter]
  );

  const markRead = async (id) => {
    try {
      await notificationApi.markRead(id);
      await refetch();
    } catch (err) {
      toast.error(err.friendlyMessage || 'Unable to mark the notification as read.');
    }
  };

  const remove = async (id) => {
    try {
      await notificationApi.remove(id);
      toast.success('Notification removed.');
      await refetch();
    } catch (err) {
      toast.error(err.friendlyMessage || 'Unable to delete the notification.');
    }
  };

  return (
    <div>
      <PageHeader
        title="Notifications"
        description={
          meta?.unreadCount ? `You have ${meta.unreadCount} unread notification${meta.unreadCount === 1 ? '' : 's'}.'` : 'You are all caught up.'
        }
        actions={
          <button
            type="button"
            className="btn-secondary btn-sm"
            disabled={busy || !meta?.unreadCount}
            onClick={async () => {
              setBusy(true);
              try {
                await notificationApi.markAllRead();
                toast.success('All notifications marked as read.');
                await refetch();
              } catch (err) {
                toast.error(err.friendlyMessage || 'Unable to update notifications.');
              } finally {
                setBusy(false);
              }
            }}
          >
            Mark all as read
          </button>
        }
      />

      <div className="mb-4 inline-flex rounded-xl border border-navy-200 bg-white p-1">
        {[
          { value: 'all', label: 'All' },
          { value: 'unread', label: 'Unread' },
        ].map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => {
              setFilter(option.value);
              setPage(1);
            }}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${
              filter === option.value ? 'bg-navy-800 text-white' : 'text-navy-600 hover:bg-navy-50'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingState label="Loading notifications..." />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : data?.length ? (
        <>
          <ul className="space-y-2">
            {data.map((notification) => (
              <li
                key={notification.id || notification._id}
                className={`card flex items-start gap-3 p-4 ${notification.read ? '' : 'border-royal-200 bg-royal-50/40'}`}
              >
                <span
                  className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                    notification.type === 'success'
                      ? 'bg-emerald-50 text-emerald-600'
                      : notification.type === 'warning'
                      ? 'bg-amber-50 text-amber-600'
                      : notification.type === 'error'
                      ? 'bg-red-50 text-red-600'
                      : 'bg-royal-50 text-royal-600'
                  }`}
                >
                  <Bell className="h-4 w-4" aria-hidden="true" />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className={`text-sm ${notification.read ? 'font-medium text-navy-800' : 'font-semibold text-navy-900'}`}>
                      {notification.title}
                    </p>
                    <span className="shrink-0 text-xs text-navy-400">{formatRelativeTime(notification.createdAt)}</span>
                  </div>
                  <p className="mt-0.5 text-sm text-navy-600">{notification.message}</p>

                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
                    {notification.link ? (
                      <a
                        href={notification.link}
                        className="link"
                        onClick={() => notificationApi.markRead(notification.id || notification._id).catch(() => {})}
                      >
                        View
                      </a>
                    ) : null}
                    {!notification.read ? (
                      <button
                        type="button"
                        className="font-medium text-navy-500 hover:text-navy-800"
                        onClick={() => markRead(notification.id || notification._id)}
                      >
                        Mark as read
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="font-medium text-red-500 hover:text-red-700"
                      onClick={() => remove(notification.id || notification._id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <Pagination meta={meta} onChange={setPage} className="mt-6" />
        </>
      ) : (
        <EmptyState
          icon={Bell}
          title={filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
          description="When something happens that concerns you it will appear here."
        />
      )}
    </div>
  );
}
