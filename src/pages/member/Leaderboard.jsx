import { useEffect, useState } from 'react';
import api from '../../api';
import { HiOutlineStar, HiOutlineSparkles } from 'react-icons/hi';

const fmt = (n) => Number(n || 0).toLocaleString('en-US', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

function medal(rank) {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return '#';
}

export default function Leaderboard() {
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);

  useEffect(() => {
    loadData();
  }, [page]);

  async function loadData() {
    setLoading(true);
    try {
      const res = await api.get(`/leaderboard?page=${page}&perPage=25`);
      setData(res.data);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  const userRank = Number(data?.userRank || 0);
  const userPoints = Number(data?.userPoints || 0);
  const nextRankPoints = Number(data?.nextRankPoints || 0);
  const needed = Math.max(0, nextRankPoints - userPoints);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Global Leaderboard</h1>
        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Binary Points Rankings
        </p>
        <div className="w-12 h-0.5 mt-2" style={{ background: 'linear-gradient(90deg,#D4AF37,transparent)' }} />
      </div>

      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide" style={{ color: 'rgba(212,175,55,0.6)' }}>Your current standing</p>
            <p className="mt-1 text-2xl font-bold text-white">
              {userRank > 0 ? `#${userRank}` : 'Not ranked yet'}
            </p>
            <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.55)' }}>Binary points: {fmt(userPoints)}</p>
          </div>
          <div
            className="px-3 py-2 rounded-xl text-xs font-semibold"
            style={{ background: 'rgba(212,175,55,0.10)', border: '1px solid rgba(212,175,55,0.25)', color: '#D4AF37' }}
          >
            <HiOutlineSparkles className="inline w-4 h-4 mr-1" />
            {needed > 0 ? `${fmt(needed)} more points to next Supervisor rank` : 'Supervisor target reached'}
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6 overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Top members</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="text-sm py-1.5 px-3 rounded-lg font-medium disabled:opacity-40"
              style={{ background: 'rgba(212,175,55,0.08)', color: 'rgba(212,175,55,0.85)', border: '1px solid rgba(212,175,55,0.15)' }}
            >
              Prev
            </button>
            <span className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
              {data?.pagination?.page || page} / {data?.pagination?.totalPages || 1}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(Number(data?.pagination?.totalPages || 1), p + 1))}
              disabled={page >= Number(data?.pagination?.totalPages || 1)}
              className="text-sm py-1.5 px-3 rounded-lg font-medium disabled:opacity-40"
              style={{ background: 'rgba(212,175,55,0.08)', color: 'rgba(212,175,55,0.85)', border: '1px solid rgba(212,175,55,0.15)' }}
            >
              Next
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 rounded-full border-4 animate-spin" style={{ borderColor: 'rgba(212,175,55,0.15)', borderTopColor: '#D4AF37' }} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  {['Rank', 'Member', 'Package', 'Binary Points', 'Supervisor Rank'].map((h) => (
                    <th key={h} className="table-header py-3 px-3 text-left text-xs uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(data?.leaderboard || []).map((row) => (
                  <tr
                    key={`${row.uid}-${row.rank}`}
                    style={
                      row.isCurrentUser
                        ? { background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.25)' }
                        : {}
                    }
                  >
                    <td className="py-3 px-3 font-semibold" style={{ color: '#D4AF37' }}>
                      {row.rank <= 3 ? medal(row.rank) : row.rank}
                    </td>
                    <td className="py-3 px-3 text-white/80">
                      <span className="inline-flex items-center gap-2">
                        <span
                          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                          style={{ background: 'rgba(255,255,255,0.08)', color: '#F3D98C' }}
                        >
                          {(row.username || '?').slice(0, 1).toUpperCase()}
                        </span>
                        <span>{row.username}</span>
                      </span>
                    </td>
                    <td className="py-3 px-3 text-white/60">{row.package}</td>
                    <td className="py-3 px-3 font-semibold text-white">{fmt(row.binaryPoints)}</td>
                    <td className="py-3 px-3 text-white/70">
                      <HiOutlineStar className="inline w-4 h-4 mr-1" />
                      {row.supervisorRankLabel}
                    </td>
                  </tr>
                ))}
                {(!data?.leaderboard || data.leaderboard.length === 0) && (
                  <tr>
                    <td colSpan="5" className="py-10 text-center" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      No leaderboard records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { key: 's1', label: 'Supervisor 1' },
          { key: 's2', label: 'Supervisor 2' },
          { key: 's3', label: 'Supervisor 3' },
        ].map((item) => {
          const row = data?.supervisorProgress?.[item.key];
          return (
            <div key={item.key} className="glass-card rounded-xl p-4">
              <p className="text-sm font-semibold text-white">{item.label}</p>
              <p className="text-xs mt-1" style={{ color: row?.qualified ? '#34d399' : 'rgba(255,255,255,0.5)' }}>
                {row?.qualified ? 'Qualified' : 'In progress'}
              </p>
              <p className="text-xs mt-2" style={{ color: 'rgba(212,175,55,0.65)' }}>
                Min points: {fmt(row?.minPoints || 0)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
