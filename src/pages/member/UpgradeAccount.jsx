import { useState, useEffect, useMemo } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { HiOutlineArrowUp, HiOutlineSearch, HiOutlineSparkles, HiOutlineShieldCheck } from 'react-icons/hi';
import CodeUseConfirmModal from '../../components/CodeUseConfirmModal';

const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtInt = (n) => Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 0 });

function Spinner() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <div className="w-10 h-10 rounded-full border-[3px] animate-spin" style={{ borderColor: 'rgba(212,175,55,0.12)', borderTopColor: '#D4AF37' }} />
    </div>
  );
}

function packageCardTone(packageName) {
  const map = {
    Bronze: { border: 'rgba(201,115,46,0.35)', glow: 'rgba(201,115,46,0.14)', accent: '#E59A57' },
    Silver: { border: 'rgba(184,194,204,0.35)', glow: 'rgba(184,194,204,0.14)', accent: '#E5ECF3' },
    Gold: { border: 'rgba(225,183,59,0.35)', glow: 'rgba(225,183,59,0.16)', accent: '#F9E08A' },
    Platinum: { border: 'rgba(111,176,182,0.35)', glow: 'rgba(111,176,182,0.14)', accent: '#BDE3E7' },
    Garnet: { border: 'rgba(168,37,59,0.35)', glow: 'rgba(168,37,59,0.14)', accent: '#E4697D' },
    Diamond: { border: 'rgba(92,207,255,0.35)', glow: 'rgba(92,207,255,0.14)', accent: '#D9F6FF' },
  };
  return map[packageName] || map.Bronze;
}

