import { useEffect, useState } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';

const fmtInt = (n) => Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 0 });

function formatQualifiedDate(value) {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

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
      const res = await api.put(`/admin/rankings/${uid}/process`);
      toast.success(res.data?.message || 'Ranking bonus claim released');
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

      <div className="glass-card rounded-2xl p-4 sm:p-6 overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>Ranking race members</p>
          <div className="flex items-center gap-2 justify-end w-full sm:w-auto">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="text-sm py-1.5 px-3 rounded-lg font-medium disabled:opacity-40"
              style={{ background: 'rgba(212,175,55,0.08)', color: 'rgba(212,175,55,0.85)', border: '1px solid rgba(212,175,55,0.15)' }}
             type="button">
              Prev
            </button>
            <span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{page} / {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="text-sm py-1.5 px-3 rounded-lg font-medium disabled:opacity-40"
              style={{ background: 'rgba(212,175,55,0.08)', color: 'rgba(212,175,55,0.85)', border: '1px solid rgba(212,175,55,0.15)' }}
             type="button">
              Next
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
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
                  {['Top', 'Member', 'Username', 'Package', 'Gate', 'Current Rank', 'Gross', 'Verified', 'Contributors', 'Last Repurchase', 'Consumed', 'Remaining', 'Qualified Date', 'Claim Status', 'Action'].map((heading) => (
                    <th key={heading} className="table-header p-3 text-left text-xs uppercase tracking-wide">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => {
                  const badge = {
                    label: row.rankLabel || 'Unranked',
                    color: row.rankColor || '#9CA3AF',
                  };

                  return (
                    <tr
                      key={`${row.uid}-${row.current_rank}-${index}`}
                      style={{ background: index % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}
                      className="motion-safe:transition-colors hover:bg-white/[0.04]"
                    >
                      <td className="p-3">
                        <span
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
                          style={{ background: 'rgba(212,175,55,0.12)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.25)' }}
                        >
                          Top {Number(row.position || index + 1)}
                        </span>
                      </td>
                      <td className="p-3 font-medium text-white/85">{row.firstname} {row.lastname}</td>
                      <td className="p-3 text-white/60">{row.username}</td>
                      <td className="p-3">
                        <span
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
                          style={{ background: 'rgba(212,175,55,0.12)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.25)' }}
                        >
                          {row.packageLabel || 'Unknown'}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-col gap-1">
                          <span
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
                            style={
                              row.rankingEligible
                                ? { background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.25)' }
                                : { background: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.25)' }
                            }
                          >
                            {row.rankingEligible ? `Up to ${row.packageRankMaxLabel || 'ceiling'}` : 'Locked'}
                          </span>
                          {row.blockedByPackageGate && row.upgradeRequiredPackageLabel && (
                            <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
                              Upgrade: {row.upgradeRequiredPackageLabel}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <span
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
                          style={{ background: `${badge.color}22`, color: badge.color, border: `1px solid ${badge.color}55` }}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="text-white/85 font-medium">{fmtInt(row.grossRankablePoints ?? row.basisPoints)}</div>
                      </td>
                      <td className="p-3">
                        {/* Verified = actual sum from repurchase records — should match Gross */}
                        {row.verifiedRepurchasePoints != null ? (
                          <div className="flex flex-col gap-0.5">
                            <span
                              className="font-medium text-sm"
                              style={{ color: row.verifiedRepurchasePoints === (row.grossRankablePoints ?? row.basisPoints) ? '#34d399' : '#fbbf24' }}
                            >
                              {fmtInt(row.verifiedRepurchasePoints)}
                            </span>
                            {row.verifiedRepurchasePoints !== (row.grossRankablePoints ?? row.basisPoints) && (
                              <span className="text-[10px]" style={{ color: 'rgba(251,191,36,0.7)' }}>
                                snapshot drift
                              </span>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: 'rgba(255,255,255,0.3)' }}>—</span>
                        )}
                      </td>
                      <td className="p-3">
                        {row.repurchaseContributorCount != null ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="text-white/80 font-medium">{fmtInt(row.repurchaseContributorCount)}</span>
                            <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                              {fmtInt(row.repurchaseEvents)} events
                            </span>
                          </div>
                        ) : (
                          <span style={{ color: 'rgba(255,255,255,0.3)' }}>—</span>
                        )}
                      </td>
                      <td className="p-3 text-white/60">
                        {row.lastRepurchaseDate ? formatQualifiedDate(row.lastRepurchaseDate) : <span style={{ color: 'rgba(255,255,255,0.25)' }}>No activity</span>}
                      </td>
                      <td className="p-3 text-white/60">{fmtInt(row.consumedPoints)}</td>
                      <td className="p-3 text-white/60">{fmtInt(row.remainingRankablePoints)}</td>
                      <td className="p-3 text-white/55">{formatQualifiedDate(row.qualifiedDate || row.rank_date)}</td>
                      <td className="p-3">
                        <span
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
                          style={
                            Number(row.pendingAchievementCount || 0) === 0 && Number(row.current_rank || 0) > 0
                              ? { background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.25)' }
                              : { background: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.25)' }
                          }
                        >
                          {Number(row.pendingAchievementCount || 0) > 0
                            ? `${fmtInt(row.pendingAchievementCount)} pending`
                            : (Number(row.current_rank || 0) > 0 ? 'Released' : 'Not ranked')}
                        </span>
                      </td>
                      <td className="p-3">
                        {Number(row.pendingAchievementCount || 0) > 0 && !row.blockedByPackageGate && (
                          <button
                            onClick={() => processIncentive(row.uid)}
                            className="text-xs px-3 py-1 rounded-lg font-medium"
                            style={{ background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.25)' }}
                           type="button">
                            Release Next Claim
                          </button>
                        )}
                        {row.blockedByPackageGate && (
                          <span className="text-xs" style={{ color: 'rgba(245,158,11,0.85)' }}>
                            Gate blocked
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {rows.length === 0 && (
                  <tr>
                    <td colSpan="15" className="py-12 text-center" style={{ color: 'rgba(255,255,255,0.25)' }}>
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
