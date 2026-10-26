import { Link } from 'react-router-dom';
import { Award, Briefcase, Building2, GraduationCap, Handshake, ShieldCheck, Users } from 'lucide-react';
import useDocumentTitle from '../../hooks/useDocumentTitle';

const ROLE_CARDS = [
  {
    icon: GraduationCap,
    title: 'For students',
    points: [
      'Browse the alumni directory and find a mentor',
      'Apply to verified job openings with your resume',
      'Register for workshops, webinars and career fairs',
    ],
  },
  {
    icon: Award,
    title: 'For alumni',
    points: [
      'Post openings at your organisation for students',
      'Mentor the next generation and track requests',
      'Reconnect with batchmates and attend reunions',
    ],
  },
  {
    icon: ShieldCheck,
    title: 'For administrators',
    points: [
      'Approve alumni registrations and job posts',
      'Manage accounts, roles and announcements',
      'Export reports and monitor platform activity',
    ],
  },
];

const VALUES = [
  { icon: Users, title: 'Community first', text: 'A trusted space where every alumni account is verified.' },
  { icon: Handshake, title: 'Give back', text: 'Mentorship and referrals that turn networks into opportunities.' },
  { icon: Briefcase, title: 'Career growth', text: 'Real openings and guidance from people who have been there.' },
  { icon: Building2, title: 'Institutional memory', text: 'Departments, batches and companies captured for good.' },
];

/** Static about page describing the platform, roles and values. */
export default function AboutPage() {
  useDocumentTitle('About');
  return (
    <div>
      <section className="bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center">
          <h1 className="text-3xl font-bold text-white sm:text-4xl">About AlumniConnect</h1>
          <p className="mx-auto mt-4 max-w-2xl text-navy-100">
            AlumniConnect is a full-stack platform that connects a university&apos;s graduates, current students and
            administrators. It turns a scattered contact list into a living network for jobs, mentorship and events.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-2xl font-bold text-navy-900">Built for three roles</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {ROLE_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.title} className="card p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy-50 text-navy-700">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-lg font-semibold text-navy-900">{card.title}</h3>
                <ul className="mt-3 space-y-2 text-sm text-navy-600">
                  {card.points.map((point) => (
                    <li key={point} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-500" aria-hidden="true" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-2xl font-bold text-navy-900">What we value</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((value) => {
              const Icon = value.icon;
              return (
                <div key={value.title} className="rounded-2xl border border-navy-100 bg-surface-50 p-5">
                  <Icon className="h-6 w-6 text-accent-600" aria-hidden="true" />
                  <h3 className="mt-3 font-semibold text-navy-900">{value.title}</h3>
                  <p className="mt-1 text-sm text-navy-500">{value.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-navy-900">Join the network</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-navy-500">
          Whether you are graduating this year or twenty years ago, there is a place for you here.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link to="/register" className="btn-primary">
            Create an account
          </Link>
          <Link to="/events" className="btn-secondary">
            See upcoming events
          </Link>
        </div>
      </section>
    </div>
  );
}
