import { useState, useEffect } from 'react';
import api from '../../api';
import { HiOutlineDocumentText, HiOutlineChevronLeft, HiOutlineChevronRight } from 'react-icons/hi';

const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function Spinner() {
  return (
    <div className="flex justify-center py-16">
      <div className="w-10 h-10 rounded-full border-[3px] animate-spin" style={{ borderColor: 'rgba(212,175,55,0.12)', borderTopColor: '#D4AF37' }} />
    </div>
  );
}

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [page, setPage]                 = useState(1);
  const [totalPages, setTotalPages]     = useState(1);
  const [loading, setLoading]           = useState(true);
  const [selectedTx, setSelectedTx]     = useState(null);

  useEffect(() => { loadData(); }, [page]);

  async function loadData() {
    setLoading(true);
    try {
      const res = await api.get(`/transactions?page=${page}`);
      setTransactions(res.data.transactions);
      setTotalPages(res.data.totalPages);
    } catch { } finally { setLoading(false); }
  }

  const txAmount = (t) => {
    if (t.transactionType === 10) return Number(t.encashment || 0);
    return Number(t.directReferral || 0) + Number(t.pairing || 0) + Number(t.leadership || 0) +
           Number(t.unilevel || 0) + Number(t.hifive || 0) + Number(t.lpc || 0);
  };

  const txDeductions = (t) => Number(t.tax || 0) + Number(t.fee || 0) + Number(t.cdDeduction || 0);

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Transaction History</h1>
        <div className="w-10 h-0.5 mt-2 rounded-full" style={{ background: 'linear-gradient(90deg,#D4AF37,transparent)' }} />
      </div>

      {/* Table card */}
      <div className="glass-card rounded-2xl overflow-hidden">
        {/* Pagination bar */}
        <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: '1px solid rgba(212,175,55,0.08)' }}>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Transaction records</p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg disabled:opacity-30 transition-colors hover:bg-white/[0.06]"
              style={{ color: 'rgba(255,255,255,0.5)' }}
            >
              <HiOutlineChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs px-2 py-1 rounded-lg" style={{ background: 'rgba(212,175,55,0.08)', color: 'rgba(212,175,55,0.7)' }}>
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg disabled:opacity-30 transition-colors hover:bg-white/[0.06]"
              style={{ color: 'rgba(255,255,255,0.5)' }}
            >
              <HiOutlineChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {loading ? <Spinner /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr>
                  <th className="table-header py-3 px-3">Type</th>
                  <th className="table-header py-3 px-3">Date</th>
                  <th className="table-header py-3 px-3">Amount</th>
                  <th className="table-header py-3 px-3">Taxes & Fees</th>
                  <th className="table-header py-3 px-3">Details</th>
                  <th className="table-header py-3 px-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t, i) => (
                  <tr
                    key={t.pid}
                    style={{
                      background: i % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent',
                      borderBottom: '1px solid rgba(212,175,55,0.05)',
                    }}
                    className="hover:bg-white/[0.03] transition-colors"
                  >
                    <td className="py-3 px-3">
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold"
                        style={
                          t.transactionType === 1
                            ? { background: 'rgba(34,197,94,0.1)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.2)' }
                            : { background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }
                        }
                      >
                        {t.transactionTypeName}
                      </span>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>{t.transdate || '—'}</td>
                    <td className="py-3 px-3 text-sm font-semibold" style={{ color: '#D4AF37' }}>₱{fmt(txAmount(t))}</td>
                    <td className="py-3 px-3 text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>
                      {t.transactionType === 10 ? `₱${fmt(txDeductions(t))}` : '-'}
                    </td>
                    <td className="py-3 px-3 text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>{t.transactionTypeName}</td>
                    <td className="py-3 px-3">
                      <button
                        type="button"
                        onClick={() => setSelectedTx(t)}
                        className="text-xs px-2.5 py-1 rounded-lg font-medium"
                        style={{ background: 'rgba(59,130,246,0.12)', color: '#93c5fd', border: '1px solid rgba(59,130,246,0.25)' }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan="6" className="py-14 text-center">
                      <HiOutlineDocumentText className="w-8 h-8 mx-auto mb-2" style={{ color: 'rgba(212,175,55,0.2)' }} />
                      <p style={{ color: 'rgba(255,255,255,0.3)' }}>No transactions found.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedTx && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(3px)' }}
          onClick={() => setSelectedTx(null)}
        >
          <div
              className="rounded-2xl w-full max-w-[560px] p-6 shadow-2xl"
              style={{ background: '#141008', border: '1px solid rgba(212,175,55,0.25)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-semibold text-white">Transaction Details</h3>
              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                className="text-sm px-2.5 py-1 rounded-lg"
                style={{ color: 'rgba(255,255,255,0.65)', border: '1px solid rgba(255,255,255,0.15)' }}
              >
                Close
              </button>
            </div>

            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between" style={{ color: 'rgba(255,255,255,0.7)' }}><span>Type</span><span>{selectedTx.transactionTypeName}</span></div>
              <div className="flex justify-between" style={{ color: 'rgba(255,255,255,0.7)' }}><span>Date</span><span>{selectedTx.transdate || '—'}</span></div>
              <div className="flex justify-between" style={{ color: 'rgba(255,255,255,0.7)' }}><span>Beginning Balance</span><span>₱{fmt(selectedTx.beginningBalance)}</span></div>
              <div className="flex justify-between" style={{ color: 'rgba(255,255,255,0.7)' }}><span>Ending Balance</span><span>₱{fmt(selectedTx.endingBalance)}</span></div>

              <div className="pt-2 mt-2" style={{ borderTop: '1px dashed rgba(255,255,255,0.15)' }}>
                <p className="text-xs uppercase tracking-wide mb-2" style={{ color: 'rgba(212,175,55,0.7)' }}>Income Breakdown</p>
                <div className="grid grid-cols-2 gap-y-1.5 gap-x-3" style={{ color: 'rgba(255,255,255,0.68)' }}>
                  <span>Direct Referral</span><span className="text-right">₱{fmt(selectedTx.directReferral)}</span>
                  <span>Pairing</span><span className="text-right">₱{fmt(selectedTx.pairing)}</span>
                  <span>Leadership</span><span className="text-right">₱{fmt(selectedTx.leadership)}</span>
                  <span>Unilevel</span><span className="text-right">₱{fmt(selectedTx.unilevel)}</span>
                  <span>Hi-Five</span><span className="text-right">₱{fmt(selectedTx.hifive)}</span>
                  <span>LPC</span><span className="text-right">₱{fmt(selectedTx.lpc)}</span>
                </div>
              </div>

              {selectedTx.transactionType === 10 && (
                <div className="pt-2 mt-2" style={{ borderTop: '1px dashed rgba(255,255,255,0.15)' }}>
                  <p className="text-xs uppercase tracking-wide mb-2" style={{ color: 'rgba(212,175,55,0.7)' }}>Encashment Deductions</p>
                  <div className="grid grid-cols-2 gap-y-1.5 gap-x-3" style={{ color: 'rgba(255,255,255,0.68)' }}>
                    <span>Net Encashment</span><span className="text-right">₱{fmt(selectedTx.encashment)}</span>
                    <span>Tax</span><span className="text-right">₱{fmt(selectedTx.tax)}</span>
                    <span>Fee</span><span className="text-right">₱{fmt(selectedTx.fee)}</span>
                    <span>CD Deduction</span><span className="text-right">₱{fmt(selectedTx.cdDeduction)}</span>
                    <span className="font-semibold">Total Deductions</span><span className="text-right font-semibold">₱{fmt(txDeductions(selectedTx))}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
