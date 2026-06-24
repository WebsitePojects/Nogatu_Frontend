import { useEffect, useMemo, useRef, useState } from 'react';
import {
  HiOutlineArrowLeft,
  HiOutlineArrowRight,
  HiOutlineChartBar,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineDownload,
} from 'react-icons/hi';
import api from '../../api';
import { formatDateTimeManila } from '../../utils/dateTime';
import { exportPairingXlsx } from '../../lib/pairingXlsx';

const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtInt = (n) => Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 0 });
const BP_PESO_VALUE = 250;
const toBp = (pesoValue) => Number(Number(pesoValue || 0) / BP_PESO_VALUE);

// Group the event trace by the matched source's ACTUAL package tier (not by the
// matched-PV-per-event, which produced confusing buckets like "3 PV"). A pairing
// match is limited by the smaller-package source, so that source's package is the
// event's tier.
const PACKAGE_RANK = { Bronze: 1, Silver: 2, Gold: 3, Platinum: 4, Garnet: 5, Diamond: 6 };
function eventPackageTier(r) {
  const l = r.left?.packageLabel;
  const rt = r.right?.packageLabel;
  const lr = PACKAGE_RANK[l] || 0;
  const rr = PACKAGE_RANK[rt] || 0;
  if (lr && rr) return lr <= rr ? l : rt;   // limiting (smaller) package defines the tier
  return l || rt || 'Unknown';
}
function groupTraceByTier(rows) {
  const map = new Map();
  for (const r of rows) {
    const label = eventPackageTier(r);
    if (!map.has(label)) map.set(label, { label, rank: PACKAGE_RANK[label] || 0, count: 0, totalPv: 0, credited: 0 });
    const b = map.get(label);
    b.count += 1;
    b.totalPv += Math.round(Number(r.pairPoints || 0) / BP_PESO_VALUE);
    b.credited += Number(r.creditedIncome || 0);
  }
  return Array.from(map.values()).sort((a, b) => b.rank - a.rank || b.totalPv - a.totalPv);
}
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

function TraceEventCard({ row, weakSide, strongSide }) {
  const styles = statusStyles(row);
  const entry = row[weakSide] || {};
  return (
    <div className="glass-card rounded-2xl p-4 space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold truncate" style={{ color: PORTAL_TITLE }}>{entry.fullName || entry.username || '-'}</div>
          <div className="text-[11px] mt-0.5" style={{ color: PORTAL_MUTED }}>New weak-leg entry · {formatDateTimeManila(row.pairedAt)}</div>
        </div>
        <span className="text-[11px] px-2 py-1 rounded-full font-semibold flex-shrink-0" style={styles}>
          {traceStatus(row)}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs" style={{ color: PORTAL_TEXT }}>
        <div>Matched: <strong style={{ color: PORTAL_TITLE }}>&minus;{fmtInt(toBp(row.pairPoints))} PV</strong></div>
        <div>Strong leg remaining: {fmtInt(toBp(row[strongSide]?.remainingAfter))} PV</div>
        <div className="col-span-2">Credited: <strong style={{ color: '#D4AF37' }}>PHP {fmt(row.creditedIncome)}</strong></div>
      </div>
    </div>
  );
}

