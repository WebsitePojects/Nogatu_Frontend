import { useState, useSyncExternalStore } from 'react';
import toast from 'react-hot-toast';
import { HiOutlineBan, HiOutlineX } from 'react-icons/hi';
import {
  getCodeRequests,
  approveCodeRequest,
  rejectCodeRequest,
  subscribeToTransactionUpdates,
} from '../../data/cashieringData';

function NetworkTreeBadge({ sameTree }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${
        sameTree
          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/[0.22]'
          : 'bg-red-100 text-red-800 border border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/25'
      }`}
    >
      {sameTree ? 'Same tree' : 'Different tree'}
    </span>
  );
}

const STATUS_STYLES = {
  pending: 'bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/25',
  approved: 'bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/[0.22]',
  rejected: 'bg-red-100 text-red-800 border border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/25',
};

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${STATUS_STYLES[status]}`}>
      {status}
    </span>
  );
}

function RequestedItemsSummary({ items }) {
  const codeCount = items.reduce((sum, item) => sum + item.quantity, 0);
  return (
    <div className="text-xs">
      {items.map((item) => (
        <div key={item.name} className="text-slate-700 dark:text-white/75">
          {item.name} &times; {item.quantity}
        </div>
      ))}
      <div className="mt-1 font-semibold text-[#8f6b14] dark:text-brand-gold">{codeCount} code(s) requested</div>
    </div>
  );
}

