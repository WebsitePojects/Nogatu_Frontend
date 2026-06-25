import { useEffect, useState } from 'react';
import api from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { getMemberCache, setMemberCache } from '../../utils/memberWarmCache';
import {
  HiOutlineChartBar,
  HiOutlineClock,
  HiOutlineCubeTransparent,
  HiOutlineShieldCheck,
  HiOutlineSparkles,
  HiOutlineTrendingUp,
  HiOutlineViewGrid,
} from 'react-icons/hi';

const fmtInt = (n) => Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 0 });

const RANK_CODE_LABELS = {
  1: 'SP1',
  2: 'SP2',
  3: 'SP3',
  4: 'MN1',
  5: 'MN2',
  6: 'MN3',
  7: 'DR1',
  8: 'DR2',
  9: 'DR3',
  10: 'AMB',
};

const RANK_REQUIREMENT_TEXT = {
  supervisor_1: 'No left/right team rank requirement.',
  supervisor_2: 'Requires 1 SP1 (Supervisor 1) in your left team and 1 SP1 (Supervisor 1) in your right team.',
  supervisor_3: 'Requires 1 SP2 (Supervisor 2) in your left team and 1 SP2 (Supervisor 2) in your right team.',
  manager_1: 'Requires 1 SP3 (Supervisor 3) in your left team and 1 SP3 (Supervisor 3) in your right team.',
  manager_2: 'Requires 1 MN1 (Manager 1) in your left team and 1 MN1 (Manager 1) in your right team.',
  manager_3: 'Requires 1 MN2 (Manager 2) in your left team and 1 MN2 (Manager 2) in your right team.',
  director_1: 'Requires 1 Manager 3 in your left team and 1 Manager 3 in your right team.',
  director_2: 'Requires 1 DR1 (Director 1) in your left team and 1 DR1 (Director 1) in your right team.',
  director_3: 'Requires 1 DR2 (Director 2) in your left team and 1 DR2 (Director 2) in your right team.',
  ambassador: 'Requires 1 DR3 (Director 3) in your left team and 1 DR3 (Director 3) in your right team.',
};

function buildRequirementText(rank) {
  const directText = RANK_REQUIREMENT_TEXT[String(rank.rank_code || '').toLowerCase()];
  if (directText) return directText;

  const left = Number(rank.left_rank_required || 0);
  const right = Number(rank.right_rank_required || 0);

  if (!left && !right) {
    return 'No left/right team rank requirement.';
  }

  const leftCode = RANK_CODE_LABELS[left] || `Rank ${left}`;
  const rightCode = RANK_CODE_LABELS[right] || `Rank ${right}`;
  return `Requires 1 ${leftCode} in your left team and 1 ${rightCode} in your right team.`;
}

function buildRequirementStatusText(data) {
  if (!data?.nextRankRequirement) {
    return 'You have already cleared the top published rank.';
  }

  const leftOk = Boolean(data.leftRequirementMet);
  const rightOk = Boolean(data.rightRequirementMet);
  const leftText = leftOk ? 'left side ready' : 'left side still missing';
  const rightText = rightOk ? 'right side ready' : 'right side still missing';
  return `${leftText}, ${rightText}`;
}

