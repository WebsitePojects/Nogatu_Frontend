import { useState, useEffect } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';
import { HiOutlineKey, HiOutlineChevronLeft, HiOutlineChevronRight, HiOutlineLockClosed } from 'react-icons/hi';
import { useAuth } from '../../contexts/AuthContext';
import CodeUseConfirmModal from '../../components/CodeUseConfirmModal';
import { formatDateTimeManila } from '../../utils/dateTime';

const STATUS_STYLES = {
  0: { label: 'Unreleased', bg: 'rgba(100,116,139,0.1)', color: '#64748b', border: 'rgba(100,116,139,0.2)' },
  1: { label: 'Available',  bg: 'rgba(34,197,94,0.1)',   color: '#4ade80', border: 'rgba(34,197,94,0.2)'  },
  2: { label: 'Used',       bg: 'rgba(99,102,241,0.1)',  color: '#818cf8', border: 'rgba(99,102,241,0.2)' },
};

function Spinner() {
  return (
    <div className="flex justify-center py-12">
      <div className="size-8 rounded-full border-[3px] animate-spin" style={{ borderColor: 'rgba(212,175,55,0.12)', borderTopColor: '#D4AF37' }} />
    </div>
  );
}

export default function ActivationCodes() {
  const { user } = useAuth();
  const [codes, setCodes]           = useState([]);
  const [historyRows, setHistoryRows] = useState([]);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [loading, setLoading]       = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [selected, setSelected]     = useState([]);
  const [targetUsername, setTargetUsername] = useState('');
  const [resolvedTarget, setResolvedTarget] = useState(null); // {status,fullName,username}
  const [confirmModal, setConfirmModal] = useState(null);
  const [maintenancePoints, setMaintenancePoints] = useState(null);

  // Live name lookup: as the encoder types the target username, resolve + show the full
  // name so they're sure they're transferring to the right person (debounced).
  useEffect(() => {
    const u = targetUsername.trim();
    if (!u) { setResolvedTarget(null); return undefined; }
    setResolvedTarget({ status: 'loading' });
    const t = setTimeout(() => {
      api.get(`/codes/resolve-member?username=${encodeURIComponent(u)}`)
        .then((res) => setResolvedTarget({ status: 'ok', fullName: res.data?.fullName, username: res.data?.username }))
        .catch((err) => setResolvedTarget({ status: err.response?.status === 404 ? 'notfound' : 'error' }));
    }, 350);
    return () => clearTimeout(t);
  }, [targetUsername]);

  useEffect(() => { loadCodes(); }, [page]);
  useEffect(() => { loadHistory(); }, [historyPage]);
  useEffect(() => {
    // Hi-Five product purchases unlock only after 200 unilevel-maintenance points this month
    // (mirrors the backend gate on /codes/maintenance transType=2). Fetch the member's current
    // maintenance points so the Hi-Five action is disabled proactively, not just rejected on click.
    api.get('/hifive')
      .then((r) => setMaintenancePoints(Number(r.data?.summary?.maintenancePoints ?? 0)))
      .catch(() => setMaintenancePoints(null));
  }, []);

  const HIFIVE_THRESHOLD = 200;
  const hifiveUnlocked = maintenancePoints != null && maintenancePoints >= HIFIVE_THRESHOLD;
  const hifiveLockHint = maintenancePoints == null
    ? `Reach ${HIFIVE_THRESHOLD} unilevel-maintenance points this month to unlock Hi-Five.`
    : `Reach ${HIFIVE_THRESHOLD} unilevel-maintenance points this month to unlock Hi-Five (${maintenancePoints}/${HIFIVE_THRESHOLD}).`;

  async function loadCodes() {
    setLoading(true);
    try {
      const res = await api.get(`/codes?page=${page}`);
      setCodes(res.data.codes);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
    } catch { } finally { setLoading(false); }
  }

  async function loadHistory() {
    setHistoryLoading(true);
    try {
      const res = await api.get(`/codes/history?page=${historyPage}`);
      setHistoryRows(res.data.rows || []);
      setHistoryTotalPages(res.data.totalPages || 1);
    } catch {
      setHistoryRows([]);
    } finally {
      setHistoryLoading(false);
    }
  }

  function toggleSelect(code) {
    setSelected(prev => prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]);
  }

  function findCodeRecord(code) {
    return codes.find((entry) => entry.code === code) || null;
  }

  async function performTransfer() {
    if (!targetUsername) return toast.error('Enter a target username');
    if (selected.length === 0) return toast.error('Select at least one code');
    try {
      const res = await api.post('/codes/transfer', { targetUsername, codes: selected });
      toast.success(`${res.data.transferred} code(s) transferred to ${res.data.targetName}`);
      setSelected([]);
      setTargetUsername('');
      setConfirmModal(null);
      loadCodes();
      loadHistory();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Transfer failed');
    }
  }

  async function handleTransfer() {
    if (!targetUsername) return toast.error('Enter a target username');
    if (selected.length === 0) return toast.error('Select at least one code');

    // Resolve the target's full name first so the confirmation shows WHO the codes go to.
    // Also blocks the transfer if the username doesn't exist (avoids activating for the wrong person).
    let targetFullName = null;
    try {
      const { data } = await api.get(`/codes/resolve-member?username=${encodeURIComponent(targetUsername)}`);
      targetFullName = data?.fullName || null;
    } catch (err) {
      return toast.error(
        err.response?.status === 404
          ? `No member found with username "${targetUsername}". Double-check the username.`
          : 'Could not verify the target username. Please try again.'
      );
    }

    const selectedRows = selected.map((code) => findCodeRecord(code)).filter(Boolean);
    setConfirmModal({
      tone: 'gold',
      title: 'Transfer selected codes?',
      message: 'This will move the selected activation codes to the member below. Confirm the name matches the person you intend to activate for — this is recorded in the activation history.',
      confirmLabel: 'Transfer Codes',
      onConfirm: performTransfer,
      details: [
        { label: 'Target username', value: targetUsername },
        { label: 'Target name', value: targetFullName || '—' },
        { label: 'Codes selected', value: String(selected.length) },
        { label: 'Code types', value: selectedRows.map((row) => row.accountLabel || row.producttypeName).join(', ') || 'Selected codes' },
      ],
    });
  }

  async function performMaintenance(code, transType) {
    try {
      await api.post('/codes/maintenance', { code, transType });
      toast.success(transType === 2 ? 'Set as Hi-Five purchase' : 'Set as maintenance');
      setConfirmModal(null);
      loadCodes();
      loadHistory();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Activation failed');
    }
  }

  function handleMaintenance(code, transType) {
    if (transType === 2 && !hifiveUnlocked) {
      return toast.error(hifiveLockHint);
    }
    const codeRow = findCodeRecord(code);
    const isHiFive = transType === 2;
    setConfirmModal({
      tone: 'gold',
      title: isHiFive ? 'Use this code as a Hi-Five purchase?' : 'Use this code for maintenance?',
      message: isHiFive
        ? 'This code will be consumed and counted toward your Hi-Five Product Bonus qualification. This cannot be changed after confirmation.'
        : 'This code will be consumed and counted toward your monthly maintenance product points. This cannot be changed after confirmation.',
      confirmLabel: isHiFive ? 'Set as Hi-Five' : 'Set as Maintenance',
      onConfirm: () => performMaintenance(code, transType),
      details: [
        { label: 'Code', value: code },
        { label: 'Product', value: codeRow?.producttypeName || 'Maintenance code' },
        { label: 'Applied to', value: isHiFive ? 'Hi-Five purchase qualification' : 'Monthly maintenance points' },
      ],
    });
  }

  async function performUpgrade(code) {
    try {
      const res = await api.post('/codes/upgrade', { code });
      toast.success(`Account upgraded to ${res.data.newAccountTypeName}!`);
      setConfirmModal(null);
      loadCodes();
      loadHistory();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upgrade failed');
    }
  }

  function handleUpgrade(code) {
    const codeRow = findCodeRecord(code);
    setConfirmModal({
      tone: 'gold',
      title: 'Upgrade this account with the selected code?',
      message: 'This upgrade code will be consumed immediately and the account state will change based on the package and slot type tied to this code.',
      confirmLabel: 'Upgrade Account',
      onConfirm: () => performUpgrade(code),
      details: [
        { label: 'Code', value: code },
        { label: 'Account type', value: codeRow?.accountLabel || codeRow?.producttypeName || 'Upgrade code' },
        { label: 'Package amount', value: codeRow?.productamount ? `PHP ${Number(codeRow.productamount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'N/A' },
      ],
    });
  }

  const currentAccttype = Number(user?.currentaccttype || 0);

  return (
    <div className="space-y-6">
      <CodeUseConfirmModal
        open={Boolean(confirmModal)}
        tone={confirmModal?.tone || 'gold'}
        title={confirmModal?.title}
        message={confirmModal?.message}
        details={confirmModal?.details || []}
        confirmLabel={confirmModal?.confirmLabel || 'Confirm'}
        onConfirm={confirmModal?.onConfirm}
        onClose={() => setConfirmModal(null)}
      />

      {/* Heading */}
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Activation Codes</h1>
        <div className="w-10 h-0.5 mt-2 rounded-full" style={{ background: 'linear-gradient(90deg,#D4AF37,transparent)' }} />
      </div>

      {/* Transfer panel */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="font-display text-sm font-semibold text-white mb-4">Transfer Codes</h3>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-start">
          <div className="flex-1">
            <input
              type="text"
              value={targetUsername}
              onChange={(e) => setTargetUsername(e.target.value)}
              className="glass-input w-full"
              placeholder="Enter target username"
            />
            {resolvedTarget?.status === 'ok' && (
              <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: '#34d399' }}>
                ✓ <span className="font-semibold">{resolvedTarget.fullName}</span>
                <span style={{ color: 'rgba(255,255,255,0.4)' }}>@{resolvedTarget.username}</span>
              </p>
            )}
            {resolvedTarget?.status === 'loading' && (
              <p className="text-xs mt-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Checking…</p>
            )}
            {resolvedTarget?.status === 'notfound' && (
              <p className="text-xs mt-1.5" style={{ color: '#f87171' }}>No member with username “{targetUsername.trim()}”.</p>
            )}
          </div>
          <button
            onClick={handleTransfer}
            disabled={!targetUsername || selected.length === 0 || resolvedTarget?.status !== 'ok'}
            className="gold-btn py-2.5 px-5 rounded-xl text-sm whitespace-nowrap disabled:opacity-40"
           type="button">
            Transfer ({selected.length})
          </button>
        </div>
      </div>

      {/* Codes table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        {/* Table header bar */}
        <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: '1px solid rgba(212,175,55,0.08)' }}>
          <div className="flex items-center gap-2">
            <HiOutlineKey className="size-4" style={{ color: 'rgba(212,175,55,0.5)' }} />
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{total} codes total</p>
            {selected.length > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-lg" style={{ background: 'rgba(212,175,55,0.1)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.2)' }}>
                {selected.length} selected
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg disabled:opacity-30 hover:bg-white/[0.06] transition-colors"
              style={{ color: 'rgba(255,255,255,0.5)' }}
             type="button">
              <HiOutlineChevronLeft className="size-4" />
            </button>
            <span className="text-xs px-2 py-1 rounded-lg" style={{ background: 'rgba(212,175,55,0.08)', color: 'rgba(212,175,55,0.7)' }}>
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg disabled:opacity-30 hover:bg-white/[0.06] transition-colors"
              style={{ color: 'rgba(255,255,255,0.5)' }}
             type="button">
              <HiOutlineChevronRight className="size-4" />
            </button>
          </div>
        </div>

        {loading ? <Spinner /> : (
          <>
          {codes.some((c) => c.codestatus === 1 && Number(c.producttype) >= 100) && !hifiveUnlocked && (
            <div
              className="mx-4 mt-4 flex items-start gap-2 rounded-xl px-3 py-2.5 text-xs"
              style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.18)', color: 'rgba(147,197,253,0.95)' }}
              role="status"
            >
              <HiOutlineLockClosed className="size-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
              <span><strong className="font-semibold">Hi-Five locked.</strong> {hifiveLockHint}</span>
            </div>
          )}
          <div className="space-y-3 p-4 md:hidden">
            {codes.map((c) => {
              const statusStyle = STATUS_STYLES[c.codestatus] || STATUS_STYLES[0];
              const isSelected = selected.includes(c.code);
              return (
                <div
                  key={c.code}
                  className="rounded-2xl p-4 space-y-3"
                  style={{
                    background: isSelected ? 'rgba(212,175,55,0.06)' : 'rgba(255,255,255,0.02)',
                    border: isSelected ? '1px solid rgba(212,175,55,0.28)' : '1px solid rgba(212,175,55,0.08)',
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-mono text-xs break-all" style={{ color: 'rgba(212,175,55,0.8)', letterSpacing: '0.05em' }}>
                        {c.code}
                      </p>
                      <p className="text-sm mt-2 text-white">{c.producttypeName}</p>
                      <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>{c.accountLabel}</p>
                    </div>
                    <span
                      className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold flex-shrink-0"
                      style={{ background: statusStyle.bg, color: statusStyle.color, border: `1px solid ${statusStyle.border}` }}
                    >
                      {c.statusLabel}
                    </span>
                  </div>

                  {c.codestatus === 1 && (
                    <label className="flex items-center gap-2 text-xs" style={{ color: 'rgba(255,255,255,0.62)' }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(c.code)}
                        style={{ accentColor: '#D4AF37', cursor: 'pointer' }}
                      />
                      Select for transfer
                    </label>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {c.codestatus === 1 && c.producttype >= 100 && (
                      <>
                        <button
                          onClick={() => handleMaintenance(c.code, 1)}
                          className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
                          style={{ background: 'rgba(34,197,94,0.1)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.2)' }}
                         type="button">
                          Set as Maintenance
                        </button>
                        <button
                          onClick={() => handleMaintenance(c.code, 2)}
                          disabled={!hifiveUnlocked}
                          title={!hifiveUnlocked ? hifiveLockHint : undefined}
                          aria-label={!hifiveUnlocked ? `Set as Hi-Five — locked. ${hifiveLockHint}` : 'Set as Hi-Five'}
                          className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors inline-flex items-center gap-1"
                          style={{ background: 'rgba(59,130,246,0.1)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.2)', opacity: hifiveUnlocked ? 1 : 0.45, cursor: hifiveUnlocked ? 'pointer' : 'not-allowed' }}
                         type="button">
                          {!hifiveUnlocked && <HiOutlineLockClosed className="size-3.5" aria-hidden="true" />}
                          Set as Hi-Five
                        </button>
                      </>
                    )}
                    {c.codestatus === 1 && c.producttype < 100 && Number(c.producttype) > currentAccttype && (
                      <button
                        onClick={() => handleUpgrade(c.code)}
                        className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
                        style={{ background: 'rgba(212,175,55,0.1)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.2)' }}
                       type="button">
                        Upgrade
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            {codes.length === 0 && (
              <div className="py-10 text-center">
                <HiOutlineKey className="size-8 mx-auto mb-2" style={{ color: 'rgba(212,175,55,0.2)' }} />
                <p style={{ color: 'rgba(255,255,255,0.3)' }}>No activation codes found.</p>
              </div>
            )}
          </div>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm min-w-[580px]">
              <thead>
                <tr>
                  <th className="table-header py-3 px-4 w-12">Sel</th>
                  <th className="table-header py-3 px-4">Code</th>
                  <th className="table-header py-3 px-4">Product Type</th>
                  <th className="table-header py-3 px-4">Status</th>
                  <th className="table-header py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {codes.map((c, i) => {
                  const statusStyle = STATUS_STYLES[c.codestatus] || STATUS_STYLES[0];
                  const isSelected = selected.includes(c.code);
                  return (
                    <tr
                      key={c.code}
                      style={{
                        background: isSelected ? 'rgba(212,175,55,0.06)' : i % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent',
                        borderBottom: '1px solid rgba(212,175,55,0.05)',
                        borderLeft: isSelected ? '2px solid rgba(212,175,55,0.4)' : '2px solid transparent',
                      }}
                      className="hover:bg-white/[0.03] transition-colors"
                    >
                      <td className="py-3 px-4 text-center">
                        {c.codestatus === 1 && (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(c.code)}
                            style={{ accentColor: '#D4AF37', cursor: 'pointer' }}
                          />
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs" style={{ color: 'rgba(212,175,55,0.8)', letterSpacing: '0.05em' }}>
                        {c.code}
                      </td>
                      <td className="py-3 px-4 text-sm" style={{ color: 'rgba(255,255,255,0.65)' }}>{c.producttypeName}</td>
                      <td className="py-3 px-4">
                        <span
                          className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold"
                          style={{ background: statusStyle.bg, color: statusStyle.color, border: `1px solid ${statusStyle.border}` }}
                        >
                          {c.statusLabel}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {c.codestatus === 1 && c.producttype >= 100 && (
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => handleMaintenance(c.code, 1)}
                              className="text-xs px-2.5 py-1 rounded-lg font-medium transition-colors"
                              style={{ background: 'rgba(34,197,94,0.1)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.2)' }}
                              onMouseEnter={e => e.currentTarget.style.background = 'rgba(34,197,94,0.18)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'rgba(34,197,94,0.1)'}
                             type="button">
                              Set as Maintenance
                            </button>
                            <button
                              onClick={() => handleMaintenance(c.code, 2)}
                              disabled={!hifiveUnlocked}
                              title={!hifiveUnlocked ? hifiveLockHint : undefined}
                              aria-label={!hifiveUnlocked ? `Set as Hi-Five — locked. ${hifiveLockHint}` : 'Set as Hi-Five'}
                              className="text-xs px-2.5 py-1 rounded-lg font-medium transition-colors inline-flex items-center gap-1"
                              style={{ background: 'rgba(59,130,246,0.1)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.2)', opacity: hifiveUnlocked ? 1 : 0.45, cursor: hifiveUnlocked ? 'pointer' : 'not-allowed' }}
                              onMouseEnter={e => { if (hifiveUnlocked) e.currentTarget.style.background = 'rgba(59,130,246,0.18)'; }}
                              onMouseLeave={e => { if (hifiveUnlocked) e.currentTarget.style.background = 'rgba(59,130,246,0.1)'; }}
                             type="button">
                              {!hifiveUnlocked && <HiOutlineLockClosed className="size-3.5" aria-hidden="true" />}
                              Set as Hi-Five
                            </button>
                          </div>
                        )}
                        {c.codestatus === 1 && c.producttype < 100 && Number(c.producttype) > currentAccttype && (
                          <button
                            onClick={() => handleUpgrade(c.code)}
                            className="text-xs px-2.5 py-1 rounded-lg font-medium transition-colors"
                            style={{ background: 'rgba(212,175,55,0.1)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.2)' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(212,175,55,0.18)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(212,175,55,0.1)'}
                           type="button">
                            Upgrade
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {codes.length === 0 && (
                  <tr>
                    <td colSpan="5" className="py-14 text-center">
                      <HiOutlineKey className="size-8 mx-auto mb-2" style={{ color: 'rgba(212,175,55,0.2)' }} />
                      <p style={{ color: 'rgba(255,255,255,0.3)' }}>No activation codes found.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            </div>
          </>
        )}
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: '1px solid rgba(212,175,55,0.08)' }}>
          <div>
            <p className="text-sm font-semibold text-white">Code History</p>
            <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Release, transfer, upgrade, and repurchase actions tied to your codes.
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
              disabled={historyPage <= 1}
              className="p-1.5 rounded-lg disabled:opacity-30 hover:bg-white/[0.06] transition-colors"
              style={{ color: 'rgba(255,255,255,0.5)' }}
             type="button">
              <HiOutlineChevronLeft className="size-4" />
            </button>
            <span className="text-xs px-2 py-1 rounded-lg" style={{ background: 'rgba(212,175,55,0.08)', color: 'rgba(212,175,55,0.7)' }}>
              {historyPage} / {historyTotalPages}
            </span>
            <button
              onClick={() => setHistoryPage(p => Math.min(historyTotalPages, p + 1))}
              disabled={historyPage >= historyTotalPages}
              className="p-1.5 rounded-lg disabled:opacity-30 hover:bg-white/[0.06] transition-colors"
              style={{ color: 'rgba(255,255,255,0.5)' }}
             type="button">
              <HiOutlineChevronRight className="size-4" />
            </button>
          </div>
        </div>

        {historyLoading ? <Spinner /> : (
          <>
            <div className="space-y-3 p-4 md:hidden">
              {historyRows.map((row, i) => (
                <div
                  key={`${row.code}-${row.processKey || row.createdAt || i}`}
                  className="rounded-2xl p-4 space-y-3"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(212,175,55,0.08)' }}
                >
                  <div className="min-w-0">
                    <p className="font-mono text-xs break-all" style={{ color: 'rgba(212,175,55,0.8)' }}>{row.code}</p>
                    <span
                      className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold mt-2"
                      style={{ background: 'rgba(99,102,241,0.12)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.22)' }}
                    >
                      {row.eventLabel}
                    </span>
                  </div>
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.65)' }}>{row.summary}</p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
                    {formatDateTimeManila(row.createdAt)}
                  </p>
                </div>
              ))}
              {historyRows.length === 0 && (
                <div className="py-10 text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  No code history found yet.
                </div>
              )}
            </div>
            <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm min-w-[680px]">
              <thead>
                <tr>
                  {['Code', 'Event', 'Summary', 'Date'].map((heading) => (
                    <th key={heading} className="table-header py-3 px-4 text-left">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {historyRows.map((row, i) => (
                  <tr
                    key={`${row.code}-${row.processKey || row.createdAt || i}`}
                    style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent', borderBottom: '1px solid rgba(212,175,55,0.05)' }}
                  >
                    <td className="py-3 px-4 font-mono text-xs" style={{ color: 'rgba(212,175,55,0.8)' }}>{row.code}</td>
                    <td className="py-3 px-4">
                      <span
                        className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold"
                        style={{ background: 'rgba(99,102,241,0.12)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.22)' }}
                      >
                        {row.eventLabel}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm" style={{ color: 'rgba(255,255,255,0.65)' }}>{row.summary}</td>
                    <td className="py-3 px-4 text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
                      {formatDateTimeManila(row.createdAt)}
                    </td>
                  </tr>
                ))}
                {historyRows.length === 0 && (
                  <tr>
                    <td colSpan="4" className="py-12 text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>
                      No code history found yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          </>
        )}
      </div>
    </div>
  );
}
