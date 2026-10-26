import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Pencil, Plus, Trash2, Users } from 'lucide-react';
import { eventApi } from '../../api/endpoints';
import useFetch from '../../hooks/useFetch';
import useDebounce from '../../hooks/useDebounce';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { useToast } from '../../hooks/useToast';
import { EVENT_MODES, EVENT_TYPES } from '../../utils/constants';
import { formatDateTime, titleCase } from '../../utils/format';
import PageHeader from '../../components/PageHeader';
import EventCard from '../../components/EventCard';
import StatusBadge from '../../components/StatusBadge';
import SearchBar from '../../components/SearchBar';
import FilterSelect from '../../components/FilterSelect';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import Pagination from '../../components/Pagination';
import LoadingState, { CardSkeletonGrid } from '../../components/LoadingState';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'completed', label: 'Completed' },
];

/** Modal listing the registrations for a single event. */
function RegistrationsModal({ event, onClose }) {
  const id = event.id || event._id;
  const { data, loading, error, refetch } = useFetch(
    () => eventApi.registrations(id, { page: 1, limit: 50 }),
    [id]
  );

  const summary = data?.event;
  const registrations = data?.registrations || [];

  return (
    <Modal open onClose={onClose} title="Registrations" size="lg">
      <div className="mb-4">
        <p className="font-semibold text-navy-900">{event.title}</p>
        {summary ? (
          <p className="mt-1 text-sm text-navy-500">
            {summary.registeredCount ?? registrations.length} registered
            {typeof summary.capacity === 'number' ? ` · ${summary.seatsLeft} of ${summary.capacity} seats left` : ''}
          </p>
        ) : null}
      </div>

      {loading ? (
        <LoadingState label="Loading registrations..." />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : registrations.length ? (
        <ul className="divide-y divide-navy-100">
          {registrations.map((registration) => {
            const regId = registration._id || registration.id;
            const name = registration.user?.name || registration.attendeeName || 'Unknown';
            const email = registration.user?.email || registration.attendeeEmail || '—';
            const role = registration.user?.role || registration.attendeeRole;
            return (
              <li
                key={regId}
                className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-medium text-navy-900">{name}</p>
                  <p className="truncate text-sm text-navy-500">{email}</p>
                  {role ? <p className="text-xs text-navy-400">{titleCase(role)}</p> : null}
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  {registration.registrationStatus ? (
                    <StatusBadge status={registration.registrationStatus} />
                  ) : null}
                  <span className="text-xs text-navy-400">{formatDateTime(registration.registeredAt)}</span>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState
          icon={Users}
          title="No registrations yet"
          description="Nobody has registered for this event so far."
        />
      )}
    </Modal>
  );
}

/** Admin event manager: filters, edit/delete and registration review. */
export default function EventManagementPage() {
  useDocumentTitle('Event management');
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [eventType, setEventType] = useState('');
  const [mode, setMode] = useState('');
  const [registrationsFor, setRegistrationsFor] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const debouncedQ = useDebounce(q, 350);

  const { data, meta, loading, error, refetch } = useFetch(
    () =>
      eventApi.list({
        q: debouncedQ || undefined,
        status: status || undefined,
        eventType: eventType || undefined,
        mode: mode || undefined,
        includeAll: 'true',
        page,
        limit: 9,
      }),
    [debouncedQ, status, eventType, mode, page]
  );

  const events = data || [];

  const runDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await eventApi.remove(deleting);
      toast.success('Event deleted.');
      setDeleting(null);
      await refetch();
    } catch (err) {
      toast.error(err.friendlyMessage || 'Unable to delete the event.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Event management"
        description="Create, publish and manage events for students and alumni."
        icon={CalendarDays}
        actions={
          <Link to="/admin/events/new" className="btn-primary btn-sm">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Create event
          </Link>
        }
      />

      <div className="card mb-6 p-4">
        <div className="grid gap-3 md:grid-cols-4">
          <div className="md:col-span-2">
            <SearchBar
              value={q}
              onChange={(value) => {
                setQ(value);
                setPage(1);
              }}
              placeholder="Search events..."
            />
          </div>
          <FilterSelect
            name="event-status"
            label=""
            allLabel="All statuses"
            value={status}
            onChange={(value) => {
              setStatus(value);
              setPage(1);
            }}
            options={STATUS_OPTIONS}
          />
          <FilterSelect
            name="event-type"
            label=""
            allLabel="All event types"
            value={eventType}
            onChange={(value) => {
              setEventType(value);
              setPage(1);
            }}
            options={EVENT_TYPES.map((value) => ({ value, label: titleCase(value) }))}
          />
          <FilterSelect
            name="event-mode"
            label=""
            allLabel="All modes"
            value={mode}
            onChange={(value) => {
              setMode(value);
              setPage(1);
            }}
            options={EVENT_MODES.map((value) => ({ value, label: titleCase(value) }))}
          />
        </div>
      </div>

      {loading ? (
        <CardSkeletonGrid count={6} />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : events.length ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => {
              const id = event.id || event._id;
              return (
                <EventCard
                  key={id}
                  event={event}
                  showStatus
                  footer={
                    <>
                      <Link to={`/admin/events/${id}/edit`} className="btn-secondary btn-sm">
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                        Edit
                      </Link>
                      <button
                        type="button"
                        className="btn-secondary btn-sm"
                        onClick={() => setRegistrationsFor(event)}
                      >
                        <Users className="h-4 w-4" aria-hidden="true" />
                        Registrations
                      </button>
                      <button
                        type="button"
                        className="btn-ghost btn-sm text-red-600 hover:bg-red-50"
                        onClick={() => setDeleting(id)}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                        Delete
                      </button>
                    </>
                  }
                />
              );
            })}
          </div>
          <Pagination meta={meta} onChange={setPage} className="mt-6" />
        </>
      ) : (
        <EmptyState
          icon={CalendarDays}
          title="No events found"
          description="Create an event or adjust the filters to see more."
          action={
            <Link to="/admin/events/new" className="btn-primary btn-sm">
              Create event
            </Link>
          }
        />
      )}

      {registrationsFor ? (
        <RegistrationsModal event={registrationsFor} onClose={() => setRegistrationsFor(null)} />
      ) : null}

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete event?"
        message="This permanently removes the event and all of its registrations."
        confirmLabel="Delete event"
        loading={busy}
        onConfirm={runDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
