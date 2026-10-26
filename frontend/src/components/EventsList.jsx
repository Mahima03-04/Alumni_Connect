import { useState } from 'react';
import { CalendarDays, SlidersHorizontal } from 'lucide-react';
import { eventApi } from '../api/endpoints';
import useFetch from '../hooks/useFetch';
import useDebounce from '../hooks/useDebounce';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { EVENT_MODES, EVENT_TYPES } from '../utils/constants';
import { titleCase } from '../utils/format';
import PageHeader from './PageHeader';
import SearchBar from './SearchBar';
import FilterSelect from './FilterSelect';
import EventCard from './EventCard';
import Pagination from './Pagination';
import { CardSkeletonGrid, Spinner } from './LoadingState';
import ErrorState from './ErrorState';
import EmptyState from './EmptyState';

/**
 * Reusable published-events list with filters and (for students/alumni)
 * register and cancel actions.
 */
export default function EventsList({ title = 'Events', description = '', showStatus = false, includeAll = false, defaultUpcoming = false }) {
  const { role, isAuthenticated } = useAuth();
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [eventType, setEventType] = useState('');
  const [mode, setMode] = useState('');
  const [upcoming, setUpcoming] = useState(defaultUpcoming);
  const [showFilters, setShowFilters] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const debouncedQ = useDebounce(q, 350);

  const { data, meta, loading, error, refetch } = useFetch(
    () =>
      eventApi.list({
        q: debouncedQ || undefined,
        eventType: eventType || undefined,
        mode: mode || undefined,
        upcoming: upcoming ? 'true' : undefined,
        includeAll: includeAll ? 'true' : undefined,
        page,
        limit: 9,
      }),
    [debouncedQ, eventType, mode, upcoming, includeAll, page]
  );

  const canRegister = isAuthenticated && (role === 'student' || role === 'alumni');

  const toggleRegistration = async (event) => {
    const id = event.id || event._id;
    setBusyId(id);
    try {
      if (event.isRegistered) {
        await eventApi.cancel(id);
        toast.warning('Registration cancelled.');
      } else {
        await eventApi.register(id);
        toast.success('Registered successfully.');
      }
      await refetch();
    } catch (err) {
      toast.error(err.friendlyMessage || 'Unable to update your registration.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <PageHeader
        title={title}
        description={description}
        icon={CalendarDays}
        actions={
          <button type="button" className="btn-secondary btn-sm lg:hidden" onClick={() => setShowFilters((v) => !v)}>
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            Filters
          </button>
        }
      />

      <div className="card mb-6 p-4">
        <div className="grid gap-3 md:grid-cols-4">
          <div className="md:col-span-2">
            <SearchBar value={q} onChange={(value) => { setQ(value); setPage(1); }} placeholder="Search events..." />
          </div>
          <div className={`${showFilters ? 'block' : 'hidden'} md:block`}>
            <FilterSelect
              name="event-type"
              label=""
              allLabel="All event types"
              value={eventType}
              onChange={(value) => { setEventType(value); setPage(1); }}
              options={EVENT_TYPES.map((value) => ({ value, label: titleCase(value) }))}
            />
          </div>
          <div className={`${showFilters ? 'block' : 'hidden'} md:block`}>
            <FilterSelect
              name="event-mode"
              label=""
              allLabel="All modes"
              value={mode}
              onChange={(value) => { setMode(value); setPage(1); }}
              options={EVENT_MODES.map((value) => ({ value, label: titleCase(value) }))}
            />
          </div>
        </div>
        <div className={`mt-3 flex-wrap items-center justify-between gap-3 ${showFilters ? 'flex' : 'hidden md:flex'}`}>
          <label className="flex items-center gap-2 text-sm text-navy-600">
            <input
              type="checkbox"
              checked={upcoming}
              onChange={(e) => { setUpcoming(e.target.checked); setPage(1); }}
              className="h-4 w-4 rounded border-navy-300 text-royal-600 focus:ring-royal-500"
            />
            Upcoming only
          </label>
          <button
            type="button"
            className="btn-ghost btn-sm"
            onClick={() => { setQ(''); setEventType(''); setMode(''); setUpcoming(false); setPage(1); }}
          >
            Reset filters
          </button>
        </div>
      </div>

      {loading ? (
        <CardSkeletonGrid count={6} />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : data?.length ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((event) => (
              <EventCard
                key={event.id || event._id}
                event={event}
                to={`/events/${event.id || event._id}`}
                showStatus={showStatus}
                footer={
                  canRegister ? (
                    <button
                      type="button"
                      className={event.isRegistered ? 'btn-secondary btn-sm' : 'btn-primary btn-sm'}
                      onClick={(clickEvent) => {
                        clickEvent.preventDefault();
                        toggleRegistration(event);
                      }}
                      disabled={busyId === (event.id || event._id)}
                    >
                      {busyId === (event.id || event._id) ? (
                        <Spinner className="h-4 w-4" />
                      ) : event.isRegistered ? (
                        'Cancel registration'
                      ) : (
                        'Register'
                      )}
                    </button>
                  ) : null
                }
              />
            ))}
          </div>
          <Pagination meta={meta} onChange={setPage} className="mt-6" />
        </>
      ) : (
        <EmptyState
          icon={CalendarDays}
          title="No events found"
          description="Check back soon or adjust your filters to see more events."
        />
      )}
    </div>
  );
}
