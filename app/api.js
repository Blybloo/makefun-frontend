// make.fun's public API: read-only GET requests, open to any origin (CORS).
// The full API is described at https://make.fun/api/openapi.json.
//
// Answers are cached in memory and revalidated with ETags: the API binds an
// ETag to the minute, so an If-None-Match inside the same minute answers 304
// and costs no body. A fresh answer (under 60 s old) is served without any
// request at all. apiStats() reports the counts for the footer.

const API = 'https://make.fun/api';
const FRESH_MS = 60_000;

const cache = new Map();
const inFlight = new Map();
const stats = { requests: 0, cacheHits: 0, bytesFetched: 0 };

export function apiStats() {
  return { ...stats, cached: cache.size };
}

/** One GET, cached and ETag-revalidated. Throws on a non-2xx/304 answer.
 * Concurrent calls for the same path share one request. */
export async function apiGet(path) {
  const hit = cache.get(path);
  if (hit && Date.now() - hit.fetchedAt < FRESH_MS) {
    stats.cacheHits += 1;
    return hit.body;
  }
  const pending = inFlight.get(path);
  if (pending) return pending;
  const task = fetchFresh(path, hit);
  inFlight.set(path, task);
  try {
    return await task;
  } finally {
    inFlight.delete(path);
  }
}

async function fetchFresh(path, hit) {
  const headers = {};
  if (hit?.etag) headers['If-None-Match'] = hit.etag;
  stats.requests += 1;
  const res = await fetch(API + path, { headers });
  if (res.status === 304 && hit) {
    stats.cacheHits += 1;
    hit.fetchedAt = Date.now();
    return hit.body;
  }
  if (!res.ok) throw new Error(`make.fun API ${res.status} for ${path}`);
  const body = await res.json();
  const etag = res.headers.get('ETag');
  cache.set(path, { etag, body, fetchedAt: Date.now() });
  stats.bytesFetched += JSON.stringify(body).length;
  return body;
}

/** The open bounties: { items: [...] }. activity=times leaves out the activity a board does not show. */
export const getBounties = () => apiGet('/competitions?status=open&activity=times');

/** One bounty, by its slug. */
export const getBounty = (slug) => apiGet(`/competitions/${encodeURIComponent(slug)}`);

/** A bounty's leaderboard. view is 'performance' (default) or 'overall'. */
export const getLeaderboard = (slug, view = 'performance') =>
  apiGet(`/competitions/${encodeURIComponent(slug)}/leaderboard${view === 'overall' ? '?view=overall' : ''}`);

/** An account's public profile, by its handle. */
export const getProfile = (handle) => apiGet(`/profiles/${encodeURIComponent(handle)}`);
