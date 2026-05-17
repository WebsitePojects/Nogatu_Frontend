import { useState, useEffect } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

export default function ManageCodes() {
  const { admin } = useAuth();
  const { isDarkMode } = useTheme();
  const [codes, setCodes] = useState([]);
  const [historyRows, setHistoryRows] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [selectMode, setSelectMode] = useState(false);
  const [codeSearch, setCodeSearch] = useState('');
  const [targetUsername, setTargetUsername] = useState('');
  const [taggedAccount, setTaggedAccount] = useState(null);
  const canRelease = Number(admin?.rights) === 1 || Number(admin?.rights) === 3;

  const headingColor = isDarkMode ? '#ffffff' : '#111827';
  const textMuted = isDarkMode ? 'rgba(255,255,255,0.45)' : 'rgba(71,85,105,0.9)';
  const textSubtle = isDarkMode ? 'rgba(255,255,255,0.65)' : 'rgba(51,65,85,0.82)';
  const subtleBorder = isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(148,163,184,0.35)';
  const subtleButtonBg = isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(248,250,252,0.9)';
  const rowAlt = isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(148,163,184,0.08)';
  const rowHover = isDarkMode ? 'rgba(212,175,55,0.05)' : 'rgba(212,175,55,0.11)';
  const rowSelected = isDarkMode ? 'rgba(212,175,55,0.12)' : 'rgba(212,175,55,0.2)';
  const dateColor = isDarkMode ? 'rgba(255,255,255,0.4)' : 'rgba(71,85,105,0.82)';

  useEffect(() => { loadCodes(); }, [page]);
  useEffect(() => { loadHistory(); }, [historyPage]);

  async function loadCodes() {
    setLoading(true);
    try {
      const q = codeSearch.trim();
      const url = q
        ? `/admin/codes?page=${page}&q=${encodeURIComponent(q)}`
        : `/admin/codes?page=${page}`;
      const res = await api.get(url);
      setCodes(res.data.codes);
      setTotalPages(res.data.totalPages);
    } catch { } finally { setLoading(false); }
  }

  async function loadHistory() {
    setHistoryLoading(true);
    try {
      const q = codeSearch.trim();
      const url = q
        ? `/admin/codes/history?page=${historyPage}&q=${encodeURIComponent(q)}`
        : `/admin/codes/history?page=${historyPage}`;
      const res = await api.get(url);
      setHistoryRows(res.data.rows || []);
      setHistoryTotalPages(res.data.totalPages || 1);
    } catch {
      setHistoryRows([]);
    } finally {
      setHistoryLoading(false);
    }
  }

  function toggleSelect(code) {
    setSelected(prev => prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]);
  }

  function toggleSelectAllCurrentPage() {
    const pageCodes = codes.map(c => c.code);
    const allSelected = pageCodes.every(code => selected.includes(code));
    setSelected(allSelected ? selected.filter(code => !pageCodes.includes(code)) : Array.from(new Set([...selected, ...pageCodes])));
  }

  async function handleRelease() {
    if (!canRelease) return toast.error('Release is restricted to Administrator and BOD');
    if (selected.length === 0) return toast.error('Select codes to release');
    try {
      const res = await api.post('/admin/codes/release', { codes: selected });
      toast.success(`${res.data.released} code(s) released`);
      setSelected([]);
      loadCodes();
      loadHistory();
    } catch (err) { toast.error(err.response?.data?.error || 'Release failed'); }
  }

  async function handleTransfer() {
    const transferTo = taggedAccount?.username || targetUsername.trim();
    if (!transferTo || selected.length === 0) return toast.error('Tag an account and select codes');
    try {
      const res = await api.post('/admin/codes/transfer', { targetUsername: transferTo, codes: selected });
      toast.success(`${res.data.transferred} code(s) transferred`);
      setSelected([]);
      setTargetUsername('');
      setTaggedAccount(null);
      loadCodes();
      loadHistory();
    } catch (err) { toast.error(err.response?.data?.error || 'Transfer failed'); }
  }

  async function handleTagAccount() {
    const username = targetUsername.trim();
    if (!username) return toast.error('Enter username to search');

    try {
      const res = await api.get(`/admin/codes/lookup-account?username=${encodeURIComponent(username)}`);
      setTaggedAccount(res.data.account);
      setTargetUsername(res.data.account.username);
      toast.success(`Tagged account: ${res.data.account.username}`);
    } catch (err) {
      setTaggedAccount(null);
      toast.error(err.response?.data?.error || 'Account not found');
    }
  }

  function clearTag() {
    setTaggedAccount(null);
    setTargetUsername('');
  }

  const statusStyle = (status) => {
    if (status === 0) {
      return isDarkMode
        ? { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.1)' }
        : { background: 'rgba(148,163,184,0.16)', color: '#475569', border: '1px solid rgba(148,163,184,0.35)' };
    }
    if (status === 1) {
      return isDarkMode
        ? { background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.22)' }
        : { background: 'rgba(16,185,129,0.15)', color: '#047857', border: '1px solid rgba(16,185,129,0.32)' };
    }
    return isDarkMode
      ? { background: 'rgba(99,102,241,0.12)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.22)' }
      : { background: 'rgba(99,102,241,0.14)', color: '#4338ca', border: '1px solid rgba(99,102,241,0.32)' };
  };

  const PaginationBtn = ({ onClick, disabled, children }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className="text-sm py-1.5 px-3 rounded-lg font-medium motion-safe:transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
      style={{
        background: isDarkMode ? 'rgba(212,175,55,0.08)' : 'rgba(212,175,55,0.14)',
        color: isDarkMode ? 'rgba(212,175,55,0.8)' : '#7a5c08',
        border: isDarkMode ? '1px solid rgba(212,175,55,0.15)' : '1px solid rgba(212,175,55,0.3)',
      }}
    >
      {children}
    </button>
  );

  return (
    <div>
      <div className="mb-7">
        <h1 className="font-display text-2xl font-bold" style={{ color: headingColor }}>Manage Codes</h1>
        <div className="w-12 h-0.5 mt-2" style={{ background: 'linear-gradient(90deg,#D4AF37,transparent)' }} />
      </div>

      {!canRelease && (
        <div
          className="glass-card rounded-2xl p-4 mb-6 text-sm"
          style={{ border: '1px solid rgba(59,130,246,0.2)', color: '#93c5fd', background: 'rgba(59,130,246,0.08)' }}
        >
          Cashier mode: transfer-only access is enabled. Code release is disabled for this role.
        </div>
      )}

      {/* Actions Bar */}
      <div className="glass-card rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="text-sm font-medium" style={{ color: textMuted }}>
            {selected.length > 0 ? <span style={{ color: '#D4AF37' }}>{selected.length} codes selected</span> : 'Select codes below'}
          </div>
          <button
            onClick={() => setSelectMode(v => !v)}
            className="text-sm py-1.5 px-3 rounded-lg font-medium"
            style={{
              background: selectMode ? 'rgba(212,175,55,0.14)' : subtleButtonBg,
              color: selectMode ? '#F2D06B' : textSubtle,
              border: isDarkMode ? '1px solid rgba(212,175,55,0.15)' : '1px solid rgba(148,163,184,0.35)',
            }}
          >
            {selectMode ? 'Exit Selection Mode' : 'Select Multiple'}
          </button>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 items-end mb-4">
          <div className="flex-1">
            <label className="label">Search Code</label>
            <input
              type="text"
              value={codeSearch}
              onChange={(e) => setCodeSearch(e.target.value)}
              className="glass-input w-full rounded-xl px-4 py-2.5 text-sm mt-1.5"
              placeholder="Enter code"
            />
          </div>
          <button
            onClick={() => { setPage(1); setHistoryPage(1); loadCodes(); loadHistory(); }}
            className="gold-btn rounded-xl py-2.5 px-5 text-sm"
          >
            Search
          </button>
          <button
            onClick={() => {
              setCodeSearch('');
              setPage(1);
              setHistoryPage(1);
              setTimeout(() => { loadCodes(); loadHistory(); }, 0);
            }}
            className="rounded-xl py-2.5 px-5 text-sm font-medium border"
            style={{ borderColor: subtleBorder, color: textSubtle, background: subtleButtonBg }}
          >
            Clear
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1">
            <label className="label">Transfer to Account</label>
            <input
              type="text"
              value={targetUsername}
              onChange={(e) => setTargetUsername(e.target.value)}
              className="glass-input w-full rounded-xl px-4 py-2.5 text-sm mt-1.5"
              placeholder="Username"
            />
          </div>
          <button
            onClick={handleTagAccount}
            className="rounded-xl py-2.5 px-5 text-sm font-medium border"
            style={{ borderColor: 'rgba(59,130,246,0.35)', color: '#93c5fd', background: 'rgba(59,130,246,0.1)' }}
          >
            Search Account
          </button>
          <button
            onClick={clearTag}
            className="rounded-xl py-2.5 px-5 text-sm font-medium border"
            style={{ borderColor: subtleBorder, color: textSubtle, background: subtleButtonBg }}
          >
            Clear Tag
          </button>
          <button
            onClick={handleTransfer}
            disabled={selected.length === 0}
            className="gold-btn rounded-xl py-2.5 px-5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Transfer ({selected.length})
          </button>
          <button
            onClick={toggleSelectAllCurrentPage}
            className="rounded-xl py-2.5 px-5 text-sm font-medium border"
            style={{ borderColor: 'rgba(212,175,55,0.18)', color: 'rgba(212,175,55,0.85)' }}
          >
            Select All Page
          </button>
          {canRelease && (
            <button
              onClick={handleRelease}
              disabled={selected.length === 0}
              className="btn-success rounded-xl py-2.5 px-5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Release ({selected.length})
            </button>
          )}
        </div>

        {taggedAccount && (
          <div
            className="mt-4 rounded-xl px-4 py-3 text-sm"
            style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#a7f3d0' }}
          >
            Tagged account: <strong>{taggedAccount.username}</strong> ({taggedAccount.fullname})
          </div>
        )}
      </div>

      {/* Codes Table */}
      <div className="glass-card rounded-2xl p-6 overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium" style={{ color: textMuted }}>
            {selected.length > 0
              ? <span style={{ color: '#D4AF37' }}>{selected.length} selected</span>
              : 'Select codes below'}
          </p>
          <div className="flex items-center gap-2">
            <PaginationBtn onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>Prev</PaginationBtn>
            <span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{page} / {totalPages}</span>
            <PaginationBtn onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Next</PaginationBtn>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <div
              className="animate-spin rounded-full h-8 w-8 border-4"
              style={{ borderColor: 'rgba(212,175,55,0.15)', borderTopColor: 'rgba(212,175,55,0.75)' }}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="table-header py-3 px-4">
                    <input
                      type="checkbox"
                      onChange={(e) => setSelected(e.target.checked ? codes.map(c => c.code) : [])}
                      className="rounded"
                      style={{ accentColor: '#D4AF37' }}
                    />
                  </th>
                  {['Code', 'Product', 'Status', 'Generated'].map(h => (
                    <th key={h} className="table-header py-3 px-4 text-left font-semibold text-xs uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {codes.map((c, idx) => (
                  <tr
                    key={c.code}
                    className="motion-safe:transition-colors"
                    style={{ background: selected.includes(c.code) ? rowSelected : idx % 2 === 0 ? rowAlt : 'transparent', cursor: selectMode ? 'pointer' : 'default' }}
                    onClick={() => { if (selectMode) toggleSelect(c.code); }}
                    onMouseEnter={e => { if (!selected.includes(c.code)) e.currentTarget.style.background = rowHover; }}
                    onMouseLeave={e => { e.currentTarget.style.background = selected.includes(c.code) ? rowSelected : idx % 2 === 0 ? rowAlt : 'transparent'; }}
                  >
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={selected.includes(c.code)}
                        onChange={() => toggleSelect(c.code)}
                        style={{ accentColor: '#D4AF37' }}
                      />
                    </td>
                    <td className="py-3 px-4 font-mono text-xs" style={{ color: '#F2D06B' }}>{c.code}</td>
                    <td className="py-3 px-4 text-white/70">{c.producttypeName}</td>
                    <td className="py-3 px-4">
                      <span
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
                        style={statusStyle(c.codestatus)}
                      >
                        {c.statusLabel}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs" style={{ color: dateColor }}>{c.dategen}</td>
                  </tr>
                ))}
                {codes.length === 0 && (
                  <tr>
                    <td colSpan="5" className="py-12 text-center" style={{ color: isDarkMode ? 'rgba(255,255,255,0.25)' : 'rgba(71,85,105,0.7)' }}>
                      No codes found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="glass-card rounded-2xl p-6 overflow-hidden mt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-semibold" style={{ color: headingColor }}>Activation Code History</p>
            <p className="text-xs mt-1" style={{ color: textMuted }}>Generated, released, transferred, upgraded, and maintenance usage events.</p>
          </div>
          <div className="flex items-center gap-2">
            <PaginationBtn onClick={() => setHistoryPage(p => Math.max(1, p - 1))} disabled={historyPage <= 1}>Prev</PaginationBtn>
            <span className="text-sm" style={{ color: isDarkMode ? 'rgba(255,255,255,0.5)' : 'rgba(71,85,105,0.8)' }}>{historyPage} / {historyTotalPages}</span>
            <PaginationBtn onClick={() => setHistoryPage(p => Math.min(historyTotalPages, p + 1))} disabled={historyPage >= historyTotalPages}>Next</PaginationBtn>
          </div>
        </div>

        {historyLoading ? (
          <div className="flex justify-center py-10">
            <div
              className="animate-spin rounded-full h-8 w-8 border-4"
              style={{ borderColor: 'rgba(212,175,55,0.15)', borderTopColor: 'rgba(212,175,55,0.75)' }}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  {['Code', 'Event', 'Summary', 'Date'].map(h => (
                    <th key={h} className="table-header py-3 px-4 text-left font-semibold text-xs uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {historyRows.map((row, idx) => (
                  <tr
                    key={`${row.code}-${row.processKey || row.createdAt || idx}`}
                    style={{ background: idx % 2 === 0 ? rowAlt : 'transparent' }}
                  >
                    <td className="py-3 px-4 font-mono text-xs" style={{ color: '#F2D06B' }}>{row.code}</td>
                    <td className="py-3 px-4">
                      <span
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
                        style={isDarkMode
                          ? { background: 'rgba(99,102,241,0.12)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.22)' }
                          : { background: 'rgba(99,102,241,0.14)', color: '#4338ca', border: '1px solid rgba(99,102,241,0.32)' }}
                      >
                        {row.eventLabel}
                      </span>
                    </td>
                    <td className="py-3 px-4" style={{ color: textSubtle }}>{row.summary}</td>
                    <td className="py-3 px-4 text-xs" style={{ color: dateColor }}>
                      {row.createdAt ? new Date(row.createdAt).toLocaleString('en-PH', { timeZone: 'Asia/Manila' }) : '-'}
                    </td>
                  </tr>
                ))}
                {historyRows.length === 0 && (
                  <tr>
                    <td colSpan="4" className="py-12 text-center" style={{ color: isDarkMode ? 'rgba(255,255,255,0.25)' : 'rgba(71,85,105,0.7)' }}>
                      No activation history found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
