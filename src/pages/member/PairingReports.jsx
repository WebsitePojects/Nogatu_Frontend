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
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      setLoading(true);
      try {
        const res = await api.get(`/pairing?page=${page}`);
        if (cancelled) return;
        setData(res.data);
        setTotalPages(res.data.totalPages || 1);
      } catch {
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadData();
    return () => { cancelled = true; };
  }, [page]);

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
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card, i) => (
          <div
            key={i}
            className="glass-card rounded-2xl p-5 flex-shrink-0 w-full"
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
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(212,175,55,0.08)' }}>
          <h3 className="font-display text-base font-semibold text-white">Pairing History</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="text-xs py-1.5 px-3 rounded-lg font-medium disabled:opacity-40"
              style={{ background: 'rgba(212,175,55,0.08)', color: 'rgba(212,175,55,0.85)', border: '1px solid rgba(212,175,55,0.15)' }}
            >
              Prev
            </button>
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{page} / {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="text-xs py-1.5 px-3 rounded-lg font-medium disabled:opacity-40"
              style={{ background: 'rgba(212,175,55,0.08)', color: 'rgba(212,175,55,0.85)', border: '1px solid rgba(212,175,55,0.15)' }}
            >
              Next
            </button>
          </div>
        </div>
        <div className="overflow-x-auto hidden sm:block">
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
        <div className="sm:hidden p-4 space-y-3">
          {(data.reports || []).map((r, i) => (
            <div key={i} className="glass-card rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white/80">{r.transdate || '—'}</span>
                <span className="text-xs font-semibold" style={{ color: '#D4AF37' }}>₱{fmt(r.totalbpay)}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>
                <div>Left: {r.totalleft} / {fmt(r.totalpointsleft)}</div>
                <div>Right: {r.totalright} / {fmt(r.totalpointsright)}</div>
                <div>Pair: {fmt(r.totalpoints)}</div>
                <div>Total: {fmt(r.totalbpay)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
