import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  HiOutlineArrowLeft,
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
import { formatDateTimeManila } from '../../utils/dateTime';

const fmtMoney = (n) => `PHP ${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtInt = (n) => Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 0 });

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
        className="w-12 h-12 rounded-full border-[3px] animate-spin"
        style={{ borderColor: 'rgba(212,175,55,0.15)', borderTopColor: '#D4AF37' }}
      />
      <p className="text-sm" style={{ color: 'rgba(212,175,55,0.5)' }}>Loading breakdown...</p>
    </div>
  );
}

function SummaryCard({ label, value, accent }) {
  return (
    <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>{label}</p>
      <p className="text-lg font-bold mt-1" style={{ color: accent || '#fff' }}>{value}</p>
    </div>
  );
}

function IncomeEntryCard({ row, accent, metric }) {
  const dateValue = row.transdate || row.date || row.event_ts || row.created_at || null;
  const amount = row.amount ?? row.total ?? row.pairamount ?? 0;

  return (
    <div className="rounded-2xl p-4 space-y-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-white">
            {metric === 'direct-referral' && row.fullname ? row.fullname : 'Income Entry'}
          </p>
          <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
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
            <p style={{ color: 'rgba(255,255,255,0.45)' }}>Triggered By</p>
            <p className="text-white">{row.fullname || row.username || 'Not available'}</p>
          </div>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.45)' }}>Account Username</p>
            <p className="text-white">{row.username || 'Not available'}</p>
          </div>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.45)' }}>Package</p>
            <p className="text-white">{row.accountType || 'Not available'}</p>
          </div>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.45)' }}>Credit Source</p>
            <p className="text-white">{row.rowType === 'upgrade_incentive' ? 'Upgrade incentive from referral' : 'Referral signup package'}</p>
          </div>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.45)' }}>Entry Audit</p>
            <p className="text-white">{row.entryType || 'Not available'}</p>
          </div>
          <div className="sm:col-span-2">
            <p style={{ color: 'rgba(255,255,255,0.45)' }}>Sponsor Credit Rule</p>
            <p className="text-white">
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
            <p style={{ color: 'rgba(255,255,255,0.45)' }}>Source</p>
            <p className="text-white">Uni-Level payout entry</p>
          </div>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.45)' }}>Reference</p>
            <p className="text-white">{row.processid || row.processKey || `PID ${row.pid || '-'}`}</p>
          </div>
        </div>
      )}

      {metric === 'leadership-bonus' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <p style={{ color: 'rgba(255,255,255,0.45)' }}>Triggered By</p>
            <p className="text-white">{row.fullname || row.username || 'Not available'}</p>
          </div>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.45)' }}>Username</p>
            <p className="text-white">{row.username || 'Not available'}</p>
          </div>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.45)' }}>Leadership Level</p>
            <p className="text-white">Level {row.level || '-'}</p>
          </div>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.45)' }}>Rate</p>
            <p className="text-white">{Number(row.ratePercent || 0)}%</p>
          </div>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.45)' }}>Source Pairing Income</p>
            <p className="text-white">{fmtMoney(row.pairingIncome || 0)}</p>
          </div>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.45)' }}>Direct Referrals</p>
            <p className="text-white">{fmtInt(row.directReferralCount || 0)}</p>
          </div>
        </div>
      )}

      {metric === 'hi-five-bonus' && (
        <div className="text-sm">
          <p style={{ color: 'rgba(255,255,255,0.45)' }}>Reference</p>
          <p className="text-white">{row.processid || row.processKey || `PID ${row.pid || '-'}`}</p>
        </div>
      )}

      {metric === 'ranking-bonus' && (
        <div className="text-sm">
          <p style={{ color: 'rgba(255,255,255,0.45)' }}>Reference</p>
          <p className="text-white">{row.processid || row.processKey || `PID ${row.pid || '-'}`}</p>
        </div>
      )}
    </div>
  );
}

export default function DashboardMetricDetail() {
  const navigate = useNavigate();
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

  async function handleExportXlsx() {
    const res = await api.get(`/dashboard/breakdown/${metric}/export?format=xlsx`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${metric}-breakdown.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  function handleExportPdf() {
    window.print();
  }

  if (!config) {
    return (
      <div className="space-y-6">
        <button type="button" onClick={() => navigate('/dashboard')} className="inline-flex items-center gap-2 text-sm font-semibold" style={{ color: '#D4AF37' }}>
          <HiOutlineArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>
        <p style={{ color: 'rgba(255,255,255,0.5)' }}>This dashboard detail page is not available.</p>
      </div>
    );
  }

  if (loading) return <LoadingState />;
  if (!data) return <p style={{ color: 'rgba(255,255,255,0.5)' }}>Unable to load this breakdown right now.</p>;

  const Icon = config.icon;
  const rows = data.rows || [];

  return (
    <div className="space-y-6">
      <button type="button" onClick={() => navigate('/dashboard')} className="inline-flex items-center gap-2 text-sm font-semibold" style={{ color: '#D4AF37' }}>
        <HiOutlineArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </button>

      <div className="glass-card rounded-3xl p-6 sm:p-8 overflow-hidden relative">
        <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(circle at top right, ${config.accent}1e, transparent 55%)` }} />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="max-w-3xl">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ background: `${config.accent}20`, border: `1px solid ${config.accent}45` }}>
              <Icon className="w-6 h-6" style={{ color: config.accent }} />
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">{config.title}</h1>
            <p className="text-sm mt-3 leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>
              {config.subtitle}
            </p>
            <p className="text-xs mt-3" style={{ color: 'rgba(212,175,55,0.7)' }}>
              {data.formula}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {metric === 'leadership-bonus' ? (
              <>
                <button
                  type="button"
                  onClick={handleExportXlsx}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
                  style={{ background: `${config.accent}16`, color: config.accent, border: `1px solid ${config.accent}33` }}
                >
                  <HiOutlineDownload className="w-4 h-4" />
                  Export XLSX
                </button>
                <button
                  type="button"
                  onClick={handleExportPdf}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
                  style={{ background: 'rgba(255,255,255,0.06)', color: '#fff', border: '1px solid rgba(255,255,255,0.12)' }}
                >
                  <HiOutlineDownload className="w-4 h-4" />
                  Export PDF
                </button>
              </>
            ) : null}
            <Link
              to={config.cta.to}
              className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-semibold"
              style={{ background: `${config.accent}16`, color: config.accent, border: `1px solid ${config.accent}33` }}
            >
              {config.cta.label}
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <SummaryCard label="Total" value={typeof data.total === 'number' ? fmtMoney(data.total) : data.total} accent={config.accent} />
        <SummaryCard label="Entries Shown" value={fmtInt(rows.length)} accent="#fff" />
        <SummaryCard label="As Of" value={data.asOf ? formatDateTimeManila(data.asOf) : 'Now'} accent="#fff" />
        <SummaryCard
          label="Traceability"
          value={metric === 'leadership-bonus' ? `${fmtInt(data.summary?.directReferralCount || 0)} direct referrals` : 'Readable breakdown'}
          accent="#fff"
        />
      </div>

      {metric === 'uni-level' && data.eligibility && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SummaryCard label="Current Product Points" value={`${fmtInt(data.eligibility.currentPoints)} pts`} accent={config.accent} />
          <SummaryCard label="Required Product Points" value={`${fmtInt(data.eligibility.requiredPoints)} pts`} accent="#fff" />
          <SummaryCard label="Still Needed" value={`${fmtInt(data.eligibility.neededPoints)} pts`} accent="#fff" />
        </div>
      )}

      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-white">Entries Behind This Number</h2>
          </div>
          {metric === 'leadership-bonus' && data?.pagination ? (
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
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>
                {data.pagination.page} / {data.pagination.totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((current) => Math.min(Number(data.pagination.totalPages || 1), current + 1))}
                disabled={page >= Number(data.pagination.totalPages || 1)}
                className="rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
                style={{ background: 'rgba(212,175,55,0.1)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.2)' }}
              >
                Next
              </button>
            </div>
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
            <div className="rounded-2xl p-8 text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <HiOutlineCash className="w-8 h-8 mx-auto mb-3" style={{ color: 'rgba(212,175,55,0.25)' }} />
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>No breakdown entries are available yet.</p>
            </div>
          )}
        </div>
      </div>

      {metric === 'leadership-bonus' ? (
        <div className="glass-card rounded-2xl p-5">
          <h2 className="font-display text-lg font-semibold text-white">Leadership Summary</h2>
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-sm min-w-[720px]">
              <thead>
                <tr>
                  {['#', 'Member', 'Level', 'Rate', 'Source Pairing', 'Leadership Bonus', 'Direct Referrals'].map((heading) => (
                    <th key={heading} className="table-header py-3 px-3 text-left text-xs uppercase tracking-wide">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={`${row.uid || row.username || index}-summary`} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <td className="py-3 px-3 text-white/55">{((Number(data?.pagination?.page || 1) - 1) * 50) + index + 1}</td>
                    <td className="py-3 px-3 text-white">{row.fullname || row.username}</td>
                    <td className="py-3 px-3 text-white/75">Level {row.level}</td>
                    <td className="py-3 px-3 text-white/75">{Number(row.ratePercent || 0)}%</td>
                    <td className="py-3 px-3 text-white/75">{fmtMoney(row.pairingIncome || 0)}</td>
                    <td className="py-3 px-3 font-semibold" style={{ color: config.accent }}>{fmtMoney(row.amount || 0)}</td>
                    <td className="py-3 px-3 text-white/75">{fmtInt(row.directReferralCount || 0)}</td>
                  </tr>
                ))}
                <tr>
                  <td className="py-3 px-3 font-semibold text-white" colSpan="5">Overall Total</td>
                  <td className="py-3 px-3 font-bold" style={{ color: config.accent }}>{fmtMoney(data.total || 0)}</td>
                  <td className="py-3 px-3 text-white/75">{fmtInt(data.summary?.directReferralCount || 0)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
