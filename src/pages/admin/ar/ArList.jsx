import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineSearch } from 'react-icons/hi';
import { useAuth } from '../../../contexts/AuthContext';
import {
  arApi, MODE_LABELS, PageHeader, ErrorState, StatusChip, FilterPill, Pagination, peso, formatArNo, formatDate, errorText,
  BTN_PRIMARY, BTN_SECONDARY, FOCUS_RING, MONEY, AR_NO,
} from './arShared';

const PAGE = 50;
const BLANK = { status: '', search: '', from: '', to: '' };
const STATUS_FILTERS = [
  ['', 'All'],
  ['pending_approval', 'Awaiting approval'],
  ['completed', 'Completed'],
  ['void', 'Void'],
];

export default function ArList() {
  const { admin } = useAuth();
  const navigate = useNavigate();
  const rights = Number(admin?.rights);
  const canSell = [1, 2].includes(rights);
  const isSuper = rights === 1;
  const [filters, setFilters] = useState(BLANK);
  const [applied, setApplied] = useState(BLANK);
  const [data, setData] = useState({ rows: [], total: 0 });
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [pendingCount, setPendingCount] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const params = { ...Object.fromEntries(Object.entries(applied).filter(([, v]) => v)), limit: PAGE, offset };
      // Displayed AR numbers carry a dash (2026-001236) but are stored and searched as digits.
      if (/^\d{4}-\d+$/.test(String(params.search || '').trim())) params.search = params.search.replace(/\D/g, '');
      setData(await arApi.receipts(params));
    } catch (err) {
      // Clear the old rows too: a failure must not leave a stale page that looks current.
      setData({ rows: [], total: 0 });
      setLoadError(errorText(err, 'Could not load ARs'));
      toast.error(errorText(err, 'Could not load ARs'));
    } finally {
      setLoading(false);
    }
  }, [applied, offset]);

  useEffect(() => { load(); }, [load]);

  // Super Admin nudge: how many ARs are waiting. Silent on failure; it is a convenience, not data.
  useEffect(() => {
    if (!isSuper) return undefined;
    let alive = true;
    arApi.receipts({ status: 'pending_approval', limit: 1 })
      .then((res) => { if (alive) setPendingCount(Number(res.total || 0)); })
      .catch(() => {});
    return () => { alive = false; };
  }, [isSuper]);

  function applyFilters(next) {
    setOffset(0);
    setFilters(next);
    setApplied(next);
  }

  function apply(e) {
    e.preventDefault();
    applyFilters(filters);
  }

  const totalPages = Math.max(1, Math.ceil(data.total / PAGE));
  const page = Math.floor(offset / PAGE) + 1;
  const filtered = Object.values(applied).some(Boolean);
  const hasInput = filtered || Object.values(filters).some(Boolean);

  return (
    <div>
      <PageHeader title="Acknowledgement Receipts" subtitle="Every AR, newest first. Legacy paper ARs are included on their paper date.">
        {canSell && (
          <Link to="/admin/ar/new" className={BTN_PRIMARY}>
            <HiOutlinePlus aria-hidden="true" /> New AR
          </Link>
        )}
      </PageHeader>

      {isSuper && pendingCount > 0 && (
        <div className="portal-warning-chip mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl p-3 text-sm" role="status">
          <span className="font-semibold">
            {pendingCount} AR{pendingCount === 1 ? ' is' : 's are'} waiting for your approval
          </span>
          <Link to="/admin/ar/approvals" className={BTN_PRIMARY}>Review</Link>
        </div>
      )}

      <form onSubmit={apply} className="glass-card mb-5 space-y-4 rounded-2xl p-4">
        <div>
          <label className="label" htmlFor="ar-search">Search</label>
          <div className="relative mt-1.5 max-w-xl">
            <HiOutlineSearch className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2" style={{ color: 'var(--portal-card-muted)' }} aria-hidden="true" />
            <input id="ar-search" className="glass-input min-h-[44px] w-full rounded-xl pl-9 pr-4 text-sm" value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })} placeholder="AR no., buyer name or username" />
          </div>
        </div>

        <div role="group" aria-label="Status" className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map(([value, label]) => (
            <FilterPill key={value || 'all'} active={filters.status === value} disabled={loading}
              onClick={() => applyFilters({ ...filters, status: value })}>
              {label}
            </FilterPill>
          ))}
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="label" htmlFor="ar-from">From</label>
            <input id="ar-from" type="date" className="glass-input mt-1.5 min-h-[44px] w-44 rounded-xl px-3 text-sm" value={filters.from}
              onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="ar-to">To</label>
            <input id="ar-to" type="date" className="glass-input mt-1.5 min-h-[44px] w-44 rounded-xl px-3 text-sm" value={filters.to}
              onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
          </div>
          <button type="submit" className={BTN_PRIMARY} disabled={loading}>Apply</button>
          <button type="button" className={BTN_SECONDARY} disabled={loading || !hasInput}
            onClick={() => applyFilters(BLANK)}>
            Clear
          </button>
        </div>
      </form>

      <div className="glass-card overflow-x-auto rounded-2xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="table-header">
              <th className="px-4 py-3 text-left">AR no.</th>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Buyer</th>
              <th className="px-4 py-3 text-left">Mode</th>
              <th className="px-4 py-3 text-left">Center</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={7} className="portal-card-muted px-4 py-6 text-center">Loading...</td></tr>}
            {!loading && loadError && (
              <tr><td colSpan={7} className="px-4 py-6"><ErrorState message={loadError} onRetry={load} /></td></tr>
            )}
            {!loading && !loadError && data.rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center">
                  <p className="portal-card-text">{filtered ? 'No ARs match these filters.' : 'No ARs yet.'}</p>
                  {canSell && (
                    <Link to="/admin/ar/new" className={`${BTN_PRIMARY} mt-3`}>
                      <HiOutlinePlus aria-hidden="true" /> New AR
                    </Link>
                  )}
                </td>
              </tr>
            )}
            {!loading && !loadError && data.rows.map((r) => (
              <tr key={r.id} className="portal-zebra-row portal-table-row-hover cursor-pointer" onClick={() => navigate(`/admin/ar/${r.id}`)}>
                <td className="px-4 py-3">
                  <Link to={`/admin/ar/${r.id}`} onClick={(e) => e.stopPropagation()}
                    className={`portal-gold-text ${AR_NO} rounded font-semibold underline-offset-2 hover:underline ${FOCUS_RING}`}>
                    {formatArNo(r.ar_no)}
                  </Link>
                </td>
                <td className="portal-card-text px-4 py-3 whitespace-nowrap">{r.is_legacy ? String(r.business_date).slice(0, 10) : formatDate(r.created_at)}</td>
                <td className="portal-card-text px-4 py-3">{r.buyer_name}{r.buyer_username ? <span className="portal-card-muted"> ({r.buyer_username})</span> : null}</td>
                <td className="portal-card-text px-4 py-3">{MODE_LABELS[r.mode]}</td>
                <td className="portal-card-text px-4 py-3">{r.center_name}</td>
                <td className={`portal-card-title px-4 py-3 text-right font-semibold ${MONEY}`}>{peso(r.total)}</td>
                <td className="px-4 py-3"><StatusChip status={r.status} legacy={Boolean(r.is_legacy)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        busy={loading}
        summary={`${data.total} AR(s)`}
        onPrev={() => setOffset(Math.max(0, offset - PAGE))}
        onNext={() => setOffset(offset + PAGE)}
      />
    </div>
  );
}
