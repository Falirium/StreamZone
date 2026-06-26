import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/user-auth';
import { StreamProvider, StreamEntry } from '@/lib/stream-provider';
import { PlayerClient } from './player-client';
import { WatchDrawer } from './watch-drawer';

export const metadata = { title: 'Watch Live — StreamZone' };

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function WatchPage({ params }: Props) {
  const { slug } = await params;
  const session = await getCurrentUser(); // Fetch session, do not throw for guests

  const isExternal = slug.startsWith('ext-');
  const externalId = isExternal ? slug.replace('ext-', '') : null;

  let eventTitle = '';
  let eventCategory = '';
  let authorized = false;

  // Streams to load
  let streamEntries: StreamEntry[] = [];

  if (isExternal) {
    // Check if user has ANY active entitlement
    if (session) {
      const activeEntitlement = await db.accessEntitlement.findFirst({
        where: {
          userId: session.userId,
          isActive: true,
          expiresAt: { gt: new Date() },
        },
      });

      if (activeEntitlement) {
        authorized = true;
      }
    }

    // Fetch match from provider to get sources
    const liveMatches = await StreamProvider.getAllMatches(); // Using all-today or live
    const match = liveMatches.find((m) => m.id === externalId);

    if (!match) {
      return <div className="p-12 text-center text-white/60">Match not found or no longer live.</div>;
    }

    eventTitle = match.title || (match.home ? `${match.home.name} vs ${match.away?.name}` : 'Live Match');
    eventCategory = match.category;

    // Fetch streams for the first available source (authorized or guest preview)
    if (match.sources.length > 0) {
      const topSource = match.sources[0];
      streamEntries = await StreamProvider.getStreams(topSource.source, topSource.id);
    }
  } else {
    // Internal mapped event
    const event = await db.event.findUnique({
      where: { slug },
      include: {
        playbackSources: {
          where: { isActive: true },
          orderBy: { priority: 'asc' },
        },
      },
    });

    if (!event) {
      return <div className="p-12 text-center text-white/60">Event not found.</div>;
    }

    eventTitle = event.title;
    eventCategory = event.category;

    // Check authorization
    if (session) {
      const activeEntitlement = await db.accessEntitlement.findFirst({
        where: {
          userId: session.userId,
          isActive: true,
          expiresAt: { gt: new Date() },
          OR: [
            { eventId: event.id },
            { eventId: null },
          ],
        },
      });

      if (activeEntitlement) {
        authorized = true;
      }
    }

    // Fetch streams from mapped sources (authorized or guest preview)
    if (event.playbackSources.length > 0) {
      // Try the highest priority source first
      for (const source of event.playbackSources) {
        const streams = await StreamProvider.getStreams(source.sourceProvider, source.sourceMatchId);
        if (streams.length > 0) {
          streamEntries = streams;
          break; // Got streams, stop trying lower priority sources
        }
      }
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <span className="text-xs font-bold uppercase tracking-wider text-brand-400 bg-brand-500/10 px-2.5 py-1 rounded-full border border-brand-500/20">
          {eventCategory}
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold mt-4">{eventTitle}</h1>
      </div>

      {streamEntries.length > 0 ? (
        <PlayerClient streams={streamEntries} isPreview={!authorized} />
      ) : (
        <div className="glass p-12 rounded-2xl border border-white/10 text-center">
          <p className="text-white/60 mb-2">The broadcast has not started yet or no sources are currently available.</p>
          <p className="text-sm text-white/40">Please refresh this page closer to the event start time.</p>
        </div>
      )}

      {!authorized && (
        <div className="mt-8">
          <WatchDrawer slug={slug} />
        </div>
      )}
    </div>
  );
}
