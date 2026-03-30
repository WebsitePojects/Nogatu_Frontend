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

  const PaginationBtn = ({ onClick, disabled, children }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className="text-sm py-1.5 px-3 rounded-lg font-medium motion-safe:transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
      style={{
        background: 'rgba(212,175,55,0.08)',
        color: 'rgba(212,175,55,0.8)',
        border: '1px solid rgba(212,175,55,0.15)',
      }}
    >
      {children}
    </button>
  );

  return (
    <div>
      <div className="mb-7">
        <h1 className="font-display text-2xl font-bold text-white">Account Masterlist</h1>
        <div className="w-12 h-0.5 mt-2" style={{ background: 'linear-gradient(90deg,#D4AF37,transparent)' }} />
      </div>

      {/* Search */}
      <div className="glass-card rounded-2xl p-6 mb-6">
        <form onSubmit={handleSearch} className="flex gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="glass-input flex-1 rounded-xl px-4 py-2.5 text-sm"
            placeholder="Search by name..."
          />
          <button
            type="submit"
            className="gold-btn rounded-xl py-2.5 px-5 text-sm"
          >
            Search
          </button>
        </form>
      </div>

      {/* Table Card */}
      <div className="glass-card rounded-2xl p-6 overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>Accounts</p>
          <div className="flex items-center gap-2">
            <PaginationBtn onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>Prev</PaginationBtn>
            <span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{page} / {totalPages}</span>
            <PaginationBtn onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Next</PaginationBtn>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <div
              className="animate-spin rounded-full h-8 w-8 border-4"
              style={{ borderColor: 'rgba(212,175,55,0.15)', borderTopColor: 'rgba(212,175,55,0.75)' }}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  {['Account Name', 'Username', 'Code', 'Type', 'Entry', 'Date Reg', 'Actions'].map(h => (
                    <th key={h} className="table-header py-3 px-4 text-left font-semibold text-xs uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {accounts.map((a, idx) => (
                  <tr
                    key={a.uid}
                    className="motion-safe:transition-colors"
                    style={{
                      background: idx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(212,175,55,0.05)'}
                    onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent'}
                  >
                    <td className="py-3 px-4 font-medium text-white/80">{a.fullname}</td>
                    <td className="py-3 px-4 text-white/60">{a.username}</td>
                    <td className="py-3 px-4 font-mono text-xs text-white/60">{a.activationcode}</td>
                    <td className="py-3 px-4">
                      <span
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        style={{ background: 'rgba(212,175,55,0.12)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.2)' }}
                      >
                        {a.accttypeName}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-white/40">{a.entryType}</td>
                    <td className="py-3 px-4 text-xs text-white/40">{a.datereg}</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => navigate(`/admin/accounts/${a.uid}`)}
                          className="text-xs px-2.5 py-1 rounded-lg font-medium motion-safe:transition-colors cursor-pointer"
                          style={{ background: 'rgba(212,175,55,0.12)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.2)' }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => navigate(`/admin/genealogy?id=${a.uid}`)}
                          className="text-xs px-2.5 py-1 rounded-lg font-medium motion-safe:transition-colors cursor-pointer"
                          style={{ background: 'rgba(16,185,129,0.1)', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)' }}
                        >
                          Tree
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {accounts.length === 0 && (
                  <tr>
                    <td colSpan="7" className="py-12 text-center" style={{ color: 'rgba(255,255,255,0.25)' }}>
                      No accounts found.
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
