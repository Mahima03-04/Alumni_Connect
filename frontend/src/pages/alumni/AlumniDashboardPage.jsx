import { Link } from 'react-router-dom';
import { Award, Briefcase, CalendarDays, CheckCircle2, Handshake, Send, Users } from 'lucide-react';
import { dashboardApi } from '../../api/endpoints';
import useFetch from '../../hooks/useFetch';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { useAuth } from '../../hooks/useAuth';
import { formatCountdown, formatDate, titleCase } from '../../utils/format';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import AnnouncementCard from '../../components/AnnouncementCard';
import LoadingState from '../../components/LoadingState';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';

/** Alumni landing dashboard: jobs, applications, mentorship and events. */
export default function AlumniDashboardPage() {
  useDocumentTitle('Dashboard');
  const { user } = useAuth();
  const { data, loading, error, refetch } = useFetch(() => dashboardApi.alumni(), []);

  if (loading) return <LoadingState label="Loading your dashboard..." />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  const stats = data?.stats || {};

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${(user?.name || 'Alumnus').split(' ')[0]}`}
        description="Here is what is happening across your job posts, mentoring and events."
        actions={
          <a href="/alumni/jobs/new" className="btn-primary btn-sm">
            Post a job
          </a>
        }
      />

      {(stats.profileCompletion ?? 0) < 80 ? (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Your profile is {stats.profileCompletion ?? 0}% complete. A fuller profile helps students find and trust you.{' '}
          <a href="/alumni/profile" className="font-semibold underline">
            Complete profile
          </a>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Briefcase} label="Job posts" value={stats.totalJobs ?? 0} accent="royal" />
        <StatCard icon={Briefcase} label="Live jobs" value={stats.publishedJobs ?? 0} accent="emerald" hint={`${stats.pendingJobs ?? 0} pending approval`} />
        <StatCard icon={Send} label="Applications" value={stats.totalApplications ?? 0} accent="accent" hint={`${stats.newApplications ?? 0} new`} />
        <StatCard icon={Handshake} label="Mentorship" value={stats.mentorshipAccepted ?? 0} accent="amber" hint={`${stats.mentorshipPending ?? 0} pending`} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="card p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-navy-900">My job posts</h2>
              <a href="/alumni/jobs" className="link text-sm">
                Manage
              </a>
            </div>
            <div className="mt-4 space-y-3">
              {data?.myJobs?.length ? (
                data.myJobs.map((job) => (
                  <div key={job._id} className="flex items-center justify-between gap-3 rounded-xl border border-navy-100 p-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-navy-900">{job.title}</p>
                      <p className="truncate text-xs text-navy-500">{job.company}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-xs text-navy-400">{formatDate(job.createdAt)}</span>
                      <span className="text-xs font-semibold text-navy-600">{job.approvalStatus === 'approved' ? job.jobStatus : job.approvalStatus}</span>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState icon={Briefcase} title="No jobs posted yet" description="Share an opening with the community." />
              )}
            </div>
          </section>

          <section className="card p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-navy-900">Recent applications</h2>
              <a href="/alumni/applications" className="link text-sm">
                View all
              </a>
            </div>
            <div className="mt-4 space-y-3">
              {data?.recentApplications?.length ? (
                data.recentApplications.map((application) => (
                  <div key={application._id} className="flex items-center justify-between gap-3 rounded-xl border border-navy-100 p-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-navy-900">{application.student?.name || application.applicantName}</p>
                      <p className="truncate text-xs text-navy-500">{application.job?.title || 'Job'}</p>
                    </div>
                    <span className="shrink-0 text-xs font-semibold text-navy-600">{application.applicationStatus}</span>
                  </div>
                ))
              ) : (
                <EmptyState icon={Send} title="No applications yet" description="Applications to your jobs will appear here." />
              )}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="card p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-navy-900">Mentorship requests</h2>
              <a href="/alumni/mentorship" className="link text-sm">
                Review
              </a>
            </div>
            <div className="mt-4 space-y-3">
              {data?.recentMentorship?.length ? (
                data.recentMentorship.map((request) => (
                  <div key={request._id} className="rounded-xl border border-navy-100 p-3">
                    <p className="truncate font-medium text-navy-900">{request.student?.name || 'Student'}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-navy-500">{request.careerGoal}</p>
                  </div>
                ))
              ) : (
                <EmptyState icon={Handshake} title="No requests" />
              )}
            </div>
          </section>

          <section className="card p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-navy-900">Upcoming events</h2>
              <a href="/alumni/events" className="link text-sm">
                View all
              </a>
            </div>
            <div className="mt-4 space-y-3">
              {data?.upcomingEvents?.length ? (
                data.upcomingEvents.map((event) => (
                  <a key={event._id} href={`/events/${event._id}`} className="block rounded-xl border border-navy-100 p-3 hover:border-royal-200">
                    <p className="truncate font-medium text-navy-900">{event.title}</p>
                    <p className="truncate text-xs text-navy-500">
                      {formatDate(event.startDate)} · {formatCountdown(event.startDate)}
                    </p>
                  </a>
                ))
              ) : (
                <EmptyState icon={CalendarDays} title="No events" />
              )}
            </div>
          </section>

          {data?.announcements?.length ? (
            <section className="space-y-3">
              {data.announcements.map((announcement) => (
                <div key={announcement._id} className="card p-4">
                  <p className="font-medium text-navy-900">{announcement.title}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-navy-500">{announcement.body}</p>
                </div>
              ))}
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
