import { useState, useEffect } from 'react';
import api from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { HiOutlineCash, HiOutlineUsers, HiOutlineChartBar, HiOutlineTrendingUp, HiOutlineStar, HiOutlineGift, HiOutlineShieldCheck, HiOutlineArrowLeft, HiOutlineArrowRight } from 'react-icons/hi';

const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const res = await api.get('/dashboard');
      setData(res.data);
    } catch { } finally { setLoading(false); }
  }

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div></div>;
  if (!data) return <p className="text-gray-500">Failed to load dashboard.</p>;

  const cards = [
    { label: 'Total Cash Incentives', value: fmt(data.totalCashIncome), icon: HiOutlineCash, color: 'bg-emerald-500' },
    { label: 'Direct Referral', value: fmt(data.directReferral), icon: HiOutlineUsers, color: 'bg-blue-500' },
    { label: 'Sales Volume (Pairing)', value: fmt(data.salesVolume), icon: HiOutlineChartBar, color: 'bg-purple-500' },
    { label: 'Uni-Level', value: fmt(data.uniLevel), icon: HiOutlineTrendingUp, color: 'bg-amber-500' },
    { label: 'Leadership Bonus', value: fmt(data.leadershipBonus), icon: HiOutlineStar, color: 'bg-pink-500' },
    { label: 'Hi-Five Bonus', value: fmt(data.hiFiveBonus), icon: HiOutlineGift, color: 'bg-indigo-500' },
    { label: 'Ranking Bonus (LPC)', value: fmt(data.rankingBonus), icon: HiOutlineShieldCheck, color: 'bg-teal-500' },
    { label: 'Left Accounts', value: data.leftAccounts, icon: HiOutlineArrowLeft, color: 'bg-cyan-500' },
    { label: 'Right Accounts', value: data.rightAccounts, icon: HiOutlineArrowRight, color: 'bg-orange-500' },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500 text-sm">Welcome back, {user?.shortname}! Here's your account overview.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {cards.map((card, i) => (
          <div key={i} className="stat-card">
            <div className={`w-12 h-12 ${card.color} rounded-xl flex items-center justify-center text-white`}>
              <card.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{card.label}</p>
              <p className="text-xl font-bold text-gray-800">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Direct Referrals Breakdown + Maintenance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">Direct Referrals by Package</h3>
          <div className="space-y-3">
            {Object.entries(data.directReferrals || {}).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <span className="text-sm text-gray-600">{type}</span>
                <span className="font-semibold text-gray-800">{count} {count === 1 ? 'Account' : 'Accounts'}</span>
              </div>
            ))}
            {Object.keys(data.directReferrals || {}).length === 0 && (
              <p className="text-sm text-gray-400">No direct referrals yet.</p>
            )}
          </div>
        </div>
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">Monthly Maintenance</h3>
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-white text-sm font-bold ${data.maintenanceStatus === 'Active' ? 'bg-emerald-500' : 'bg-red-400'}`}>
              {data.maintenanceStatus === 'Active' ? 'OK' : '!'}
            </div>
            <div>
              <p className="font-semibold text-lg text-gray-800">{data.maintenanceStatus}</p>
              <p className="text-sm text-gray-500">{data.maintenancePoints} / 200 points</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div className="bg-emerald-500 h-2.5 rounded-full transition-all" style={{ width: `${Math.min(100, (data.maintenancePoints / 200) * 100)}%` }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
