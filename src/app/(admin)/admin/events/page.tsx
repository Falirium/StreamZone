import { getEvents } from './actions';
import { EventsClient } from './events-client';

export const metadata = { title: 'Events — Admin' };

export default async function EventsPage() {
  const result = await getEvents();
  const events = (result.data || []).map((e) => ({
    ...e,
    startsAt: e.startsAt.toISOString(),
    endsAt: e.endsAt?.toISOString() ?? null,
  }));

  return <EventsClient events={events} />;
}
