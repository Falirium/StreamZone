import { getPlaybackSources, getActiveEvents } from './actions';
import { PlaybackClient } from './playback-client';

export const metadata = { title: 'Playback Sources — Admin' };

export default async function PlaybackPage() {
  const [sourcesResult, eventsResult] = await Promise.all([
    getPlaybackSources(),
    getActiveEvents(),
  ]);

  return (
    <PlaybackClient
      sources={sourcesResult.data || []}
      events={eventsResult.data || []}
    />
  );
}
