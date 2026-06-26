Streamed API — Summary
Base
Base URL: https://streamed.pk
Format: JSON for data endpoints
Auth: none required
Rate limits: docs say none currently
Main resources:
matches
streams
sports
images
1) Sports API
Used to get the available sport categories.

Endpoint
GET /api/sports
Returns
Array of:

id → machine id like football, basketball
name → display label
Use
populate sport filters
build category pages
feed matches queries
2) Matches API
Used to fetch sports events.

Match object
id: string
title: string
category: string
date: number → Unix timestamp in milliseconds
poster?: string
popular: boolean
teams?
home?: { name, badge }
away?: { name, badge }
sources: Array<{ source, id }>
Endpoints
By sport
GET /api/matches/[SPORT]
GET /api/matches/[SPORT]/popular
All sports
GET /api/matches/all
GET /api/matches/all/popular
Today
GET /api/matches/all-today
GET /api/matches/all-today/popular
Live
GET /api/matches/live
GET /api/matches/live/popular
Important note
Each match includes a sources array.
That array is the bridge to the Streams API.

Example:

{
"sources": [
{ "source": "alpha", "id": "mu-liv-123" },
{ "source": "bravo", "id": "456-mu-liv" }
]
}
3) Streams API
Used to fetch stream entries for a specific source + match id.

Stream object
id: string
streamNo: number
language: string
hd: boolean
embedUrl: string
source: string
Supported source endpoints
GET /api/stream/alpha/[id]
GET /api/stream/bravo/[id]
GET /api/stream/charlie/[id]
GET /api/stream/delta/[id]
GET /api/stream/echo/[id]
GET /api/stream/foxtrot/[id]
GET /api/stream/golf/[id]
GET /api/stream/hotel/[id]
GET /api/stream/intel/[id]
How it works
Fetch a match from Matches API
Read match.sources[]
Pick one source entry
Call /api/stream/{source}/{id}
Receive an array of available streams
Each stream contains an embedUrl
Important note for dev
The docs present embedUrl as the playback/embed target.
So the system is basically:

event discovery via Matches API
source resolution via Streams API
playback via returned embed URL
4) Images API
Used for badges/posters.

Endpoints
Team badge:
GET /api/images/badge/[id].webp

Match poster:
GET /api/images/poster/[badge]/[badge].webp

Proxied image:
GET /api/images/proxy/[poster].webp

Notes
images are served in WebP
team.badge from match object is used for badge URLs
poster field from match object is also used in image handling
5) Practical Data Flow
This is the key thing your senior dev needs to understand.

Discovery flow
Get sports:
/api/sports
Get matches:
/api/matches/live
/api/matches/football
etc.
For each match:
read metadata
read poster/badges
read available sources
For each source:
request /api/stream/{source}/{id}
Get stream list:
choose stream by language / quality / streamNo
Use returned embedUrl
6) Useful Fields to Cache Internally
If a dev is wrapping this provider, the useful normalized fields are:

Match normalization
external_match_id
title
category
starts_at
poster_ref
popular
home_team_name
home_team_badge
away_team_name
away_team_badge
source_list
Stream normalization
external_stream_id
source_name
source_match_id
stream_number
language
hd
embed_url
7) MVP Integration Notes for a Dev
If someone is building a provider adapter around it, the likely internal flow is:

Provider sync layer
fetch sports list optionally
fetch match lists by category/live/today
store normalized event data
store available source references per event
Playback resolver layer
when event is requested, fetch streams using saved source+id
select preferred stream
return approved playback reference to app
Admin usefulness
Admin could see:

imported matches
available sources per match
stream language options
source health / availability
manual preferred-source override
8) Observed API Characteristics
From docs alone, notable traits are:

no auth
no declared rate limit
source-specific stream endpoints
multiple possible stream entries per source
embed URL returned directly
lightweight schema, simple to consume
date is in milliseconds, not seconds
9) What a Senior Developer Should Watch Out For
From a pure integration standpoint:

source availability may vary by event
one match can have multiple sources
one source can return multiple stream options
provider data may change frequently around live events
import/sync timing matters for live schedules
frontend should not depend directly on raw provider responses if building a controlled platform
backend normalization layer is recommended