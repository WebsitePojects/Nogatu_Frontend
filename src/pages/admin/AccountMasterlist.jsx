import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../api';
import toast from 'react-hot-toast';
import { PaginationButton } from '../../components/PaginationButton';
import { useTheme } from '../../contexts/ThemeContext';
import { formatDateTimeManila } from '../../utils/dateTime';

function statusStyle(status) {
  if (status === 'suspended') {
    return { background: 'rgba(239,68,68,0.1)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.25)' };
  }
  return { background: 'rgba(74,222,128,0.1)', color: '#86efac', border: '1px solid rgba(74,222,128,0.22)' };
}

export default function AccountMasterlist() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isDarkMode } = useTheme();
  const [accounts, setAccounts] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [monitorRange, setMonitorRange] = useState(searchParams.get('monitorRange') || 'all');
  const [monitorSort, setMonitorSort] = useState(searchParams.get('monitorSort') || 'newest');
  const [monitorAccounts, setMonitorAccounts] = useState([]);
  const [monitorPage, setMonitorPage] = useState(1);
  const [monitorTotalPages, setMonitorTotalPages] = useState(1);
  const [monitorSummary, setMonitorSummary] = useState({ weeklyRegistrations: 0, monthlyRegistrations: 0 });
  const [loading, setLoading] = useState(true);
  const [statusLoadingUid, setStatusLoadingUid] = useState(null);
  const [statusModal, setStatusModal] = useState(null);
  const [statusReason, setStatusReason] = useState('');
  const goldText = isDarkMode ? '#D4AF37' : '#7a5c08';
  const greenText = isDarkMode ? '#34d399' : '#047857';
  const blueText = isDarkMode ? '#93c5fd' : '#1d4ed8';
  const redText = isDarkMode ? '#fca5a5' : '#b91c1c';

  useEffect(() => { loadAccounts(); }, [page, monitorPage]);

  async function loadAccounts(searchTerm, monitorOverrides = {}) {
    setLoading(true);
    try {
      const q = searchTerm !== undefined ? searchTerm : search;
      const activeMonitorRange = monitorOverrides.range ?? monitorRange;
      const activeMonitorSort = monitorOverrides.sort ?? monitorSort;
      const activeMonitorPage = monitorOverrides.page ?? monitorPage;
      const res = await api.get(`/admin/accounts?page=${page}&search=${encodeURIComponent(q)}&monitorPage=${activeMonitorPage}&monitorRange=${activeMonitorRange}&monitorSort=${activeMonitorSort}`);
      setAccounts(res.data.accounts);
      setTotalPages(res.data.totalPages);
      setMonitorAccounts(res.data.monitoring?.accounts || []);
      setMonitorTotalPages(res.data.monitoring?.totalPages || 1);
      setMonitorSummary({
        weeklyRegistrations: Number(res.data.monitoring?.weeklyRegistrations || 0),
        monthlyRegistrations: Number(res.data.monitoring?.monthlyRegistrations || 0),
      });
    } catch { } finally { setLoading(false); }
  }

  function handleSearch(e) {
    e.preventDefault();
    setPage(1);
    setMonitorPage(1);
    loadAccounts(search);
  }

  function applyMonitorFilter(nextRange, nextSort = monitorSort) {
    setMonitorRange(nextRange);
    setMonitorSort(nextSort);
    setMonitorPage(1);
    setSearchParams((current) => {
      const params = new URLSearchParams(current);
      params.set('monitorRange', nextRange);
      params.set('monitorSort', nextSort);
      return params;
    });
    window.setTimeout(() => loadAccounts(undefined, { range: nextRange, sort: nextSort, page: 1 }), 0);
  }

  async function submitStatusChange(account, nextStatus, reason) {
    setStatusLoadingUid(account.uid);
    try {
      await api.put(`/admin/accounts/${account.uid}/status`, {
        status: nextStatus,
        reason: String(reason || '').trim(),
      });
      toast.success(`Account marked as ${nextStatus}.`);
      await loadAccounts();
      setStatusModal(null);
      setStatusReason('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update account status');
    } finally {
      setStatusLoadingUid(null);
    }
  }

  function openStatusModal(account, nextStatus) {
    if (nextStatus === 'active') {
      submitStatusChange(account, nextStatus, '');
      return;
    }

    setStatusReason(account.accountStatusReason || '');
    setStatusModal({
      account,
      nextStatus,
    });
  }

  async function handleStatusSubmit(event) {
    event.preventDefault();
    if (!statusModal) return;

    const trimmedReason = statusReason.trim();
    if (!trimmedReason) {
      toast.error(`Please enter a reason for ${statusModal.nextStatus}.`);
      return;
    }

    await submitStatusChange(statusModal.account, statusModal.nextStatus, trimmedReason);
  }

  return (
    <div>
      <div className="mb-7">
        <h1 className="font-display text-2xl font-bold text-white">Account Masterlist</h1>
        <div className="w-12 h-0.5 mt-2" style={{ background: 'linear-gradient(90deg,#D4AF37,transparent)' }} />
      </div>

      {/* Search */}
      <div className="glass-card rounded-2xl p-4 sm:p-6 mb-6">
        <form onSubmit={handleSearch} className="flex gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="glass-input flex-1 rounded-xl px-4 py-2.5 text-sm"
            placeholder="Search by name..."
          />
          <button
            type="submit"
            className="gold-btn rounded-xl py-2.5 px-5 text-sm"
          >
            Search
          </button>
        </form>
      </div>

      {/* Table Card */}
      <div className="glass-card rounded-2xl p-4 sm:p-6 overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>Accounts</p>
          <div className="flex items-center gap-2 justify-end w-full sm:w-auto">
            <PaginationButton onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} style={{ background: 'rgba(212,175,55,0.08)', color: 'rgba(212,175,55,0.8)', border: '1px solid rgba(212,175,55,0.15)' }}>Prev</PaginationButton>
            <span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{page} / {totalPages}</span>
            <PaginationButton onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} style={{ background: 'rgba(212,175,55,0.08)', color: 'rgba(212,175,55,0.8)', border: '1px solid rgba(212,175,55,0.15)' }}>Next</PaginationButton>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <div
              className="animate-spin rounded-full size-8 border-4"
              style={{ borderColor: 'rgba(212,175,55,0.15)', borderTopColor: 'rgba(212,175,55,0.75)' }}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  {['Account Name', 'Username', 'Code', 'Type', 'Status', 'Entry', 'Date Reg', 'Actions'].map(h => (
                    <th key={h} className="table-header py-3 px-4 text-left font-semibold text-xs uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {accounts.map((a, idx) => (
                  <tr
                    key={a.uid}
                    className="motion-safe:transition-colors"
                    style={{
                      background: idx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(212,175,55,0.05)'}
                    onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent'}
                  >
                    <td className="py-3 px-4 font-medium text-white/80">{a.fullname}</td>
                    <td className="py-3 px-4 text-white/60">{a.username}</td>
                    <td className="py-3 px-4 font-mono text-xs text-white/60">{a.activationcode}</td>
                    <td className="py-3 px-4">
                      <span
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        style={{ background: 'rgba(212,175,55,0.12)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.2)' }}
                      >
                        {a.accttypeName}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-1">
                        <span
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium w-fit"
                          style={statusStyle(a.accountStatus)}
                        >
                          {a.accountStatus === 'active' ? 'Active' : 'Suspended'}
                        </span>
                        {a.accountStatusReason ? (
                          <span className="text-[10px] text-white/35 max-w-[150px] truncate" title={a.accountStatusReason}>
                            {a.accountStatusReason}
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-white/40">{a.entryType}</td>
                    <td className="py-3 px-4 text-xs text-white/40">{formatDateTimeManila(a.datereg)}</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1.5 flex-wrap">
                        <button
                          onClick={() => navigate(`/admin/accounts/${a.uid}`)}
                          className="text-xs px-2.5 py-1 rounded-lg font-medium motion-safe:transition-colors cursor-pointer"
                          style={{ background: 'rgba(212,175,55,0.12)', color: goldText, border: '1px solid rgba(212,175,55,0.2)' }}
                         type="button">
                          Edit
                        </button>
                        <button
                          onClick={() => navigate(`/admin/genealogy?id=${a.uid}`)}
                          className="text-xs px-2.5 py-1 rounded-lg font-medium motion-safe:transition-colors cursor-pointer"
                          style={{ background: 'rgba(16,185,129,0.1)', color: greenText, border: '1px solid rgba(16,185,129,0.2)' }}
                         type="button">
                          Tree
                        </button>
                        <button
                          onClick={() => navigate(`/admin/accounts/${a.uid}/income`)}
                          className="text-xs px-2.5 py-1 rounded-lg font-medium motion-safe:transition-colors cursor-pointer"
                          style={{ background: 'rgba(59,130,246,0.1)', color: blueText, border: '1px solid rgba(59,130,246,0.25)' }}
                         type="button">
                          Income
                        </button>
                        <button
                          onClick={() => navigate(`/admin/accounts/${a.uid}/cd`)}
                          className="text-xs px-2.5 py-1 rounded-lg font-medium motion-safe:transition-colors cursor-pointer"
                          style={{ background: 'rgba(239,68,68,0.1)', color: redText, border: '1px solid rgba(239,68,68,0.25)' }}
                         type="button">
                          CD
                        </button>
                        {a.accountStatus === 'active' ? (
                          <>
                            <button
                              onClick={() => openStatusModal(a, 'suspended')}
                              disabled={statusLoadingUid === a.uid}
                              className="text-xs px-2.5 py-1 rounded-lg font-medium motion-safe:transition-colors cursor-pointer disabled:opacity-50"
                              style={{ background: 'rgba(239,68,68,0.1)', color: redText, border: '1px solid rgba(239,68,68,0.25)' }}
                             type="button">
                              Suspend
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => openStatusModal(a, 'active')}
                            disabled={statusLoadingUid === a.uid}
                            className="text-xs px-2.5 py-1 rounded-lg font-medium motion-safe:transition-colors cursor-pointer disabled:opacity-50"
                            style={{ background: 'rgba(74,222,128,0.1)', color: greenText, border: '1px solid rgba(74,222,128,0.22)' }}
                           type="button">
                            Reactivate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {accounts.length === 0 && (
                  <tr>
                    <td colSpan="8" className="py-12 text-center" style={{ color: 'rgba(255,255,255,0.25)' }}>
                      No accounts found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {statusModal ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
          onMouseDown={() => {
            if (statusLoadingUid) return;
            setStatusModal(null);
            setStatusReason('');
          }}
        >
          <form
            onSubmit={handleStatusSubmit}
            onMouseDown={(event) => event.stopPropagation()}
            className="w-full max-w-lg rounded-2xl p-6 shadow-2xl"
            style={{ background: '#12100a', border: '1px solid rgba(212,175,55,0.22)' }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em]" style={{ color: '#D4AF37' }}>
                  Account Controls
                </p>
                <h2 className="mt-2 font-display text-xl font-bold text-white">
                  Suspend account
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (statusLoadingUid) return;
                  setStatusModal(null);
                  setStatusReason('');
                }}
                className="rounded-lg px-2 py-1 text-sm text-white/60 transition-colors hover:text-white"
                aria-label="Close account status modal"
              >
                Close
              </button>
            </div>

            <p className="mt-3 text-sm leading-6" style={{ color: 'rgba(255,255,255,0.65)' }}>
              {`Suspend ${statusModal.account.username} to block login and member access until the account is reviewed and reactivated.`}
            </p>

            <div
              className="mt-4 rounded-xl px-4 py-3 text-xs leading-5"
              style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.18)', color: 'rgba(255,255,255,0.72)' }}
            >
              Active account <span className="text-white/90">{'->'}</span>{' '}
              Suspended account
              <br />
              Member sessions are revoked immediately and the reason is kept in the account audit trail.
            </div>

            <label className="mt-5 block text-sm font-semibold text-white">
              Reason <span style={{ color: '#f87171' }}>*</span>
            </label>
            <textarea
              value={statusReason}
              onChange={(event) => setStatusReason(event.target.value)}
              rows={4}
              placeholder={`Explain why ${statusModal.account.username} is being marked as ${statusModal.nextStatus}...`}
              className="mt-2 w-full rounded-xl px-4 py-3 text-sm outline-none resize-none"
              style={{
                background: 'rgba(255,255,255,0.04)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.12)',
              }}
            />

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  if (statusLoadingUid) return;
                  setStatusModal(null);
                  setStatusReason('');
                }}
                className="flex-1 rounded-xl py-2.5 text-sm font-medium"
                style={{ color: 'rgba(255,255,255,0.74)', border: '1px solid rgba(255,255,255,0.16)' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={statusLoadingUid === statusModal.account.uid}
                className="flex-1 rounded-xl py-2.5 text-sm font-semibold disabled:opacity-60"
                style={{
                  background: 'linear-gradient(135deg, rgba(239,68,68,0.9), rgba(248,113,113,0.9))',
                  color: 'white',
                }}
              >
                {statusLoadingUid === statusModal.account.uid
                  ? 'Saving...'
                  : 'Confirm Suspension'}
              </button>
            </div>
          </form>
        </div>
      ) : null}
      <div className="glass-card rounded-2xl p-4 sm:p-6 mt-6 overflow-hidden">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between mb-5">
          <div>
            <h2 className="font-display text-xl font-bold text-white">Registration Monitoring</h2>
            <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Weekly and monthly registration drilldown stays separate from the account masterlist for monitoring.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'All Monitoring' },
              { key: 'week', label: `Weekly New Register (${monitorSummary.weeklyRegistrations})` },
              { key: 'month', label: `Monthly Register (${monitorSummary.monthlyRegistrations})` },
            ].map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => applyMonitorFilter(option.key)}
                className="rounded-xl px-4 py-2 text-xs font-semibold border transition-colors"
                style={monitorRange === option.key
                  ? { background: 'rgba(212,175,55,0.16)', color: goldText, border: '1px solid rgba(212,175,55,0.3)' }
                  : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.72)', border: '1px solid rgba(255,255,255,0.12)' }}
              >
                {option.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => applyMonitorFilter(monitorRange, monitorSort === 'newest' ? 'oldest' : 'newest')}
              className="rounded-xl px-4 py-2 text-xs font-semibold border"
              style={{ background: 'rgba(59,130,246,0.08)', color: blueText, border: '1px solid rgba(59,130,246,0.25)' }}
            >
              Sort: {monitorSort === 'newest' ? 'Newest First' : 'Oldest First'}
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Filtered registrations
          </p>
          <div className="flex items-center gap-2 justify-end w-full sm:w-auto">
            <PaginationButton onClick={() => setMonitorPage((p) => Math.max(1, p - 1))} disabled={monitorPage <= 1} style={{ background: 'rgba(212,175,55,0.08)', color: 'rgba(212,175,55,0.8)', border: '1px solid rgba(212,175,55,0.15)' }}>Prev</PaginationButton>
            <span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{monitorPage} / {monitorTotalPages}</span>
            <PaginationButton onClick={() => setMonitorPage((p) => Math.min(monitorTotalPages, p + 1))} disabled={monitorPage >= monitorTotalPages} style={{ background: 'rgba(212,175,55,0.08)', color: 'rgba(212,175,55,0.8)', border: '1px solid rgba(212,175,55,0.15)' }}>Next</PaginationButton>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                {['Account Name', 'Username', 'Type', 'Entry', 'Status', 'Date Registered', 'Actions'].map((h) => (
                  <th key={h} className="table-header py-3 px-4 text-left font-semibold text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {monitorAccounts.map((account, idx) => (
                <tr key={`${account.uid}-${account.datereg}`} style={{ background: idx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                  <td className="py-3 px-4 font-medium text-white/80">{account.fullname}</td>
                  <td className="py-3 px-4 text-white/60">{account.username}</td>
                  <td className="py-3 px-4 text-white/70">{account.accttypeName}</td>
                  <td className="py-3 px-4 text-white/45">{account.entryType}</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium w-fit" style={statusStyle(account.accountStatus)}>
                      {account.accountStatus === 'active' ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs text-white/45">{formatDateTimeManila(account.datereg)}</td>
                  <td className="py-3 px-4">
                    <div className="flex gap-1.5 flex-wrap">
                      <button
                        onClick={() => navigate(`/admin/accounts/${account.uid}`)}
                        className="text-xs px-2.5 py-1 rounded-lg font-medium"
                        style={{ background: 'rgba(212,175,55,0.12)', color: goldText, border: '1px solid rgba(212,175,55,0.2)' }}
                       type="button">
                        Edit
                      </button>
                      <button
                        onClick={() => navigate(`/admin/genealogy?id=${account.uid}`)}
                        className="text-xs px-2.5 py-1 rounded-lg font-medium"
                        style={{ background: 'rgba(16,185,129,0.1)', color: greenText, border: '1px solid rgba(16,185,129,0.2)' }}
                       type="button">
                        Tree
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {monitorAccounts.length === 0 && (
                <tr>
                  <td colSpan="7" className="py-12 text-center" style={{ color: 'rgba(255,255,255,0.25)' }}>
                    No registrations matched the current monitoring filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
