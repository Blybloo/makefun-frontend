// The bounty board: every open bounty with its live pot, entry fee, time left
// and entries. Search, category filter and sort run on the data already
// fetched — no new request — and only the list is re-rendered.

import { esc, money, timeLeft } from '../format.js';
import { statusBadge } from './common.js';

let boardData = [];
let boardQuery = '';
let boardCategory = '';
let boardSort = 'pot';

function bountyCard(b) {
  const pot = b.potUsd ?? b.rewardAmount;
  return `<li class="card">
    <h2><a href="#/bounty/${encodeURIComponent(b.slug)}">${esc(b.title)}</a></h2>
    <p class="meta">${esc(b.category ?? '')}${b.sponsor?.name ? ` · by ${esc(b.sponsor.name)}` : ''} ${statusBadge(b.deadline)}</p>
    <ul class="facts">
      <li><span class="label">Live pot</span><span class="value pot">${money(pot)}</span>${b.rewardAmount != null && Number(pot) !== Number(b.rewardAmount) ? ` <small>base ${money(b.rewardAmount)}</small>` : ''}</li>
      <li><span class="label">Entry fee</span><span class="value">${b.entryFeeUsd ? money(b.entryFeeUsd) : 'Free'}</span></li>
      <li><span class="label">Time left</span><span class="value" data-deadline="${esc(b.deadline)}">${timeLeft(b.deadline)}</span></li>
      <li><span class="label">Entries</span><span class="value">${Number(b.submissionCount ?? 0).toLocaleString('en-US')}</span></li>
    </ul>
  </li>`;
}

function filteredBoard() {
  const q = boardQuery.trim().toLowerCase();
  let items = boardData.filter((b) => {
    if (boardCategory && b.category !== boardCategory) return false;
    if (q && !`${b.title} ${b.slug} ${b.category ?? ''}`.toLowerCase().includes(q)) return false;
    return true;
  });
  const by = {
    pot: (a, b) => Number(b.potUsd ?? b.rewardAmount) - Number(a.potUsd ?? a.rewardAmount),
    deadline: (a, b) => new Date(a.deadline) - new Date(b.deadline),
    entries: (a, b) => Number(b.submissionCount ?? 0) - Number(a.submissionCount ?? 0),
    title: (a, b) => String(a.title).localeCompare(String(b.title)),
  }[boardSort];
  return items.sort(by);
}

function listHtml() {
  const items = filteredBoard();
  if (!items.length) return '<p class="loading">No bounties match that filter.</p>';
  return `<ul class="cards">${items.map(bountyCard).join('')}</ul>`;
}

export function renderBoard(data) {
  boardData = data.items ?? [];
  const categories = [...new Set(boardData.map((b) => b.category).filter(Boolean))].sort();
  return `<h1>Open bounties</h1>
  <p class="lede">Live pots, entry fees, time left and entries — read straight from make.fun's public API, cached and revalidated with ETags. A bounty still takes entries until its deadline, even when its status still reads open after it.</p>
  <div class="toolbar">
    <input id="board-search" type="search" placeholder="Search bounties…" value="${esc(boardQuery)}" aria-label="Search bounties">
    <select id="board-category" aria-label="Filter by category">
      <option value="">All categories</option>
      ${categories.map((c) => `<option value="${esc(c)}"${c === boardCategory ? ' selected' : ''}>${esc(c)}</option>`).join('')}
    </select>
    <select id="board-sort" aria-label="Sort bounties">
      <option value="pot"${boardSort === 'pot' ? ' selected' : ''}>Biggest pot</option>
      <option value="deadline"${boardSort === 'deadline' ? ' selected' : ''}>Closing soonest</option>
      <option value="entries"${boardSort === 'entries' ? ' selected' : ''}>Most entries</option>
      <option value="title"${boardSort === 'title' ? ' selected' : ''}>Title A–Z</option>
    </select>
    <span class="count" id="board-count">${boardData.length} open</span>
  </div>
  <div id="board-list">${listHtml()}</div>`;
}

/** Toolbar listeners: filter/sort re-render only the list, never the page. */
export function bindBoard(el) {
  const search = el.querySelector('#board-search');
  const category = el.querySelector('#board-category');
  const sort = el.querySelector('#board-sort');
  const list = el.querySelector('#board-list');
  const count = el.querySelector('#board-count');
  if (!search || !list) return;
  const refresh = () => {
    list.innerHTML = listHtml();
    if (count) count.textContent = `${filteredBoard().length} of ${boardData.length} open`;
  };
  search.addEventListener('input', () => { boardQuery = search.value; refresh(); });
  category?.addEventListener('change', () => { boardCategory = category.value; refresh(); });
  sort?.addEventListener('change', () => { boardSort = sort.value; refresh(); });
}
