import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import {
  HiOutlineCash, HiOutlineUsers, HiOutlineChartBar, HiOutlineTrendingUp,
  HiOutlineStar, HiOutlineGift, HiOutlineShieldCheck,
  HiOutlineArrowLeft, HiOutlineArrowRight, HiOutlineChevronRight,
} from 'react-icons/hi';

const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtInt = (n) => Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 0 });

const CARD_ICONS = [
  { from: '#9A7B0A', to: '#D4AF37', glow: 'rgba(212,175,55,0.35)' },
  { from: '#D4AF37', to: '#F2D06B', glow: 'rgba(242,208,107,0.3)'  },
  { from: '#B87333', to: '#D4957A', glow: 'rgba(184,115,51,0.3)'   },
  { from: '#9A7B0A', to: '#F2D06B', glow: 'rgba(212,175,55,0.3)'   },
  { from: '#7A4A0A', to: '#D4820A', glow: 'rgba(212,130,10,0.3)'   },
  { from: '#8B6914', to: '#D4AF37', glow: 'rgba(212,175,55,0.3)'   },
  { from: '#B8860B', to: '#FFD700', glow: 'rgba(255,215,0,0.35)'   },
  { from: '#9A7B0A', to: '#E2C048', glow: 'rgba(212,175,55,0.3)'   },
  { from: '#D4AF37', to: '#FFD700', glow: 'rgba(255,215,0,0.3)'    },
];

const PKG_COLORS = {
  Bronze: '#CD7F32',
  Silver: '#A8A9AD',
  Gold: '#DAA520',
  Platinum: '#6C757D',
  Garnet: '#9B2335',
  Diamond: '#4FC3F7',
};

