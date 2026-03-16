import { useState, useEffect } from 'react';
import api from '../../api';

const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function PairingReports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/pairing').then(res => setData(res.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div></div>;
  if (!data) return <p>Failed to load pairing data.</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Pairing Reports</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="stat-card"><div><p className="text-sm text-gray-500">Left Accounts</p><p className="text-xl font-bold">{data.counts?.totalLeft || 0}</p></div></div>
        <div className="stat-card"><div><p className="text-sm text-gray-500">Left Points</p><p className="text-xl font-bold">{fmt(data.counts?.totalPointsLeft)}</p></div></div>
        <div className="stat-card"><div><p className="text-sm text-gray-500">Right Accounts</p><p className="text-xl font-bold">{data.counts?.totalRight || 0}</p></div></div>
        <div className="stat-card"><div><p className="text-sm text-gray-500">Right Points</p><p className="text-xl font-bold">{fmt(data.counts?.totalPointsRight)}</p></div></div>
      </div>

      {/* Pairing History */}
      <div className="card overflow-hidden">
        <h3 className="font-semibold text-gray-800 mb-4">Pairing History</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="table-header">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Total Left</th>
                <th className="py-3 px-4">Left Points</th>
                <th className="py-3 px-4">Total Right</th>
                <th className="py-3 px-4">Right Points</th>
                <th className="py-3 px-4">Paired Points</th>
                <th className="py-3 px-4">Total Payout</th>
              </tr>
            </thead>
            <tbody>
              {(data.reports || []).map((r, i) => (
                <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">{r.transdate || '-'}</td>
                  <td className="py-3 px-4">{r.totalleft}</td>
                  <td className="py-3 px-4">{fmt(r.totalpointsleft)}</td>
                  <td className="py-3 px-4">{r.totalright}</td>
                  <td className="py-3 px-4">{fmt(r.totalpointsright)}</td>
                  <td className="py-3 px-4 font-medium">{fmt(r.totalpoints)}</td>
                  <td className="py-3 px-4 font-semibold text-emerald-600">₱{fmt(r.totalbpay)}</td>
                </tr>
              ))}
              {(!data.reports || data.reports.length === 0) && (
                <tr><td colSpan="7" className="py-8 text-center text-gray-400">No pairing records found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
