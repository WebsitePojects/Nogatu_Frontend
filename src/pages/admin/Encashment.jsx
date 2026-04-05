import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import toast from 'react-hot-toast';
import html2canvas from 'html2canvas';

const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function Encashment() {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [keyword, setKeyword] = useState('');
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [activeDetails, setActiveDetails] = useState(null);
  const receiptRef = useRef(null);

  useEffect(() => { loadData(); }, [page]);

  async function loadData() {
    setLoading(true);
    try {
      let url = `/admin/encashment?page=${page}`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;
      if (keyword.trim()) url += `&q=${encodeURIComponent(keyword.trim())}`;
      const res = await api.get(url);
      setRecords(res.data.records);
      setTotalPages(res.data.totalPages);
    } catch { } finally { setLoading(false); }
  }

  async function handleProcess(pid, uid) {
    try {
      await api.put(`/admin/encashment/${pid}/process`, { uid });
      toast.success('Encashment marked as processed');
      loadData();
      return true;
    } catch (err) {
      toast.error('Failed to process');
      return false;
    }
  }

  async function openDetails(record) {
    setDetailsLoading(true);
    try {
      const res = await api.get(`/admin/encashment/${record.pid}/details?uid=${record.uid}`);
      setActiveDetails(res.data);
    } catch {
      toast.error('Failed to load encashment details');
    } finally {
      setDetailsLoading(false);
    }
  }

  async function handleDownloadDetails() {
    if (!receiptRef.current) return;

    const canvas = await html2canvas(receiptRef.current, {
      backgroundColor: '#141008',
      scale: 2,
      useCORS: true,
    });

    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `admin-encashment-${activeDetails?.pid || 'nogatu'}.png`;
    link.click();
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
        <h1 className="font-display text-2xl font-bold text-white">Encashment Management</h1>
        <div className="w-12 h-0.5 mt-2" style={{ background: 'linear-gradient(90deg,#D4AF37,transparent)' }} />
      </div>

      {/* Filter */}
      <div className="glass-card rounded-2xl p-6 mb-6 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="sm:min-w-[240px]">
            <label className="label">Account Search</label>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Username or account name"
              className="glass-input rounded-xl px-4 py-2.5 text-sm mt-1.5"
            />
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
          <button
            onClick={() => { setPage(1); loadData(); }}
            className="gold-btn rounded-xl py-2.5 px-5 text-sm"
          >
            Filter
          </button>
          <button
            onClick={() => {
              setKeyword('');
              setStartDate('');
              setEndDate('');
              setPage(1);
              setTimeout(() => loadData(), 0);
            }}
            className="rounded-xl py-2.5 px-5 text-sm font-medium border"
            style={{ borderColor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.65)' }}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card rounded-2xl p-6 overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>Encashment Records</p>
          <div className="flex items-center gap-2">
            <PaginationBtn onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>Prev</PaginationBtn>
            <span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{page} / {totalPages}</span>
            <PaginationBtn onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Next</PaginationBtn>
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
                  {['Name', 'Username', 'Date', 'Amount', 'Deductions', 'Income Details', 'Payout Details', 'Status', 'Actions'].map(h => (
                    <th key={h} className="table-header py-3 px-3 text-left font-semibold text-xs uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.map((r, idx) => (
                  <tr
                    key={r.pid}
                    className="motion-safe:transition-colors"
                    style={{ background: idx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(212,175,55,0.05)'}
                    onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent'}
                  >
                    <td className="py-3 px-3 font-medium text-white/80">{r.fullname}</td>
                    <td className="py-3 px-3 text-white/60">{r.username}</td>
                    <td className="py-3 px-3 text-xs text-white/40">{r.cashtransdate || '-'}</td>
                    <td className="py-3 px-3 text-white/80 font-medium">&#8369;{fmt(r.encashment)}</td>
                    <td className="py-3 px-3 text-white/60">&#8369;{fmt(r.deductions)}</td>
                    <td className="py-3 px-3">
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          onClick={() => navigate(`/admin/accounts/${r.uid}/income`)}
                          className="text-[11px] px-2.5 py-1 rounded-lg font-medium cursor-pointer motion-safe:transition-colors"
                          style={{ background: 'rgba(59,130,246,0.12)', color: '#93c5fd', border: '1px solid rgba(59,130,246,0.2)' }}
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => openDetails(r)}
                          className="text-[11px] px-2.5 py-1 rounded-lg font-medium cursor-pointer motion-safe:transition-colors"
                          style={{ background: 'rgba(212,175,55,0.12)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.2)' }}
                        >
                          Encashment Slip
                        </button>
                        {r.canViewCdDetails && (
                          <button
                            onClick={() => navigate(`/admin/accounts/${r.uid}/cd`)}
                            className="text-[11px] px-2.5 py-1 rounded-lg font-medium cursor-pointer motion-safe:transition-colors"
                            style={{ background: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.2)' }}
                          >
                            CD Details
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-white/60">{r.payoutDetails || 'N/A'}</td>
                    <td className="py-3 px-3">
                      <span
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
                        style={
                          Number(r.cashStatus) === 1
                            ? { background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.22)' }
                            : { background: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.22)' }
                        }
                      >
                        {r.cashStatusLabel}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      {Number(r.cashStatus) !== 1 && (
                        <button
                          onClick={() => handleProcess(r.pid, r.uid)}
                          className="text-xs px-2.5 py-1 rounded-lg font-medium cursor-pointer motion-safe:transition-colors"
                          style={{ background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)' }}
                        >
                          Set As Paid
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {records.length === 0 && (
                  <tr>
                    <td colSpan="9" className="py-12 text-center" style={{ color: 'rgba(255,255,255,0.25)' }}>
                      No records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {(detailsLoading || activeDetails) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div
            className="w-full max-w-2xl rounded-2xl p-7 shadow-2xl"
            style={{
              background: 'var(--surface-1)',
              border: '1px solid var(--surface-border)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.35)',
            }}
          >
            {detailsLoading ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-4" style={{ borderColor: 'rgba(212,175,55,0.15)', borderTopColor: 'rgba(212,175,55,0.75)' }} />
              </div>
            ) : (
              <>
                <div ref={receiptRef}>
                  <div
                    className="rounded-2xl p-4 mb-4"
                    style={{
                      background: 'linear-gradient(135deg, rgba(212,175,55,0.14), rgba(212,175,55,0.04))',
                      border: '1px solid rgba(212,175,55,0.22)',
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="font-display text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Encashment Details</h2>
                        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Ref #{activeDetails?.pid}</p>
                      </div>
                      <span
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
                        style={
                          Number(activeDetails?.status) === 1
                            ? { background: 'rgba(16,185,129,0.12)', color: '#059669', border: '1px solid rgba(16,185,129,0.25)' }
                            : { background: 'rgba(245,158,11,0.12)', color: '#d97706', border: '1px solid rgba(245,158,11,0.25)' }
                        }
                      >
                        {activeDetails?.statusLabel}
                      </span>
                    </div>
                    <div className="w-14 h-0.5 mt-3" style={{ background: 'linear-gradient(90deg,#D4AF37,transparent)' }} />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                    <p><strong>Member:</strong> {activeDetails?.fullname} ({activeDetails?.username})</p>
                    <p><strong>Package:</strong> {activeDetails?.packageType}</p>
                    <p><strong>Date:</strong> {activeDetails?.transdate || activeDetails?.cashtransdate || '-'}</p>
                    <p><strong>Payment:</strong> {activeDetails?.paymentOption || 'N/A'}{activeDetails?.paymentDetails ? ` / ${activeDetails.paymentDetails}` : ''}</p>
                  </div>

                  <div className="rounded-xl p-3 mb-4" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.18)' }}>
                    <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>Balance Window</p>
                    <div className="grid grid-cols-2 gap-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      <p><strong>Beginning Balance:</strong> ₱{fmt(activeDetails?.beginningBalance)}</p>
                      <p><strong>Ending Balance:</strong> ₱{fmt(activeDetails?.endingBalance)}</p>
                    </div>
                  </div>

                  <div className="mt-4 text-sm space-y-1 rounded-xl p-3" style={{ color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(148,163,184,0.2)' }}>
                    <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Income Breakdown</p>
                    <p>Direct Referral: ₱{fmt(activeDetails?.income?.directReferral)}</p>
                    <p>Pairing: ₱{fmt(activeDetails?.income?.pairing)}</p>
                    <p>Leadership: ₱{fmt(activeDetails?.income?.leadership)}</p>
                    <p>Hi-Five: ₱{fmt(activeDetails?.income?.hifive)}</p>
                    <p>LPC: ₱{fmt(activeDetails?.income?.lpc)}</p>
                  </div>

                  <div className="mt-4 text-sm space-y-1 rounded-xl p-3" style={{ color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(148,163,184,0.2)' }}>
                    <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Encashment Deductions</p>
                    <p>Gross Encashment: ₱{fmt(activeDetails?.grossEncashment)}</p>
                    <p>Tax (10%): -₱{fmt(activeDetails?.deductions?.tax)}</p>
                    <p>Fee: -₱{fmt(activeDetails?.deductions?.fee)}</p>
                    <p>CD Deduction: -₱{fmt(activeDetails?.deductions?.cdDeduction)}</p>
                    <p className="pt-1 border-t" style={{ borderColor: 'rgba(212,175,55,0.2)', color: '#D4AF37', fontWeight: 700 }}>
                      Net Receivable: ₱{fmt(activeDetails?.netReceivable)}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
                  <button
                    onClick={() => navigate(`/admin/accounts/${activeDetails?.uid}/income`)}
                    className="text-xs px-3 py-2 rounded-lg font-medium"
                    style={{ background: 'rgba(59,130,246,0.12)', color: '#93c5fd', border: '1px solid rgba(59,130,246,0.2)' }}
                  >
                    View Income Details
                  </button>
                  {Number(activeDetails?.deductions?.cdDeduction || 0) > 0 && (
                    <button
                      onClick={() => navigate(`/admin/accounts/${activeDetails?.uid}/cd`)}
                      className="text-xs px-3 py-2 rounded-lg font-medium"
                      style={{ background: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.2)' }}
                    >
                      CD Details
                    </button>
                  )}
                  {Number(activeDetails?.status) !== 1 && (
                    <button
                      onClick={async () => {
                        const ok = await handleProcess(activeDetails.pid, activeDetails.uid);
                        if (ok) {
                          setActiveDetails({ ...activeDetails, status: 1, statusLabel: 'Paid' });
                        }
                      }}
                      className="text-xs px-3 py-2 rounded-lg font-medium"
                      style={{ background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)' }}
                    >
                      Set As Paid
                    </button>
                  )}
                  <button
                    onClick={handleDownloadDetails}
                    className="text-xs px-3 py-2 rounded-lg font-medium"
                    style={{ background: 'rgba(212,175,55,0.12)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.2)' }}
                  >
                    Download PNG
                  </button>
                  <button
                    onClick={() => setActiveDetails(null)}
                    className="text-xs px-3 py-2 rounded-lg font-medium"
                    style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.12)' }}
                  >
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
