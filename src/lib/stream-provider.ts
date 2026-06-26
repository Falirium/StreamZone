import { STREAMED_API_BASE } from './constants';

export interface StreamedMatch {
  id: string;
  title: string;
  category: string;
  date: number; // ms
  poster?: string;
  popular?: boolean;
  home?: { name: string; badge?: string };
  away?: { name: string; badge?: string };
  sources: Array<{ source: string; id: string }>;
}

export interface StreamEntry {
  id: string;
  streamNo: number;
  language: string;
  hd: boolean;
  embedUrl: string;
  source: string;
}

export const StreamProvider = {
  async getLiveMatches(): Promise<StreamedMatch[]> {
    try {
      const res = await fetch(`${STREAMED_API_BASE}/api/matches/live`, {
        cache: 'no-store', // Always fetch fresh live matches
      });
      if (!res.ok) throw new Error('Failed to fetch live matches');
      return await res.json();
    } catch (error) {
      console.error('[StreamProvider] getLiveMatches Error:', error);
      return [];
    }
  },

  async getAllMatches(): Promise<StreamedMatch[]> {
    try {
      const res = await fetch(`${STREAMED_API_BASE}/api/matches/all`, {
        cache: 'no-store', // Always fetch fresh list of all matches
      });
      if (!res.ok) throw new Error('Failed to fetch all matches');
      return await res.json();
    } catch (error) {
      console.error('[StreamProvider] getAllMatches Error:', error);
      return [];
    }
  },

  async getStreams(source: string, id: string): Promise<StreamEntry[]> {
    try {
      const res = await fetch(`${STREAMED_API_BASE}/api/stream/${source}/${id}`, {
        cache: 'no-store', // Always fresh for playback
      });
      if (!res.ok) throw new Error('Failed to fetch streams');
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error(`[StreamProvider] getStreams Error (${source}/${id}):`, error);
      return [];
    }
  },

  getProxyImageUrl(posterOrBadgeUrl: string): string {
    if (!posterOrBadgeUrl) return '';
    if (posterOrBadgeUrl.startsWith('http')) return posterOrBadgeUrl;
    if (posterOrBadgeUrl.startsWith('/')) {
      return `${STREAMED_API_BASE}${posterOrBadgeUrl}`;
    }
    return `${STREAMED_API_BASE}/api/images/proxy/${encodeURIComponent(posterOrBadgeUrl)}.webp`;
  },

  getBadgeUrl(badgeId: string): string {
    if (!badgeId) return '';
    if (badgeId.startsWith('http') || badgeId.startsWith('/')) {
      return this.getProxyImageUrl(badgeId);
    }
    return `${STREAMED_API_BASE}/api/images/badge/${badgeId}.webp`;
  }
};
