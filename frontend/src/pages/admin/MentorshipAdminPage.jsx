import { useState } from 'react';
import { CalendarClock, Eye, Handshake, MapPin, User } from 'lucide-react';
import { adminApi } from '../../api/endpoints';
import useFetch from '../../hooks/useFetch';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { formatDateTime, titleCase } from '../../utils/format';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import Pagination from '../../components/Pagination';
import ErrorState from '../../components/ErrorState';

const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

function Field({ label, children }) {
  if (children === undefined || children === null || children === '') return null;
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-navy-400">{label}</dt>
      <dd className="mt-0.5 text-sm text-navy-700">{children}</dd>
    </div>
  );
}

/** Read-only monitoring of every mentorship request on the platform. */
export default function MentorshipAdminPage() {
  useDocumentTitle('Mentorship');
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [selected, setSelected] = useState(null);

  const { data, meta, loading, error, refetch } = useFetch(
    () => adminApi.mentorship({ page, limit: 10, status: status || undefined }),
    [page, status]
  );

  const columns = [
    {
      key: 'student',
      header: 'Student',
      render: (row) => (
        <div className="min-w-0">
          <p className="font-medium text-navy-900">{row.student?.name || 'Student'}</p>
          <p className="truncate text-xs text-navy-500">{row.student?.email || '—'}</p>
        </div>
      ),
    },
    {
      key: 'mentor',
      header: 'Mentor',
      render: (row) => (
        <div className="min-w-0">
          <p className="font-medium text-navy-900">{row.alumni?.name || 'Alumnus'}</p>
          <p className="truncate text-xs text-navy-500">{row.alumni?.email || '—'}</p>
        </div>
      ),
    },
    {
      key: 'careerGoal',
      header: 'Career goal',
      render: (row) => <span className="line-clamp-2 max-w-xs text-sm text-navy-700">{row.careerGoal || '—'}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'requestedAt',
      header: 'Requested',
      render: (row) => (
        <span className="whitespace-nowrap text-sm text-navy-500">
          {formatDateTime(row.requestedAt || row.createdAt)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (row) => (
        <button
          type="button"
          className="btn-secondary btn-sm"
          onClick={() => setSelected(row)}
          aria-label={`View mentorship request from ${row.student?.name || 'student'}`}
        >
          <Eye className="h-4 w-4" aria-hidden="true" />
          View
        </button>
      ),
    },
  ];

  const meeting = selected?.meetingDetails || {};

  return (
    <div>
      <PageHeader
        title="Mentorship"
        description="Monitor every mentorship request between students and alumni."
        icon={Handshake}
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

      {error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={data || []}
            loading={loading}
            emptyTitle="No mentorship requests"
            emptyDescription="Mentorship requests will appear here once students reach out to alumni."
          />
          <Pagination meta={meta} onChange={setPage} className="mt-6" />
        </>
      )}

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title="Mentorship request"
        size="lg"
        footer={
          <button type="button" className="btn-secondary" onClick={() => setSelected(null)}>
            Close
          </button>
        }
      >
        {selected ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-navy-900">{selected.student?.name || 'Student'}</p>
                <p className="text-xs text-navy-500">{selected.student?.email || '—'}</p>
              </div>
              <StatusBadge status={selected.status} />
            </div>

            <dl className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-start gap-2">
                  <User className="mt-0.5 h-4 w-4 shrink-0 text-navy-400" aria-hidden="true" />
                  <Field label="Career goal">{selected.careerGoal}</Field>
                </div>
                <div className="flex items-start gap-2">
                  <Handshake className="mt-0.5 h-4 w-4 shrink-0 text-navy-400" aria-hidden="true" />
                  <Field label="Area of interest">{selected.areaOfInterest}</Field>
                </div>
              </div>

              <Field label="Student message">
                <p className="whitespace-pre-line">{selected.message}</p>
              </Field>

              {selected.responseMessage ? (
                <Field label="Mentor response">
                  <p className="whitespace-pre-line rounded-xl bg-navy-50 p-3 text-navy-600">{selected.responseMessage}</p>
                </Field>
              ) : null}

              {meeting.mode || meeting.scheduledAt || meeting.location || meeting.link || meeting.notes ? (
                <div className="rounded-xl border border-navy-100 p-4">
                  <p className="flex items-center gap-2 text-sm font-semibold text-navy-900">
                    {meeting.mode === 'online' ? (
                      <CalendarClock className="h-4 w-4 text-navy-400" aria-hidden="true" />
                    ) : (
                      <MapPin className="h-4 w-4 text-navy-400" aria-hidden="true" />
                    )}
                    Meeting details
                  </p>
                  <dl className="mt-3 space-y-3">
                    <Field label="Mode">{meeting.mode ? titleCase(meeting.mode) : ''}</Field>
                    <Field label="Scheduled for">{meeting.scheduledAt ? formatDateTime(meeting.scheduledAt) : ''}</Field>
                    <Field label="Location">{meeting.location}</Field>
                    <Field label="Link">
                      {meeting.link ? (
                        <a
                          href={meeting.link}
                          target="_blank"
                          rel="noreferrer"
                          className="link inline-block break-all"
                        >
                          {meeting.link}
                        </a>
                      ) : null}
                    </Field>
                    <Field label="Notes">{meeting.notes}</Field>
                  </dl>
                </div>
              ) : null}

              <div className="rounded-xl border border-navy-100 p-4">
                <p className="text-sm font-semibold text-navy-900">Timeline</p>
                <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                  <Field label="Requested">{formatDateTime(selected.requestedAt || selected.createdAt)}</Field>
                  <Field label="Responded">{selected.respondedAt ? formatDateTime(selected.respondedAt) : ''}</Field>
                  <Field label="Completed">{selected.completedAt ? formatDateTime(selected.completedAt) : ''}</Field>
                  <Field label="Created">{selected.createdAt ? formatDateTime(selected.createdAt) : ''}</Field>
                </dl>
              </div>
            </dl>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
