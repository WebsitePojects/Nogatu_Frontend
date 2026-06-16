import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { useTheme } from '../../contexts/ThemeContext';
import { HiOutlineChevronLeft, HiOutlineChevronRight, HiOutlineDocumentText, HiOutlineSearch } from 'react-icons/hi';
import { formatDateTimeManila } from '../../utils/dateTime';

const fmt = (n) => Number(n || 0).toLocaleString('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function Spinner() {
  return (
    <div className="flex justify-center py-16">
      <div
        className="size-10 rounded-full border-[3px] animate-spin"
        style={{ borderColor: 'rgba(212,175,55,0.12)', borderTopColor: '#D4AF37' }}
      />
    </div>
  );
}

export default function Transactions() {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const [transactions, setTransactions] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  // Table standard: search + type filter + sort + responsive page size (50 mobile / 100 desktop).
  const [search, setSearch] = useState('');
  const [type, setType] = useState('all');
  const [sort, setSort] = useState('date');
  const [dir, setDir] = useState('desc');
  const [perPage, setPerPage] = useState(() => (typeof window !== 'undefined' && window.innerWidth < 768 ? 50 : 100));

  useEffect(() => {
    const onResize = () => setPerPage(window.innerWidth < 768 ? 50 : 100);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Debounce the search box so typing doesn't fire a request per keystroke.
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(id);
  }, [search]);

  // Any filter/sort change resets to page 1.
  useEffect(() => { setPage(1); }, [debouncedSearch, type, sort, dir, perPage]);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedSearch, type, sort, dir, perPage]);

  async function loadData() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page), perPage: String(perPage), type, sort, dir,
      });
      if (debouncedSearch) params.set('search', debouncedSearch);
      const res = await api.get(`/transactions?${params.toString()}`);
      setTransactions(Array.isArray(res.data.transactions) ? res.data.transactions : []);
      setTotalPages(Number(res.data.totalPages || 1));
      setTotal(Number(res.data.total || 0));
    } catch {
      setTransactions([]);
      setTotalPages(1);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }


  const txAmount = (t) => {
    if (t.transactionType === 10) return Number(t.encashment || 0);
    if (t.transactionType === 11) return Number(t.totalProductValue || 0);
    return Number(t.directReferral || 0)
      + Number(t.pairing || 0)
      + Number(t.leadership || 0)
      + Number(t.unilevel || 0)
      + Number(t.hifive || 0)
      + Number(t.rankingBonus || 0);
  };

  const txDeductions = (t) => {
    if (t.transactionType === 11) return Number(t.voucherUsed || 0);
    return Number(t.tax || 0) + Number(t.fee || 0) + Number(t.cdDeduction || 0);
  };

  const rowHoverClass = 'portal-table-row-hover';
  const dateText = isDarkMode ? 'rgba(255,255,255,0.58)' : '#5f6b7a';
  const detailText = isDarkMode ? 'rgba(255,255,255,0.72)' : '#475569';
  const amountText = isDarkMode ? '#D4AF37' : '#8b6508';

  const typePillStyle = (transactionType) => {
    if (transactionType === 1) {
      return isDarkMode
        ? { background: 'rgba(34,197,94,0.12)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.24)' }
        : { background: 'rgba(34,197,94,0.14)', color: '#15803d', border: '1px solid rgba(34,197,94,0.24)' };
    }
    if (transactionType === 10) {
      return isDarkMode
        ? { background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.24)' }
        : { background: 'rgba(239,68,68,0.12)', color: '#b91c1c', border: '1px solid rgba(239,68,68,0.22)' };
    }
    if (transactionType === 11) {
      return isDarkMode
        ? { background: 'rgba(212,175,55,0.14)', color: '#F2D06B', border: '1px solid rgba(212,175,55,0.3)' }
        : { background: 'rgba(212,175,55,0.14)', color: '#8b6508', border: '1px solid rgba(212,175,55,0.28)' };
    }
    return isDarkMode
      ? { background: 'rgba(148,163,184,0.12)', color: '#cbd5e1', border: '1px solid rgba(148,163,184,0.22)' }
      : { background: 'rgba(148,163,184,0.14)', color: '#475569', border: '1px solid rgba(148,163,184,0.25)' };
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="portal-page-title font-display text-2xl font-bold">Transaction History</h1>
        <div
          className="w-10 h-0.5 mt-2 rounded-full"
          style={{ background: 'linear-gradient(90deg,#D4AF37,transparent)' }}
        />
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div
          className="flex flex-col gap-3 px-5 py-3.5 lg:flex-row lg:items-center lg:justify-between"
          style={{ borderBottom: '1px solid rgba(212,175,55,0.08)' }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1 min-w-0">
            <div className="relative flex-1 max-w-xs">
              <HiOutlineSearch className="size-4 absolute left-2.5 top-1/2 -translate-y-1/2 portal-card-muted" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by date (e.g. 2026-06-16)"
                className="glass-input w-full pl-8 pr-3 py-1.5 text-sm rounded-lg"
              />
            </div>
            <select value={type} onChange={(e) => setType(e.target.value)}
              className="glass-input text-sm rounded-lg py-1.5 px-2">
              <option value="all">All types</option>
              <option value="income">Income</option>
              <option value="voucher">Voucher</option>
              <option value="encashment">Encashment</option>
            </select>
            <select value={`${sort}:${dir}`} onChange={(e) => { const [s, d] = e.target.value.split(':'); setSort(s); setDir(d); }}
              className="glass-input text-sm rounded-lg py-1.5 px-2">
              <option value="date:desc">Newest first</option>
              <option value="date:asc">Oldest first</option>
              <option value="amount:desc">Amount: high → low</option>
              <option value="amount:asc">Amount: low → high</option>
            </select>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="portal-card-muted text-xs mr-1">{total} total</span>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="portal-table-icon-button p-1.5 rounded-lg disabled:opacity-30 transition-colors"
             type="button">
              <HiOutlineChevronLeft className="size-4" />
            </button>
            <span className="portal-accent-chip text-xs px-2 py-1 rounded-lg">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="portal-table-icon-button p-1.5 rounded-lg disabled:opacity-30 transition-colors"
             type="button">
              <HiOutlineChevronRight className="size-4" />
            </button>
          </div>
        </div>

        {loading ? (
          <Spinner />
        ) : (
          <>
            <div className="space-y-3 p-4 md:hidden">
              {transactions.map((t) => (
                <article
                  key={t.pid}
                  className="rounded-2xl p-4"
                  style={{
                    background: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(247,249,252,0.96)',
                    border: isDarkMode ? '1px solid rgba(212,175,55,0.12)' : '1px solid rgba(203,213,225,0.9)',
                    boxShadow: 'var(--portal-box-shadow)',
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <span
                        className="inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-semibold"
                        style={typePillStyle(t.transactionType)}
                      >
                        {t.transactionTypeName}
                      </span>
                      <p className="mt-2 text-xs" style={{ color: dateText }}>
                        {formatDateTimeManila(t.transdate)}
                      </p>
                    </div>
                    <p className="text-right text-base font-semibold" style={{ color: amountText }}>
                      PHP {fmt(txAmount(t))}
                    </p>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="rounded-xl p-3" style={{ background: isDarkMode ? 'rgba(255,255,255,0.025)' : 'rgba(241,245,249,0.85)', border: isDarkMode ? '1px solid rgba(212,175,55,0.08)' : '1px solid rgba(203,213,225,0.7)' }}>
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: isDarkMode ? 'rgba(255,255,255,0.48)' : '#64748b' }}>Taxes &amp; Fees</p>
                      <p className="mt-1 text-sm" style={{ color: detailText }}>
                        {t.transactionType === 10 || t.transactionType === 11 ? `PHP ${fmt(txDeductions(t))}` : '-'}
                      </p>
                    </div>
                    <div className="rounded-xl p-3" style={{ background: isDarkMode ? 'rgba(255,255,255,0.025)' : 'rgba(241,245,249,0.85)', border: isDarkMode ? '1px solid rgba(212,175,55,0.08)' : '1px solid rgba(203,213,225,0.7)' }}>
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: isDarkMode ? 'rgba(255,255,255,0.48)' : '#64748b' }}>Details</p>
                      <p className="mt-1 text-sm" style={{ color: detailText }}>{t.transactionTypeName}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate(`/transactions/${encodeURIComponent(t.pid)}`)}
                    className="portal-table-action mt-4 w-full rounded-xl px-3 py-2 text-sm font-medium transition-colors"
                  >
                    View Details
                  </button>
                </article>
              ))}

              {transactions.length === 0 && (
                <div className="py-10 text-center">
                  <HiOutlineDocumentText
                    className="mx-auto mb-2 h-8 w-8"
                    style={{ color: 'rgba(212,175,55,0.2)' }}
                  />
                  <p className="portal-card-muted">No transactions found.</p>
                </div>
              )}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[700px] text-sm">
                <thead>
                  <tr>
                    <th className="table-header py-3 px-3">Type</th>
                    <th className="table-header py-3 px-3">Date</th>
                    <th className="table-header py-3 px-3">Amount</th>
                    <th className="table-header py-3 px-3">Taxes &amp; Fees</th>
                    <th className="table-header py-3 px-3">Details</th>
                    <th className="table-header py-3 px-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t, i) => (
                    <tr
                      key={t.pid}
                      style={{
                        background: i % 2 === 0 ? 'var(--portal-zebra-bg)' : 'transparent',
                        borderBottom: '1px solid var(--portal-row-border)',
                      }}
                      className={`${rowHoverClass} transition-colors`}
                    >
                      <td className="py-3 px-3">
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold"
                          style={typePillStyle(t.transactionType)}
                        >
                          {t.transactionTypeName}
                        </span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-xs" style={{ color: dateText }}>
                        {formatDateTimeManila(t.transdate)}
                      </td>
                      <td className="py-3 px-3 text-sm font-semibold" style={{ color: amountText }}>
                        PHP {fmt(txAmount(t))}
                      </td>
                      <td className="py-3 px-3 text-xs" style={{ color: detailText }}>
                        {t.transactionType === 10 || t.transactionType === 11 ? `PHP ${fmt(txDeductions(t))}` : '-'}
                      </td>
                      <td className="py-3 px-3 text-xs" style={{ color: detailText }}>
                        {t.transactionTypeName}
                      </td>
                      <td className="py-3 px-3">
                        <button
                          type="button"
                          onClick={() => navigate(`/transactions/${encodeURIComponent(t.pid)}`)}
                          className="portal-table-action text-xs px-2.5 py-1 rounded-lg font-medium transition-colors"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                  {transactions.length === 0 && (
                    <tr>
                      <td colSpan="6" className="py-14 text-center">
                        <HiOutlineDocumentText
                          className="w-8 h-8 mx-auto mb-2"
                          style={{ color: 'rgba(212,175,55,0.2)' }}
                        />
                        <p className="portal-card-muted">No transactions found.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
