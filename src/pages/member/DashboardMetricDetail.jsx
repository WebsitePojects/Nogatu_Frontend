import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  HiOutlineCash,
  HiOutlineChartBar,
  HiOutlineGift,
  HiOutlineShieldCheck,
  HiOutlineStar,
  HiOutlineTrendingUp,
  HiOutlineUsers,
  HiOutlineDownload,
} from 'react-icons/hi';
import api from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { formatDateTimeManila } from '../../utils/dateTime';

const fmtMoney = (n) => `PHP ${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtInt = (n) => Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 0 });
const PORTAL_TITLE = 'var(--portal-card-title)';
const PORTAL_TEXT = 'var(--portal-card-text)';
const PORTAL_MUTED = 'var(--portal-card-muted)';
const PORTAL_SURFACE = 'var(--portal-soft-bg)';
const PORTAL_BORDER = 'var(--portal-soft-border)';
const PORTAL_ROW = 'var(--portal-row-border)';
const SYSTEM_GOLD = '#D4AF37';

function sanitizeFormulaText(value) {
  return String(value || '')
    .replace(/\bincome[1-9]\b/gi, 'credited income')
    .replace(/\bpayouthistorytab\b/gi, 'payout history')
    .replace(/\bpayouttotaltab\b/gi, 'wallet totals')
    .replace(/\bpairingstab\b/gi, 'pairing history')
    .trim();
}

const METRIC_CONFIG = {
  'direct-referral': {
    title: 'Direct Referral Breakdown',
    subtitle: 'This shows the direct referral income entries and the people connected to those earnings.',
    icon: HiOutlineUsers,
    accent: '#D4AF37',
    cta: { to: '/referrals', label: 'Open Direct Referrals' },
  },
  'uni-level': {
    title: 'Uni-Level Breakdown',
    subtitle: 'This page shows your current maintenance status, required points, and the Uni-Level payout entries already credited.',
    icon: HiOutlineTrendingUp,
    accent: '#D4AF37',
    cta: { to: '/ewallet', label: 'Open E-Wallet' },
  },
  'leadership-bonus': {
    title: 'Leadership Bonus Breakdown',
    subtitle: 'These are the credited leadership bonus records that make up the number shown on the dashboard.',
    icon: HiOutlineStar,
    accent: '#F2D06B',
    cta: { to: '/ewallet', label: 'Open E-Wallet' },
  },
  'hi-five-bonus': {
    title: 'Hi-Five Bonus Breakdown',
    subtitle: 'This shows the credited Hi-Five bonus entries. Product and package bonus workflows can branch from the Hi-Five page.',
    icon: HiOutlineGift,
    accent: '#D4820A',
    cta: { to: '/hifive', label: 'Open Hi-Five Bonus Page' },
  },
  'ranking-bonus': {
    title: 'Ranking Bonus Breakdown',
    subtitle: 'This shows credited ranking bonus entries. For rank progress, consumed points, and ladder rules, open Ranking Progress.',
    icon: HiOutlineShieldCheck,
    accent: '#FFD700',
    cta: { to: '/ranking', label: 'Open Ranking Progress' },
  },
};

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div
        className="size-12 rounded-full border-[3px] animate-spin"
        style={{ borderColor: 'rgba(212,175,55,0.15)', borderTopColor: '#D4AF37' }}
      />
      <p className="text-sm" style={{ color: PORTAL_MUTED }}>Loading breakdown...</p>
    </div>
  );
}

function SummaryCard({ label, value, accent, helper }) {
  return (
    <div className="rounded-2xl p-4" style={{ background: PORTAL_SURFACE, border: `1px solid ${PORTAL_BORDER}`, boxShadow: 'var(--portal-box-shadow)' }}>
      <p className="text-xs" style={{ color: PORTAL_MUTED }}>{label}</p>
      <p className="text-lg font-bold mt-1" style={{ color: accent || PORTAL_TITLE }}>{value}</p>
      {helper && <p className="text-[10px] mt-1 leading-4" style={{ color: PORTAL_MUTED }}>{helper}</p>}
    </div>
  );
}

function Pager({ page = 1, totalPages = 1, onPrev, onNext, className = '' }) {
  return (
    <div className={`flex items-center justify-between sm:justify-end gap-2 flex-nowrap whitespace-nowrap overflow-x-auto ${className}`}>
      <button
        type="button"
        onClick={onPrev}
        disabled={page <= 1}
        className="rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-40 shrink-0"
        style={{ background: 'rgba(212,175,55,0.1)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.2)' }}
      >
        Prev
      </button>
      <span className="text-xs shrink-0" style={{ color: PORTAL_MUTED }}>{page} / {totalPages}</span>
      <button
        type="button"
        onClick={onNext}
        disabled={page >= totalPages}
        className="rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-40 shrink-0"
        style={{ background: 'rgba(212,175,55,0.1)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.2)' }}
      >
        Next
      </button>
    </div>
  );
}

function IncomeEntryCard({ row, accent, metric }) {
  const dateValue = row.transdate || row.date || row.event_ts || row.created_at || null;
  const amount = row.amount ?? row.total ?? row.pairamount ?? 0;

  return (
    <div className="rounded-2xl p-4 space-y-3" style={{ background: PORTAL_SURFACE, border: `1px solid ${PORTAL_BORDER}` }}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <p className="text-sm font-semibold" style={{ color: PORTAL_TITLE }}>
            {metric === 'direct-referral' && row.fullname ? row.fullname : 'Income Entry'}
          </p>
          <p className="text-xs mt-1" style={{ color: PORTAL_MUTED }}>
            {dateValue ? formatDateTimeManila(dateValue) : 'Date not available'}
          </p>
        </div>
        <div className="text-sm font-bold" style={{ color: accent }}>
          {fmtMoney(amount)}
        </div>
      </div>

      {metric === 'direct-referral' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <p style={{ color: PORTAL_MUTED }}>Triggered By</p>
            <p style={{ color: PORTAL_TITLE }}>{row.fullname || row.username || 'Not available'}</p>
          </div>
          <div>
            <p style={{ color: PORTAL_MUTED }}>Account Username</p>
            <p style={{ color: PORTAL_TITLE }}>{row.username || 'Not available'}</p>
          </div>
          <div>
            <p style={{ color: PORTAL_MUTED }}>Package</p>
            <p style={{ color: PORTAL_TITLE }}>{row.accountType || 'Not available'}</p>
          </div>
          <div>
            <p style={{ color: PORTAL_MUTED }}>Credit Source</p>
            <p style={{ color: PORTAL_TITLE }}>{row.rowType === 'upgrade_incentive' ? 'Upgrade incentive from referral' : 'Referral signup package'}</p>
          </div>
          <div>
            <p style={{ color: PORTAL_MUTED }}>Entry Audit</p>
            <p style={{ color: PORTAL_TITLE }}>{row.entryType || 'Not available'}</p>
          </div>
          <div className="sm:col-span-2">
            <p style={{ color: PORTAL_MUTED }}>Sponsor Credit Rule</p>
            <p style={{ color: PORTAL_TITLE }}>
              {row.sponsorCreditEligible
                ? 'This referral entry currently counts toward sponsor direct-referral credit.'
                : 'This referral entry is currently excluded from sponsor direct-referral credit.'}
            </p>
          </div>
        </div>
      )}

      {metric === 'uni-level' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <p style={{ color: PORTAL_MUTED }}>Source</p>
            <p style={{ color: PORTAL_TITLE }}>
              {row.rowType === 'downline_product_points' ? row.fullname || row.username || 'Downline product points' : 'Uni-Level payout entry'}
            </p>
          </div>
          <div>
            <p style={{ color: PORTAL_MUTED }}>Reference</p>
            <p style={{ color: PORTAL_TITLE }}>{row.processid || row.processKey || row.productName || `PID ${row.pid || '-'}`}</p>
          </div>
          {row.rowType === 'downline_product_points' ? (
            <>
              <div>
                <p style={{ color: PORTAL_MUTED }}>Unilevel Level</p>
                <p style={{ color: PORTAL_TITLE }}>Level {row.level || '-'}</p>
              </div>
              <div>
                <p style={{ color: PORTAL_MUTED }}>Product Points</p>
                <p style={{ color: PORTAL_TITLE }}>{fmtInt(row.productPoints || 0)} pts</p>
              </div>
              <div>
                <p style={{ color: PORTAL_MUTED }}>Rate</p>
                <p style={{ color: PORTAL_TITLE }}>{Number(row.ratePercent || 0)}%</p>
              </div>
              <div>
                <p style={{ color: PORTAL_MUTED }}>Purchases</p>
                <p style={{ color: PORTAL_TITLE }}>{fmtInt(row.purchaseCount || 0)}</p>
              </div>
            </>
          ) : null}
          {row.rowType === 'credited_unilevel_payout' ? (
            <div>
              <p style={{ color: PORTAL_MUTED }}>Credited Payout</p>
              <p style={{ color: PORTAL_TITLE }}>Already posted to payout history</p>
            </div>
          ) : null}
          </div>
      )}

      {metric === 'leadership-bonus' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <p style={{ color: PORTAL_MUTED }}>Triggered By</p>
            <p style={{ color: PORTAL_TITLE }}>{row.fullname || row.username || 'Not available'}</p>
          </div>
          <div>
            <p style={{ color: PORTAL_MUTED }}>Username</p>
            <p style={{ color: PORTAL_TITLE }}>{row.username || 'Not available'}</p>
          </div>
          <div>
            <p style={{ color: PORTAL_MUTED }}>Leadership Level</p>
            <p style={{ color: PORTAL_TITLE }}>Level {row.level || '-'}</p>
          </div>
          <div>
            <p style={{ color: PORTAL_MUTED }}>Rate</p>
            <p style={{ color: PORTAL_TITLE }}>{Number(row.ratePercent || 0)}%</p>
          </div>
          <div>
            <p style={{ color: PORTAL_MUTED }}>Source Pairing Income</p>
            <p style={{ color: PORTAL_TITLE }}>{fmtMoney(row.pairingIncome || 0)}</p>
          </div>
          <div>
            <p style={{ color: PORTAL_MUTED }}>Direct Referrals</p>
            <p style={{ color: PORTAL_TITLE }}>{fmtInt(row.directReferralCount || 0)}</p>
          </div>
        </div>
      )}

      {metric === 'hi-five-bonus' && (
        <div className="text-sm">
          <p style={{ color: PORTAL_MUTED }}>Reference</p>
          <p style={{ color: PORTAL_TITLE }}>{row.processid || row.processKey || `PID ${row.pid || '-'}`}</p>
        </div>
      )}

      {metric === 'ranking-bonus' && (
        <div className="text-sm">
          <p style={{ color: PORTAL_MUTED }}>Reference</p>
          <p style={{ color: PORTAL_TITLE }}>{row.processid || row.processKey || `PID ${row.pid || '-'}`}</p>
        </div>
      )}
    </div>
  );
}

export default function DashboardMetricDetail() {
  const { user } = useAuth();
  const { metric } = useParams();
  const config = METRIC_CONFIG[metric];
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;

    async function loadBreakdown() {
      setLoading(true);
      try {
        const params = metric === 'leadership-bonus'
          ? `?page=${page}&perPage=50`
          : '';
        const res = await api.get(`/dashboard/breakdown/${metric}${params}`);
        if (!cancelled) setData(res.data);
      } catch {
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadBreakdown();
    return () => { cancelled = true; };
  }, [metric, page]);

  async function handleExportCsv() {
    const res = await api.get(`/dashboard/breakdown/${metric}/export?format=csv`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${metric}-breakdown.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  function handleExportPdf() {
    window.print();
  }

  if (!config) {
    return (
      <div className="space-y-6">
        <p style={{ color: PORTAL_MUTED }}>This dashboard detail page is not available.</p>
      </div>
    );
  }

  if (loading) return <LoadingState />;
  if (!data) return <p style={{ color: PORTAL_MUTED }}>Unable to load this breakdown right now.</p>;

  const Icon = config.icon;
  const rows = data.rows || [];
  const leadershipRows = data.levelRows || [];
  const leadershipPrintRows = leadershipRows.length > 0 ? leadershipRows : rows;
  const leadershipGroups = leadershipRows.reduce((map, row) => {
    const level = Number(row.level || 0);
    if (!map[level]) map[level] = [];
    map[level].push(row);
    return map;
  }, {});
  const leadershipLevels = Object.keys(leadershipGroups).map(Number).sort((a, b) => a - b);
  const uniProgressPercent = metric === 'uni-level' && data.eligibility
    ? Math.max(0, Math.min(100, (Number(data.eligibility.currentPoints || 0) / Math.max(1, Number(data.eligibility.requiredPoints || 200))) * 100))
    : 0;
  const printedAt = formatDateTimeManila(new Date());
  const receiptNumber = `LB-${String(user?.username || 'MEMBER').toUpperCase()}-${String(new Date().getTime()).slice(-6)}`;
  const actionAccent = metric === 'leadership-bonus' ? SYSTEM_GOLD : config.accent;

  return (
    <div>
      {metric === 'leadership-bonus' ? (
        <div className="print-only print-ticket-sheet">
          <div className="print-ticket-card">
            <div className="print-ticket-band">
              <div className="print-ticket-band-top">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.28em] opacity-80">NOGATU Alliance Worldwide, Inc.</p>
                  <h1 className="mt-2 text-[1.7rem] font-bold leading-tight">Leadership Bonus Receipt</h1>
                  <p className="mt-1 text-sm opacity-90">Wellness You Can Taste, Quality You Can Trust.</p>
                </div>
                <div className="print-ticket-doc-chip">
                  <p className="print-ticket-doc-label">Document No.</p>
                  <p className="print-ticket-doc-value">{receiptNumber}</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-5">
              <div className="print-ticket-ribbon">
                <div>
                  <p className="print-ticket-mini-label">Prepared For</p>
                  <p className="print-ticket-mini-value">{user?.accountname || user?.shortname || 'Member'}</p>
                </div>
                <div>
                  <p className="print-ticket-mini-label">Receipt Type</p>
                  <p className="print-ticket-mini-value">Leadership Bonus Accounting Record</p>
                </div>
                <div>
                  <p className="print-ticket-mini-label">Status</p>
                  <p className="print-ticket-mini-value">Print Ready</p>
                </div>
              </div>

              <div className="print-ticket-grid">
                <div className="print-ticket-cell">
                  <p className="print-ticket-field-label">Member Name</p>
                  <p className="print-ticket-field-value">{user?.accountname || user?.shortname || 'Member'}</p>
                </div>
                <div className="print-ticket-cell">
                  <p className="print-ticket-field-label">Username</p>
                  <p className="print-ticket-field-value">{user?.username || '-'}</p>
                </div>
                <div className="print-ticket-cell">
                  <p className="print-ticket-field-label">Account Type</p>
                  <p className="print-ticket-field-value">{user?.caccttype || '-'}</p>
                </div>
                <div className="print-ticket-cell">
                  <p className="print-ticket-field-label">Printed At</p>
                  <p className="print-ticket-field-value">{printedAt}</p>
                </div>
                <div className="print-ticket-cell">
                  <p className="print-ticket-field-label">Report As Of</p>
                  <p className="print-ticket-field-value">{data.asOf ? formatDateTimeManila(data.asOf) : 'Now'}</p>
                </div>
                <div className="print-ticket-cell">
                  <p className="print-ticket-field-label">Direct Referrals Counted</p>
                  <p className="print-ticket-field-value">{fmtInt(data.summary?.directReferralCount || 0)}</p>
                </div>
              </div>

              <div className="print-ticket-total-grid">
                <div className="print-ticket-total-card">
                  <p className="print-ticket-total-label">Total Leadership Bonus</p>
                  <p className="print-ticket-total-value">{fmtMoney(data.total || 0)}</p>
                </div>
                <div className="print-ticket-cell">
                  <p className="print-ticket-field-label">Entries Included</p>
                  <p className="print-ticket-field-value">{fmtInt(leadershipPrintRows.length)}</p>
                </div>
              </div>

              <div className="print-ticket-note">
                <p className="print-ticket-field-label">Accounting Note</p>
                <p className="mt-2 text-xs leading-6 text-slate-700">{sanitizeFormulaText(data.formula)}</p>
              </div>

              <table className="print-ticket-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Member</th>
                    <th>Username</th>
                    <th>Level</th>
                    <th>Rate</th>
                    <th>Source Pairing</th>
                    <th>Leadership Bonus</th>
                    <th>Direct Referrals</th>
                  </tr>
                </thead>
                <tbody>
                  {leadershipPrintRows.map((row, index) => (
                    <tr key={`${row.uid || row.username || index}-print`}>
                      <td>{index + 1}</td>
                      <td>{row.fullname || row.username || '-'}</td>
                      <td>{row.username || '-'}</td>
                      <td>Level {row.level || '-'}</td>
                      <td>{Number(row.ratePercent || 0)}%</td>
                      <td>{fmtMoney(row.pairingIncome || 0)}</td>
                      <td>{fmtMoney(row.amount || 0)}</td>
                      <td>{fmtInt(row.directReferralCount || 0)}</td>
                    </tr>
                  ))}
                  {leadershipPrintRows.length === 0 ? (
                    <tr>
                      <td colSpan="8">No leadership breakdown entries are available for this reporting period.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>

              <div className="print-ticket-footer">
                <div className="print-ticket-signoff">
                  <span>Prepared by:</span>
                  <div className="print-ticket-signature-line" />
                </div>
                <div className="print-ticket-signoff">
                  <span>Checked by:</span>
                  <div className="print-ticket-signature-line" />
                </div>
                <div className="print-ticket-footnote">
                  This receipt is a print-ready accounting summary of the member's leadership bonus breakdown.
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="screen-only space-y-6">
        <div className="glass-card rounded-3xl p-6 sm:p-8 overflow-hidden relative">
        <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(circle at top right, ${config.accent}1e, transparent 55%)` }} />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="max-w-3xl">
            <div className="size-12 rounded-2xl flex items-center justify-center mb-4" style={{ background: `${config.accent}20`, border: `1px solid ${config.accent}45` }}>
              <Icon className="size-6" style={{ color: config.accent }} />
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold" style={{ color: PORTAL_TITLE }}>{config.title}</h1>
            <p className="text-sm mt-3 leading-relaxed" style={{ color: PORTAL_TEXT }}>
              {config.subtitle}
            </p>
            <p className="text-xs mt-3" style={{ color: 'rgba(212,175,55,0.7)' }}>
              {sanitizeFormulaText(data.formula)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {metric === 'leadership-bonus' ? (
              <>
                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
                  style={{ background: `${actionAccent}16`, color: actionAccent, border: `1px solid ${actionAccent}33` }}
                >
                  <HiOutlineDownload className="size-4" />
                  Export CSV
                </button>
                <button
                  type="button"
                  onClick={handleExportPdf}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
                  style={{ background: PORTAL_SURFACE, color: PORTAL_TITLE, border: `1px solid ${PORTAL_BORDER}` }}
                >
                  <HiOutlineDownload className="size-4" />
                  Export PDF
                </button>
              </>
            ) : null}
            <Link
              to={config.cta.to}
              className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-semibold"
              style={{ background: `${actionAccent}16`, color: actionAccent, border: `1px solid ${actionAccent}33` }}
            >
              {config.cta.label}
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <SummaryCard label="Total" value={typeof data.total === 'number' ? fmtMoney(data.total) : data.total} accent={config.accent} />
        <SummaryCard label="Entries Shown" value={fmtInt(rows.length)} />
        <SummaryCard label="As Of" value={data.asOf ? formatDateTimeManila(data.asOf) : 'Now'} />
        {metric === 'uni-level' ? (
          <SummaryCard
            label="This Month Accruing"
            value={fmtMoney(data.eligibility?.projectedDownlineAmount || 0)}
            accent={config.accent}
            helper="Projected from current-month downline product points — released at month-end when maintenance is met"
          />
        ) : metric === 'leadership-bonus' ? (
          <SummaryCard label="Direct Referrals" value={`${fmtInt(data.summary?.directReferralCount || 0)} referrals`} />
        ) : (
          <SummaryCard label="Traceability" value="Readable breakdown" />
        )}
      </div>

        {metric === 'uni-level' && data.eligibility && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <SummaryCard label="Current Product Points" value={`${fmtInt(data.eligibility.currentPoints)} pts`} accent={config.accent} />
            <SummaryCard label="Required Product Points" value={`${fmtInt(data.eligibility.requiredPoints)} pts`} />
            <SummaryCard label="Still Needed" value={`${fmtInt(data.eligibility.neededPoints)} pts`} />
            <SummaryCard label="Downline Product Points" value={`${fmtInt(data.eligibility.downlineProductPoints || 0)} pts`} accent={config.accent} />
          </div>
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <h2 className="font-display text-lg font-semibold" style={{ color: PORTAL_TITLE }}>Maintenance Progress</h2>
                <p className="text-xs mt-1" style={{ color: PORTAL_MUTED }}>
                  Your own product repurchase points must hit the current-month requirement before Uni-Level is released.
                </p>
              </div>
              <div className="text-sm font-semibold" style={{ color: config.accent }}>
                {fmtInt(data.eligibility.currentPoints)} / {fmtInt(data.eligibility.requiredPoints)} pts
              </div>
            </div>
            <div className="h-3 rounded-full overflow-hidden" style={{ background: 'color-mix(in srgb, var(--portal-soft-bg) 75%, var(--portal-accent-bg))' }}>
              <div className="h-full rounded-full transition-all duration-300" style={{ width: `${uniProgressPercent}%`, background: 'linear-gradient(90deg,#D4AF37,#F2D06B)' }} />
            </div>
            <div className="flex items-center justify-between gap-3 mt-3 text-xs" style={{ color: PORTAL_MUTED }}>
              <span>{data.eligibility.eligible ? 'Eligible for current-month Uni-Level release' : 'Still building monthly maintenance'}</span>
              <span>{Math.round(uniProgressPercent)}%</span>
            </div>
          </div>
        </div>
      )}

      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="font-display text-lg font-semibold" style={{ color: PORTAL_TITLE }}>Entries Behind This Number</h2>
          </div>
          {metric === 'leadership-bonus' && data?.pagination ? (
            <Pager
              page={data.pagination.page}
              totalPages={data.pagination.totalPages}
              onPrev={() => setPage((current) => Math.max(1, current - 1))}
              onNext={() => setPage((current) => Math.min(Number(data.pagination.totalPages || 1), current + 1))}
            />
          ) : null}
        </div>

        <div className="space-y-3 max-h-[34rem] overflow-y-auto pr-1">
          {rows.length > 0 ? rows.map((row, index) => (
            <IncomeEntryCard
              key={`${row.pid || row.id || row.uid || row.processKey || index}`}
              row={row}
              accent={config.accent}
              metric={metric}
            />
          )) : (
            <div className="rounded-2xl p-8 text-center" style={{ background: PORTAL_SURFACE, border: `1px solid ${PORTAL_BORDER}` }}>
              <HiOutlineCash className="size-8 mx-auto mb-3" style={{ color: 'rgba(212,175,55,0.25)' }} />
              <p className="text-sm" style={{ color: PORTAL_MUTED }}>No breakdown entries are available yet.</p>
            </div>
          )}
        </div>
        {metric === 'leadership-bonus' && data?.pagination ? (
          <Pager
            page={data.pagination.page}
            totalPages={data.pagination.totalPages}
            onPrev={() => setPage((current) => Math.max(1, current - 1))}
            onNext={() => setPage((current) => Math.min(Number(data.pagination.totalPages || 1), current + 1))}
            className="mt-4"
          />
        ) : null}
      </div>

      {metric === 'leadership-bonus' ? (
        <div className="space-y-6">
        <div className="glass-card rounded-2xl p-5">
          <h2 className="font-display text-lg font-semibold" style={{ color: PORTAL_TITLE }}>Leadership Summary</h2>
          <div className="space-y-4 mt-4">
            {leadershipLevels.map((level) => (
              <div key={`leadership-level-${level}`} className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold" style={{ color: PORTAL_TITLE }}>Level {level}</h3>
                  <span className="text-xs" style={{ color: PORTAL_MUTED }}>{leadershipGroups[level].length} account(s)</span>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-1 md:grid md:grid-cols-2 xl:grid-cols-3 md:overflow-visible">
                  {leadershipGroups[level].map((row, index) => (
                    <div
                      key={`${row.uid || row.username || index}-level-card`}
                      className="rounded-2xl p-4 space-y-3 min-w-[260px] md:min-w-0"
                      style={{ background: PORTAL_SURFACE, border: `1px solid ${PORTAL_BORDER}` }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm" style={{ color: PORTAL_TITLE }}>{row.fullname || row.username}</p>
                          <p className="text-xs mt-1" style={{ color: PORTAL_MUTED }}>{row.username || '-'} - Level {row.level}</p>
                        </div>
                        <p className="text-xs" style={{ color: PORTAL_MUTED }}>#{index + 1}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="rounded-xl p-3" style={{ background: 'color-mix(in srgb, var(--portal-soft-bg) 76%, transparent)' }}>
                          <p className="text-[11px]" style={{ color: PORTAL_MUTED }}>Source Pairing</p>
                          <p className="mt-1" style={{ color: PORTAL_TEXT }}>{fmtMoney(row.pairingIncome || 0)}</p>
                        </div>
                        <div className="rounded-xl p-3" style={{ background: 'color-mix(in srgb, var(--portal-soft-bg) 76%, transparent)' }}>
                          <p className="text-[11px]" style={{ color: PORTAL_MUTED }}>Leadership Bonus</p>
                          <p className="mt-1 font-semibold" style={{ color: config.accent }}>{fmtMoney(row.amount || 0)}</p>
                        </div>
                        <div className="rounded-xl p-3 col-span-2" style={{ background: 'color-mix(in srgb, var(--portal-soft-bg) 76%, transparent)' }}>
                          <p className="text-[11px]" style={{ color: PORTAL_MUTED }}>Direct Referrals</p>
                          <p className="mt-1" style={{ color: PORTAL_TEXT }}>{fmtInt(row.directReferralCount || 0)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {leadershipLevels.length === 0 && (
              <div className="rounded-2xl p-5 text-center" style={{ background: PORTAL_SURFACE, border: `1px solid ${PORTAL_BORDER}`, color: PORTAL_MUTED }}>
                No leadership contributors found.
              </div>
            )}
          </div>
          <div className="hidden">
            {rows.map((row, index) => (
              <div
                key={`${row.uid || row.username || index}-summary-mobile`}
                className="rounded-2xl p-4 space-y-3"
                style={{ background: PORTAL_SURFACE, border: `1px solid ${PORTAL_BORDER}` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm" style={{ color: PORTAL_TITLE }}>{row.fullname || row.username}</p>
                    <p className="text-xs mt-1" style={{ color: PORTAL_MUTED }}>Level {row.level} · {Number(row.ratePercent || 0)}%</p>
                  </div>
                  <p className="text-xs" style={{ color: PORTAL_MUTED }}>#{((Number(data?.pagination?.page || 1) - 1) * 50) + index + 1}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl p-3" style={{ background: 'color-mix(in srgb, var(--portal-soft-bg) 76%, transparent)' }}>
                    <p className="text-[11px]" style={{ color: PORTAL_MUTED }}>Source Pairing</p>
                    <p className="mt-1" style={{ color: PORTAL_TEXT }}>{fmtMoney(row.pairingIncome || 0)}</p>
                  </div>
                  <div className="rounded-xl p-3" style={{ background: 'color-mix(in srgb, var(--portal-soft-bg) 76%, transparent)' }}>
                    <p className="text-[11px]" style={{ color: PORTAL_MUTED }}>Leadership Bonus</p>
                    <p className="mt-1 font-semibold" style={{ color: config.accent }}>{fmtMoney(row.amount || 0)}</p>
                  </div>
                  <div className="rounded-xl p-3 col-span-2" style={{ background: 'color-mix(in srgb, var(--portal-soft-bg) 76%, transparent)' }}>
                    <p className="text-[11px]" style={{ color: PORTAL_MUTED }}>Direct Referrals</p>
                    <p className="mt-1" style={{ color: PORTAL_TEXT }}>{fmtInt(row.directReferralCount || 0)}</p>
                  </div>
                </div>
              </div>
            ))}
            <div className="rounded-2xl p-4" style={{ background: PORTAL_SURFACE, border: `1px solid ${PORTAL_BORDER}` }}>
              <p className="text-sm font-semibold" style={{ color: PORTAL_TITLE }}>Overall Total</p>
              <p className="mt-2 font-bold" style={{ color: config.accent }}>{fmtMoney(data.total || 0)}</p>
              <p className="text-xs mt-1" style={{ color: PORTAL_MUTED }}>Direct referrals: {fmtInt(data.summary?.directReferralCount || 0)}</p>
            </div>
          </div>
          <div className="hidden md:block overflow-x-auto mt-4">
            <table className="w-full text-sm min-w-[720px]">
              <thead>
                <tr>
                  {['#', 'Member', 'Level', 'Rate', 'Source Pairing', 'Leadership Bonus', 'Direct Referrals'].map((heading) => (
                    <th key={heading} className="table-header p-3 text-left text-xs uppercase tracking-wide">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={`${row.uid || row.username || index}-summary`} style={{ borderBottom: `1px solid ${PORTAL_ROW}` }}>
                    <td className="p-3" style={{ color: PORTAL_MUTED }}>{((Number(data?.pagination?.page || 1) - 1) * 50) + index + 1}</td>
                    <td className="p-3" style={{ color: PORTAL_TITLE }}>{row.fullname || row.username}</td>
                    <td className="p-3" style={{ color: PORTAL_TEXT }}>Level {row.level}</td>
                    <td className="p-3" style={{ color: PORTAL_TEXT }}>{Number(row.ratePercent || 0)}%</td>
                    <td className="p-3" style={{ color: PORTAL_TEXT }}>{fmtMoney(row.pairingIncome || 0)}</td>
                    <td className="p-3 font-semibold" style={{ color: config.accent }}>{fmtMoney(row.amount || 0)}</td>
                    <td className="p-3" style={{ color: PORTAL_TEXT }}>{fmtInt(row.directReferralCount || 0)}</td>
                  </tr>
                ))}
                <tr>
                  <td className="p-3 font-semibold" style={{ color: PORTAL_TITLE }} colSpan="5">Overall Total</td>
                  <td className="p-3 font-bold" style={{ color: config.accent }}>{fmtMoney(data.total || 0)}</td>
                  <td className="p-3" style={{ color: PORTAL_TEXT }}>{fmtInt(data.summary?.directReferralCount || 0)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div className="glass-card rounded-2xl p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-semibold" style={{ color: PORTAL_TITLE }}>All Leadership Accounts By Level</h2>
              <p className="text-xs mt-1" style={{ color: PORTAL_MUTED }}>
                Full leadership tree sorted by level, limited to accounts that actually generated leadership income for this balance.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs" style={{ color: PORTAL_TEXT }}>
              <span>Level 1: {fmtMoney(data.summary?.byLevel?.level1 || 0)}</span>
              <span>Level 2: {fmtMoney(data.summary?.byLevel?.level2 || 0)}</span>
              <span>Levels 3-5: {fmtMoney(data.summary?.byLevel?.level35 || 0)}</span>
            </div>
          </div>
          <div className="space-y-4 mt-4">
            {leadershipLevels.map((level) => (
              <div key={`all-leadership-level-${level}`} className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold" style={{ color: PORTAL_TITLE }}>Level {level}</h3>
                  <span className="text-xs" style={{ color: PORTAL_MUTED }}>{leadershipGroups[level].length} account(s)</span>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-1 md:grid md:grid-cols-2 xl:grid-cols-3 md:overflow-visible">
                  {leadershipGroups[level].map((row, index) => (
                    <div
                      key={`${row.uid || row.username || index}-all-level-card`}
                      className="rounded-2xl p-4 space-y-3 min-w-[260px] md:min-w-0"
                      style={{ background: PORTAL_SURFACE, border: `1px solid ${PORTAL_BORDER}` }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm" style={{ color: PORTAL_TITLE }}>{row.fullname || row.username}</p>
                          <p className="text-xs mt-1" style={{ color: PORTAL_MUTED }}>{row.username || '-'} - Level {row.level}</p>
                        </div>
                        <p className="text-xs" style={{ color: PORTAL_MUTED }}>#{index + 1}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="rounded-xl p-3" style={{ background: 'color-mix(in srgb, var(--portal-soft-bg) 76%, transparent)' }}>
                          <p className="text-[11px]" style={{ color: PORTAL_MUTED }}>Source Pairing</p>
                          <p className="mt-1" style={{ color: PORTAL_TEXT }}>{fmtMoney(row.pairingIncome || 0)}</p>
                        </div>
                        <div className="rounded-xl p-3" style={{ background: 'color-mix(in srgb, var(--portal-soft-bg) 76%, transparent)' }}>
                          <p className="text-[11px]" style={{ color: PORTAL_MUTED }}>Leadership Bonus</p>
                          <p className="mt-1 font-semibold" style={{ color: config.accent }}>{fmtMoney(row.amount || 0)}</p>
                        </div>
                        <div className="rounded-xl p-3 col-span-2" style={{ background: 'color-mix(in srgb, var(--portal-soft-bg) 76%, transparent)' }}>
                          <p className="text-[11px]" style={{ color: PORTAL_MUTED }}>Direct Referrals</p>
                          <p className="mt-1" style={{ color: PORTAL_TEXT }}>{fmtInt(row.directReferralCount || 0)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {leadershipLevels.length === 0 && (
              <div className="rounded-2xl p-5 text-center" style={{ background: PORTAL_SURFACE, border: `1px solid ${PORTAL_BORDER}`, color: PORTAL_MUTED }}>
                No leadership contributors found.
              </div>
            )}
          </div>
          <div className="hidden">
            {(data.levelRows || []).map((row, index) => (
              <div
                key={`${row.uid || row.username || index}-level-mobile`}
                className="rounded-2xl p-4 space-y-3"
                style={{ background: PORTAL_SURFACE, border: `1px solid ${PORTAL_BORDER}` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm" style={{ color: PORTAL_TITLE }}>{row.fullname || row.username}</p>
                    <p className="text-xs mt-1" style={{ color: PORTAL_MUTED }}>{row.username || '-'} · Level {row.level}</p>
                  </div>
                  <p className="text-xs" style={{ color: PORTAL_MUTED }}>#{index + 1}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl p-3" style={{ background: 'color-mix(in srgb, var(--portal-soft-bg) 76%, transparent)' }}>
                    <p className="text-[11px]" style={{ color: PORTAL_MUTED }}>Source Pairing</p>
                    <p className="mt-1" style={{ color: PORTAL_TEXT }}>{fmtMoney(row.pairingIncome || 0)}</p>
                  </div>
                  <div className="rounded-xl p-3" style={{ background: 'color-mix(in srgb, var(--portal-soft-bg) 76%, transparent)' }}>
                    <p className="text-[11px]" style={{ color: PORTAL_MUTED }}>Leadership Bonus</p>
                    <p className="mt-1 font-semibold" style={{ color: config.accent }}>{fmtMoney(row.amount || 0)}</p>
                  </div>
                  <div className="rounded-xl p-3 col-span-2" style={{ background: 'color-mix(in srgb, var(--portal-soft-bg) 76%, transparent)' }}>
                    <p className="text-[11px]" style={{ color: PORTAL_MUTED }}>Direct Referrals</p>
                    <p className="mt-1" style={{ color: PORTAL_TEXT }}>{fmtInt(row.directReferralCount || 0)}</p>
                  </div>
                </div>
              </div>
            ))}
            {(!data.levelRows || data.levelRows.length === 0) && (
              <div className="rounded-2xl p-5 text-center" style={{ background: PORTAL_SURFACE, border: `1px solid ${PORTAL_BORDER}`, color: PORTAL_MUTED }}>
                No leadership contributors found.
              </div>
            )}
          </div>
          <div className="hidden md:block overflow-x-auto mt-4">
            <table className="w-full text-sm min-w-[760px]">
              <thead>
                <tr>
                  {['#', 'Level', 'Member', 'Username', 'Source Pairing', 'Leadership Bonus', 'Direct Referrals'].map((heading) => (
                    <th key={heading} className="table-header p-3 text-left text-xs uppercase tracking-wide">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(data.levelRows || []).map((row, index) => (
                  <tr key={`${row.uid || row.username || index}-level`} style={{ borderBottom: `1px solid ${PORTAL_ROW}` }}>
                    <td className="p-3" style={{ color: PORTAL_MUTED }}>{index + 1}</td>
                    <td className="p-3" style={{ color: PORTAL_TEXT }}>Level {row.level}</td>
                    <td className="p-3" style={{ color: PORTAL_TITLE }}>{row.fullname || row.username}</td>
                    <td className="p-3" style={{ color: PORTAL_TEXT }}>{row.username || '-'}</td>
                    <td className="p-3" style={{ color: PORTAL_TEXT }}>{fmtMoney(row.pairingIncome || 0)}</td>
                    <td className="p-3 font-semibold" style={{ color: config.accent }}>{fmtMoney(row.amount || 0)}</td>
                    <td className="p-3" style={{ color: PORTAL_TEXT }}>{fmtInt(row.directReferralCount || 0)}</td>
                  </tr>
                ))}
                {(!data.levelRows || data.levelRows.length === 0) && (
                  <tr>
                    <td className="py-6 px-3 text-center" style={{ color: PORTAL_MUTED }} colSpan="7">No leadership contributors found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        </div>
      ) : null}
      </div>
    </div>
  );
}
