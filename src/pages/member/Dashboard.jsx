import { useState, useEffect } from 'react';
import api from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { HiOutlineCash, HiOutlineUsers, HiOutlineChartBar, HiOutlineTrendingUp, HiOutlineStar, HiOutlineGift, HiOutlineShieldCheck, HiOutlineArrowLeft, HiOutlineArrowRight } from 'react-icons/hi';

const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const CARD_THEMES = [
  { bg: 'linear-gradient(135deg, #B8860B, #D4A528)', shadow: 'shadow-amber-500/20' },
  { bg: 'linear-gradient(135deg, #592219, #6d3028)', shadow: 'shadow-red-900/15' },
  { bg: 'linear-gradient(135deg, #8B5A08, #B8720A)', shadow: 'shadow-amber-700/20' },
  { bg: 'linear-gradient(135deg, #D4A528, #E7C679)', shadow: 'shadow-yellow-500/20' },
  { bg: 'linear-gradient(135deg, #6d3028, #8B4513)', shadow: 'shadow-red-800/15' },
  { bg: 'linear-gradient(135deg, #4A2F04, #6B4506)', shadow: 'shadow-amber-900/20' },
  { bg: 'linear-gradient(135deg, #B8720A, #D4870A)', shadow: 'shadow-orange-600/15' },
  { bg: 'linear-gradient(135deg, #3A1000, #592219)', shadow: 'shadow-red-900/20' },
  { bg: 'linear-gradient(135deg, #A07608, #C4951F)', shadow: 'shadow-amber-600/15' },
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
          Welcome back, <span className="text-brand-gold-dark">{user?.shortname}</span>
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
              className="group bg-white rounded-2xl border border-primary-100/50 p-5 hover:shadow-lg hover:-translate-y-0.5 motion-safe:transition-all motion-safe:duration-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-11 h-11 rounded-xl ${theme.shadow} shadow-lg flex items-center justify-center text-white group-hover:scale-110 motion-safe:transition-transform motion-safe:duration-300`} style={{ background: theme.bg }}>
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
        <div className="bg-white rounded-2xl border border-primary-100/50 p-6">
          <h3 className="font-semibold text-gray-900 mb-5">Direct Referrals by Package</h3>
          <div className="space-y-3">
            {Object.entries(data.directReferrals || {}).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between py-3 border-b border-primary-100/30 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full" style={{ background: '#D4A528' }} />
                  <span className="text-sm text-gray-600">{type}</span>
                </div>
                <span className="text-sm font-bold text-gray-900 px-3 py-1 rounded-lg" style={{ background: 'rgba(212,165,40,0.08)' }}>
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
        <div className="bg-white rounded-2xl border border-primary-100/50 p-6">
          <h3 className="font-semibold text-gray-900 mb-5">Monthly Maintenance</h3>
          <div className="flex items-center gap-5 mb-6">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-sm font-bold shadow-lg"
              style={{
                background: data.maintenanceStatus === 'Active'
                  ? 'linear-gradient(135deg, #B8860B, #D4A528)'
                  : 'linear-gradient(135deg, #dc2626, #ef4444)',
                boxShadow: data.maintenanceStatus === 'Active'
                  ? '0 8px 20px rgba(184,134,11,0.25)'
                  : '0 8px 20px rgba(239,68,68,0.25)',
              }}
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
            <div className="w-full rounded-full h-3 overflow-hidden" style={{ background: 'rgba(212,165,40,0.1)' }}>
              <div
                className="h-3 rounded-full motion-safe:transition-all motion-safe:duration-700 ease-out"
                style={{
                  width: `${maintenancePct}%`,
                  background: maintenancePct >= 100
                    ? 'linear-gradient(90deg, #B8860B, #D4A528)'
                    : maintenancePct >= 50
                    ? 'linear-gradient(90deg, #F59E0B, #FBBF24)'
                    : 'linear-gradient(90deg, #dc2626, #ef4444)',
                }}
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
