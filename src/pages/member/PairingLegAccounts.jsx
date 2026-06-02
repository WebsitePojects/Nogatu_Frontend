import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { HiOutlineArrowLeft, HiOutlineArrowRight, HiOutlineChartBar, HiOutlineChevronDown, HiOutlineChevronUp } from 'react-icons/hi';
import api from '../../api';
import { formatDateTimeManila } from '../../utils/dateTime';

const BP_PESO_VALUE = 250;
const fmtMoney = (n) => `PHP ${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtInt = (n) => Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 0 });
const toBp = (pesoValue) => Number(Number(pesoValue || 0) / BP_PESO_VALUE);

function statusPill(status) {
  if (status === 'Fully Paired') {
    return { background: 'rgba(74,222,128,0.12)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.25)' };
  }
  if (status === 'Partially Paired') {
    return { background: 'rgba(251,191,36,0.12)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.25)' };
  }
  if (status === 'Not Eligible') {
    return { background: 'rgba(248,113,113,0.12)', color: '#f87171', border: '1px solid rgba(248,113,113,0.25)' };
  }
  return { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.72)', border: '1px solid rgba(255,255,255,0.1)' };
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <div className="size-10 rounded-full border-[3px] animate-spin" style={{ borderColor: 'rgba(212,175,55,0.12)', borderTopColor: '#D4AF37' }} />
      <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>Loading leg accounts...</p>
    </div>
  );
}

function EventBreakdown({ event }) {
  return (
    <div className="rounded-2xl p-4 space-y-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-white">{event.eventType === 'package_upgrade' ? 'Upgrade pairing bucket' : 'Registration pairing bucket'}</p>
          <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>{formatDateTimeManila(event.eventTs)}</p>
        </div>
        <span className="text-xs font-semibold" style={{ color: '#D4AF37' }}>
          {fmtInt(toBp(event.pointValue))} BP source
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
        <div>
          <p style={{ color: 'rgba(255,255,255,0.45)' }}>Matched</p>
          <p className="text-white">{fmtInt(toBp(event.matchedPoints))} BP</p>
        </div>
        <div>
          <p style={{ color: 'rgba(255,255,255,0.45)' }}>Remaining After</p>
          <p className="text-white">{fmtInt(toBp(event.remainingAfter))} BP</p>
        </div>
        <div>
          <p style={{ color: 'rgba(255,255,255,0.45)' }}>Package</p>
          <p className="text-white">{event.packageType || 'Current package'}</p>
        </div>
        <div>
          <p style={{ color: 'rgba(255,255,255,0.45)' }}>Consumed?</p>
          <p className="text-white">{event.fullyConsumed ? 'Yes' : 'Still pairable'}</p>
        </div>
      </div>

      {event.pairings?.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'rgba(212,175,55,0.78)' }}>Pairing Events Using This Bucket</p>
          {event.pairings.map((pair) => (
            <div key={`${event.eventUid}-${pair.ledgerUid}`} className="rounded-xl p-3 text-sm" style={{ background: 'rgba(0,0,0,0.16)' }}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <p className="text-white font-medium">{pair.counterpart?.fullName || pair.counterpart?.username || 'Counterpart account'}</p>
                  <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.42)' }}>{formatDateTimeManila(pair.pairedAt)}</p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-white font-semibold">{fmtInt(toBp(pair.matchedPoints))} BP matched</p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.42)' }}>Remaining after this event: {fmtInt(toBp(pair.remainingAfter))} BP</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3 text-xs" style={{ color: 'rgba(255,255,255,0.68)' }}>
                <div>Gross: {fmtMoney(pair.grossIncome)}</div>
                <div>Credited: {fmtMoney(pair.creditedIncome)}</div>
                <div>Blocked: {fmtMoney(pair.blockedIncome)}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>This bucket has not been matched yet.</p>
      )}
    </div>
  );
}

export default function PairingLegAccounts() {
  const navigate = useNavigate();
  const { side } = useParams();
  const normalizedSide = side === 'right' ? 'right' : 'left';
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [expandedUid, setExpandedUid] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      setLoading(true);
      try {
        const res = await api.get(`/pairing/leg/${normalizedSide}?page=${page}&perPage=50`);
        if (!cancelled) setData(res.data);
      } catch {
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadData();
    return () => { cancelled = true; };
  }, [normalizedSide, page]);

  const summaryCards = useMemo(() => {
    const summary = data?.summary || {};
    return [
      { label: 'Total Accounts', value: fmtInt(summary.totalAccounts || 0) },
      { label: 'Eligible Accounts', value: fmtInt(summary.eligibleAccounts || 0) },
      { label: 'Matched BP', value: `${fmtInt(toBp(summary.totalMatchedPoints || 0))} BP` },
      { label: 'Remaining BP', value: `${fmtInt(toBp(summary.totalRemainingPoints || 0))} BP` },
    ];
  }, [data]);

  if (loading) return <LoadingState />;
  if (!data) return <p style={{ color: 'rgba(255,255,255,0.45)' }}>Unable to load this leg right now.</p>;

  const sideLabel = normalizedSide === 'left' ? 'Left Leg Accounts' : 'Right Leg Accounts';
  const sideIcon = normalizedSide === 'left' ? HiOutlineArrowLeft : HiOutlineArrowRight;
  const SideIcon = sideIcon;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm" style={{ color: 'rgba(255,255,255,0.58)' }}>
        <Link to="/pairing" className="hover:text-white transition-colors">Pairing Reports</Link>
        <span>/</span>
        <span className="text-white">{sideLabel}</span>
      </div>

      <button type="button" onClick={() => navigate('/pairing')} className="inline-flex items-center gap-2 text-sm font-semibold" style={{ color: '#D4AF37' }}>
        <HiOutlineArrowLeft className="size-4" />
        Back to Pairing Reports
      </button>

      <div className="glass-card rounded-3xl p-6 sm:p-8 overflow-hidden relative">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at top right, rgba(212,175,55,0.14), transparent 55%)' }} />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="max-w-3xl">
            <div className="size-12 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(212,175,55,0.16)', border: '1px solid rgba(212,175,55,0.4)' }}>
              <SideIcon className="size-6" style={{ color: '#D4AF37' }} />
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">{sideLabel}</h1>
            <p className="text-sm mt-3 leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>
              {data.formula}
            </p>
            <p className="text-xs mt-3" style={{ color: 'rgba(212,175,55,0.7)' }}>
              Strong-leg status right now: {data.summary?.strongLeg === 'balanced' ? 'Balanced' : `${data.summary?.strongLeg || normalizedSide} leg leads on remaining BP`}.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {summaryCards.map((card) => (
          <div key={card.label} className="glass-card rounded-2xl p-4">
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>{card.label}</p>
            <p className="text-lg font-bold mt-1 text-white">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-white">Accounts On This Leg</h2>
            <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Sorted by level. Open any row to inspect the source bucket, the counterpart matches, and the remaining pairable BP after each event.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page <= 1}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
              style={{ background: 'rgba(212,175,55,0.1)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.2)' }}
            >
              Prev
            </button>
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>{data.page} / {data.totalPages}</span>
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(Number(data.totalPages || 1), current + 1))}
              disabled={page >= Number(data.totalPages || 1)}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
              style={{ background: 'rgba(212,175,55,0.1)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.2)' }}
            >
              Next
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {data.rows?.map((row) => {
            const expanded = expandedUid === row.sourceMemberUid;
            const pill = statusPill(row.pairingStatus);
            return (
              <div key={row.sourceMemberUid} className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <button
                  type="button"
                  onClick={() => setExpandedUid(expanded ? null : row.sourceMemberUid)}
                  className="w-full text-left"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base font-semibold text-white">{row.fullName}</p>
                        <span className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.45)' }}>@{row.username}</span>
                        <span className="text-[11px] px-2 py-1 rounded-full font-semibold" style={pill}>{row.pairingStatus}</span>
                      </div>
                      <div className="flex flex-wrap gap-2 text-[11px]" style={{ color: 'rgba(255,255,255,0.6)' }}>
                        <span>Level {fmtInt(row.depth)}</span>
                        <span>{row.accountStateLabel}</span>
                        <span>{row.isDirectReferral ? 'Direct referral' : `Spillover via ${row.placementUsername || 'binary parent'}`}</span>
                        <span>{row.unlockQualifiedDirect ? 'Counts for direct-leg unlock' : 'Does not unlock direct-leg gate'}</span>
                        <span>{row.isStrongLeg ? 'Strong leg account' : 'Weak leg account'}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:min-w-[34rem]">
                      <div>
                        <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.45)' }}>Source BP</p>
                        <p className="text-white font-semibold">{fmtInt(toBp(row.totalSourcePoints))} BP</p>
                      </div>
                      <div>
                        <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.45)' }}>Matched</p>
                        <p className="text-white font-semibold">{fmtInt(toBp(row.totalMatchedPoints))} BP</p>
                      </div>
                      <div>
                        <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.45)' }}>Remaining</p>
                        <p className="text-white font-semibold">{fmtInt(toBp(row.remainingPoints))} BP</p>
                      </div>
                      <div className="flex items-center justify-end">
                        {expanded ? <HiOutlineChevronUp className="size-5" style={{ color: '#D4AF37' }} /> : <HiOutlineChevronDown className="size-5" style={{ color: '#D4AF37' }} />}
                      </div>
                    </div>
                  </div>
                </button>

                {expanded ? (
                  <div className="mt-4 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                      <div className="rounded-xl p-3" style={{ background: 'rgba(0,0,0,0.16)' }}>
                        <p style={{ color: 'rgba(255,255,255,0.45)' }}>Registered / Added</p>
                        <p className="text-white mt-1">{row.registeredAt ? formatDateTimeManila(row.registeredAt) : '-'}</p>
                      </div>
                      <div className="rounded-xl p-3" style={{ background: 'rgba(0,0,0,0.16)' }}>
                        <p style={{ color: 'rgba(255,255,255,0.45)' }}>Source Buckets</p>
                        <p className="text-white mt-1">{fmtInt(row.eventCount || 0)}</p>
                      </div>
                      <div className="rounded-xl p-3" style={{ background: 'rgba(0,0,0,0.16)' }}>
                        <p style={{ color: 'rgba(255,255,255,0.45)' }}>Eligibility</p>
                        <p className="text-white mt-1">{row.eligibleSource ? 'Can contribute BP upward' : 'Cannot contribute BP upward yet'}</p>
                      </div>
                    </div>
                    {row.details?.map((event) => (
                      <EventBreakdown key={event.eventUid} event={event} />
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}

          {(!data.rows || data.rows.length === 0) && (
            <div className="rounded-2xl p-8 text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <HiOutlineChartBar className="size-8 mx-auto mb-3" style={{ color: 'rgba(212,175,55,0.25)' }} />
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>No source accounts are available on this leg yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
