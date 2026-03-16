import { useState, useEffect } from 'react';
import api from '../../api';

export default function DirectReferrals() {
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/referrals').then(res => setReferrals(res.data.referrals)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div></div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Direct Referrals</h1>
      <div className="card overflow-hidden">
        <p className="text-sm text-gray-500 mb-4">Total: {referrals.length} referrals</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="table-header">
                <th className="py-3 px-4">Account Name</th>
                <th className="py-3 px-4">Username</th>
                <th className="py-3 px-4">Package</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Date Registered</th>
              </tr>
            </thead>
            <tbody>
              {referrals.map((r) => (
                <tr key={r.uid} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{r.fullname}</td>
                  <td className="py-3 px-4">{r.username}</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700">{r.accttypeName}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${r.codeid === 1 ? 'bg-emerald-100 text-emerald-700' : r.codeid === 2 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
                      {r.entryType}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-500">{r.datereg ? new Date(r.datereg).toLocaleDateString() : '-'}</td>
                </tr>
              ))}
              {referrals.length === 0 && (
                <tr><td colSpan="5" className="py-8 text-center text-gray-400">No direct referrals yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
