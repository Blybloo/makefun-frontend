// An account's public profile: avatar, bio, wallet, record, entries and payouts.
// One API call; the entries table links back to each bounty.

import { esc, money, date, shortHash } from '../format.js';
import { avatarImg } from './common.js';

function recordStats(p) {
  const r = p.record ?? {};
  const stats = [
    ['Entered', Number(r.competitions_entered ?? 0).toLocaleString('en-US')],
    ['Placed', Number(r.competitions_placed ?? 0).toLocaleString('en-US')],
    ['Won', Number(r.competitions_won ?? 0).toLocaleString('en-US')],
    ['Podiums', Number(r.podium_finishes ?? 0).toLocaleString('en-US')],
    ['Best place', r.best_placement != null ? `#${esc(r.best_placement)}` : '—'],
    ['Prizes', money(r.prize_usd)],
  ];
  return `<div class="stat-grid">${stats.map(([label, value]) => `<div class="stat"><span class="label">${label}</span><span class="value">${value}</span></div>`).join('')}</div>`;
}

function solutionsTable(p) {
  const sols = Array.isArray(p.solutions) ? p.solutions : [];
  if (!sols.length) return '<p class="lede">No entries yet.</p>';
  const rows = sols
    .map(
      (s) => {
        const c = s.competition ?? {};
        return `<tr>
          <td><a href="#/bounty/${encodeURIComponent(c.slug ?? '')}">${esc(c.title ?? c.slug ?? '')}</a></td>
          <td>${esc(s.title || 'Untitled entry')}</td>
          <td class="num">${s.score?.value != null ? Number(s.score.value).toLocaleString('en-US') : '—'}</td>
          <td>${s.placement != null ? `#${esc(s.placement)}` : '—'}</td>
          <td class="num">${s.prize_usd != null ? money(s.prize_usd) : '—'}</td>
          <td>${date(s.entered_at)}</td>
        </tr>`;
      },
    )
    .join('');
  return `<div class="table-wrap"><table>
    <thead><tr><th>Bounty</th><th>Entry</th><th class="num">Score</th><th>Place</th><th class="num">Prize</th><th>Entered</th></tr></thead>
    <tbody>${rows}</tbody></table></div>`;
}

function payoutsList(p) {
  const pays = Array.isArray(p.payouts) ? p.payouts : [];
  if (!pays.length) return '<p class="lede">No payouts yet.</p>';
  const rows = pays
    .map(
      (x) => `<tr>
        <td>${esc(x.competition?.title ?? x.competition?.slug ?? '')}</td>
        <td class="num">${money(x.amount_usd)}</td>
        <td>${x.place != null ? `#${esc(x.place)}` : '—'}</td>
        <td>${date(x.paid_at)}</td>
        <td>${x.explorer_url ? `<a href="${esc(x.explorer_url)}">tx ${shortHash(x.signature)}</a>` : ''}</td>
      </tr>`,
    )
    .join('');
  return `<div class="table-wrap"><table>
    <thead><tr><th>Bounty</th><th class="num">Amount</th><th>Place</th><th>Paid</th><th>Receipt</th></tr></thead>
    <tbody>${rows}</tbody></table></div>`;
}

export function renderProfile(p) {
  const wallet = p.wallet?.address;
  return `<div class="profile-head">
    ${avatarImg(p.image ?? p.avatar, p.handle, 'avatar')}
    <div>
      <h1 style="margin:0">@${esc(p.handle)}</h1>
      ${p.display_name ? `<p class="lede" style="margin:0">${esc(p.display_name)}</p>` : ''}
      ${p.bio ? `<p class="lede" style="margin:4px 0 0">${esc(p.bio)}</p>` : ''}
    </div>
  </div>
  <dl class="kv">
    ${p.github_login ? `<dt>GitHub</dt><dd><a href="https://github.com/${encodeURIComponent(p.github_login)}">@${esc(p.github_login)}</a></dd>` : ''}
    ${wallet ? `<dt>Wallet</dt><dd><a href="${esc(p.wallet.explorer_url ?? '')}">${shortHash(wallet, 6, 4)}</a></dd>` : ''}
    <dt>Joined</dt><dd>${date(p.joined_at)}</dd>
    <dt>Profile</dt><dd><a href="https://make.fun${esc(p.profile_url ?? `/u/${p.handle}`)}">make.fun${esc(p.profile_url ?? `/u/${p.handle}`)}</a></dd>
  </dl>
  <h2>Record</h2>
  ${recordStats(p)}
  <h2>Entries</h2>
  ${solutionsTable(p)}
  <h2>Payouts</h2>
  ${payoutsList(p)}`;
}
