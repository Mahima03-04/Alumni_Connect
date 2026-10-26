import { Link } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Briefcase,
  CalendarDays,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  Send,
  UserCheck,
  Users,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { adminApi } from '../../api/endpoints';
import useFetch from '../../hooks/useFetch';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { formatRelativeTime } from '../../utils/format';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import LoadingState from '../../components/LoadingState';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';

const PIE_COLORS = ['#3f61f0', '#16a394', '#f59e0b', '#ef4444', '#8aa8d3', '#0f8378', '#9333ea'];

const QUICK_ACTIONS = [
  { to: '/admin/users', label: 'User management', icon: Users },
  { to: '/admin/jobs', label: 'All job posts', icon: Briefcase },
  { to: '/admin/events', label: 'Event management', icon: CalendarDays },
  { to: '/admin/reports', label: 'Reports', icon: BarChart3 },
];

/** Admin overview: platform counts, approval queues, charts and activity. */
export default function AdminDashboardPage() {
  useDocumentTitle('Admin dashboard');
  const { data, loading, error, refetch } = useFetch(() => adminApi.dashboard(), []);

  if (loading) return <LoadingState label="Loading the admin dashboard..." />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  const counts = data?.counts || {};
  const charts = data?.charts || {};
  const pendingAlumni = data?.pendingAlumni || [];
  const pendingJobs = data?.pendingJobs || [];
  const recentActivity = data?.recentActivity || [];

  const usersByDepartment = charts.usersByDepartment || [];
  const alumniByGraduationYear = charts.alumniByGraduationYear || [];
  const monthlyRegistrations = charts.monthlyRegistrations || [];
  const applicationStatus = Object.entries(charts.applicationStatus || {}).map(([name, value]) => ({
    name,
    value,
  }));

  return (
    <div>
      <PageHeader
        title="Admin dashboard"
        description="Monitor approvals, activity and platform health at a glance."
        icon={LayoutDashboard}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard icon={Users} label="Total users" value={counts.totalUsers ?? 0} accent="navy" />
        <StatCard icon={GraduationCap} label="Approved alumni" value={counts.totalAlumni ?? 0} accent="emerald" />
        <StatCard icon={UserCheck} label="Pending alumni" value={counts.pendingAlumni ?? 0} accent="amber" />
        <StatCard icon={ClipboardList} label="Pending jobs" value={counts.pendingJobs ?? 0} accent="royal" />
        <StatCard icon={Send} label="Applications" value={counts.totalApplications ?? 0} accent="accent" />
        <StatCard icon={CalendarDays} label="Active events" value={counts.activeEvents ?? 0} accent="royal" />
      </div>

      {(counts.pendingAlumni > 0 || counts.pendingJobs > 0) && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {counts.pendingAlumni > 0 ? (
            <Link
              to="/admin/alumni-approvals"
              className="card flex items-center gap-3 border-amber-200 bg-amber-50 p-4 transition hover:shadow-card-hover"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <AlertTriangle className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="font-semibold text-amber-900">
                  {counts.pendingAlumni} alumni approval{counts.pendingAlumni === 1 ? '' : 's'} pending
                </p>
                <p className="text-sm text-amber-700">Review new alumni registrations.</p>
              </div>
            </Link>
          ) : null}
          {counts.pendingJobs > 0 ? (
            <Link
              to="/admin/job-approvals"
              className="card flex items-center gap-3 border-royal-200 bg-royal-50 p-4 transition hover:shadow-card-hover"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-royal-100 text-royal-700">
                <AlertTriangle className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="font-semibold text-royal-900">
                  {counts.pendingJobs} job post{counts.pendingJobs === 1 ? '' : 's'} pending
                </p>
                <p className="text-sm text-royal-700">Review job posts before they go live.</p>
              </div>
            </Link>
          ) : null}
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="card p-6">
          <h2 className="text-base font-semibold text-navy-900">Users by department</h2>
          {usersByDepartment.length ? (
            <div className="mt-4">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={usersByDepartment}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e9f0" />
                  <XAxis dataKey="department" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="alumni" fill="#3f61f0" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="students" fill="#16a394" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="mt-4 text-sm text-navy-400">No data yet.</p>
          )}
        </section>

        <section className="card p-6">
          <h2 className="text-base font-semibold text-navy-900">Applications by status</h2>
          {applicationStatus.length ? (
            <div className="mt-4">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={applicationStatus} dataKey="value" nameKey="name" innerRadius={55} outerRadius={95} paddingAngle={2}>
                    {applicationStatus.map((entry, index) => (
                      <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="mt-4 text-sm text-navy-400">No data yet.</p>
          )}
        </section>

        <section className="card p-6">
          <h2 className="text-base font-semibold text-navy-900">Monthly registrations</h2>
          {monthlyRegistrations.length ? (
            <div className="mt-4">
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={monthlyRegistrations}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e9f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#2a44db" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="mt-4 text-sm text-navy-400">No data yet.</p>
          )}
        </section>

        <section className="card p-6">
          <h2 className="text-base font-semibold text-navy-900">Alumni by graduation year</h2>
          {alumniByGraduationYear.length ? (
            <div className="mt-4">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={alumniByGraduationYear}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e9f0" />
                  <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#16a394" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="mt-4 text-sm text-navy-400">No data yet.</p>
          )}
        </section>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="card p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-navy-900">Pending alumni</h2>
            <Link to="/admin/alumni-approvals" className="link text-sm">
              Review
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {pendingAlumni.length ? (
              pendingAlumni.slice(0, 6).map((user) => (
                <div
                  key={user._id || user.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-navy-100 p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-navy-900">{user.name}</p>
                    <p className="truncate text-xs text-navy-500">{user.email}</p>
                  </div>
                  <StatusBadge status="pending" />
                </div>
              ))
            ) : (
              <EmptyState icon={UserCheck} title="No pending alumni" description="New registrations will appear here." />
            )}
          </div>
        </section>

        <section className="card p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-navy-900">Pending jobs</h2>
            <Link to="/admin/job-approvals" className="link text-sm">
              Review
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {pendingJobs.length ? (
              pendingJobs.slice(0, 6).map((job) => (
                <div key={job._id || job.id} className="rounded-xl border border-navy-100 p-3">
                  <p className="truncate font-medium text-navy-900">{job.title}</p>
                  <p className="truncate text-xs text-navy-500">
                    {job.company}
                    {job.postedBy?.name ? ` · ${job.postedBy.name}` : ''}
                  </p>
                </div>
              ))
            ) : (
              <EmptyState icon={ClipboardList} title="No pending jobs" description="Posted jobs awaiting approval appear here." />
            )}
          </div>
        </section>

        <section className="card p-6">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-navy-400" aria-hidden="true" />
            <h2 className="text-base font-semibold text-navy-900">Recent activity</h2>
          </div>
          <div className="mt-4 space-y-3">
            {recentActivity.length ? (
              recentActivity.slice(0, 6).map((item) => (
                <div key={item._id} className="rounded-xl border border-navy-100 p-3">
                  <p className="text-sm text-navy-700">
                    <span className="font-semibold text-navy-900">{item.actorName}</span>{' '}
                    {item.description}
                  </p>
                  <p className="mt-0.5 text-xs text-navy-400">{formatRelativeTime(item.createdAt)}</p>
                </div>
              ))
            ) : (
              <EmptyState icon={Activity} title="No recent activity" />
            )}
          </div>
        </section>
      </div>

      <section className="mt-6">
        <h2 className="mb-3 text-base font-semibold text-navy-900">Quick actions</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.to}
              to={action.to}
              className="card flex items-center gap-3 p-4 transition hover:shadow-card-hover"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-700">
                <action.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="font-medium text-navy-900">{action.label}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
