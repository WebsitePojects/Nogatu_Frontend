import { useState, useEffect } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';
import { HiOutlineKey, HiOutlineChevronLeft, HiOutlineChevronRight } from 'react-icons/hi';

const STATUS_STYLES = {
  0: { label: 'Unreleased', bg: 'rgba(100,116,139,0.1)', color: '#64748b', border: 'rgba(100,116,139,0.2)' },
  1: { label: 'Available',  bg: 'rgba(34,197,94,0.1)',   color: '#4ade80', border: 'rgba(34,197,94,0.2)'  },
  2: { label: 'Used',       bg: 'rgba(99,102,241,0.1)',  color: '#818cf8', border: 'rgba(99,102,241,0.2)' },
};

function Spinner() {
  return (
    <div className="flex justify-center py-12">
      <div className="w-8 h-8 rounded-full border-[3px] animate-spin" style={{ borderColor: 'rgba(212,175,55,0.12)', borderTopColor: '#D4AF37' }} />
    </div>
  );
}

export default function ActivationCodes() {
  const [codes, setCodes]           = useState([]);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading]       = useState(true);
  const [selected, setSelected]     = useState([]);
  const [targetUsername, setTargetUsername] = useState('');

  useEffect(() => { loadCodes(); }, [page]);

  async function loadCodes() {
    setLoading(true);
    try {
      const res = await api.get(`/codes?page=${page}`);
      setCodes(res.data.codes);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
    } catch { } finally { setLoading(false); }
  }

  function toggleSelect(code) {
    setSelected(prev => prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]);
  }

  async function handleTransfer() {
    if (!targetUsername) return toast.error('Enter a target username');
    if (selected.length === 0) return toast.error('Select at least one code');
    try {
      const res = await api.post('/codes/transfer', { targetUsername, codes: selected });
      toast.success(`${res.data.transferred} code(s) transferred to ${res.data.targetName}`);
      setSelected([]);
      setTargetUsername('');
      loadCodes();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Transfer failed');
    }
  }

  async function handleMaintenance(code, transType) {
    try {
      await api.post('/codes/maintenance', { code, transType });
      toast.success('Code activated successfully');
      loadCodes();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Activation failed');
    }
  }

  async function handleUpgrade(code) {
    try {
      const res = await api.post('/codes/upgrade', { code });
      toast.success(`Account upgraded to ${res.data.newAccountTypeName}!`);
      loadCodes();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upgrade failed');
    }
  }

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Activation Codes</h1>
        <div className="w-10 h-0.5 mt-2 rounded-full" style={{ background: 'linear-gradient(90deg,#D4AF37,transparent)' }} />
      </div>

      {/* Transfer panel */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="font-display text-sm font-semibold text-white mb-4">Transfer Codes</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={targetUsername}
            onChange={(e) => setTargetUsername(e.target.value)}
            className="glass-input flex-1"
            placeholder="Enter target username"
          />
          <button
            onClick={handleTransfer}
            disabled={!targetUsername || selected.length === 0}
            className="gold-btn py-2.5 px-5 rounded-xl text-sm whitespace-nowrap disabled:opacity-40"
          >
            Transfer ({selected.length})
          </button>
        </div>
      </div>

      {/* Codes table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        {/* Table header bar */}
        <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: '1px solid rgba(212,175,55,0.08)' }}>
          <div className="flex items-center gap-2">
            <HiOutlineKey className="w-4 h-4" style={{ color: 'rgba(212,175,55,0.5)' }} />
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{total} codes total</p>
            {selected.length > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-lg" style={{ background: 'rgba(212,175,55,0.1)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.2)' }}>
                {selected.length} selected
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg disabled:opacity-30 hover:bg-white/[0.06] transition-colors"
              style={{ color: 'rgba(255,255,255,0.5)' }}
            >
              <HiOutlineChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs px-2 py-1 rounded-lg" style={{ background: 'rgba(212,175,55,0.08)', color: 'rgba(212,175,55,0.7)' }}>
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg disabled:opacity-30 hover:bg-white/[0.06] transition-colors"
              style={{ color: 'rgba(255,255,255,0.5)' }}
            >
              <HiOutlineChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {loading ? <Spinner /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[580px]">
              <thead>
                <tr>
                  <th className="table-header py-3 px-4 w-12">Sel</th>
                  <th className="table-header py-3 px-4">Code</th>
                  <th className="table-header py-3 px-4">Product Type</th>
                  <th className="table-header py-3 px-4">Status</th>
                  <th className="table-header py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {codes.map((c, i) => {
                  const statusStyle = STATUS_STYLES[c.codestatus] || STATUS_STYLES[0];
                  const isSelected = selected.includes(c.code);
                  return (
                    <tr
                      key={c.code}
                      style={{
                        background: isSelected ? 'rgba(212,175,55,0.06)' : i % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent',
                        borderBottom: '1px solid rgba(212,175,55,0.05)',
                        borderLeft: isSelected ? '2px solid rgba(212,175,55,0.4)' : '2px solid transparent',
                      }}
                      className="hover:bg-white/[0.03] transition-colors"
                    >
                      <td className="py-3 px-4 text-center">
                        {c.codestatus === 1 && (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(c.code)}
                            style={{ accentColor: '#D4AF37', cursor: 'pointer' }}
                          />
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs" style={{ color: 'rgba(212,175,55,0.8)', letterSpacing: '0.05em' }}>
                        {c.code}
                      </td>
                      <td className="py-3 px-4 text-sm" style={{ color: 'rgba(255,255,255,0.65)' }}>{c.producttypeName}</td>
                      <td className="py-3 px-4">
                        <span
                          className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold"
                          style={{ background: statusStyle.bg, color: statusStyle.color, border: `1px solid ${statusStyle.border}` }}
                        >
                          {c.statusLabel}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {c.codestatus === 1 && c.producttype >= 100 && (
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => handleMaintenance(c.code, 1)}
                              className="text-xs px-2.5 py-1 rounded-lg font-medium transition-colors"
                              style={{ background: 'rgba(34,197,94,0.1)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.2)' }}
                              onMouseEnter={e => e.currentTarget.style.background = 'rgba(34,197,94,0.18)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'rgba(34,197,94,0.1)'}
                            >
                              Maintenance
                            </button>
                            <button
                              onClick={() => handleMaintenance(c.code, 2)}
                              className="text-xs px-2.5 py-1 rounded-lg font-medium transition-colors"
                              style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)' }}
                              onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.18)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'rgba(99,102,241,0.1)'}
                            >
                              Hi-Five
                            </button>
                          </div>
                        )}
                        {c.codestatus === 1 && c.producttype < 100 && (
                          <button
                            onClick={() => handleUpgrade(c.code)}
                            className="text-xs px-2.5 py-1 rounded-lg font-medium transition-colors"
                            style={{ background: 'rgba(212,175,55,0.1)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.2)' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(212,175,55,0.18)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(212,175,55,0.1)'}
                          >
                            Upgrade
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {codes.length === 0 && (
                  <tr>
                    <td colSpan="5" className="py-14 text-center">
                      <HiOutlineKey className="w-8 h-8 mx-auto mb-2" style={{ color: 'rgba(212,175,55,0.2)' }} />
                      <p style={{ color: 'rgba(255,255,255,0.3)' }}>No activation codes found.</p>
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
