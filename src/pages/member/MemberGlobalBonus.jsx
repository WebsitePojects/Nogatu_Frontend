import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import {
  HiOutlineShieldCheck,
  HiOutlineCalendar,
  HiOutlineCash,
  HiOutlineStar,
  HiOutlineLockClosed,
  HiOutlineSparkles,
} from 'react-icons/hi';

const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (d) => {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }); }
  catch { return d; }
};

const PORTAL_TITLE  = 'var(--portal-card-title)';
const PORTAL_MUTED  = 'var(--portal-card-muted)';
const PORTAL_TEXT   = 'var(--portal-card-text)';
const PORTAL_BG     = 'var(--portal-soft-bg)';
const PORTAL_BORDER = 'var(--portal-soft-border)';

function Spinner() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div
        className="size-12 rounded-full border-[3px] animate-spin"
        style={{ borderColor: 'rgba(212,175,55,0.15)', borderTopColor: '#D4AF37' }}
      />
      <p className="text-sm" style={{ color: PORTAL_MUTED }}>Loading global bonus...</p>
    </div>
  );
}

function StatTile({ icon: Icon, label, value, accent }) {
  return (
    <div className="glass-card rounded-2xl p-4 sm:p-5 flex flex-col gap-2">
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center"
        style={{ background: `linear-gradient(135deg, ${accent}88, ${accent})`, boxShadow: `0 6px 18px ${accent}44` }}
      >
        <Icon className="w-4 h-4 text-[#080604]" />
      </div>
      <p className="text-[11px] font-medium" style={{ color: PORTAL_MUTED }}>{label}</p>
      <p className="text-lg font-bold leading-tight" style={{ color: PORTAL_TITLE }}>{value}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  if (status === 'distributed') {
    return (
      <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
        style={{ background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.25)' }}>
        Distributed
      </span>
    );
  }
  return (
    <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
      style={{ background: 'rgba(212,175,55,0.1)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.25)' }}>
      Pending
    </span>
  );
}

export default function MemberGlobalBonus() {
  const navigate = useNavigate();
  const [overview, setOverview] = useState(null);
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/global-bonus'),
      api.get('/global-bonus/history'),
    ])
      .then(([ovRes, histRes]) => {
        setOverview(ovRes.data);
        setHistory(histRes.data);
      })
      .catch(() => {
        setOverview(null);
        setHistory(null);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  // If not eligible, show locked state
  if (!overview?.eligible) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold" style={{ color: PORTAL_TITLE }}>Global Bonus</h1>
          <div className="w-10 h-0.5 mt-2 rounded-full" style={{ background: 'linear-gradient(90deg,#D4AF37,transparent)' }} />
        </div>

        <div className="glass-card rounded-2xl p-10 flex flex-col items-center gap-5 text-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.15)' }}
          >
            <HiOutlineLockClosed className="w-8 h-8" style={{ color: 'rgba(212,175,55,0.45)' }} />
          </div>
          <div>
            <p className="text-base font-semibold" style={{ color: PORTAL_TITLE }}>Not Eligible Yet</p>
            <p className="text-sm mt-2 max-w-sm mx-auto leading-relaxed" style={{ color: PORTAL_MUTED }}>
              The Global Bonus is available to members who have reached Director rank or above.
              Keep growing your network to unlock this income stream.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="portal-accent-chip text-sm px-5 py-2.5 rounded-xl font-semibold"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const historyRows = history?.rows || [];
  const distributedRows = historyRows.filter((r) => r.status === 'distributed');
  const pendingRows = historyRows.filter((r) => r.status !== 'distributed');
  const totalDistributed = distributedRows.reduce((s, r) => s + r.shareAmount, 0);

  const memberTypeLabel = overview.memberType
    ? overview.memberType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : 'Member';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold" style={{ color: PORTAL_TITLE }}>Global Bonus</h1>
        <div className="w-10 h-0.5 mt-2 rounded-full" style={{ background: 'linear-gradient(90deg,#D4AF37,transparent)' }} />
        <p className="text-sm mt-2" style={{ color: PORTAL_MUTED }}>
          2% of annual net sales — distributed to qualifying stockists and directors each year.
        </p>
      </div>

      {/* Eligibility banner */}
      <div
        className="rounded-2xl px-5 py-4 flex items-center gap-4"
        style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.2)' }}
      >
        <HiOutlineShieldCheck className="w-6 h-6 flex-shrink-0" style={{ color: '#34d399' }} />
        <div>
          <p className="text-sm font-semibold" style={{ color: '#34d399' }}>You are eligible for the Global Bonus</p>
          <p className="text-xs mt-0.5" style={{ color: PORTAL_MUTED }}>
            Member type: <strong>{memberTypeLabel}</strong> &middot; Portions: <strong>{overview.portions}</strong>
          </p>
        </div>
      </div>

      {/* Summary tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatTile icon={HiOutlineStar}     label="Your Portions"        value={overview.portions || 0}                      accent="#D4AF37" />
        <StatTile icon={HiOutlineSparkles} label="Member Type"          value={memberTypeLabel}                             accent="#B8960C" />
        <StatTile icon={HiOutlineCash}     label="Total Received"        value={`PHP ${fmt(totalDistributed)}`}             accent="#D4AF37" />
        <StatTile icon={HiOutlineCalendar} label="Latest Distribution"  value={overview.latestShare ? `PHP ${fmt(overview.latestShare)}` : '—'} accent="#F2D06B" />
      </div>

      {/* Pending / projected */}
      {pendingRows.length > 0 && (
        <div className="glass-card rounded-2xl p-5">
          <h3 className="font-display text-sm font-semibold mb-3" style={{ color: PORTAL_TITLE }}>Upcoming Periods</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--portal-row-border)' }}>
                  {['Year', 'Scope', 'Type', 'Portions', 'Projected Share', 'Status'].map((h) => (
                    <th key={h} className="text-left pb-2 pr-4 text-xs font-semibold" style={{ color: PORTAL_MUTED }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pendingRows.map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--portal-row-border)' }}>
                    <td className="py-3 pr-4 font-semibold" style={{ color: PORTAL_TITLE }}>{row.periodYear}</td>
                    <td className="py-3 pr-4" style={{ color: PORTAL_TEXT }}>{row.periodScope || 'Annual'}</td>
                    <td className="py-3 pr-4" style={{ color: PORTAL_TEXT }}>{row.memberType || '—'}</td>
                    <td className="py-3 pr-4" style={{ color: PORTAL_TEXT }}>{row.portions}</td>
                    <td className="py-3 pr-4" style={{ color: PORTAL_TEXT }}>
                      {row.shareAmount > 0 ? `PHP ${fmt(row.shareAmount)}` : 'Not yet computed'}
                    </td>
                    <td className="py-3"><StatusBadge status={row.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Distribution history */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(212,175,55,0.08)' }}>
          <h3 className="font-display text-base font-semibold" style={{ color: PORTAL_TITLE }}>Distribution History</h3>
          <p className="text-xs mt-1" style={{ color: PORTAL_MUTED }}>
            Each row is one completed annual distribution credited to your account.
          </p>
        </div>

        {distributedRows.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <HiOutlineCalendar className="size-8 mx-auto mb-3" style={{ color: 'rgba(212,175,55,0.25)' }} />
            <p className="text-sm" style={{ color: PORTAL_MUTED }}>No distributions have been credited yet.</p>
            <p className="text-xs mt-1" style={{ color: PORTAL_MUTED }}>Global bonus is distributed after each completed calendar year.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: PORTAL_BG, borderBottom: `1px solid ${PORTAL_BORDER}` }}>
                  {['Year', 'Scope', 'Member Type', 'Portions', 'Share Amount', 'Distributed On', 'Status'].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold" style={{ color: PORTAL_MUTED }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {distributedRows.map((row, i) => (
                  <tr
                    key={i}
                    style={{ borderBottom: '1px solid var(--portal-row-border)' }}
                    className="hover:bg-[rgba(212,175,55,0.03)] transition-colors"
                  >
                    <td className="px-5 py-3.5 font-semibold" style={{ color: PORTAL_TITLE }}>{row.periodYear}</td>
                    <td className="px-5 py-3.5" style={{ color: PORTAL_TEXT }}>{row.periodScope || 'Annual'}</td>
                    <td className="px-5 py-3.5" style={{ color: PORTAL_TEXT }}>
                      {row.memberType?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || '—'}
                    </td>
                    <td className="px-5 py-3.5" style={{ color: PORTAL_TEXT }}>{row.portions}</td>
                    <td className="px-5 py-3.5 font-semibold" style={{ color: '#D4AF37' }}>PHP {fmt(row.shareAmount)}</td>
                    <td className="px-5 py-3.5" style={{ color: PORTAL_TEXT }}>{fmtDate(row.distributedDate)}</td>
                    <td className="px-5 py-3.5"><StatusBadge status={row.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Explanation */}
      <div className="glass-card rounded-2xl p-5 space-y-2" style={{ background: PORTAL_BG, border: `1px solid ${PORTAL_BORDER}` }}>
        <p className="text-xs font-semibold" style={{ color: PORTAL_TITLE }}>How the Global Bonus works</p>
        <ul className="text-xs space-y-1.5 list-disc list-inside" style={{ color: PORTAL_MUTED }}>
          <li>2% of the company's total annual net sales is pooled for distribution.</li>
          <li>Eligible members are Mobile, City, and Provincial Stockists plus Directors and Ambassadors.</li>
          <li>Each eligible member holds a fixed number of <strong>portions</strong> based on their classification.</li>
          <li>Your share = (your portions ÷ total qualifying portions) × pool amount.</li>
          <li>Distributions are released once per year, after the full calendar year is closed.</li>
        </ul>
      </div>
    </div>
  );
}
