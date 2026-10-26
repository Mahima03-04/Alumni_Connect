import { CalendarDays } from 'lucide-react';
import EventsList from '../../components/EventsList';

/** Public, crawlable events page shown to signed-out visitors. */
export default function PublicEventsPage() {
  return (
    <div>
      <section className="bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800">
        <div className="mx-auto max-w-6xl px-4 py-12 lg:py-16">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-accent-200">
            <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
            Events
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Workshops, webinars and reunions
          </h1>
          <p className="mt-3 max-w-2xl text-navy-100">
            Discover upcoming opportunities from the university and the alumni community. Sign in to register and reserve
            your seat.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-10">
        <EventsList
          title="Upcoming and past events"
          description="Browse every published event. Use the filters to narrow by type or mode."
          defaultUpcoming
        />
      </div>
    </div>
  );
}
