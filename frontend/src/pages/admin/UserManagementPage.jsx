import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, Users } from 'lucide-react';
import { adminApi } from '../../api/endpoints';
import useFetch from '../../hooks/useFetch';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { useDebounce } from '../../hooks/useDebounce';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { formatDate, titleCase } from '../../utils/format';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import Avatar from '../../components/Avatar';
import StatusBadge from '../../components/StatusBadge';
import Pagination from '../../components/Pagination';
import Modal from '../../components/Modal';
import SearchBar from '../../components/SearchBar';
import FilterSelect from '../../components/FilterSelect';
import { Select, TextArea } from '../../components/FormField';
import ErrorState from '../../components/ErrorState';

const ROLE_OPTIONS = [
  { value: 'student', label: 'Student' },
  { value: 'alumni', label: 'Alumni' },
  { value: 'admin', label: 'Administrator' },
];

const ACCOUNT_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'suspended', label: 'Suspended' },
];

const APPROVAL_STATUS_OPTIONS = [
  { value: 'not_required', label: 'Not required' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

const EDITABLE_ROLE_OPTIONS = [
  { value: 'student', label: 'Student' },
  { value: 'alumni', label: 'Alumni' },
];

/** Admin user directory with filters and inline status management. */
export default function UserManagementPage() {
  useDocumentTitle('User management');
  const { user: currentUser } = useAuth();
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [role, setRole] = useState('');
  const [accountStatus, setAccountStatus] = useState('');
  const [approvalStatus, setApprovalStatus] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ accountStatus: 'active', role: 'student', reason: '' });
  const [saving, setSaving] = useState(false);

  const debouncedQ = useDebounce(q, 400);

  const { data, meta, loading, error, refetch } = useFetch(
    () =>
      adminApi.users({
        q: debouncedQ || undefined,
        role: role || undefined,
        accountStatus: accountStatus || undefined,
        approvalStatus: approvalStatus || undefined,
        page,
        limit: 12,
        sortBy: 'createdAt',
        order: 'desc',
      }),
    [debouncedQ, role, accountStatus, approvalStatus, page]
  );

  const openEditor = (user) => {
    setEditing(user);
    setForm({
      accountStatus: user.accountStatus || 'active',
      role: user.role === 'admin' ? 'admin' : user.role || 'student',
      reason: '',
    });
  };

  const saveStatus = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const payload = {
        accountStatus: form.accountStatus,
        reason: form.reason.trim() || undefined,
      };
      if (editing.role !== 'admin') payload.role = form.role;
      await adminApi.updateUserStatus(editing._id || editing.id, payload);
      toast.success(`${editing.name} updated.`);
      setEditing(null);
      await refetch();
    } catch (err) {
      toast.error(err.friendlyMessage || 'Unable to update this user.');
    } finally {
      setSaving(false);
    }
  };

  const isSelf = (row) => {
    const rowId = row._id || row.id;
    const selfId = currentUser?._id || currentUser?.id;
    return Boolean(rowId && selfId && rowId === selfId);
  };

  const columns = [
    {
      key: 'name',
      header: 'Name',
      render: (row) => (
        <div className="flex items-center gap-3">
          <Avatar src={row.profilePhoto} name={row.name} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-medium text-navy-900">{row.name}</p>
            <p className="truncate text-xs text-navy-500">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (row) => <span className="text-navy-700">{titleCase(row.role)}</span>,
    },
    {
      key: 'accountStatus',
      header: 'Account status',
      render: (row) => <StatusBadge status={row.accountStatus} />,
    },
    {
      key: 'approvalStatus',
      header: 'Approval',
      render: (row) => <StatusBadge status={row.approvalStatus} />,
    },
    {
      key: 'createdAt',
      header: 'Registered',
      render: (row) => <span className="text-navy-500">{formatDate(row.createdAt)}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      headerClassName: 'text-right',
      render: (row) => {
        const id = row._id || row.id;
        const locked = row.role === 'admin' || isSelf(row);
        return (
          <div className="flex items-center justify-end gap-1">
            <Link to={`/admin/users/${id}`} className="btn-ghost btn-sm">
              View
            </Link>
            <button
              type="button"
              className="btn-secondary btn-sm"
              onClick={() => openEditor(row)}
              disabled={locked}
              title={locked ? 'This account cannot be modified here.' : 'Update status'}
            >
              <Pencil className="h-4 w-4" aria-hidden="true" />
              Update status
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <PageHeader
        title="User management"
        description="Search the directory and manage account status and roles."
        icon={Users}
      />

      <div className="card mb-6 p-4">
        <div className="grid gap-3 md:grid-cols-4">
          <SearchBar
            value={q}
            onChange={(value) => {
              setQ(value);
              setPage(1);
            }}
            placeholder="Search by name or email..."
            className="md:col-span-2"
          />
          <FilterSelect
            name="filter-role"
            label=""
            allLabel="All roles"
            value={role}
            onChange={(value) => {
              setRole(value);
              setPage(1);
            }}
            options={ROLE_OPTIONS}
          />
          <FilterSelect
            name="filter-account-status"
            label=""
            allLabel="All account statuses"
            value={accountStatus}
            onChange={(value) => {
              setAccountStatus(value);
              setPage(1);
            }}
            options={ACCOUNT_STATUS_OPTIONS}
          />
          <FilterSelect
            name="filter-approval-status"
            label=""
            allLabel="All approval statuses"
            value={approvalStatus}
            onChange={(value) => {
              setApprovalStatus(value);
              setPage(1);
            }}
            options={APPROVAL_STATUS_OPTIONS}
          />
        </div>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={data || []}
            loading={loading}
            rowKey={(row) => row._id || row.id}
            emptyTitle="No users found"
            emptyDescription="Try adjusting your search terms or clearing the filters."
          />
          <Pagination meta={meta} onChange={setPage} className="mt-6" />
        </>
      )}

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={`Update ${editing?.name || 'user'}`}
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setEditing(null)} disabled={saving}>
              Cancel
            </button>
            <button type="button" className="btn-primary" onClick={saveStatus} disabled={saving}>
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label" htmlFor="status-account">
              Account status
            </label>
            <Select
              id="status-account"
              value={form.accountStatus}
              onChange={(event) => setForm((prev) => ({ ...prev, accountStatus: event.target.value }))}
            >
              {ACCOUNT_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>

          {editing?.role !== 'admin' ? (
            <div>
              <label className="label" htmlFor="status-role">
                Role
              </label>
              <Select
                id="status-role"
                value={form.role}
                onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value }))}
              >
                {EDITABLE_ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
          ) : (
            <p className="rounded-xl bg-navy-50 p-3 text-sm text-navy-500">
              Roles for administrator accounts cannot be changed here.
            </p>
          )}

          <div>
            <label className="label" htmlFor="status-reason">
              Reason <span className="text-navy-400">(optional)</span>
            </label>
            <TextArea
              id="status-reason"
              value={form.reason}
              onChange={(event) => setForm((prev) => ({ ...prev, reason: event.target.value }))}
              rows={3}
              placeholder="Add a short note about this change"
              maxLength={500}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
