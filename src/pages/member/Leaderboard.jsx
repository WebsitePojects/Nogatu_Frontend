import { useEffect, useState } from 'react';
import api from '../../api';
import { HiOutlineStar, HiOutlineSparkles } from 'react-icons/hi';
import { useAuth } from '../../contexts/AuthContext';
import { getMemberCache, setMemberCache } from '../../utils/memberWarmCache';

const fmt = (n) => Number(n || 0).toLocaleString('en-US', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

function Pager({ page = 1, totalPages = 1, onPrev, onNext, className = '' }) {
  return (
    <div className={`fflex items-center justify-between sm:justify-end gap-2 flex-nowrap whitespace-nowrap overflow-x-auto ${className}`}>
      <button
        onClick={onPrev}
        disabled={page <= 1}
        className="text-sm py-1.5 px-3 rounded-lg font-medium disabled:opacity-40 shrink-0"
        style={{ background: 'rgba(212,175,55,0.08)', color: 'rgba(212,175,55,0.85)', border: '1px solid rgba(212,175,55,0.15)' }}
       type="button">
        Prev
      </button>
      <span className="text-sm shrink-0" style={{ color: 'rgba(255,255,255,0.55)' }}>{page} / {totalPages}</span>
      <button
        onClick={onNext}
        disabled={page >= totalPages}
        className="text-sm py-1.5 px-3 rounded-lg font-medium disabled:opacity-40 shrink-0"
        style={{ background: 'rgba(212,175,55,0.08)', color: 'rgba(212,175,55,0.85)', border: '1px solid rgba(212,175,55,0.15)' }}
       type="button">
        Next
      </button>
    </div>
  );
}

export default function Leaderboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);

  useEffect(() => {
    loadData();
  }, [page]);

  async function loadData() {
    const cacheKey = `leaderboard:${page}`;
    const cached = getMemberCache(user?.uid, cacheKey);
    if (cached) {
      setData(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }
    try {
      const res = await api.get(`/leaderboard?page=${page}&perPage=25`);
      setData(res.data);
      setMemberCache(user?.uid, cacheKey, res.data);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  const pointsBasis = data?.pointsBasis || 'Repurchase points';
  const userRank = Number(data?.userRank || 0);
  const userCurrentRankLabel = data?.userCurrentRankLabel || 'Unranked';
  const userPoints = Number((data?.userGrossRankablePoints ?? data?.userRepurchasePoints ?? data?.userPoints) || 0);
  const userRemaining = Number(data?.userRemainingRankablePoints || 0);
  const userConsumed = Number(data?.userConsumedPoints || 0);
  const nextRankPoints = Number(data?.nextRankPoints || 0);
  const needed = Math.max(0, nextRankPoints - userRemaining);
  const rankPct = nextRankPoints > 0 ? Math.max(0, Math.min(100, (userRemaining / nextRankPoints) * 100)) : 100;
  const currentUserRow = (data?.leaderboard || []).find((row) => row.isCurrentUser) || null;
  const currentUserName = currentUserRow?.fullname || user?.fullname || user?.shortname || user?.username || 'Current member';
  const currentUserUsername = currentUserRow?.username || user?.username || '';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Global Leaderboard</h1>
        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
          {pointsBasis} race standings
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
            <p className="text-sm mt-1 text-white/80">
              {currentUserName}{currentUserUsername ? ` (${currentUserUsername})` : ''}
            </p>
            <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.55)' }}>
              Current race title: {userCurrentRankLabel}
            </p>
            <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.42)' }}>
              {pointsBasis}: {fmt(userRemaining)} | Consumed: {fmt(userConsumed)}
            </p>
          </div>
          <div className="w-full sm:w-72">
            <div className="flex items-center justify-between text-[11px] mb-1.5" style={{ color: 'rgba(255,255,255,0.6)' }}>
              <span className="inline-flex items-center gap-1"><HiOutlineSparkles className="size-3.5" style={{ color: '#D4AF37' }} /> Progress to next rank</span>
              <span style={{ color: '#D4AF37' }}>{fmt(userRemaining)} / {nextRankPoints > 0 ? fmt(nextRankPoints) : '—'}</span>
            </div>
            <div className="h-2.5 w-full rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.10)' }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${rankPct}%`, background: 'linear-gradient(90deg,#D4AF37,#F9E08A)' }} />
            </div>
            <p className="mt-1.5 text-[11px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
              {needed > 0 ? `${fmt(needed)} more points to the next rank` : 'Next rank target reached'}
            </p>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6 overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Top members</p>
          <Pager
            page={data?.pagination?.page || page}
            totalPages={data?.pagination?.totalPages || 1}
            onPrev={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => Math.min(Number(data?.pagination?.totalPages || 1), p + 1))}
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="size-8 rounded-full border-4 animate-spin" style={{ borderColor: 'rgba(212,175,55,0.15)', borderTopColor: '#D4AF37' }} />
          </div>
        ) : (
          <>
          <div className="space-y-3 md:hidden">
            {(data?.leaderboard || []).map((row) => (
              <div
                key={`${row.uid}-${row.rank}`}
                className="rounded-2xl p-4 space-y-3"
                style={
                  row.isCurrentUser
                    ? { background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.25)' }
                    : { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(212,175,55,0.08)' }
                }
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold" style={{ color: '#D4AF37' }}>#{row.rank}</p>
                    <p className="text-white/90 mt-1">{row.fullname || row.username}</p>
                    <p className="text-[11px] mt-1 text-white/45">{row.username}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-white/60">{row.package}</p>
                    <p className="text-xs mt-1 text-white/70">{row.currentRankLabel}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 text-sm">
                  <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <p className="text-[11px] text-white/45">Repurchase points</p>
                    <p className="text-white font-semibold mt-1">{fmt(row.remainingRankablePoints)}</p>
                  </div>
                </div>
              </div>
            ))}
            {(!data?.leaderboard || data.leaderboard.length === 0) && (
              <div className="py-10 text-center" style={{ color: 'rgba(255,255,255,0.35)' }}>
                No leaderboard records found.
              </div>
            )}
          </div>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  {['Top', 'Member', 'Package', 'Current Rank', 'Repurchase points'].map((heading) => (
                    <th key={heading} className="table-header p-3 text-left text-xs uppercase tracking-wide">{heading}</th>
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
                    <td className="p-3 font-semibold" style={{ color: '#D4AF37' }}>
                      #{row.rank}
                    </td>
                    <td className="p-3 text-white/80">
                      <span className="inline-flex items-center gap-2">
                        <span
                          className="size-7 rounded-full flex items-center justify-center text-xs font-bold"
                          style={{ background: 'rgba(255,255,255,0.08)', color: '#F3D98C' }}
                        >
                          {(row.username || '?').slice(0, 1).toUpperCase()}
                        </span>
                        <span>
                          <span className="block text-white/90">{row.fullname || row.username}</span>
                          <span className="block text-[11px] text-white/45">{row.username}</span>
                        </span>
                      </span>
                    </td>
                    <td className="p-3 text-white/60">{row.package}</td>
                    <td className="p-3 text-white/70">
                      <HiOutlineStar className="inline size-4 mr-1" />
                      {row.currentRankLabel}
                    </td>
                    <td className="p-3 text-white/70">{fmt(row.remainingRankablePoints)}</td>
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
          <div className="mt-4">
            <Pager
              page={data?.pagination?.page || page}
              totalPages={data?.pagination?.totalPages || 1}
              onPrev={() => setPage((p) => Math.max(1, p - 1))}
              onNext={() => setPage((p) => Math.min(Number(data?.pagination?.totalPages || 1), p + 1))}
            />
          </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {(data?.rankDefinitions || []).map((item) => {
          const achieved = (data?.raceProgress?.achievements || []).some((achievement) => Number(achievement.rank || 0) === Number(item.rank || 0));
          return (
            <div key={item.rank_code || item.rank_name} className="glass-card rounded-xl p-4">
              <p className="text-sm font-semibold text-white">{item.rank_name}</p>
              <p className="text-xs mt-1" style={{ color: achieved ? '#34d399' : 'rgba(255,255,255,0.5)' }}>
                {achieved ? 'Achieved in race' : 'Race target'}
              </p>
              <p className="text-xs mt-2" style={{ color: 'rgba(212,175,55,0.65)' }}>
                Min points: {fmt(item.points_required || 0)}
              </p>
              <p className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Cash bonus: PHP {fmt(item.cash_incentive || 0)}
              </p>
              <p className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
                {Number(item.left_rank_required || 0) > 0 || Number(item.right_rank_required || 0) > 0
                  ? `Needs rank ${item.left_rank_required} left / rank ${item.right_rank_required} right`
                  : 'No left/right rank requirement'}
              </p>
              <p className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.42)' }}>
                {item.incentive_summary}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
