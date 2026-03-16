import { useState, useEffect } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';

const PAYOUT_OPTIONS = ['Pickup', 'Gcash', 'Remittance Center', 'Bank Deposit', 'Others'];

export default function AccountDetails() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const res = await api.get('/account');
      setData(res.data);
    } catch { } finally { setLoading(false); }
  }

  const handleChange = (field, value) => setData(prev => ({ ...prev, [field]: value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/account', {
        address: data.address,
        password: data.password,
        payoutdetails: data.payoutdetails,
        payoutoptions: data.payoutid,
        contactnos: data.contactnos,
      });
      toast.success('Account updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Update failed');
    } finally { setSaving(false); }
  }

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div></div>;
  if (!data) return <p>Failed to load account data.</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Account Details</h1>
      <div className="card max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="label">Account Name</label>
            <input type="text" value={data.fullname || ''} className="input-field bg-gray-50" disabled />
          </div>
          <div>
            <label className="label">Username</label>
            <input type="text" value={data.username || ''} className="input-field bg-gray-50" disabled />
          </div>
          <div>
            <label className="label">Password</label>
            <input type="text" value={data.password || ''} onChange={(e) => handleChange('password', e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="label">Address</label>
            <input type="text" value={data.address || ''} onChange={(e) => handleChange('address', e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="label">Contact Numbers</label>
            <input type="text" value={data.contactnos || ''} onChange={(e) => handleChange('contactnos', e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="label">Payout Option</label>
            <select value={data.payoutid || ''} onChange={(e) => handleChange('payoutid', e.target.value)} className="input-field">
              <option value="">Select...</option>
              {PAYOUT_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Payout Details</label>
            <input type="text" value={data.payoutdetails || ''} onChange={(e) => handleChange('payoutdetails', e.target.value)} className="input-field" placeholder="e.g. GCash 09xxxxxxxxx" />
          </div>
          <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
            {saving ? 'Saving...' : 'Update Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
