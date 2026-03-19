import { useState, useEffect } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';

export default function ManageCodes() {
  const [codes, setCodes] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [targetUsername, setTargetUsername] = useState('');

  useEffect(() => { loadCodes(); }, [page]);

  async function loadCodes() {
    setLoading(true);
    try {
      const res = await api.get(`/admin/codes?page=${page}`);
      setCodes(res.data.codes);
      setTotalPages(res.data.totalPages);
    } catch { } finally { setLoading(false); }
  }

  function toggleSelect(code) {
    setSelected(prev => prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]);
  }

  async function handleRelease() {
    if (selected.length === 0) return toast.error('Select codes to release');
    try {
      const res = await api.post('/admin/codes/release', { codes: selected });
      toast.success(`${res.data.released} code(s) released`);
      setSelected([]);
      loadCodes();
    } catch (err) { toast.error(err.response?.data?.error || 'Release failed'); }
  }

  async function handleTransfer() {
    if (!targetUsername || selected.length === 0) return toast.error('Enter username and select codes');
    try {
      const res = await api.post('/admin/codes/transfer', { targetUsername, codes: selected });
      toast.success(`${res.data.transferred} code(s) transferred`);
      setSelected([]);
      setTargetUsername('');
      loadCodes();
    } catch (err) { toast.error(err.response?.data?.error || 'Transfer failed'); }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Manage Codes</h1>

      {/* Actions Bar */}
      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1">
            <label className="label">Transfer to Account</label>
            <input type="text" value={targetUsername} onChange={(e) => setTargetUsername(e.target.value)} className="input-field" placeholder="Username" />
          </div>
          <button onClick={handleTransfer} disabled={selected.length === 0} className="btn-primary disabled:opacity-50">Transfer ({selected.length})</button>
          <button onClick={handleRelease} disabled={selected.length === 0} className="btn-success disabled:opacity-50">Release ({selected.length})</button>
        </div>
      </div>

      {/* Codes Table */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">{selected.length} selected</p>
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
                  <th className="py-3 px-4"><input type="checkbox" onChange={(e) => setSelected(e.target.checked ? codes.map(c => c.code) : [])} /></th>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Generated</th>
                </tr>
              </thead>
              <tbody>
                {codes.map((c) => (
                  <tr key={c.code} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4"><input type="checkbox" checked={selected.includes(c.code)} onChange={() => toggleSelect(c.code)} /></td>
                    <td className="py-3 px-4 font-mono text-xs">{c.code}</td>
                    <td className="py-3 px-4">{c.producttypeName}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${c.codestatus === 0 ? 'bg-gray-100 text-gray-600' : c.codestatus === 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                        {c.statusLabel}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-500">{c.dategen}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
