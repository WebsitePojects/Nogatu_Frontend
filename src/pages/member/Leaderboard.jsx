import { useEffect, useState } from 'react';
import api from '../../api';
import { HiOutlineStar, HiOutlineSparkles, HiOutlineDownload, HiOutlineUsers, HiOutlineChevronDown, HiOutlineClipboardList } from 'react-icons/hi';
import { useAuth } from '../../contexts/AuthContext';
import { getMemberCache, setMemberCache } from '../../utils/memberWarmCache';

const fmt = (n) => Number(n || 0).toLocaleString('en-US', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

function downloadCsv(filename, rows) {
  const csv = rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

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
              Remaining points: <span style={{ color: '#D4AF37', fontWeight: 700 }}>{fmt(userRemaining)}</span>
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

      <BloodlineBreakdown />
      <RankableEventsLedger />
    </div>
  );
}

/* ── Bloodline breakdown: who in your downline produced your repurchase points ── */
function BloodlineBreakdown() {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    setLoading(true);
    api.get(`/leaderboard/bloodline?page=${page}&perPage=50`)
      .then((res) => { if (!cancelled) setData(res.data); })
      .catch(() => { if (!cancelled) setData(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [open, page]);

  async function exportCsv() {
    setExporting(true);
    try {
      const all = [];
      let p = 1; let totalPages = 1;
      do {
        // eslint-disable-next-line no-await-in-loop
        const res = await api.get(`/leaderboard/bloodline?page=${p}&perPage=200`);
        all.push(...(res.data.contributors || []));
        totalPages = Number(res.data.totalPages || 1);
        p += 1;
      } while (p <= totalPages && p <= 100);
      const header = ['UID', 'Username', 'Full Name', 'Level', 'Repurchase Events', 'Gross Points', 'Consumed', 'Net Points'];
      const rows = [header, ...all.map((c) => [c.uid, c.username, c.fullname, c.level, c.events, c.gross, c.consumed, c.net])];
      downloadCsv(`bloodline_breakdown_${Date.now()}.csv`, rows);
    } catch { /* ignore */ } finally {
      setExporting(false);
    }
  }

  const t = data?.totals || { contributors: 0, gross: 0, consumed: 0, net: 0 };
  const contributors = data?.contributors || [];
  const totalPages = Number(data?.totalPages || 1);

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <button type="button" onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
        style={{ borderBottom: open ? '1px solid rgba(212,175,55,0.08)' : 'none' }}>
        <div className="flex items-center gap-2">
          <HiOutlineUsers className="size-5" style={{ color: '#D4AF37' }} />
          <div>
            <p className="font-display text-base font-semibold text-white">Bloodline Breakdown</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Which downline members produced your repurchase points</p>
          </div>
        </div>
        <HiOutlineChevronDown className="size-5 transition-transform" style={{ color: 'rgba(212,175,55,0.7)', transform: open ? 'rotate(180deg)' : 'none' }} />
      </button>

      {open && (
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Contributors', value: fmt(t.contributors), color: '#fff' },
              { label: 'Gross points', value: fmt(t.gross), color: '#D4AF37' },
              { label: 'Consumed (uplines)', value: fmt(t.consumed), color: '#fca5a5' },
              { label: 'Net available', value: fmt(t.net), color: '#34d399' },
            ].map((c) => (
              <div key={c.label} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(212,175,55,0.1)' }}>
                <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.5)' }}>{c.label}</p>
                <p className="mt-1 text-lg font-bold" style={{ color: c.color }}>{c.value}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between gap-3">
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Gross total here should match your leaderboard repurchase points — from your downline only (you are excluded).
            </p>
            <button type="button" onClick={exportCsv} disabled={exporting}
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold disabled:opacity-50 shrink-0"
              style={{ background: 'rgba(212,175,55,0.12)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.3)' }}>
              <HiOutlineDownload className="size-4" /> {exporting ? 'Exporting…' : 'Export CSV'}
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid rgba(212,175,55,0.12)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr>
                  {['Member', 'Level', 'Events', 'Gross', 'Consumed', 'Net'].map((h) => (
                    <th key={h} className="text-left py-2.5 px-3 text-xs font-semibold" style={{ color: 'rgba(212,175,55,0.7)', borderBottom: '1px solid rgba(212,175,55,0.12)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan="6" className="py-8 text-center text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Loading…</td></tr>
                )}
                {!loading && contributors.map((c, i) => (
                  <tr key={c.uid} style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                    <td className="py-2.5 px-3">
                      <div className="text-white text-xs font-medium">{c.fullname}</div>
                      <div className="text-[11px] font-mono" style={{ color: 'rgba(255,255,255,0.45)' }}>@{c.username}</div>
                    </td>
                    <td className="py-2.5 px-3 text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>L{c.level}</td>
                    <td className="py-2.5 px-3 text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>{fmt(c.events)}</td>
                    <td className="py-2.5 px-3 text-xs font-semibold" style={{ color: '#D4AF37' }}>{fmt(c.gross)}</td>
                    <td className="py-2.5 px-3 text-xs" style={{ color: c.consumed > 0 ? '#fca5a5' : 'rgba(255,255,255,0.4)' }}>{fmt(c.consumed)}</td>
                    <td className="py-2.5 px-3 text-xs font-semibold" style={{ color: '#34d399' }}>{fmt(c.net)}</td>
                  </tr>
                ))}
                {!loading && contributors.length === 0 && (
                  <tr><td colSpan="6" className="py-8 text-center text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>No downline repurchase contributors yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <Pager page={page} totalPages={totalPages}
              onPrev={() => setPage((p) => Math.max(1, p - 1))}
              onNext={() => setPage((p) => Math.min(totalPages, p + 1))} />
          )}
        </div>
      )}
    </div>
  );
}

/* ── Rankable Points Ledger: one row per VALID repurchase event behind your
      remaining points (source member, level, basis points, date). Server-paginated
      from /api/ranking/events so it always reconciles to the remaining total. ── */
function RankableEventsLedger() {
  const [open, setOpen] = useState(true);
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    setLoading(true);
    api.get(`/ranking/events?page=${page}&perPage=25`)
      .then((res) => { if (!cancelled) setData(res.data); })
      .catch(() => { if (!cancelled) setData(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [open, page]);

  const events = data?.events || [];
  const totalPages = Number(data?.totalPages || 1);

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <button type="button" onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
        style={{ borderBottom: open ? '1px solid rgba(212,175,55,0.08)' : 'none' }}>
        <div className="flex items-center gap-2">
          <HiOutlineClipboardList className="size-5" style={{ color: '#D4AF37' }} />
          <div>
            <p className="font-display text-base font-semibold text-white">Rankable Points Ledger</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Every valid repurchase event behind your remaining points
              {data ? ` · ${fmt(data.total)} events · ${fmt(data.totalPoints)} pts` : ''}
            </p>
          </div>
        </div>
        <HiOutlineChevronDown className="size-5 transition-transform" style={{ color: 'rgba(212,175,55,0.7)', transform: open ? 'rotate(180deg)' : 'none' }} />
      </button>

      {open && (
        <div className="p-5 space-y-4">
          <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid rgba(212,175,55,0.12)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr>
                  {['Date', 'Source member', 'Level', 'Basis points'].map((h) => (
                    <th key={h} className="text-left py-2.5 px-3 text-xs font-semibold" style={{ color: 'rgba(212,175,55,0.7)', borderBottom: '1px solid rgba(212,175,55,0.12)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan="4" className="py-8 text-center text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Loading…</td></tr>
                )}
                {!loading && events.map((e, i) => (
                  <tr key={`${e.repurchaseId}-${i}`} style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                    <td className="py-2.5 px-3 text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>{e.eventTs ? String(e.eventTs).slice(0, 10) : '—'}</td>
                    <td className="py-2.5 px-3">
                      <div className="text-white text-xs font-medium">{e.sourceName}</div>
                      <div className="text-[11px] font-mono" style={{ color: 'rgba(255,255,255,0.45)' }}>@{e.sourceUsername || e.sourceUid}</div>
                    </td>
                    <td className="py-2.5 px-3 text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>L{e.depth}</td>
                    <td className="py-2.5 px-3 text-xs font-semibold" style={{ color: '#D4AF37' }}>{fmt(e.points)}</td>
                  </tr>
                ))}
                {!loading && events.length === 0 && (
                  <tr><td colSpan="4" className="py-8 text-center text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>No rankable repurchase events yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <Pager page={page} totalPages={totalPages}
              onPrev={() => setPage((p) => Math.max(1, p - 1))}
              onNext={() => setPage((p) => Math.min(totalPages, p + 1))} />
          )}
        </div>
      )}
    </div>
  );
}
