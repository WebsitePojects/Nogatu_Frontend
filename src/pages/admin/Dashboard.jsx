import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { HiOutlineUsers, HiOutlineCash, HiOutlineShoppingCart, HiOutlineSparkles, HiOutlineClock, HiOutlineBadgeCheck, HiOutlineReceiptTax, HiOutlineCalendar } from 'react-icons/hi';

const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function AdminDashboard() {
  const { admin } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard').then(res => setData(res.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div
          className="w-10 h-10 border-4 rounded-full animate-spin"
          style={{ borderColor: 'rgba(100,116,139,0.25)', borderTopColor: 'rgba(59,130,246,0.75)' }}
        />
      </div>
    );
  }
  if (!data) return <p className="text-slate-500 dark:text-slate-400">Failed to load dashboard.</p>;

  const cards = [
    {
      label: 'Total Accounts',
      value: data.totalAccounts,
      sub: `Paid: ${data.paidAccounts} | FS: ${data.freeSlots} | CD: ${data.cdSlots}`,
      icon: HiOutlineUsers,
      iconGradient: 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
      iconShadow: '0 10px 24px rgba(37,99,235,0.3)',
      accentClass: 'bg-blue-100/90 text-blue-800 dark:bg-blue-500/20 dark:text-blue-200',
      link: '/admin/accounts',
    },
    {
      label: 'Processed Encashments',
      value: `\u20B1${fmt(data.totalIncomePaidOut)}`,
      sub: 'Lifetime paid out',
      icon: HiOutlineCash,
      iconGradient: 'linear-gradient(135deg, #7f1d1d, #991b1b)',
      iconShadow: '0 10px 24px rgba(127,29,29,0.35)',
      accentClass: 'bg-rose-100/90 text-rose-800 dark:bg-rose-500/20 dark:text-rose-200',
      link: '/admin/encashment',
    },
    {
      label: 'Hi-Five Purchases',
      value: fmt(data.totalPurchases),
      sub: 'Total purchase points',
      icon: HiOutlineShoppingCart,
      iconGradient: 'linear-gradient(135deg, #0f766e, #14b8a6)',
      iconShadow: '0 10px 24px rgba(13,148,136,0.32)',
      accentClass: 'bg-teal-100/90 text-teal-800 dark:bg-teal-500/20 dark:text-teal-200',
      link: '/admin/redeem',
    },
    {
      label: 'Weekly Activations',
      value: data.weeklyActivations,
      sub: 'Last 7 days',
      icon: HiOutlineSparkles,
      iconGradient: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
      iconShadow: '0 10px 24px rgba(124,58,237,0.3)',
      accentClass: 'bg-violet-100/90 text-violet-800 dark:bg-violet-500/20 dark:text-violet-200',
      link: '/admin/accounts?monitorRange=week',
    },
    {
      label: 'Pending Encashments',
      value: data.pendingEncashments,
      sub: 'Awaiting processing',
      icon: HiOutlineClock,
      iconGradient: 'linear-gradient(135deg, #b45309, #f59e0b)',
      iconShadow: '0 10px 24px rgba(217,119,6,0.28)',
      accentClass: 'bg-amber-100/90 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200',
      link: '/admin/encashment',
    },
    {
      label: 'Active CD Accounts',
      value: data.activeCdAccounts,
      sub: 'Still paying CD',
      icon: HiOutlineBadgeCheck,
      iconGradient: 'linear-gradient(135deg, #0f766e, #14b8a6)',
      iconShadow: '0 10px 24px rgba(20,184,166,0.28)',
      accentClass: 'bg-emerald-100/90 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200',
      link: '/admin/cd-accounts',
    },
    {
      label: 'Monthly Registrations',
      value: data.newRegistrationsMonth,
      sub: 'This calendar month',
      icon: HiOutlineCalendar,
      iconGradient: 'linear-gradient(135deg, #4f46e5, #818cf8)',
      iconShadow: '0 10px 24px rgba(79,70,229,0.28)',
      accentClass: 'bg-indigo-100/90 text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-200',
      link: '/admin/accounts?monitorRange=month',
    },
  ];

  return (
    <div>
      {/* Greeting */}
      <div className="relative flex items-center justify-between rounded-3xl overflow-hidden p-6 sm:p-8 mb-8 mt-2 ring-1 ring-slate-200/60 dark:ring-white/10 shadow-sm">
        {/* Background Images */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <img src="/img/dashboard_img_light.png" alt="Admin Dashboard Hero" className="w-full h-full object-cover dark:hidden" />
          <img src="/img/dashboard_img_dark.png" alt="Admin Dashboard Hero" className="hidden w-full h-full object-cover dark:block" />
          <div className="absolute inset-0 bg-gradient-to-r from-white/65 via-white/25 to-transparent dark:hidden"></div>
        </div>

        <div className="relative z-10">
          <h1 className="hero-welcome-title font-display text-2xl md:text-3xl font-bold">Admin Dashboard</h1>
          <div className="w-14 h-1 mt-2 mb-3 rounded-full bg-gradient-to-r from-amber-500/70 via-amber-400/40 to-transparent dark:from-amber-300/65 dark:via-amber-200/25" />
          <p className="hero-welcome-subtitle text-sm">
            Welcome back,{' '}
            <span className="hero-welcome-name font-semibold">{admin?.name}</span>.
            {' '}Here&apos;s your system overview.
          </p>
        </div>
      </div>

      {/* Stat Cards — horizontal snap-scroll on mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {cards.map((card, i) => (
          <div
            key={i}
            className="glass-card rounded-2xl p-6 group cursor-pointer hover:ring-1 hover:ring-amber-400/30 motion-safe:transition-all"
            onClick={() => card.link && navigate(card.link)}
          >
            <div className="flex items-center justify-between mb-5">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-always-white group-hover:scale-110 motion-safe:transition-transform motion-safe:duration-300"
                style={{ background: card.iconGradient, boxShadow: card.iconShadow }}
              >
                <card.icon className="w-6 h-6" />
              </div>
              <div
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold max-w-[130px] text-right leading-tight ${card.accentClass}`}
              >
                {card.sub}
              </div>
            </div>
            <p className="text-[13px] font-medium text-slate-600 dark:text-slate-300">{card.label}</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-1 tracking-tight">{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
