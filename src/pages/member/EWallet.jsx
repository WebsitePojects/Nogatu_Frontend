import { useState, useEffect } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';
import { HiOutlineCash, HiOutlineTrendingUp, HiOutlineUsers, HiOutlineChartBar, HiOutlineStar, HiOutlineGift, HiOutlineShieldCheck, HiOutlineSparkles } from 'react-icons/hi';

const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const INCOME_ITEMS = [
  { key: 'directReferral', label: 'Direct Referral',  icon: HiOutlineUsers,       color: '#D4AF37' },
  { key: 'pairing',        label: 'Binary Pairing',   icon: HiOutlineChartBar,    color: '#F2D06B' },
  { key: 'leadership',     label: 'Leadership Bonus', icon: HiOutlineStar,        color: '#B8960C' },
  { key: 'unilevel',       label: 'Uni-Level',        icon: HiOutlineTrendingUp,  color: '#D4AF37' },
  { key: 'hifive',         label: 'Hi-Five Bonus',    icon: HiOutlineGift,        color: '#F2D06B' },
  { key: 'lpc',            label: 'Leader Performance Commission', icon: HiOutlineShieldCheck, color: '#9A7B0A' },
];

function SpinnerIcon() {
  return (
    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export default function EWallet() {
  const [data, setData]             = useState(null);
  const [globalBonus, setGlobalBonus] = useState(null);
  const [loading, setLoading]       = useState(true);
  const [encashAmount, setEncashAmount] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, []);

  async function loadData() {
    try {
      const [walletRes, globalBonusRes] = await Promise.allSettled([
        api.get('/wallet'),
        api.get('/global-bonus'),
      ]);

      if (walletRes.status === 'fulfilled') {
        setData(walletRes.value.data);
      } else {
        setData(null);
      }

      if (globalBonusRes.status === 'fulfilled') {
        setGlobalBonus(globalBonusRes.value.data);
      } else {
        setGlobalBonus(null);
      }
    } catch { } finally { setLoading(false); }
  }

  async function handleEncash(e) {
    e.preventDefault();
    const amount = Number(encashAmount);
    if (!amount || amount <= 0) return toast.error('Please enter a valid amount greater than zero');
    if (amount > (data?.cashBalance || 0)) return toast.error('Insufficient balance');
    setProcessing(true);
    try {
      await api.post('/wallet/encash', { amount });
      toast.success(`Encashment of ₱${fmt(amount)} processed successfully`);
      setEncashAmount('');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Encashment failed');
    } finally { setProcessing(false); }
  }

  /* Estimated deductions preview */
  const previewAmount = Number(encashAmount) || 0;
  const previewTax    = previewAmount * 0.10;
  const previewFee    = previewAmount > 0 ? 50 : 0;
  const previewNet    = previewAmount - previewTax - previewFee;
  const bonusMonthIdx = Math.max(0, Math.min(11, Number(globalBonus?.month || 1) - 1));
  const bonusPeriodLabel = globalBonus ? `${MONTHS[bonusMonthIdx]} ${globalBonus.year || ''}`.trim() : 'N/A';
  const hasDistributedShare = Number(globalBonus?.distributedShare || 0) > 0;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div
          className="w-12 h-12 rounded-full border-[3px] animate-spin"
          style={{ borderColor: 'rgba(212,175,55,0.12)', borderTopColor: '#D4AF37' }}
        />
        <p className="text-sm" style={{ color: 'rgba(212,175,55,0.5)' }}>Loading wallet…</p>
      </div>
    );
  }
  if (!data) return <p style={{ color: 'rgba(255,255,255,0.4)' }}>Failed to load wallet data.</p>;

  return (
    <div className="space-y-6">

      {/* Page heading */}
      <div>
        <h1 className="font-display text-2xl font-bold text-white">E-Wallet</h1>
        <div className="w-10 h-0.5 mt-2 rounded-full" style={{ background: 'linear-gradient(90deg,#D4AF37,transparent)' }} />
      </div>

      {/* ── BALANCE HERO CARD ──────────────────────────────────── */}
      <div
        className="ewallet-balance-card relative rounded-2xl p-7 overflow-hidden"
      >
        {/* Background orb */}
        <div
          className="absolute top-0 right-0 w-64 h-64 pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.08) 0%, transparent 70%)', filter: 'blur(20px)', transform: 'translate(30%,-30%)' }}
        />
        {/* Dot grid */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(212,175,55,0.04) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* 3D ASSET: floating gold coin */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 w-32 h-32 md:w-48 md:h-48 pointer-events-none opacity-90 mix-blend-screen">
          <video 
            src="/img/goldcoin3dvid.mp4" 
            autoPlay 
            loop 
            muted 
            playsInline 
            className="w-full h-full object-contain"
          />
        </div>

        <div className="relative z-10">
          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="text-xs font-medium tracking-wider uppercase mb-1 text-yellow-800 dark:text-yellow-200/50">
                Available Balance
              </p>
              <p className="font-display text-[42px] font-bold text-gray-900 dark:text-white leading-none tracking-tight">
                ₱{fmt(data.cashBalance)}
              </p>
            </div>
            {/* Wallet icon */}
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(212,175,55,0.15), rgba(212,175,55,0.08))',
                border: '1px solid rgba(212,175,55,0.2)',
                boxShadow: '0 4px 16px rgba(212,175,55,0.15)',
              }}
            >
              <HiOutlineCash className="w-7 h-7" style={{ color: '#D4AF37' }} />
            </div>
          </div>

          <div
            className="flex items-center gap-2 pt-4 border-t"
            style={{ borderColor: 'rgba(212,175,55,0.1)' }}
          >
            <span className="text-xs text-gray-500 dark:text-white/35">Total Income Earned:</span>
            <span className="text-sm font-semibold text-yellow-700 dark:text-yellow-300/80">₱{fmt(data.totalIncome)}</span>
          </div>
        </div>
      </div>

      {/* ── INCOME + ENCASHMENT GRID ──────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Income Breakdown */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-display text-base font-semibold text-white mb-1">Income Breakdown</h3>
          <div className="w-8 h-0.5 mb-5 rounded-full" style={{ background: 'linear-gradient(90deg,#D4AF37,transparent)' }} />

          <div className="space-y-1">
            {INCOME_ITEMS.map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between py-2.5 px-3 rounded-xl"
                style={{ borderBottom: '1px solid rgba(212,175,55,0.06)' }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${item.color}18`, border: `1px solid ${item.color}28` }}
                  >
                    <item.icon className="w-3.5 h-3.5" style={{ color: item.color }} />
                  </div>
                  <span className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>{item.label}</span>
                </div>
                <span className="text-sm font-semibold" style={{ color: item.color }}>
                  ₱{fmt(data[item.key])}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Encashment */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-display text-base font-semibold text-white mb-1">Request Encashment</h3>
          <div className="w-8 h-0.5 mb-5 rounded-full" style={{ background: 'linear-gradient(90deg,#D4AF37,transparent)' }} />

          {/* Info box */}
          <div
            className="flex gap-2.5 p-3.5 rounded-xl mb-5 text-xs"
            style={{
              background: 'rgba(212,175,55,0.06)',
              border: '1px solid rgba(212,175,55,0.14)',
              color: 'rgba(255,255,255,0.45)',
            }}
          >
            <span style={{ color: '#D4AF37', fontSize: '14px', lineHeight: 1 }}>ℹ</span>
            <span>No fixed minimum amount · 10% withholding tax · ₱50 processing fee · Payout every Friday</span>
          </div>

          <form onSubmit={handleEncash} className="space-y-4">
            <div>
              <label className="label">Amount (₱)</label>
              <input
                type="number"
                value={encashAmount}
                onChange={(e) => setEncashAmount(e.target.value)}
                className="glass-input"
                placeholder="Enter amount"
                min="1"
                step="1"
                required
              />
            </div>

            {/* Deduction preview */}
            {previewAmount > 0 && (
              <div
                className="space-y-2 p-3.5 rounded-xl text-xs"
                style={{ background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.12)' }}
              >
                <div className="flex justify-between" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  <span>10% Tax</span>
                  <span>- ₱{fmt(previewTax)}</span>
                </div>
                <div className="flex justify-between" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  <span>Processing Fee</span>
                  <span>- ₱{fmt(previewFee)}</span>
                </div>
                <div
                  className="flex justify-between font-semibold pt-2 border-t"
                  style={{ borderColor: 'rgba(212,175,55,0.15)', color: previewNet > 0 ? '#D4AF37' : '#ef4444' }}
                >
                  <span>Net Receivable</span>
                  <span>₱{fmt(Math.max(0, previewNet))}</span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={processing}
              className="btn-success w-full flex items-center justify-center gap-2"
            >
              {processing ? <><SpinnerIcon /> Processing…</> : 'Submit Encashment'}
            </button>
          </form>
        </div>
      </div>

      {/* Global Bonus */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="font-display text-base font-semibold text-white mb-1">Global Bonus</h3>
            <div className="w-8 h-0.5 rounded-full" style={{ background: 'linear-gradient(90deg,#D4AF37,transparent)' }} />
          </div>
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold"
            style={
              globalBonus?.eligible
                ? { background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.25)' }
                : { background: 'rgba(148,163,184,0.12)', color: '#cbd5e1', border: '1px solid rgba(148,163,184,0.25)' }
            }
          >
            <HiOutlineSparkles className="w-3.5 h-3.5" />
            {globalBonus?.eligible ? 'Eligible' : 'Not Eligible'}
          </span>
        </div>

        {globalBonus ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            <div className="rounded-xl p-3.5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(212,175,55,0.1)' }}>
              <p className="text-xs" style={{ color: 'rgba(212,175,55,0.55)' }}>Period</p>
              <p className="text-sm font-semibold text-white mt-1">{bonusPeriodLabel}</p>
            </div>
            <div className="rounded-xl p-3.5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(212,175,55,0.1)' }}>
              <p className="text-xs" style={{ color: 'rgba(212,175,55,0.55)' }}>Member Type</p>
              <p className="text-sm font-semibold text-white mt-1">{globalBonus.memberType || 'N/A'}</p>
            </div>
            <div className="rounded-xl p-3.5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(212,175,55,0.1)' }}>
              <p className="text-xs" style={{ color: 'rgba(212,175,55,0.55)' }}>Portions</p>
              <p className="text-sm font-semibold text-white mt-1">{Number(globalBonus.portions || 0)}</p>
            </div>
            <div className="rounded-xl p-3.5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(212,175,55,0.1)' }}>
              <p className="text-xs" style={{ color: 'rgba(212,175,55,0.55)' }}>
                {hasDistributedShare ? 'Distributed Share' : 'Projected Share'}
              </p>
              <p className="text-sm font-semibold mt-1" style={{ color: '#D4AF37' }}>
                ₱{fmt(hasDistributedShare ? globalBonus.distributedShare : globalBonus.projectedShare)}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Global bonus details are currently unavailable.
          </p>
        )}

        {globalBonus?.latestShare && (
          <div className="mt-4 rounded-xl p-3.5 text-xs" style={{ background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.15)', color: 'rgba(255,255,255,0.6)' }}>
            Latest distributed share: <span style={{ color: '#D4AF37', fontWeight: 700 }}>₱{fmt(globalBonus.latestShare.shareAmount)}</span>
            {' '}({MONTHS[Math.max(0, Math.min(11, Number(globalBonus.latestShare.month || 1) - 1))]} {globalBonus.latestShare.year})
          </div>
        )}
      </div>
    </div>
  );
}
