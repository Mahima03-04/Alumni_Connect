import { useState } from 'react';
import { BarChart3, Download, GraduationCap, ShieldCheck, UserCheck, Users, UsersRound, Ban, Clock } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { adminApi, downloadReportCsv } from '../../api/endpoints';
import useFetch from '../../hooks/useFetch';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { useToast } from '../../hooks/useToast';
import { titleCase } from '../../utils/format';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import FilterSelect from '../../components/FilterSelect';
import LoadingState from '../../components/LoadingState';
import ErrorState from '../../components/ErrorState';

const REPORT_TYPES = ['users', 'alumni', 'jobs', 'applications', 'mentorship', 'events'];
const ROLE_OPTIONS = ['student', 'alumni', 'admin'];
const COLORS = ['#1e3a8a', '#4338ca', '#0d9488', '#f59e0b', '#ef4444', '#6366f1', '#10b981', '#8b5cf6'];
const EMPTY_FILTERS = { from: '', to: '', role: '', department: '', graduationYear: '' };

/** Turn an object map such as { student: 10 } into chart data. */
function toChartData(map) {
  return Object.entries(map || {}).map(([name, value]) => ({ name: titleCase(name), value }));
}

function ChartCard({ title, empty, children }) {
  return (
    <div className="card p-5">
      <h2 className="mb-4 text-sm font-semibold text-navy-900">{title}</h2>
      {empty ? <p className="py-10 text-center text-sm text-navy-400">No data available.</p> : children}
    </div>
  );
}

function cleanFilters(filters) {
  const out = {};
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== '' && value !== null && value !== undefined) out[key] = value;
  });
  return out;
}

/** Admin analytics with summary cards, charts and CSV export. */
export default function ReportsPage() {
  useDocumentTitle('Reports');
  const toast = useToast();
  const [draft, setDraft] = useState(EMPTY_FILTERS);
  const [applied, setApplied] = useState(EMPTY_FILTERS);
  const [exportType, setExportType] = useState('users');
  const [exporting, setExporting] = useState(false);

  const { data, loading, error, refetch } = useFetch(
    () => adminApi.reports(cleanFilters(applied)),
    [applied]
  );

  const summary = data?.summary || {};
  const usersByRole = toChartData(data?.usersByRole);
  const applicationsByStatus = toChartData(data?.applicationsByStatus);
  const jobsByApproval = toChartData(data?.jobsByApproval);
  const mentorshipByStatus = toChartData(data?.mentorshipByStatus);
  const registrationsByEvent = (data?.registrationsByEvent || [])
    .map((entry) => ({ name: entry.event, value: entry.count }))
    .slice(0, 8);

  const exportCsv = async () => {
    setExporting(true);
    try {
      const filename = await downloadReportCsv({ type: exportType, ...cleanFilters(applied) });
      toast.success(`Exported ${filename}.`);
    } catch (err) {
      toast.error(err.friendlyMessage || 'Unable to export the report.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Platform analytics and downloadable data exports."
        icon={BarChart3}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <FilterSelect
              label=""
              allLabel={null}
              value={exportType}
              onChange={setExportType}
              options={REPORT_TYPES.map((type) => ({ value: type, label: titleCase(type) }))}
              className="w-40"
            />
            <button type="button" className="btn-primary btn-sm" onClick={exportCsv} disabled={exporting}>
              <Download className="h-4 w-4" aria-hidden="true" />
              {exporting ? 'Exporting...' : 'Export CSV'}
            </button>
          </div>
        }
      />

      <div className="card mb-6 p-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="label" htmlFor="from">
              From
            </label>
            <input
              id="from"
              type="date"
              className="input"
              value={draft.from}
              onChange={(event) => setDraft((prev) => ({ ...prev, from: event.target.value }))}
            />
          </div>
          <div>
            <label className="label" htmlFor="to">
              To
            </label>
            <input
              id="to"
              type="date"
              className="input"
              value={draft.to}
              onChange={(event) => setDraft((prev) => ({ ...prev, to: event.target.value }))}
            />
          </div>
          <FilterSelect
            label="Role"
            value={draft.role}
            onChange={(value) => setDraft((prev) => ({ ...prev, role: value }))}
            options={ROLE_OPTIONS.map((role) => ({ value: role, label: titleCase(role) }))}
          />
          <div>
            <label className="label" htmlFor="department">
              Department
            </label>
            <input
              id="department"
              type="text"
              className="input"
              placeholder="e.g. Computer Science"
              value={draft.department}
              onChange={(event) => setDraft((prev) => ({ ...prev, department: event.target.value }))}
            />
          </div>
          <div>
            <label className="label" htmlFor="graduationYear">
              Graduation year
            </label>
            <input
              id="graduationYear"
              type="number"
              className="input"
              placeholder="e.g. 2022"
              value={draft.graduationYear}
              onChange={(event) => setDraft((prev) => ({ ...prev, graduationYear: event.target.value }))}
            />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button type="button" className="btn-primary btn-sm" onClick={() => setApplied(draft)}>
            Apply filters
          </button>
          <button
            type="button"
            className="btn-secondary btn-sm"
            onClick={() => {
              setDraft(EMPTY_FILTERS);
              setApplied(EMPTY_FILTERS);
            }}
          >
            Reset
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingState label="Loading report data..." />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={Users} label="Total users" value={summary.total ?? 0} accent="navy" />
            <StatCard icon={GraduationCap} label="Students" value={summary.students ?? 0} accent="royal" />
            <StatCard icon={UsersRound} label="Alumni" value={summary.alumni ?? 0} accent="accent" />
            <StatCard icon={ShieldCheck} label="Admins" value={summary.admins ?? 0} accent="navy" />
            <StatCard icon={Clock} label="Pending approval" value={summary.pendingApproval ?? 0} accent="amber" />
            <StatCard icon={UserCheck} label="Active" value={summary.active ?? 0} accent="emerald" />
            <StatCard icon={Ban} label="Suspended" value={summary.suspended ?? 0} accent="red" />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <ChartCard title="Users by role" empty={!usersByRole.length}>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={usersByRole}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" name="Users" fill="#4338ca" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Applications by status" empty={!applicationsByStatus.length}>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={applicationsByStatus} dataKey="value" nameKey="name" outerRadius={90} label>
                    {applicationsByStatus.map((entry, index) => (
                      <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Jobs by approval" empty={!jobsByApproval.length}>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={jobsByApproval} dataKey="value" nameKey="name" outerRadius={90} label>
                    {jobsByApproval.map((entry, index) => (
                      <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Mentorship by status" empty={!mentorshipByStatus.length}>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={mentorshipByStatus} dataKey="value" nameKey="name" outerRadius={90} label>
                    {mentorshipByStatus.map((entry, index) => (
                      <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <ChartCard title="Event registrations (top 8)" empty={!registrationsByEvent.length}>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={registrationsByEvent}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={-20} textAnchor="end" height={70} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" name="Registrations" fill="#0d9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}
    </div>
  );
}
