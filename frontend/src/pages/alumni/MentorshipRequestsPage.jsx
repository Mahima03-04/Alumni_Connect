import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarClock, CheckCircle2, Handshake, Mail, MapPin, User, XCircle } from 'lucide-react';
import { mentorshipApi } from '../../api/endpoints';
import useFetch from '../../hooks/useFetch';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { useToast } from '../../hooks/useToast';
import { formatDateTime } from '../../utils/format';
import PageHeader from '../../components/PageHeader';
import Avatar from '../../components/Avatar';
import StatusBadge from '../../components/StatusBadge';
import Pagination from '../../components/Pagination';
import Modal from '../../components/Modal';
import LoadingState from '../../components/LoadingState';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import { Field, TextArea } from '../../components/FormField';

/** Mentorship requests an alumnus has received, with accept/decline actions. */
export default function MentorshipRequestsPage() {
  useDocumentTitle('Mentorship requests');
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [action, setAction] = useState(null);
  const [form, setForm] = useState({
    responseMessage: '',
    meetingMode: 'online',
    scheduledAt: '',
    location: '',
    link: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  const { data, meta, loading, error, refetch } = useFetch(
    () => mentorshipApi.mine({ page, limit: 10, status: status || undefined }),
    [page, status]
  );

  const requests = data || [];

  const openAction = (request, type) => {
    setAction({ request, type });
    setForm({
      responseMessage: request.responseMessage || '',
      meetingMode: request.meetingDetails?.mode || 'online',
      scheduledAt: request.meetingDetails?.scheduledAt
        ? new Date(request.meetingDetails.scheduledAt).toISOString().slice(0, 16)
        : '',
      location: request.meetingDetails?.location || '',
      link: request.meetingDetails?.link || '',
      notes: request.meetingDetails?.notes || '',
    });
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!action) return;
    setSaving(true);
    try {
      const id = action.request._id || action.request.id;
      if (action.type === 'complete') {
        await mentorshipApi.respond(id, { status: 'completed' });
        toast.success('Mentorship marked as completed.');
      } else if (action.type === 'decline') {
        await mentorshipApi.respond(id, { status: 'rejected', responseMessage: form.responseMessage });
        toast.warning('Mentorship request declined.');
      } else {
        await mentorshipApi.respond(id, {
          status: 'accepted',
          responseMessage: form.responseMessage,
          meetingDetails: {
            mode: form.meetingMode,
            scheduledAt: form.scheduledAt || null,
            location: form.location,
            link: form.link,
            notes: form.notes,
          },
        });
        toast.success('Mentorship request accepted.');
      }
      setAction(null);
      await refetch();
    } catch (err) {
      toast.error(err.friendlyMessage || 'Unable to update the mentorship request.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Mentorship requests"
        description="Students who would like you to mentor them. Accept to agree a plan and share meeting details."
        icon={Handshake}
      />

      <div className="mb-6 flex flex-wrap gap-1">
        {[
          { value: '', label: 'All' },
          { value: 'pending', label: 'Pending' },
          { value: 'accepted', label: 'Accepted' },
          { value: 'rejected', label: 'Declined' },
          { value: 'completed', label: 'Completed' },
          { value: 'cancelled', label: 'Cancelled' },
        ].map((tab) => (
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
      ) : requests.length ? (
        <>
          <div className="space-y-3">
            {requests.map((request) => {
              const id = request._id || request.id;
              const student = request.student;
              return (
                <div key={id} className="card p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3">
                      <Avatar src={student?.profilePhoto} name={student?.name} size="md" />
                      <div className="min-w-0">
                        <p className="font-semibold text-navy-900">{student?.name || 'Student'}</p>
                        <p className="mt-0.5 flex items-center gap-1.5 text-sm text-navy-500">
                          <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                          <span className="truncate">{student?.email || '—'}</span>
                        </p>
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
                        <dt className="font-medium text-navy-900">Message</dt>
                        <dd className="whitespace-pre-line">{request.message}</dd>
                      </div>
                    </div>
                  </dl>

                  {request.responseMessage ? (
                    <p className="mt-4 rounded-xl bg-navy-50 p-3 text-sm text-navy-600">
                      <span className="font-semibold text-navy-800">Your reply: </span>
                      {request.responseMessage}
                    </p>
                  ) : null}

                  {request.status === 'accepted' && request.meetingDetails ? (
                    <div className="mt-4 rounded-xl border border-navy-100 p-3 text-sm text-navy-600">
                      <p className="flex items-center gap-2 font-medium text-navy-900">
                        {request.meetingDetails.mode === 'online' ? (
                          <CalendarClock className="h-4 w-4 text-navy-400" aria-hidden="true" />
                        ) : (
                          <MapPin className="h-4 w-4 text-navy-400" aria-hidden="true" />
                        )}
                        {request.meetingDetails.mode === 'online' ? 'Online mentorship' : 'In-person mentorship'}
                      </p>
                      {request.meetingDetails.scheduledAt ? (
                        <p className="mt-1">Scheduled for {formatDateTime(request.meetingDetails.scheduledAt)}</p>
                      ) : null}
                      {request.meetingDetails.link ? (
                        <a
                          href={request.meetingDetails.link}
                          target="_blank"
                          rel="noreferrer"
                          className="link mt-1 inline-block"
                        >
                          Join link
                        </a>
                      ) : null}
                      {request.meetingDetails.location ? (
                        <p className="mt-1">{request.meetingDetails.location}</p>
                      ) : null}
                      {request.meetingDetails.notes ? (
                        <p className="mt-1 text-navy-500">{request.meetingDetails.notes}</p>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="text-xs text-navy-400">
                      Requested {formatDateTime(request.requestedAt || request.createdAt)}
                    </span>
                    {request.status === 'pending' ? (
                      <div className="ml-auto flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          className="btn-ghost btn-sm text-red-600 hover:bg-red-50"
                          onClick={() => openAction(request, 'decline')}
                        >
                          <XCircle className="h-4 w-4" aria-hidden="true" />
                          Decline
                        </button>
                        <button
                          type="button"
                          className="btn-primary btn-sm"
                          onClick={() => openAction(request, 'accept')}
                        >
                          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                          Accept
                        </button>
                      </div>
                    ) : null}
                    {request.status === 'accepted' ? (
                      <button
                        type="button"
                        className="btn-secondary btn-sm ml-auto"
                        onClick={() => openAction(request, 'complete')}
                      >
                        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                        Mark completed
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
          description="Students can find you in the mentor directory when you are open to mentoring."
          action={
            <Link to="/alumni/profile" className="btn-primary btn-sm">
              Update mentoring preferences
            </Link>
          }
        />
      )}

      <Modal
        open={Boolean(action)}
        onClose={() => setAction(null)}
        title={action?.type === 'decline' ? 'Decline request' : action?.type === 'complete' ? 'Complete mentorship' : 'Accept mentorship'}
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setAction(null)} disabled={saving}>
              Cancel
            </button>
            <button type="submit" form="mentorship-action-form" className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : action?.type === 'decline' ? 'Decline' : action?.type === 'complete' ? 'Mark completed' : 'Accept'}
            </button>
          </>
        }
      >
        <form id="mentorship-action-form" onSubmit={submit}>
          {action?.type === 'complete' ? (
            <p className="text-sm text-navy-600">
              Mark this mentorship with <span className="font-semibold text-navy-900">{action?.request?.student?.name || 'the student'}</span> as
              completed. They will be notified.
            </p>
          ) : (
            <>
              <Field
                label={action?.type === 'decline' ? 'Reason (optional)' : 'Message to the student'}
                htmlFor="responseMessage"
                hint={action?.type === 'accept' ? 'Introduce yourself and outline how you can help.' : 'Optional. Shared with the student.'}
              >
                <TextArea
                  id="responseMessage"
                  rows={3}
                  value={form.responseMessage}
                  onChange={(event) => setForm((prev) => ({ ...prev, responseMessage: event.target.value }))}
                />
              </Field>

              {action?.type === 'accept' ? (
                <div className="mt-4 space-y-4">
                  <p className="text-sm font-semibold text-navy-900">First session (optional)</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="label" htmlFor="meetingMode">
                        Meeting mode
                      </label>
                      <select
                        id="meetingMode"
                        className="input"
                        value={form.meetingMode}
                        onChange={(event) => setForm((prev) => ({ ...prev, meetingMode: event.target.value }))}
                      >
                        <option value="online">Online</option>
                        <option value="offline">In person</option>
                      </select>
                    </div>
                    <div>
                      <label className="label" htmlFor="scheduledAt">
                        Date &amp; time
                      </label>
                      <input
                        id="scheduledAt"
                        type="datetime-local"
                        className="input"
                        value={form.scheduledAt}
                        onChange={(event) => setForm((prev) => ({ ...prev, scheduledAt: event.target.value }))}
                      />
                    </div>
                    {form.meetingMode === 'online' ? (
                      <div className="sm:col-span-2">
                        <label className="label" htmlFor="link">
                          Meeting link
                        </label>
                        <input
                          id="link"
                          type="url"
                          className="input"
                          placeholder="https://meet.example.com/..."
                          value={form.link}
                          onChange={(event) => setForm((prev) => ({ ...prev, link: event.target.value }))}
                        />
                      </div>
                    ) : (
                      <div className="sm:col-span-2">
                        <label className="label" htmlFor="location">
                          Location
                        </label>
                        <input
                          id="location"
                          type="text"
                          className="input"
                          placeholder="Campus, address or room"
                          value={form.location}
                          onChange={(event) => setForm((prev) => ({ ...prev, location: event.target.value }))}
                        />
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="label" htmlFor="notes">
                      Notes
                    </label>
                    <textarea
                      id="notes"
                      className="input"
                      rows={2}
                      placeholder="Anything the student should prepare"
                      value={form.notes}
                      onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
                    />
                  </div>
                </div>
              ) : null}
            </>
          )}
        </form>
      </Modal>
    </div>
  );
}
