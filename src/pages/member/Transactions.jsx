import { useState, useEffect } from 'react';
import api from '../../api';

const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

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
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Transaction History</h1>
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">Transaction records</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="btn-secondary text-sm py-1.5 px-3 disabled:opacity-50">Prev</button>
            <span className="text-sm text-gray-600">{page}/{totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="btn-secondary text-sm py-1.5 px-3 disabled:opacity-50">Next</button>
          </div>
        </div>
        {loading ? (
          <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-header">
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Begin Bal</th>
                  <th className="py-3 px-3">DRef</th>
                  <th className="py-3 px-3">Pairing</th>
                  <th className="py-3 px-3">Leadership</th>
                  <th className="py-3 px-3">Unilevel</th>
                  <th className="py-3 px-3">End Bal</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.pid} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-3 whitespace-nowrap">{t.transdate || '-'}</td>
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${t.transactionType === 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {t.transactionTypeName}
                      </span>
                    </td>
                    <td className="py-3 px-3">₱{fmt(t.beginningBalance)}</td>
                    <td className="py-3 px-3">₱{fmt(t.directReferral)}</td>
                    <td className="py-3 px-3">₱{fmt(t.pairing)}</td>
                    <td className="py-3 px-3">₱{fmt(t.leadership)}</td>
                    <td className="py-3 px-3">₱{fmt(t.unilevel)}</td>
                    <td className="py-3 px-3 font-semibold">₱{fmt(t.endingBalance)}</td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr><td colSpan="8" className="py-8 text-center text-gray-400">No transactions found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
