import { useEffect, useState } from 'react';
import api from '../../api';
import {
  HiOutlineShieldCheck,
  HiOutlineTrendingUp,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineSparkles,
} from 'react-icons/hi';

const fmtInt = (n) => Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 0 });

const RANKS = [
  {
    rank: 1,
    label: 'Supervisor 1',
    minPoints: 10000,
    requirement: '1 qualified S1 on left leg + 1 qualified S1 on right leg',
    incentives: 'DP Motorcycle, P5,000 cash, White T-shirt',
    color: '#CD7F32',
  },
  {
    rank: 2,
    label: 'Supervisor 2',
    minPoints: 20000,
    requirement: '20,000 total binary points',
    incentives: 'Laptop, P10,000 cash, White Polo',
    color: '#C0C0C0',
  },
  {
    rank: 3,
    label: 'Supervisor 3',
    minPoints: 40000,
    requirement: '1 qualified S2 on left leg + 1 qualified S2 on right leg',
    incentives: 'International Asian travel, P20,000 cash, Silver pin',
    color: '#FFD700',
  },
];

export default function RankingProgress() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const res = await api.get('/ranking');
      setData(res.data);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }

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

  if (!data) {
    return <p style={{ color: 'rgba(255,255,255,0.45)' }}>Failed to load ranking progress.</p>;
  }

  const nextRankPct = Math.min(100, Number(data.progress || 0));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Ranking Progress</h1>
        <div className="w-10 h-0.5 mt-2 rounded-full" style={{ background: 'linear-gradient(90deg,#D4AF37,transparent)' }} />
      </div>

      <div className="glass-card rounded-2xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div>
            <p className="text-xs uppercase tracking-wider" style={{ color: 'rgba(212,175,55,0.5)' }}>
              Current Rank
            </p>
            <div className="flex items-center gap-3 mt-1">
              <h2 className="text-2xl font-bold text-white">{data.currentRankLabel || 'None'}</h2>
              <span
                className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold"
                style={{
                  background: `${data.currentRankColor || '#6B7280'}22`,
                  color: data.currentRankColor || '#9CA3AF',
                  border: `1px solid ${data.currentRankColor || '#6B7280'}55`,
                }}
              >
                Rank {Number(data.currentRank || 0)}
              </span>
            </div>
            <p className="text-sm mt-2" style={{ color: 'rgba(255,255,255,0.55)' }}>
              Total binary points: <span style={{ color: '#D4AF37', fontWeight: 700 }}>{fmtInt(data.totalPoints)}</span>
            </p>
          </div>

          <div className="min-w-[260px]">
            <p className="text-xs uppercase tracking-wider mb-2" style={{ color: 'rgba(212,175,55,0.5)' }}>
              Next Rank Progress
            </p>
            <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(212,175,55,0.08)' }}>
              <div
                className="h-full rounded-full motion-safe:transition-all motion-safe:duration-500"
                style={{ width: `${nextRankPct}%`, background: 'linear-gradient(90deg,#9A7B0A,#D4AF37,#F2D06B)' }}
              />
            </div>
            <p className="text-sm mt-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
              {data.nextRank
                ? `${nextRankPct.toFixed(2)}% to ${data.nextRankLabel} (${fmtInt(data.nextRankMinPoints)} pts)`
                : 'Maximum rank achieved'}
            </p>
          </div>
        </div>

        {data.nextRank === 1 || data.nextRank === 3 ? (
          <div className="mt-5 rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(212,175,55,0.1)' }}>
            <p className="text-sm font-semibold text-white mb-2">Leg Qualification Status</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
                {data.legStatus?.leftQualified ? (
                  <HiOutlineCheckCircle className="w-5 h-5" style={{ color: '#34d399' }} />
                ) : (
                  <HiOutlineXCircle className="w-5 h-5" style={{ color: '#f87171' }} />
                )}
                Left leg qualification
              </div>
              <div className="flex items-center gap-2 text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
                {data.legStatus?.rightQualified ? (
                  <HiOutlineCheckCircle className="w-5 h-5" style={{ color: '#34d399' }} />
                ) : (
                  <HiOutlineXCircle className="w-5 h-5" style={{ color: '#f87171' }} />
                )}
                Right leg qualification
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {RANKS.map((r) => (
          <div key={r.rank} className="glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-base font-semibold text-white">{r.label}</p>
              <span
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold"
                style={{ background: `${r.color}22`, color: r.color, border: `1px solid ${r.color}44` }}
              >
                <HiOutlineShieldCheck className="w-3.5 h-3.5" />
                {fmtInt(r.minPoints)} pts
              </span>
            </div>
            <p className="text-sm mb-3" style={{ color: 'rgba(255,255,255,0.6)' }}>
              {r.requirement}
            </p>
            <div className="flex items-start gap-2 text-sm" style={{ color: 'rgba(242,208,107,0.82)' }}>
              <HiOutlineSparkles className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{r.incentives}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="glass-card rounded-2xl p-5 flex items-start gap-3">
        <HiOutlineTrendingUp className="w-5 h-5 mt-0.5" style={{ color: '#D4AF37' }} />
        <div>
          <p className="text-sm font-semibold text-white">Current Incentive Status</p>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>
            {Number(data.incentiveStatus) === 1 ? 'Claimed' : 'Pending'}
            {' '}• {data.incentives || 'N/A'}
          </p>
        </div>
      </div>
    </div>
  );
}
