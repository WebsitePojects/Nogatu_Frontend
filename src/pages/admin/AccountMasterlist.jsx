import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';

export default function AccountMasterlist() {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadAccounts(); }, [page]);

  async function loadAccounts(searchTerm) {
    setLoading(true);
    try {
      const q = searchTerm !== undefined ? searchTerm : search;
      const res = await api.get(`/admin/accounts?page=${page}&search=${q}`);
      setAccounts(res.data.accounts);
      setTotalPages(res.data.totalPages);
    } catch { } finally { setLoading(false); }
  }

  function handleSearch(e) {
    e.preventDefault();
    setPage(1);
    loadAccounts(search);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Account Masterlist</h1>

      <div className="card mb-6">
        <form onSubmit={handleSearch} className="flex gap-3">
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} className="input-field flex-1" placeholder="Search by name..." />
          <button type="submit" className="btn-primary">Search</button>
        </form>
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">Accounts</p>
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
                  <th className="py-3 px-4">Account Name</th>
                  <th className="py-3 px-4">Username</th>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Entry</th>
                  <th className="py-3 px-4">Date Reg</th>
                  <th className="py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((a) => (
                  <tr key={a.uid} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{a.fullname}</td>
                    <td className="py-3 px-4">{a.username}</td>
                    <td className="py-3 px-4 font-mono text-xs">{a.activationcode}</td>
                    <td className="py-3 px-4"><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700">{a.accttypeName}</span></td>
                    <td className="py-3 px-4 text-xs">{a.entryType}</td>
                    <td className="py-3 px-4 text-xs">{a.datereg}</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1">
                        <button onClick={() => navigate(`/admin/accounts/${a.uid}`)} className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded hover:bg-primary-200">Edit</button>
                        <button onClick={() => navigate(`/admin/genealogy?id=${a.uid}`)} className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded hover:bg-emerald-200">Tree</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {accounts.length === 0 && (
                  <tr><td colSpan="7" className="py-8 text-center text-gray-400">No accounts found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
