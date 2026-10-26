import { Link } from 'react-router-dom';
import {
  Award,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  Handshake,
  Send,
  Users,
} from 'lucide-react';
import { dashboardApi } from '../../api/endpoints';
import useFetch from '../../hooks/useFetch';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { useAuth } from '../../hooks/useAuth';
import { formatDate, formatCountdown, titleCase } from '../../utils/format';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import JobCard from '../../components/JobCard';
import EventCard from '../../components/EventCard';
import AnnouncementCard from '../../components/AnnouncementCard';
import ProfileCard from '../../components/ProfileCard';
import StatusBadge from '../../components/StatusBadge';
import LoadingState from '../../components/LoadingState';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';

/** Student landing dashboard with a summary of everything relevant. */
export default function StudentDashboard() {
  useDocumentTitle('Dashboard');
  const { user } = useAuth();
  const { data, loading, error, refetch } = useFetch(() => dashboardApi.student(), []);

  if (loading) return <LoadingState label="Loading your dashboard..." />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  const stats = data?.stats || {};
  const profile = data?.profile || {};

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user?.name?.split(' ')[0] || 'there'}`}
        description="Here is what is happening across your network today."
        actions={
          <Link to="/student/jobs" className="btn-primary btn-sm">
            <Briefcase className="h-4 w-4" aria-hidden="true" />
            Browse jobs
          </Link>
        }
      />

      {!profile?.department ? (
        <div className="mb-6 rounded-2xl border border-royal-200 bg-royal-50 p-4 text-sm text-royal-800">
          Complete your profile to get better job and mentor recommendations.{' '}
          <Link to="/student/profile" className="font-semibold underline">
            Update profile
          </Link>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Send} label="Applications" value={stats.totalApplications ?? 0} accent="royal" />
        <StatCard icon={Award} label="In progress" value={stats.pendingApplications ?? 0} accent="amber" />
        <StatCard icon={CheckCircle2} label="Accepted" value={stats.acceptedApplications ?? 0} accent="emerald" />
        <StatCard icon={Handshake} label="Mentorships" value={stats.mentorshipAccepted ?? 0} accent="accent" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="card p-6">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-base font-semibold text-navy-900">
                <Briefcase className="h-4 w-4 text-navy-400" aria-hidden="true" />
                Recommended jobs
              </h2>
              <Link to="/student/jobs" className="link text-sm">
                View all
              </Link>
            </div>
            <div className="mt-4 space-y-3">
              {data?.recentJobs?.length ? (
                data.recentJobs.map((job) => (
                  <div key={job._id} className="flex items-center justify-between gap-3 rounded-xl border border-navy-100 p-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-navy-900">{job.title}</p>
                      <p className="truncate text-xs text-navy-500">
                        {job.company} · {titleCase(job.workMode)} · {job.location || 'Flexible'}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-navy-400">
                      {job.applicationDeadline ? `Apply by ${formatDate(job.applicationDeadline)}` : ''}
                    </span>
                  </div>
                ))
              ) : (
                <EmptyState icon={Briefcase} title="No jobs yet" description="New openings will appear here." />
              )}
            </div>
          </section>

          <section className="card p-6">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-base font-semibold text-navy-900">
                <Send className="h-4 w-4 text-navy-400" aria-hidden="true" />
                Recent applications
              </h2>
              <Link to="/student/applications" className="link text-sm">
                View all
              </Link>
            </div>
            <div className="mt-4 space-y-3">
              {data?.recentApplications?.length ? (
                data.recentApplications.map((application) => (
                  <div key={application._id} className="flex items-center justify-between gap-3 rounded-xl border border-navy-100 p-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-navy-900">{application.job?.title || 'Job removed'}</p>
                      <p className="truncate text-xs text-navy-500">{application.job?.company || '—'}</p>
                    </div>
                    <StatusBadge status={application.applicationStatus} />
                  </div>
                ))
              ) : (
                <EmptyState icon={Send} title="No applications yet" description="Apply to a job to get started." />
              )}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="card p-6">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-base font-semibold text-navy-900">
                <Users className="h-4 w-4 text-navy-400" aria-hidden="true" />
                Recommended mentors
              </h2>
              <Link to="/student/mentorship" className="link text-sm">
                Find
              </Link>
            </div>
            <div className="mt-4 space-y-3">
              {data?.recommendedAlumni?.length ? (
                data.recommendedAlumni.map((alumnus) => (
                  <ProfileCard key={alumnus.userId} profile={alumnus} to={`/student/alumni/${alumnus.userId}`} />
                ))
              ) : (
                <EmptyState icon={Users} title="No mentors yet" description="Approved mentors will appear here." />
              )}
            </div>
          </section>

          <section className="card p-6">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-base font-semibold text-navy-900">
                <CalendarDays className="h-4 w-4 text-navy-400" aria-hidden="true" />
                Upcoming events
              </h2>
              <Link to="/student/events" className="link text-sm">
                View all
              </Link>
            </div>
            <div className="mt-4 space-y-3">
              {data?.upcomingEvents?.length ? (
                data.upcomingEvents.map((event) => (
                  <Link
                    key={event._id}
                    to={`/events/${event._id}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-navy-100 p-3 hover:border-royal-200"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-navy-900">{event.title}</p>
                      <p className="truncate text-xs text-navy-500">{formatDate(event.startDate)}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-accent-50 px-2 py-0.5 text-xs font-semibold text-accent-700">
                      {formatCountdown(event.startDate)}
                    </span>
                  </Link>
                ))
              ) : (
                <EmptyState icon={CalendarDays} title="No upcoming events" />
              )}
            </div>
          </section>

          {data?.announcements?.length ? (
            <section className="space-y-3">
              {data.announcements.map((announcement) => (
                <AnnouncementCard key={announcement._id} announcement={announcement} to={`/announcements/${announcement._id}`} />
              ))}
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
