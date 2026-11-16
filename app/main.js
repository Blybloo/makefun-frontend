// A make.fun frontend: the board of open bounties, a page for each bounty, its
// leaderboard, and an account's public profile, on hash routes.
//
//   #/                              the board
//   #/bounty/<slug>                 one bounty
//   #/bounty/<slug>/leaderboard     that bounty's leaderboard
//   #/profile/<handle>              an account's public profile
//
// The header and footer never re-render: only #view swaps. Each view is a
// separate module, loaded by a literal import() the first time its route is
// visited, so the first load stays small. window.__shotReady is false while a
// route loads and true once its data is on screen, so a screenshot script
// knows when to capture. A 30 s ticker refreshes only the time-left text in
// place, never the whole page.

import { getBounties, getBounty, getLeaderboard, getProfile, apiStats } from './api.js';
import { timeLeft } from './format.js';

// errorView lives in views/common.js and is loaded only when a route fails, so
// the first load stays small: the happy path never fetches it.

const view = document.getElementById('view');
const apiStatsEl = document.getElementById('api-stats');

/** The footer line: how many API requests this session made, and how many were served from the cache. */
function refreshApiStats() {
  if (!apiStatsEl) return;
  const s = apiStats();
  apiStatsEl.textContent = `${s.requests} request${s.requests === 1 ? '' : 's'} · ${s.cacheHits} served from cache`;
}

/** The live countdowns: update only the time-left text, in place. */
function tickCountdowns() {
  view.querySelectorAll('[data-deadline]').forEach((el) => {
    el.textContent = timeLeft(el.getAttribute('data-deadline'));
  });
}
setInterval(tickCountdowns, 30_000);

function parseRoute() {
  const raw = location.hash || '#/';
  const [pathPart, queryPart] = raw.slice(1).split('?');
  const parts = pathPart.split('/').filter(Boolean);
  const query = new URLSearchParams(queryPart ?? '');
  return { parts, query };
}

let renderSeq = 0;

async function render() {
  const seq = ++renderSeq;
  window.__shotReady = false;
  const { parts, query } = parseRoute();
  view.innerHTML = '<p class="loading">Loading…</p>';
  try {
    if (parts.length === 0) {
      const data = await getBounties();
      if (seq !== renderSeq) return;
      const { renderBoard, bindBoard } = await import('./views/board.js');
      if (seq !== renderSeq) return;
      document.title = 'make.fun bounties';
      view.innerHTML = renderBoard(data);
      bindBoard(view);
    } else if (parts[0] === 'bounty' && parts[1] && parts[2] === 'leaderboard') {
      const slug = decodeURIComponent(parts[1]);
      const lbView = query.get('view') === 'overall' ? 'overall' : 'performance';
      const data = await getLeaderboard(slug, lbView);
      if (seq !== renderSeq) return;
      const { renderLeaderboard, bindLeaderboard } = await import('./views/leaderboard.js');
      if (seq !== renderSeq) return;
      document.title = `${data.competition?.title ?? slug} — leaderboard | make.fun bounties`;
      view.innerHTML = renderLeaderboard(data, slug, lbView);
      bindLeaderboard(view);
    } else if (parts[0] === 'bounty' && parts[1]) {
      const slug = decodeURIComponent(parts[1]);
      const data = await getBounty(slug);
      if (seq !== renderSeq) return;
      const { renderBounty } = await import('./views/bounty.js');
      if (seq !== renderSeq) return;
      document.title = `${data.title} | make.fun bounties`;
      view.innerHTML = renderBounty(data);
    } else if (parts[0] === 'profile' && parts[1]) {
      const handle = decodeURIComponent(parts[1]);
      const data = await getProfile(handle);
      if (seq !== renderSeq) return;
      const { renderProfile } = await import('./views/profile.js');
      if (seq !== renderSeq) return;
      document.title = `@${data.handle} | make.fun bounties`;
      view.innerHTML = renderProfile(data);
    } else {
      const { errorView } = await import('./views/common.js');
      if (seq !== renderSeq) return;
      view.innerHTML = errorView('Unknown page. Go back to the board.');
    }
  } catch (err) {
    if (seq !== renderSeq) return;
    document.title = 'make.fun bounties';
    const { errorView } = await import('./views/common.js');
    view.innerHTML = errorView(err instanceof Error ? err.message : String(err));
  }
  window.scrollTo(0, 0);
  refreshApiStats();
  window.__shotReady = true;
}

const search = document.getElementById('profile-search');
search?.addEventListener('submit', (event) => {
  event.preventDefault();
  const handle = new FormData(search).get('handle');
  const h = String(handle ?? '').trim().replace(/^@/, '');
  if (h) location.hash = `#/profile/${encodeURIComponent(h)}`;
});

view.addEventListener('click', (event) => {
  const retry = event.target.closest('[data-action="retry"]');
  if (retry) render();
});

window.addEventListener('hashchange', render);
render();
