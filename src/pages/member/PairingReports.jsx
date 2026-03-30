import { useState, useEffect } from 'react';
import api from '../../api';
import { HiOutlineChartBar, HiOutlineArrowLeft, HiOutlineArrowRight } from 'react-icons/hi';

const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function Spinner() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <div className="w-10 h-10 rounded-full border-[3px] animate-spin" style={{ borderColor: 'rgba(212,175,55,0.12)', borderTopColor: '#D4AF37' }} />
    </div>
  );
}

const SUMMARY_CARDS = (counts) => [
  { label: 'Left Accounts',  value: counts?.totalLeft  || 0,               icon: HiOutlineArrowLeft,  color: '#D4AF37' },
  { label: 'Left Points',    value: fmt(counts?.totalPointsLeft),           icon: HiOutlineChartBar,   color: '#F2D06B' },
  { label: 'Right Accounts', value: counts?.totalRight || 0,               icon: HiOutlineArrowRight, color: '#D4AF37' },
  { label: 'Right Points',   value: fmt(counts?.totalPointsRight),          icon: HiOutlineChartBar,   color: '#F2D06B' },
];

export default function PairingReports() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/pairing')
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (!data)   return <p style={{ color: 'rgba(255,255,255,0.4)' }}>Failed to load pairing data.</p>;

  const summaryCards = SUMMARY_CARDS(data.counts);

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Pairing Reports</h1>
        <div className="w-10 h-0.5 mt-2 rounded-full" style={{ background: 'linear-gradient(90deg,#D4AF37,transparent)' }} />
      </div>

      {/* Summary cards — horizontal scroll on mobile */}
      <div className="snap-scroll-x sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:overflow-visible sm:snap-none" style={{ gap: '1rem' }}>
        {summaryCards.map((card, i) => (
          <div
            key={i}
            className="glass-card rounded-2xl p-5 flex-shrink-0"
            style={{ minWidth: '180px' }}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
              style={{ background: `${card.color}18`, border: `1px solid ${card.color}28` }}
            >
              <card.icon className="w-4 h-4" style={{ color: card.color }} />
            </div>
            <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>{card.label}</p>
            <p className="text-xl font-bold text-white">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Pairing history table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(212,175,55,0.08)' }}>
          <h3 className="font-display text-base font-semibold text-white">Pairing History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr>
                <th className="table-header py-3 px-4">Date</th>
                <th className="table-header py-3 px-4">Total Left</th>
                <th className="table-header py-3 px-4">Left Pts</th>
                <th className="table-header py-3 px-4">Total Right</th>
                <th className="table-header py-3 px-4">Right Pts</th>
                <th className="table-header py-3 px-4">Paired Pts</th>
                <th className="table-header py-3 px-4">Total Payout</th>
              </tr>
            </thead>
            <tbody>
              {(data.reports || []).map((r, i) => (
                <tr
                  key={i}
                  style={{
                    background: i % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent',
                    borderBottom: '1px solid rgba(212,175,55,0.05)',
                  }}
                  className="hover:bg-white/[0.03] transition-colors"
                >
                  <td className="py-3 px-4 text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>{r.transdate || '—'}</td>
                  <td className="py-3 px-4 text-white/70">{r.totalleft}</td>
                  <td className="py-3 px-4" style={{ color: 'rgba(212,175,55,0.7)' }}>{fmt(r.totalpointsleft)}</td>
                  <td className="py-3 px-4 text-white/70">{r.totalright}</td>
                  <td className="py-3 px-4" style={{ color: 'rgba(212,175,55,0.7)' }}>{fmt(r.totalpointsright)}</td>
                  <td className="py-3 px-4 font-medium text-white/85">{fmt(r.totalpoints)}</td>
                  <td className="py-3 px-4 font-semibold" style={{ color: '#D4AF37' }}>₱{fmt(r.totalbpay)}</td>
                </tr>
              ))}
              {(!data.reports || data.reports.length === 0) && (
                <tr>
                  <td colSpan="7" className="py-14 text-center">
                    <HiOutlineChartBar className="w-8 h-8 mx-auto mb-2" style={{ color: 'rgba(212,175,55,0.2)' }} />
                    <p style={{ color: 'rgba(255,255,255,0.3)' }}>No pairing records found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
