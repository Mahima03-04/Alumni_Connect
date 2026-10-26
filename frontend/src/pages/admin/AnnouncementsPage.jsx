import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Megaphone, Plus } from 'lucide-react';
import { announcementApi } from '../../api/endpoints';
import useFetch from '../../hooks/useFetch';
import useDebounce from '../../hooks/useDebounce';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { useToast } from '../../hooks/useToast';
import { ANNOUNCEMENT_AUDIENCES, ANNOUNCEMENT_PRIORITIES } from '../../utils/constants';
import { titleCase } from '../../utils/format';
import PageHeader from '../../components/PageHeader';
import AnnouncementCard from '../../components/AnnouncementCard';
import SearchBar from '../../components/SearchBar';
import FilterSelect from '../../components/FilterSelect';
import Pagination from '../../components/Pagination';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import LoadingState from '../../components/LoadingState';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import { Field, TextInput, TextArea, Select, FormGrid } from '../../components/FormField';

const EMPTY_FORM = {
  title: '',
  body: '',
  audience: 'all',
  priority: 'normal',
  status: 'draft',
  expiresAt: '',
};

const STATUS_OPTIONS = ['draft', 'published', 'archived'];

function toDateInput(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

/** Admin CRUD for announcements with filters, publishing and delete actions. */
export default function AnnouncementsPage() {
  useDocumentTitle('Announcements');
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [audience, setAudience] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);
  const debouncedQ = useDebounce(q, 400);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ defaultValues: EMPTY_FORM });

  const { data, meta, loading, error, refetch } = useFetch(
    () =>
      announcementApi.list({
        q: debouncedQ || undefined,
        status: status || undefined,
        audience: audience || undefined,
        page,
        limit: 10,
      }),
    [debouncedQ, status, audience, page]
  );

  const openCreate = () => {
    setEditing(null);
    reset(EMPTY_FORM);
    setFormOpen(true);
  };

  const openEdit = (announcement) => {
    setEditing(announcement);
    reset({
      title: announcement.title || '',
      body: announcement.body || '',
      audience: announcement.audience || 'all',
      priority: announcement.priority || 'normal',
      status: announcement.status || 'draft',
      expiresAt: toDateInput(announcement.expiresAt),
    });
    setFormOpen(true);
  };

  const submit = async (values) => {
    setBusy(true);
    const payload = {
      title: values.title.trim(),
      body: values.body.trim(),
      audience: values.audience,
      priority: values.priority,
      status: values.status,
      expiresAt: values.expiresAt || null,
    };
    try {
      if (editing) {
        await announcementApi.update(editing._id, payload);
        toast.success('Announcement updated.');
      } else {
        await announcementApi.create(payload);
        toast.success('Announcement created.');
      }
      setFormOpen(false);
      setEditing(null);
      await refetch();
    } catch (err) {
      toast.error(err.friendlyMessage || 'Unable to save the announcement.');
    } finally {
      setBusy(false);
    }
  };

  const togglePublish = async (announcement) => {
    const nextStatus = announcement.status === 'published' ? 'draft' : 'published';
    try {
      await announcementApi.update(announcement._id, { status: nextStatus });
      toast.success(nextStatus === 'published' ? 'Announcement published.' : 'Announcement moved to draft.');
      await refetch();
    } catch (err) {
      toast.error(err.friendlyMessage || 'Unable to update the announcement.');
    }
  };

  const removeConfirmed = async () => {
    if (!confirm) return;
    setBusy(true);
    try {
      await announcementApi.remove(confirm._id);
      toast.success('Announcement deleted.');
      setConfirm(null);
      await refetch();
    } catch (err) {
      toast.error(err.friendlyMessage || 'Unable to delete the announcement.');
    } finally {
      setBusy(false);
    }
  };

  const announcements = data || [];

  return (
    <div>
      <PageHeader
        title="Announcements"
        description="Publish notices to students, alumni or everyone."
        icon={Megaphone}
        actions={
          <button type="button" className="btn-primary btn-sm" onClick={openCreate}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            New announcement
          </button>
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <SearchBar value={q} onChange={(value) => { setQ(value); setPage(1); }} placeholder="Search announcements..." />
        <FilterSelect
          label="Status"
          value={status}
          onChange={(value) => { setStatus(value); setPage(1); }}
          options={STATUS_OPTIONS}
        />
        <FilterSelect
          label="Audience"
          value={audience}
          onChange={(value) => { setAudience(value); setPage(1); }}
          options={ANNOUNCEMENT_AUDIENCES}
        />
      </div>

      {loading ? (
        <LoadingState label="Loading announcements..." />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : announcements.length ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            {announcements.map((announcement) => (
              <AnnouncementCard
                key={announcement._id}
                announcement={announcement}
                showStatus
                actions={
                  <>
                    <button type="button" className="btn-ghost btn-sm" onClick={() => openEdit(announcement)}>
                      Edit
                    </button>
                    <button type="button" className="btn-ghost btn-sm" onClick={() => togglePublish(announcement)}>
                      {announcement.status === 'published' ? 'Unpublish' : 'Publish'}
                    </button>
                    <button
                      type="button"
                      className="btn-ghost btn-sm text-red-600 hover:bg-red-50"
                      onClick={() => setConfirm(announcement)}
                    >
                      Delete
                    </button>
                  </>
                }
              />
            ))}
          </div>
          <Pagination meta={meta} onChange={setPage} className="mt-6" />
        </>
      ) : (
        <EmptyState
          icon={Megaphone}
          title="No announcements"
          description="Create an announcement to keep the community informed."
          action={
            <button type="button" className="btn-primary btn-sm" onClick={openCreate}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              New announcement
            </button>
          }
        />
      )}

      <Modal
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null); }}
        title={editing ? 'Edit announcement' : 'New announcement'}
        size="lg"
        footer={
          <>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => { setFormOpen(false); setEditing(null); }}
              disabled={busy}
            >
              Cancel
            </button>
            <button type="submit" form="announcement-form" className="btn-primary" disabled={busy}>
              {busy ? 'Saving...' : editing ? 'Save changes' : 'Create announcement'}
            </button>
          </>
        }
      >
        <form id="announcement-form" onSubmit={handleSubmit(submit)} className="space-y-4">
          <Field label="Title" htmlFor="title" required error={errors.title}>
            <TextInput
              id="title"
              placeholder="Announcement title"
              error={errors.title}
              {...register('title', { required: 'Title is required.' })}
            />
          </Field>

          <Field label="Body" htmlFor="body" required error={errors.body}>
            <TextArea
              id="body"
              rows={5}
              placeholder="Write the announcement details..."
              error={errors.body}
              {...register('body', {
                required: 'Body is required.',
                minLength: { value: 10, message: 'Body must be at least 10 characters.' },
              })}
            />
          </Field>

          <FormGrid>
            <Field label="Audience" htmlFor="audience">
              <Select id="audience" {...register('audience')}>
                {ANNOUNCEMENT_AUDIENCES.map((option) => (
                  <option key={option} value={option}>
                    {titleCase(option)}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Priority" htmlFor="priority">
              <Select id="priority" {...register('priority')}>
                {ANNOUNCEMENT_PRIORITIES.map((option) => (
                  <option key={option} value={option}>
                    {titleCase(option)}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Status" htmlFor="status">
              <Select id="status" {...register('status')}>
                {STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {titleCase(option)}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Expires at" htmlFor="expiresAt" hint="Optional. The announcement hides after this date.">
              <TextInput id="expiresAt" type="date" {...register('expiresAt')} />
            </Field>
          </FormGrid>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirm)}
        title="Delete announcement?"
        message={`"${confirm?.title || 'This announcement'}" will be permanently removed.`}
        confirmLabel="Delete"
        tone="danger"
        loading={busy}
        onConfirm={removeConfirmed}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}
