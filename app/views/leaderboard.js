// A bounty's leaderboard: ranked entries with their judge win rate, interval
// and dossier size, paginated 25 a page. Paging swaps only the table and the
// pager — the rest of the page stays put.

import { esc, pct, bytes } from '../format.js';
import { avatarImg, paginate, pagerHtml } from './common.js';

const PER_PAGE = 25;
let lbEntries = [];
let lbPage = 1;
let lbSlug = '';
let lbView = 'performance';
let lbPhase = '';

function rowsHtml(rows) {
  return rows
    .map(
      (e) => `<tr>
        <td class="num"><strong>${esc(e.rank)}</strong></td>
        <td class="entrant">${avatarImg(e.image, e.handle)}<a href="#/profile/${encodeURIComponent(e.handle)}">${esc(e.handle)}</a>${e.house ? ' · house' : ''}</td>
        <td>${esc(e.title || 'Untitled entry')}</td>
        <td class="num">${pct(e.values?.judge)}</td>
        <td class="num">${pct(e.values?.judge_low)} – ${pct(e.values?.judge_high)}</td>
        <td class="num">${bytes(e.values?.bytes)}</td>
        <td>${esc(e.status ?? '')}</td>
      </tr>`,
    )
    .join('');
}

function tableHtml() {
  const { page, pages, rows } = paginate(lbEntries, lbPage, PER_PAGE);
  lbPage = page;
  return `<div class="table-wrap"><table>
    <thead><tr><th class="num">#</th><th>Entrant</th><th>Entry</th><th class="num">Win rate</th><th class="num">90% interval</th><th class="num">Size</th><th>Status</th></tr></thead>
    <tbody>${rowsHtml(rows)}</tbody></table></div>
    ${pagerHtml(page, pages, `${lbEntries.length.toLocaleString('en-US')} entries`)}`;
}

export function renderLeaderboard(data, slug, view) {
  lbSlug = slug;
  lbView = view;
  lbEntries = data.entries ?? [];
  lbPage = 1;
  lbPhase = data.phase?.title ?? '';
  const comp = data.competition ?? {};
  return `<p><a href="#/">← All bounties</a> · <a href="#/bounty/${encodeURIComponent(slug)}">${esc(comp.title ?? slug)} →</a></p>
  <h1>${esc(comp.title ?? slug)} — leaderboard</h1>
  <p class="lede">${esc(lbPhase)} · ${data.metrics_withheld ? 'metrics withheld while judging runs' : 'live scores'} · ranked by ${esc(data.rank_key ?? 'judge')} win rate, ties by smaller dossier.</p>
  <div class="toolbar">
    <span class="count">${lbEntries.length.toLocaleString('en-US')} ranked entries</span>
    <span style="margin-left:auto"></span>
    <a class="btn ghost" href="#/bounty/${encodeURIComponent(slug)}/leaderboard" data-view="performance" aria-current="${lbView === 'performance' ? 'true' : 'false'}">Performance</a>
    <a class="btn ghost" href="#/bounty/${encodeURIComponent(slug)}/leaderboard?view=overall" data-view="overall" aria-current="${lbView === 'overall' ? 'true' : 'false'}">Overall</a>
  </div>
  <div id="lb-table">${tableHtml()}</div>`;
}

/** Pager buttons swap only the table block. */
export function bindLeaderboard(el) {
  const table = el.querySelector('#lb-table');
  if (!table) return;
  table.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-action="page"]');
    if (!btn || btn.disabled) return;
    lbPage = Number(btn.dataset.page) || 1;
    table.innerHTML = tableHtml();
  });
}
