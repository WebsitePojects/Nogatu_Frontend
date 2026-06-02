import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { HiOutlineGift, HiOutlineSparkles, HiOutlineCash, HiOutlineRefresh, HiOutlineShoppingCart, HiOutlineDocumentText, HiOutlineExclamation, HiOutlineX } from 'react-icons/hi';
import api from '../../api';
import { useTheme } from '../../contexts/ThemeContext';
import { MAINTENANCE_PRODUCTS, MAINTENANCE_PRODUCT_IMAGES } from '../../constants/maintenanceProducts';

const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const PACKAGE_LABELS = { 10: 'Bronze', 20: 'Silver', 30: 'Gold', 40: 'Platinum', 50: 'Garnet', 60: 'Diamond' };

function Spinner() {
  return (
    <div className="flex justify-center py-14">
      <div className="size-10 rounded-full border-[3px] animate-spin" style={{ borderColor: 'rgba(212,175,55,0.12)', borderTopColor: '#D4AF37' }} />
    </div>
  );
}

function statusStyle(status) {
  if (Number(status) === 4) {
    return { color: '#f87171', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' };
  }
  if (Number(status) === 3) {
    return { color: '#60a5fa', background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)' };
  }
  if (Number(status) === 2) {
    return { color: '#f87171', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' };
  }
  return { color: '#34d399', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)' };
}

function getExpiryModeLabel(row) {
  if (row?.expiry_mode === 'used') return 'Used-voucher expiry';
  return 'Unused-voucher expiry';
}

function getExpiryDescription(row) {
  const label = row?.expiry_label || 'Active';
  if (row?.expiry_mode === 'used') {
    return row?.first_used_at
      ? `${getExpiryModeLabel(row)}: ${label} after first use on ${row.first_used_at}`
      : `${getExpiryModeLabel(row)}: ${label}`;
  }
  return `${getExpiryModeLabel(row)}: ${label}`;
}

function getExpiryDateDisplay(row) {
  if (row?.expiry_mode === 'used' && row?.use_expires_at) return row.use_expires_at;
  return row?.expiry_date || 'N/A';
}

export default function Vouchers() {
  const { isDarkMode } = useTheme();
  const [contentLoading, setContentLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [processingProduct, setProcessingProduct] = useState('');
  const [checkoutModal, setCheckoutModal] = useState(null);

  useEffect(() => {
    refreshAllContent();
  }, []);

  async function refreshAllContent() {
    setContentLoading(true);
    try {
      const [voucherRes, walletRes, txRes] = await Promise.allSettled([
        api.get('/vouchers'),
        api.get('/wallet'),
        api.get('/vouchers/transactions'),
      ]);

      if (voucherRes.status === 'fulfilled') {
        setRows(voucherRes.value.data.vouchers || []);
      } else {
        setRows([]);
      }

      if (walletRes.status === 'fulfilled') {
        setWalletBalance(Number(walletRes.value.data?.cashBalance || 0));
      } else {
        setWalletBalance(0);
      }

      if (txRes.status === 'fulfilled') {
        setTransactions(txRes.value.data.transactions || []);
      } else {
        setTransactions([]);
      }
    } catch {
      toast.error('Unable to load voucher data');
      setRows([]);
      setTransactions([]);
      setWalletBalance(0);
    } finally {
      setContentLoading(false);
    }
  }

  const modalStyles = useMemo(() => {
    return {
      overlay: isDarkMode ? 'rgba(2,6,23,0.72)' : 'rgba(15,23,42,0.34)',
      panelBg: isDarkMode ? '#0f172a' : '#ffffff',
      panelBorder: isDarkMode ? '1px solid rgba(148,163,184,0.2)' : '1px solid rgba(148,163,184,0.35)',
      panelShadow: isDarkMode
        ? '0 18px 38px rgba(2,6,23,0.55)'
        : '0 18px 40px rgba(15,23,42,0.22)',
      title: isDarkMode ? '#f8fafc' : '#0f172a',
      body: isDarkMode ? 'rgba(226,232,240,0.82)' : 'rgba(51,65,85,0.92)',
      muted: isDarkMode ? 'rgba(148,163,184,0.82)' : 'rgba(100,116,139,0.9)',
      cardBg: isDarkMode ? 'rgba(148,163,184,0.09)' : 'rgba(241,245,249,0.9)',
      cardBorder: isDarkMode ? '1px solid rgba(148,163,184,0.2)' : '1px solid rgba(203,213,225,0.9)',
      closeBg: isDarkMode ? 'rgba(148,163,184,0.12)' : 'rgba(148,163,184,0.18)',
      closeColor: isDarkMode ? '#cbd5e1' : '#334155',
      cancelBg: isDarkMode ? 'rgba(148,163,184,0.14)' : 'rgba(226,232,240,0.9)',
      cancelColor: isDarkMode ? '#e2e8f0' : '#0f172a',
      cancelBorder: isDarkMode ? '1px solid rgba(148,163,184,0.24)' : '1px solid rgba(148,163,184,0.45)',
      confirmBg: isDarkMode ? 'linear-gradient(135deg,#16a34a,#22c55e)' : 'linear-gradient(135deg,#15803d,#16a34a)',
      confirmColor: '#ffffff',
      confirmBorder: '1px solid rgba(22,163,74,0.5)',
      deduct: '#ef4444',
      total: '#D4AF37',
    };
  }, [isDarkMode]);

  function pickVoucherForCheckout(amount) {
    const requiredAmount = Number(amount || 0);
    if (!Number.isFinite(requiredAmount) || requiredAmount <= 0) return null;

    const activeVouchers = rows
      .filter((v) => Number(v.status) === 1 && Number(v.remaining_balance || 0) > 0)
      .sort((a, b) => {
        const aTime = new Date(a.expiry_date).getTime();
        const bTime = new Date(b.expiry_date).getTime();
        if (Number.isFinite(aTime) && Number.isFinite(bTime) && aTime !== bTime) {
          return aTime - bTime;
        }
        return Number(a.id || 0) - Number(b.id || 0);
      });

    const fullMatch = activeVouchers.find((v) => Number(v.remaining_balance || 0) >= requiredAmount);
    return fullMatch || activeVouchers[0] || null;
  }

  function handleProductCheckout(product) {
    const price = Number(product?.price || 0);
    if (!Number.isFinite(price) || price <= 0) {
      toast.error('Invalid product amount');
      return;
    }

    if (price > Number(walletBalance || 0)) {
      toast.error('Insufficient wallet balance');
      return;
    }

    const voucher = pickVoucherForCheckout(price);
    if (!voucher) {
      toast.error('No active voucher available for checkout');
      return;
    }

    const voucherMatch = Math.min(price, Number(voucher.remaining_balance || 0));
    if (voucherMatch <= 0) {
      toast.error('No usable voucher balance for this checkout');
      return;
    }

    setCheckoutModal({
      product,
      voucher,
      price,
      voucherMatch,
      totalValue: price + voucherMatch,
    });
  }

  function closeCheckoutModal() {
    if (!processingProduct) {
      setCheckoutModal(null);
    }
  }

  async function confirmCheckout() {
    if (!checkoutModal) return;

    const { product, voucher, price } = checkoutModal;

    setProcessingProduct(product.name);
    try {
      const { data } = await api.post('/vouchers/redeem', {
        voucherId: voucher.id,
        cashAmount: price,
        productKey: product.key,
        productCode: product.code,
        productName: product.name,
      });

      toast.success(
        `${product.name} checkout successful. You will receive 2x ${product.name}. Wallet -P${fmt(data?.cashPaid)} | Voucher -P${fmt(data?.voucherDeducted)}`
      );

      setCheckoutModal(null);
      await refreshAllContent();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Checkout failed');
    } finally {
      setProcessingProduct('');
    }
  }

  // Calculate total available balance across all active vouchers
  const totalBalance = rows
    .filter(v => Number(v.status) === 1)
    .reduce((sum, v) => sum + Number(v.remaining_balance || 0), 0);

  // Check if any voucher is suspended
  const suspendedVoucher = rows.find(v => Number(v.status) === 4);

  // Voucher match is limited by cash wallet spend and remaining voucher balance.
  const matchedVoucherBudget = Math.min(totalBalance, walletBalance);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Product Vouchers</h1>
        <div className="w-12 h-0.5 mt-2" style={{ background: 'linear-gradient(90deg,#D4AF37,transparent)' }} />
      </div>

      {contentLoading ? (
        <div
          className="glass-card rounded-2xl p-8"
          style={{
            border: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(148,163,184,0.35)',
            background: isDarkMode ? 'rgba(2,6,23,0.4)' : 'rgba(248,250,252,0.92)',
          }}
        >
          <Spinner />
          <p className="text-sm text-center -mt-8" style={{ color: isDarkMode ? 'rgba(226,232,240,0.75)' : 'rgba(71,85,105,0.9)' }}>
            Loading vouchers, wallet balance, products, and transactions...
          </p>
        </div>
      ) : (
        <>

      {/* Suspended voucher notice */}
      {suspendedVoucher && (
        <div className="rounded-xl p-4" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
          <div className="flex items-start gap-3">
            <HiOutlineExclamation className="size-6 mt-0.5 flex-shrink-0" style={{ color: '#f87171' }} />
            <div>
              <p className="font-semibold text-sm" style={{ color: '#f87171' }}>Voucher Suspended</p>
              <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.72)' }}>
                {suspendedVoucher.suspend_reason || 'Your voucher has been suspended by the system. Please contact support for more information.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Info banner */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-start gap-3">
          <div className="size-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.2)' }}>
            <HiOutlineSparkles className="size-6" style={{ color: '#D4AF37' }} />
          </div>
          <div>
            <p className="portal-card-title font-semibold text-base">PRODUCT + PRODUCT VOUCHER = DOBLE SULIT</p>
            <p className="portal-card-text text-sm mt-1 leading-6">
              Buy 1 Take 1 style: every successful checkout gives you <span className="portal-card-title font-semibold">2x of the selected product</span>. Your cash payment is matched by your voucher balance, based on wallet spend.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <div className="portal-soft-panel min-w-[150px] px-4 py-3 rounded-xl">
                <p className="portal-card-muted text-[10px] uppercase tracking-wide">Available Voucher Balance</p>
                <p className="portal-warning-text text-lg font-bold">P{fmt(totalBalance)}</p>
              </div>
              <div className="portal-soft-panel min-w-[150px] px-4 py-3 rounded-xl">
                <p className="portal-card-muted text-[10px] uppercase tracking-wide">Wallet Balance</p>
                <p className="portal-card-title text-lg font-bold">P{fmt(walletBalance)}</p>
              </div>
              <div className="portal-soft-panel min-w-[150px] px-4 py-3 rounded-xl" style={{ background: 'color-mix(in srgb, var(--portal-soft-bg) 82%, rgba(16,185,129,0.12))', borderColor: 'var(--portal-success-border)' }}>
                <p className="portal-card-muted text-[10px] uppercase tracking-wide">Usable Voucher Match</p>
                <p className="portal-success-text text-lg font-bold">P{fmt(matchedVoucherBudget)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Your Vouchers */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg text-white">Your Vouchers</h2>
          <button
            onClick={refreshAllContent}
            className="text-xs px-2.5 py-1.5 rounded-lg"
            style={{ color: '#D4AF37', background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)' }}
           type="button">
            <span className="inline-flex items-center gap-1.5">
              <HiOutlineRefresh className="size-3.5" /> Refresh
            </span>
          </button>
        </div>
        {contentLoading ? (
          <Spinner />
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    {['Voucher', 'Package', 'Amount', 'Remaining', 'Issued', 'Expiry', 'Status'].map((h) => (
                      <th key={h} className="table-header py-2.5 px-2 text-left">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-t" style={{ borderColor: 'rgba(212,175,55,0.08)' }}>
                      <td className="py-2.5 px-2 text-white/85">#{r.id}</td>
                      <td className="py-2.5 px-2 text-white/70">{PACKAGE_LABELS[r.package_type] || r.package_type}</td>
                      <td className="py-2.5 px-2 text-white/80">P{fmt(r.voucher_amount)}</td>
                      <td className="py-2.5 px-2 text-white/80">P{fmt(r.remaining_balance)}</td>
                      <td className="py-2.5 px-2 text-white/60">{r.issued_date}</td>
                      <td className="py-2.5 px-2 text-white/60">
                        <div>{getExpiryDateDisplay(r)}</div>
                        <div className="text-[11px] text-white/40">{getExpiryDescription(r)}</div>
                      </td>
                      <td className="py-2.5 px-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs" style={statusStyle(r.status)}>
                          {Number(r.status) === 4 ? 'Suspended' : r.status_label}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="md:hidden space-y-3">
              {rows.map((r) => (
                <div key={r.id} className="rounded-xl p-4" style={{ border: '1px solid rgba(212,175,55,0.12)', background: 'rgba(255,255,255,0.02)' }}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-white font-semibold">Voucher #{r.id}</p>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs" style={statusStyle(r.status)}>
                      {Number(r.status) === 4 ? 'Suspended' : r.status_label}
                    </span>
                  </div>
                  <div className="mt-2 text-sm space-y-1" style={{ color: 'rgba(255,255,255,0.72)' }}>
                    <p>Package: {PACKAGE_LABELS[r.package_type] || r.package_type}</p>
                    <p>Amount: P{fmt(r.voucher_amount)}</p>
                    <p>Remaining: P{fmt(r.remaining_balance)}</p>
                    <p>Issued: {r.issued_date}</p>
                    <p>Expiry: {getExpiryDateDisplay(r)}</p>
                    <p className="text-white/40">{getExpiryDescription(r)}</p>
                  </div>
                </div>
              ))}
            </div>

            {rows.length === 0 && (
              <div className="py-10 text-center" style={{ color: 'rgba(255,255,255,0.45)' }}>
                <HiOutlineGift className="size-8 mx-auto mb-2" style={{ color: 'rgba(212,175,55,0.45)' }} />
                No vouchers yet.
              </div>
            )}
          </>
        )}
      </div>

      {/* Available Products */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <HiOutlineShoppingCart className="size-5" style={{ color: '#D4AF37' }} />
          <h2 className="font-display text-lg text-white">Available Products</h2>
        </div>
        <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Products are based on your wallet cash balance. Voucher usage can match the cash amount you spend, up to your remaining voucher balance.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {MAINTENANCE_PRODUCTS.map((p) => {
            const canAfford = Number(walletBalance || 0) >= Number(p.price || 0);
            const voucher = pickVoucherForCheckout(p.price);
            const voucherMatch = Math.min(Number(p.price || 0), Number(voucher?.remaining_balance || 0));
            const canUseVoucher = voucherMatch > 0;
            const canCheckout = canAfford && canUseVoucher;
            const checkoutLocked = Boolean(processingProduct);
            const isProcessing = processingProduct === p.name;

            return (
              <div
                key={p.name}
                onClick={canCheckout && !checkoutLocked ? () => handleProductCheckout(p) : undefined}
                className={`rrounded-xl p-4 text-center transition ${canCheckout && !checkoutLocked ? 'cursor-pointer hover:-translate-y-0.5' : ''}`}
                style={{
                  border: canCheckout ? '1px solid rgba(16,185,129,0.25)' : '1px solid rgba(255,255,255,0.08)',
                  background: canCheckout ? 'rgba(16,185,129,0.06)' : 'rgba(255,255,255,0.02)',
                }}
              >
                {MAINTENANCE_PRODUCT_IMAGES[p.key] ? (
                  <img
                    src={MAINTENANCE_PRODUCT_IMAGES[p.key]}
                    alt={p.name}
                    className="w-full h-24 object-contain rounded-xl mb-2"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(212,175,55,0.08)' }}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="size-14 mx-auto mb-2 rounded-xl flex items-center justify-center" style={{ background: 'rgba(212,175,55,0.08)' }}>
                    <HiOutlineGift className="size-7" style={{ color: canCheckout ? '#34d399' : 'rgba(255,255,255,0.3)' }} />
                  </div>
                )}
                <p className="text-sm font-medium text-white/80">{p.name}</p>
                <p className="text-xs mt-1" style={{ color: '#D4AF37' }}>P{fmt(p.price)}</p>
                <p className="text-[10px] mt-1 font-semibold" style={{ color: canCheckout ? '#34d399' : 'rgba(255,255,255,0.45)' }}>
                  You will receive 2x this product
                </p>

                <div className="mt-2 space-y-1">
                  <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.6)' }}>Wallet: P{fmt(p.price)}</p>
                  <p className="text-[11px]" style={{ color: canUseVoucher ? '#34d399' : 'rgba(255,255,255,0.5)' }}>
                    Voucher Match: P{fmt(voucherMatch)}
                  </p>
                </div>

                {canCheckout ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleProductCheckout(p);
                    }}
                    disabled={checkoutLocked}
                    className="mt-2 w-full text-[11px] px-2 py-1 rounded-lg"
                    style={{
                      color: '#34d399',
                      background: 'rgba(16,185,129,0.12)',
                      border: '1px solid rgba(16,185,129,0.28)',
                      opacity: checkoutLocked ? 0.7 : 1,
                    }}
                  >
                    {isProcessing ? 'Processing...' : 'Use Voucher'}
                  </button>
                ) : (
                  <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full" style={{ color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.05)' }}>
                    {canAfford ? 'No usable voucher' : 'Need more wallet balance'}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Voucher Transaction History */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <HiOutlineDocumentText className="size-5" style={{ color: '#D4AF37' }} />
          <h2 className="font-display text-lg text-white">Voucher Transaction History</h2>
        </div>
        {contentLoading ? (
          <Spinner />
        ) : transactions.length === 0 ? (
          <div className="py-10 text-center" style={{ color: 'rgba(255,255,255,0.35)' }}>
            <HiOutlineDocumentText className="size-8 mx-auto mb-2" style={{ color: 'rgba(212,175,55,0.3)' }} />
            No voucher transactions yet.
          </div>
        ) : (
          <>
          <div className="space-y-3 md:hidden">
            {transactions.map((t, i) => (
              <div
                key={t.id || i}
                className="rounded-xl p-4"
                style={{ border: '1px solid rgba(212,175,55,0.12)', background: 'rgba(255,255,255,0.02)' }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>{t.transaction_date}</p>
                    <p className="text-sm mt-2 text-white/80">Voucher #{t.voucher_id}</p>
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs" style={{ color: '#D4AF37', background: 'rgba(212,175,55,0.1)' }}>
                    Voucher
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
                  <div>
                    <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.45)' }}>Cash Paid</p>
                    <p className="text-white/80 mt-1">P{fmt(t.cash_paid)}</p>
                  </div>
                  <div>
                    <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.45)' }}>Voucher Used</p>
                    <p className="mt-1" style={{ color: '#f87171' }}>-P{fmt(t.voucher_used)}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.45)' }}>Total Value</p>
                    <p className="font-semibold mt-1" style={{ color: '#D4AF37' }}>P{fmt(t.total_value)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  {['Date', 'Voucher', 'Cash Paid', 'Voucher Used', 'Total Value', 'Type'].map((h) => (
                    <th key={h} className="table-header py-2.5 px-2 text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transactions.map((t, i) => (
                  <tr key={t.id || i} className="border-t" style={{ borderColor: 'rgba(212,175,55,0.08)' }}>
                    <td className="py-2.5 px-2 text-white/60 text-xs">{t.transaction_date}</td>
                    <td className="py-2.5 px-2 text-white/70">#{t.voucher_id}</td>
                    <td className="py-2.5 px-2 text-white/80">P{fmt(t.cash_paid)}</td>
                    <td className="py-2.5 px-2" style={{ color: '#f87171' }}>-P{fmt(t.voucher_used)}</td>
                    <td className="py-2.5 px-2 font-semibold" style={{ color: '#D4AF37' }}>P{fmt(t.total_value)}</td>
                    <td className="py-2.5 px-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs" style={{ color: '#D4AF37', background: 'rgba(212,175,55,0.1)' }}>
                        Voucher
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}
      </div>

      <div className="rounded-xl p-4" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)' }}>
        <div className="flex items-start gap-2">
          <HiOutlineCash className="size-5 mt-0.5" style={{ color: '#fbbf24' }} />
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>
            Voucher is for product use only and is not convertible to cash. Expired vouchers can no longer be used. Vouchers are issued once upon registration.
          </p>
        </div>
      </div>
        </>
      )}

      {checkoutModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: modalStyles.overlay }}
          onClick={closeCheckoutModal}
        >
          <div
            className="w-full max-w-md rounded-2xl p-5"
            style={{
              background: modalStyles.panelBg,
              border: modalStyles.panelBorder,
              boxShadow: modalStyles.panelShadow,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold" style={{ color: modalStyles.title }}>
                  Confirm Product Purchase
                </h3>
                <p className="text-sm mt-1" style={{ color: modalStyles.muted }}>
                  Confirm this buy 1 take 1 checkout to receive 2x of your selected product.
                </p>
              </div>
              <button
                type="button"
                onClick={closeCheckoutModal}
                disabled={Boolean(processingProduct)}
                className="size-8 rounded-lg inline-flex items-center justify-center"
                style={{ background: modalStyles.closeBg, color: modalStyles.closeColor }}
                aria-label="Close confirmation dialog"
              >
                <HiOutlineX className="size-5" />
              </button>
            </div>

            <div className="mt-4 rounded-xl p-4 space-y-2" style={{ background: modalStyles.cardBg, border: modalStyles.cardBorder }}>
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: modalStyles.body }}>Product</span>
                <span className="font-semibold" style={{ color: modalStyles.title }}>{checkoutModal.product.name}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: modalStyles.body }}>You Will Receive</span>
                <span className="font-bold" style={{ color: '#22c55e' }}>2 x {checkoutModal.product.name}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: modalStyles.body }}>Wallet Deduction</span>
                <span className="font-semibold" style={{ color: modalStyles.deduct }}>-P{fmt(checkoutModal.price)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: modalStyles.body }}>Voucher Deduction</span>
                <span className="font-semibold" style={{ color: modalStyles.deduct }}>
                  -P{fmt(checkoutModal.voucherMatch)} (#{checkoutModal.voucher.id})
                </span>
              </div>
              <div className="flex items-center justify-between text-sm pt-2 border-t" style={{ borderColor: isDarkMode ? 'rgba(148,163,184,0.25)' : 'rgba(148,163,184,0.4)' }}>
                <span style={{ color: modalStyles.body }}>Total Product Value</span>
                <span className="font-bold" style={{ color: modalStyles.total }}>P{fmt(checkoutModal.totalValue)}</span>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeCheckoutModal}
                disabled={Boolean(processingProduct)}
                className="px-3.5 py-2 rounded-lg text-sm font-medium"
                style={{
                  background: modalStyles.cancelBg,
                  color: modalStyles.cancelColor,
                  border: modalStyles.cancelBorder,
                  opacity: processingProduct ? 0.7 : 1,
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmCheckout}
                disabled={Boolean(processingProduct)}
                className="px-3.5 py-2 rounded-lg text-sm font-semibold"
                style={{
                  background: modalStyles.confirmBg,
                  color: modalStyles.confirmColor,
                  border: modalStyles.confirmBorder,
                  opacity: processingProduct ? 0.7 : 1,
                }}
              >
                {processingProduct ? 'Processing...' : 'Confirm & Get 2x'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