export default function CodeRequests() {
  const requests = useSyncExternalStore(subscribeToTransactionUpdates, getCodeRequests);
  const [reviewingRequest, setReviewingRequest] = useState(null);
  const [rejectingRequest, setRejectingRequest] = useState(null); // { id, arNumber, reason }

  const pendingRequests = requests.filter((request) => request.status === 'pending');
  const approvedRequests = requests.filter((request) => request.status === 'approved');
  const rejectedRequests = requests.filter((request) => request.status === 'rejected');

  function handleApprove(request) {
    const result = approveCodeRequest(request.id);
    if (result.success) {
      toast.success(`${request.arNumber} approved. Codes will be generated and delivered directly to ${request.memberName}.`);
    } else {
      toast.error(result.error);
    }
  }

  function handleConfirmReject() {
    if (!rejectingRequest.reason.trim()) {
      toast.error('Enter a reason for rejection');
      return;
    }
    const result = rejectCodeRequest(rejectingRequest.id, rejectingRequest.reason.trim());
    if (result.success) {
      toast.success(`${rejectingRequest.arNumber} rejected.`);
      setRejectingRequest(null);
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div>
      <div className="mb-7">
        <h1 className="font-display text-2xl font-bold text-white">Code Approvals</h1>
        <div className="w-12 h-0.5 mt-2 bg-gradient-to-r from-[#8f6b14] dark:from-[#D4AF37] to-transparent" />
        <p className="mt-3 text-sm max-w-2xl text-slate-600 dark:text-white/50">
          Review code requests raised against a paid AR before anything is generated. A request can
          only be approved when the member sits within the same network tree.
        </p>
      </div>

      {/* Pending */}
      <div className="glass-card rounded-2xl p-6 mb-6">
        <h3 className="font-semibold text-white mb-1">Pending Requests</h3>
        <p className="text-xs mb-5 text-slate-500 dark:text-white/35">{pendingRequests.length} awaiting review</p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                {['AR Number', 'Cashier', 'Member', 'Requested Items', 'Network Tree', 'Actions'].map((heading) => (
                  <th key={heading} className="table-header py-3 px-4 text-left font-semibold text-xs uppercase tracking-wide whitespace-nowrap">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pendingRequests.map((request, idx) => (
                <tr key={request.id} className={idx % 2 === 0 ? 'bg-slate-50/60 dark:bg-white/[0.02]' : 'bg-transparent'}>
                  <td className="py-3 px-4 font-mono text-xs whitespace-nowrap text-[#8f6b14] dark:text-brand-gold">{request.arNumber}</td>
                  <td className="py-3 px-4 text-xs whitespace-nowrap text-slate-700 dark:text-white/65">{request.cashier}</td>
                  <td className="py-3 px-4 text-xs">
                    <div className="text-slate-800 dark:text-white/80">{request.memberName}</div>
                    <div className="text-slate-500 dark:text-white/40">@{request.memberUsername}</div>
                  </td>
                  <td className="py-3 px-4"><RequestedItemsSummary items={request.requestedItems} /></td>
                  <td className="py-3 px-4"><NetworkTreeBadge sameTree={request.sameNetworkTree} /></td>
                  <td className="py-3 px-4">
                    <div className="flex flex-col gap-1.5 min-w-[120px]">
                      <button
                        type="button"
                        onClick={() => setReviewingRequest(request)}
                        className="rounded-lg py-2 px-3 text-xs font-medium border cursor-pointer text-center
                          border-blue-300 text-blue-700 bg-blue-50
                          dark:border-blue-500/40 dark:text-blue-300 dark:bg-blue-500/10"
                        style={{ minHeight: 36 }}
                      >
                        Review
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApprove(request)}
                        disabled={!request.sameNetworkTree}
                        title={request.sameNetworkTree ? undefined : 'Blocked: codes can only be transferred within the same network tree.'}
                        className={`rounded-lg py-2 px-3 text-xs font-semibold text-center text-white bg-emerald-600
                          ${request.sameNetworkTree
                            ? 'cursor-pointer hover:bg-emerald-700'
                            : 'cursor-not-allowed opacity-45 grayscale'}`}
                        style={{ minHeight: 36 }}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => setRejectingRequest({ id: request.id, arNumber: request.arNumber, reason: '' })}
                        className="rounded-lg py-2 px-3 text-xs font-medium border cursor-pointer text-center
                          border-red-300 text-red-700 bg-red-50
                          dark:border-red-400/40 dark:text-red-300 dark:bg-red-400/10"
                        style={{ minHeight: 36 }}
                      >
                        Reject
                      </button>
                      {!request.sameNetworkTree && (
                        <p className="text-[10px] leading-snug text-red-700 dark:text-red-300">
                          Blocked — different network tree.
                        </p>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {pendingRequests.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-sm text-slate-400 dark:text-white/25">
                    No pending code requests.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Approved */}
      <div className="glass-card rounded-2xl p-6 mb-6">
        <h3 className="font-semibold text-white mb-1">Approved</h3>
        <p className="text-xs mb-5 text-slate-500 dark:text-white/35">{approvedRequests.length} approved</p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                {['AR Number', 'Cashier', 'Member', 'Requested Items', 'Status'].map((heading) => (
                  <th key={heading} className="table-header py-3 px-4 text-left font-semibold text-xs uppercase tracking-wide whitespace-nowrap">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {approvedRequests.map((request, idx) => (
                <tr key={request.id} className={idx % 2 === 0 ? 'bg-slate-50/60 dark:bg-white/[0.02]' : 'bg-transparent'}>
                  <td className="py-3 px-4 font-mono text-xs whitespace-nowrap text-[#8f6b14] dark:text-brand-gold">{request.arNumber}</td>
                  <td className="py-3 px-4 text-xs whitespace-nowrap text-slate-700 dark:text-white/65">{request.cashier}</td>
                  <td className="py-3 px-4 text-xs">
                    <div className="text-slate-800 dark:text-white/80">{request.memberName}</div>
                    <div className="text-slate-500 dark:text-white/40">@{request.memberUsername}</div>
                  </td>
                  <td className="py-3 px-4"><RequestedItemsSummary items={request.requestedItems} /></td>
                  <td className="py-3 px-4"><StatusBadge status={request.status} /></td>
                </tr>
              ))}
              {approvedRequests.length === 0 && (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-sm text-slate-400 dark:text-white/25">
                    Nothing approved yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rejected */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="font-semibold text-white mb-1">Rejected</h3>
        <p className="text-xs mb-5 text-slate-500 dark:text-white/35">{rejectedRequests.length} rejected</p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                {['AR Number', 'Cashier', 'Member', 'Reason'].map((heading) => (
                  <th key={heading} className="table-header py-3 px-4 text-left font-semibold text-xs uppercase tracking-wide whitespace-nowrap">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rejectedRequests.map((request, idx) => (
                <tr key={request.id} className={idx % 2 === 0 ? 'bg-slate-50/60 dark:bg-white/[0.02]' : 'bg-transparent'}>
                  <td className="py-3 px-4 font-mono text-xs whitespace-nowrap text-[#8f6b14] dark:text-brand-gold">{request.arNumber}</td>
                  <td className="py-3 px-4 text-xs whitespace-nowrap text-slate-700 dark:text-white/65">{request.cashier}</td>
                  <td className="py-3 px-4 text-xs">
                    <div className="text-slate-800 dark:text-white/80">{request.memberName}</div>
                    <div className="text-slate-500 dark:text-white/40">@{request.memberUsername}</div>
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-600 dark:text-white/60">{request.rejectionReason}</td>
                </tr>
              ))}
              {rejectedRequests.length === 0 && (
                <tr>
                  <td colSpan="4" className="py-12 text-center text-sm text-slate-400 dark:text-white/25">
                    Nothing rejected yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review modal — read-only detail. Codes are never rendered here. */}
      {reviewingRequest && (
        <div
          className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60"
          onMouseDown={() => setReviewingRequest(null)}
        >
          <div
            onMouseDown={(e) => e.stopPropagation()}
            className="w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 max-h-[85vh] overflow-y-auto bg-white border border-slate-200 dark:bg-[#15161a] dark:border-white/[0.12]"
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="min-w-0">
                <p className="font-mono text-sm font-semibold text-[#8f6b14] dark:text-brand-gold">{reviewingRequest.arNumber}</p>
                <p className="text-xs mt-0.5 text-slate-500 dark:text-white/45">Cashier: {reviewingRequest.cashier}</p>
              </div>
              <StatusBadge status={reviewingRequest.status} />
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <p className="text-[11px] uppercase tracking-wide font-semibold mb-1 text-slate-500 dark:text-white/45">Member</p>
                <p className="text-slate-800 dark:text-white/85">{reviewingRequest.memberName} <span className="text-slate-500 dark:text-white/40">(@{reviewingRequest.memberUsername})</span></p>
              </div>

              <div>
                <p className="text-[11px] uppercase tracking-wide font-semibold mb-1 text-slate-500 dark:text-white/45">Requested Package / Product Types</p>
                <RequestedItemsSummary items={reviewingRequest.requestedItems} />
              </div>

              <div>
                <p className="text-[11px] uppercase tracking-wide font-semibold mb-1 text-slate-500 dark:text-white/45">Network Tree</p>
                <NetworkTreeBadge sameTree={reviewingRequest.sameNetworkTree} />
                {!reviewingRequest.sameNetworkTree && (
                  <p className="text-xs mt-2 leading-relaxed text-red-700 dark:text-red-300">
                    Codes can only be transferred within the same network tree. This request is
                    blocked from approval until that is resolved.
                  </p>
                )}
              </div>

              {reviewingRequest.status === 'rejected' && (
                <div>
                  <p className="text-[11px] uppercase tracking-wide font-semibold mb-1 text-slate-500 dark:text-white/45">Rejection Reason</p>
                  <p className="text-slate-700 dark:text-white/70">{reviewingRequest.rejectionReason}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end mt-5">
              <button
                type="button"
                onClick={() => setReviewingRequest(null)}
                className="rounded-xl py-2.5 px-5 text-sm font-medium border cursor-pointer
                  border-slate-300 text-slate-700 bg-slate-50
                  dark:border-white/[0.12] dark:text-white/70 dark:bg-white/5"
                style={{ minHeight: 44 }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject modal — requires a reason */}
      {rejectingRequest && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60"
          onMouseDown={() => setRejectingRequest(null)}
        >
          <div
            onMouseDown={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl p-6 bg-white border border-slate-200 dark:bg-[#15161a] dark:border-white/[0.12]"
          >
            <div className="flex items-start gap-3">
              <div className="size-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-red-50 border border-red-300 text-red-700 dark:bg-red-400/[0.14] dark:border-red-400/30 dark:text-red-300">
                <HiOutlineBan className="size-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-display text-lg font-bold text-white">Reject Request</h3>
                <p className="text-sm mt-1.5 text-slate-600 dark:text-white/60">
                  Rejecting <strong className="text-[#8f6b14] dark:text-brand-gold">{rejectingRequest.arNumber}</strong>. A reason is required.
                </p>
              </div>
            </div>

            <div className="mt-4">
              <label className="label">Reason</label>
              <textarea
                value={rejectingRequest.reason}
                onChange={(e) => setRejectingRequest({ ...rejectingRequest, reason: e.target.value })}
                className="glass-input w-full rounded-xl px-4 py-2.5 text-sm mt-1.5"
                rows={3}
                placeholder="e.g. AR total does not match the receipt on file"
              />
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button
                type="button"
                onClick={() => setRejectingRequest(null)}
                className="rounded-xl py-2.5 px-4 text-sm font-medium border cursor-pointer
                  border-slate-300 text-slate-700 bg-slate-50
                  dark:border-white/[0.12] dark:text-white/70 dark:bg-white/5"
                style={{ minHeight: 44 }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="rounded-xl py-2.5 px-4 text-sm font-semibold text-white cursor-pointer bg-red-600 hover:bg-red-700 dark:bg-gradient-to-br dark:from-red-600 dark:to-red-700"
                style={{ minHeight: 44 }}
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
