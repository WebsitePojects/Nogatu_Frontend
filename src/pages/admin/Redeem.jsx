import { useState, useEffect } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';

export default function Redeem() {
  const [records, setRecords] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => { loadData(); }, [page]);

  async function loadData() {
    setLoading(true);
    try {
      let url = `/admin/redeem?page=${page}`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;
      const res = await api.get(url);
      setRecords(res.data.records);
      setTotalPages(res.data.totalPages);
    } catch { } finally { setLoading(false); }
  }

  async function handleProcess(pid, uid) {
    try {
      await api.put(`/admin/redeem/${pid}/process`, { uid });
      toast.success('Marked as redeemed');
      loadData();
    } catch { toast.error('Failed'); }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Hi-Five Redeem Management</h1>

      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <div><label className="label">Start Date</label><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input-field" /></div>
          <div><label className="label">End Date</label><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="input-field" /></div>
          <button onClick={() => { setPage(1); loadData(); }} className="btn-primary">Filter</button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 ml-auto">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="btn-secondary text-sm py-1.5 px-3 disabled:opacity-50">Prev</button>
            <span className="text-sm text-gray-600">{page}/{totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="btn-secondary text-sm py-1.5 px-3 disabled:opacity-50">Next</button>
          </div>
        </div>
        {loading ? (
          <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-header">
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Username</th>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Bonus</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.pid} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{r.fullname}</td>
                    <td className="py-3 px-4">{r.username}</td>
                    <td className="py-3 px-4">{r.producttypeName}</td>
                    <td className="py-3 px-4 font-semibold">{r.totalBonus}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${r.redeemStatus === 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {r.redeemStatusLabel}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs">{r.redeemdate}</td>
                    <td className="py-3 px-4">
                      {r.redeemStatus !== 1 && (
                        <button onClick={() => handleProcess(r.pid, r.uid)} className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded hover:bg-emerald-200">Mark Redeemed</button>
                      )}
                    </td>
                  </tr>
                ))}
                {records.length === 0 && (
                  <tr><td colSpan="7" className="py-8 text-center text-gray-400">No records found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
