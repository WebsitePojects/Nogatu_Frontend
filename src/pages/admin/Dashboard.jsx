import { useState, useEffect } from 'react';
import api from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { HiOutlineUsers, HiOutlineCash, HiOutlineShoppingCart, HiOutlineSparkles } from 'react-icons/hi';

const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function AdminDashboard() {
  const { admin } = useAuth();
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
          style={{ borderColor: 'rgba(212,175,55,0.2)', borderTopColor: 'rgba(212,175,55,0.8)' }}
        />
      </div>
    );
  }
  if (!data) return <p className="text-white/50">Failed to load dashboard.</p>;

  const cards = [
    {
      label: 'Total Accounts',
      value: data.totalAccounts,
      sub: `Paid: ${data.paidAccounts} | FS: ${data.freeSlots} | CD: ${data.cdSlots}`,
      icon: HiOutlineUsers,
      iconGradient: 'linear-gradient(135deg, #B8860B, #D4AF37)',
      iconShadow: '0 8px 24px rgba(184,134,11,0.35)',
      accentColor: 'rgba(212,175,55,0.12)',
      accentText: '#D4AF37',
    },
    {
      label: 'Total Encashment',
      value: `\u20B1${fmt(data.totalEncashment)}`,
      sub: 'Lifetime processed',
      icon: HiOutlineCash,
      iconGradient: 'linear-gradient(135deg, #7f1d1d, #991b1b)',
      iconShadow: '0 8px 24px rgba(127,29,29,0.45)',
      accentColor: 'rgba(153,27,27,0.12)',
      accentText: '#f87171',
    },
    {
      label: 'Hi-Five Purchases',
      value: fmt(data.totalPurchases),
      sub: 'Total purchase points',
      icon: HiOutlineShoppingCart,
      iconGradient: 'linear-gradient(135deg, #8B5A08, #B8720A)',
      iconShadow: '0 8px 24px rgba(139,90,8,0.35)',
      accentColor: 'rgba(139,90,8,0.12)',
      accentText: '#F2D06B',
    },
    {
      label: 'Weekly Activations',
      value: data.weeklyActivations,
      sub: 'Last 7 days',
      icon: HiOutlineSparkles,
      iconGradient: 'linear-gradient(135deg, #D4AF37, #F2D06B)',
      iconShadow: '0 8px 24px rgba(212,175,55,0.35)',
      accentColor: 'rgba(242,208,107,0.10)',
      accentText: '#FFD700',
    },
  ];

  return (
    <div>
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-white">Admin Dashboard</h1>
        <div className="w-12 h-0.5 mt-2 mb-3" style={{ background: 'linear-gradient(90deg,#D4AF37,transparent)' }} />
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
          Welcome back,{' '}
          <span style={{ color: '#D4AF37', fontWeight: 600 }}>{admin?.name}</span>.
          {' '}Here&apos;s your system overview.
        </p>
      </div>

      {/* Stat Cards — horizontal snap-scroll on mobile */}
      <div className="snap-scroll-x lg:grid lg:grid-cols-4 lg:gap-5">
        {cards.map((card, i) => (
          <div
            key={i}
            className="glass-card rounded-2xl p-6 snap-start flex-shrink-0 w-64 lg:w-auto group"
          >
            <div className="flex items-center justify-between mb-5">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-white group-hover:scale-110 motion-safe:transition-transform motion-safe:duration-300"
                style={{ background: card.iconGradient, boxShadow: card.iconShadow }}
              >
                <card.icon className="w-6 h-6" />
              </div>
              <div
                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold max-w-[130px] text-right leading-tight"
                style={{ background: card.accentColor, color: card.accentText }}
              >
                {card.sub}
              </div>
            </div>
            <p className="text-[13px] font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>{card.label}</p>
            <p className="text-3xl font-bold text-white mt-1 tracking-tight">{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
