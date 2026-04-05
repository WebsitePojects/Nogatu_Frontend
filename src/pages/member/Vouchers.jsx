import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { HiOutlineGift, HiOutlineSparkles, HiOutlineCash, HiOutlineRefresh } from 'react-icons/hi';
import api from '../../api';

const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function Spinner() {
  return (
    <div className="flex justify-center py-14">
      <div className="w-10 h-10 rounded-full border-[3px] animate-spin" style={{ borderColor: 'rgba(212,175,55,0.12)', borderTopColor: '#D4AF37' }} />
    </div>
  );
}

function statusStyle(status) {
  if (Number(status) === 3) {
    return { color: '#60a5fa', background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)' };
  }
  if (Number(status) === 2) {
    return { color: '#f87171', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' };
  }
  return { color: '#34d399', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)' };
}

export default function Vouchers() {
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(false);
  const [rows, setRows] = useState([]);
  const [voucherId, setVoucherId] = useState('');
  const [cashAmount, setCashAmount] = useState('');
  const [lastRedeem, setLastRedeem] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const res = await api.get('/vouchers');
      const vouchers = res.data.vouchers || [];
      setRows(vouchers);

      const firstActive = vouchers.find((v) => Number(v.status) === 1 && Number(v.remaining_balance || 0) > 0);
      if (firstActive) {
        setVoucherId(String(firstActive.id));
      }
    } catch {
      toast.error('Unable to load vouchers');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  const activeOptions = useMemo(
    () => rows.filter((v) => Number(v.status) === 1 && Number(v.remaining_balance || 0) > 0),
    [rows]
  );

  async function handleRedeem(e) {
    e.preventDefault();

    if (!voucherId) {
      toast.error('Please select an active voucher');
      return;
    }

    const amount = Number(cashAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Please enter a valid cash amount');
      return;
    }

    setRedeeming(true);
    try {
      const res = await api.post('/vouchers/redeem', {
        voucherId: Number(voucherId),
        cashAmount: amount,
      });

      setLastRedeem(res.data);
      toast.success('Voucher redeemed successfully');
      setCashAmount('');
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Voucher redemption failed');
    } finally {
      setRedeeming(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Product Vouchers</h1>
        <div className="w-12 h-0.5 mt-2" style={{ background: 'linear-gradient(90deg,#D4AF37,transparent)' }} />
      </div>

      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.2)' }}>
            <HiOutlineSparkles className="w-6 h-6" style={{ color: '#D4AF37' }} />
          </div>
          <div>
            <p className="font-semibold text-white text-base">PRODUCT + PRODUCT VOUCHER = DOBLE SULIT</p>
            <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.72)' }}>
              Buy 1 Take 1 style: the cash you pay can be matched by your voucher balance for eligible product purchases.
            </p>
            <p className="text-sm mt-1.5" style={{ color: 'rgba(212,175,55,0.9)' }}>
              Example: If you pay with cash and your voucher has enough balance, your total product value is doubled.
            </p>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg text-white">Redeem Voucher</h2>
          <button
            onClick={loadData}
            className="text-xs px-2.5 py-1.5 rounded-lg"
            style={{ color: '#D4AF37', background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)' }}
          >
            <span className="inline-flex items-center gap-1.5">
              <HiOutlineRefresh className="w-3.5 h-3.5" /> Refresh
            </span>
          </button>
        </div>

        <form onSubmit={handleRedeem} className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="label">Active Voucher</label>
            <select
              value={voucherId}
              onChange={(e) => setVoucherId(e.target.value)}
              className="glass-input"
              required
            >
              <option value="">Select voucher</option>
              {activeOptions.map((v) => (
                <option key={v.id} value={v.id}>
                  #{v.id} - Balance ₱{fmt(v.remaining_balance)} - Expires {v.expiry_date}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Cash Amount</label>
            <input
              type="number"
              min="1"
              step="0.01"
              value={cashAmount}
              onChange={(e) => setCashAmount(e.target.value)}
              className="glass-input"
              placeholder="e.g. 2500"
              required
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={redeeming || activeOptions.length === 0}
              className="gold-btn w-full py-2.5 rounded-xl text-sm disabled:opacity-60"
            >
              {redeeming ? 'Processing...' : 'Redeem Voucher'}
            </button>
          </div>
        </form>

        {lastRedeem && (
          <div className="mt-4 rounded-xl p-4" style={{ border: '1px solid rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.08)' }}>
            <p className="text-sm font-semibold" style={{ color: '#34d399' }}>Redeem Summary</p>
            <div className="mt-2 text-sm space-y-1" style={{ color: 'rgba(255,255,255,0.82)' }}>
              <p>Cash Paid: ₱{fmt(lastRedeem.cashPaid)}</p>
              <p>Voucher Deducted: ₱{fmt(lastRedeem.voucherDeducted)}</p>
              <p>Total Product Value: ₱{fmt(lastRedeem.totalProductValue)}</p>
              <p>Remaining Voucher Balance: ₱{fmt(lastRedeem.remainingBalance)}</p>
            </div>
          </div>
        )}
      </div>

      <div className="glass-card rounded-2xl p-6">
        <h2 className="font-display text-lg text-white mb-4">Your Vouchers</h2>
        {loading ? (
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
                      <td className="py-2.5 px-2 text-white/70">{r.package_type}</td>
                      <td className="py-2.5 px-2 text-white/80">₱{fmt(r.voucher_amount)}</td>
                      <td className="py-2.5 px-2 text-white/80">₱{fmt(r.remaining_balance)}</td>
                      <td className="py-2.5 px-2 text-white/60">{r.issued_date}</td>
                      <td className="py-2.5 px-2 text-white/60">{r.expiry_date}</td>
                      <td className="py-2.5 px-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs" style={statusStyle(r.status)}>
                          {r.status_label}
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
                      {r.status_label}
                    </span>
                  </div>
                  <div className="mt-2 text-sm space-y-1" style={{ color: 'rgba(255,255,255,0.72)' }}>
                    <p>Package: {r.package_type}</p>
                    <p>Amount: ₱{fmt(r.voucher_amount)}</p>
                    <p>Remaining: ₱{fmt(r.remaining_balance)}</p>
                    <p>Issued: {r.issued_date}</p>
                    <p>Expiry: {r.expiry_date}</p>
                  </div>
                </div>
              ))}
            </div>

            {rows.length === 0 && (
              <div className="py-10 text-center" style={{ color: 'rgba(255,255,255,0.45)' }}>
                <HiOutlineGift className="w-8 h-8 mx-auto mb-2" style={{ color: 'rgba(212,175,55,0.45)' }} />
                No vouchers yet.
              </div>
            )}
          </>
        )}
      </div>

      <div className="rounded-xl p-4" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)' }}>
        <div className="flex items-start gap-2">
          <HiOutlineCash className="w-5 h-5 mt-0.5" style={{ color: '#fbbf24' }} />
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>
            Voucher is for product use only and is not convertible to cash. Expired vouchers can no longer be redeemed.
          </p>
        </div>
      </div>
    </div>
  );
}
