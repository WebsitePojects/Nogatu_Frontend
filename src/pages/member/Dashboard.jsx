import { useState, useEffect, useRef } from 'react';
import api from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import {
  HiOutlineCash, HiOutlineUsers, HiOutlineChartBar, HiOutlineTrendingUp,
  HiOutlineStar, HiOutlineGift, HiOutlineShieldCheck,
  HiOutlineArrowLeft, HiOutlineArrowRight,
} from 'react-icons/hi';

const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/* Card icon gradient configs — gold spectrum */
const CARD_ICONS = [
  { from: '#9A7B0A', to: '#D4AF37', glow: 'rgba(212,175,55,0.35)' },
  { from: '#D4AF37', to: '#F2D06B', glow: 'rgba(242,208,107,0.3)'  },
  { from: '#B87333', to: '#D4957A', glow: 'rgba(184,115,51,0.3)'   },  // copper
  { from: '#9A7B0A', to: '#F2D06B', glow: 'rgba(212,175,55,0.3)'   },
  { from: '#7A4A0A', to: '#D4820A', glow: 'rgba(212,130,10,0.3)'   },  // amber
  { from: '#8B6914', to: '#D4AF37', glow: 'rgba(212,175,55,0.3)'   },
  { from: '#B8860B', to: '#FFD700', glow: 'rgba(255,215,0,0.35)'   },
  { from: '#9A7B0A', to: '#E2C048', glow: 'rgba(212,175,55,0.3)'   },
  { from: '#D4AF37', to: '#FFD700', glow: 'rgba(255,215,0,0.3)'    },
];

function StatCard({ card, idx }) {
  const theme = CARD_ICONS[idx % CARD_ICONS.length];
  return (
    <div
      className="glass-card rounded-2xl p-5 group cursor-default"
      style={{ minWidth: '220px' }}
    >
      {/* Icon */}
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 motion-safe:transition-transform motion-safe:duration-300"
        style={{
          background: `linear-gradient(135deg, ${theme.from}, ${theme.to})`,
          boxShadow: `0 6px 20px ${theme.glow}`,
        }}
      >
        <card.icon className="w-[19px] h-[19px] text-[#080604]" />
      </div>
      <p className="text-[12px] font-medium mb-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
        {card.label}
      </p>
      <p className="text-[22px] font-bold text-white leading-tight tracking-tight">
        {card.value}
      </p>
    </div>
  );
}

