import { useEffect, useRef } from 'react';
import api from '../../../api';

/*
 * Shared pieces for the AR (Acknowledgement Receipt) admin screens.
 * Styling uses only the theme-aware classes from index.css (glass-*, portal-*, label, btn-*) and
 * the --text-* tokens, so every screen stays readable in both light and dark mode.
 */

export const MODE_LABELS = {
  package: 'Packages',
  cash_member: 'Cash - member price',
  cash_stockist: 'Cash - stockist price',
  cash_srp: 'Cash - SRP',
  voucher: 'Voucher',
};

export const PAYMENT_LABELS = {
  cash: 'Cash', gcash: 'GCash', bdo: 'BDO', psbank: 'PSBank', other_bank: 'Other bank', voucher: 'Voucher',
};

export const STOCKIST_LABELS = { 2: 'Mobile', 3: 'City', 4: 'Provincial' };

const pesoFormatter = new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const peso = (value) => `PHP ${pesoFormatter.format(Number(value || 0))}`;

/** Display form of a numeric AR number: 2026001236 -> 2026-001236. Stored and searched as digits. */
export const formatArNo = (arNo) => {
  const s = String(arNo || '');
  return /^\d{10,}$/.test(s) ? `${s.slice(0, 4)}-${s.slice(4)}` : s;
};

export const formatDate = (value) => {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString('en-PH', { timeZone: 'Asia/Manila', year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
};

export const errorText = (err, fallback) => err?.response?.data?.error || fallback;

// Mirrors services/ar/arPricing.js for previews only; the server enforces both limits.
export const MAX_CODES_PER_AR = 500;
export const MAX_SPLIT_PARTS = 10;

/**
 * The split the server makes for a big order (arPricing.js splitOrder): merge by product, ascending
 * product order, fill each part to 500 codes before starting the next. One product may span parts.
 */
export function planSplit(lines) {
  const merged = new Map();
  for (const { producttype, qty } of lines) merged.set(producttype, (merged.get(producttype) || 0) + qty);
  const parts = [];
  let current = [];
  let room = MAX_CODES_PER_AR;
  for (const [producttype, qty] of [...merged].sort((a, b) => a[0] - b[0])) {
    let left = qty;
    while (left > 0) {
      if (room === 0) { parts.push(current); current = []; room = MAX_CODES_PER_AR; }
      const take = Math.min(left, room);
      current.push({ producttype, qty: take });
      left -= take;
      room -= take;
    }
  }
  if (current.length) parts.push(current);
  return parts;
}

// "300 gold", "300x gold", "300 x gold", "300*gold" | "gold 300", "gold x300", "gold x 300", "gold*300".
// The x must be followed by a space (or be a *), so a name such as "Xtra" is never read as a multiplier.
const QTY_FIRST = /^(\d+)\s*(?:[x*]\s+|\*|\s+)(\S.*)$/i;
// Lazy name: "gold x 300" must read as gold, not "gold x".
const QTY_LAST = /^(.*?\S)\s*(?:\b[x*]\s*|\s)(\d+)$/i;

/**
 * Reads a quantity typed together with an item name. Returns every reading (qty first, qty last) so
 * the caller can keep the one whose name matches a product: "6 in 1 coffee 2" is ambiguous until
 * the price list says which name exists. Plain text returns [] and keeps Enter's add-one behaviour.
 */
export function parseQuickAdd(text) {
  const s = String(text || '').trim();
  const readings = [];
  const first = s.match(QTY_FIRST);
  if (first) readings.push({ qty: Number(first[1]), term: first[2].trim() });
  const last = s.match(QTY_LAST);
  if (last) readings.push({ qty: Number(last[2]), term: last[1].trim() });
  return readings.filter((r) => Number.isSafeInteger(r.qty) && r.qty >= 1 && r.term);
}

/*
 * Shared control styles so every AR screen looks and behaves the same.
 * Primary = gold-btn (as Manage Codes' Search), secondary = portal-muted-button, plus danger/success.
 * Every control keeps a 44px touch target and a visible keyboard focus ring.
 */
export const FOCUS_RING = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-700 dark:focus-visible:ring-gold-500';
const BTN = `inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS_RING}`;
export const BTN_PRIMARY = `gold-btn ${BTN}`;
export const BTN_SECONDARY = `portal-muted-button ${BTN}`;
export const BTN_DANGER = `portal-danger-button ${BTN}`;
export const BTN_SUCCESS = `portal-success-button ${BTN}`;
export const MONEY = 'whitespace-nowrap tabular-nums';
export const AR_NO = 'font-mono whitespace-nowrap';

/** One-click filter pill, same look as Voucher Management's status filters. */
export function FilterPill({ active, onClick, disabled, children }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      disabled={disabled}
      className={`min-h-[44px] rounded-xl border px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${FOCUS_RING} ${
        active ? 'portal-accent-chip' : 'portal-card-muted border-[var(--portal-soft-border)] bg-[var(--portal-soft-bg)]'
      }`}
    >
      {children}
    </button>
  );
}

/**
 * Arrow keys move the selection of a radiogroup / tablist (roving tabindex pattern).
 * Each option must carry data-key and live directly inside the group element.
 */
export function moveSelection(e, keys, current, onSelect) {
  const delta = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
  if (!delta) return;
  e.preventDefault();
  const next = keys[(keys.indexOf(current) + delta + keys.length) % keys.length];
  onSelect(next);
  e.currentTarget.parentElement?.querySelector(`[data-key="${next}"]`)?.focus();
}

/** Prev / "1 / N" / Next, matching Manage Codes. Disabled buttons are clearly muted. */
export function Pagination({ page, totalPages, onPrev, onNext, busy = false, summary }) {
  const prevOff = busy || page <= 1;
  const nextOff = busy || page >= totalPages;
  const look = (off) => (off ? 'portal-muted-button opacity-50' : 'portal-accent-chip');
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
      <span className="portal-card-muted">{summary}</span>
      <div className="flex items-center gap-2">
        <button type="button" onClick={onPrev} disabled={prevOff}
          className={`${look(prevOff)} min-h-[44px] rounded-xl border px-4 font-semibold disabled:cursor-not-allowed ${FOCUS_RING}`}>Prev</button>
        <span className={`portal-card-text px-2 ${MONEY}`} aria-live="polite">{page} / {totalPages}</span>
        <button type="button" onClick={onNext} disabled={nextOff}
          className={`${look(nextOff)} min-h-[44px] rounded-xl border px-4 font-semibold disabled:cursor-not-allowed ${FOCUS_RING}`}>Next</button>
      </div>
    </div>
  );
}

