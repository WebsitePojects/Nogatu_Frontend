import { useState, useEffect } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';

export default function HiFiveBonus() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const res = await api.get('/hifive');
      setProducts(res.data.products);
    } catch { } finally { setLoading(false); }
  }

  async function handleRedeem(bonusType, quantity) {
    try {
      await api.post('/hifive/redeem', { bonusType, quantity });
      toast.success('Bonus redeemed successfully!');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Redemption failed');
    }
  }

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div></div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Hi-Five Bonus</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((p) => (
          <div key={p.key} className="card">
            <h3 className="font-semibold text-gray-800 mb-3">{p.name}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Current Bonus:</span><span className="font-medium">{p.bonus}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Purchases:</span><span className="font-medium">{p.purchases}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Redeemable:</span><span className="font-semibold text-emerald-600">{p.redeemable}</span></div>
            </div>
            {p.redeemable >= 1 && (
              <button onClick={() => handleRedeem(p.key, 1)} className="btn-success w-full mt-4 text-sm">
                Redeem 1 Unit
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
