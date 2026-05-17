import { useState, useEffect } from 'react';
import api from '../../api';
import { HiOutlineChartBar, HiOutlineArrowLeft, HiOutlineArrowRight } from 'react-icons/hi';

const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtInt = (n) => Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 0 });

function Spinner() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <div className="w-10 h-10 rounded-full border-[3px] animate-spin" style={{ borderColor: 'rgba(212,175,55,0.12)', borderTopColor: '#D4AF37' }} />
    </div>
  );
}

const SUMMARY_CARDS = (counts) => [
  { label: 'Left Accounts', value: counts?.totalLeft || 0, icon: HiOutlineArrowLeft, color: '#D4AF37' },
  { label: 'Left Points', value: fmt(counts?.totalPointsLeft), icon: HiOutlineChartBar, color: '#F2D06B' },
  { label: 'Right Accounts', value: counts?.totalRight || 0, icon: HiOutlineArrowRight, color: '#D4AF37' },
  { label: 'Right Points', value: fmt(counts?.totalPointsRight), icon: HiOutlineChartBar, color: '#F2D06B' },
];

function traceStatus(traceRow) {
  if (!traceRow) return 'Unknown';
  return Number(traceRow.creditedIncome || 0) > 0
    ? (traceRow.capApplied ? 'Partially Paid' : 'Credited')
    : 'Cap Reached';
}

