import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlineArrowLeft,
  HiOutlineArrowRight,
  HiOutlineChartBar,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
} from 'react-icons/hi';
import api from '../../api';
import { formatDateTimeManila } from '../../utils/dateTime';

const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtInt = (n) => Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 0 });
const BP_PESO_VALUE = 250;
const toBp = (pesoValue) => Number(Number(pesoValue || 0) / BP_PESO_VALUE);
const PORTAL_TITLE = 'var(--portal-card-title)';
const PORTAL_TEXT = 'var(--portal-card-text)';
const PORTAL_MUTED = 'var(--portal-card-muted)';
const PORTAL_SURFACE = 'var(--portal-soft-bg)';
const PORTAL_BORDER = 'var(--portal-soft-border)';
const PORTAL_ROW = 'var(--portal-row-border)';

function SourceMetaLine({ source }) {
  if (!source) return null;
  return (
    <p className="text-[11px] mt-1" style={{ color: PORTAL_MUTED }}>
      {source.packageLabel || 'Unknown'} - {source.accountStateLabel || 'Unknown'}
    </p>
  );
}

function Pager({ page = 1, totalPages = 1, onPrev, onNext, className = '' }) {
  return (
    <div className={`flex items-center justify-between sm:justify-end gap-2 flex-nowrap whitespace-nowrap overflow-x-auto ${className}`}>
      <button
        onClick={onPrev}
        disabled={page <= 1}
        className="text-xs py-1.5 px-3 rounded-lg font-medium disabled:opacity-40 shrink-0"
        style={{ background: 'rgba(212,175,55,0.08)', color: 'rgba(212,175,55,0.85)', border: '1px solid rgba(212,175,55,0.15)' }}
       type="button">
        Prev
      </button>
      <span className="text-xs shrink-0" style={{ color: PORTAL_MUTED }}>{page} / {totalPages}</span>
      <button
        onClick={onNext}
        disabled={page >= totalPages}
        className="text-xs py-1.5 px-3 rounded-lg font-medium disabled:opacity-40 shrink-0"
        style={{ background: 'rgba(212,175,55,0.08)', color: 'rgba(212,175,55,0.85)', border: '1px solid rgba(212,175,55,0.15)' }}
       type="button">
        Next
      </button>
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <div className="size-10 rounded-full border-[3px] animate-spin" style={{ borderColor: 'rgba(212,175,55,0.12)', borderTopColor: '#D4AF37' }} />
    </div>
  );
}

function traceStatus(traceRow) {
  if (!traceRow) return 'Unknown';
  if (traceRow.eligibilityLocked) return 'Locked';
  return Number(traceRow.creditedIncome || 0) > 0
    ? (traceRow.capApplied ? 'Partially Paid' : 'Credited')
    : 'Cap Reached';
}

function statusStyles(traceRow) {
  if (traceRow?.eligibilityLocked) {
    return {
      background: 'rgba(251,191,36,0.12)',
      color: '#fbbf24',
      border: '1px solid rgba(251,191,36,0.25)',
    };
  }
  if (traceRow?.capApplied || Number(traceRow?.creditedIncome || 0) <= 0) {
    return {
      background: 'rgba(248,113,113,0.12)',
      color: '#f87171',
      border: '1px solid rgba(248,113,113,0.25)',
    };
  }
  return {
    background: 'rgba(74,222,128,0.12)',
    color: '#4ade80',
    border: '1px solid rgba(74,222,128,0.25)',
  };
}

