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
        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }
  if (!data) return <p className="text-gray-500">Failed to load dashboard.</p>;

  const cards = [
    {
      label: 'Total Accounts',
      value: data.totalAccounts,
      sub: `Paid: ${data.paidAccounts} | FS: ${data.freeSlots} | CD: ${data.cdSlots}`,
      icon: HiOutlineUsers,
      gradient: 'linear-gradient(135deg, #B8860B, #D4A528)',
      shadow: 'shadow-amber-500/20',
      bgLight: 'rgba(212,165,40,0.08)',
      textLight: '#B8860B',
    },
    {
      label: 'Total Encashment',
      value: `\u20B1${fmt(data.totalEncashment)}`,
      sub: 'Lifetime processed',
      icon: HiOutlineCash,
      gradient: 'linear-gradient(135deg, #592219, #6d3028)',
      shadow: 'shadow-red-900/15',
      bgLight: 'rgba(89,34,25,0.06)',
      textLight: '#592219',
    },
    {
      label: 'Hi-Five Purchases',
      value: fmt(data.totalPurchases),
      sub: 'Total purchase points',
      icon: HiOutlineShoppingCart,
      gradient: 'linear-gradient(135deg, #8B5A08, #B8720A)',
      shadow: 'shadow-amber-700/15',
      bgLight: 'rgba(139,90,8,0.08)',
      textLight: '#8B5A08',
    },
    {
      label: 'Weekly Activations',
      value: data.weeklyActivations,
      sub: 'Last 7 days',
      icon: HiOutlineSparkles,
      gradient: 'linear-gradient(135deg, #D4A528, #E7C679)',
      shadow: 'shadow-yellow-500/15',
      bgLight: 'rgba(212,165,40,0.08)',
      textLight: '#D4A528',
    },
  ];

  return (
    <div>
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Welcome back, <span className="text-brand-brown font-semibold">{admin?.name}</span>. Here's your system overview.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map((card, i) => (
          <div
            key={i}
            className="group bg-white rounded-2xl border border-primary-100/50 p-6 hover:shadow-lg hover:-translate-y-0.5 motion-safe:transition-all motion-safe:duration-300"
          >
            <div className="flex items-center justify-between mb-5">
              <div className={`w-12 h-12 rounded-2xl ${card.shadow} shadow-lg flex items-center justify-center text-white group-hover:scale-110 motion-safe:transition-transform motion-safe:duration-300`} style={{ background: card.gradient }}>
                <card.icon className="w-6 h-6" />
              </div>
              <div className="px-2.5 py-1 rounded-lg text-[11px] font-semibold" style={{ background: card.bgLight, color: card.textLight }}>
                {card.sub}
              </div>
            </div>
            <p className="text-[13px] text-gray-500 font-medium">{card.label}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1 tracking-tight">{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