/** Small keyboard-shortcut hint. Decorative, so it is hidden from screen readers. */
export function Kbd({ children }) {
  return (
    <kbd aria-hidden="true" className="rounded-md border px-1.5 font-mono text-[11px] font-semibold leading-5"
      style={{ borderColor: 'var(--portal-soft-border)', color: 'var(--portal-card-muted)', background: 'var(--portal-soft-bg)' }}>
      {children}
    </kbd>
  );
}

const STATUS_STYLE = {
  pending_approval: { label: 'Awaiting approval', className: 'portal-warning-chip' },
  completed: { label: 'Completed', className: 'portal-success-chip' },
  void: { label: 'Void', className: 'portal-danger-chip' },
};

/** "Part 2 of 3" label for one AR of a split order; nothing for a normal AR. */
export function PartChip({ part, count, short = false }) {
  if (!part || !count) return null;
  return (
    <span className="portal-info-chip rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap">
      {short ? `Part ${part}/${count}` : `Part ${part} of ${count}`}
    </span>
  );
}

export function StatusChip({ status, legacy = false }) {
  const s = STATUS_STYLE[status] || { label: status, className: 'portal-info-chip' };
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`${s.className} rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap`}>{s.label}</span>
      {legacy && <span className="portal-info-chip rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap">Legacy</span>}
    </span>
  );
}

/** Shown instead of an empty state when a fetch fails, so a failure is never read as "nothing here". */
export function ErrorState({ message, onRetry, busy = false }) {
  return (
    <div className="portal-danger-chip rounded-2xl p-4 text-sm" role="alert">
      <p className="font-semibold">{message || 'Could not load this data.'}</p>
      {onRetry && (
        <button type="button" className={`${BTN_SECONDARY} mt-3`} onClick={onRetry} disabled={busy}>
          {busy ? 'Retrying...' : 'Retry'}
        </button>
      )}
    </div>
  );
}

export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="portal-page-title font-display text-2xl font-bold">{title}</h1>
        <div className="mt-2 h-0.5 w-12" style={{ background: 'linear-gradient(90deg,#D4AF37,transparent)' }} />
        {subtitle && <p className="portal-card-muted mt-3 max-w-2xl text-sm">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}

