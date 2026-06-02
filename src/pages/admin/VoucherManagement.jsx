import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { HiOutlineTicket, HiOutlineCheckCircle, HiOutlineClock, HiOutlineBan, HiOutlineSearch, HiOutlineEye, HiOutlineLockClosed, HiOutlineLockOpen, HiOutlineX } from 'react-icons/hi';

const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const STATUS_MAP = { 1: 'Active', 2: 'Expired', 3: 'Fully Used', 4: 'Suspended' };

const STATUS_STYLES = {
  1: { color: '#34d399', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)' },
  2: { color: '#fbbf24', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)' },
  3: { color: '#93c5fd', background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)' },
  4: { color: '#f87171', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' },
};

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: '1', label: 'Active' },
  { key: '2', label: 'Expired' },
  { key: '3', label: 'Fully Used' },
  { key: '4', label: 'Suspended' },
];

export default function VoucherManagement() {
  const navigate = useNavigate();
  const { admin } = useAuth();

  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [counts, setCounts] = useState({ all: 0, active: 0, expired: 0, fullyUsed: 0, suspended: 0 });

  const [detailVoucher, setDetailVoucher] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);

  const [suspendTarget, setSuspendTarget] = useState(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [suspendLoading, setSuspendLoading] = useState(false);

  const rights = Number(admin?.rights || 0);
  const canGrant = rights === 1 || rights === 2 || rights === 3;
  const canSuspend = rights === 1 || rights === 3;

  useEffect(() => { loadData(); }, [page, status, search]);

  async function loadData() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, status });
      if (search.trim()) params.set('search', search.trim());
      const res = await api.get(`/admin/voucher-management?${params.toString()}`);
      setRows(res.data.vouchers || []);
      setPagination(res.data.pagination || { page: 1, totalPages: 1 });
      setCounts(res.data.counts || { all: 0, active: 0, expired: 0, fullyUsed: 0, suspended: 0 });
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e) {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  }

  async function openDetails(voucher) {
    setDetailVoucher(voucher);
    setDetailLoading(true);
    setTransactions([]);
    try {
      const res = await api.get(`/admin/voucher-management/${voucher.id}/transactions`);
      setTransactions(res.data.transactions || []);
    } catch {
      toast.error('Failed to load transaction history');
    } finally {
      setDetailLoading(false);
    }
  }

  function closeDetails() {
    setDetailVoucher(null);
    setTransactions([]);
  }

  function openSuspend(voucher) {
    setSuspendTarget(voucher);
    setSuspendReason('');
  }

  async function confirmSuspend() {
    if (!suspendReason.trim()) return toast.error('Please enter a reason for suspension');
    setSuspendLoading(true);
    try {
      await api.put(`/admin/voucher-management/${suspendTarget.id}/suspend`, { reason: suspendReason.trim() });
      toast.success('Voucher suspended');
      setSuspendTarget(null);
      setSuspendReason('');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to suspend voucher');
    } finally {
      setSuspendLoading(false);
    }
  }

  async function handleUnsuspend(voucher) {
    try {
      await api.put(`/admin/voucher-management/${voucher.id}/unsuspend`);
      toast.success('Voucher reactivated');
      loadData();
      if (detailVoucher?.id === voucher.id) {
        setDetailVoucher({ ...detailVoucher, status: 1 });
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to unsuspend voucher');
    }
  }

  const summaryCards = [
    { label: 'Total Vouchers', value: counts.all, icon: HiOutlineTicket, gradient: 'linear-gradient(135deg, #1d4ed8, #3b82f6)', shadow: '0 10px 24px rgba(37,99,235,0.3)' },
    { label: 'Active', value: counts.active, icon: HiOutlineCheckCircle, gradient: 'linear-gradient(135deg, #047857, #10b981)', shadow: '0 10px 24px rgba(16,185,129,0.3)' },
    { label: 'Expired', value: counts.expired, icon: HiOutlineClock, gradient: 'linear-gradient(135deg, #b45309, #f59e0b)', shadow: '0 10px 24px rgba(217,119,6,0.28)' },
    { label: 'Suspended', value: counts.suspended, icon: HiOutlineBan, gradient: 'linear-gradient(135deg, #991b1b, #ef4444)', shadow: '0 10px 24px rgba(239,68,68,0.3)' },
    { label: 'Fully Used', value: counts.fullyUsed, icon: HiOutlineCheckCircle, gradient: 'linear-gradient(135deg, #4f46e5, #818cf8)', shadow: '0 10px 24px rgba(79,70,229,0.28)' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Voucher Management</h1>
        <div className="w-12 h-0.5 mt-2" style={{ background: 'linear-gradient(90deg,#D4AF37,transparent)' }} />
      </div>

      <div className="glass-card rounded-2xl p-2 flex items-center gap-2">
        <button
          className="px-3 py-2 rounded-lg text-sm font-semibold"
          style={{
            background: 'rgba(212,175,55,0.16)',
            border: '1px solid rgba(212,175,55,0.3)',
            color: '#D4AF37',
          }}
         type="button">
          Voucher List
        </button>
        {canGrant && (
          <button
            onClick={() => navigate('/admin/voucher-management/grant')}
            className="portal-button portal-neutral-button px-3 py-2 text-sm"
           type="button">
            Grant Vouchers
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {summaryCards.map((card) => (
          <div key={card.label} className="glass-card rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div
                className="size-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: card.gradient, boxShadow: card.shadow }}
              >
                <card.icon className="size-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium truncate" style={{ color: 'rgba(255,255,255,0.5)' }}>{card.label}</p>
                <p className="text-lg font-bold text-white">{Number(card.value || 0).toLocaleString()}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="portal-soft-panel rounded-2xl p-4 space-y-3">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <HiOutlineSearch className="portal-card-muted absolute left-3 top-1/2 -translate-y-1/2 size-4" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by username or voucher ID..."
              className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm portal-card-title outline-none bg-[var(--portal-soft-bg)] border border-[var(--portal-soft-border)] placeholder:text-[color:var(--portal-card-muted)]"
            />
          </div>
          <button
            type="submit"
            className="portal-button portal-gold-button px-4 py-2.5 text-sm"
          >
            Search
          </button>
        </form>
        <div className="flex flex-wrap items-center gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => { setStatus(f.key); setPage(1); }}
              className={`ttext-xs px-3 py-1.5 rounded-xl font-semibold border transition-colors ${
                status === f.key ? 'portal-accent-chip' : 'portal-card-muted bg-[var(--portal-soft-bg)] border-[var(--portal-soft-border)]'
              }`}
             type="button">
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="size-8 rounded-full border-4 animate-spin" style={{ borderColor: 'rgba(212,175,55,0.15)', borderTopColor: '#D4AF37' }} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  {['ID', 'Username', 'Full Name', 'Package', 'Amount', 'Remaining', 'Status', 'Issued', 'Expiry', 'Actions'].map((h) => (
                    <th key={h} className="table-header p-3 text-left text-xs uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-white/[0.04] transition-colors">
                    <td className="p-3 text-white/80 font-mono text-xs">{r.id}</td>
                    <td className="p-3 text-white/80">{r.username}</td>
                    <td className="p-3 text-white/60">{r.fullName || 'N/A'}</td>
                    <td className="p-3 text-white/70">{r.package || '—'}</td>
                    <td className="p-3 text-white/80 font-mono">{fmt(r.amount)}</td>
                    <td className="p-3 text-white/80 font-mono">{fmt(r.remaining)}</td>
                    <td className="p-3">
                      <span
                        className="inline-block text-xs px-2.5 py-0.5 rounded-full"
                        style={STATUS_STYLES[r.status] || STATUS_STYLES[1]}
                      >
                        {STATUS_MAP[r.status] || 'Unknown'}
                      </span>
                    </td>
                    <td className="p-3 text-white/50 text-xs">{r.issuedAt || '—'}</td>
                    <td className="p-3 text-white/50 text-xs">{r.expiryAt || '—'}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openDetails(r)}
                          className="portal-button portal-gold-button text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1"
                          title="View Details"
                         type="button">
                          <HiOutlineEye className="size-3.5" />
                          <span className="hidden sm:inline">View</span>
                        </button>
                        {canSuspend && Number(r.status) === 1 && (
                          <button
                            onClick={() => openSuspend(r)}
                            className="portal-button portal-danger-button text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1"
                            title="Suspend Voucher"
                           type="button">
                            <HiOutlineLockClosed className="size-3.5" />
                            <span className="hidden sm:inline">Suspend</span>
                          </button>
                        )}
                        {canSuspend && Number(r.status) === 4 && (
                          <button
                            onClick={() => handleUnsuspend(r)}
                            className="portal-button portal-success-button text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1"
                            title="Unsuspend Voucher"
                           type="button">
                            <HiOutlineLockOpen className="size-3.5" />
                            <span className="hidden sm:inline">Unsuspend</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan="10" className="py-12 text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>
                      No vouchers found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 mt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={pagination.page <= 1}
            className="text-sm py-1.5 px-3 rounded-lg font-medium disabled:opacity-40"
            style={{ background: 'rgba(212,175,55,0.08)', color: 'rgba(212,175,55,0.85)', border: '1px solid rgba(212,175,55,0.15)' }}
           type="button">
            Prev
          </button>
          <span className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>{pagination.page} / {pagination.totalPages || 1}</span>
          <button
            onClick={() => setPage((p) => Math.min(Number(pagination.totalPages || 1), p + 1))}
            disabled={pagination.page >= Number(pagination.totalPages || 1)}
            className="text-sm py-1.5 px-3 rounded-lg font-medium disabled:opacity-40"
            style={{ background: 'rgba(212,175,55,0.08)', color: 'rgba(212,175,55,0.85)', border: '1px solid rgba(212,175,55,0.15)' }}
           type="button">
            Next
          </button>
        </div>
      </div>

      {detailVoucher && (
        <div className="portal-overlay fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="portal-modal-panel w-full max-w-2xl max-h-[85vh] flex flex-col rounded-3xl shadow-[0_28px_64px_rgba(15,23,42,0.22)] dark:shadow-[0_30px_70px_rgba(0,0,0,0.45)]">
            <div className="flex items-center justify-between p-6 pb-4 shrink-0">
              <h2 className="portal-modal-title font-display text-xl">Voucher Details</h2>
              <button onClick={closeDetails} className="portal-modal-muted hover:opacity-80 p-1" aria-label="Close modal" type="button">
                <HiOutlineX className="size-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-5">
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <div>
                  <p className="portal-modal-muted text-xs uppercase tracking-wide mb-1">Voucher ID</p>
                  <p className="portal-modal-title font-mono">{detailVoucher.id}</p>
                </div>
                <div>
                  <p className="portal-modal-muted text-xs uppercase tracking-wide mb-1">Username</p>
                  <p className="portal-modal-title">{detailVoucher.username}</p>
                </div>
                <div>
                  <p className="portal-modal-muted text-xs uppercase tracking-wide mb-1">Full Name</p>
                  <p className="portal-modal-title">{detailVoucher.fullName || 'N/A'}</p>
                </div>
                <div>
                  <p className="portal-modal-muted text-xs uppercase tracking-wide mb-1">Package</p>
                  <p className="portal-modal-title">{detailVoucher.package || '—'}</p>
                </div>
                <div>
                  <p className="portal-modal-muted text-xs uppercase tracking-wide mb-1">Amount</p>
                  <p className="portal-modal-title font-mono">{fmt(detailVoucher.amount)}</p>
                </div>
                <div>
                  <p className="portal-modal-muted text-xs uppercase tracking-wide mb-1">Remaining</p>
                  <p className="portal-modal-title font-mono">{fmt(detailVoucher.remaining)}</p>
                </div>
                <div>
                  <p className="portal-modal-muted text-xs uppercase tracking-wide mb-1">Status</p>
                  <span
                    className="inline-block text-xs px-2.5 py-0.5 rounded-full"
                    style={STATUS_STYLES[detailVoucher.status] || STATUS_STYLES[1]}
                  >
                    {STATUS_MAP[detailVoucher.status] || 'Unknown'}
                  </span>
                </div>
                <div>
                  <p className="portal-modal-muted text-xs uppercase tracking-wide mb-1">Issued</p>
                  <p className="portal-modal-title text-xs">{detailVoucher.issuedAt || '—'}</p>
                </div>
                <div>
                  <p className="portal-modal-muted text-xs uppercase tracking-wide mb-1">Expiry</p>
                  <p className="portal-modal-title text-xs">{detailVoucher.expiryAt || '—'}</p>
                </div>
                {detailVoucher.suspendReason && (
                  <div className="col-span-2">
                    <p className="portal-danger-text text-xs uppercase tracking-wide mb-1">Suspend Reason</p>
                    <p className="portal-danger-text text-sm">{detailVoucher.suspendReason}</p>
                  </div>
                )}
              </div>

              <div className="h-px portal-row-divider" />

              <div>
                <h3 className="portal-modal-title text-sm font-semibold mb-3">Transaction History</h3>
                {detailLoading ? (
                  <div className="flex justify-center py-6">
                    <div className="size-6 rounded-full border-4 animate-spin" style={{ borderColor: 'rgba(212,175,55,0.15)', borderTopColor: '#D4AF37' }} />
                  </div>
                ) : transactions.length === 0 ? (
                  <p className="portal-modal-muted text-center py-6 text-sm">No transactions found for this voucher.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr>
                          {['Date', 'Type', 'Amount', 'Reference'].map((h) => (
                            <th key={h} className="table-header py-2 px-3 text-left text-xs uppercase tracking-wide">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map((tx, idx) => (
                          <tr key={tx.id || idx} className="hover:bg-white/[0.04] transition-colors">
                            <td className="portal-modal-muted py-2 px-3 text-xs">{tx.date || '—'}</td>
                            <td className="portal-modal-text py-2 px-3">{tx.type || '—'}</td>
                            <td className="portal-modal-title py-2 px-3 font-mono">{fmt(tx.amount)}</td>
                            <td className="portal-modal-muted py-2 px-3 text-xs font-mono">{tx.reference || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 p-6 pt-4 shrink-0 border-t portal-row-divider">
              {canSuspend && Number(detailVoucher.status) === 1 && (
                <button
                  onClick={() => { closeDetails(); openSuspend(detailVoucher); }}
                  className="portal-button portal-danger-button text-xs px-3.5 py-2.5"
                 type="button">
                  Suspend
                </button>
              )}
              {canSuspend && Number(detailVoucher.status) === 4 && (
                <button
                  onClick={() => { handleUnsuspend(detailVoucher); closeDetails(); }}
                  className="portal-button portal-success-button text-xs px-3.5 py-2.5"
                 type="button">
                  Unsuspend
                </button>
              )}
              <button
                onClick={closeDetails}
                className="portal-button portal-neutral-button text-xs px-3.5 py-2.5 ml-auto"
               type="button">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {suspendTarget && (
        <div className="portal-overlay fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="portal-modal-panel w-full max-w-md rounded-3xl p-6 shadow-[0_28px_64px_rgba(15,23,42,0.22)] dark:shadow-[0_30px_70px_rgba(0,0,0,0.45)]">
            <div className="flex items-center justify-between">
              <h2 className="portal-modal-title font-display text-xl">Suspend Voucher</h2>
              <button onClick={() => setSuspendTarget(null)} className="portal-modal-muted hover:opacity-80 p-1" aria-label="Close modal" type="button">
                <HiOutlineX className="size-5" />
              </button>
            </div>
            <p className="portal-modal-text mt-3 text-sm">
              Suspending voucher <span className="portal-modal-title font-mono">{suspendTarget.id}</span> for <span className="portal-modal-title">{suspendTarget.username}</span>.
            </p>
            <div className="mt-4">
              <label className="portal-modal-muted block text-xs font-medium mb-1.5">
                Reason <span className="portal-danger-text">*</span>
              </label>
              <textarea
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                rows={3}
                placeholder="Enter reason for suspension..."
                className="w-full px-3 py-2 rounded-2xl text-sm portal-modal-title outline-none resize-none bg-[var(--portal-soft-bg)] border border-[var(--portal-soft-border)] placeholder:text-[color:var(--portal-modal-muted)]"
              />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setSuspendTarget(null)}
                className="portal-button portal-neutral-button text-xs px-3.5 py-2.5"
               type="button">
                Cancel
              </button>
              <button
                onClick={confirmSuspend}
                disabled={suspendLoading}
                className="portal-button portal-danger-button text-xs px-4 py-2.5 font-semibold"
               type="button">
                {suspendLoading ? 'Suspending...' : 'Confirm Suspend'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
