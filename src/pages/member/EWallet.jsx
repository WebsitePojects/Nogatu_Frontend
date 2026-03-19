import { useState, useEffect } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';

const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function EWallet() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [encashAmount, setEncashAmount] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const res = await api.get('/wallet');
      setData(res.data);
    } catch { } finally { setLoading(false); }
  }

  async function handleEncash(e) {
    e.preventDefault();
    const amount = Number(encashAmount);
    if (amount < 500) return toast.error('Minimum encashment is ₱500');
    if (amount > (data?.cashBalance || 0)) return toast.error('Insufficient balance');
    setProcessing(true);
    try {
      const res = await api.post('/wallet/encash', { amount });
      toast.success(`Encashment of ₱${fmt(amount)} processed successfully`);
      setEncashAmount('');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Encashment failed');
    } finally { setProcessing(false); }
  }

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div></div>;
  if (!data) return <p>Failed to load wallet data.</p>;

  const incomeItems = [
    { label: 'Direct Referral', value: data.directReferral, color: 'text-brand-gold-dark' },
    { label: 'Binary Pairing', value: data.pairing, color: 'text-brand-brown' },
    { label: 'Leadership Bonus', value: data.leadership, color: 'text-amber-700' },
    { label: 'Uni-Level', value: data.unilevel, color: 'text-amber-600' },
    { label: 'Hi-Five Bonus', value: data.hifive, color: 'text-brand-brown-light' },
    { label: 'LPC (Ranking)', value: data.lpc, color: 'text-yellow-700' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">E-Wallet</h1>

      {/* Balance Card */}
      <div className="rounded-2xl p-6 text-white mb-6 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #592219 0%, #3A1000 100%)' }}>
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, rgba(212,165,40,0.06) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        <div className="relative z-10">
          <p className="text-brand-gold-light/70 text-sm">Available Balance</p>
          <p className="text-4xl font-bold mt-1">₱{fmt(data.cashBalance)}</p>
          <p className="text-brand-gold-light/50 text-sm mt-2">Total Income: ₱{fmt(data.totalIncome)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income Breakdown */}
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">Income Breakdown</h3>
          <div className="space-y-3">
            {incomeItems.map((item, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <span className="text-sm text-gray-600">{item.label}</span>
                <span className={`font-semibold ${item.color}`}>₱{fmt(item.value)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Encashment */}
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">Request Encashment</h3>
          <p className="text-sm text-gray-500 mb-4">Minimum encashment: ₱500.00. Deductions: 10% tax + ₱50 fee.</p>
          <form onSubmit={handleEncash} className="space-y-4">
            <div>
              <label className="label">Amount (₱)</label>
              <input type="number" value={encashAmount} onChange={(e) => setEncashAmount(e.target.value)} className="input-field" placeholder="Enter amount" min="500" step="1" required />
            </div>
            <button type="submit" disabled={processing} className="btn-success w-full disabled:opacity-50">
              {processing ? 'Processing...' : 'Submit Encashment'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