function SummaryCard({ label, value, icon: Icon, color = '#D4AF37', onClick, helper }) {
  const interactive = typeof onClick === 'function';
  return (
    <button
      type="button"
      onClick={interactive ? onClick : undefined}
      className={`glass-card rounded-2xl p-5 flex-shrink-0 w-full text-left transition-colors ${interactive ? 'cursor-pointer' : 'cursor-default'}`}
    >
      <div
        className="size-9 rounded-xl flex items-center justify-center mb-3"
        style={{ background: `${color}18`, border: `1px solid ${color}28` }}
      >
        <Icon className="size-4" style={{ color }} />
      </div>
      <p className="text-xs mb-1" style={{ color: PORTAL_MUTED }}>{label}</p>
      <p className="text-xl font-bold" style={{ color: PORTAL_TITLE }}>{value}</p>
      {helper ? (
        <p className="text-[11px] mt-2" style={{ color: PORTAL_MUTED }}>{helper}</p>
      ) : null}
    </button>
  );
}

function TraceEventCard({ row, expanded, onToggle }) {
  const styles = statusStyles(row);
  return (
    <div className="glass-card rounded-2xl p-4 space-y-3">
      <button type="button" className="w-full text-left" onClick={onToggle}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-semibold" style={{ color: PORTAL_TITLE }}>{formatDateTimeManila(row.pairedAt)}</div>
            <div className="text-[11px] mt-1" style={{ color: PORTAL_MUTED }}>
              {(row.left?.username || '-')} x {(row.right?.username || '-')}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] px-2 py-1 rounded-full font-semibold" style={styles}>
              {traceStatus(row)}
            </span>
            {expanded ? <HiOutlineChevronUp className="size-4" style={{ color: '#D4AF37' }} /> : <HiOutlineChevronDown className="size-4" style={{ color: '#D4AF37' }} />}
          </div>
        </div>
      </button>

      <div className="grid grid-cols-2 gap-2 text-xs" style={{ color: PORTAL_TEXT }}>
        <div>Matched: {fmtInt(toBp(row.pairPoints))} BP</div>
        <div>Credited: PHP {fmt(row.creditedIncome)}</div>
        <div>Gross: PHP {fmt(row.grossIncome)}</div>
        <div>Blocked: PHP {fmt(row.blockedIncome)}</div>
      </div>

      {expanded ? (
        <div className="rounded-2xl p-4 space-y-4" style={{ background: PORTAL_SURFACE, border: `1px solid ${PORTAL_BORDER}` }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl p-3" style={{ background: 'color-mix(in srgb, var(--portal-soft-bg) 74%, rgba(15,23,42,0.06))' }}>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#D4AF37' }}>Left Source</p>
              <p className="font-semibold mt-2" style={{ color: PORTAL_TITLE }}>{row.left?.fullName || '-'}</p>
              <p className="text-xs mt-1" style={{ color: PORTAL_MUTED }}>@{row.left?.username || '-'}</p>
              <SourceMetaLine source={row.left} />
              <div className="grid grid-cols-2 gap-2 mt-3 text-xs" style={{ color: PORTAL_TEXT }}>
                <div>Binary Points before: {fmtInt(toBp(row.left?.pointsBefore))} BP</div>
                <div>Remaining Binary Points: {fmtInt(toBp(row.left?.remainingAfter))} BP</div>
                <div>Type: {row.left?.eventType || '-'}</div>
                <div>{row.left?.fullyConsumed ? 'Fully consumed' : 'Still pairable'}</div>
              </div>
            </div>
            <div className="rounded-xl p-3" style={{ background: 'color-mix(in srgb, var(--portal-soft-bg) 74%, rgba(15,23,42,0.06))' }}>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#D4AF37' }}>Right Source</p>
              <p className="font-semibold mt-2" style={{ color: PORTAL_TITLE }}>{row.right?.fullName || '-'}</p>
              <p className="text-xs mt-1" style={{ color: PORTAL_MUTED }}>@{row.right?.username || '-'}</p>
              <SourceMetaLine source={row.right} />
              <div className="grid grid-cols-2 gap-2 mt-3 text-xs" style={{ color: PORTAL_TEXT }}>
                <div>Binary Points before: {fmtInt(toBp(row.right?.pointsBefore))} BP</div>
                <div>Remaining Binary Points: {fmtInt(toBp(row.right?.remainingAfter))} BP</div>
                <div>Type: {row.right?.eventType || '-'}</div>
                <div>{row.right?.fullyConsumed ? 'Fully consumed' : 'Still pairable'}</div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function PairingReports() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [historyPage, setHistoryPage] = useState(1);
  const [tracePage, setTracePage] = useState(1);
  const [expandedTraceUid, setExpandedTraceUid] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      setLoading(true);
      try {
        const res = await api.get(`/pairing?historyPage=${historyPage}&historyPerPage=50&tracePage=${tracePage}&tracePerPage=50`);
        if (cancelled) return;
        setData(res.data);
      } catch {
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadData();
    return () => { cancelled = true; };
  }, [historyPage, tracePage]);

  const traceRows = data?.trace?.rows || [];
  useEffect(() => {
    if (!traceRows.some((row) => row.ledgerUid === expandedTraceUid)) {
      setExpandedTraceUid(null);
    }
  }, [expandedTraceUid, traceRows]);

  const summaryCards = useMemo(() => ([
    {
      label: 'Left Accounts',
      value: data?.counts?.totalLeft || 0,
      icon: HiOutlineArrowLeft,
      helper: 'Open left-leg account list',
      onClick: () => navigate('/pairing/leg/left'),
    },
    {
      label: 'Left Remaining',
      value: `${fmtInt(toBp(data?.counts?.totalPointsLeft))} BP`,
      icon: HiOutlineChartBar,
      color: '#F2D06B',
    },
    {
      label: 'Right Accounts',
      value: data?.counts?.totalRight || 0,
      icon: HiOutlineArrowRight,
      helper: 'Open right-leg account list',
      onClick: () => navigate('/pairing/leg/right'),
    },
    {
      label: 'Right Remaining',
      value: `${fmtInt(toBp(data?.counts?.totalPointsRight))} BP`,
      icon: HiOutlineChartBar,
      color: '#F2D06B',
    },
  ]), [data, navigate]);

  if (loading) return <Spinner />;
  if (!data) return <p style={{ color: PORTAL_MUTED }}>Failed to load pairing data.</p>;

  const traceSummary = data.trace?.summary || {};
  const packagePolicy = data.packagePolicy || null;
  const eligibility = data.eligibility || { canEarnPairing: true, sourceEligible: true, reason: null };
  const historyRows = data.history?.rows || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold" style={{ color: PORTAL_TITLE }}>Pairing Reports</h1>
        <div className="w-10 h-0.5 mt-2 rounded-full" style={{ background: 'linear-gradient(90deg,#D4AF37,transparent)' }} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card) => (
          <SummaryCard key={card.label} {...card} />
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard label="Pair Events" value={traceSummary.totalEvents || 0} icon={HiOutlineChartBar} color="#D4AF37" />
        <SummaryCard label="Matched BP" value={`${fmtInt(toBp(traceSummary.totalPairPoints))} BP`} icon={HiOutlineChartBar} color="#F2D06B" />
        <SummaryCard label="Credited Pairing" value={`PHP ${fmt(traceSummary.totalCreditedIncome || 0)}`} icon={HiOutlineChartBar} color="#D4AF37" />
        <SummaryCard label="Weekly Cap" value={`PHP ${fmt(data.trace?.weeklyCap)}`} icon={HiOutlineChartBar} color="#F2D06B" />
      </div>

      {!eligibility.canEarnPairing && (eligibility.qualifiedDirects?.left || 0) === 0 && (eligibility.qualifiedDirects?.right || 0) === 0 && (
        <div className="glass-card rounded-2xl p-5" style={{ border: '1px solid var(--portal-soft-border)', background: 'var(--portal-soft-bg)' }}>
          <p className="text-sm font-semibold" style={{ color: PORTAL_TITLE }}>No personally-sponsored qualified directs yet</p>
          <p className="text-xs mt-2 leading-6" style={{ color: PORTAL_TEXT }}>
            You have no personally-sponsored PD or fully-paid CD members in your binary network yet. Pairing income is still earned whenever qualified BP exists on both your left and right legs from any downline source.
          </p>
        </div>
      )}

      {!eligibility.sourceEligible && (
        <div className="glass-card rounded-2xl p-5" style={{ border: '1px solid var(--portal-warning-border)', background: 'var(--portal-warning-bg)' }}>
          <p className="text-sm font-semibold" style={{ color: PORTAL_TITLE }}>This account cannot pass its own BP upward yet</p>
          <p className="text-xs mt-2 leading-6" style={{ color: PORTAL_TEXT }}>
            {eligibility.sourceReason || 'This account cannot contribute its own BP upstream yet, but eligible downlines can still generate pairing for this account when the left and right subtree both contain qualified BP.'}
          </p>
        </div>
      )}

      {packagePolicy && (
        <div className="glass-card rounded-2xl p-5 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
            <div>
              <h3 className="font-display text-base font-semibold" style={{ color: PORTAL_TITLE }}>{packagePolicy.packageLabel} Package Rules</h3>
              <p className="text-xs mt-1" style={{ color: PORTAL_MUTED }}>
                This account follows the current package safety net, pairing ceiling, and upgrade ladder from the PPT-backed package policy.
              </p>
            </div>
            <div className="text-xs font-semibold px-3 py-2 rounded-xl self-start" style={{ background: 'rgba(212,175,55,0.08)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.18)' }}>
              {packagePolicy.rankingEligible ? `Ranking up to ${packagePolicy.rankingMaxLabel || 'published ceiling'}` : 'Ranking locked until Gold'}
            </div>
          </div>

          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="rounded-2xl p-4" style={{ background: PORTAL_SURFACE, border: `1px solid ${PORTAL_BORDER}` }}>
              <p className="text-xs mb-1" style={{ color: PORTAL_MUTED }}>Direct Referral</p>
              <p className="text-lg font-bold" style={{ color: PORTAL_TITLE }}>PHP {fmt(packagePolicy.directReferralBonus)}</p>
            </div>
            <div className="rounded-2xl p-4" style={{ background: PORTAL_SURFACE, border: `1px solid ${PORTAL_BORDER}` }}>
              <p className="text-xs mb-1" style={{ color: PORTAL_MUTED }}>Binary Value</p>
              <p className="text-lg font-bold" style={{ color: PORTAL_TITLE }}>{fmtInt(packagePolicy.binaryPoints)} BP</p>
              <p className="text-[11px] mt-1" style={{ color: PORTAL_MUTED }}>PHP {fmt(packagePolicy.binaryValue)} per matched side</p>
            </div>
            <div className="rounded-2xl p-4" style={{ background: PORTAL_SURFACE, border: `1px solid ${PORTAL_BORDER}` }}>
              <p className="text-xs mb-1" style={{ color: PORTAL_MUTED }}>
                {Number(packagePolicy.lifetimeIncomeCeiling || 0) > 0 ? 'Lifetime Income Ceiling' : 'Monthly Pairing Cap'}
              </p>
              <p className="text-lg font-bold" style={{ color: PORTAL_TITLE }}>
                PHP {fmt(Number(packagePolicy.lifetimeIncomeCeiling || 0) > 0 ? packagePolicy.lifetimeIncomeCeiling : packagePolicy.pairingMonthlyCap)}
              </p>
            </div>
            <div className="rounded-2xl p-4" style={{ background: PORTAL_SURFACE, border: `1px solid ${PORTAL_BORDER}` }}>
              <p className="text-xs mb-1" style={{ color: PORTAL_MUTED }}>Unilevel Reach</p>
              <p className="text-lg font-bold" style={{ color: PORTAL_TITLE }}>Level {fmtInt(packagePolicy.unilevelReach)}</p>
            </div>
          </div>
        </div>
      )}

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(212,175,55,0.08)' }}>
          <div>
            <h3 className="font-display text-base font-semibold" style={{ color: PORTAL_TITLE }}>Pairing History</h3>
            <p className="text-xs mt-1" style={{ color: PORTAL_MUTED }}>
              Each row is one successful matched-points event that actually credited pairing income.
            </p>
          </div>
          <Pager
            page={data.history?.page || 1}
            totalPages={data.history?.totalPages || 1}
            onPrev={() => setHistoryPage((p) => Math.max(1, p - 1))}
            onNext={() => setHistoryPage((p) => Math.min(Number(data.history?.totalPages || 1), p + 1))}
          />
        </div>
        <div className="overflow-x-auto hidden lg:block">
          <table className="w-full text-sm min-w-[960px]">
            <thead>
              <tr>
                <th className="table-header py-3 px-4">Date</th>
                <th className="table-header py-3 px-4">Left Source</th>
                <th className="table-header py-3 px-4">Right Source</th>
                <th className="table-header py-3 px-4">Matched BP</th>
                <th className="table-header py-3 px-4">Left Remaining After</th>
                <th className="table-header py-3 px-4">Right Remaining After</th>
                <th className="table-header py-3 px-4">Credited Payout</th>
              </tr>
            </thead>
            <tbody>
              {historyRows.map((row, i) => (
                <tr
                  key={row.historyUid || i}
                  style={{
                    background: i % 2 === 0 ? 'var(--portal-zebra-bg)' : 'transparent',
                    borderBottom: `1px solid ${PORTAL_ROW}`,
                  }}
                  className="portal-table-row-hover transition-colors"
                >
                  <td className="py-3 px-4 text-xs" style={{ color: PORTAL_MUTED }}>{formatDateTimeManila(row.pairedAt)}</td>
                  <td className="py-3 px-4">
                    {row.isLegacy ? <span className="text-[11px]" style={{ color: PORTAL_MUTED }}>Legacy record</span> : (
                      <>
                        <div className="text-xs" style={{ color: PORTAL_TITLE }}>{row.left?.fullName || '-'}</div>
                        <div className="text-[11px] font-mono" style={{ color: PORTAL_MUTED }}>{row.left?.username || ''}</div>
                        <div className="text-[11px]" style={{ color: PORTAL_TEXT }}>{row.left?.packageLabel || 'Unknown'} - {row.left?.accountStateLabel || 'Unknown'}</div>
                      </>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {row.isLegacy ? <span className="text-[11px]" style={{ color: PORTAL_MUTED }}>Legacy record</span> : (
                      <>
                        <div className="text-xs" style={{ color: PORTAL_TITLE }}>{row.right?.fullName || '-'}</div>
                        <div className="text-[11px] font-mono" style={{ color: PORTAL_MUTED }}>{row.right?.username || ''}</div>
                        <div className="text-[11px]" style={{ color: PORTAL_TEXT }}>{row.right?.packageLabel || 'Unknown'} - {row.right?.accountStateLabel || 'Unknown'}</div>
                      </>
                    )}
                  </td>
                  <td className="py-3 px-4 font-medium" style={{ color: PORTAL_TITLE }}>{row.matchedPoints != null ? `${fmtInt(toBp(row.matchedPoints))} BP` : '-'}</td>
                  <td className="py-3 px-4" style={{ color: 'rgba(212,175,55,0.78)' }}>{row.leftRemainingAfter != null ? `${fmtInt(toBp(row.leftRemainingAfter))} BP` : '-'}</td>
                  <td className="py-3 px-4" style={{ color: 'rgba(212,175,55,0.78)' }}>{row.rightRemainingAfter != null ? `${fmtInt(toBp(row.rightRemainingAfter))} BP` : '-'}</td>
                  <td className="py-3 px-4 font-semibold" style={{ color: '#D4AF37' }}>PHP {fmt(row.creditedIncome)}</td>
                </tr>
              ))}
              {historyRows.length === 0 && (
                <tr>
                  <td colSpan="7" className="py-14 text-center">
                    <HiOutlineChartBar className="size-8 mx-auto mb-2" style={{ color: 'rgba(212,175,55,0.2)' }} />
                    <p style={{ color: PORTAL_MUTED }}>No successful pairing records found yet.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="lg:hidden p-4 space-y-3">
          {historyRows.map((row, i) => (
            <div key={row.historyUid || i} className="glass-card rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold" style={{ color: PORTAL_TITLE }}>{formatDateTimeManila(row.pairedAt)}</span>
                <span className="text-xs font-semibold" style={{ color: '#D4AF37' }}>PHP {fmt(row.creditedIncome)}</span>
              </div>
              <div className="grid grid-cols-1 gap-2 text-xs" style={{ color: PORTAL_TEXT }}>
                {row.isLegacy ? (
                  <div style={{ color: PORTAL_MUTED }}>Legacy record — source detail not available</div>
                ) : (
                  <>
                    <div>Left: {row.left?.username || '-'} ({row.left?.packageLabel || 'Unknown'} - {row.left?.accountStateLabel || 'Unknown'})</div>
                    <div>Right: {row.right?.username || '-'} ({row.right?.packageLabel || 'Unknown'} - {row.right?.accountStateLabel || 'Unknown'})</div>
                    <div>Matched: {row.matchedPoints != null ? `${fmtInt(toBp(row.matchedPoints))} BP` : '-'}</div>
                    <div>Left remaining after: {row.leftRemainingAfter != null ? `${fmtInt(toBp(row.leftRemainingAfter))} BP` : '-'}</div>
                    <div>Right remaining after: {row.rightRemainingAfter != null ? `${fmtInt(toBp(row.rightRemainingAfter))} BP` : '-'}</div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="px-4 sm:px-5 pb-4">
          <Pager
            page={data.history?.page || 1}
            totalPages={data.history?.totalPages || 1}
            onPrev={() => setHistoryPage((p) => Math.max(1, p - 1))}
            onNext={() => setHistoryPage((p) => Math.min(Number(data.history?.totalPages || 1), p + 1))}
          />
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 gap-4" style={{ borderBottom: '1px solid rgba(212,175,55,0.08)' }}>
          <div>
            <h3 className="font-display text-base font-semibold" style={{ color: PORTAL_TITLE }}>Pairing Event Trace</h3>
            <p className="text-xs mt-1" style={{ color: PORTAL_MUTED }}>
              Shows the actual left-right matches, the matched BP, the payout result, and the remaining binary points on each source account after that event.
            </p>
          </div>
          <Pager
            page={data.trace?.pagination?.page || 1}
            totalPages={data.trace?.pagination?.totalPages || 1}
            onPrev={() => setTracePage((p) => Math.max(1, p - 1))}
            onNext={() => setTracePage((p) => Math.min(Number(data.trace?.pagination?.totalPages || 1), p + 1))}
          />
        </div>

        <div className="overflow-x-auto hidden xl:block">
          <table className="w-full text-sm min-w-[1240px]">
            <thead>
              <tr>
                <th className="table-header py-3 px-4">Date</th>
                <th className="table-header py-3 px-4">Left Source</th>
                <th className="table-header py-3 px-4">Right Source</th>
                <th className="table-header py-3 px-4">Matched BP</th>
                <th className="table-header py-3 px-4">Gross Pairing</th>
                <th className="table-header py-3 px-4">Credited</th>
                <th className="table-header py-3 px-4">Blocked</th>
                <th className="table-header py-3 px-4">Left Remaining After</th>
                <th className="table-header py-3 px-4">Right Remaining After</th>
                <th className="table-header py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {traceRows.map((row, index) => {
                const styles = statusStyles(row);
                return (
                  <tr
                    key={row.ledgerUid || index}
                    style={{
                      background: index % 2 === 0 ? 'var(--portal-zebra-bg)' : 'transparent',
                      borderBottom: `1px solid ${PORTAL_ROW}`,
                    }}
                    className="portal-table-row-hover transition-colors"
                  >
                    <td className="py-3 px-4 text-xs" style={{ color: PORTAL_MUTED }}>{formatDateTimeManila(row.pairedAt)}</td>
                    <td className="py-3 px-4">
                      <div className="text-xs" style={{ color: PORTAL_TITLE }}>{row.left?.fullName || '-'}</div>
                      <div className="text-[11px] font-mono" style={{ color: PORTAL_MUTED }}>{row.left?.username || ''}</div>
                      <div className="text-[11px]" style={{ color: PORTAL_TEXT }}>{row.left?.packageLabel || 'Unknown'} - {row.left?.accountStateLabel || 'Unknown'}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-xs" style={{ color: PORTAL_TITLE }}>{row.right?.fullName || '-'}</div>
                      <div className="text-[11px] font-mono" style={{ color: PORTAL_MUTED }}>{row.right?.username || ''}</div>
                      <div className="text-[11px]" style={{ color: PORTAL_TEXT }}>{row.right?.packageLabel || 'Unknown'} - {row.right?.accountStateLabel || 'Unknown'}</div>
                    </td>
                    <td className="py-3 px-4 font-medium" style={{ color: PORTAL_TITLE }}>{fmtInt(toBp(row.pairPoints))} BP</td>
                    <td className="py-3 px-4" style={{ color: PORTAL_TEXT }}>PHP {fmt(row.grossIncome)}</td>
                    <td className="py-3 px-4 font-semibold" style={{ color: '#D4AF37' }}>PHP {fmt(row.creditedIncome)}</td>
                    <td className="py-3 px-4" style={{ color: row.blockedIncome > 0 ? '#f87171' : PORTAL_MUTED }}>PHP {fmt(row.blockedIncome)}</td>
                    <td className="py-3 px-4" style={{ color: 'rgba(212,175,55,0.78)' }}>{fmtInt(toBp(row.left?.remainingAfter))} BP</td>
                    <td className="py-3 px-4" style={{ color: 'rgba(212,175,55,0.78)' }}>{fmtInt(toBp(row.right?.remainingAfter))} BP</td>
                    <td className="py-3 px-4">
                      <span className="text-[11px] px-2 py-1 rounded-full font-semibold" style={styles}>{traceStatus(row)}</span>
                    </td>
                  </tr>
                );
              })}
              {traceRows.length === 0 && (
                <tr>
                  <td colSpan="10" className="py-14 text-center">
                    <HiOutlineChartBar className="size-8 mx-auto mb-2" style={{ color: 'rgba(212,175,55,0.2)' }} />
                    <p style={{ color: PORTAL_MUTED }}>No pairing event trace yet.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="xl:hidden p-4 space-y-3">
          {traceRows.map((row, index) => (
            <TraceEventCard
              key={row.ledgerUid || index}
              row={row}
              expanded={expandedTraceUid === row.ledgerUid}
              onToggle={() => setExpandedTraceUid((current) => current === row.ledgerUid ? null : row.ledgerUid)}
            />
          ))}
          {traceRows.length === 0 && (
            <div className="rounded-2xl border p-4 text-center" style={{ borderColor: PORTAL_BORDER, color: PORTAL_MUTED, background: PORTAL_SURFACE }}>
              No pairing event trace yet.
            </div>
          )}
        </div>
        <div className="px-4 sm:px-5 pb-4">
          <Pager
            page={data.trace?.pagination?.page || 1}
            totalPages={data.trace?.pagination?.totalPages || 1}
            onPrev={() => setTracePage((p) => Math.max(1, p - 1))}
            onNext={() => setTracePage((p) => Math.min(Number(data.trace?.pagination?.totalPages || 1), p + 1))}
          />
        </div>
      </div>
    </div>
  );
}
