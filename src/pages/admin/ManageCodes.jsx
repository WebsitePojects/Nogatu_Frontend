import { useState, useEffect } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';

export default function ManageCodes() {
  const [codes, setCodes] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [targetUsername, setTargetUsername] = useState('');

  useEffect(() => { loadCodes(); }, [page]);

  async function loadCodes() {
    setLoading(true);
    try {
      const res = await api.get(`/admin/codes?page=${page}`);
      setCodes(res.data.codes);
      setTotalPages(res.data.totalPages);
    } catch { } finally { setLoading(false); }
  }

  function toggleSelect(code) {
    setSelected(prev => prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]);
  }

  async function handleRelease() {
    if (selected.length === 0) return toast.error('Select codes to release');
    try {
      const res = await api.post('/admin/codes/release', { codes: selected });
      toast.success(`${res.data.released} code(s) released`);
      setSelected([]);
      loadCodes();
    } catch (err) { toast.error(err.response?.data?.error || 'Release failed'); }
  }

  async function handleTransfer() {
    if (!targetUsername || selected.length === 0) return toast.error('Enter username and select codes');
    try {
      const res = await api.post('/admin/codes/transfer', { targetUsername, codes: selected });
      toast.success(`${res.data.transferred} code(s) transferred`);
      setSelected([]);
      setTargetUsername('');
      loadCodes();
    } catch (err) { toast.error(err.response?.data?.error || 'Transfer failed'); }
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

      {/* Actions Bar */}
      <div className="glass-card rounded-2xl p-6 mb-6">
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
            onClick={handleTransfer}
            disabled={selected.length === 0}
            className="gold-btn rounded-xl py-2.5 px-5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Transfer ({selected.length})
          </button>
          <button
            onClick={handleRelease}
            disabled={selected.length === 0}
            className="btn-success rounded-xl py-2.5 px-5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Release ({selected.length})
          </button>
        </div>
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
                    style={{ background: idx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(212,175,55,0.05)'}
                    onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent'}
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
