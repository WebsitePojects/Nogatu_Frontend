import { useState, useEffect } from 'react';
import api from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { HiOutlineCash, HiOutlineUsers, HiOutlineChartBar, HiOutlineTrendingUp, HiOutlineStar, HiOutlineGift, HiOutlineShieldCheck, HiOutlineArrowLeft, HiOutlineArrowRight } from 'react-icons/hi';

const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const CARD_THEMES = [
  { bg: 'bg-gradient-to-br from-emerald-500 to-emerald-600', shadow: 'shadow-emerald-500/20' },
  { bg: 'bg-gradient-to-br from-blue-500 to-blue-600', shadow: 'shadow-blue-500/20' },
  { bg: 'bg-gradient-to-br from-violet-500 to-violet-600', shadow: 'shadow-violet-500/20' },
  { bg: 'bg-gradient-to-br from-amber-500 to-amber-600', shadow: 'shadow-amber-500/20' },
  { bg: 'bg-gradient-to-br from-pink-500 to-pink-600', shadow: 'shadow-pink-500/20' },
  { bg: 'bg-gradient-to-br from-indigo-500 to-indigo-600', shadow: 'shadow-indigo-500/20' },
  { bg: 'bg-gradient-to-br from-teal-500 to-teal-600', shadow: 'shadow-teal-500/20' },
  { bg: 'bg-gradient-to-br from-cyan-500 to-cyan-600', shadow: 'shadow-cyan-500/20' },
  { bg: 'bg-gradient-to-br from-orange-500 to-orange-600', shadow: 'shadow-orange-500/20' },
];

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

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }
  if (!data) return <p className="text-gray-500">Failed to load dashboard.</p>;

  const cards = [
    { label: 'Total Cash Incentives', value: fmt(data.totalCashIncome), icon: HiOutlineCash },
    { label: 'Direct Referral', value: fmt(data.directReferral), icon: HiOutlineUsers },
    { label: 'Sales Volume (Pairing)', value: fmt(data.salesVolume), icon: HiOutlineChartBar },
    { label: 'Uni-Level', value: fmt(data.uniLevel), icon: HiOutlineTrendingUp },
    { label: 'Leadership Bonus', value: fmt(data.leadershipBonus), icon: HiOutlineStar },
    { label: 'Hi-Five Bonus', value: fmt(data.hiFiveBonus), icon: HiOutlineGift },
    { label: 'Ranking Bonus (LPC)', value: fmt(data.rankingBonus), icon: HiOutlineShieldCheck },
    { label: 'Left Accounts', value: data.leftAccounts, icon: HiOutlineArrowLeft },
    { label: 'Right Accounts', value: data.rightAccounts, icon: HiOutlineArrowRight },
  ];

  const maintenancePct = Math.min(100, (data.maintenancePoints / 200) * 100);

  return (
    <div>
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.shortname}
        </h1>
        <p className="text-sm text-gray-500 mt-1">Here's an overview of your account performance.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {cards.map((card, i) => {
          const theme = CARD_THEMES[i % CARD_THEMES.length];
          return (
            <div
              key={i}
              className="group bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-11 h-11 rounded-xl ${theme.bg} ${theme.shadow} shadow-lg flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300`}>
                  <card.icon className="w-5 h-5" />
                </div>
              </div>
              <p className="text-[13px] text-gray-500 font-medium">{card.label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1 tracking-tight">{card.value}</p>
            </div>
          );
        })}
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Direct Referrals Breakdown */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-5">Direct Referrals by Package</h3>
          <div className="space-y-3">
            {Object.entries(data.directReferrals || {}).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary-500" />
                  <span className="text-sm text-gray-600">{type}</span>
                </div>
                <span className="text-sm font-bold text-gray-900 bg-gray-50 px-3 py-1 rounded-lg">
                  {count} {count === 1 ? 'Acct' : 'Accts'}
                </span>
              </div>
            ))}
            {Object.keys(data.directReferrals || {}).length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-gray-400">No direct referrals yet.</p>
                <p className="text-xs text-gray-400 mt-1">Start building your network!</p>
              </div>
            )}
          </div>
        </div>

        {/* Monthly Maintenance */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-5">Monthly Maintenance</h3>
          <div className="flex items-center gap-5 mb-6">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white text-sm font-bold shadow-lg ${
                data.maintenanceStatus === 'Active'
                  ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-emerald-500/25'
                  : 'bg-gradient-to-br from-red-400 to-red-500 shadow-red-400/25'
              }`}
            >
              {data.maintenanceStatus === 'Active' ? (
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
              ) : (
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01" /></svg>
              )}
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">{data.maintenanceStatus}</p>
              <p className="text-sm text-gray-500">{data.maintenancePoints} / 200 points</p>
            </div>
          </div>
          {/* Progress bar */}
          <div className="relative">
            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
              <div
                className={`h-3 rounded-full transition-all duration-700 ease-out ${
                  maintenancePct >= 100
                    ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                    : maintenancePct >= 50
                    ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                    : 'bg-gradient-to-r from-red-400 to-red-500'
                }`}
                style={{ width: `${maintenancePct}%` }}
              />
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-xs text-gray-400">0</span>
              <span className="text-xs text-gray-400 font-medium">{Math.round(maintenancePct)}%</span>
              <span className="text-xs text-gray-400">200</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
