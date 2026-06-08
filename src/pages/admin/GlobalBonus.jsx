import { useEffect, useState } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';

const fmtMoney = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtInt = (n) => Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 0 });

function lastClosedYear() {
  return new Date().getFullYear() - 1;
}

function getBadgeStyle(state) {
  if (state === 'frozen') {
    return {
      background: 'rgba(96,165,250,0.12)',
      color: '#93c5fd',
      border: '1px solid rgba(96,165,250,0.25)',
    };
  }

  if (state === 'removed') {
    return {
      background: 'rgba(248,113,113,0.12)',
      color: '#fca5a5',
      border: '1px solid rgba(248,113,113,0.22)',
    };
  }

  return {
    background: 'rgba(212,175,55,0.12)',
    color: '#f5d97b',
    border: '1px solid rgba(212,175,55,0.22)',
  };
}

function getActionLabel(member) {
  if (member.adminState === 'frozen' || member.adminState === 'removed') {
    return 'Restore';
  }
  return 'Freeze';
}

export default function GlobalBonus() {
  const [year, setYear] = useState(lastClosedYear());
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionUid, setActionUid] = useState(null);
  const [data, setData] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [manualPortions, setManualPortions] = useState(1);
  const [manualMemberType, setManualMemberType] = useState('Manual Include');

  useEffect(() => {
    loadReport(year, page);
  }, [page]);

  async function loadReport(targetYear = year, targetPage = page) {
    setLoading(true);
    try {
      const res = await api.get(`/admin/global-bonus?year=${targetYear}&page=${targetPage}`);
      setData(res.data);
    } catch (error) {
      setData(null);
      toast.error(error.response?.data?.error || 'Failed to load annual global bonus');
    } finally {
      setLoading(false);
    }
  }

  function resetSelection() {
    setSelectedMember(null);
    setManualPortions(1);
    setManualMemberType('Manual Include');
  }

  async function loadLatest() {
    try {
      const res = await api.get('/admin/global-bonus/latest');
      if (!res.data?.latest) {
        toast('No annual global bonus has been distributed yet');
        return;
      }
      const latest = res.data.latest;
      setYear(latest.year);
      setPage(1);
      await loadReport(latest.year, 1);
      toast.success('Loaded latest distributed annual global bonus');
    } catch {
      toast.error('Failed to load latest annual distribution');
    }
  }

  async function distribute() {
    setProcessing(true);
    try {
      const res = await api.post('/admin/global-bonus/distribute', { year });
      toast.success(res.data?.message || 'Annual distribution completed');
      await loadReport(year, page);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Annual distribution failed');
    } finally {
      setProcessing(false);
    }
  }

  async function searchMembers() {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      toast('Enter a username or member name first');
      return;
    }

    setSearching(true);
    try {
      const res = await api.get(`/admin/global-bonus/search?year=${year}&q=${encodeURIComponent(trimmed)}`);
      setSearchResults(res.data?.members || []);
      if (!res.data?.members?.length) {
        toast('No matching members found');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to search members');
    } finally {
      setSearching(false);
    }
  }

  function pickMember(member) {
    setSelectedMember(member);
    setManualPortions(Math.max(1, Number(member.suggestedPortions || 1)));
    setManualMemberType(member.suggestedMemberType || 'Manual Include');
  }

  async function addMember() {
    if (!selectedMember?.uid) {
      toast('Select a member first');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        year,
        uid: selectedMember.uid,
        portions: manualPortions,
        memberType: manualMemberType,
      };
      const res = await api.post('/admin/global-bonus/members/add', payload);
      toast.success(res.data?.message || 'Member added to global bonus');
      await loadReport(year, page);
      await searchMembers();
      resetSelection();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to add member');
    } finally {
      setSaving(false);
    }
  }

  async function updateMemberState(uid, action) {
    setActionUid(uid);
    try {
      const res = await api.post(`/admin/global-bonus/members/${uid}/${action}`, { year });
      toast.success(res.data?.message || 'Global bonus member updated');
      await loadReport(year, page);
      if (searchQuery.trim()) {
        await searchMembers();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update member');
    } finally {
      setActionUid(null);
    }
  }

  const pool = data?.pool;
  const preview = data?.preview;
  const distributedRecipients = data?.distributedRecipients || [];
  const managementRecipients = data?.managementRecipients || [];
  const totalPages = Math.max(1, Number(data?.totalPages || 1));
  const canDistribute = year < new Date().getFullYear();
  const blockedReason = !canDistribute ? 'Only fully completed years can be distributed.' : (preview?.blockedReason || '');

  return (
    <div>
      <div className="mb-7">
        <h1 className="font-display text-2xl font-bold text-white">Global Bonus</h1>
        <div className="w-12 h-0.5 mt-2" style={{ background: 'linear-gradient(90deg,#D4AF37,transparent)' }} />
      </div>

      <div className="glass-card rounded-2xl p-6 mb-6">
        <div className="flex flex-col xl:flex-row xl:items-end gap-3">
          <div className="xl:min-w-[280px]">
            <label className="label">Completed Year</label>
            <input
              type="number"
              min="2000"
              value={year}
              onChange={(event) => setYear(Number(event.target.value || lastClosedYear()))}
              className="glass-input rounded-xl px-4 py-2.5 text-sm mt-1.5 w-[160px]"
            />
            <p className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Annual pool uses the prior fully completed year and supports manual member controls before distribution.
            </p>
          </div>
          <button onClick={() => { setPage(1); loadReport(year, 1); }} className="gold-btn rounded-xl py-2.5 px-5 text-sm" type="button">
            Load Annual Report
          </button>
          <button
            onClick={loadLatest}
            className="rounded-xl py-2.5 px-5 text-sm font-medium border"
            style={{ borderColor: 'rgba(59,130,246,0.35)', color: '#93c5fd', background: 'rgba(59,130,246,0.1)' }}
            type="button"
          >
            Latest Distributed
          </button>
          <button
            onClick={distribute}
            disabled={processing || !canDistribute}
            className="btn-success rounded-xl py-2.5 px-5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            type="button"
          >
            {processing ? 'Distributing...' : 'Distribute Annual Pool'}
          </button>
        </div>

        {blockedReason && (
          <div className="mt-4 rounded-xl px-4 py-3 text-sm" style={{ background: 'rgba(245,158,11,0.10)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.2)' }}>
            {blockedReason}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <div className="glass-card rounded-2xl p-5">
          <p className="text-xs uppercase" style={{ color: 'rgba(212,175,55,0.5)' }}>Annual Net Sales</p>
          <p className="text-2xl font-bold text-white mt-1">P{fmtMoney(pool?.totalNetSales ?? preview?.totalNetSales)}</p>
        </div>
        <div className="glass-card rounded-2xl p-5">
          <p className="text-xs uppercase" style={{ color: 'rgba(212,175,55,0.5)' }}>Bonus Pool (2%)</p>
          <p className="text-2xl font-bold text-white mt-1">P{fmtMoney(pool?.bonusPool ?? preview?.bonusPool)}</p>
        </div>
        <div className="glass-card rounded-2xl p-5">
          <p className="text-xs uppercase" style={{ color: 'rgba(212,175,55,0.5)' }}>Total Portions</p>
          <p className="text-2xl font-bold text-white mt-1">{fmtInt(pool?.totalPortions ?? preview?.totalPortions)}</p>
        </div>
        <div className="glass-card rounded-2xl p-5">
          <p className="text-xs uppercase" style={{ color: 'rgba(212,175,55,0.5)' }}>Per Portion Value</p>
          <p className="text-2xl font-bold text-white mt-1">P{fmtMoney(pool?.perPortionValue ?? preview?.perPortionValue)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.05fr_1.45fr] gap-6 mb-6">
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Recipient Controls</h2>
              <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.52)' }}>
                Search a member, set manual portions, and add them into the annual pool roster.
              </p>
            </div>
            <div className="px-3 py-1 rounded-full text-xs font-semibold" style={{ background: 'rgba(212,175,55,0.12)', color: '#f5d97b', border: '1px solid rgba(212,175,55,0.2)' }}>
              Year {year}
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-3">
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search username or full name"
              className="glass-input rounded-xl px-4 py-3 text-sm flex-1"
            />
            <button
              onClick={searchMembers}
              disabled={searching}
              className="gold-btn rounded-xl px-5 py-3 text-sm disabled:opacity-50"
              type="button"
            >
              {searching ? 'Searching...' : 'Search Members'}
            </button>
          </div>

          <div className="mt-4 space-y-2 max-h-[280px] overflow-y-auto pr-1">
            {searchResults.map((member) => {
              const selected = selectedMember?.uid === member.uid;
              const badgeStyle = member.overrideStatus
                ? getBadgeStyle(member.overrideStatus === 3 ? 'frozen' : member.overrideStatus === 2 ? 'removed' : 'active')
                : null;

              return (
                <button
                  key={member.uid}
                  onClick={() => pickMember(member)}
                  className="w-full rounded-xl p-4 text-left transition border"
                  style={{
                    background: selected ? 'rgba(212,175,55,0.12)' : 'rgba(255,255,255,0.03)',
                    borderColor: selected ? 'rgba(212,175,55,0.35)' : 'rgba(255,255,255,0.08)',
                  }}
                  type="button"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">{member.fullname || `UID ${member.uid}`}</p>
                      <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.56)' }}>@{member.username}</p>
                      <p className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.45)' }}>
                        Suggested: {member.suggestedMemberType || 'Manual Include'} • {fmtInt(member.suggestedPortions)} portion(s)
                      </p>
                    </div>
                    {badgeStyle && (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase" style={badgeStyle}>
                        {member.overrideStatus === 3 ? 'Frozen' : member.overrideStatus === 2 ? 'Removed' : 'Active'}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}

            {!searching && searchResults.length === 0 && (
              <div className="rounded-xl px-4 py-5 text-sm" style={{ background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.42)' }}>
                Search results will appear here.
              </div>
            )}
          </div>

          <div className="mt-5 rounded-2xl p-4 border" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(212,175,55,0.12)' }}>
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <p className="text-sm font-semibold text-white">Manual Add</p>
                <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.48)' }}>
                  Selected member: {selectedMember ? `${selectedMember.fullname || selectedMember.username} (@${selectedMember.username})` : 'None'}
                </p>
              </div>
              {selectedMember?.isQualified && (
                <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase" style={getBadgeStyle('active')}>
                  Already Qualified
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="label">Manual Portions</label>
                <input
                  type="number"
                  min="1"
                  value={manualPortions}
                  onChange={(event) => setManualPortions(Math.max(1, Number(event.target.value || 1)))}
                  className="glass-input rounded-xl px-4 py-2.5 text-sm mt-1.5 w-full"
                />
              </div>
              <div>
                <label className="label">Member Type Label</label>
                <input
                  value={manualMemberType}
                  onChange={(event) => setManualMemberType(event.target.value)}
                  className="glass-input rounded-xl px-4 py-2.5 text-sm mt-1.5 w-full"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mt-4">
              <button
                onClick={addMember}
                disabled={saving || !selectedMember}
                className="gold-btn rounded-xl px-5 py-2.5 text-sm disabled:opacity-50"
                type="button"
              >
                {saving ? 'Saving...' : 'Add / Reactivate Member'}
              </button>
              <button
                onClick={resetSelection}
                className="rounded-xl px-5 py-2.5 text-sm font-medium border"
                style={{ borderColor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.04)' }}
                type="button"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 overflow-hidden">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Managed Roster</h2>
              <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.52)' }}>
                Active, frozen, and removed members for this annual pool setup.
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase" style={{ color: 'rgba(212,175,55,0.55)' }}>Preview Recipients</p>
              <p className="text-xl font-semibold text-white">{fmtInt(preview?.recipientCount)}</p>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full size-8 border-4" style={{ borderColor: 'rgba(212,175,55,0.15)', borderTopColor: 'rgba(212,175,55,0.75)' }} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    {['Member', 'Status', 'Type', 'Portions', 'Projected Share', 'Actions'].map((header) => (
                      <th key={header} className="table-header p-3 text-left text-xs uppercase tracking-wide">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {managementRecipients.map((member, index) => {
                    const isBusy = actionUid === member.uid;
                    const action = member.adminState === 'active' ? 'freeze' : 'unfreeze';

                    return (
                      <tr
                        key={`${member.uid}-${member.adminState}-${index}`}
                        style={{ background: index % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}
                        className="motion-safe:transition-colors hover:bg-white/[0.04]"
                      >
                        <td className="p-3">
                          <p className="font-medium text-white/90">{member.fullname || `UID ${member.uid}`}</p>
                          <p className="text-xs mt-1 text-white/50">@{member.username || '-'}</p>
                        </td>
                        <td className="p-3">
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase" style={getBadgeStyle(member.adminState)}>
                            {member.adminState}
                          </span>
                        </td>
                        <td className="p-3 text-white/70">{member.memberType || 'Qualified'}</td>
                        <td className="p-3 text-white/70">{fmtInt(member.portions)}</td>
                        <td className="p-3 font-semibold" style={{ color: '#D4AF37' }}>P{fmtMoney(member.shareAmount)}</td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => updateMemberState(member.uid, action)}
                              disabled={isBusy}
                              className="rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
                              style={{
                                background: member.adminState === 'active' ? 'rgba(59,130,246,0.12)' : 'rgba(16,185,129,0.12)',
                                color: member.adminState === 'active' ? '#93c5fd' : '#86efac',
                                border: `1px solid ${member.adminState === 'active' ? 'rgba(59,130,246,0.22)' : 'rgba(16,185,129,0.22)'}`,
                              }}
                              type="button"
                            >
                              {isBusy ? 'Working...' : getActionLabel(member)}
                            </button>
                            <button
                              onClick={() => updateMemberState(member.uid, 'remove')}
                              disabled={isBusy || member.adminState === 'removed'}
                              className="rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
                              style={{ background: 'rgba(248,113,113,0.12)', color: '#fca5a5', border: '1px solid rgba(248,113,113,0.2)' }}
                              type="button"
                            >
                              Remove
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {managementRecipients.length === 0 && (
                    <tr>
                      <td colSpan="6" className="py-12 text-center" style={{ color: 'rgba(255,255,255,0.25)' }}>
                        No managed global bonus recipients for this year yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6 overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Distributed recipients for Year {year}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              disabled={page <= 1}
              className="text-sm py-1.5 px-3 rounded-lg font-medium disabled:opacity-40"
              style={{ background: 'rgba(212,175,55,0.08)', color: 'rgba(212,175,55,0.85)', border: '1px solid rgba(212,175,55,0.15)' }}
              type="button"
            >
              Prev
            </button>
            <span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{page} / {totalPages}</span>
            <button
              onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
              disabled={page >= totalPages}
              className="text-sm py-1.5 px-3 rounded-lg font-medium disabled:opacity-40"
              style={{ background: 'rgba(212,175,55,0.08)', color: 'rgba(212,175,55,0.85)', border: '1px solid rgba(212,175,55,0.15)' }}
              type="button"
            >
              Next
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full size-8 border-4" style={{ borderColor: 'rgba(212,175,55,0.15)', borderTopColor: 'rgba(212,175,55,0.75)' }} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  {['Member', 'Username', 'Member Type', 'Portions', 'Share Amount', 'Distributed Date'].map((header) => (
                    <th key={header} className="table-header p-3 text-left text-xs uppercase tracking-wide">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {distributedRecipients.map((recipient, index) => (
                  <tr
                    key={`${recipient.uid}-${index}`}
                    style={{ background: index % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}
                    className="motion-safe:transition-colors hover:bg-white/[0.04]"
                  >
                    <td className="p-3 font-medium text-white/85">{recipient.fullname || `UID ${recipient.uid}`}</td>
                    <td className="p-3 text-white/60">{recipient.username || '-'}</td>
                    <td className="p-3 text-white/70">{recipient.memberType || 'Qualified'}</td>
                    <td className="p-3 text-white/70">{fmtInt(recipient.portions)}</td>
                    <td className="p-3 font-semibold" style={{ color: '#D4AF37' }}>P{fmtMoney(recipient.shareAmount)}</td>
                    <td className="p-3 text-xs text-white/45">{recipient.distributedDate || '-'}</td>
                  </tr>
                ))}

                {distributedRecipients.length === 0 && (
                  <tr>
                    <td colSpan="6" className="py-12 text-center" style={{ color: 'rgba(255,255,255,0.25)' }}>
                      No distributed annual records for this year yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