export default function PairingReports() {
  const [data, setData] = useState(null);
  const [historyPage, setHistoryPage] = useState(1);
  const [tracePage, setTracePage] = useState(1);
  const [expandedTraceUid, setExpandedTraceUid] = useState(null);
  const [groupTrace, setGroupTrace] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [debouncedHistorySearch, setDebouncedHistorySearch] = useState('');
  const [historySort, setHistorySort] = useState('date');
  const [historyDir, setHistoryDir] = useState('desc');
  const [historyMonth, setHistoryMonth] = useState(''); // '' = backend defaults to latest month
  const [historyFrom, setHistoryFrom] = useState(''); // YYYY-MM-DD range (overrides month)
  const [historyTo, setHistoryTo] = useState('');
  const [traceSearch, setTraceSearch] = useState('');
  const [debouncedTraceSearch, setDebouncedTraceSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [tableBusy, setTableBusy] = useState(false); // silent background refetch (search/page)
  const hasLoadedRef = useRef(false);
  const [exportingXlsx, setExportingXlsx] = useState(false);

  async function handleExportXlsx() {
    if (exportingXlsx || !data) return;
    setExportingXlsx(true);
    try {
      const allTrace = [];
      const allHistory = [];
      for (let i = 1, tp = 1; i <= tp && i <= 100; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        const res = await api.get(`/pairing?tracePage=${i}&tracePerPage=200&historyPerPage=1`);
        allTrace.push(...(res.data.trace?.rows || []));
        tp = Number(res.data.trace?.pagination?.totalPages || 1);
      }
      for (let i = 1, hp = 1; i <= hp && i <= 100; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        const res = await api.get(`/pairing?historyPage=${i}&historyPerPage=200&tracePerPage=1&historyMonth=all`);
        allHistory.push(...(res.data.history?.rows || []));
        hp = Number(res.data.history?.pagination?.totalPages || 1);
      }
      // Chronological + running cumulative across the WHOLE trace (not per page).
      let cum = 0;
      const orderedAll = [...allTrace]
        .sort((a, b) => (Number(a.matchSeq || 0) - Number(b.matchSeq || 0)) || new Date(a.pairedAt) - new Date(b.pairedAt) || String(a.ledgerUid).localeCompare(String(b.ledgerUid)))
        .map((row) => { cum += Math.round(Number(row.pairPoints || 0) / BP_PESO_VALUE); return { ...row, cumulativeMatchedPv: cum }; });

      const lifetime = Number(data.walletPairingTotal || 0);
      const traceable = Number(data.trace?.summary?.totalCreditedIncome || 0);
      await exportPairingXlsx({
        username: data.username || data.account?.username,
        summary: { lifetimeSmb: lifetime, traceableSmb: traceable, legacySmb: Math.max(0, lifetime - traceable), lifetimePv: Math.round(lifetime / BP_PESO_VALUE) },
        tierGroups: groupTraceByTier(orderedAll),
        history: allHistory,
        trace: orderedAll,
      });
    } catch { /* surfaced by axios interceptor */ } finally {
      setExportingXlsx(false);
    }
  }

  useEffect(() => {
    const id = setTimeout(() => setDebouncedHistorySearch(historySearch.trim()), 350);
    return () => clearTimeout(id);
  }, [historySearch]);
  useEffect(() => { setHistoryPage(1); }, [debouncedHistorySearch, historySort, historyDir, historyMonth, historyFrom, historyTo]);
  useEffect(() => {
    const id = setTimeout(() => setDebouncedTraceSearch(traceSearch.trim()), 350);
    return () => clearTimeout(id);
  }, [traceSearch]);
  useEffect(() => { setTracePage(1); }, [debouncedTraceSearch]);

  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      // Only blank the page on the FIRST load. Search / page / sort changes fetch
      // silently in the background and swap the table in when ready (no full reload).
      if (!hasLoadedRef.current) setLoading(true);
      else setTableBusy(true);
      try {
        const hp = new URLSearchParams({
          historyPage: String(historyPage), historyPerPage: '50',
          tracePage: String(tracePage), tracePerPage: '50',
          historySort, historyDir,
        });
        if (debouncedHistorySearch) hp.set('historySearch', debouncedHistorySearch);
        if (debouncedTraceSearch) hp.set('traceSearch', debouncedTraceSearch);
        if (historyMonth) hp.set('historyMonth', historyMonth);
        if (historyFrom) hp.set('historyFrom', historyFrom);
        if (historyTo) hp.set('historyTo', historyTo);
        const res = await api.get(`/pairing?${hp.toString()}`);
        if (cancelled) return;
        setData(res.data);
        hasLoadedRef.current = true;
      } catch {
        if (!cancelled && !hasLoadedRef.current) setData(null);
      } finally {
        if (!cancelled) { setLoading(false); setTableBusy(false); }
      }
    }
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return () => { cancelled = true; };
  }, [historyPage, tracePage, debouncedHistorySearch, debouncedTraceSearch, historySort, historyDir, historyMonth, historyFrom, historyTo]);

  const traceRows = data?.trace?.rows || [];
  // ③ Chronological running ledger: oldest → newest so the remaining balance reads
  // forward (60 → 59 → 57…), with a per-event running cumulative matched PV.
  const orderedTraceRows = useMemo(() => {
    let cumulative = 0;
    return [...traceRows]
      .sort((a, b) => (Number(a.matchSeq || 0) - Number(b.matchSeq || 0)) || new Date(a.pairedAt) - new Date(b.pairedAt) || String(a.ledgerUid).localeCompare(String(b.ledgerUid)))
      .map((row) => {
        const matchedPv = Math.round(Number(row.pairPoints || 0) / BP_PESO_VALUE);
        cumulative += matchedPv;
        return { ...row, matchedPv, cumulativeMatchedPv: cumulative };
      });
  }, [traceRows]);

  useEffect(() => {
    if (!traceRows.some((row) => row.ledgerUid === expandedTraceUid)) {
      setExpandedTraceUid(null);
    }
  }, [expandedTraceUid, traceRows]);

  // Encode-based ledger (Minutes refinement): ONE row per binary encode (newest first) — the new
  // member, their package PV, whether it grew the strong leg (+PV) or matched the weak leg (−PV),
  // and the running strong-leg remaining. Replaces the per-matched-pair rows (which split one
  // encode into many). Backend returns the full encode ledger; we filter + paginate client-side.
  const ENCODE_PER_PAGE = 50;
  const ENCODE_PKG = { 10: 'Bronze', 20: 'Silver', 30: 'Gold', 40: 'Platinum', 50: 'Garnet', 60: 'Diamond' };
  const encodeAll = useMemo(() => {
    const all = data?.trace?.encodeTrace || [];
    const q = debouncedTraceSearch.trim().toLowerCase();
    const filtered = q
      ? all.filter((r) => `${r.pairedAt || ''} ${r.username || ''} ${r.fullName || ''}`.toLowerCase().includes(q))
      : all;
    return [...filtered].reverse(); // newest first
  }, [data, debouncedTraceSearch]);
  const encodeTotalPages = Math.max(1, Math.ceil(encodeAll.length / ENCODE_PER_PAGE));
  const encodePage = Math.min(tracePage, encodeTotalPages);
  const encodeRows = encodeAll.slice((encodePage - 1) * ENCODE_PER_PAGE, encodePage * ENCODE_PER_PAGE);

  const summaryCards = useMemo(() => {
    const leftPV = Math.round((data?.counts?.totalPointsLeft || 0) / 250);
    const rightPV = Math.round((data?.counts?.totalPointsRight || 0) / 250);
    const leftRemaining = leftPV > rightPV ? leftPV - rightPV : 0;
    const rightRemaining = rightPV > leftPV ? rightPV - leftPV : 0;
    return [
      {
        label: 'Left Accounts',
        value: data?.counts?.totalLeft || 0,
        icon: HiOutlineArrowLeft,
        helper: 'Total accounts on your left leg',
      },
      {
        label: 'Left Remaining',
        value: `${fmtInt(leftRemaining)} PV`,
        icon: HiOutlineChartBar,
        color: '#F2D06B',
        helper: leftPV > rightPV ? 'Strong leg — unmatched surplus' : 'Weak leg — fully consumed',
      },
      {
        label: 'Right Accounts',
        value: data?.counts?.totalRight || 0,
        icon: HiOutlineArrowRight,
        helper: 'Total accounts on your right leg',
      },
      {
        label: 'Right Remaining',
        value: `${fmtInt(rightRemaining)} PV`,
        icon: HiOutlineChartBar,
        color: '#F2D06B',
        helper: rightPV > leftPV ? 'Strong leg — unmatched surplus' : 'Weak leg — fully consumed',
      },
    ];
  }, [data]);

  if (loading) return <Spinner />;
  if (!data) return <p style={{ color: PORTAL_MUTED }}>Failed to load pairing data.</p>;

  const traceSummary = data.trace?.summary || {};

  // Member-side simplified pairing view (Minutes 06-20 #3/#8): each match shows ONLY the newly-
  // encoded WEAK-leg member that triggered it + the matched (minus) PV + the STRONG source's
  // remaining PV after the subtraction. No strong-leg names/columns — the admin report keeps the
  // full per-match detail. Weak leg = the leg with fewer total points (the one being consumed).
  const weakSide = Number(data?.counts?.totalPointsLeft || 0) <= Number(data?.counts?.totalPointsRight || 0) ? 'left' : 'right';
  const strongSide = weakSide === 'left' ? 'right' : 'left';
  const packagePolicy = data.packagePolicy || null;
  const eligibility = data.eligibility || { canEarnPairing: true, sourceEligible: true, reason: null };
  const historyRows = data.history?.rows || [];

  // ── Money-integrity: authoritative lifetime SMB vs event-traceable subset ──
  // walletPairingTotal (payouttotaltab.ttlincome2) is the authoritative, already-paid
  // lifetime pairing total. It is monotonic — the new engine uses Math.max so it can
  // never be lowered below what the legacy PHP system already credited.
  // traceSummary.totalCreditedIncome is only the portion the new ledger reconstructed
  // with full event-by-event detail. The difference is real legacy income that was
  // imported as a verified aggregate but has no per-event records in this portal.
  // We display the TRUE lifetime figure and are transparent about the untraceable part
  // — we never understate real earnings and never fabricate per-event figures.
  const lifetimeSmb = Number(data.walletPairingTotal || 0);
  const traceableSmb = Number(traceSummary.totalCreditedIncome || 0);
  const historicalSmb = Math.max(0, lifetimeSmb - traceableSmb);
  const lifetimeMatchedPv = Math.round(lifetimeSmb / 250);
  const traceableMatchedPv = Math.round(Number(traceSummary.totalPairPoints || traceableSmb || 0) / 250);

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

      <div className="grid grid-cols-2 gap-4">
        <SummaryCard
          label="Matched PV"
          value={`${fmtInt(lifetimeMatchedPv)} PV`}
          icon={HiOutlineChartBar}
          color="#F2D06B"
          helper={historicalSmb > 0 ? `${fmtInt(traceableMatchedPv)} PV with event detail · rest is legacy import` : 'Fully event-traceable'}
        />
        <SummaryCard
          label="Total SMB Earned"
          value={`PHP ${fmt(lifetimeSmb)}`}
          icon={HiOutlineChartBar}
          color="#D4AF37"
          helper={historicalSmb > 0 ? `PHP ${fmt(traceableSmb)} traceable + PHP ${fmt(historicalSmb)} historical` : 'Fully event-traceable'}
        />
      </div>

      {historicalSmb > 0 && (
        <div className="glass-card rounded-2xl p-5" style={{ border: '1px solid var(--portal-soft-border)', background: 'var(--portal-soft-bg)' }}>
          <p className="text-sm font-semibold" style={{ color: PORTAL_TITLE }}>How your Total SMB is composed</p>
          <p className="text-xs mt-2 leading-6" style={{ color: PORTAL_TEXT }}>
            Your <strong>Total SMB Earned (PHP {fmt(lifetimeSmb)})</strong> is your full lifetime pairing income.
            Of this, <strong>PHP {fmt(traceableSmb)}</strong> is reconstructed with complete event-by-event detail
            in the history and trace below. The remaining <strong>PHP {fmt(historicalSmb)}</strong> was credited and
            paid by the previous system and imported as a verified historical total — it is real, already-credited
            income, but the individual matched-pair records behind it are not available in this portal.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
            <div className="rounded-xl px-3 py-2.5" style={{ background: 'var(--portal-soft-bg)', border: '1px solid var(--portal-soft-border)' }}>
              <p className="text-[10px] uppercase tracking-[0.16em]" style={{ color: PORTAL_MUTED }}>Event-traceable</p>
              <p className="mt-1 text-sm font-semibold" style={{ color: PORTAL_TITLE }}>PHP {fmt(traceableSmb)}</p>
            </div>
            <div className="rounded-xl px-3 py-2.5" style={{ background: 'var(--portal-soft-bg)', border: '1px solid var(--portal-soft-border)' }}>
              <p className="text-[10px] uppercase tracking-[0.16em]" style={{ color: PORTAL_MUTED }}>Historical import</p>
              <p className="mt-1 text-sm font-semibold" style={{ color: PORTAL_TITLE }}>PHP {fmt(historicalSmb)}</p>
            </div>
            <div className="rounded-xl px-3 py-2.5" style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.24)' }}>
              <p className="text-[10px] uppercase tracking-[0.16em]" style={{ color: PORTAL_MUTED }}>Lifetime total</p>
              <p className="mt-1 text-sm font-semibold" style={{ color: '#F4D675' }}>PHP {fmt(lifetimeSmb)}</p>
            </div>
          </div>
        </div>
      )}

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
        <div className="flex items-center justify-between px-5 py-4 gap-4" style={{ borderBottom: '1px solid rgba(212,175,55,0.08)' }}>
          <div>
            <h3 className="font-display text-base font-semibold flex items-center gap-2" style={{ color: PORTAL_TITLE }}>
              Pairing Event Trace
              {tableBusy && <span className="size-3 animate-spin rounded-full border-2 border-current border-t-transparent" style={{ color: '#D4AF37' }} />}
            </h3>
            <p className="text-xs mt-1" style={{ color: PORTAL_MUTED }}>
              One record per encode (newest first): each new member added to a leg — their package PV, whether it
              grew the strong leg (<span style={{ color: '#34d399' }}>+PV</span>) or matched the weak leg
              (<span style={{ color: '#f2d06b' }}>−PV</span>), and the running strong-leg remaining.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
            <div className="relative">
              <input
                value={traceSearch}
                onChange={(e) => setTraceSearch(e.target.value)}
                placeholder="Search: date or @username"
                className="glass-input text-xs rounded-lg py-1.5 pl-2.5 pr-7 w-48"
              />
              {traceSearch && (
                <button type="button" onClick={() => setTraceSearch('')} title="Clear search"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 text-sm leading-none" style={{ color: PORTAL_MUTED }}>×</button>
              )}
            </div>
            <button
              type="button"
              onClick={handleExportXlsx}
              disabled={exportingXlsx}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
              style={{ background: 'rgba(34,197,94,0.12)', color: '#34d399', border: '1px solid rgba(34,197,94,0.3)' }}
              title="Export to Excel"
            >
              <HiOutlineDownload className="size-4" /> {exportingXlsx ? 'Exporting…' : 'Export XLSX'}
            </button>
            <Pager
              page={encodePage}
              totalPages={encodeTotalPages}
              onPrev={() => setTracePage((p) => Math.max(1, p - 1))}
              onNext={() => setTracePage((p) => Math.min(encodeTotalPages, p + 1))}
            />
          </div>
        </div>

        <div className="overflow-x-auto hidden lg:block">
          <table className="w-full text-sm min-w-[860px]">
            <thead>
              <tr>
                <th className="table-header py-3 px-4">#</th>
                <th className="table-header py-3 px-4">Date</th>
                <th className="table-header py-3 px-4">Encoded member</th>
                <th className="table-header py-3 px-4">Leg effect</th>
                <th className="table-header py-3 px-4">Strong leg remaining</th>
              </tr>
            </thead>
            <tbody>
              {encodeRows.map((row, index) => {
                const pv = toBp(row.pointValue);
                const num = (encodePage - 1) * ENCODE_PER_PAGE + index + 1;
                return (
                  <tr
                    key={row.encodeUid || index}
                    style={{
                      background: index % 2 === 0 ? 'var(--portal-zebra-bg)' : 'transparent',
                      borderBottom: `1px solid ${PORTAL_ROW}`,
                    }}
                    className="portal-table-row-hover transition-colors"
                  >
                    <td className="py-3 px-4 text-xs font-mono" style={{ color: PORTAL_MUTED }}>{num}</td>
                    <td className="py-3 px-4 text-xs" style={{ color: PORTAL_MUTED }}>{formatDateTimeManila(row.pairedAt)}</td>
                    <td className="py-3 px-4">
                      <div className="text-xs" style={{ color: PORTAL_TITLE }}>{row.fullName || row.username || '-'}</div>
                      <div className="text-[11px] font-mono" style={{ color: PORTAL_MUTED }}>{row.username || ''}</div>
                      <div className="text-[11px]" style={{ color: PORTAL_TEXT }}>{ENCODE_PKG[row.packageType] || 'Unknown'} · {row.eventType === 'upgrade' ? 'Upgrade' : 'New'} · {row.leg === 'left' ? 'Left' : 'Right'} leg</div>
                    </td>
                    <td className="py-3 px-4 font-semibold" style={{ color: row.addsToStrong ? '#34d399' : '#f2d06b' }}>
                      {row.addsToStrong ? '+' : '−'}{fmtInt(pv)} PV
                    </td>
                    <td className="py-3 px-4 font-semibold" style={{ color: 'rgba(212,175,55,0.82)' }}>{fmtInt(toBp(row.strongRemainingAfter))} PV</td>
                  </tr>
                );
              })}
              {encodeAll.length === 0 && (
                <tr>
                  <td colSpan="5" className="py-14 text-center">
                    <HiOutlineChartBar className="size-8 mx-auto mb-2" style={{ color: 'rgba(212,175,55,0.2)' }} />
                    <p style={{ color: PORTAL_MUTED }}>No pairing encodes yet.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="lg:hidden p-4 space-y-3">
          {encodeRows.map((row, index) => {
            const pv = toBp(row.pointValue);
            return (
              <div key={row.encodeUid || index} className="glass-card rounded-2xl p-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate" style={{ color: PORTAL_TITLE }}>{row.fullName || row.username || '-'}</div>
                    <div className="text-[11px] mt-0.5" style={{ color: PORTAL_MUTED }}>{ENCODE_PKG[row.packageType] || 'Unknown'} · {row.leg === 'left' ? 'Left' : 'Right'} leg · {formatDateTimeManila(row.pairedAt)}</div>
                  </div>
                  <span className="text-sm font-bold flex-shrink-0" style={{ color: row.addsToStrong ? '#34d399' : '#f2d06b' }}>{row.addsToStrong ? '+' : '−'}{fmtInt(pv)} PV</span>
                </div>
                <div className="text-xs" style={{ color: PORTAL_TEXT }}>Strong leg remaining: <strong style={{ color: 'rgba(212,175,55,0.82)' }}>{fmtInt(toBp(row.strongRemainingAfter))} PV</strong></div>
              </div>
            );
          })}
          {encodeAll.length === 0 && (
            <div className="rounded-2xl border p-4 text-center" style={{ borderColor: PORTAL_BORDER, color: PORTAL_MUTED, background: PORTAL_SURFACE }}>
              No pairing encodes yet.
            </div>
          )}
        </div>
        <div className="px-4 sm:px-5 pb-4">
          <Pager
            page={encodePage}
            totalPages={encodeTotalPages}
            onPrev={() => setTracePage((p) => Math.max(1, p - 1))}
            onNext={() => setTracePage((p) => Math.min(encodeTotalPages, p + 1))}
          />
        </div>
      </div>
    </div>
  );
}
