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

  useEffect(() => { loadData(); }, [page]);

  async function loadData() {
    setLoading(true);
    try {
      const res = await api.get(`/transactions?page=${page}`);
      setTransactions(res.data.transactions);
      setTotalPages(res.data.totalPages);
    } catch { } finally { setLoading(false); }
  }

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
                  <th className="table-header py-3 px-3">Date</th>
                  <th className="table-header py-3 px-3">Type</th>
                  <th className="table-header py-3 px-3">Begin Bal</th>
                  <th className="table-header py-3 px-3">D.Ref</th>
                  <th className="table-header py-3 px-3">Pairing</th>
                  <th className="table-header py-3 px-3">Leadership</th>
                  <th className="table-header py-3 px-3">Unilevel</th>
                  <th className="table-header py-3 px-3">End Bal</th>
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
                    <td className="py-3 px-3 whitespace-nowrap text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>{t.transdate || '—'}</td>
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
                    <td className="py-3 px-3 text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>₱{fmt(t.beginningBalance)}</td>
                    <td className="py-3 px-3 text-xs" style={{ color: 'rgba(212,175,55,0.7)' }}>₱{fmt(t.directReferral)}</td>
                    <td className="py-3 px-3 text-xs" style={{ color: 'rgba(212,175,55,0.7)' }}>₱{fmt(t.pairing)}</td>
                    <td className="py-3 px-3 text-xs" style={{ color: 'rgba(212,175,55,0.7)' }}>₱{fmt(t.leadership)}</td>
                    <td className="py-3 px-3 text-xs" style={{ color: 'rgba(212,175,55,0.7)' }}>₱{fmt(t.unilevel)}</td>
                    <td className="py-3 px-3 text-sm font-semibold" style={{ color: '#D4AF37' }}>₱{fmt(t.endingBalance)}</td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan="8" className="py-14 text-center">
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
    </div>
  );
}
