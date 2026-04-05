import { useState, useEffect } from 'react';
import api from '../../api';
import { HiOutlineDocumentText, HiOutlineChevronLeft, HiOutlineChevronRight } from 'react-icons/hi';

const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const moneyColor = (value) => {
  if (Number(value || 0) > 0) return 'text-emerald-600 dark:text-emerald-400';
  return 'text-slate-500 dark:text-[rgba(255,255,255,0.5)]';
};

const deductionColor = (value) => {
  if (Number(value || 0) > 0) return 'text-rose-600 dark:text-rose-400';
  return 'text-slate-500 dark:text-[rgba(255,255,255,0.5)]';
};

const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

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

  const openPrintReceipt = (tx) => {
    if (!tx) return;

    const isEncashment = tx.transactionType === 10;
    const totalIncome = txAmount(tx);
    const totalDeductions = txDeductions(tx);
    const netReceivable = Number(tx.encashment || 0) - totalDeductions;
    const receiptTitle = isEncashment ? 'Encashment Details' : 'Transaction Receipt';
    const transId = tx.pid || 'N/A';
    const transDate = tx.transdate || 'N/A';
    const transactionTypeName = tx.transactionTypeName || 'Transaction';
    const beginningBalance = Number(tx.beginningBalance || 0);
    const endingBalance = Number(tx.endingBalance || 0);

    const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(receiptTitle)} #${escapeHtml(transId)}</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f3f4f6; margin: 0; padding: 24px; color: #111827; }
    .paper { max-width: 760px; margin: 0 auto; background: #fff; border: 1px solid #d1d5db; border-radius: 10px; padding: 26px; }
    .header { text-align: center; border-bottom: 2px solid #1f2937; padding-bottom: 10px; margin-bottom: 16px; }
    .header h1 { margin: 0; font-size: 30px; letter-spacing: 1px; }
    .header p { margin: 3px 0 0; color: #4b5563; }
    .meta { margin: 8px 0 14px; }
    .row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed #d1d5db; }
    .label { color: #4b5563; }
    .value { font-weight: 600; }
    .section { margin-top: 12px; }
    .section-title { font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: #1d4ed8; margin: 10px 0 4px; font-weight: 700; }
    .amount-add { color: #15803d; font-weight: 700; }
    .amount-deduct { color: #dc2626; font-weight: 700; }
    .summary { margin-top: 8px; border-top: 1px solid #111827; border-bottom: 1px solid #111827; background: #ecfdf3; padding: 8px 0; }
    .muted { color: #6b7280; font-size: 12px; text-align: center; margin-top: 16px; }
    .actions { text-align: center; margin-top: 18px; }
    .print-btn { border: 0; border-radius: 6px; padding: 10px 16px; background: #374151; color: #fff; font-weight: 700; cursor: pointer; }
    @media print {
      body { background: #fff; padding: 0; }
      .paper { border: 0; border-radius: 0; max-width: 100%; }
      .actions { display: none; }
    }
  </style>
</head>
<body>
  <div class="paper">
    <div class="header">
      <h1>NOGATU ALLIANCE WORLDWIDE, INC.</h1>
      <p>${escapeHtml(isEncashment ? 'Encashment Details' : 'Transaction Receipt')}</p>
    </div>

    <div class="meta">
      <div class="row"><span class="label">Transaction ID</span><span class="value">#${escapeHtml(transId)}</span></div>
      <div class="row"><span class="label">Type</span><span class="value">${escapeHtml(transactionTypeName)}</span></div>
      <div class="row"><span class="label">Date</span><span class="value">${escapeHtml(transDate)}</span></div>
      <div class="row"><span class="label">Beginning Balance</span><span class="value">PhP ${escapeHtml(fmt(beginningBalance))}</span></div>
    </div>

    <div class="section">
      <div class="section-title">Income Breakdown</div>
      <div class="row"><span class="label">Direct Referral Bonus</span><span class="amount-add">+ PhP ${escapeHtml(fmt(tx.directReferral))}</span></div>
      <div class="row"><span class="label">Pairing Bonus</span><span class="amount-add">+ PhP ${escapeHtml(fmt(tx.pairing))}</span></div>
      <div class="row"><span class="label">Leadership Bonus</span><span class="amount-add">+ PhP ${escapeHtml(fmt(tx.leadership))}</span></div>
      <div class="row"><span class="label">Unilevel Bonus</span><span class="amount-add">+ PhP ${escapeHtml(fmt(tx.unilevel))}</span></div>
      <div class="row"><span class="label">Hi-Five Product Bonus</span><span class="amount-add">+ PhP ${escapeHtml(fmt(tx.hifive))}</span></div>
      <div class="row"><span class="label">LPC</span><span class="amount-add">+ PhP ${escapeHtml(fmt(tx.lpc))}</span></div>
    </div>

    ${isEncashment ? `
    <div class="section">
      <div class="section-title">Less: Deductions</div>
      <div class="row"><span class="label">Withholding Tax (10%)</span><span class="amount-deduct">- PhP ${escapeHtml(fmt(tx.tax))}</span></div>
      <div class="row"><span class="label">Service Fee</span><span class="amount-deduct">- PhP ${escapeHtml(fmt(tx.fee))}</span></div>
      <div class="row"><span class="label">Cash Deferral Deduction (25%)</span><span class="amount-deduct">- PhP ${escapeHtml(fmt(tx.cdDeduction))}</span></div>
      <div class="row"><span class="label value">Total Deductions</span><span class="amount-deduct">- PhP ${escapeHtml(fmt(totalDeductions))}</span></div>
      <div class="row summary"><span class="value">Net Amount Receivable</span><span class="amount-add">PhP ${escapeHtml(fmt(netReceivable))}</span></div>
    </div>
    ` : `
    <div class="section">
      <div class="row summary"><span class="value">Total Income Credited</span><span class="amount-add">PhP ${escapeHtml(fmt(totalIncome))}</span></div>
    </div>
    `}

    <div class="section">
      <div class="row"><span class="label">Ending Balance</span><span class="value">PhP ${escapeHtml(fmt(endingBalance))}</span></div>
    </div>

    <div class="actions">
      <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
    </div>

    <div class="muted">System-generated receipt. Printed ${escapeHtml(new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' }))}</div>
  </div>
</body>
</html>`;

    const printWindow = window.open('', '_blank', 'width=900,height=900');
    if (!printWindow) return;
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 dark:bg-black/55 backdrop-blur-xs"
          onClick={() => setSelectedTx(null)}
        >
          <div
              className="rounded-2xl w-full max-w-[560px] p-6 shadow-2xl bg-white border border-slate-200 dark:bg-[#141008] dark:border-[rgba(212,175,55,0.25)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">Transaction Details</h3>
              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                className="text-sm px-2.5 py-1 rounded-lg text-slate-600 border border-slate-300 hover:bg-slate-100 dark:text-[rgba(255,255,255,0.72)] dark:border-[rgba(255,255,255,0.15)] dark:hover:bg-white/[0.06]"
              >
                Close
              </button>
            </div>

            <div className="space-y-2.5 text-sm text-slate-700 dark:text-[rgba(255,255,255,0.72)]">
              <div className="flex justify-between"><span>Type</span><span>{selectedTx.transactionTypeName}</span></div>
              <div className="flex justify-between"><span>Date</span><span>{selectedTx.transdate || '—'}</span></div>
              <div className="flex justify-between"><span>Beginning Balance</span><span>₱{fmt(selectedTx.beginningBalance)}</span></div>
              <div className="flex justify-between"><span>Ending Balance</span><span>₱{fmt(selectedTx.endingBalance)}</span></div>

              <div className="pt-2 mt-2 border-t border-dashed border-slate-200 dark:border-[rgba(255,255,255,0.15)]">
                <p className="text-xs uppercase tracking-wide mb-2 text-amber-700 dark:text-[rgba(212,175,55,0.7)]">Income Breakdown</p>
                <div className="grid grid-cols-2 gap-y-1.5 gap-x-3 text-slate-700 dark:text-[rgba(255,255,255,0.68)]">
                  <span>Direct Referral</span><span className={`text-right ${moneyColor(selectedTx.directReferral)}`}>+ ₱{fmt(selectedTx.directReferral)}</span>
                  <span>Pairing</span><span className={`text-right ${moneyColor(selectedTx.pairing)}`}>+ ₱{fmt(selectedTx.pairing)}</span>
                  <span>Leadership</span><span className={`text-right ${moneyColor(selectedTx.leadership)}`}>+ ₱{fmt(selectedTx.leadership)}</span>
                  <span>Unilevel</span><span className={`text-right ${moneyColor(selectedTx.unilevel)}`}>+ ₱{fmt(selectedTx.unilevel)}</span>
                  <span>Hi-Five</span><span className={`text-right ${moneyColor(selectedTx.hifive)}`}>+ ₱{fmt(selectedTx.hifive)}</span>
                  <span>LPC</span><span className={`text-right ${moneyColor(selectedTx.lpc)}`}>+ ₱{fmt(selectedTx.lpc)}</span>
                </div>
              </div>

              {selectedTx.transactionType === 10 && (
                <div className="pt-2 mt-2 border-t border-dashed border-slate-200 dark:border-[rgba(255,255,255,0.15)]">
                  <p className="text-xs uppercase tracking-wide mb-2 text-amber-700 dark:text-[rgba(212,175,55,0.7)]">Encashment Deductions</p>
                  <div className="grid grid-cols-2 gap-y-1.5 gap-x-3 text-slate-700 dark:text-[rgba(255,255,255,0.68)]">
                    <span>Net Encashment</span><span className={`text-right ${moneyColor(selectedTx.encashment)}`}>+ ₱{fmt(selectedTx.encashment)}</span>
                    <span>Tax</span><span className={`text-right ${deductionColor(selectedTx.tax)}`}>- ₱{fmt(selectedTx.tax)}</span>
                    <span>Fee</span><span className={`text-right ${deductionColor(selectedTx.fee)}`}>- ₱{fmt(selectedTx.fee)}</span>
                    <span>CD Deduction</span><span className={`text-right ${deductionColor(selectedTx.cdDeduction)}`}>- ₱{fmt(selectedTx.cdDeduction)}</span>
                    <span className="font-semibold">Total Deductions</span><span className={`text-right font-semibold ${deductionColor(txDeductions(selectedTx))}`}>- ₱{fmt(txDeductions(selectedTx))}</span>
                  </div>
                </div>
              )}

              <div className="pt-3 mt-3 border-t border-dashed border-slate-200 dark:border-[rgba(255,255,255,0.15)] flex justify-end">
                <button
                  type="button"
                  onClick={() => openPrintReceipt(selectedTx)}
                  className="text-xs px-3 py-2 rounded-lg font-semibold bg-sky-100 text-sky-900 border border-sky-300 hover:bg-sky-200 dark:bg-amber-200 dark:text-amber-950 dark:border-amber-300 dark:hover:bg-amber-300"
                >
                  Print / Save as PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
