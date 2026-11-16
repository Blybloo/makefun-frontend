// Shared bits for the four views: status badges, avatars, errors, pagination.
// Views return HTML strings; main.js wires the buttons by delegation, so no
// inline handler ever appears in the markup.

import { esc, apiImage } from '../format.js';

/** Whether a bounty still takes entries, by its deadline — not its status: a bounty past its deadline may still read 'open' until results publish. */
export function entryState(deadline) {
  const ms = new Date(deadline).getTime() - Date.now();
  if (Number.isNaN(ms) || ms <= 0) return { key: 'ended', label: 'Ended' };
  if (ms < 86400000) return { key: 'closing', label: 'Closing soon' };
  return { key: 'open', label: 'Open' };
}

export function statusBadge(deadline) {
  const s = entryState(deadline);
  return `<span class="badge${s.key === 'closing' ? ' closing' : s.key === 'ended' ? ' ended' : ''}">${s.label}</span>`;
}

/** An avatar/entry image from an API answer. crossorigin goes before src: make.fun's images send Cross-Origin-Resource-Policy: same-origin. */
export function avatarImg(path, alt, cls = 'avatar small') {
  const src = apiImage(path);
  if (!src) return '';
  return `<img crossorigin="anonymous" class="${esc(cls)}" src="${esc(src)}" alt="${esc(alt)}" referrerpolicy="no-referrer">`;
}

/** An error page with a retry button (main.js handles the click). */
export function errorView(message) {
  return `<p class="error">Could not load this page: ${esc(message)}</p><p><button class="btn" type="button" data-action="retry">Try again</button></p>`;
}

/** A page of a long list, and how many pages there are. */
export function paginate(items, page, perPage) {
  const pages = Math.max(1, Math.ceil(items.length / perPage));
  const p = Math.min(Math.max(1, page), pages);
  return { page: p, pages, rows: items.slice((p - 1) * perPage, p * perPage) };
}

export function pagerHtml(page, pages, label) {
  if (pages <= 1) return '';
  return `<div class="pager">
    <button class="btn ghost" type="button" data-action="page" data-page="${page - 1}"${page <= 1 ? ' disabled' : ''}>← Prev</button>
    <span class="page-info">Page ${page} of ${pages}${label ? ` · ${esc(label)}` : ''}</span>
    <button class="btn ghost" type="button" data-action="page" data-page="${page + 1}"${page >= pages ? ' disabled' : ''}>Next →</button>
  </div>`;
}
