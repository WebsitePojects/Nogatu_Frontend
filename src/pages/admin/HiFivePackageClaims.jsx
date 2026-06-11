import { useEffect, useState } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';
import { PaginationButton } from '../../components/PaginationButton';

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
  const [actionModal, setActionModal] = useState({ open: false, mode: 'approve', claim: null, notes: '' });

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

  function openActionModal(mode, claim) {
    setActionModal({
      open: true,
      mode,
      claim,
      notes: claim?.adminNotes || detail?.claim?.adminNotes || '',
    });
  }

  function closeActionModal() {
    setActionModal({ open: false, mode: 'approve', claim: null, notes: '' });
  }

  async function handleApprove(claim, adminNotes = '') {
    setBusyId(claim.qualificationUid);
    try {
      await api.put(`/admin/hifive/package-claims/${claim.qualificationUid}/approve`, { adminNotes });
      toast.success('Package claim approved and paid.');
      await loadData();
      if (detail?.claim?.qualificationUid === claim.qualificationUid) {
        await openDetails(claim);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to approve package claim.');
    } finally {
      setBusyId('');
    }
  }

  async function handleReject(claim, adminNotes = '') {
    setBusyId(claim.qualificationUid);
    try {
      await api.put(`/admin/hifive/package-claims/${claim.qualificationUid}/reject`, { adminNotes });
      toast.success('Package claim rejected.');
      await loadData();
      if (detail?.claim?.qualificationUid === claim.qualificationUid) {
        await openDetails(claim);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to reject package claim.');
    } finally {
      setBusyId('');
    }
  }

  async function confirmActionModal() {
    if (!actionModal.claim) return;
    const payload = actionModal;
    closeActionModal();
    if (payload.mode === 'approve') {
      await handleApprove(payload.claim, payload.notes);
      return;
    }
    await handleReject(payload.claim, payload.notes);
  }

  return (
    <div>
      <div className="mb-7">
        <h1 className="font-display text-2xl font-bold text-white">Hi-Five Package Claims</h1>
        <div className="w-12 h-0.5 mt-2" style={{ background: 'linear-gradient(90deg,#D4AF37,transparent)' }} />
      </div>

      <div className="glass-card rounded-2xl p-4 sm:p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="label">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="glass-input w-full rounded-xl px-4 py-2.5 text-sm mt-1.5"
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
              className="glass-input w-full rounded-xl px-4 py-2.5 text-sm mt-1.5"
            />
          </div>
          <div>
            <label className="label">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="glass-input w-full rounded-xl px-4 py-2.5 text-sm mt-1.5"
            />
          </div>
          <div>
            <label className="label">Package</label>
            <select
              value={packageFilter}
              onChange={(e) => setPackageFilter(e.target.value)}
              className="glass-input w-full rounded-xl px-4 py-2.5 text-sm mt-1.5"
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
        </div>
        <div className="flex flex-wrap gap-2.5 mt-4 pt-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.12)' }}>
          <button
            onClick={() => { setPage(1); loadData(); }}
            className="gold-btn rounded-xl py-2.5 px-5 text-sm flex-1 sm:flex-initial text-center justify-center items-center"
           type="button">
            Filter
          </button>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-4 sm:p-6 overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>Package Claim Queue</p>
          <div className="flex items-center gap-2 justify-end w-full sm:w-auto">
            <PaginationButton onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} style={{ background: 'rgba(212,175,55,0.08)', color: 'rgba(212,175,55,0.8)', border: '1px solid rgba(212,175,55,0.15)' }}>Prev</PaginationButton>
            <span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{page} / {totalPages}</span>
            <PaginationButton onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} style={{ background: 'rgba(212,175,55,0.08)', color: 'rgba(212,175,55,0.8)', border: '1px solid rgba(212,175,55,0.15)' }}>Next</PaginationButton>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <div
              className="animate-spin rounded-full size-8 border-4"
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
                              onClick={(event) => { event.stopPropagation(); openActionModal('approve', claim); }}
                              disabled={isBusy}
                              className="text-xs px-2.5 py-1 rounded-lg font-medium cursor-pointer motion-safe:transition-colors disabled:opacity-40"
                              style={{ background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)' }}
                             type="button">
                              Approve
                            </button>
                            <button
                              onClick={(event) => { event.stopPropagation(); openActionModal('reject', claim); }}
                              disabled={isBusy}
                              className="text-xs px-2.5 py-1 rounded-lg font-medium cursor-pointer motion-safe:transition-colors disabled:opacity-40"
                              style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}
                             type="button">
                              Reject
                            </button>
                            <button
                              onClick={(event) => { event.stopPropagation(); openDetails(claim); }}
                              className="text-xs px-2.5 py-1 rounded-lg font-medium cursor-pointer motion-safe:transition-colors"
                              style={{ background: 'rgba(59,130,246,0.12)', color: '#93c5fd', border: '1px solid rgba(59,130,246,0.2)' }}
                             type="button">
                              View Details
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={(event) => { event.stopPropagation(); openDetails(claim); }}
                            className="text-xs px-2.5 py-1 rounded-lg font-medium cursor-pointer motion-safe:transition-colors"
                            style={{ background: 'rgba(59,130,246,0.12)', color: '#93c5fd', border: '1px solid rgba(59,130,246,0.2)' }}
                           type="button">
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
                  <div className="animate-spin rounded-full size-8 border-4" style={{ borderColor: 'rgba(212,175,55,0.15)', borderTopColor: 'rgba(212,175,55,0.75)' }} />
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

                  {detail.claim?.status === 'pending_review' ? (
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => openActionModal('approve', detail.claim)}
                        disabled={busyId === detail.claim?.qualificationUid}
                        className="rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-40"
                        style={{ background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)' }}
                      >
                        Approve Claim
                      </button>
                      <button
                        type="button"
                        onClick={() => openActionModal('reject', detail.claim)}
                        disabled={busyId === detail.claim?.qualificationUid}
                        className="rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-40"
                        style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}
                      >
                        Reject Claim
                      </button>
                    </div>
                  ) : null}

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[1100px]">
                      <thead>
                        <tr>
                          {['#', 'Contributor', 'Username', 'Joined', 'Activation Code', 'Referral Token', 'Placement', 'Process Key'].map((heading) => (
                            <th key={heading} className="table-header p-3 text-left text-xs uppercase tracking-wide">{heading}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(detail.contributors || []).map((row) => (
                          <tr key={`${row.uid}-${row.orderNo}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                            <td className="p-3 text-white/55">{row.orderNo}</td>
                            <td className="p-3 text-white">{row.fullName}</td>
                            <td className="p-3 text-white/70">{row.username}</td>
                            <td className="p-3 text-white/55">{row.joinedAt ? new Date(row.joinedAt).toLocaleString() : '—'}</td>
                            <td className="p-3 text-white/70">{row.registrationAudit?.activationCode || row.codeUsage?.code || '—'}</td>
                            <td className="p-3 text-white/55">{row.registrationAudit?.referralSlug || row.codeUsage?.referralToken || '—'}</td>
                            <td className="p-3 text-white/55">
                              {row.registrationAudit?.requestedPosition ? `Requested ${row.registrationAudit.requestedPosition}` : '—'}
                              {row.registrationAudit?.enforcedPosition ? ` / Enforced ${row.registrationAudit.enforcedPosition}` : ' / Auto placement'}
                            </td>
                            <td className="p-3 text-[11px] text-white/40">{row.codeUsage?.processKey || '—'}</td>
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

      {actionModal.open ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4" onMouseDown={closeActionModal}>
          <div
            className="portal-modal-panel w-full max-w-xl rounded-3xl p-6 shadow-[0_28px_64px_rgba(15,23,42,0.22)] dark:shadow-[0_30px_70px_rgba(0,0,0,0.45)]"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="portal-modal-title font-display text-xl">
                  {actionModal.mode === 'approve' ? 'Approve Hi-Five Claim' : 'Reject Hi-Five Claim'}
                </h2>
                <p className="portal-modal-text mt-2 text-sm leading-6">
                  {actionModal.mode === 'approve'
                    ? 'Please confirm you want to approve this Hi-Five package claim and release the payout.'
                    : 'Please confirm you want to reject this Hi-Five package claim. You can leave an admin note for the audit trail.'}
                </p>
              </div>
              <button onClick={closeActionModal} className="portal-modal-muted hover:opacity-80 text-sm font-medium" type="button">Close</button>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl p-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <p className="portal-modal-muted text-xs uppercase tracking-wide mb-1">Member</p>
                <p className="portal-modal-title">{actionModal.claim?.fullname || detail?.claim?.fullname || '-'}</p>
              </div>
              <div className="rounded-2xl p-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <p className="portal-modal-muted text-xs uppercase tracking-wide mb-1">Package / Payout</p>
                <p className="portal-modal-title">{actionModal.claim?.packageName || detail?.claim?.packageName || '-'} / PHP {Number(actionModal.claim?.totalPayout || detail?.claim?.totalPayout || 0).toLocaleString()}</p>
              </div>
            </div>

            <div className="mt-4">
              <label className="portal-modal-muted block text-xs font-medium mb-1.5">Admin Note</label>
              <textarea
                value={actionModal.notes}
                onChange={(event) => setActionModal((current) => ({ ...current, notes: event.target.value }))}
                rows={4}
                placeholder={actionModal.mode === 'approve' ? 'Optional note for approval' : 'Reason or note for rejection'}
                className="w-full px-3 py-2 rounded-2xl text-sm portal-modal-title outline-none resize-none bg-[var(--portal-soft-bg)] border border-[var(--portal-soft-border)] placeholder:text-[color:var(--portal-modal-muted)]"
              />
            </div>

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={closeActionModal}
                className="portal-muted-button rounded-xl px-4 py-2.5 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmActionModal}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold"
                style={actionModal.mode === 'approve'
                  ? { background: 'linear-gradient(135deg, #0f766e, #10b981)', color: '#f0fdf4', border: '1px solid rgba(16,185,129,0.35)' }
                  : { background: 'linear-gradient(135deg, #b91c1c, #ef4444)', color: '#fff5f5', border: '1px solid rgba(248,113,113,0.45)' }}
              >
                {actionModal.mode === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
