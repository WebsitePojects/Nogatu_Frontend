import { useEffect, useState } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';

const RANK_BADGES = {
  1: { label: 'Supervisor 1', color: '#CD7F32' },
  2: { label: 'Supervisor 2', color: '#C0C0C0' },
  3: { label: 'Supervisor 3', color: '#FFD700' },
};

export default function Rankings() {
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [page]);

  async function loadData() {
    setLoading(true);
    try {
      const res = await api.get(`/admin/rankings?page=${page}`);
      setRows(res.data.rankings || []);
      setTotalPages(res.data.totalPages || 1);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  async function processIncentive(uid) {
    try {
      await api.put(`/admin/rankings/${uid}/process`);
      toast.success('Incentive marked as claimed');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to process incentive');
    }
  }

  return (
    <div>
      <div className="mb-7">
        <h1 className="font-display text-2xl font-bold text-white">Ranking Incentives</h1>
        <div className="w-12 h-0.5 mt-2" style={{ background: 'linear-gradient(90deg,#D4AF37,transparent)' }} />
      </div>

      <div className="glass-card rounded-2xl p-6 overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>Qualified members</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="text-sm py-1.5 px-3 rounded-lg font-medium disabled:opacity-40"
              style={{ background: 'rgba(212,175,55,0.08)', color: 'rgba(212,175,55,0.85)', border: '1px solid rgba(212,175,55,0.15)' }}
            >
              Prev
            </button>
            <span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{page} / {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="text-sm py-1.5 px-3 rounded-lg font-medium disabled:opacity-40"
              style={{ background: 'rgba(212,175,55,0.08)', color: 'rgba(212,175,55,0.85)', border: '1px solid rgba(212,175,55,0.15)' }}
            >
              Next
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
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
                  {['Member', 'Username', 'Rank', 'Qualified Date', 'Incentive Status', 'Action'].map((h) => (
                    <th key={h} className="table-header py-3 px-3 text-left text-xs uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => {
                  const badge = RANK_BADGES[Number(r.current_rank)] || { label: 'Unknown', color: '#9CA3AF' };
                  return (
                    <tr
                      key={`${r.uid}-${r.current_rank}-${idx}`}
                      style={{ background: idx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}
                      className="motion-safe:transition-colors hover:bg-white/[0.04]"
                    >
                      <td className="py-3 px-3 font-medium text-white/85">{r.firstname} {r.lastname}</td>
                      <td className="py-3 px-3 text-white/60">{r.username}</td>
                      <td className="py-3 px-3">
                        <span
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
                          style={{ background: `${badge.color}22`, color: badge.color, border: `1px solid ${badge.color}55` }}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-white/55">{r.rank_date || '—'}</td>
                      <td className="py-3 px-3">
                        <span
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
                          style={
                            Number(r.incentive_status) === 1
                              ? { background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.25)' }
                              : { background: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.25)' }
                          }
                        >
                          {Number(r.incentive_status) === 1 ? 'Claimed' : 'Pending'}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {Number(r.incentive_status) !== 1 && (
                          <button
                            onClick={() => processIncentive(r.uid)}
                            className="text-xs px-3 py-1 rounded-lg font-medium"
                            style={{ background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.25)' }}
                          >
                            Mark Claimed
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {rows.length === 0 && (
                  <tr>
                    <td colSpan="6" className="py-12 text-center" style={{ color: 'rgba(255,255,255,0.25)' }}>
                      No ranked members found.
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
