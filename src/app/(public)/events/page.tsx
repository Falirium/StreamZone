import { db } from '@/lib/db';
import { StreamProvider } from '@/lib/stream-provider';
import Link from 'next/link';
import { StatusBadge } from '@/components/ui/status-badge';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Live Events — StreamZone' };

export default async function EventsPage() {
  const [internalEvents, externalMatches, allExternalMatches] = await Promise.all([
    db.event.findMany({
      where: { isActive: true },
      orderBy: { startsAt: 'asc' },
    }),
    StreamProvider.getLiveMatches(),
    StreamProvider.getAllMatches(),
  ]);

  // Extract external match IDs already mapped in internal events
  // This avoids showing duplicates if an admin explicitly curated an external match
  const mappedExternalIds = new Set<string>();
  const playbackSources = await db.playbackSource.findMany({
    where: { isActive: true },
    select: { matchId: true },
  });
  playbackSources.forEach(s => mappedExternalIds.add(s.matchId));

  const FOOTBALL_ONLY = true;
  const now = new Date();
  const nowTime = now.getTime();
  const twoAndHalfHours = 2.5 * 60 * 60 * 1000;
  const fifteenMinutes = 15 * 60 * 1000;

  // Filter out non-football matches if FOOTBALL_ONLY is active
  const filterFootball = (m: any) => {
    if (!FOOTBALL_ONLY) return true;
    return m.category?.toLowerCase() === 'football';
  };

  const footballLive = externalMatches.filter(filterFootball);
  const footballAll = allExternalMatches.filter(filterFootball);

  // Combine both sources to have a unique list of football matches
  const uniqueFootballMatches = Array.from(
    new Map([...footballAll, ...footballLive].map(m => [m.id, m])).values()
  );

  const liveMatchIds = new Set(footballLive.map(m => m.id));

  // A match is live if the API says so, or if it started up to 2.5 hours ago, or starts in the next 15 mins
  const isMatchLive = (m: any) => {
    return liveMatchIds.has(m.id) || (m.date >= nowTime - twoAndHalfHours && m.date <= nowTime + fifteenMinutes);
  };

  const filteredExternalMatches = uniqueFootballMatches.filter(m => {
    if (mappedExternalIds.has(m.id)) return false;
    return isMatchLive(m);
  });

  const upcomingExternalMatches = uniqueFootballMatches.filter(m => {
    if (mappedExternalIds.has(m.id)) return false;
    if (isMatchLive(m)) return false;
    // Must be in the future (more than 15 minutes away)
    return m.date > nowTime + fifteenMinutes;
  });

  // Helper to get formatted day label relative to current time
  const getDayLabel = (dateMs: number) => {
    const matchDate = new Date(dateMs);
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);
    
    const diffTime = matchDate.getTime() - todayMidnight.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Tomorrow';
    } else {
      return matchDate.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      });
    }
  };

  // Group upcoming matches by day
  const groupedUpcomingMatches: { [key: string]: typeof upcomingExternalMatches } = {};
  upcomingExternalMatches.forEach(match => {
    const dayLabel = getDayLabel(match.date);
    if (!groupedUpcomingMatches[dayLabel]) {
      groupedUpcomingMatches[dayLabel] = [];
    }
    groupedUpcomingMatches[dayLabel].push(match);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold mb-4">Live & Upcoming Events</h1>
        <p className="text-white/60 max-w-2xl mx-auto">
          Catch the biggest games live. Access premium curated events or watch any currently streaming match.
        </p>
      </div>

      <div className="space-y-12">
        {/* Internal Curated Events */}
        {internalEvents.length > 0 && (
          <section>
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
              <span className="text-brand-400">★</span> Featured Events
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {internalEvents.map(event => {
                const isLive = new Date(event.startsAt) <= now && (!event.endsAt || new Date(event.endsAt) > now);
                return (
                  <Link href={`/watch/${event.slug}`} key={event.id} className="group glass rounded-2xl overflow-hidden border border-white/5 hover:border-brand-500/30 transition-all hover:shadow-lg hover:shadow-brand-500/10">
                    <div className="aspect-video bg-surface-900 relative">
                      {event.posterUrl ? (
                        <img src={event.posterUrl} alt={event.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-900/40 to-surface-900">
                          <span className="text-4xl">🏆</span>
                        </div>
                      )}
                      <div className="absolute top-4 right-4">
                        {isLive ? (
                          <span className="px-2.5 py-1 rounded bg-red-500 text-white text-xs font-bold animate-pulse">LIVE</span>
                        ) : (
                          <StatusBadge variant="neutral">Upcoming</StatusBadge>
                        )}
                      </div>
                    </div>
                    <div className="p-5">
                      <p className="text-brand-400 text-xs font-medium mb-1 uppercase tracking-wider">{event.category}</p>
                      <h3 className="font-bold text-lg mb-2 line-clamp-2">{event.title}</h3>
                      <p className="text-white/50 text-sm">
                        {new Date(event.startsAt).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* External Live Matches */}
        {filteredExternalMatches.length > 0 && (
          <section>
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
              <span className="text-red-400">●</span> Streaming Right Now
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredExternalMatches.map(match => (
                <Link href={`/watch/ext-${match.id}`} key={match.id} className="group glass rounded-2xl overflow-hidden border border-white/5 hover:border-brand-500/30 transition-all hover:shadow-lg hover:shadow-brand-500/10 flex flex-col">
                  
                  {/* Aspect Ratio Container for Poster/Thumbnail */}
                  <div className="aspect-video bg-surface-900 relative border-b border-white/5">
                    {match.poster ? (
                      <img src={StreamProvider.getProxyImageUrl(match.poster)} alt={match.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-surface-800 to-surface-900">
                        <span className="text-4xl opacity-20">⚽</span>
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      <span className="px-2 py-1 rounded bg-red-500 text-white text-[10px] font-bold animate-pulse">LIVE</span>
                    </div>
                  </div>

                  <div className="p-4 flex flex-col flex-1">
                    <span className="text-xs font-medium text-white/40 uppercase mb-3">{match.category}</span>
                    
                    {match.home && match.away ? (
                      <div className="flex-1 flex flex-col justify-center space-y-3">
                        <div className="flex items-center gap-3">
                          {match.home.badge && <img src={StreamProvider.getBadgeUrl(match.home.badge)} alt="" className="w-6 h-6 object-contain" />}
                          <span className="font-semibold text-sm line-clamp-1">{match.home.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          {match.away.badge && <img src={StreamProvider.getBadgeUrl(match.away.badge)} alt="" className="w-6 h-6 object-contain" />}
                          <span className="font-semibold text-sm line-clamp-1">{match.away.name}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 flex items-center">
                        <h3 className="font-semibold text-sm line-clamp-2">{match.title}</h3>
                      </div>
                    )}
                    
                    <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
                      <span className="text-xs text-brand-400 font-medium group-hover:text-brand-300 transition-colors">Watch Now →</span>
                      <span className="text-xs text-white/30">{match.sources.length} sources</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Upcoming External Matches Grouped by Day */}
        {Object.keys(groupedUpcomingMatches).length > 0 && (
          <section>
            <h2 className="text-2xl font-semibold mb-8 flex items-center gap-2">
              <span className="text-brand-400">🕒</span> Upcoming Matches
            </h2>
            <div className="space-y-10">
              {Object.entries(groupedUpcomingMatches).map(([dayLabel, matches]) => (
                <div key={dayLabel} className="space-y-4">
                  <h3 className="text-lg font-medium text-white/50 border-b border-white/5 pb-2 mb-4">
                    {dayLabel}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {matches.map(match => (
                      <div key={match.id} className="group glass opacity-85 rounded-2xl overflow-hidden border border-white/5 flex flex-col grayscale-[15%] hover:grayscale-0 hover:opacity-100 hover:border-brand-500/20 transition-all">
                        
                        {/* Aspect Ratio Container for Poster/Thumbnail */}
                        <div className="aspect-video bg-surface-900 relative border-b border-white/5">
                          {match.poster ? (
                            <img src={StreamProvider.getProxyImageUrl(match.poster)} alt={match.title} className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-surface-800 to-surface-900">
                              <span className="text-4xl opacity-20">⚽</span>
                            </div>
                          )}
                          <div className="absolute top-3 right-3">
                            <StatusBadge variant="neutral">Upcoming</StatusBadge>
                          </div>
                        </div>

                        <div className="p-4 flex flex-col flex-1">
                          <span className="text-xs font-medium text-white/40 uppercase mb-3">{match.category}</span>
                          
                          {match.home && match.away ? (
                            <div className="flex-1 flex flex-col justify-center space-y-3">
                              <div className="flex items-center gap-3">
                                {match.home.badge && <img src={StreamProvider.getBadgeUrl(match.home.badge)} alt="" className="w-6 h-6 object-contain" />}
                                <span className="font-semibold text-sm line-clamp-1">{match.home.name}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                {match.away.badge && <img src={StreamProvider.getBadgeUrl(match.away.badge)} alt="" className="w-6 h-6 object-contain" />}
                                <span className="font-semibold text-sm line-clamp-1">{match.away.name}</span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex-1 flex items-center">
                              <h3 className="font-semibold text-sm line-clamp-2">{match.title}</h3>
                            </div>
                          )}
                          
                          <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
                            <span className="text-xs text-white/60">
                              {new Date(match.date).toLocaleString(undefined, { hour: 'numeric', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {internalEvents.length === 0 && filteredExternalMatches.length === 0 && upcomingExternalMatches.length === 0 && (
          <div className="text-center py-20 glass rounded-3xl border border-white/5">
            <span className="text-6xl mb-6 block opacity-20">⚽</span>
            <h2 className="text-2xl font-bold mb-2">No Live Matches Found</h2>
            <p className="text-white/50 max-w-md mx-auto">
              There are currently no live or upcoming World Cup matches. Please check back later!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
