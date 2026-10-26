import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Briefcase,
  CalendarDays,
  GraduationCap,
  Handshake,
  Quote,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { publicApi } from '../../api/endpoints';
import useFetch from '../../hooks/useFetch';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import Avatar from '../../components/Avatar';
import { CardSkeletonGrid } from '../../components/LoadingState';

const FEATURES = [
  {
    icon: Users,
    title: 'Alumni directory',
    description: 'Discover graduates by department, batch, company and skills, and reconnect with your network.',
  },
  {
    icon: Briefcase,
    title: 'Job board',
    description: 'Alumni post verified openings and students apply with a single click using their saved resume.',
  },
  {
    icon: Handshake,
    title: 'Mentorship',
    description: 'Request a mentor, agree a plan and track every mentorship from request through to completion.',
  },
  {
    icon: CalendarDays,
    title: 'Events',
    description: 'Workshops, webinars and reunions with capacity tracking and registration built in.',
  },
  {
    icon: ShieldCheck,
    title: 'Verified alumni',
    description: 'Every alumni account is reviewed by an administrator before it can post or mentor.',
  },
  {
    icon: Sparkles,
    title: 'Notifications',
    description: 'Stay up to date with applications, approvals, mentorship replies and announcements.',
  },
];

function StatBlock({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center backdrop-blur">
      <p className="text-3xl font-bold text-white">{value ?? '-'}</p>
      <p className="mt-1 text-xs font-medium uppercase tracking-wide text-navy-200">{label}</p>
    </div>
  );
}

/** Public landing page built from real platform statistics and demo content. */
export default function LandingPage() {
  useDocumentTitle('Home');
  const stats = useFetch(() => publicApi.stats(), []);
  const alumni = useFetch(() => publicApi.alumniPreview({ limit: 6 }), []);
  const testimonials = useFetch(() => publicApi.testimonials(), []);

  const s = stats.data || {};

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 lg:grid-cols-2 lg:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-accent-200">
              <GraduationCap className="h-3.5 w-3.5" aria-hidden="true" />
              Connecting Graduates. Empowering Students.
            </span>
            <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
              Your alumni network,
              <span className="text-accent-300"> all in one place.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-navy-100">
              AlumniConnect brings together graduates, final-year students and university administrators for jobs,
              mentorship and events that build lasting careers.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/register" className="btn-accent">
                Get started free
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link to="/events" className="btn border border-white/20 bg-white/5 text-white hover:bg-white/10">
                Browse events
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatBlock label="Verified alumni" value={s.alumni} />
            <StatBlock label="Students" value={s.students} />
            <StatBlock label="Open jobs" value={s.openJobs} />
            <StatBlock label="Upcoming events" value={s.upcomingEvents} />
            <StatBlock label="Applications" value={s.applications} />
            <StatBlock label="Companies" value={s.companies} />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-navy-900 sm:text-3xl">Everything a thriving network needs</h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-navy-500">
            Purpose built tools for students, alumni and administrators, with roles and permissions enforced on the
            server.
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className="card p-5">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy-50 text-navy-700">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 font-semibold text-navy-900">{feature.title}</h3>
                <p className="mt-1 text-sm text-navy-500">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Alumni preview */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-navy-900">Meet our alumni</h2>
              <p className="mt-1 text-sm text-navy-500">A preview of approved alumni in the network.</p>
            </div>
            <Link to="/login" className="link text-sm">
              Sign in to see everyone
            </Link>
          </div>

          <div className="mt-8">
            {alumni.loading ? (
              <CardSkeletonGrid count={3} />
            ) : alumni.data?.length ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {alumni.data.map((person) => (
                  <div key={person.userId} className="card p-5">
                    <div className="flex items-center gap-3">
                      <Avatar src={person.profilePhoto} name={person.name} size="md" />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-navy-900">{person.name}</p>
                        <p className="truncate text-sm text-navy-500">{person.jobTitle || 'Alumnus'}</p>
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-navy-600">
                      {person.currentCompany || '—'}
                      {person.department ? ` · ${person.department}` : ''}
                    </p>
                    {person.skills?.length ? (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {person.skills.map((skill) => (
                          <span key={skill} className="rounded-full bg-royal-50 px-2.5 py-1 text-xs font-medium text-royal-700">
                            {skill}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-navy-500">No alumni to display yet.</p>
            )}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-navy-900">What people say</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-navy-500">
            Illustrative testimonials included with the demonstration data.
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {(testimonials.data || []).map((item) => (
            <figure key={item.id} className="card p-6">
              <Quote className="h-6 w-6 text-accent-500" aria-hidden="true" />
              <blockquote className="mt-3 text-sm text-navy-700">{item.quote}</blockquote>
              <figcaption className="mt-4">
                <p className="font-semibold text-navy-900">{item.name}</p>
                <p className="text-xs text-navy-400">{item.role}</p>
                {item.isDemo ? <p className="mt-1 text-[11px] italic text-navy-300">Demo testimonial</p> : null}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="rounded-3xl bg-gradient-to-r from-navy-800 to-royal-700 px-8 py-12 text-center">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">Ready to reconnect?</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-navy-100">
            Create your free account and start networking with alumni, students and mentors today.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/register" className="btn-accent">
              Create your account
            </Link>
            <Link to="/login" className="btn border border-white/20 bg-white/5 text-white hover:bg-white/10">
              Sign in
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
