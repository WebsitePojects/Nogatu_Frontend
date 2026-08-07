import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { HiOutlineSearch, HiOutlineTicket, HiOutlineUsers, HiOutlineCheckCircle, HiOutlineX, HiOutlineEye } from 'react-icons/hi';

const PACKAGE_LABELS = {
  10: 'Bronze',
  20: 'Silver',
  30: 'Gold',
  40: 'Platinum',
  50: 'Garnet',
  60: 'Diamond',
};

const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const VOUCHER_STATUS_MAP = { 1: 'Active', 2: 'Expired', 3: 'Fully Used', 4: 'Suspended' };
const VOUCHER_STATUS_STYLES = {
  1: { color: '#34d399', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)' },
  2: { color: '#fbbf24', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)' },
  3: { color: '#93c5fd', background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)' },
  4: { color: '#f87171', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' },
};

export default function VoucherGrant() {
  const navigate = useNavigate();
  const { admin } = useAuth();
  const isCashier = Number(admin?.rights) === 2;

  const [loading, setLoading] = useState(true);
  const [granting, setGranting] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [rows, setRows] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [multiSelect, setMultiSelect] = useState(false);
  const [selected, setSelected] = useState([]);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    loadCandidates();
  }, [page, search]);

  const selectedOnPage = useMemo(
    () => rows.filter((r) => !r.hasVoucher && selected.includes(r.uid)).length,
    [rows, selected]
  );

  const selectedRows = useMemo(
    () => rows.filter((r) => !r.hasVoucher && selected.includes(r.uid)),
    [rows, selected]
  );

  const selectedVoucherTotal = useMemo(
    () => selectedRows.reduce((sum, row) => sum + Number(row.voucherAmount || 0), 0),
    [selectedRows]
  );

  async function loadCandidates() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (search.trim()) params.set('search', search.trim());
      if (isCashier) params.set('includeAll', '1');

      const res = await api.get(`/admin/voucher-management/grant-candidates?${params.toString()}`);
      setRows(res.data.users || []);
      setTotalPages(Number(res.data.totalPages || 1));
      setTotal(Number(res.data.total || 0));

      setSelected((prev) => prev.filter((uid) => (res.data.users || []).some((r) => r.uid === uid && !r.hasVoucher)));
    } catch {
      setRows([]);
      setTotalPages(1);
      setTotal(0);
      setSelected([]);
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e) {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  function handleRowClick(row) {
    if (row.hasVoucher) return;
    const uid = row.uid;

    setSelected((prev) => {
      if (multiSelect) {
        return prev.includes(uid)
          ? prev.filter((id) => id !== uid)
          : [...prev, uid];
      }

      if (prev.length === 1 && prev[0] === uid) {
        return [];
      }
      return [uid];
    });
  }

  function toggleSelectAllPage() {
    const pageUids = rows.filter((row) => !row.hasVoucher).map((row) => row.uid);
    const allSelected = pageUids.length > 0 && pageUids.every((uid) => selected.includes(uid));

    setSelected((prev) => {
      if (allSelected) {
        return prev.filter((uid) => !pageUids.includes(uid));
      }
      return Array.from(new Set([...prev, ...pageUids]));
    });
  }

  async function handleGrantSelected() {
    if (selectedRows.length === 0) {
      toast.error('Select at least one user account');
      return;
    }

    setConfirmOpen(false);
    setGranting(true);
    try {
      const res = await api.post('/admin/voucher-management/grant', { uids: selectedRows.map((row) => row.uid) });
      const granted = Number(res.data.granted || 0);
      const skipped = Number(res.data.skippedCount || 0);

      if (granted > 0) {
        toast.success(`Granted ${granted} voucher(s) successfully`);
      }
      if (skipped > 0) {
        toast(`${skipped} account(s) skipped because they are no longer eligible`, { icon: '⚠️' });
      }

      setSelected([]);
      await loadCandidates();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to grant vouchers');
    } finally {
      setGranting(false);
    }
  }

  function openGrantConfirm() {
    if (selectedRows.length === 0) {
      toast.error('Select at least one user account');
      return;
    }
    setConfirmOpen(true);
  }

  function goToVoucherAvailment(row) {
    if (!row.voucherId) return;
    navigate(`/admin/voucher-management?voucherId=${row.voucherId}&mode=add`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Voucher Management</h1>
        <div className="w-12 h-0.5 mt-2" style={{ background: 'linear-gradient(90deg,#D4AF37,transparent)' }} />
      </div>

      <div className="glass-card rounded-2xl p-2 flex items-center gap-2">
        <button
          onClick={() => navigate('/admin/voucher-management')}
          className="px-3 py-2 rounded-lg text-sm font-semibold"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.75)',
          }}
         type="button">
          Voucher List
        </button>
        <button
          className="px-3 py-2 rounded-lg text-sm font-semibold"
          style={{
            background: 'rgba(212,175,55,0.16)',
            border: '1px solid rgba(212,175,55,0.3)',
            color: '#D4AF37',
          }}
         type="button">
          Grant Vouchers
        </button>
      </div>

      {isCashier ? (
        <div className="glass-card rounded-2xl p-4 text-sm" style={{ border: '1px solid rgba(212,175,55,0.2)', color: 'rgba(255,255,255,0.75)', background: 'rgba(212,175,55,0.06)' }}>
          <span style={{ color: '#D4AF37', fontWeight: 600 }}>Cashier view:</span> Select members without vouchers to grant one, or click Transact for existing voucher balances to record ER-traced availments.
        </div>
      ) : (
        <div className="glass-card rounded-2xl p-4 text-sm" style={{ border: '1px solid rgba(212,175,55,0.2)', color: 'rgba(255,255,255,0.75)', background: 'rgba(212,175,55,0.06)' }}>
          <span style={{ color: '#D4AF37', fontWeight: 600 }}>Showing upgraded accounts only.</span>{' '}
          This list is limited to members whose package changed and who have no voucher for their
          current package. Accounts still on their original package are not listed, and members who
          already hold a voucher for their current package drop off automatically once granted.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <HiOutlineUsers className="size-5" style={{ color: '#93c5fd' }} />
            <p className="text-xs uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.5)' }}>
              {isCashier ? 'All Members' : 'Eligible Accounts'}
            </p>
          </div>
          <p className="text-2xl font-bold text-white">{Number(total || 0).toLocaleString()}</p>
        </div>
        <div className="glass-card rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <HiOutlineCheckCircle className="size-5" style={{ color: '#34d399' }} />
            <p className="text-xs uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.5)' }}>Selected</p>
          </div>
          <p className="text-2xl font-bold text-white">{selectedRows.length}</p>
        </div>
        <div className="glass-card rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <HiOutlineTicket className="size-5" style={{ color: '#D4AF37' }} />
            <p className="text-xs uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.5)' }}>Selection Mode</p>
          </div>
          <p className="text-base font-semibold text-white">{multiSelect ? 'Multi Select' : 'Single Select'}</p>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-4 space-y-3">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4" style={{ color: 'rgba(255,255,255,0.35)' }} />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search username, name, or uid..."
              className="w-full pl-9 pr-3 py-2 rounded-lg text-sm text-white placeholder-white/30 outline-none"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg text-sm font-semibold"
            style={{ background: 'rgba(212,175,55,0.15)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.3)' }}
          >
            Search
          </button>
        </form>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setMultiSelect((prev) => {
                  const next = !prev;
                  if (!next && selected.length > 1) {
                    setSelected([selected[0]]);
                  }
                  return next;
                });
              }}
              className="text-xs px-3 py-1.5 rounded-lg font-semibold"
              style={
                multiSelect
                  ? { background: 'rgba(212,175,55,0.16)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.3)' }
                  : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.1)' }
              }
             type="button">
              {multiSelect ? 'Exit Multi Select' : 'Multi Select'}
            </button>

            {multiSelect && (
              <button
                onClick={toggleSelectAllPage}
                className="text-xs px-3 py-1.5 rounded-lg font-semibold"
                style={{ background: 'rgba(59,130,246,0.12)', color: '#93c5fd', border: '1px solid rgba(59,130,246,0.25)' }}
               type="button">
                {selectedOnPage === rows.filter((row) => !row.hasVoucher).length && selectedOnPage > 0 ? 'Unselect Page' : 'Select Eligible Page'}
              </button>
            )}

            <button
              onClick={openGrantConfirm}
              disabled={selectedRows.length === 0 || granting}
              className="text-xs px-3 py-1.5 rounded-lg font-semibold disabled:opacity-50"
              style={{ background: 'rgba(16,185,129,0.16)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)' }}
             type="button">
              {granting ? 'Granting...' : `Review & Grant${selectedRows.length > 0 ? ` (${selectedRows.length})` : ''}`}
            </button>
          </div>
      </div>

      <div className="glass-card rounded-2xl p-6 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="size-8 rounded-full border-4 animate-spin" style={{ borderColor: 'rgba(212,175,55,0.15)', borderTopColor: '#D4AF37' }} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  {[
                    '',
                    'UID', 'Username', 'Full Name', isCashier ? 'Package' : 'Package (Joined → Now)',
                    isCashier ? 'Voucher Status' : 'Voucher Amount',
                    isCashier ? 'Remaining' : 'Date Registered',
                    isCashier ? '' : null,
                  ].filter(h => h !== null).map((h, i) => (
                    <th key={i} className="table-header p-3 text-left text-xs uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => {
                  const active = selected.includes(row.uid);
                  const vsStyle = row.hasVoucher ? (VOUCHER_STATUS_STYLES[row.voucherStatus] || VOUCHER_STATUS_STYLES[1]) : null;
                  const selectable = !row.hasVoucher;
                  return (
                    <tr
                      key={row.uid}
                      onClick={() => handleRowClick(row)}
                      className={`transition-colors ${selectable ? 'cursor-pointer' : ''}`}
                      style={{
                        background: active
                          ? 'rgba(212,175,55,0.16)'
                          : index % 2 === 0
                            ? 'rgba(255,255,255,0.02)'
                            : 'transparent',
                        opacity: selectable ? 1 : 0.88,
                      }}
                    >
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={active}
                          disabled={!selectable}
                          onChange={() => handleRowClick(row)}
                          onClick={(e) => e.stopPropagation()}
                          style={{ accentColor: '#D4AF37' }}
                        />
                      </td>
                      <td className="p-3 text-white/70 font-mono text-xs">{row.uid}</td>
                      <td className="p-3 text-white/85 font-semibold">{row.username}</td>
                      <td className="p-3 text-white/70">{row.fullname || 'N/A'}</td>
                      <td className="p-3 text-white/70">
                        {!isCashier && row.joinedAccttype && row.joinedAccttype !== row.accttype ? (
                          <span
                            className="inline-flex items-center gap-1.5"
                            aria-label={`Joined as ${PACKAGE_LABELS[row.joinedAccttype] || row.joinedAccttype}, now ${PACKAGE_LABELS[row.accttype] || row.accttype}`}
                          >
                            <span style={{ color: 'rgba(255,255,255,0.45)' }}>
                              {PACKAGE_LABELS[row.joinedAccttype] || row.joinedAccttype}
                            </span>
                            <span aria-hidden="true" style={{ color: 'rgba(255,255,255,0.3)' }}>→</span>
                            <span style={{ color: '#D4AF37', fontWeight: 600 }}>
                              {PACKAGE_LABELS[row.accttype] || row.accttype}
                            </span>
                          </span>
                        ) : (
                          PACKAGE_LABELS[row.accttype] || row.accttype
                        )}
                      </td>
                      {isCashier ? (
                        <>
                          <td className="p-3">
                            {row.hasVoucher ? (
                              <span className="inline-block text-xs px-2.5 py-0.5 rounded-full" style={vsStyle}>
                                {VOUCHER_STATUS_MAP[row.voucherStatus] || 'Active'}
                              </span>
                            ) : (
                              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>No Voucher</span>
                            )}
                          </td>
                          <td className="p-3 font-mono" style={{ color: row.hasVoucher ? '#D4AF37' : 'rgba(255,255,255,0.35)' }}>
                            {row.hasVoucher ? `₱${fmt(row.voucherRemaining)}` : '—'}
                          </td>
                          <td className="p-3">
                            {row.hasVoucher && (
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  goToVoucherAvailment(row);
                                }}
                                className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg"
                                style={{ background: 'rgba(212,175,55,0.12)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.25)' }}
                                title="Add ER-traced voucher availment"
                              >
                                <HiOutlineEye className="size-3.5" />
                                Transact
                              </button>
                            )}
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="p-3 font-semibold" style={{ color: '#D4AF37' }}>₱{fmt(row.voucherAmount)}</td>
                          <td className="p-3 text-white/50 text-xs">{row.datereg || '—'}</td>
                        </>
                      )}
                    </tr>
                  );
                })}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 px-4 text-center">
                      {isCashier ? (
                        <p style={{ color: 'rgba(255,255,255,0.4)' }}>
                          {search.trim() ? `No members match "${search.trim()}".` : 'No members found.'}
                        </p>
                      ) : (
                        <div className="mx-auto max-w-md space-y-2">
                          <p className="font-semibold" style={{ color: 'rgba(255,255,255,0.75)' }}>
                            {search.trim()
                              ? `No upgraded account matches "${search.trim()}".`
                              : 'No accounts are currently awaiting a voucher.'}
                          </p>
                          {/* An admin searching a specific member needs to know WHY they are absent.
                              Without this, "no results" reads as a broken search rather than the
                              member simply not qualifying. */}
                          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                            A member appears here only if <strong style={{ color: 'rgba(255,255,255,0.7)' }}>both</strong> are true:
                            their package changed from the one they joined with, and they have no
                            voucher for that new package yet.
                          </p>
                          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                            A member who never upgraded, or who already received the voucher for
                            their current package, will not be listed. Check their vouchers in the
                            Voucher List tab.
                          </p>
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 mt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="text-sm py-1.5 px-3 rounded-lg font-medium disabled:opacity-40"
            style={{ background: 'rgba(212,175,55,0.08)', color: 'rgba(212,175,55,0.85)', border: '1px solid rgba(212,175,55,0.15)' }}
           type="button">
            Prev
          </button>
          <span className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>{page} / {totalPages || 1}</span>
          <button
            onClick={() => setPage((p) => Math.min(Number(totalPages || 1), p + 1))}
            disabled={page >= Number(totalPages || 1)}
            className="text-sm py-1.5 px-3 rounded-lg font-medium disabled:opacity-40"
            style={{ background: 'rgba(212,175,55,0.08)', color: 'rgba(212,175,55,0.85)', border: '1px solid rgba(212,175,55,0.15)' }}
           type="button">
            Next
          </button>
        </div>
      </div>

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="w-full max-w-3xl max-h-[85vh] flex flex-col rounded-2xl" style={{ background: '#141008', border: '1px solid rgba(212,175,55,0.25)' }}>
            <div className="flex items-center justify-between p-6 pb-4 shrink-0">
              <h2 className="font-display text-xl text-white">Confirm Voucher Grant</h2>
              <button
                onClick={() => setConfirmOpen(false)}
                className="text-white/60 hover:text-white p-1"
                aria-label="Close confirmation modal"
               type="button">
                <HiOutlineX className="size-5" />
              </button>
            </div>

            <div className="px-6 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl p-3" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                <p className="text-xs uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.5)' }}>Selected Accounts</p>
                <p className="text-2xl font-bold" style={{ color: '#34d399' }}>{selectedRows.length}</p>
              </div>
              <div className="rounded-xl p-3" style={{ background: 'rgba(212,175,55,0.10)', border: '1px solid rgba(212,175,55,0.22)' }}>
                <p className="text-xs uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.5)' }}>Total Voucher Value</p>
                <p className="text-2xl font-bold" style={{ color: '#D4AF37' }}>₱{fmt(selectedVoucherTotal)}</p>
              </div>
            </div>

            <div className="px-6 pb-4 text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
              Voucher amount is auto-calculated by package type for each selected account.
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      {['UID', 'Username', 'Full Name', 'Package (Joined → Now)', 'Voucher Amount'].map((h) => (
                        <th key={h} className="table-header py-2.5 px-3 text-left text-xs uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {selectedRows.map((row) => (
                      <tr key={row.uid} className="hover:bg-white/[0.04] transition-colors">
                        <td className="py-2.5 px-3 text-white/70 font-mono text-xs">{row.uid}</td>
                        <td className="py-2.5 px-3 text-white/85 font-semibold">{row.username}</td>
                        <td className="py-2.5 px-3 text-white/70">{row.fullname || 'N/A'}</td>
                        <td className="py-2.5 px-3 text-white/70">
                          {row.joinedAccttype && row.joinedAccttype !== row.accttype ? (
                            <span
                              className="inline-flex items-center gap-1.5"
                              aria-label={`Joined as ${PACKAGE_LABELS[row.joinedAccttype] || row.joinedAccttype}, now ${PACKAGE_LABELS[row.accttype] || row.accttype}`}
                            >
                              <span style={{ color: 'rgba(255,255,255,0.45)' }}>
                                {PACKAGE_LABELS[row.joinedAccttype] || row.joinedAccttype}
                              </span>
                              <span aria-hidden="true" style={{ color: 'rgba(255,255,255,0.3)' }}>→</span>
                              <span style={{ color: '#D4AF37', fontWeight: 600 }}>
                                {PACKAGE_LABELS[row.accttype] || row.accttype}
                              </span>
                            </span>
                          ) : (
                            PACKAGE_LABELS[row.accttype] || row.accttype
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-semibold" style={{ color: '#D4AF37' }}>₱{fmt(row.voucherAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-6 pt-4 flex items-center justify-end gap-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <button
                onClick={() => setConfirmOpen(false)}
                className="text-xs px-3 py-2 rounded-lg"
                style={{ background: 'rgba(255,255,255,0.1)', color: '#f3f4f6', border: '1px solid rgba(255,255,255,0.2)' }}
               type="button">
                Cancel
              </button>
              <button
                onClick={handleGrantSelected}
                disabled={granting}
                className="text-xs px-4 py-2 rounded-lg font-semibold disabled:opacity-50"
                style={{ background: 'rgba(16,185,129,0.16)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)' }}
               type="button">
                {granting ? 'Granting...' : 'Confirm Grant'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
