import { useState, useEffect } from 'react';
import api from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import {
  HiOutlineCash, HiOutlineUsers, HiOutlineChartBar, HiOutlineTrendingUp,
  HiOutlineStar, HiOutlineGift, HiOutlineShieldCheck,
  HiOutlineArrowLeft, HiOutlineArrowRight,
} from 'react-icons/hi';

const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtInt = (n) => Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 0 });

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
      className="glass-card rounded-2xl p-5 group cursor-default w-full"
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
  Silver:   '#A8A9AD',
  Gold:     '#DAA520',
  Platinum: '#6C757D',
  Garnet:   '#9B2335',
  Diamond:  '#4FC3F7',
};

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, []);

  async function loadData() {
    try {
      const res = await api.get('/dashboard');
      setData(res.data);
    } catch { } finally { setLoading(false); }
  }

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
    { label: 'Current Cash Balance',  value: `₱${fmt(data.cashBalance)}`,      icon: HiOutlineCash },
    { label: 'Direct Referral',        value: `₱${fmt(data.directReferral)}`,   icon: HiOutlineUsers },
    { label: 'Sales Volume (Pairing)', value: `₱${fmt(data.salesVolume)}`,      icon: HiOutlineChartBar },
    { label: 'Pairing Balance',        value: fmtInt(data.pairingBalance),      icon: HiOutlineChartBar },
    { label: 'Uni-Level',              value: `₱${fmt(data.uniLevel)}`,          icon: HiOutlineTrendingUp },
    { label: 'Leadership Bonus',       value: `₱${fmt(data.leadershipBonus)}`,  icon: HiOutlineStar },
    { label: 'Hi-Five Bonus',          value: `₱${fmt(data.hiFiveBonus)}`,      icon: HiOutlineGift },
    { label: 'Ranking Bonus (LPC)',    value: `₱${fmt(data.rankingBonus)}`,     icon: HiOutlineShieldCheck },
    { label: 'Left Accounts',          value: `${fmtInt(data.leftAccounts)} | ${fmtInt(data.leftPoints)} pts`,   icon: HiOutlineArrowLeft },
    { label: 'Right Accounts',         value: `${fmtInt(data.rightAccounts)} | ${fmtInt(data.rightPoints)} pts`, icon: HiOutlineArrowRight },
  ];

  const maintenancePct = Math.min(100, (data.maintenancePoints / 200) * 100);

  return (
    <div className="space-y-7">

      {/* ── GREETING ──────────────────────────────────────────── */}
      <div className="relative flex items-start justify-between rounded-3xl overflow-hidden p-6 sm:p-8 mb-2">
        {/* Background Images */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <img src="/img/dashboard_img_light.png" alt="Dashboard Hero" className="w-full h-full object-cover dark:hidden" />
          <img src="/img/dashboard_img_dark.png" alt="Dashboard Hero" className="hidden w-full h-full object-cover dark:block" />
          <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-white/10 to-transparent dark:hidden"></div>
          <div className="absolute inset-0 hidden dark:block bg-gradient-to-r from-black/90 via-black/60 to-transparent"></div>
        </div>

        <div className="relative z-10">
          <h1 className="hero-welcome-title font-display text-2xl md:text-3xl font-bold leading-tight">
            Welcome back,{' '}
            <span className="hero-welcome-name">{user?.shortname}</span>
          </h1>
          <p className="text-sm mt-1.5 drop-shadow" style={{ color: 'rgba(255,255,255,0.8)' }}>
            Here's your account performance overview.
          </p>
          {/* Gold underline accent */}
          <div className="w-14 h-1 mt-3 rounded-full" style={{ background: 'linear-gradient(90deg, #D4AF37, transparent)' }} />
        </div>

        {/* Account type badge */}
        <div
          className="relative z-10 hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-xl shadow-lg backdrop-blur-sm"
          style={{
            background: 'rgba(0,0,0,0.4)',
            border: '1px solid rgba(212,175,55,0.3)',
          }}
        >
          <div className="w-2 h-2 rounded-full" style={{ background: '#D4AF37', boxShadow: '0 0 6px rgba(212,175,55,0.8)' }} />
          <span className="text-xs font-semibold" style={{ color: '#D4AF37' }}>{user?.caccttype}</span>
        </div>
      </div>

      {/* ── STAT CARDS — horizontal scroll on mobile, grid on lg ─ */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
        {cards.map((card, i) => (
          <StatCard key={i} card={card} idx={i} />
        ))}
      </div>

      {/* ── BOTTOM GRID ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-5">

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

        {/* MONTHLY MAINTENANCE CARD — re-enable when Unilevel is activated by management */}
      </div>
    </div>
  );
}
