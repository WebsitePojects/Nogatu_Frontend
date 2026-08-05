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

// Per-member rankable-event ledger, live (polls /admin/rankings/:uid/events every 25s).
function RankingHistoryModal({ member, onClose }) {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ total: 0, totalPoints: 0, page: 1, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState('remaining'); // 'remaining' | 'full'

  useEffect(() => {
    let active = true;
    const load = (silent) => {
      if (!silent) setLoading(true);
      api.get(`/admin/rankings/${member.uid}/events?page=${page}&perPage=20&scope=${scope}`)
        .then((res) => {
          if (!active) return;
          setRows(res.data.events || []);
          setMeta({
            total: Number(res.data.total || 0),
            totalPoints: Number(res.data.totalPoints || 0),
            page: Number(res.data.page || 1),
            totalPages: Number(res.data.totalPages || 1),
          });
        })
        .catch(() => { if (active && !silent) setRows([]); })
        .finally(() => { if (active && !silent) setLoading(false); });
    };
    load(false);
    const interval = setInterval(() => load(true), 25000);
    return () => { active = false; clearInterval(interval); };
  }, [member.uid, page, scope]);

  const fmtTs = (ts) => {
    if (!ts) return '—';
    const d = new Date(String(ts).replace(' ', 'T'));
    return Number.isNaN(d.getTime()) ? String(ts) : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="portal-overlay fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="glass-card rounded-2xl w-full max-w-2xl max-h-[88vh] flex flex-col p-5"
        onClick={(e) => e.stopPropagation()}
        style={{ background: 'var(--portal-modal-bg, rgba(18,16,12,0.98))', border: '1px solid rgba(212,175,55,0.2)' }}
      >
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-display text-lg text-white">Ranking Transaction History</h3>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
              {member.firstname} {member.lastname} <span className="text-white/40">@{member.username}</span> · {fmtInt(meta.total)} event(s) · {fmtInt(meta.totalPoints)} pts · <span style={{ color: '#34d399' }}>live</span>
            </p>
            <div className="inline-flex rounded-lg overflow-hidden mt-2" style={{ border: '1px solid rgba(212,175,55,0.25)' }}>
              {[['remaining', 'Remaining'], ['full', 'Full ledger']].map(([val, label]) => (
                <button key={val} type="button" onClick={() => { setScope(val); setPage(1); }}
                  className="text-xs px-3 py-1 font-medium transition-colors"
                  style={scope === val ? { background: 'rgba(212,175,55,0.18)', color: '#D4AF37' } : { background: 'transparent', color: 'rgba(255,255,255,0.5)' }}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-white/60 hover:text-white text-2xl leading-none px-2" aria-label="Close">×</button>
        </div>
        {loading ? (
          <div className="flex justify-center py-10"><div className="size-8 border-4 rounded-full animate-spin" style={{ borderColor: 'rgba(212,175,55,0.2)', borderTopColor: '#D4AF37' }} /></div>
        ) : rows.length === 0 ? (
          <div className="py-10 text-center text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>No rankable transactions for this member yet.</div>
        ) : (
          <div className="overflow-y-auto">
            <table className="w-full text-sm">
              <thead><tr>{(scope === 'full' ? ['Date', 'Source', 'Level', 'Earned', 'Used', 'Left'] : ['Date', 'Source', 'Level', 'Points']).map((h) => <th key={h} className="table-header py-2 px-2 text-left text-xs uppercase tracking-wide">{h}</th>)}</tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.repurchaseId} className="border-t" style={{ borderColor: 'rgba(212,175,55,0.08)' }}>
                    <td className="py-2 px-2 text-white/60 text-xs">{fmtTs(r.eventTs)}</td>
                    <td className="py-2 px-2 text-white/80">{r.sourceName}{r.sourceUsername && <span className="text-white/40 text-xs ml-1">@{r.sourceUsername}</span>}</td>
                    <td className="py-2 px-2 text-white/60">L{r.depth}</td>
                    <td className="py-2 px-2 font-semibold" style={{ color: '#D4AF37' }}>{fmtInt(r.points)}</td>
                    {scope === 'full' && <td className="py-2 px-2 text-white/55">{fmtInt(r.consumed)}</td>}
                    {scope === 'full' && <td className="py-2 px-2" style={{ color: Number(r.remaining) > 0 ? '#34d399' : 'rgba(255,255,255,0.35)' }}>{fmtInt(r.remaining)}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between mt-3">
            <button type="button" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="text-xs px-3 py-1.5 rounded-lg disabled:opacity-40" style={{ color: '#D4AF37', background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)' }}>Prev</button>
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Page {meta.page} / {meta.totalPages}</span>
            <button type="button" disabled={page >= meta.totalPages} onClick={() => setPage((p) => p + 1)} className="text-xs px-3 py-1.5 rounded-lg disabled:opacity-40" style={{ color: '#D4AF37', background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)' }}>Next</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Rankings() {
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [historyTarget, setHistoryTarget] = useState(null);
  // Guards the fulfillment action against double-submit while a request is in flight.
  const [processingUid, setProcessingUid] = useState(null);

  useEffect(() => {
    loadData();
    // Live: silently re-fetch the ranking list every 25s + on focus (no refresh needed).
    const interval = setInterval(() => loadData({ silent: true }), 25000);
    const onFocus = () => loadData({ silent: true });
    window.addEventListener('focus', onFocus);
    return () => { clearInterval(interval); window.removeEventListener('focus', onFocus); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  async function loadData({ silent = false } = {}) {
    if (!silent) setLoading(true);
    try {
      const res = await api.get(`/admin/rankings?page=${page}`);
      setRows(res.data.rankings || []);
      setTotalPages(res.data.totalPages || 1);
    } catch {
      if (!silent) setRows([]);
    } finally {
      if (!silent) setLoading(false);
    }
  }

  // Records that the rank incentive was handed over as physical cash. This does NOT
  // credit the member's e-wallet — crediting on top of the cash handover would pay
  // the member twice. Marking is not reversible from this screen, so it is confirmed.
  async function markIncentiveHandedOver(row) {
    if (processingUid) return; // in-flight guard: never fire twice for one intent
    const name = [row.firstname, row.lastname].filter(Boolean).join(' ').trim()
      || row.username || `UID ${row.uid}`;
    const confirmed = window.confirm(
      `Mark the next pending rank incentive for ${name} as HANDED OVER?\n\n`
      + 'This records that the reward was given physically. It does NOT add anything '
      + "to the member's e-wallet.\n\nThis cannot be undone from this screen."
    );
    if (!confirmed) return;

    setProcessingUid(row.uid);
    try {
      const res = await api.put(`/admin/rankings/${row.uid}/process`);
      toast.success(res.data?.message || 'Rank achievement marked as fulfilled');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to mark the incentive as handed over');
    } finally {
      setProcessingUid(null);
    }
  }

  return (
    <div>
      <div className="mb-7">
        <h1 className="font-display text-2xl font-bold text-white">Ranking Incentives</h1>
        <div className="w-12 h-0.5 mt-2" style={{ background: 'linear-gradient(90deg,#D4AF37,transparent)' }} />
        <p className="mt-3 text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Rank rewards are handed over physically. Marking one here records the handover for audit —
          it does <span style={{ color: '#fbbf24', fontWeight: 600 }}>not</span> add anything to the
          member&apos;s e-wallet.
        </p>
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
                      <td className="p-3">
                        <button
                          type="button"
                          onClick={() => setHistoryTarget(row)}
                          className="text-left font-medium text-white/85 hover:text-[#D4AF37] hover:underline transition-colors cursor-pointer"
                          title="View ranking transaction history"
                        >
                          {row.firstname} {row.lastname}
                        </button>
                        <span className="block text-[10px] mt-0.5" style={{ color: 'rgba(212,175,55,0.6)' }}>View history →</span>
                      </td>
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
                            : (Number(row.current_rank || 0) > 0 ? 'Handed over' : 'Not ranked')}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setHistoryTarget(row)}
                            className="text-xs px-2.5 py-1 rounded-lg font-medium"
                            style={{ background: 'rgba(212,175,55,0.1)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.22)' }}
                            type="button">
                            History
                          </button>
                          {Number(row.pendingAchievementCount || 0) > 0 && !row.blockedByPackageGate && (
                            <button
                              onClick={() => markIncentiveHandedOver(row)}
                              disabled={processingUid !== null}
                              aria-label={`Mark rank incentive for ${row.username} as handed over`}
                              title="Records the physical cash handover. Does not credit the e-wallet."
                              className="text-xs px-3 py-1 rounded-lg font-medium disabled:cursor-not-allowed"
                              style={{
                                background: 'rgba(16,185,129,0.12)',
                                color: '#34d399',
                                border: '1px solid rgba(16,185,129,0.25)',
                                opacity: processingUid !== null ? 0.45 : 1,
                              }}
                             type="button">
                              {processingUid === row.uid ? 'Marking…' : 'Mark Cash Handed Over'}
                            </button>
                          )}
                          {row.blockedByPackageGate && (
                            <span className="text-xs" style={{ color: 'rgba(245,158,11,0.85)' }}>
                              Gate blocked
                            </span>
                          )}
                        </div>
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

      {historyTarget && (
        <RankingHistoryModal member={historyTarget} onClose={() => setHistoryTarget(null)} />
      )}
    </div>
  );
}
