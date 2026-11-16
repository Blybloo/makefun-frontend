// A bounty's page: its summary, description and rules, the rewards table with
// the live pot, its dates and status, and its recent entries. One API call.

import { esc, money, date, timeLeft } from '../format.js';
import { statusBadge } from './common.js';

/** Plain text with blank lines as paragraphs, escaped. */
function paragraphs(text) {
  return String(text ?? '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${esc(p)}</p>`)
    .join('');
}

function rewardsTable(b) {
  const now = b.rewardsNow;
  if (Array.isArray(now) && now.length) {
    const rows = now
      .map(
        (r) => `<tr><td>${esc(r.place)}</td><td class="num">${money(r.baseUsd)}</td><td class="num">${money(r.feeShareUsd)}</td><td class="num"><strong>${money(r.amountUsd)}</strong></td></tr>`,
      )
      .join('');
    return `<div class="table-wrap"><table>
      <thead><tr><th>Place</th><th class="num">Base</th><th class="num">Fee share</th><th class="num">Total now</th></tr></thead>
      <tbody>${rows}</tbody></table></div>
      <p class="lede">Live pot ${money(b.potUsd)}: the $500 reward plus ${money(b.entryFeesUsd)} of entry fees from ${Number(b.entryFeePayers ?? 0).toLocaleString('en-US')} payers.</p>`;
  }
  const map = b.rewards;
  if (map && typeof map === 'object') {
    const rows = Object.entries(map)
      .sort((a, c) => Number(a[0]) - Number(c[0]))
      .map(([place, amount]) => `<tr><td>${esc(place)}</td><td class="num"><strong>${money(amount)}</strong></td></tr>`)
      .join('');
    return `<div class="table-wrap"><table>
      <thead><tr><th>Place</th><th class="num">Reward</th></tr></thead>
      <tbody>${rows}</tbody></table></div>`;
  }
  return '';
}

function submissionsTable(b) {
  const subs = Array.isArray(b.submissions) ? b.submissions : [];
  if (!subs.length) return '<p class="lede">No entries yet.</p>';
  const rows = subs
    .slice(0, 10)
    .map(
      (s) => `<tr>
        <td><a href="#/profile/${encodeURIComponent(s.hunter)}">${esc(s.hunter)}</a></td>
        <td>${esc(s.title || 'Untitled entry')}</td>
        <td class="num">${s.score != null ? Number(s.score).toLocaleString('en-US') : '—'}</td>
        <td>${esc(s.status ?? '')}</td>
        <td>${date(s.createdAt)}</td>
      </tr>`,
    )
    .join('');
  return `<div class="table-wrap"><table>
    <thead><tr><th>Entrant</th><th>Entry</th><th class="num">Score</th><th>Status</th><th>Entered</th></tr></thead>
    <tbody>${rows}</tbody></table></div>`;
}

export function renderBounty(b) {
  const pot = b.potUsd ?? b.rewardAmount;
  return `<p><a href="#/">← All bounties</a> · <a href="#/bounty/${encodeURIComponent(b.slug)}/leaderboard">Leaderboard →</a></p>
  <h1>${esc(b.title)}</h1>
  <p class="lede">${esc(b.summary ?? '')}</p>
  <p>${statusBadge(b.deadline)} ${esc(b.category ?? '')}${b.sponsor?.name ? ` · sponsored by ${esc(b.sponsor.name)}` : ''}</p>
  <dl class="kv">
    <dt>Live pot</dt><dd><strong>${money(pot)}</strong>${b.rewardAmount != null && Number(pot) !== Number(b.rewardAmount) ? ` (base reward ${money(b.rewardAmount)})` : ''}</dd>
    ${b.entryFeeUsd ? `<dt>Entry fee</dt><dd>${money(b.entryFeeUsd)} — paid once per account</dd>` : ''}
    <dt>Deadline</dt><dd>${date(b.deadline)} (<span data-deadline="${esc(b.deadline)}">${timeLeft(b.deadline)}</span>)</dd>
    <dt>Entries</dt><dd>${Number(b.submissionCount ?? 0).toLocaleString('en-US')}</dd>
    <dt>Accepting entries</dt><dd>${b.acceptingSubmissions === false ? 'No' : 'Yes — until the deadline'}</dd>
  </dl>
  <h2>Rewards</h2>
  ${rewardsTable(b)}
  <h2>Description</h2>
  <div class="prose">${paragraphs(b.description)}</div>
  ${b.rules ? `<details class="rules"><summary>Full rules</summary><div class="prose">${paragraphs(b.rules)}</div></details>` : ''}
  <h2>Recent entries</h2>
  ${submissionsTable(b)}`;
}
