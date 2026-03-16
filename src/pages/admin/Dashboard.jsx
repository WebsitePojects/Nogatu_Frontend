import { useState, useEffect } from 'react';
import api from '../../api';
import { HiOutlineUsers, HiOutlineCash, HiOutlineShoppingCart, HiOutlineSparkles } from 'react-icons/hi';

const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard').then(res => setData(res.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div></div>;
  if (!data) return <p>Failed to load dashboard.</p>;

  const cards = [
    { label: 'Total Accounts', value: data.totalAccounts, sub: `Paid: ${data.paidAccounts} | FS: ${data.freeSlots} | CD: ${data.cdSlots}`, icon: HiOutlineUsers, color: 'bg-primary-500' },
    { label: 'Total Encashment', value: `₱${fmt(data.totalEncashment)}`, sub: 'Lifetime processed', icon: HiOutlineCash, color: 'bg-emerald-500' },
    { label: 'Hi-Five Purchases', value: fmt(data.totalPurchases), sub: 'Total purchase points', icon: HiOutlineShoppingCart, color: 'bg-amber-500' },
    { label: 'Weekly Activations', value: data.weeklyActivations, sub: 'Last 7 days', icon: HiOutlineSparkles, color: 'bg-purple-500' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Admin Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, i) => (
          <div key={i} className="card">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 ${card.color} rounded-xl flex items-center justify-center text-white`}>
                <card.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-2xl font-bold text-gray-800">{card.value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{card.sub}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
