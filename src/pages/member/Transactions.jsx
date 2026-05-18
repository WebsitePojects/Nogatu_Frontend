import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { HiOutlineChevronLeft, HiOutlineChevronRight, HiOutlineDocumentText } from 'react-icons/hi';
import { formatDateTimeManila } from '../../utils/dateTime';

const fmt = (n) => Number(n || 0).toLocaleString('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function Spinner() {
  return (
    <div className="flex justify-center py-16">
      <div
        className="w-10 h-10 rounded-full border-[3px] animate-spin"
        style={{ borderColor: 'rgba(212,175,55,0.12)', borderTopColor: '#D4AF37' }}
      />
    </div>
  );
}

export default function Transactions() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [page]);

  async function loadData() {
    setLoading(true);
    try {
      const res = await api.get(`/transactions?page=${page}`);
      setTransactions(Array.isArray(res.data.transactions) ? res.data.transactions : []);
      setTotalPages(Number(res.data.totalPages || 1));
    } catch {
      setTransactions([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }

  const txAmount = (t) => {
    if (t.transactionType === 10) return Number(t.encashment || 0);
    if (t.transactionType === 11) return Number(t.totalProductValue || 0);
    return Number(t.directReferral || 0)
      + Number(t.pairing || 0)
      + Number(t.leadership || 0)
      + Number(t.unilevel || 0)
      + Number(t.hifive || 0)
      + Number(t.rankingBonus || 0);
  };

  const txDeductions = (t) => {
    if (t.transactionType === 11) return Number(t.voucherUsed || 0);
    return Number(t.tax || 0) + Number(t.fee || 0) + Number(t.cdDeduction || 0);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="portal-page-title font-display text-2xl font-bold">Transaction History</h1>
        <div
          className="w-10 h-0.5 mt-2 rounded-full"
          style={{ background: 'linear-gradient(90deg,#D4AF37,transparent)' }}
        />
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div
          className="flex items-center justify-between px-5 py-3.5"
          style={{ borderBottom: '1px solid rgba(212,175,55,0.08)' }}
        >
          <p className="portal-card-muted text-sm">Transaction records</p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg disabled:opacity-30 transition-colors hover:bg-white/[0.06]"
              style={{ color: 'var(--portal-card-muted)' }}
            >
              <HiOutlineChevronLeft className="w-4 h-4" />
            </button>
            <span className="portal-accent-chip text-xs px-2 py-1 rounded-lg">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg disabled:opacity-30 transition-colors hover:bg-white/[0.06]"
              style={{ color: 'var(--portal-card-muted)' }}
            >
              <HiOutlineChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {loading ? (
          <Spinner />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr>
                  <th className="table-header py-3 px-3">Type</th>
                  <th className="table-header py-3 px-3">Date</th>
                  <th className="table-header py-3 px-3">Amount</th>
                  <th className="table-header py-3 px-3">Taxes &amp; Fees</th>
                  <th className="table-header py-3 px-3">Details</th>
                  <th className="table-header py-3 px-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t, i) => (
                  <tr
                    key={t.pid}
                    style={{
                      background: i % 2 === 0 ? 'var(--portal-zebra-bg)' : 'transparent',
                      borderBottom: '1px solid var(--portal-row-border)',
                    }}
                    className="hover:bg-white/[0.03] transition-colors"
                  >
                    <td className="py-3 px-3">
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold"
                        style={
                          t.transactionType === 1
                            ? { background: 'rgba(34,197,94,0.1)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.2)' }
                            : t.transactionType === 10
                              ? { background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }
                              : t.transactionType === 11
                                ? { background: 'rgba(212,175,55,0.14)', color: '#F2D06B', border: '1px solid rgba(212,175,55,0.3)' }
                                : { background: 'rgba(148,163,184,0.1)', color: '#cbd5e1', border: '1px solid rgba(148,163,184,0.2)' }
                        }
                      >
                        {t.transactionTypeName}
                      </span>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
                      {formatDateTimeManila(t.transdate)}
                    </td>
                    <td className="py-3 px-3 text-sm font-semibold" style={{ color: '#D4AF37' }}>
                      PHP {fmt(txAmount(t))}
                    </td>
                    <td className="py-3 px-3 text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>
                      {t.transactionType === 10 || t.transactionType === 11 ? `PHP ${fmt(txDeductions(t))}` : '-'}
                    </td>
                    <td className="py-3 px-3 text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>
                      {t.transactionTypeName}
                    </td>
                    <td className="py-3 px-3">
                      <button
                        type="button"
                        onClick={() => navigate(`/transactions/${encodeURIComponent(t.pid)}`)}
                        className="text-xs px-2.5 py-1 rounded-lg font-medium"
                        style={{ background: 'rgba(59,130,246,0.12)', color: '#93c5fd', border: '1px solid rgba(59,130,246,0.25)' }}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan="6" className="py-14 text-center">
                      <HiOutlineDocumentText
                        className="w-8 h-8 mx-auto mb-2"
                        style={{ color: 'rgba(212,175,55,0.2)' }}
                      />
                      <p className="portal-card-muted">No transactions found.</p>
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
