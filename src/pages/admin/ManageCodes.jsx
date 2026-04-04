import { useState, useEffect } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

export default function ManageCodes() {
  const { admin } = useAuth();
  const [codes, setCodes] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [selectMode, setSelectMode] = useState(false);
  const [codeSearch, setCodeSearch] = useState('');
  const [targetUsername, setTargetUsername] = useState('');
  const [taggedAccount, setTaggedAccount] = useState(null);
  const canRelease = Number(admin?.rights) === 1 || Number(admin?.rights) === 3;

  useEffect(() => { loadCodes(); }, [page]);

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
    if (status === 0) return { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.1)' };
    if (status === 1) return { background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.22)' };
    return { background: 'rgba(99,102,241,0.12)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.22)' };
  };

  const PaginationBtn = ({ onClick, disabled, children }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className="text-sm py-1.5 px-3 rounded-lg font-medium motion-safe:transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
      style={{
        background: 'rgba(212,175,55,0.08)',
        color: 'rgba(212,175,55,0.8)',
        border: '1px solid rgba(212,175,55,0.15)',
      }}
    >
      {children}
    </button>
  );

  return (
    <div>
      <div className="mb-7">
        <h1 className="font-display text-2xl font-bold text-white">Manage Codes</h1>
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
          <div className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.45)' }}>
            {selected.length > 0 ? <span style={{ color: '#D4AF37' }}>{selected.length} codes selected</span> : 'Select codes below'}
          </div>
          <button
            onClick={() => setSelectMode(v => !v)}
            className="text-sm py-1.5 px-3 rounded-lg font-medium"
            style={{ background: selectMode ? 'rgba(212,175,55,0.14)' : 'rgba(255,255,255,0.05)', color: selectMode ? '#F2D06B' : 'rgba(255,255,255,0.65)', border: '1px solid rgba(212,175,55,0.15)' }}
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
            onClick={() => { setPage(1); loadCodes(); }}
            className="gold-btn rounded-xl py-2.5 px-5 text-sm"
          >
            Search
          </button>
          <button
            onClick={() => {
              setCodeSearch('');
              setPage(1);
              setTimeout(() => loadCodes(), 0);
            }}
            className="rounded-xl py-2.5 px-5 text-sm font-medium border"
            style={{ borderColor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.65)' }}
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
            style={{ borderColor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.65)' }}
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
          <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>
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
                    style={{ background: selected.includes(c.code) ? 'rgba(212,175,55,0.12)' : idx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent', cursor: selectMode ? 'pointer' : 'default' }}
                    onClick={() => { if (selectMode) toggleSelect(c.code); }}
                    onMouseEnter={e => { if (!selected.includes(c.code)) e.currentTarget.style.background = 'rgba(212,175,55,0.05)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = selected.includes(c.code) ? 'rgba(212,175,55,0.12)' : idx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent'; }}
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
                    <td className="py-3 px-4 text-xs text-white/40">{c.dategen}</td>
                  </tr>
                ))}
                {codes.length === 0 && (
                  <tr>
                    <td colSpan="5" className="py-12 text-center" style={{ color: 'rgba(255,255,255,0.25)' }}>
                      No codes found.
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
