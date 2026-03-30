import { useState, useEffect } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { HiOutlineArrowUp, HiOutlineSearch } from 'react-icons/hi';

function Spinner() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <div className="w-10 h-10 rounded-full border-[3px] animate-spin" style={{ borderColor: 'rgba(212,175,55,0.12)', borderTopColor: '#D4AF37' }} />
    </div>
  );
}

export default function UpgradeAccount() {
  const { user, checkSession } = useAuth();
  const [codes, setCodes]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [targetUsername, setTargetUsername] = useState('');
  const [targetInfo, setTargetInfo]   = useState(null);
  const [selected, setSelected]     = useState([]);

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
      setSelected([]); setTargetInfo(null); setTargetUsername('');
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

  const toggleSelect = (code) =>
    setSelected(prev => prev.includes(code) ? prev.filter(x => x !== code) : [...prev, code]);

  const accountCodes     = codes.filter(c => c.producttype < 100);
  const maintenanceCodes = codes.filter(c => c.producttype >= 100);

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Upgrade Account</h1>
        <div className="w-10 h-0.5 mt-2 rounded-full" style={{ background: 'linear-gradient(90deg,#D4AF37,transparent)' }} />
      </div>

      {/* Current account type */}
      <div className="glass-card rounded-2xl p-5 flex items-center gap-4">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-[#080604] font-bold text-lg flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, #9A7B0A, #D4AF37)',
            boxShadow: '0 6px 20px rgba(212,175,55,0.3)',
          }}
        >
          {user?.caccttype?.charAt(0)}
        </div>
        <div>
          <p className="text-xs mb-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Current Account Type</p>
          <p className="text-xl font-bold gold-text">{user?.caccttype}</p>
        </div>
      </div>

      {/* Transfer section */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="font-display text-base font-semibold text-white mb-4">Transfer Code to Account</h3>
        <form onSubmit={handleSearch} className="flex gap-3 mb-4">
          <input
            type="text"
            value={targetUsername}
            onChange={(e) => setTargetUsername(e.target.value)}
            className="glass-input flex-1"
            placeholder="Enter target username"
          />
          <button
            type="submit"
            className="gold-btn-outline px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 whitespace-nowrap"
          >
            <HiOutlineSearch className="w-4 h-4" />
            Search
          </button>
        </form>

        {targetInfo && (
          <div
            className="flex items-center gap-2.5 p-3 rounded-xl mb-2 text-sm"
            style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}
          >
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#4ade80', boxShadow: '0 0 6px rgba(74,222,128,0.6)' }} />
            <span style={{ color: '#4ade80' }}>Target: <strong>{targetInfo.username}</strong></span>
          </div>
        )}
      </div>

      {/* Available upgrade codes */}
      {accountCodes.length > 0 && (
        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-display text-base font-semibold text-white mb-4">Available Upgrade Codes</h3>
          <div className="space-y-2">
            {accountCodes.map(c => (
              <div
                key={c.code}
                className="flex items-center justify-between py-3 px-4 rounded-xl transition-colors"
                style={{ background: selected.includes(c.code) ? 'rgba(212,175,55,0.08)' : 'rgba(255,255,255,0.02)', border: `1px solid ${selected.includes(c.code) ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.05)'}` }}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selected.includes(c.code)}
                    onChange={() => toggleSelect(c.code)}
                    className="rounded"
                    style={{ accentColor: '#D4AF37' }}
                  />
                  <div>
                    <p className="font-mono text-sm text-white/85">{c.code}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'rgba(212,175,55,0.5)' }}>{c.producttypeName}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleUpgrade(c.code)}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                  style={{ background: 'rgba(212,175,55,0.1)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.2)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(212,175,55,0.18)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(212,175,55,0.1)'; }}
                >
                  <HiOutlineArrowUp className="w-3.5 h-3.5" />
                  Upgrade
                </button>
              </div>
            ))}
          </div>

          {targetInfo && selected.length > 0 && (
            <button onClick={handleTransfer} className="gold-btn py-2.5 px-6 rounded-xl text-sm mt-4">
              Transfer {selected.length} Code{selected.length > 1 ? 's' : ''}
            </button>
          )}
        </div>
      )}

      {accountCodes.length === 0 && (
        <div className="glass-card rounded-2xl p-12 text-center">
          <HiOutlineArrowUp className="w-8 h-8 mx-auto mb-3" style={{ color: 'rgba(212,175,55,0.2)' }} />
          <p style={{ color: 'rgba(255,255,255,0.3)' }}>No upgrade codes available.</p>
        </div>
      )}
    </div>
  );
}
