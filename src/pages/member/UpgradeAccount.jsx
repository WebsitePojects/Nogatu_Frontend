import { useState, useEffect } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

export default function UpgradeAccount() {
  const { user, checkSession } = useAuth();
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [targetUsername, setTargetUsername] = useState('');
  const [targetInfo, setTargetInfo] = useState(null);
  const [selected, setSelected] = useState([]);

  useEffect(() => { loadCodes(); }, []);

  async function loadCodes() {
    setLoading(true);
    try {
      const res = await api.get('/codes?page=1');
      setCodes(res.data.codes.filter(c => c.codestatus === 1));
    } catch { } finally { setLoading(false); }
  }

  async function handleSearch(e) {
    e.preventDefault();
    try {
      const res = await api.get(`/registration/validate-username?username=${targetUsername}`);
      if (res.data.exists) {
        setTargetInfo({ username: targetUsername });
        toast.success(`Account found: ${targetUsername}`);
      } else {
        toast.error('Account not found');
        setTargetInfo(null);
      }
    } catch { toast.error('Search failed'); }
  }

  async function handleTransfer() {
    if (!targetInfo || selected.length === 0) return;
    try {
      const res = await api.post('/codes/transfer', { targetUsername: targetInfo.username, codes: selected });
      toast.success(`${res.data.transferred} code(s) transferred`);
      setSelected([]);
      setTargetInfo(null);
      setTargetUsername('');
      loadCodes();
    } catch (err) { toast.error(err.response?.data?.error || 'Transfer failed'); }
  }

  async function handleUpgrade(code) {
    try {
      const res = await api.post('/codes/upgrade', { code });
      toast.success(`Upgraded to ${res.data.newAccountTypeName}!`);
      await checkSession();
      loadCodes();
    } catch (err) { toast.error(err.response?.data?.error || 'Upgrade failed'); }
  }

  const accountCodes = codes.filter(c => c.producttype < 100);
  const maintenanceCodes = codes.filter(c => c.producttype >= 100);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Upgrade Account</h1>

      {/* Current Account Info */}
      <div className="card mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-primary-100 text-primary-700 rounded-xl flex items-center justify-center font-bold text-lg">{user?.caccttype?.charAt(0)}</div>
          <div>
            <p className="text-sm text-gray-500">Current Account Type</p>
            <p className="text-xl font-bold text-gray-800">{user?.caccttype}</p>
          </div>
        </div>
      </div>

      {/* Transfer Section */}
      <div className="card mb-6">
        <h3 className="font-semibold text-gray-800 mb-3">Transfer Code to Account</h3>
        <form onSubmit={handleSearch} className="flex gap-3 mb-4">
          <input type="text" value={targetUsername} onChange={(e) => setTargetUsername(e.target.value)} className="input-field flex-1" placeholder="Enter username" />
          <button type="submit" className="btn-secondary whitespace-nowrap">Search</button>
        </form>
        {targetInfo && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-emerald-700">Target: <strong>{targetInfo.username}</strong></p>
          </div>
        )}
      </div>

      {/* Upgrade Codes */}
      {accountCodes.length > 0 && (
        <div className="card mb-6">
          <h3 className="font-semibold text-gray-800 mb-4">Available Upgrade Codes</h3>
          <div className="space-y-2">
            {accountCodes.map(c => (
              <div key={c.code} className="flex items-center justify-between py-3 px-4 border border-gray-100 rounded-lg">
                <div className="flex items-center gap-3">
                  <input type="checkbox" checked={selected.includes(c.code)} onChange={() => setSelected(prev => prev.includes(c.code) ? prev.filter(x => x !== c.code) : [...prev, c.code])} className="rounded" />
                  <div>
                    <p className="font-mono text-sm">{c.code}</p>
                    <p className="text-xs text-gray-500">{c.producttypeName}</p>
                  </div>
                </div>
                <button onClick={() => handleUpgrade(c.code)} className="text-xs bg-amber-100 text-amber-700 px-3 py-1.5 rounded-lg hover:bg-amber-200 font-medium">Upgrade</button>
              </div>
            ))}
          </div>
          {targetInfo && selected.length > 0 && (
            <button onClick={handleTransfer} className="btn-primary mt-4">Transfer {selected.length} Code(s)</button>
          )}
        </div>
      )}
    </div>
  );
}