/* Package color map */
const PKG_COLORS = {
  Bronze:   '#CD7F32',
  Silver:   '#C0C0C0',
  Gold:     '#FFD700',
  Platinum: '#E5E4E2',
  Garnet:   '#733635',
  Diamond:  '#B9F2FF',
};

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const res = await api.get('/dashboard');
      setData(res.data);
    } catch { } finally { setLoading(false); }
  }

  /* Horizontal scroll helpers */
  const scrollBy = (dir) => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: dir * 240, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div
          className="w-12 h-12 rounded-full border-[3px] animate-spin"
          style={{ borderColor: 'rgba(212,175,55,0.15)', borderTopColor: '#D4AF37' }}
        />
        <p className="text-sm" style={{ color: 'rgba(212,175,55,0.5)' }}>Loading your dashboard…</p>
      </div>
    );
  }
  if (!data) return <p style={{ color: 'rgba(255,255,255,0.4)' }}>Failed to load dashboard.</p>;

  const cards = [
    { label: 'Total Cash Incentives', value: `₱${fmt(data.totalCashIncome)}`,  icon: HiOutlineCash },
    { label: 'Direct Referral',        value: `₱${fmt(data.directReferral)}`,   icon: HiOutlineUsers },
    { label: 'Sales Volume (Pairing)', value: `₱${fmt(data.salesVolume)}`,      icon: HiOutlineChartBar },
    { label: 'Uni-Level',              value: `₱${fmt(data.uniLevel)}`,          icon: HiOutlineTrendingUp },
    { label: 'Leadership Bonus',       value: `₱${fmt(data.leadershipBonus)}`,  icon: HiOutlineStar },
    { label: 'Hi-Five Bonus',          value: `₱${fmt(data.hiFiveBonus)}`,      icon: HiOutlineGift },
    { label: 'Ranking Bonus (LPC)',    value: `₱${fmt(data.rankingBonus)}`,     icon: HiOutlineShieldCheck },
    { label: 'Left Accounts',          value: String(data.leftAccounts ?? 0),   icon: HiOutlineArrowLeft },
    { label: 'Right Accounts',         value: String(data.rightAccounts ?? 0),  icon: HiOutlineArrowRight },
  ];

  const maintenancePct = Math.min(100, (data.maintenancePoints / 200) * 100);

  return (
    <div className="space-y-7">

      {/* ── GREETING ──────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white leading-tight">
            Welcome back,{' '}
            <span className="gold-text">{user?.shortname}</span>
          </h1>
          <p className="text-sm mt-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Here's your account performance overview.
          </p>
          {/* Gold underline accent */}
          <div className="w-14 h-0.5 mt-3 rounded-full" style={{ background: 'linear-gradient(90deg, #D4AF37, transparent)' }} />
        </div>

        {/* Account type badge */}
        <div
          className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-xl"
          style={{
            background: 'rgba(212,175,55,0.08)',
            border: '1px solid rgba(212,175,55,0.2)',
          }}
        >
          <div className="w-2 h-2 rounded-full" style={{ background: '#D4AF37', boxShadow: '0 0 6px rgba(212,175,55,0.8)' }} />
          <span className="text-xs font-semibold" style={{ color: '#D4AF37' }}>{user?.caccttype}</span>
        </div>
      </div>

      {/* ── STAT CARDS — horizontal scroll on mobile, grid on lg ─ */}
      <div className="relative">
        {/* Scroll arrows — desktop */}
        <button
          onClick={() => scrollBy(-1)}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 hidden xl:flex w-8 h-8 items-center justify-center rounded-full glass text-white/50 hover:text-white transition-colors"
          aria-label="Scroll left"
        >
          <HiOutlineArrowLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => scrollBy(1)}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 hidden xl:flex w-8 h-8 items-center justify-center rounded-full glass text-white/50 hover:text-white transition-colors"
          aria-label="Scroll right"
        >
          <HiOutlineArrowRight className="w-4 h-4" />
        </button>

        {/* Snap scroll on mobile, css grid on lg+ */}
        <div
          ref={scrollRef}
          className="snap-scroll-x lg:grid lg:grid-cols-3 lg:overflow-visible xl:grid-cols-3"
          style={{ gap: '1rem' }}
        >
          {cards.map((card, i) => (
            <StatCard key={i} card={card} idx={i} />
          ))}
        </div>
      </div>

      {/* ── BOTTOM GRID ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Direct Referrals by Package */}
        <div className="glass-card rounded-2xl p-6">
          {/* Sticky section header */}
          <div className="sticky top-0 z-10 pb-4 -mx-6 px-6 pt-1" style={{ background: 'transparent' }}>
            <h3 className="font-display text-base font-semibold text-white">Direct Referrals by Package</h3>
            <div className="w-8 h-0.5 mt-1.5 rounded-full" style={{ background: 'linear-gradient(90deg,#D4AF37,transparent)' }} />
          </div>

          <div className="space-y-2 mt-1">
            {Object.entries(data.directReferrals || {}).map(([type, count]) => {
              const color = PKG_COLORS[type] || '#D4AF37';
              return (
                <div
                  key={type}
                  className="flex items-center justify-between py-2.5 px-3 rounded-xl"
                  style={{ borderBottom: '1px solid rgba(212,175,55,0.07)' }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color, boxShadow: `0 0 6px ${color}66` }} />
                    <span className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>{type}</span>
                  </div>
                  <span
                    className="text-xs font-bold px-2.5 py-1 rounded-lg"
                    style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}
                  >
                    {count} {count === 1 ? 'Acct' : 'Accts'}
                  </span>
                </div>
              );
            })}
            {Object.keys(data.directReferrals || {}).length === 0 && (
              <div className="text-center py-10">
                <HiOutlineUsers className="w-8 h-8 mx-auto mb-2" style={{ color: 'rgba(212,175,55,0.25)' }} />
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>No direct referrals yet.</p>
                <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.2)' }}>Start building your network!</p>
              </div>
            )}
          </div>
        </div>

        {/* Monthly Maintenance */}
        <div className="glass-card rounded-2xl p-6">
          <div className="pb-4">
            <h3 className="font-display text-base font-semibold text-white">Monthly Maintenance</h3>
            <div className="w-8 h-0.5 mt-1.5 rounded-full" style={{ background: 'linear-gradient(90deg,#D4AF37,transparent)' }} />
          </div>

          {/* Status indicator */}
          <div className="flex items-center gap-4 mb-6">
            <div
              className="w-[60px] h-[60px] rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{
                background: data.maintenanceStatus === 'Active'
                  ? 'linear-gradient(135deg, #9A7B0A, #D4AF37)'
                  : 'linear-gradient(135deg, #7f1d1d, #dc2626)',
                boxShadow: data.maintenanceStatus === 'Active'
                  ? '0 8px 24px rgba(212,175,55,0.3), inset 0 1px 0 rgba(255,255,255,0.2)'
                  : '0 8px 24px rgba(220,38,38,0.3)',
              }}
            >
              {data.maintenanceStatus === 'Active' ? (
                <svg className="w-7 h-7 text-[#080604]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
            <div>
              <p
                className="text-lg font-bold"
                style={{ color: data.maintenanceStatus === 'Active' ? '#D4AF37' : '#ef4444' }}
              >
                {data.maintenanceStatus}
              </p>
              <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {data.maintenancePoints} / 200 pts this month
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div>
            <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(212,175,55,0.08)' }}>
              <div
                className="h-full rounded-full motion-safe:transition-all motion-safe:duration-700 ease-out"
                style={{
                  width: `${maintenancePct}%`,
                  background: maintenancePct >= 100
                    ? 'linear-gradient(90deg, #9A7B0A, #D4AF37, #F2D06B)'
                    : maintenancePct >= 50
                    ? 'linear-gradient(90deg, #F59E0B, #FBBF24)'
                    : 'linear-gradient(90deg, #7f1d1d, #ef4444)',
                  boxShadow: maintenancePct >= 100
                    ? '0 0 12px rgba(212,175,55,0.5)'
                    : 'none',
                }}
              />
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.25)' }}>0</span>
              <span className="text-[11px] font-semibold" style={{ color: 'rgba(212,175,55,0.7)' }}>
                {Math.round(maintenancePct)}%
              </span>
              <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.25)' }}>200</span>
            </div>
          </div>

          {/* Unilevel qualification hint */}
          <div
            className="mt-4 px-3.5 py-2.5 rounded-xl text-xs"
            style={{
              background: maintenancePct >= 100
                ? 'rgba(212,175,55,0.08)'
                : 'rgba(255,255,255,0.03)',
              border: `1px solid ${maintenancePct >= 100 ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.06)'}`,
              color: maintenancePct >= 100 ? 'rgba(242,208,107,0.8)' : 'rgba(255,255,255,0.3)',
            }}
          >
            {maintenancePct >= 100
              ? '✓ You qualify for Uni-Level income this month.'
              : 'Reach 200 pts to qualify for Uni-Level income.'}
          </div>
        </div>
      </div>
    </div>
  );
}
