import { useState, useEffect } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';

export default function ActivationCodes() {
  const [codes, setCodes] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [targetUsername, setTargetUsername] = useState('');
  const [searchDone, setSearchDone] = useState(false);

  useEffect(() => { loadCodes(); }, [page]);

  async function loadCodes() {
    setLoading(true);
    try {
      const res = await api.get(`/codes?page=${page}`);
      setCodes(res.data.codes);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
    } catch { } finally { setLoading(false); }
  }

  function toggleSelect(code) {
    setSelected(prev => prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]);
  }

  async function handleTransfer() {
    if (!targetUsername) return toast.error('Search for a target account first');
    if (selected.length === 0) return toast.error('Select codes to transfer');
    try {
      const res = await api.post('/codes/transfer', { targetUsername, codes: selected });
      toast.success(`${res.data.transferred} code(s) transferred to ${res.data.targetName}`);
      setSelected([]);
      setTargetUsername('');
      setSearchDone(false);
      loadCodes();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Transfer failed');
    }
  }

  async function handleMaintenance(code, transType) {
    try {
      await api.post('/codes/maintenance', { code, transType });
      toast.success('Code activated successfully');
      loadCodes();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Activation failed');
    }
  }

  async function handleUpgrade(code) {
    try {
      const res = await api.post('/codes/upgrade', { code });
      toast.success(`Account upgraded to ${res.data.newAccountTypeName}!`);
      loadCodes();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upgrade failed');
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Activation Codes</h1>

      {/* Transfer Section */}
      <div className="card mb-6">
        <h3 className="font-semibold text-gray-800 mb-3">Transfer Codes</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <input type="text" value={targetUsername} onChange={(e) => setTargetUsername(e.target.value)} className="input-field flex-1" placeholder="Enter target username" />
          <button onClick={handleTransfer} disabled={!targetUsername || selected.length === 0} className="btn-primary disabled:opacity-50 whitespace-nowrap">
            Transfer ({selected.length})
          </button>
        </div>
      </div>

      {/* Codes Table */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">Total: {total} codes</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="btn-secondary text-sm py-1.5 px-3 disabled:opacity-50">Prev</button>
            <span className="text-sm text-gray-600">Page {page} / {totalPages}</span>
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
                  <th className="py-3 px-4">Select</th>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Product Type</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {codes.map((c) => (
                  <tr key={c.code} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      {c.codestatus === 1 && (
                        <input type="checkbox" checked={selected.includes(c.code)} onChange={() => toggleSelect(c.code)} className="rounded border-gray-300" />
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs">{c.code}</td>
                    <td className="py-3 px-4">{c.producttypeName}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${c.codestatus === 0 ? 'bg-gray-100 text-gray-600' : c.codestatus === 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                        {c.statusLabel}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {c.codestatus === 1 && c.producttype >= 100 && (
                        <div className="flex gap-1">
                          <button onClick={() => handleMaintenance(c.code, 1)} className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded hover:bg-emerald-200">Maintenance</button>
                          <button onClick={() => handleMaintenance(c.code, 2)} className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-200">Hi-Five</button>
                        </div>
                      )}
                      {c.codestatus === 1 && c.producttype < 100 && (
                        <button onClick={() => handleUpgrade(c.code)} className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded hover:bg-amber-200">Upgrade</button>
                      )}
                    </td>
                  </tr>
                ))}
                {codes.length === 0 && (
                  <tr><td colSpan="5" className="py-8 text-center text-gray-400">No activation codes found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