export default function PairingReports() {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      setLoading(true);
      try {
        const res = await api.get(`/pairing?page=${page}`);
        if (cancelled) return;
        setData(res.data);
        setTotalPages(res.data.totalPages || 1);
      } catch {
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadData();
    return () => { cancelled = true; };
  }, [page]);

  if (loading) return <Spinner />;
  if (!data) return <p style={{ color: 'rgba(255,255,255,0.4)' }}>Failed to load pairing data.</p>;

  const summaryCards = SUMMARY_CARDS(data.counts);
  const traceSummary = data.trace?.summary || {};
  const traceRows = data.trace?.rows || [];
  const packagePolicy = data.packagePolicy || null;
  const eligibility = data.eligibility || { canEarnPairing: true, reason: null };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Pairing Reports</h1>
        <div className="w-10 h-0.5 mt-2 rounded-full" style={{ background: 'linear-gradient(90deg,#D4AF37,transparent)' }} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card, i) => (
          <div key={i} className="glass-card rounded-2xl p-5 flex-shrink-0 w-full">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
              style={{ background: `${card.color}18`, border: `1px solid ${card.color}28` }}
            >
              <card.icon className="w-4 h-4" style={{ color: card.color }} />
            </div>
            <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>{card.label}</p>
            <p className="text-xl font-bold text-white">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-5">
          <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Pair Events</p>
          <p className="text-xl font-bold text-white">{traceSummary.totalEvents || 0}</p>
        </div>
        <div className="glass-card rounded-2xl p-5">
          <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Matched BP</p>
          <p className="text-xl font-bold text-white">{fmt(traceSummary.totalPairPoints)}</p>
        </div>
        <div className="glass-card rounded-2xl p-5">
          <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Credited Pairing</p>
          <p className="text-xl font-bold" style={{ color: '#D4AF37' }}>PHP {fmt(data.walletPairingTotal)}</p>
        </div>
        <div className="glass-card rounded-2xl p-5">
          <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Weekly Cap</p>
          <p className="text-xl font-bold text-white">PHP {fmt(data.trace?.weeklyCap)}</p>
        </div>
      </div>

      {!eligibility.canEarnPairing && (
        <div className="glass-card rounded-2xl p-5" style={{ border: '1px solid rgba(248,113,113,0.16)', background: 'rgba(248,113,113,0.06)' }}>
          <p className="text-sm font-semibold text-white">Sales matched bonus is currently locked for this account</p>
          <p className="text-xs mt-2 leading-6" style={{ color: 'rgba(255,255,255,0.68)' }}>
            {eligibility.reason || 'This account is not pairing-eligible right now.'}
          </p>
        </div>
      )}

      {packagePolicy && (
        <div className="glass-card rounded-2xl p-5 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
            <div>
              <h3 className="font-display text-base font-semibold text-white">{packagePolicy.packageLabel} Package Rules</h3>
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.48)' }}>
                This account follows the current package safety net, pairing ceiling, and upgrade ladder from the PPT-backed package policy.
              </p>
            </div>
            <div className="text-xs font-semibold px-3 py-2 rounded-xl self-start" style={{ background: 'rgba(212,175,55,0.08)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.18)' }}>
              {packagePolicy.rankingEligible ? `Ranking up to ${packagePolicy.rankingMaxLabel || 'published ceiling'}` : 'Ranking locked until Gold'}
            </div>
          </div>

          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.42)' }}>Direct Referral</p>
              <p className="text-lg font-bold text-white">PHP {fmt(packagePolicy.directReferralBonus)}</p>
            </div>
            <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.42)' }}>Binary Value</p>
              <p className="text-lg font-bold text-white">{fmtInt(packagePolicy.binaryPoints)} BP</p>
              <p className="text-[11px] mt-1" style={{ color: 'rgba(255,255,255,0.42)' }}>PHP {fmt(packagePolicy.binaryValue)} per matched side</p>
            </div>
            <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.42)' }}>
                {Number(packagePolicy.lifetimeIncomeCeiling || 0) > 0 ? 'Lifetime Income Ceiling' : 'Monthly Pairing Cap'}
              </p>
              <p className="text-lg font-bold text-white">
                PHP {fmt(Number(packagePolicy.lifetimeIncomeCeiling || 0) > 0 ? packagePolicy.lifetimeIncomeCeiling : packagePolicy.pairingMonthlyCap)}
              </p>
            </div>
            <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.42)' }}>Unilevel Reach</p>
              <p className="text-lg font-bold text-white">Level {fmtInt(packagePolicy.unilevelReach)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-sm">
            <div className="rounded-2xl p-4" style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.14)' }}>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#D4AF37' }}>Coverage</p>
              <p className="mt-2 text-white font-semibold">
                {packagePolicy.pairingDepthLimit ? `Sales match counts up to level ${fmtInt(packagePolicy.pairingDepthLimit)}` : 'Sales match follows the full binary tree'}
              </p>
              <p className="mt-2 text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                {packagePolicy.pairingDepthLimit
                  ? 'Bronze safety-net coverage is intentionally shorter, while your binary points still continue to accumulate in the ledger.'
                  : Number(packagePolicy.pairingMonthlyCap || 0) > 0
                    ? 'This package uses its weekly cap together with a monthly sales-match ceiling.'
                    : 'This package keeps the standard full-tree matching behavior together with the published weekly cap.'}
              </p>
            </div>
            <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.52)' }}>Upgrade Path</p>
              <p className="mt-2 text-white font-semibold">
                {packagePolicy.nextUpgradePackageLabel ? `Next target: ${packagePolicy.nextUpgradePackageLabel}` : 'Highest package already reached'}
              </p>
              <p className="mt-2 text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                {packagePolicy.nextUpgradePackageLabel
                  ? 'Moving up raises your ceiling, unlocks more benefits, and keeps the growth ladder active.'
                  : 'This package already holds the widest published ladder in the current policy set.'}
              </p>
            </div>
            <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.52)' }}>Sales Match Note</p>
              <p className="mt-2 text-xs leading-6" style={{ color: 'rgba(255,255,255,0.68)' }}>
                {packagePolicy.salesMatchNote || 'No package-specific note is available for this tier yet.'}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(212,175,55,0.08)' }}>
          <h3 className="font-display text-base font-semibold text-white">Pairing History</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="text-xs py-1.5 px-3 rounded-lg font-medium disabled:opacity-40"
              style={{ background: 'rgba(212,175,55,0.08)', color: 'rgba(212,175,55,0.85)', border: '1px solid rgba(212,175,55,0.15)' }}
            >
              Prev
            </button>
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{page} / {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="text-xs py-1.5 px-3 rounded-lg font-medium disabled:opacity-40"
              style={{ background: 'rgba(212,175,55,0.08)', color: 'rgba(212,175,55,0.85)', border: '1px solid rgba(212,175,55,0.15)' }}
            >
              Next
            </button>
          </div>
        </div>
        <div className="overflow-x-auto hidden sm:block">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr>
                <th className="table-header py-3 px-4">Date</th>
                <th className="table-header py-3 px-4">Total Left</th>
                <th className="table-header py-3 px-4">Left Pts</th>
                <th className="table-header py-3 px-4">Total Right</th>
                <th className="table-header py-3 px-4">Right Pts</th>
                <th className="table-header py-3 px-4">Paired Pts</th>
                <th className="table-header py-3 px-4">Total Payout</th>
              </tr>
            </thead>
            <tbody>
              {(data.reports || []).map((r, i) => (
                <tr
                  key={i}
                  style={{
                    background: i % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent',
                    borderBottom: '1px solid rgba(212,175,55,0.05)',
                  }}
                  className="hover:bg-white/[0.03] transition-colors"
                >
                  <td className="py-3 px-4 text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>{r.transdate || '-'}</td>
                  <td className="py-3 px-4 text-white/70">{r.totalleft}</td>
                  <td className="py-3 px-4" style={{ color: 'rgba(212,175,55,0.7)' }}>{fmt(r.totalpointsleft)}</td>
                  <td className="py-3 px-4 text-white/70">{r.totalright}</td>
                  <td className="py-3 px-4" style={{ color: 'rgba(212,175,55,0.7)' }}>{fmt(r.totalpointsright)}</td>
                  <td className="py-3 px-4 font-medium text-white/85">{fmt(r.totalpoints)}</td>
                  <td className="py-3 px-4 font-semibold" style={{ color: '#D4AF37' }}>PHP {fmt(r.totalbpay)}</td>
                </tr>
              ))}
              {(!data.reports || data.reports.length === 0) && (
                <tr>
                  <td colSpan="7" className="py-14 text-center">
                    <HiOutlineChartBar className="w-8 h-8 mx-auto mb-2" style={{ color: 'rgba(212,175,55,0.2)' }} />
                    <p style={{ color: 'rgba(255,255,255,0.3)' }}>No pairing records found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="sm:hidden p-4 space-y-3">
          {(data.reports || []).map((r, i) => (
            <div key={i} className="glass-card rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white/80">{r.transdate || '-'}</span>
                <span className="text-xs font-semibold" style={{ color: '#D4AF37' }}>PHP {fmt(r.totalbpay)}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>
                <div>Left: {r.totalleft} / {fmt(r.totalpointsleft)}</div>
                <div>Right: {r.totalright} / {fmt(r.totalpointsright)}</div>
                <div>Pair: {fmt(r.totalpoints)}</div>
                <div>Total: {fmt(r.totalbpay)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(212,175,55,0.08)' }}>
          <h3 className="font-display text-base font-semibold text-white">Pairing Event Trace</h3>
          <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Shows the actual left-right matches, the matched BP, and whether weekly, monthly, or lifetime package caps blocked any payout.
          </p>
        </div>
        <div className="overflow-x-auto hidden lg:block">
          <table className="w-full text-sm min-w-[980px]">
            <thead>
              <tr>
                <th className="table-header py-3 px-4">Date</th>
                <th className="table-header py-3 px-4">Left Source</th>
                <th className="table-header py-3 px-4">Right Source</th>
                <th className="table-header py-3 px-4">Matched BP</th>
                <th className="table-header py-3 px-4">Gross Pairing</th>
                <th className="table-header py-3 px-4">Credited</th>
                <th className="table-header py-3 px-4">Blocked</th>
                <th className="table-header py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {traceRows.map((row, index) => (
                <tr
                  key={row.ledgerUid || index}
                  style={{
                    background: index % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent',
                    borderBottom: '1px solid rgba(212,175,55,0.05)',
                  }}
                  className="hover:bg-white/[0.03] transition-colors"
                >
                  <td className="py-3 px-4 text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>{row.pairedAt || '-'}</td>
                  <td className="py-3 px-4">
                    <div className="text-white/80 text-xs">{row.left?.fullName || '-'}</div>
                    <div className="text-[11px] font-mono" style={{ color: 'rgba(255,255,255,0.35)' }}>{row.left?.username || ''}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-white/80 text-xs">{row.right?.fullName || '-'}</div>
                    <div className="text-[11px] font-mono" style={{ color: 'rgba(255,255,255,0.35)' }}>{row.right?.username || ''}</div>
                  </td>
                  <td className="py-3 px-4 text-white/85 font-medium">{fmt(row.pairPoints)}</td>
                  <td className="py-3 px-4 text-white/70">PHP {fmt(row.grossIncome)}</td>
                  <td className="py-3 px-4 font-semibold" style={{ color: '#D4AF37' }}>PHP {fmt(row.creditedIncome)}</td>
                  <td className="py-3 px-4" style={{ color: row.blockedIncome > 0 ? '#f87171' : 'rgba(255,255,255,0.35)' }}>
                    PHP {fmt(row.blockedIncome)}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className="text-[11px] px-2 py-1 rounded-full font-semibold"
                      style={{
                        background: row.capApplied ? 'rgba(248,113,113,0.12)' : 'rgba(74,222,128,0.12)',
                        color: row.capApplied ? '#f87171' : '#4ade80',
                        border: `1px solid ${row.capApplied ? 'rgba(248,113,113,0.25)' : 'rgba(74,222,128,0.25)'}`,
                      }}
                    >
                      {traceStatus(row)}
                    </span>
                  </td>
                </tr>
              ))}
              {traceRows.length === 0 && (
                <tr>
                  <td colSpan="8" className="py-14 text-center">
                    <HiOutlineChartBar className="w-8 h-8 mx-auto mb-2" style={{ color: 'rgba(212,175,55,0.2)' }} />
                    <p style={{ color: 'rgba(255,255,255,0.3)' }}>No pairing event trace yet.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="lg:hidden p-4 space-y-3">
          {traceRows.map((row, index) => (
            <div key={row.ledgerUid || index} className="glass-card rounded-2xl p-4 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold text-white/80">{row.pairedAt || '-'}</div>
                  <div className="text-[11px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
                    {row.left?.username || '-'} x {row.right?.username || '-'}
                  </div>
                </div>
                <span
                  className="text-[11px] px-2 py-1 rounded-full font-semibold"
                  style={{
                    background: row.capApplied ? 'rgba(248,113,113,0.12)' : 'rgba(74,222,128,0.12)',
                    color: row.capApplied ? '#f87171' : '#4ade80',
                    border: `1px solid ${row.capApplied ? 'rgba(248,113,113,0.25)' : 'rgba(74,222,128,0.25)'}`,
                  }}
                >
                  {traceStatus(row)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>
                <div>BP: {fmt(row.pairPoints)}</div>
                <div>Gross: PHP {fmt(row.grossIncome)}</div>
                <div>Credited: PHP {fmt(row.creditedIncome)}</div>
                <div>Blocked: PHP {fmt(row.blockedIncome)}</div>
              </div>
            </div>
          ))}
          {traceRows.length === 0 && (
            <div className="rounded-2xl border p-4 text-center" style={{ borderColor: 'rgba(212,175,55,0.12)', color: 'rgba(255,255,255,0.35)' }}>
              No pairing event trace yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
