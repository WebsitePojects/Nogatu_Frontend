import { useEffect, useState } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'pending_review', label: 'Pending Review' },
  { value: 'paid', label: 'Paid' },
  { value: 'forfeited', label: 'Rejected' },
];

export default function HiFivePackageClaims() {
  const [records, setRecords] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('pending_review');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [busyId, setBusyId] = useState('');
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState(null);
  const [packageFilter, setPackageFilter] = useState('');

  useEffect(() => {
    loadData();
  }, [page]);

  async function loadData() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (status) params.set('status', status);
      if (packageFilter) params.set('packageKey', packageFilter);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      const res = await api.get(`/admin/hifive/package-claims?${params.toString()}`);
      setRecords(res.data.records || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to load package claims.');
    } finally {
      setLoading(false);
    }
  }

  async function openDetails(claim) {
    setDetailLoading(true);
    try {
      const res = await api.get(`/admin/hifive/package-claims/${claim.qualificationUid}`);
      setDetail(res.data);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to load claim details.');
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleApprove(claim) {
    const adminNotes = window.prompt('Optional admin note for approval:', claim.adminNotes || '') ?? '';
    setBusyId(claim.qualificationUid);
    try {
      await api.put(`/admin/hifive/package-claims/${claim.qualificationUid}/approve`, { adminNotes });
      toast.success('Package claim approved and paid.');
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to approve package claim.');
    } finally {
      setBusyId('');
    }
  }

  async function handleReject(claim) {
    const adminNotes = window.prompt('Rejection reason / admin note:', claim.adminNotes || '');
    if (adminNotes === null) return;

    setBusyId(claim.qualificationUid);
    try {
      await api.put(`/admin/hifive/package-claims/${claim.qualificationUid}/reject`, { adminNotes });
      toast.success('Package claim rejected.');
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to reject package claim.');
    } finally {
      setBusyId('');
    }
  }

  const PaginationBtn = ({ onClick, disabled, children }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className="text-sm py-1.5 px-3 rounded-lg font-medium motion-safe:transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
      style={{
        background: 'rgba(212,175,55,0.08)',
        color: 'rgba(212,175,55,0.8)',
        border: '1px solid rgba(212,175,55,0.15)',
      }}
    >
      {children}
    </button>
  );

  return (
    <div>
      <div className="mb-7">
        <h1 className="font-display text-2xl font-bold text-white">Hi-Five Package Claims</h1>
        <div className="w-12 h-0.5 mt-2" style={{ background: 'linear-gradient(90deg,#D4AF37,transparent)' }} />
      </div>

      <div className="glass-card rounded-2xl p-6 mb-6">
        <div className="flex flex-col xl:flex-row gap-3 items-end">
          <div>
            <label className="label">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="glass-input rounded-xl px-4 py-2.5 text-sm mt-1.5"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="glass-input rounded-xl px-4 py-2.5 text-sm mt-1.5"
            />
          </div>
          <div>
            <label className="label">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="glass-input rounded-xl px-4 py-2.5 text-sm mt-1.5"
            />
          </div>
          <div>
            <label className="label">Package</label>
            <select
              value={packageFilter}
              onChange={(e) => setPackageFilter(e.target.value)}
              className="glass-input rounded-xl px-4 py-2.5 text-sm mt-1.5"
            >
              <option value="">All Packages</option>
              <option value="bronze">Bronze</option>
              <option value="silver">Silver</option>
              <option value="gold">Gold</option>
              <option value="platinum">Platinum</option>
              <option value="garnet">Garnet</option>
              <option value="diamond">Diamond</option>
            </select>
          </div>
          <button
            onClick={() => { setPage(1); loadData(); }}
            className="gold-btn rounded-xl py-2.5 px-5 text-sm"
          >
            Filter
          </button>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6 overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>Package Claim Queue</p>
          <div className="flex items-center gap-2 ml-auto">
            <PaginationBtn onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>Prev</PaginationBtn>
            <span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{page} / {totalPages}</span>
            <PaginationBtn onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Next</PaginationBtn>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <div
              className="animate-spin rounded-full h-8 w-8 border-4"
              style={{ borderColor: 'rgba(212,175,55,0.15)', borderTopColor: 'rgba(212,175,55,0.75)' }}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  {['Member', 'Username', 'Package', 'Qty', 'Per Claim', 'Total', 'Status', 'Submitted', 'Notes', 'Action'].map((h) => (
                    <th key={h} className="table-header py-3 px-4 text-left font-semibold text-xs uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.map((claim, idx) => {
                  const isBusy = busyId === claim.qualificationUid;
                  const isPending = claim.status === 'pending_review';
                  return (
                    <tr
                      key={claim.qualificationUid}
                      className="motion-safe:transition-colors"
                      style={{ background: idx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}
                      onClick={() => openDetails(claim)}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(212,175,55,0.05)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = idx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent'; }}
                    >
                      <td className="py-3 px-4 font-medium text-white/80">{claim.fullname}</td>
                      <td className="py-3 px-4 text-white/60">{claim.username}</td>
                      <td className="py-3 px-4 text-white/60">{claim.packageName}</td>
                      <td className="py-3 px-4 text-white/60">{claim.qualifyingCount}</td>
                      <td className="py-3 px-4 text-white/60">{claim.rewardAmount.toLocaleString()}</td>
                      <td className="py-3 px-4 font-semibold" style={{ color: '#D4AF37' }}>{claim.totalPayout.toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <span
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
                          style={
                            claim.status === 'paid'
                              ? { background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.22)' }
                              : claim.status === 'forfeited'
                                ? { background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.22)' }
                                : { background: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.22)' }
                          }
                        >
                          {claim.statusLabel}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-white/40">{new Date(claim.createdAt).toLocaleString()}</td>
                      <td className="py-3 px-4 text-xs text-white/50 max-w-[240px]">{claim.adminNotes || 'No admin note yet.'}</td>
                      <td className="py-3 px-4">
                        {isPending ? (
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={(event) => { event.stopPropagation(); handleApprove(claim); }}
                              disabled={isBusy}
                              className="text-xs px-2.5 py-1 rounded-lg font-medium cursor-pointer motion-safe:transition-colors disabled:opacity-40"
                              style={{ background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)' }}
                            >
                              Approve
                            </button>
                            <button
                              onClick={(event) => { event.stopPropagation(); handleReject(claim); }}
                              disabled={isBusy}
                              className="text-xs px-2.5 py-1 rounded-lg font-medium cursor-pointer motion-safe:transition-colors disabled:opacity-40"
                              style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}
                            >
                              Reject
                            </button>
                            <button
                              onClick={(event) => { event.stopPropagation(); openDetails(claim); }}
                              className="text-xs px-2.5 py-1 rounded-lg font-medium cursor-pointer motion-safe:transition-colors"
                              style={{ background: 'rgba(59,130,246,0.12)', color: '#93c5fd', border: '1px solid rgba(59,130,246,0.2)' }}
                            >
                              View Details
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={(event) => { event.stopPropagation(); openDetails(claim); }}
                            className="text-xs px-2.5 py-1 rounded-lg font-medium cursor-pointer motion-safe:transition-colors"
                            style={{ background: 'rgba(59,130,246,0.12)', color: '#93c5fd', border: '1px solid rgba(59,130,246,0.2)' }}
                          >
                            View Details
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {records.length === 0 && (
                  <tr>
                    <td colSpan="10" className="py-12 text-center" style={{ color: 'rgba(255,255,255,0.25)' }}>
                      No package claims found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {detail || detailLoading ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onMouseDown={() => { if (!detailLoading) setDetail(null); }}>
          <div
            className="glass-card rounded-2xl w-full max-w-5xl max-h-[88vh] overflow-hidden"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(212,175,55,0.08)' }}>
              <div>
                <h2 className="font-display text-xl font-semibold text-white">Hi-Five Claim Details</h2>
                <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  Contributor audit, registration logs, and activation-code usage for verification.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDetail(null)}
                className="rounded-lg px-3 py-1.5 text-sm"
                style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.72)', border: '1px solid rgba(255,255,255,0.12)' }}
              >
                Close
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(88vh-5rem)]">
              {detailLoading || !detail ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-4" style={{ borderColor: 'rgba(212,175,55,0.15)', borderTopColor: 'rgba(212,175,55,0.75)' }} />
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
                      <p className="text-xs text-white/45">Member</p>
                      <p className="text-white font-semibold mt-1">{detail.claim.fullname}</p>
                    </div>
                    <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
                      <p className="text-xs text-white/45">Package</p>
                      <p className="text-white font-semibold mt-1">{detail.claim.packageName}</p>
                    </div>
                    <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
                      <p className="text-xs text-white/45">Status</p>
                      <p className="text-white font-semibold mt-1">{detail.summary.currentStatusLabel}</p>
                    </div>
                    <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
                      <p className="text-xs text-white/45">Total Payout</p>
                      <p className="font-semibold mt-1" style={{ color: '#D4AF37' }}>₱{Number(detail.summary.totalPayout || 0).toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[1100px]">
                      <thead>
                        <tr>
                          {['#', 'Contributor', 'Username', 'Joined', 'Activation Code', 'Referral Token', 'Placement', 'Process Key'].map((heading) => (
                            <th key={heading} className="table-header py-3 px-3 text-left text-xs uppercase tracking-wide">{heading}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(detail.contributors || []).map((row) => (
                          <tr key={`${row.uid}-${row.orderNo}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                            <td className="py-3 px-3 text-white/55">{row.orderNo}</td>
                            <td className="py-3 px-3 text-white">{row.fullName}</td>
                            <td className="py-3 px-3 text-white/70">{row.username}</td>
                            <td className="py-3 px-3 text-white/55">{row.joinedAt ? new Date(row.joinedAt).toLocaleString() : '—'}</td>
                            <td className="py-3 px-3 text-white/70">{row.registrationAudit?.activationCode || row.codeUsage?.code || '—'}</td>
                            <td className="py-3 px-3 text-white/55">{row.registrationAudit?.referralSlug || row.codeUsage?.referralToken || '—'}</td>
                            <td className="py-3 px-3 text-white/55">
                              {row.registrationAudit?.requestedPosition ? `Requested ${row.registrationAudit.requestedPosition}` : '—'}
                              {row.registrationAudit?.enforcedPosition ? ` / Enforced ${row.registrationAudit.enforcedPosition}` : ''}
                            </td>
                            <td className="py-3 px-3 text-[11px] text-white/40">{row.codeUsage?.processKey || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