function StatCard({ card, idx, onClick, disabled }) {
  const theme = CARD_ICONS[idx % CARD_ICONS.length];

  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`glass-card rounded-2xl p-3 sm:p-5 group w-full min-w-0 text-left focus:outline-none focus:ring-2 focus:ring-yellow-500/40 ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center group-hover:scale-110 motion-safe:transition-transform motion-safe:duration-300"
          style={{
            background: `linear-gradient(135deg, ${theme.from}, ${theme.to})`,
            boxShadow: `0 6px 20px ${theme.glow}`,
          }}
        >
          <card.icon className="w-4 h-4 sm:w-[19px] sm:h-[19px] text-[#080604]" />
        </div>
        <HiOutlineChevronRight className="size-4 mt-1 flex-shrink-0" style={{ color: 'rgba(212,175,55,0.65)' }} />
      </div>

      <p className="portal-card-muted text-[10px] sm:text-[12px] font-medium mt-3 sm:mt-4 mb-1 leading-snug">
        {card.label}
      </p>
      <p className="portal-card-title text-[16px] sm:text-[22px] font-bold leading-tight tracking-tight break-words">
        {card.value}
      </p>
      <p className="portal-gold-text text-[10px] sm:text-[11px] mt-2 leading-snug">
        {card.actionLabel}
      </p>
    </button>
  );
}

function ActionPanel({ title, subtitle, metric, value, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="portal-soft-panel rounded-xl p-3 text-left w-full"
    >
      <p className="portal-card-muted text-xs">{title}</p>
      <p className="portal-card-title font-bold mt-1">{value}</p>
      <p className="portal-gold-text text-[11px] mt-2">{subtitle || metric}</p>
    </button>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
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
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  function goToCard(card) {
    if (card.path) {
      navigate(card.path);
      return;
    }
    navigate(`/dashboard/details/${card.metric}`);
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div
          className="size-12 rounded-full border-[3px] animate-spin"
          style={{ borderColor: 'rgba(212,175,55,0.15)', borderTopColor: '#D4AF37' }}
        />
        <p className="portal-card-muted text-sm">Loading your dashboard...</p>
      </div>
    );
  }

  if (!data) {
    return <p className="portal-card-muted">Failed to load dashboard.</p>;
  }

  const cards = [
    { label: 'Total Amount Earned', metric: 'total-cash-incentives', path: '/ewallet', value: `PHP ${fmt(data.totalCashIncome)}`, icon: HiOutlineCash, actionLabel: 'All credited income streams; balance shown separately' },
    { label: 'Current Cash Balance', metric: 'current-cash-balance', path: '/ewallet', value: `PHP ${fmt(data.cashBalance)}`, icon: HiOutlineCash, actionLabel: 'Available e-wallet amount after deductions and encashments' },
    { label: 'Direct Referral', metric: 'direct-referral', value: `PHP ${fmt(data.directReferral)}`, icon: HiOutlineUsers, actionLabel: 'See who triggered this income' },
    { label: 'Sales Matched Bonus', metric: 'sales-volume', path: '/pairing', value: `PHP ${fmt(data.salesVolume)}`, icon: HiOutlineChartBar, actionLabel: 'Open pairing reports' },
    { label: 'Uni-Level', metric: 'uni-level', value: `PHP ${fmt(data.uniLevel)}`, icon: HiOutlineTrendingUp, actionLabel: 'View eligibility and payout history' },
    { label: 'Leadership Bonus', metric: 'leadership-bonus', value: `PHP ${fmt(data.leadershipBonus)}`, icon: HiOutlineStar, actionLabel: 'See leadership bonus entries' },
    { label: 'Hi-Five Bonus', metric: 'hi-five-bonus', path: '/hifive', value: `PHP ${fmt(data.hiFiveBonus)}`, icon: HiOutlineGift, actionLabel: 'Open Hi-Five bonus page' },
    { label: 'Ranking Bonus', metric: 'ranking-bonus', value: `PHP ${fmt(data.rankingBonus)}`, icon: HiOutlineShieldCheck, actionLabel: 'See ranking bonus entries' },
    {
      label: 'Global Bonus',
      metric: 'global-bonus',
      path: data.globalBonusEligible ? '/global-bonus' : undefined,
      value: data.globalBonusEligible ? `PHP ${fmt(data.globalBonus)}` : 'Not Eligible',
      icon: HiOutlineShieldCheck,
      actionLabel: data.globalBonusEligible ? 'See global bonus entries' : 'Eligibility: Diamond, Ambassador rank, or Stockist',
      disabled: !data.globalBonusEligible,
    },
    { label: 'Left Leg (Remaining PV)', metric: 'left-accounts', path: '/pairing', value: `${fmtInt(data.leftAccounts)} accts | ${fmtInt(data.leftRemaining ?? data.leftPoints)} PV left`, icon: HiOutlineArrowLeft, actionLabel: 'Open pairing reports' },
    { label: 'Right Leg (Remaining PV)', metric: 'right-accounts', path: '/pairing', value: `${fmtInt(data.rightAccounts)} accts | ${fmtInt(data.rightRemaining ?? data.rightPoints)} PV left`, icon: HiOutlineArrowRight, actionLabel: 'Open pairing reports' },
  ];

  const maintenancePct = Math.min(100, Math.max(0, ((data.unilevelMaintenance?.currentPoints ?? data.maintenancePoints) / 200) * 100));

  return (
    <div className="space-y-7">
      <div className="relative flex items-start justify-between rounded-3xl overflow-hidden p-6 sm:p-8 mb-2">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <img src="/img/dashboard_img_light.png" alt="Dashboard Hero" className="size-full object-cover dark:hidden" />
          <img src="/img/dashboard_img_dark.png" alt="Dashboard Hero" className="hidden size-full object-cover dark:block" />
          <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-white/10 to-transparent dark:hidden"></div>
          <div className="absolute inset-0 hidden dark:block bg-gradient-to-r from-black/90 via-black/60 to-transparent"></div>
        </div>

        <div className="relative z-10">
          <h1 className="hero-welcome-title font-display text-2xl md:text-3xl font-bold leading-tight">
            Welcome back, <span className="hero-welcome-name">{user?.shortname}</span>
          </h1>
          <p className="text-sm mt-1.5 drop-shadow" style={{ color: 'rgba(255,255,255,0.8)' }}>
            Tap any card below to understand where the numbers came from.
          </p>
          <div className="w-14 h-1 mt-3 rounded-full" style={{ background: 'linear-gradient(90deg, #D4AF37, transparent)' }} />
        </div>

        <div
          className="relative z-10 hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-xl shadow-lg backdrop-blur-sm"
          style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(212,175,55,0.3)' }}
        >
          <div className="size-2 rounded-full" style={{ background: '#D4AF37', boxShadow: '0 0 6px rgba(212,175,55,0.8)' }} />
          <span className="text-xs font-semibold" style={{ color: '#D4AF37' }}>{user?.caccttype}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-3 sm:gap-4">
        {cards.map((card, index) => (
          <StatCard key={card.metric} card={card} idx={index} onClick={() => goToCard(card)} disabled={card.disabled} />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="portal-card-title font-display text-base font-semibold">Unilevel Maintenance</h3>
              <div className="w-8 h-0.5 mt-1.5 rounded-full" style={{ background: 'linear-gradient(90deg,#D4AF37,transparent)' }} />
            </div>
            <button
              type="button"
              onClick={() => navigate('/dashboard/details/uni-level')}
              className="portal-accent-chip text-xs px-3 py-1.5 rounded-lg font-semibold"
            >
              View Details
            </button>
          </div>

          <div className="flex items-center justify-between text-sm mt-5 mb-2">
            <span className="portal-card-muted">Product Points This Month</span>
            <span className="portal-card-title font-semibold">{fmtInt(data.unilevelMaintenance?.currentPoints ?? data.maintenancePoints)} / 200</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--portal-soft-bg)', border: '1px solid var(--portal-soft-border)' }}>
            <div className="h-full" style={{ width: `${maintenancePct}%`, background: '#D4AF37' }} />
          </div>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <ActionPanel
              title="Points Needed"
              subtitle="Needed to stay eligible"
              metric="uni-level"
              value={`${fmtInt(data.unilevelMaintenance?.neededPoints || 0)} pts`}
              onClick={() => navigate('/dashboard/details/uni-level')}
            />
            <ActionPanel
              title="Downline Accruing"
              subtitle={data.unilevelMaintenance?.eligible ? 'Eligible — will be released' : 'Maintenance needed to unlock payout'}
              metric="uni-level"
              value={`PHP ${fmt((data.unilevelMaintenance?.receivableAmount || 0) + (data.unilevelMaintenance?.blockedAmount || 0))}`}
              onClick={() => navigate('/dashboard/details/uni-level')}
            />
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="portal-card-title font-display text-base font-semibold">Direct Referrals by Package</h3>
              <div className="w-8 h-0.5 mt-1.5 rounded-full" style={{ background: 'linear-gradient(90deg,#D4AF37,transparent)' }} />
            </div>
            <button
              type="button"
              onClick={() => navigate('/referrals')}
              className="portal-accent-chip text-xs px-3 py-1.5 rounded-lg font-semibold"
            >
              Open Referrals
            </button>
          </div>

          <div className="space-y-2 mt-5">
            {Object.entries(data.directReferrals || {}).map(([type, count]) => {
              const color = PKG_COLORS[type] || '#D4AF37';
              return (
                <button
                  type="button"
                  key={type}
                  onClick={() => navigate('/referrals')}
                  className="w-full flex items-center justify-between py-2.5 px-3 rounded-xl text-left"
                  style={{ borderBottom: '1px solid var(--portal-row-border)' }}
                >
                  <div className="flex items-center gap-3">
                    <div className="size-2.5 rounded-full flex-shrink-0" style={{ background: color, boxShadow: `0 0 6px ${color}66` }} />
                    <span className="portal-card-text text-sm">{type}</span>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg" style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}>
                    {count} {count === 1 ? 'Acct' : 'Accts'}
                  </span>
                </button>
              );
            })}
            {Object.keys(data.directReferrals || {}).length === 0 && (
              <div className="text-center py-10">
                <HiOutlineUsers className="size-8 mx-auto mb-2" style={{ color: 'rgba(212,175,55,0.25)' }} />
                <p className="portal-card-muted text-sm">No direct referrals yet.</p>
                <p className="portal-card-muted text-xs mt-1">Start building your network.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
