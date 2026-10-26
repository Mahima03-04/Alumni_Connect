import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Handshake, MapPin, User } from 'lucide-react';
import { mentorshipApi } from '../../api/endpoints';
import useFetch from '../../hooks/useFetch';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { useToast } from '../../hooks/useToast';
import { formatDateTime } from '../../utils/format';
import PageHeader from '../../components/PageHeader';
import Avatar from '../../components/Avatar';
import Pagination from '../../components/Pagination';
import StatusBadge from '../../components/StatusBadge';
import ConfirmDialog from '../../components/ConfirmDialog';
import LoadingState from '../../components/LoadingState';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';

const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

/** Student's sent mentorship requests with cancel and delete actions. */
export default function MyMentorshipPage() {
  useDocumentTitle('My mentorship');
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);

  const { data, meta, loading, error, refetch } = useFetch(
    () => mentorshipApi.mine({ page, limit: 10, status: status || undefined }),
    [page, status]
  );

  const runConfirmedAction = async () => {
    if (!confirm) return;
    setBusy(true);
    try {
      if (confirm.action === 'cancel') {
        await mentorshipApi.respond(confirm.id, { status: 'cancelled' });
        toast.warning('Mentorship request cancelled.');
      } else {
        await mentorshipApi.remove(confirm.id);
        toast.success('Mentorship request deleted.');
      }
      setConfirm(null);
      await refetch();
    } catch (err) {
      toast.error(err.friendlyMessage || 'Unable to update the mentorship request.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="My mentorship"
        description="Track the mentorship requests you have sent to alumni."
        icon={Handshake}
        actions={
          <Link to="/student/mentorship" className="btn-secondary btn-sm">
            Find a mentor
          </Link>
        }
      />

      <div className="mb-6 flex flex-wrap gap-1">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value || 'all'}
            type="button"
            onClick={() => {
              setStatus(tab.value);
              setPage(1);
            }}
            className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition ${
              status === tab.value ? 'bg-navy-800 text-white' : 'text-navy-600 hover:bg-navy-50'
            }`}
          >
            {tab.label}
            {tab.value && meta?.statusCounts?.[tab.value] ? (
              <span className="ml-1.5 text-xs opacity-80">{meta.statusCounts[tab.value]}</span>
            ) : null}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingState label="Loading mentorship requests..." />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : data?.length ? (
        <>
          <div className="space-y-3">
            {data.map((request) => {
              const id = request.id || request._id;
              const canCancel = ['pending', 'accepted'].includes(request.status);
              const canDelete = ['cancelled', 'rejected', 'completed'].includes(request.status);
              const meeting = request.meetingDetails || {};

              return (
                <div key={id} className="card p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <Avatar src={request.alumni?.profilePhoto} name={request.alumni?.name} size="md" />
                      <div className="min-w-0">
                        <p className="font-semibold text-navy-900">{request.alumni?.name || 'Alumnus'}</p>
                        <p className="truncate text-sm text-navy-500">{request.alumni?.email}</p>
                      </div>
                    </div>
                    <StatusBadge status={request.status} />
                  </div>

                  <dl className="mt-4 space-y-3 text-sm text-navy-700">
                    <div className="flex items-start gap-2">
                      <User className="mt-0.5 h-4 w-4 shrink-0 text-navy-400" aria-hidden="true" />
                      <div>
                        <dt className="font-medium text-navy-900">Career goal</dt>
                        <dd>{request.careerGoal}</dd>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Handshake className="mt-0.5 h-4 w-4 shrink-0 text-navy-400" aria-hidden="true" />
                      <div>
                        <dt className="font-medium text-navy-900">Your message</dt>
                        <dd>{request.message}</dd>
                      </div>
                    </div>
                  </dl>

                  {request.responseMessage ? (
                    <p className="mt-4 rounded-xl bg-navy-50 p-3 text-sm text-navy-600">
                      <span className="font-semibold text-navy-800">Mentor response: </span>
                      {request.responseMessage}
                    </p>
                  ) : null}

                  {meeting.mode || meeting.scheduledAt || meeting.notes ? (
                    <div className="mt-4 rounded-xl border border-navy-100 p-3 text-sm text-navy-600">
                      <p className="flex items-center gap-2 font-medium text-navy-800">
                        <MapPin className="h-4 w-4 text-navy-400" aria-hidden="true" />
                        {meeting.mode === 'online'
                          ? `Online${meeting.link ? `: ${meeting.link}` : ''}`
                          : meeting.location || 'In person'}
                      </p>
                      {meeting.scheduledAt ? <p className="mt-1">Scheduled for {formatDateTime(meeting.scheduledAt)}</p> : null}
                      {meeting.notes ? <p className="mt-1 text-navy-500">{meeting.notes}</p> : null}
                    </div>
                  ) : null}

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="text-xs text-navy-400">
                      Requested {formatDateTime(request.requestedAt || request.createdAt)}
                    </span>
                    {canCancel ? (
                      <button
                        type="button"
                        className="btn-ghost btn-sm ml-auto text-amber-700 hover:bg-amber-50"
                        onClick={() => setConfirm({ id, action: 'cancel' })}
                      >
                        Cancel request
                      </button>
                    ) : null}
                    {canDelete ? (
                      <button
                        type="button"
                        className="btn-ghost btn-sm ml-auto text-red-600 hover:bg-red-50"
                        onClick={() => setConfirm({ id, action: 'delete' })}
                      >
                        Delete
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
          <Pagination meta={meta} onChange={setPage} className="mt-6" />
        </>
      ) : (
        <EmptyState
          icon={Handshake}
          title="No mentorship requests"
          description="Reach out to an alumnus in the mentor directory to get started."
          action={
            <Link to="/student/mentorship" className="btn-primary btn-sm">
              Find a mentor
            </Link>
          }
        />
      )}

      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm?.action === 'delete' ? 'Delete request?' : 'Cancel mentorship request?'}
        message={
          confirm?.action === 'delete'
            ? 'This request will be permanently removed from your history.'
            : 'The alumnus will be notified that you cancelled this request.'
        }
        confirmLabel={confirm?.action === 'delete' ? 'Delete' : 'Cancel request'}
        tone={confirm?.action === 'delete' ? 'danger' : 'primary'}
        loading={busy}
        onConfirm={runConfirmedAction}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}