export default function UpgradeAccount() {
  const { user, refreshUser } = useAuth();
  const { isDarkMode } = useTheme();
  const [codes, setCodes] = useState([]);
  const [packagePolicies, setPackagePolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [targetUsername, setTargetUsername] = useState('');
  const [targetInfo, setTargetInfo] = useState(null);
  const [selected, setSelected] = useState([]);
  const [confirmModal, setConfirmModal] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const [codesRes, packagesRes] = await Promise.all([
          api.get('/codes?page=1'),
          api.get('/account/package-policies'),
        ]);
        if (!mounted) return;
        setCodes((codesRes.data.codes || []).filter((c) => c.codestatus === 1));
        setPackagePolicies(packagesRes.data.packages || []);
      } catch {
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  async function loadCodes() {
    try {
      const res = await api.get('/codes?page=1');
      setCodes((res.data.codes || []).filter((c) => c.codestatus === 1));
    } catch {}
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
    } catch {
      toast.error('Search failed');
    }
  }

  function findCodeRecord(code) {
    return codes.find((entry) => entry.code === code) || null;
  }

  async function performTransfer() {
    if (!targetInfo || selected.length === 0) return;
    try {
      const res = await api.post('/codes/transfer', { targetUsername: targetInfo.username, codes: selected });
      toast.success(`${res.data.transferred} code(s) transferred`);
      setSelected([]);
      setTargetInfo(null);
      setTargetUsername('');
      setConfirmModal(null);
      loadCodes();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Transfer failed');
    }
  }

  function handleTransfer() {
    if (!targetInfo || selected.length === 0) return;
    const selectedRows = selected.map((code) => findCodeRecord(code)).filter(Boolean);
    setConfirmModal({
      tone: 'gold',
      title: 'Transfer selected upgrade codes?',
      message: 'These codes will be moved to the target account and the transfer will be permanently logged in the activation history.',
      confirmLabel: 'Transfer Codes',
      onConfirm: performTransfer,
      details: [
        { label: 'Target username', value: targetInfo.username },
        { label: 'Codes selected', value: String(selected.length) },
        { label: 'Code types', value: selectedRows.map((row) => row.accountLabel || row.producttypeName).join(', ') || 'Selected codes' },
      ],
    });
  }

  async function performUpgrade(code) {
    try {
      const res = await api.post('/codes/upgrade', { code });
      toast.success(`Upgraded to ${res.data.newAccountTypeName}!`);
      await refreshUser();
      setConfirmModal(null);
      loadCodes();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upgrade failed');
    }
  }

  function handleUpgrade(code) {
    const codeRow = findCodeRecord(code);
    setConfirmModal({
      tone: 'gold',
      title: 'Use this upgrade code now?',
      message: 'This code will be consumed immediately and the account tier will change according to the package and slot type attached to this code.',
      confirmLabel: 'Upgrade Account',
      onConfirm: () => performUpgrade(code),
      details: [
        { label: 'Code', value: code },
        { label: 'Account type', value: codeRow?.accountLabel || codeRow?.producttypeName || 'Upgrade code' },
        { label: 'Package amount', value: codeRow?.productamount ? `PHP ${fmt(codeRow.productamount)}` : 'N/A' },
      ],
    });
  }

  const toggleSelect = (code) => {
    setSelected((prev) => (prev.includes(code) ? prev.filter((x) => x !== code) : [...prev, code]));
  };

  const currentAccttype = Number(user?.currentaccttype || 0);
  const accountCodes = codes.filter((c) => c.producttype < 100 && Number(c.producttype) > currentAccttype);
  const currentPolicy = useMemo(
    () => packagePolicies.find((pkg) => Number(pkg.packageType) === currentAccttype) || null,
    [packagePolicies, currentAccttype]
  );
  const headingTone = isDarkMode ? 'text-white' : 'text-slate-900';
  const labelTone = isDarkMode ? 'rgba(255,255,255,0.48)' : '#64748b';
  const bodyTone = isDarkMode ? 'rgba(255,255,255,0.74)' : '#475569';
  const panelBg = isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(241,245,249,0.92)';
  const panelBorder = isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(203,213,225,0.78)';
  const panelText = isDarkMode ? 'text-white' : 'text-slate-900';
  const nestedPanelBg = isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(248,250,252,0.95)';

  if (loading) return <Spinner />;

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

      <div>
        <h1 className={`portal-page-title font-display text-2xl font-bold ${headingTone}`}>Upgrade Account</h1>
        <div className="w-10 h-0.5 mt-2 rounded-full" style={{ background: 'linear-gradient(90deg,#D4AF37,transparent)' }} />
      </div>

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
        <div className="min-w-0">
          <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: labelTone }}>Current Package</p>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xl font-bold gold-text">{user?.caccttype}</p>
            <span
              className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold"
              style={{
                background: isDarkMode ? 'rgba(212,175,55,0.12)' : 'rgba(212,175,55,0.14)',
                color: isDarkMode ? '#D4AF37' : '#8b6508',
                border: '1px solid rgba(212,175,55,0.24)',
              }}
            >
              Active Tier
            </span>
          </div>
          {currentPolicy && (
            <p className="mt-1 text-sm" style={{ color: bodyTone }}>
              {currentPolicy.rankingEligible
                ? `Ranks up to ${currentPolicy.rankingMaxLabel || 'published ceiling'}`
                : 'Ranking is locked until Gold'}
            </p>
          )}
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-start gap-3">
          <span
            className="inline-flex items-center justify-center w-10 h-10 rounded-2xl"
            style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.18)', color: '#D4AF37' }}
          >
            <HiOutlineShieldCheck className="w-5 h-5" />
          </span>
          <div>
            <h3 className={`font-display text-base font-semibold ${panelText}`}>Package Benefit Ladder</h3>
            <p className="text-sm mt-1" style={{ color: bodyTone }}>
              Each package now has its own benefit ceiling, coverage depth, and upgrade path so members can clearly see why moving upward matters.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-5">
          {packagePolicies.map((pkg) => {
            const tone = packageCardTone(pkg.packageLabel);
            const isCurrent = Number(pkg.packageType) === currentAccttype;
            const isUpgradeable = Number(pkg.packageType) > currentAccttype;
            return (
              <div
                key={pkg.packageType}
                className="rounded-2xl p-5"
                style={{
                  background: panelBg,
                  border: `1px solid ${isCurrent ? tone.accent : tone.border}`,
                  boxShadow: isCurrent ? `0 0 0 1px ${tone.accent}, 0 16px 32px ${tone.glow}` : `0 10px 24px ${tone.glow}`,
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className={`text-lg font-bold ${panelText}`}>{pkg.packageLabel}</p>
                    <p className="text-xs mt-1" style={{ color: labelTone }}>PHP {fmt(pkg.packageAmount)} package</p>
                  </div>
                  <span
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                    style={{
                      background: isCurrent ? 'rgba(212,175,55,0.12)' : isUpgradeable ? 'rgba(74,222,128,0.12)' : (isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(148,163,184,0.12)'),
                      color: isCurrent ? '#D4AF37' : isUpgradeable ? '#16a34a' : (isDarkMode ? 'rgba(255,255,255,0.68)' : '#475569'),
                      border: `1px solid ${isCurrent ? 'rgba(212,175,55,0.22)' : isUpgradeable ? 'rgba(74,222,128,0.22)' : panelBorder}`,
                    }}
                  >
                    {isCurrent ? 'Current Package' : isUpgradeable ? 'Upgrade Target' : 'Lower Tier'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
                  <div className="rounded-xl p-3" style={{ background: nestedPanelBg, border: `1px solid ${panelBorder}` }}>
                    <p style={{ color: labelTone }}>Direct Referral</p>
                    <p className={`mt-1 font-semibold ${panelText}`}>PHP {fmt(pkg.directReferralBonus)}</p>
                  </div>
                  <div className="rounded-xl p-3" style={{ background: nestedPanelBg, border: `1px solid ${panelBorder}` }}>
                    <p style={{ color: labelTone }}>Binary Value</p>
                    <p className={`mt-1 font-semibold ${panelText}`}>{fmtInt(pkg.binaryPoints)} BP</p>
                    <p className="text-[11px] mt-1" style={{ color: labelTone }}>PHP {fmt(pkg.binaryValue)}</p>
                  </div>
                  <div className="rounded-xl p-3" style={{ background: nestedPanelBg, border: `1px solid ${panelBorder}` }}>
                    <p style={{ color: labelTone }}>Weekly Cap</p>
                    <p className={`mt-1 font-semibold ${panelText}`}>PHP {fmt(pkg.pairingWeeklyCap)}</p>
                  </div>
                  <div className="rounded-xl p-3" style={{ background: nestedPanelBg, border: `1px solid ${panelBorder}` }}>
                    <p style={{ color: labelTone }}>
                      {Number(pkg.lifetimeIncomeCeiling || 0) > 0 ? 'Lifetime Ceiling' : 'Monthly Pairing Cap'}
                    </p>
                    <p className={`mt-1 font-semibold ${panelText}`}>
                      PHP {fmt(Number(pkg.lifetimeIncomeCeiling || 0) > 0 ? pkg.lifetimeIncomeCeiling : pkg.pairingMonthlyCap)}
                    </p>
                  </div>
                  <div className="rounded-xl p-3" style={{ background: nestedPanelBg, border: `1px solid ${panelBorder}` }}>
                    <p style={{ color: labelTone }}>Unilevel Reach</p>
                    <p className={`mt-1 font-semibold ${panelText}`}>Level {fmtInt(pkg.unilevelReach)}</p>
                  </div>
                  <div className="rounded-xl p-3" style={{ background: nestedPanelBg, border: `1px solid ${panelBorder}` }}>
                    <p style={{ color: labelTone }}>Sales Match Coverage</p>
                    <p className={`mt-1 font-semibold ${panelText}`}>
                      {pkg.pairingDepthLimit ? `Up to L${fmtInt(pkg.pairingDepthLimit)}` : 'Full tree'}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl p-4 mt-4" style={{ background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.12)' }}>
                  <div className="flex items-start gap-2">
                    <HiOutlineSparkles className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#D4AF37' }} />
                    <div>
                      <p className={`text-sm font-semibold ${panelText}`}>
                        {pkg.rankingEligible ? `Ranking ceiling: ${pkg.rankingMaxLabel || 'Published ceiling'}` : 'Ranking locked for this package'}
                      </p>
                      <p className="text-xs mt-1 leading-6" style={{ color: bodyTone }}>
                        {pkg.salesMatchNote}
                      </p>
                      <p className="text-xs mt-2" style={{ color: labelTone }}>
                        {pkg.nextUpgradePackageLabel
                          ? `Next upgrade target: ${pkg.nextUpgradePackageLabel}`
                          : 'This is already the highest package tier in the current ladder.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

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

      {accountCodes.length > 0 ? (
        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-display text-base font-semibold text-white mb-4">Available Upgrade Codes</h3>
          <div className="space-y-2">
            {accountCodes.map((c) => (
              <div
                key={c.code}
                className="flex items-center justify-between py-3 px-4 rounded-xl transition-colors"
                style={{
                  background: selected.includes(c.code) ? 'rgba(212,175,55,0.08)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${selected.includes(c.code) ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.05)'}`,
                }}
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
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(212,175,55,0.18)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(212,175,55,0.1)'; }}
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
      ) : (
        <div className="glass-card rounded-2xl p-12 text-center">
          <HiOutlineArrowUp className="w-8 h-8 mx-auto mb-3" style={{ color: 'rgba(212,175,55,0.2)' }} />
          <p style={{ color: 'rgba(255,255,255,0.3)' }}>No upgrade codes available.</p>
        </div>
      )}
    </div>
  );
}
