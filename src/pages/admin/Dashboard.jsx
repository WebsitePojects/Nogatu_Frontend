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
        <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
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
      gradient: 'from-blue-500 to-blue-600',
      shadow: 'shadow-blue-500/20',
      bg: 'bg-blue-50',
      text: 'text-blue-600',
    },
    {
      label: 'Total Encashment',
      value: `\u20B1${fmt(data.totalEncashment)}`,
      sub: 'Lifetime processed',
      icon: HiOutlineCash,
      gradient: 'from-emerald-500 to-emerald-600',
      shadow: 'shadow-emerald-500/20',
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
    },
    {
      label: 'Hi-Five Purchases',
      value: fmt(data.totalPurchases),
      sub: 'Total purchase points',
      icon: HiOutlineShoppingCart,
      gradient: 'from-amber-500 to-amber-600',
      shadow: 'shadow-amber-500/20',
      bg: 'bg-amber-50',
      text: 'text-amber-600',
    },
    {
      label: 'Weekly Activations',
      value: data.weeklyActivations,
      sub: 'Last 7 days',
      icon: HiOutlineSparkles,
      gradient: 'from-violet-500 to-violet-600',
      shadow: 'shadow-violet-500/20',
      bg: 'bg-violet-50',
      text: 'text-violet-600',
    },
  ];

  return (
    <div>
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Welcome back, {admin?.name}. Here's your system overview.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map((card, i) => (
          <div
            key={i}
            className="group bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-5">
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${card.gradient} ${card.shadow} shadow-lg flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300`}>
                <card.icon className="w-6 h-6" />
              </div>
              <div className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold ${card.bg} ${card.text}`}>
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
