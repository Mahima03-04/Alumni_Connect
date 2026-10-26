import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Clock, MapPin, TicketCheck, User, Users } from 'lucide-react';
import { eventApi } from '../../api/endpoints';
import useFetch from '../../hooks/useFetch';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { formatDateTime, titleCase } from '../../utils/format';
import { ROLE_HOME } from '../../utils/constants';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import LoadingState, { Spinner } from '../../components/LoadingState';
import ErrorState from '../../components/ErrorState';

/** Full event details with registration controls for students and alumni. */
export default function EventDetailsPage() {
  const { id } = useParams();
  const { role, isAuthenticated } = useAuth();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const { data: event, loading, error, refetch } = useFetch(() => eventApi.get(id), [id]);
  useDocumentTitle(event?.title || 'Event');

  if (loading) return <LoadingState label="Loading event..." />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!event) return null;

  const canRegister = isAuthenticated && (role === 'student' || role === 'alumni');

  const toggleRegistration = async () => {
    setBusy(true);
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
      setBusy(false);
    }
  };

  return (
    <div>
      <button type="button" className="btn-ghost btn-sm mb-3" onClick={() => window.history.back()}>
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back
      </button>

      <PageHeader title={event.title} description={`${titleCase(event.eventType)} · ${titleCase(event.mode)}`} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="card p-6">
            <p className="whitespace-pre-line text-sm leading-relaxed text-navy-700">{event.description}</p>
          </div>

          <div className="card mt-6 p-6">
            <h2 className="text-base font-semibold text-navy-900">When and where</h2>
            <dl className="mt-4 space-y-3 text-sm text-navy-700">
              <div className="flex items-start gap-3">
                <CalendarDays className="mt-0.5 h-4 w-4 text-navy-400" aria-hidden="true" />
                <div>
                  <dt className="font-medium text-navy-900">Starts</dt>
                  <dd>{formatDateTime(event.startDate)}</dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-4 w-4 text-navy-400" aria-hidden="true" />
                <div>
                  <dt className="font-medium text-navy-900">Ends</dt>
                  <dd>{formatDateTime(event.endDate)}</dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 text-navy-400" aria-hidden="true" />
                <div>
                  <dt className="font-medium text-navy-900">Venue</dt>
                  <dd>{event.venue || titleCase(event.mode)}</dd>
                </div>
              </div>
              {event.registrationDeadline ? (
                <div className="flex items-start gap-3">
                  <TicketCheck className="mt-0.5 h-4 w-4 text-navy-400" aria-hidden="true" />
                  <div>
                    <dt className="font-medium text-navy-900">Registration closes</dt>
                    <dd>{formatDateTime(event.registrationDeadline)}</dd>
                  </div>
                </div>
              ) : null}
            </dl>
          </div>
        </div>

        <div>
          <div className="card p-6">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={event.status} />
              {event.isRegistered ? <StatusBadge status="registered" label="You are registered" /> : null}
            </div>

            <dl className="mt-4 space-y-3 text-sm text-navy-700">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-navy-400" aria-hidden="true" />
                <span>
                  {event.registeredCount} of {event.capacity} seats filled
                </span>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-navy-400" aria-hidden="true" />
                <span>Organised by {event.organizerName || event.organizer?.name || 'the university'}</span>
              </div>
            </dl>

            {canRegister ? (
              <button
                type="button"
                className={`mt-5 w-full ${event.isRegistered ? 'btn-secondary' : 'btn-primary'}`}
                onClick={toggleRegistration}
                disabled={busy || (!event.isRegistered && event.seatsLeft <= 0)}
              >
                {busy ? (
                  <Spinner className="h-4 w-4" />
                ) : event.isRegistered ? (
                  'Cancel registration'
                ) : event.seatsLeft <= 0 ? (
                  'Fully booked'
                ) : (
                  'Register for this event'
                )}
              </button>
            ) : isAuthenticated && role === 'admin' ? (
              <p className="mt-5 rounded-xl bg-navy-50 p-3 text-xs text-navy-500">
                Administrators manage events from the Event Management page.
              </p>
            ) : !isAuthenticated ? (
              <Link to="/login" state={{ from: { pathname: `/events/${id}` } }} className="btn-primary mt-5 w-full">
                Sign in to register
              </Link>
            ) : null}
          </div>

          <Link to={isAuthenticated ? ROLE_HOME[role] || '/events' : '/events'} className="btn-ghost mt-4 w-full">
            Back to events
          </Link>
        </div>
      </div>
    </div>
  );
}
