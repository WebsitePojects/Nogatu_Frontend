import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';
import toast from 'react-hot-toast';
import html2canvas from 'html2canvas';
import { HiOutlineCash, HiOutlineTrendingUp, HiOutlineUsers, HiOutlineChartBar, HiOutlineStar, HiOutlineGift, HiOutlineSparkles } from 'react-icons/hi';

const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const INCOME_ITEMS = [
  { key: 'directReferral', label: 'Direct Referral',  icon: HiOutlineUsers,       color: '#D4AF37' },
  { key: 'pairing',        label: 'Binary Pairing',   icon: HiOutlineChartBar,    color: '#F2D06B' },
  { key: 'leadership',     label: 'Leadership Bonus', icon: HiOutlineStar,        color: '#B8960C' },
  { key: 'unilevel',       label: 'Uni-Level',        icon: HiOutlineTrendingUp,  color: '#D4AF37' },
  { key: 'hifive',         label: 'Hi-Five Bonus',    icon: HiOutlineGift,        color: '#F2D06B' },
];

function SpinnerIcon() {
  return (
    <svg className="animate-spin size-4" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function ReceiptModal({ data, onClose, onDownload, receiptRef }) {
  if (!data) return null;

  return (
    <div className="portal-overlay fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="portal-modal-panel w-full max-w-lg rounded-2xl p-7 shadow-2xl">
        <div ref={receiptRef}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="portal-modal-title font-display text-xl font-bold">Encashment Receipt</h3>
              <p className="portal-modal-muted text-sm mt-1">Ref #{data.refNumber}</p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full" style={{ color: '#34d399', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)' }}>
              Submitted
            </span>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between" style={{ color: 'rgba(255,255,255,0.8)' }}><span>Encash Amount</span><span>₱{fmt(data.encashAmount)}</span></div>
            <div className="flex justify-between" style={{ color: 'rgba(255,255,255,0.6)' }}><span>Withholding Tax (10%)</span><span>- ₱{fmt(data.tax)}</span></div>
            <div className="flex justify-between" style={{ color: 'rgba(255,255,255,0.6)' }}><span>Processing Fee</span><span>- ₱{fmt(data.fee)}</span></div>
            <div className="flex justify-between" style={{ color: 'rgba(255,255,255,0.6)' }}><span>System Maintenance Fee</span><span>- ₱{fmt(data.maintenanceFee)}</span></div>
            {Number(data.cdDeduction || 0) > 0 && (
              <div className="flex justify-between" style={{ color: 'rgba(255,255,255,0.6)' }}><span>CD Deduction</span><span>- ₱{fmt(data.cdDeduction)}</span></div>
            )}
            <div className="flex justify-between pt-2 border-t" style={{ borderColor: 'rgba(212,175,55,0.2)', color: '#D4AF37', fontWeight: 700 }}>
              <span>Net Receivable</span>
              <span>₱{fmt(data.netReceivable)}</span>
            </div>
            <div className="pt-3 text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>
              <p>Beginning Balance: ₱{fmt(data.beginBalance)}</p>
              <p>Ending Balance: ₱{fmt(data.endBalance)}</p>
              <p>Payment Option: {data.paymentOption || 'N/A'}</p>
              <p>Payment Details: {data.paymentDetails || 'N/A'}</p>
              <p>Payout Date: {data.payoutDate || 'Next Friday'}</p>
              <p>Processed At: {data.processedAt}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            onClick={onDownload}
            className="text-xs px-3 py-2 rounded-lg font-medium"
            style={{ background: 'rgba(212,175,55,0.12)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.25)' }}
           type="button">
            Download PNG
          </button>
          <button
            onClick={onClose}
            className="portal-muted-button text-xs px-3 py-2 rounded-lg font-medium"
           type="button">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function VerificationRequiredModal({ open, message, onClose }) {
  if (!open) return null;

  return (
    <div className="portal-overlay fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="portal-modal-panel w-full max-w-md rounded-2xl p-6 shadow-2xl"
      >
        <div
          className="size-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.2)' }}
        >
          <HiOutlineSparkles className="size-7" style={{ color: '#D4AF37' }} />
        </div>
        <div className="text-center">
          <h3 className="portal-modal-title font-display text-xl font-bold">Verification Needed</h3>
          <p className="portal-modal-text text-sm mt-3 leading-6">
            {message || 'You must complete your payout details before encashment.'}
          </p>
          <p className="portal-gold-text text-sm mt-3">
            Add your payout option and payout details first so your encashment can be released properly.
          </p>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="portal-muted-button text-xs px-3 py-2 rounded-lg font-medium"
          >
            Close
          </button>
          <Link
            to="/account"
            className="text-xs px-3 py-2 rounded-lg font-medium"
            style={{ background: 'rgba(212,175,55,0.12)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.25)' }}
          >
            Add Payout Details
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function EWallet() {
  const [data, setData]             = useState(null);
  const [globalBonus, setGlobalBonus] = useState(null);
  const [loading, setLoading]       = useState(true);
  const [encashAmount, setEncashAmount] = useState('');
  const [encashPreview, setEncashPreview] = useState(null);
  const [previewError, setPreviewError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [verificationModal, setVerificationModal] = useState({ open: false, message: '' });
  const receiptRef = useRef(null);

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const amount = Number(encashAmount);
    if (!amount || amount <= 0) {
      setEncashPreview(null);
      setPreviewError('');
      return undefined;
    }

    let cancelled = false;
    const timeout = setTimeout(async () => {
      try {
        const res = await api.post('/wallet/preview-encash', { amount });
        if (!cancelled) {
          setEncashPreview(res.data.preview);
          setPreviewError('');
          setVerificationModal({ open: false, message: '' });
        }
      } catch (err) {
        if (!cancelled) {
          setEncashPreview(err.response?.data?.preview || null);
          setPreviewError(err.response?.data?.error || 'Unable to preview encashment.');
          if (['PAYOUT_OPTION_REQUIRED', 'PAYOUT_DETAILS_REQUIRED'].includes(err.response?.data?.code)) {
            setVerificationModal({
              open: true,
              message: err.response?.data?.error || 'You must verify your payout details before encashment.',
            });
          }
        }
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [encashAmount]);

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
    if (previewError) return toast.error(previewError);
    setProcessing(true);
    try {
      const res = await api.post('/wallet/encash', { amount });
      toast.success(`Encashment of PHP ${fmt(amount)} processed successfully`);
      setReceiptData({
        refNumber: res.data.pid || 'N/A',
        encashAmount: amount,
        tax: Number(res.data.tax || amount * 0.10),
        fee: Number(res.data.fee || 50),
        maintenanceFee: Number(res.data.maintenanceFee || 20),
        cdDeduction: Number(res.data.cdDeduction || 0),
        netReceivable: Number(res.data.netReceivable || 0),
        beginBalance: Number(data?.cashBalance || 0),
        endBalance: Number(res.data.newBalance || 0),
        paymentOption: res.data.paymentOption || data?.payoutOption,
        paymentDetails: res.data.paymentDetailsMasked || res.data.paymentDetails || data?.payoutDetails,
        processedAt: new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' }),
        payoutDate: res.data.payoutDate || 'Next Friday',
      });
      setShowReceipt(true);
      setEncashAmount('');
      loadData();
    } catch (err) {
      if (['PAYOUT_OPTION_REQUIRED', 'PAYOUT_DETAILS_REQUIRED'].includes(err.response?.data?.code)) {
        setVerificationModal({
          open: true,
          message: err.response?.data?.error || 'You must verify your payout details before encashment.',
        });
      }
      toast.error(err.response?.data?.error || 'Encashment failed');
    } finally { setProcessing(false); }
  }

  async function handleDownloadReceipt() {
    if (!receiptRef.current) return;

    const canvas = await html2canvas(receiptRef.current, {
      backgroundColor: '#141008',
      scale: 2,
      useCORS: true,
    });

    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `encashment-receipt-${receiptData?.refNumber || 'nogatu'}.png`;
    link.click();
  }

  /* Estimated deductions preview */
  const previewAmount = Number(encashAmount) || 0;
  const previewTax    = Number(encashPreview?.deductions?.tax || previewAmount * 0.10);
  const previewFee    = Number(encashPreview?.deductions?.processingFee || (previewAmount > 0 ? 50 : 0));
  const previewMaintenanceFee = Number(encashPreview?.deductions?.maintenanceFee || (previewAmount > 0 ? 20 : 0));
  const previewCdDeduction = Number(encashPreview?.deductions?.cdDeduction || 0);
  const previewNet    = Number(encashPreview?.net ?? (previewAmount - previewTax - previewFee - previewMaintenanceFee - previewCdDeduction));
  const bonusPeriodLabel = globalBonus?.periodLabel || (globalBonus?.year ? `Year ${globalBonus.year}` : 'N/A');
  const hasDistributedShare = Number(globalBonus?.distributedShare || 0) > 0;
  const globalBonusEligible = Boolean(data?.globalBonusStatus?.fullVisibility || globalBonus?.eligible);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div
          className="size-12 rounded-full border-[3px] animate-spin"
          style={{ borderColor: 'rgba(212,175,55,0.12)', borderTopColor: '#D4AF37' }}
        />
        <p className="portal-card-muted text-sm">Loading wallet...</p>
      </div>
    );
  }
  if (!data) return <p className="portal-card-muted">Failed to load wallet data.</p>;

  return (
    <div className="space-y-6">
      <VerificationRequiredModal
        open={verificationModal.open}
        message={verificationModal.message}
        onClose={() => setVerificationModal({ open: false, message: '' })}
      />

      {/* Page heading */}
      <div>
        <h1 className="portal-page-title font-display text-2xl font-bold">E-Wallet</h1>
        <div className="w-10 h-0.5 mt-2 rounded-full" style={{ background: 'linear-gradient(90deg,#D4AF37,transparent)' }} />
      </div>

      {/* ── BALANCE HERO CARD ──────────────────────────────────── */}
      <div
        className="ewallet-balance-card relative rounded-2xl p-7 overflow-hidden"
      >
        {/* Background orb */}
        <div
          className="absolute top-0 right-0 size-64 pointer-events-none"
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
        <div className="absolute right-4 top-1/2 -translate-y-1/2 size-32 md:size-48 pointer-events-none opacity-90 mix-blend-screen">
          <video 
            src="/img/goldcoin3dvid.mp4" 
            autoPlay 
            loop 
            muted 
            playsInline 
            className="size-full object-contain"
          />
        </div>

        <div className="relative z-10">
          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="portal-gold-text text-sm font-semibold tracking-wider uppercase mb-1">
                Available Balance
              </p>
              <p className="font-display text-[42px] font-bold text-gray-900 dark:text-white leading-none tracking-tight">
                ₱{fmt(data.cashBalance)}
              </p>
            </div>
            {/* Wallet icon */}
            <div
              className="size-14 rounded-2xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(212,175,55,0.15), rgba(212,175,55,0.08))',
                border: '1px solid rgba(212,175,55,0.2)',
                boxShadow: '0 4px 16px rgba(212,175,55,0.15)',
              }}
            >
              <HiOutlineCash className="size-7" style={{ color: '#D4AF37' }} />
            </div>
          </div>

          <div
            className="flex items-center gap-2 pt-4 border-t"
            style={{ borderColor: 'rgba(212,175,55,0.1)' }}
          >
            <span className="portal-card-muted text-sm">Total Income Earned:</span>
            <span className="portal-gold-text text-sm font-semibold">₱{fmt(data.totalIncome)}</span>
          </div>
        </div>
      </div>

      {/* ── INCOME + ENCASHMENT GRID ──────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Income Breakdown */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="portal-card-title font-display text-base font-semibold mb-1">Income Breakdown</h3>
          <div className="w-8 h-0.5 mb-5 rounded-full" style={{ background: 'linear-gradient(90deg,#D4AF37,transparent)' }} />

          <div className="space-y-1">
            {INCOME_ITEMS.map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between py-2.5 px-3 rounded-xl"
                style={{ borderBottom: '1px solid var(--portal-row-border)' }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="size-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${item.color}18`, border: `1px solid ${item.color}28` }}
                  >
                    <item.icon className="size-3.5" style={{ color: item.color }} />
                  </div>
                  <span className="portal-card-text text-sm">{item.label}</span>
                </div>
                <span className="portal-warning-text text-sm font-semibold">
                  ₱{fmt(data[item.key])}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Encashment */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="portal-card-title font-display text-base font-semibold mb-1">Request Encashment</h3>
          <div className="w-8 h-0.5 mb-5 rounded-full" style={{ background: 'linear-gradient(90deg,#D4AF37,transparent)' }} />

          {/* Info box */}
          <div className="portal-info-box flex gap-2.5 p-3.5 rounded-xl mb-5 text-sm leading-6">
            <span style={{ color: '#D4AF37', fontSize: '14px', lineHeight: 1 }}>ℹ</span>
            <span>No fixed minimum amount · 10% withholding tax · ₱50 processing fee · ₱20 system maintenance fee · Payout every Friday</span>
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
                className="portal-soft-panel space-y-2 p-3.5 rounded-xl text-sm"
              >
                <div className="portal-card-text flex justify-between">
                  <span>10% Tax</span>
                  <span>- ₱{fmt(previewTax)}</span>
                </div>
                <div className="portal-card-text flex justify-between">
                  <span>Processing Fee</span>
                  <span>- ₱{fmt(previewFee)}</span>
                </div>
                <div className="portal-card-text flex justify-between">
                  <span>System Maintenance Fee</span>
                  <span>- ₱{fmt(previewMaintenanceFee)}</span>
                </div>
                {previewCdDeduction > 0 && (
                  <div className="portal-card-text flex justify-between">
                    <span>CD Deduction</span>
                    <span>- ₱{fmt(previewCdDeduction)}</span>
                  </div>
                )}
                {previewError && (
                  <div className="rounded-lg px-3 py-2" style={{ background: 'rgba(239,68,68,0.1)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.25)' }}>
                    {previewError}
                  </div>
                )}
                <div
                  className="flex justify-between font-semibold pt-2 border-t"
                  style={{ borderColor: 'var(--portal-row-border)', color: previewNet > 0 ? 'var(--portal-gold-text)' : '#ef4444' }}
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
      <div
        className={`gglass-card rounded-2xl p-6 transition-all ${globalBonusEligible ? '' : 'pointer-events-none'}`}
        style={!globalBonusEligible ? { filter: 'grayscale(1)', opacity: 0.6 } : undefined}
      >
        <div className="flex items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="portal-card-title font-display text-base font-semibold mb-1">Global Bonus</h3>
            <div className="w-8 h-0.5 rounded-full" style={{ background: 'linear-gradient(90deg,#D4AF37,transparent)' }} />
          </div>
          {globalBonusEligible ? (
            <Link
              to="/leaderboard"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
              style={{ background: 'rgba(212,175,55,0.1)', color: 'var(--portal-gold-text)', border: '1px solid rgba(212,175,55,0.2)' }}
            >
              <HiOutlineTrendingUp className="size-3.5" />
              View Leaderboard
            </Link>
          ) : null}
        </div>

        {globalBonusEligible && globalBonus ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            <div className="rounded-xl p-3.5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(212,175,55,0.1)' }}>
              <p className="portal-card-muted text-xs">Period</p>
              <p className="portal-card-title text-sm font-semibold mt-1">{bonusPeriodLabel}</p>
            </div>
            <div className="rounded-xl p-3.5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(212,175,55,0.1)' }}>
              <p className="portal-card-muted text-xs">Member Type</p>
              <p className="portal-card-title text-sm font-semibold mt-1">{globalBonus.memberType || 'N/A'}</p>
            </div>
            <div className="rounded-xl p-3.5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(212,175,55,0.1)' }}>
              <p className="portal-card-muted text-xs">Portions</p>
              <p className="portal-card-title text-sm font-semibold mt-1">{Number(globalBonus.portions || 0)}</p>
            </div>
            <div className="rounded-xl p-3.5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(212,175,55,0.1)' }}>
              <p className="portal-card-muted text-xs">
                {hasDistributedShare ? 'Distributed Share' : 'Projected Share'}
              </p>
              <p className="portal-gold-text text-sm font-semibold mt-1">
                ₱{fmt(hasDistributedShare ? globalBonus.distributedShare : globalBonus.projectedShare)}
              </p>
            </div>
          </div>
        ) : globalBonusEligible ? (
          <p className="portal-card-muted text-sm">
            Global bonus details are currently unavailable.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3" aria-hidden="true">
            {[0, 1, 2, 3].map((item) => (
              <div
                key={item}
                className="rounded-xl p-3.5"
                style={{ background: 'rgba(148,163,184,0.12)', border: '1px solid rgba(148,163,184,0.18)', minHeight: 68 }}
              />
            ))}
          </div>
        )}

        {globalBonusEligible && globalBonus?.latestShare && (
          <div className="portal-info-box mt-4 rounded-xl p-3.5 text-sm">
            Latest distributed share: <span className="portal-gold-text" style={{ fontWeight: 700 }}>₱{fmt(globalBonus.latestShare.shareAmount)}</span>
            {' '}({globalBonus.latestShare.periodLabel || `Year ${globalBonus.latestShare.year}`})
          </div>
        )}
      </div>

      {showReceipt && (
        <ReceiptModal
          data={receiptData}
          receiptRef={receiptRef}
          onDownload={handleDownloadReceipt}
          onClose={() => setShowReceipt(false)}
        />
      )}
    </div>
  );
}
