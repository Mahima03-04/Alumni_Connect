import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { CalendarDays, Save } from 'lucide-react';
import { eventApi } from '../../api/endpoints';
import useFetch from '../../hooks/useFetch';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { useToast } from '../../hooks/useToast';
import { EVENT_AUDIENCES, EVENT_MODES, EVENT_TYPES } from '../../utils/constants';
import { titleCase } from '../../utils/format';
import PageHeader from '../../components/PageHeader';
import LoadingState from '../../components/LoadingState';
import ErrorState from '../../components/ErrorState';
import { Field, FormActions, FormGrid, Select, TextArea, TextInput } from '../../components/FormField';

/** datetime-local inputs expect "YYYY-MM-DDTHH:mm". */
const toDateTimeInput = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 16);
};

const toIso = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'completed', label: 'Completed' },
];

const BANNER_OPTIONS = [
  { value: 'navy', label: 'Navy' },
  { value: 'royal', label: 'Royal' },
  { value: 'accent', label: 'Accent' },
  { value: 'amber', label: 'Amber' },
];

/** Create / edit form for an event, used by the admin event manager. */
export default function EventFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  useDocumentTitle(isEdit ? 'Edit event' : 'Create event');
  const navigate = useNavigate();
  const toast = useToast();
  const [saving, setSaving] = useState(false);

  const { data: event, loading, error, refetch } = useFetch(
    () => (isEdit ? eventApi.get(id) : Promise.resolve({ data: { data: null } })),
    [id, isEdit]
  );

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: '',
      description: '',
      eventType: 'workshop',
      mode: 'offline',
      venue: '',
      startDate: '',
      endDate: '',
      registrationDeadline: '',
      capacity: 100,
      audience: 'all',
      status: 'draft',
      bannerColor: 'navy',
    },
  });

  const startDate = watch('startDate');

  useEffect(() => {
    if (!isEdit || !event) return;
    reset({
      title: event.title || '',
      description: event.description || '',
      eventType: event.eventType || 'workshop',
      mode: event.mode || 'offline',
      venue: event.venue || '',
      startDate: toDateTimeInput(event.startDate),
      endDate: toDateTimeInput(event.endDate),
      registrationDeadline: toDateTimeInput(event.registrationDeadline),
      capacity: event.capacity ?? 100,
      audience: event.audience || 'all',
      status: event.status || 'draft',
      bannerColor: event.bannerColor || 'navy',
    });
  }, [isEdit, event, reset]);

  const onSubmit = async (values) => {
    setSaving(true);
    try {
      const payload = {
        title: values.title.trim(),
        description: values.description.trim(),
        eventType: values.eventType,
        mode: values.mode,
        venue: values.venue.trim(),
        startDate: toIso(values.startDate),
        endDate: toIso(values.endDate),
        registrationDeadline: toIso(values.registrationDeadline),
        capacity: values.capacity === '' ? 1 : Number(values.capacity),
        audience: values.audience,
        status: values.status,
        bannerColor: values.bannerColor,
      };

      if (isEdit) {
        await eventApi.update(id, payload);
        toast.success('Event updated.');
      } else {
        await eventApi.create(payload);
        toast.success('Event created.');
      }
      navigate('/admin/events');
    } catch (err) {
      toast.error(err.friendlyMessage || 'Unable to save the event.');
    } finally {
      setSaving(false);
    }
  };

  if (isEdit && loading) return <LoadingState label="Loading event..." />;
  if (isEdit && error) return <ErrorState message={error} onRetry={refetch} />;

  return (
    <div>
      <PageHeader
        title={isEdit ? 'Edit event' : 'Create event'}
        description="Set the schedule, capacity and visibility for this event."
        icon={CalendarDays}
        breadcrumb={[{ label: 'Event management', to: '/admin/events' }, { label: isEdit ? 'Edit' : 'New' }]}
      />

      <form className="card max-w-3xl p-6" onSubmit={handleSubmit(onSubmit)}>
        {isEdit && event?.status === 'published' ? (
          <p className="mb-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-700">
            This event is already published. Any changes you save will be visible to attendees immediately.
          </p>
        ) : null}

        <Field label="Title" htmlFor="title" required error={errors.title}>
          <TextInput id="title" error={errors.title} {...register('title', { required: 'Title is required.' })} />
        </Field>

        <Field
          label="Description"
          htmlFor="description"
          required
          className="mt-4"
          error={errors.description}
          hint="At least 20 characters. Describe the event, agenda and who should attend."
        >
          <TextArea
            id="description"
            rows={6}
            error={errors.description}
            {...register('description', {
              required: 'Description is required.',
              minLength: { value: 20, message: 'Description must be at least 20 characters.' },
            })}
          />
        </Field>

        <FormGrid className="mt-4">
          <Field label="Event type" htmlFor="eventType">
            <Select id="eventType" {...register('eventType')}>
              {EVENT_TYPES.map((value) => (
                <option key={value} value={value}>
                  {titleCase(value)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Mode" htmlFor="mode">
            <Select id="mode" {...register('mode')}>
              {EVENT_MODES.map((value) => (
                <option key={value} value={value}>
                  {titleCase(value)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Venue" htmlFor="venue" error={errors.venue} hint="Used for offline and hybrid events.">
            <TextInput id="venue" placeholder="e.g. Main auditorium" error={errors.venue} {...register('venue')} />
          </Field>
          <Field label="Capacity" htmlFor="capacity" error={errors.capacity}>
            <TextInput
              id="capacity"
              type="number"
              min={1}
              error={errors.capacity}
              {...register('capacity', { min: { value: 1, message: 'Capacity must be at least 1.' } })}
            />
          </Field>
        </FormGrid>

        <FormGrid className="mt-4">
          <Field label="Start date &amp; time" htmlFor="startDate" required error={errors.startDate}>
            <TextInput
              id="startDate"
              type="datetime-local"
              error={errors.startDate}
              {...register('startDate', { required: 'Start date is required.' })}
            />
          </Field>
          <Field label="End date &amp; time" htmlFor="endDate" required error={errors.endDate}>
            <TextInput
              id="endDate"
              type="datetime-local"
              error={errors.endDate}
              {...register('endDate', {
                required: 'End date is required.',
                validate: (value) =>
                  !value ||
                  !startDate ||
                  new Date(value) >= new Date(startDate) ||
                  'End date must be on or after the start date.',
              })}
            />
          </Field>
          <Field
            label="Registration deadline"
            htmlFor="registrationDeadline"
            error={errors.registrationDeadline}
            hint="Optional."
          >
            <TextInput
              id="registrationDeadline"
              type="datetime-local"
              error={errors.registrationDeadline}
              {...register('registrationDeadline')}
            />
          </Field>
          <Field label="Audience" htmlFor="audience">
            <Select id="audience" {...register('audience')}>
              {EVENT_AUDIENCES.map((value) => (
                <option key={value} value={value}>
                  {titleCase(value)}
                </option>
              ))}
            </Select>
          </Field>
        </FormGrid>

        <FormGrid className="mt-4">
          <Field label="Status" htmlFor="status">
            <Select id="status" {...register('status')}>
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Banner colour" htmlFor="bannerColor">
            <Select id="bannerColor" {...register('bannerColor')}>
              {BANNER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>
        </FormGrid>

        <FormActions>
          <Link to="/admin/events" className="btn-secondary">
            Cancel
          </Link>
          <button type="submit" className="btn-primary" disabled={saving}>
            <Save className="h-4 w-4" aria-hidden="true" />
            {saving ? 'Saving...' : isEdit ? 'Save changes' : 'Create event'}
          </button>
        </FormActions>
      </form>
    </div>
  );
}
