import { useState, useEffect } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';

export default function Redeem() {
  const [records, setRecords] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => { loadData(); }, [page]);

  async function loadData() {
    setLoading(true);
    try {
      let url = `/admin/redeem?page=${page}`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;
      const res = await api.get(url);
      setRecords(res.data.records);
      setTotalPages(res.data.totalPages);
    } catch { } finally { setLoading(false); }
  }

  async function handleProcess(pid, uid) {
    try {
      await api.put(`/admin/redeem/${pid}/process`, { uid });
      toast.success('Marked as redeemed');
      loadData();
    } catch { toast.error('Failed'); }
  }

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
        <h1 className="font-display text-2xl font-bold text-white">Hi-Five Redeem Management</h1>
        <div className="w-12 h-0.5 mt-2" style={{ background: 'linear-gradient(90deg,#D4AF37,transparent)' }} />
      </div>

      {/* Filter */}
      <div className="glass-card rounded-2xl p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <div>
            <label className="label">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="glass-input rounded-xl px-4 py-2.5 text-sm mt-1.5"
            />
          </div>
          <div>
            <label className="label">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="glass-input rounded-xl px-4 py-2.5 text-sm mt-1.5"
            />
          </div>
          <button
            onClick={() => { setPage(1); loadData(); }}
            className="gold-btn rounded-xl py-2.5 px-5 text-sm"
          >
            Filter
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card rounded-2xl p-6 overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>Redeem Records</p>
          <div className="flex items-center gap-2 ml-auto">
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
                  {['Name', 'Username', 'Product', 'Bonus', 'Status', 'Date', 'Action'].map(h => (
                    <th key={h} className="table-header py-3 px-4 text-left font-semibold text-xs uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.map((r, idx) => (
                  <tr
                    key={r.pid}
                    className="motion-safe:transition-colors"
                    style={{ background: idx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(212,175,55,0.05)'}
                    onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent'}
                  >
                    <td className="py-3 px-4 font-medium text-white/80">{r.fullname}</td>
                    <td className="py-3 px-4 text-white/60">{r.username}</td>
                    <td className="py-3 px-4 text-white/60">{r.producttypeName}</td>
                    <td className="py-3 px-4 font-semibold" style={{ color: '#D4AF37' }}>{r.totalBonus}</td>
                    <td className="py-3 px-4">
                      <span
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
                        style={
                          r.redeemStatus === 1
                            ? { background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.22)' }
                            : { background: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.22)' }
                        }
                      >
                        {r.redeemStatusLabel}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-white/40">{r.redeemdate}</td>
                    <td className="py-3 px-4">
                      {r.redeemStatus !== 1 && (
                        <button
                          onClick={() => handleProcess(r.pid, r.uid)}
                          className="text-xs px-2.5 py-1 rounded-lg font-medium cursor-pointer motion-safe:transition-colors"
                          style={{ background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)' }}
                        >
                          Mark Redeemed
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {records.length === 0 && (
                  <tr>
                    <td colSpan="7" className="py-12 text-center" style={{ color: 'rgba(255,255,255,0.25)' }}>
                      No records found.
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