// Same fallback as postIdempotent in src/api/index.js: crypto.randomUUID is absent in non-secure contexts.
export function newKey() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}-${Math.random().toString(36).slice(2, 12)}`;
}

/**
 * One idempotency key per user INTENT: retries of the same payload reuse the key (so the server
 * replays instead of acting twice); a changed payload gets a fresh key.
 */
export function useIntentKey() {
  const ref = useRef({ signature: '', key: '' });
  return {
    keyFor(payload) {
      const signature = JSON.stringify(payload);
      if (ref.current.signature !== signature || !ref.current.key) {
        ref.current = { signature, key: newKey() };
      }
      return ref.current.key;
    },
    reset() { ref.current = { signature: '', key: '' }; },
  };
}

export const arApi = {
  meta: () => api.get('/admin/ar/meta').then((r) => r.data),
  centers: () => api.get('/admin/ar/centers').then((r) => r.data),
  prices: () => api.get('/admin/ar/prices').then((r) => r.data),
  discounts: () => api.get('/admin/ar/discounts').then((r) => r.data),
  stockists: () => api.get('/admin/ar/stockists').then((r) => r.data),
  member: (username) => api.get(`/admin/ar/member/${encodeURIComponent(username)}`).then((r) => r.data),
  receipts: (params) => api.get('/admin/ar/receipts', { params }).then((r) => r.data),
  receipt: (id) => api.get(`/admin/ar/receipts/${id}`).then((r) => r.data),
  create: (body, key) => api.post('/admin/ar/receipts', body, { headers: { 'Idempotency-Key': key } }).then((r) => r.data),
  approve: (id, key) => api.post(`/admin/ar/receipts/${id}/approve`, {}, { headers: { 'Idempotency-Key': key } }).then((r) => r.data),
  void: (id, reason, key) => api.post(`/admin/ar/receipts/${id}/void`, { reason }, { headers: { 'Idempotency-Key': key } }).then((r) => r.data),
  flag: (id, reason, key) => api.post(`/admin/ar/receipts/${id}/flag`, { reason }, { headers: { 'Idempotency-Key': key } }).then((r) => r.data),
  resolveFlag: (id, body, key) => api.post(`/admin/ar/receipts/${id}/flag/resolve`, body, { headers: { 'Idempotency-Key': key } }).then((r) => r.data),
  print: (id) => api.post(`/admin/ar/receipts/${id}/print`).then((r) => r.data),
  legacy: (body, key) => api.post('/admin/ar/legacy', body, { headers: { 'Idempotency-Key': key } }).then((r) => r.data),
  sequence: () => api.get('/admin/ar/sequence').then((r) => r.data),
  seed: (latestPaperNumber, key) => api.post('/admin/ar/sequence', { latestPaperNumber }, { headers: { 'Idempotency-Key': key } }).then((r) => r.data),
  savePrice: (body) => api.put('/admin/ar/prices', body).then((r) => r.data),
  saveDiscount: (body) => api.put('/admin/ar/discounts', body).then((r) => r.data),
  saveStockist: (body) => api.put('/admin/ar/stockists', body).then((r) => r.data),
  cashiers: () => api.get('/admin/ar/cashiers').then((r) => r.data),
  saveCashier: (body) => api.put('/admin/ar/cashiers', body).then((r) => r.data),
  report: (params) => api.get('/admin/ar/reports/consolidation', { params }).then((r) => r.data),
  exportReport: (params) => api.get('/admin/ar/reports/consolidation/export', { params, responseType: 'blob' }),
};

/**
 * Confirmation dialog for irreversible actions. Closes on Escape unless busy.
 * Callers pass inline arrows for onCancel, so the latest props live in refs and the effect depends on
 * `open` only: focus moves to the confirm button on the open transition, never again while typing.
 */
export function ConfirmDialog({ open, title, children, confirmLabel, confirmClass = BTN_PRIMARY, busy, confirmDisabled = false, onConfirm, onCancel }) {
  const confirmRef = useRef(null);
  const busyRef = useRef(busy);
  const cancelRef = useRef(onCancel);
  busyRef.current = busy;
  cancelRef.current = onCancel;
  useEffect(() => {
    if (!open) return undefined;
    confirmRef.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape' && !busyRef.current) cancelRef.current(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);
  if (!open) return null;
  return (
    <div className="portal-overlay fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="ar-confirm-title">
      <div className="portal-modal-panel w-full max-w-md rounded-2xl p-6">
        <h2 id="ar-confirm-title" className="portal-modal-title text-lg font-bold">{title}</h2>
        <div className="portal-modal-text mt-3 space-y-2 text-sm">{children}</div>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className={BTN_SECONDARY} onClick={onCancel} disabled={busy}>Cancel</button>
          <button ref={confirmRef} type="button" className={confirmClass} onClick={onConfirm} disabled={busy || confirmDisabled} aria-busy={busy}>
            {busy ? 'Working...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