// Transaction-history view for ranking — mirrors Pairing Reports. Reads the same
// authoritative rankable-event ledger the rank engine uses (/api/ranking/events).
function RankingHistory() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ total: 0, totalPoints: 0, page: 1, totalPages: 1, basisLabel: 'Rankable repurchase points' });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState('remaining'); // 'remaining' | 'full'

  useEffect(() => {
    let active = true;
    const load = (silent) => {
      if (!silent) setLoading(true);
      api.get(`/ranking/events?page=${page}&perPage=20&scope=${scope}`)
        .then((res) => {
          if (!active) return;
          setRows(res.data.events || []);
          setMeta({
            total: Number(res.data.total || 0),
            totalPoints: Number(res.data.totalPoints || 0),
            page: Number(res.data.page || 1),
            totalPages: Number(res.data.totalPages || 1),
            basisLabel: res.data.basisLabel || 'Rankable repurchase points',
          });
        })
        .catch(() => { if (active && !silent) setRows([]); })
        .finally(() => { if (active && !silent) setLoading(false); });
    };
    load(false);
    // Live: silent re-fetch on interval + focus so new repurchase events appear without refresh.
    const interval = setInterval(() => load(true), 25000);
    const onFocus = () => load(true);
    window.addEventListener('focus', onFocus);
    return () => {
      active = false;
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [page, scope]);

  const fmtTs = (ts) => {
    if (!ts) return '—';
    const d = new Date(String(ts).replace(' ', 'T'));
    return Number.isNaN(d.getTime()) ? String(ts) : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <HiOutlineClock className="size-5" style={{ color: '#D4AF37' }} />
          <h2 className="font-display text-lg text-white">Ranking Transaction History</h2>
        </div>
        <div className="inline-flex rounded-lg overflow-hidden" style={{ border: '1px solid rgba(212,175,55,0.25)' }}>
          {[['remaining', 'Remaining'], ['full', 'Full ledger']].map(([val, label]) => (
            <button key={val} type="button" onClick={() => { setScope(val); setPage(1); }}
              className="text-xs px-3 py-1.5 font-medium transition-colors"
              style={scope === val ? { background: 'rgba(212,175,55,0.18)', color: '#D4AF37' } : { background: 'transparent', color: 'rgba(255,255,255,0.5)' }}>
              {label}
            </button>
          ))}
        </div>
      </div>
      <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.55)' }}>{fmtInt(meta.total)} event(s) · {fmtInt(meta.totalPoints)} pts</p>
      <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.45)' }}>
        {scope === 'full'
          ? 'Every repurchase that built your ranking — including points already spent achieving a rank (Earned / Used / Left). Newest first.'
          : `Repurchase points still available toward your next rank (${String(meta.basisLabel).toLowerCase()}). Newest first.`}
      </p>

      {loading ? (
        <div className="flex justify-center py-10"><div className="size-8 border-4 rounded-full animate-spin" style={{ borderColor: 'rgba(212,175,55,0.2)', borderTopColor: '#D4AF37' }} /></div>
      ) : rows.length === 0 ? (
        <div className="py-10 text-center text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>No rankable transactions yet.</div>
      ) : (
        <>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr>{(scope === 'full' ? ['Date', 'Source', 'Level', 'Earned', 'Used', 'Left'] : ['Date', 'Source', 'Level', 'Points']).map((h) => <th key={h} className="table-header py-2.5 px-2 text-left">{h}</th>)}</tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.repurchaseId} className="border-t" style={{ borderColor: 'rgba(212,175,55,0.08)' }}>
                    <td className="py-2.5 px-2 text-white/60 text-xs">{fmtTs(r.eventTs)}</td>
                    <td className="py-2.5 px-2 text-white/80">{r.sourceName}{r.sourceUsername && <span className="text-white/40 text-xs ml-1">@{r.sourceUsername}</span>}</td>
                    <td className="py-2.5 px-2 text-white/60">L{r.depth}</td>
                    <td className="py-2.5 px-2 font-semibold" style={{ color: '#D4AF37' }}>{fmtInt(r.points)}</td>
                    {scope === 'full' && <td className="py-2.5 px-2 text-white/55">{fmtInt(r.consumed)}</td>}
                    {scope === 'full' && <td className="py-2.5 px-2" style={{ color: Number(r.remaining) > 0 ? '#34d399' : 'rgba(255,255,255,0.35)' }}>{fmtInt(r.remaining)}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="md:hidden space-y-3">
            {rows.map((r) => (
              <div key={r.repurchaseId} className="rounded-xl p-3" style={{ border: '1px solid rgba(212,175,55,0.12)', background: 'rgba(255,255,255,0.02)' }}>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-white/80 text-sm font-medium truncate">{r.sourceName}</p>
                  <span className="font-semibold text-sm flex-shrink-0" style={{ color: '#D4AF37' }}>{fmtInt(r.points)} pts</span>
                </div>
                <p className="text-white/45 text-xs mt-1">{r.sourceUsername ? `@${r.sourceUsername} · ` : ''}Level {r.depth} · {fmtTs(r.eventTs)}{scope === 'full' ? ` · used ${fmtInt(r.consumed)} · left ${fmtInt(r.remaining)}` : ''}</p>
              </div>
            ))}
          </div>
          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <button type="button" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="text-xs px-3 py-1.5 rounded-lg disabled:opacity-40" style={{ color: '#D4AF37', background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)' }}>Prev</button>
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Page {meta.page} / {meta.totalPages}</span>
              <button type="button" disabled={page >= meta.totalPages} onClick={() => setPage((p) => p + 1)} className="text-xs px-3 py-1.5 rounded-lg disabled:opacity-40" style={{ color: '#D4AF37', background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)' }}>Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function RankingProgress() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    // Live ranking: silently re-fetch on an interval + when the tab regains focus, so a
    // downline's product-code use is reflected without the member manually refreshing.
    const POLL_MS = 25000;
    const interval = setInterval(() => loadData({ silent: true }), POLL_MS);
    const onFocus = () => loadData({ silent: true });
    const onVisible = () => { if (document.visibilityState === 'visible') loadData({ silent: true }); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisible);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  async function loadData({ silent = false } = {}) {
    if (!silent) {
      const cached = getMemberCache(user?.uid, 'ranking');
      if (cached) {
        setData(cached);
        setLoading(false);
      } else {
        setLoading(true);
      }
    }
    try {
      const res = await api.get('/ranking');
      setData(res.data);
      setMemberCache(user?.uid, 'ranking', res.data);
    } catch {
      if (!silent) setData(null); // keep last-good data on a silent poll error
    } finally {
      if (!silent) setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div
          className="size-10 border-4 rounded-full animate-spin"
          style={{ borderColor: 'rgba(212,175,55,0.2)', borderTopColor: 'rgba(212,175,55,0.8)' }}
        />
      </div>
    );
  }

  if (!data) {
    return <p style={{ color: 'rgba(255,255,255,0.45)' }}>Failed to load ranking progress.</p>;
  }

  const basisLabel = data.basisLabel || 'Repurchase points';
  const nextRankPct = Math.min(100, Number(data.progress || 0));
  const requirementStatusText = buildRequirementStatusText(data);
  const showPackageGate = Boolean(data.blockedByPackageGate || !data.rankingEligible);

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
              Package
            </p>
            <div className="flex items-center gap-3 mt-1 mb-3 flex-wrap">
              <span
                className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold"
                style={{ background: 'rgba(212,175,55,0.12)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.28)' }}
              >
                {data.packageLabel || 'Unknown Package'}
              </span>
              <span
                className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold"
                style={
                  data.rankingEligible
                    ? { background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.25)' }
                    : { background: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.25)' }
                }
              >
                {data.rankingEligible ? `Ranking up to ${data.packageRankMaxLabel || 'published ceiling'}` : 'Ranking locked'}
              </span>
            </div>
            <p className="text-xs uppercase tracking-wider" style={{ color: 'rgba(212,175,55,0.5)' }}>
              Current Rank
            </p>
            <div className="flex items-center gap-3 mt-1">
              <h2 className="text-2xl font-bold text-white">{data.currentRankLabel || 'Unranked'}</h2>
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
              {basisLabel}: <span style={{ color: '#D4AF37', fontWeight: 700 }}>{fmtInt(data.grossRankablePoints ?? data.repurchasePoints ?? data.totalPoints)}</span>
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
              {!data.rankingEligible
                ? 'Ranking unlocks at Gold — upgrade to begin ranking'
                : data.nextRank
                  ? `${nextRankPct.toFixed(2)}% to ${data.nextRankLabel} (${fmtInt(data.nextRankMinPoints)} fresh repurchase pts)`
                  : (data.blockedByPackageGate ? 'upgrade required to unlock the next rank tier' : 'Maximum rank achieved')}
            </p>
          </div>
        </div>
      </div>

      {showPackageGate && (
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <HiOutlineShieldCheck className="size-5 mt-0.5" style={{ color: '#D4AF37' }} />
            <div>
              <p className="text-sm font-semibold text-white">
                {data.rankingEligible ? 'Ranking Ceiling' : 'Ranking Locked'}
              </p>
              <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.65)' }}>
                {!data.rankingEligible
                  ? 'Ranking unlocks at Gold. Bronze and Silver do not rank yet — upgrade your package to start ranking.'
                  : (data.rankingEligibilityReason || 'You have reached the top rank for your current package. Upgrade to rank higher.')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Simplified summary: just the two figures members actually need —
          remaining points toward the next rank, and the current rank. */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide" style={{ color: 'rgba(212,175,55,0.58)' }}>Remaining Points</p>
              <p className="mt-2 text-3xl font-bold text-white">{fmtInt(data.remainingRankablePoints)}</p>
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.46)' }}>fresh repurchase points left toward your next rank</p>
            </div>
            <HiOutlineTrendingUp className="size-6" style={{ color: '#D4AF37' }} />
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide" style={{ color: 'rgba(212,175,55,0.58)' }}>Current Rank</p>
              <p className="mt-2 text-3xl font-bold text-white">{data.currentRankLabel || 'Unranked'}</p>
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.46)' }}>
                {Number(data.pendingAchievementCount || 0) > 0
                  ? `${fmtInt(data.pendingAchievementCount)} pending cash claim(s)`
                  : 'rank cash release stays manual'}
              </p>
            </div>
            <HiOutlineShieldCheck className="size-6" style={{ color: '#D4AF37' }} />
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <HiOutlineShieldCheck className="size-5 mt-0.5" style={{ color: '#D4AF37' }} />
          <div>
            <p className="text-sm font-semibold text-white">Next Rank Gate</p>
            <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>
              {data.nextRankRequirement
                ? `${data.nextRankRequirement.rankName} needs ${fmtInt(data.nextRankRequirement.pointsRequired)} fresh repurchase points.`
                : (data.blockedByPackageGate
                  ? `${data.rankingEligibilityReason || 'Upgrade is required to continue ranking.'}`
                  : 'No further gate is waiting because the full published rank ladder is already cleared.')}
            </p>
            <p className="text-xs mt-2" style={{ color: 'rgba(212,175,55,0.72)' }}>
              {data.nextRankRequirement
                ? requirementStatusText
                : (data.upgradeRequiredPackageLabel ? `Next upgrade target: ${data.upgradeRequiredPackageLabel}` : requirementStatusText)}
            </p>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <HiOutlineViewGrid className="size-5 mt-0.5" style={{ color: '#D4AF37' }} />
          <div>
            <p className="text-sm font-semibold text-white">Rank Ladder</p>
            <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.58)' }}>
              {data.rankingEligible
                ? 'Every rank below shows the ranks currently available to your package, with target points, team requirement, and incentives.'
                : 'Ranking starts at Gold package. Upgrade first to unlock the rank ladder.'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {(data.rankDefinitions || []).map((rankDefinition) => {
          const isCurrent = Number(data.currentRank || 0) === Number(rankDefinition.rank || 0);
          const isUnlocked = Number(data.currentRank || 0) >= Number(rankDefinition.rank || 0);

          return (
            <div
              key={rankDefinition.rank}
              className="glass-card rounded-2xl p-5"
              style={isCurrent ? { border: '1px solid rgba(212,175,55,0.35)' } : undefined}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-base font-semibold text-white">{rankDefinition.rank_name}</p>
                  <p className="text-xs mt-1" style={{ color: isUnlocked ? 'rgba(74,222,128,0.9)' : 'rgba(255,255,255,0.45)' }}>
                    {isCurrent ? 'Your current rank' : isUnlocked ? 'Unlocked' : 'Locked'}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold"
                    style={{ background: 'rgba(212,175,55,0.12)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.28)' }}
                  >
                    <HiOutlineShieldCheck className="size-3.5" />
                    {fmtInt(rankDefinition.points_required)} pts
                  </span>
                  <p className="text-[11px] mt-2" style={{ color: 'rgba(255,255,255,0.45)' }}>
                    Code: {RANK_CODE_LABELS[Number(rankDefinition.rank)] || `Rank ${rankDefinition.rank}`}
                  </p>
                </div>
              </div>

              <div className="rounded-xl p-3 mb-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <p className="text-[11px] uppercase tracking-wide mb-2" style={{ color: 'rgba(212,175,55,0.65)' }}>
                  Requirements
                </p>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.72)' }}>
                  {buildRequirementText(rankDefinition)}
                </p>
              </div>

              <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div className="flex items-start gap-2 text-sm" style={{ color: 'rgba(242,208,107,0.82)' }}>
                  <HiOutlineSparkles className="size-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-[11px] uppercase tracking-wide mb-1" style={{ color: 'rgba(212,175,55,0.65)' }}>
                      Incentives
                    </p>
                    <span>{rankDefinition.incentive_summary}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="glass-card rounded-2xl p-5 flex items-start gap-3">
        <HiOutlineTrendingUp className="size-5 mt-0.5" style={{ color: '#D4AF37' }} />
        <div>
          <p className="text-sm font-semibold text-white">Current Incentive Status</p>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>
            {Number(data.pendingAchievementCount || 0) > 0 ? 'Pending release' : (Number(data.currentRank || 0) > 0 ? 'Released' : 'Locked')}
            {' '}| {data.incentives || 'N/A'}
          </p>
        </div>
      </div>

      <RankingHistory />
    </div>
  );
}
