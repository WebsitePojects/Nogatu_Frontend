import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api';
import toast from 'react-hot-toast';

const PAYOUT_OPTIONS = ['Pickup', 'Gcash', 'Remittance Center', 'Bank Deposit', 'Others'];

export default function UpdateAccounts() {
  const { uid } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get(`/admin/accounts/${uid}`).then(res => setData(res.data)).catch(() => toast.error('Account not found')).finally(() => setLoading(false));
  }, [uid]);

  const handleChange = (field, value) => setData(prev => ({ ...prev, [field]: value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/admin/accounts/${uid}`, {
        firstname: data.firstname, lastname: data.lastname, middlename: data.middlename,
        address: data.address, password: newPassword || '',
        payoutdetails: data.payoutdetails, payoutoptions: data.payoutid, contactnos: data.contactnos,
      });
      toast.success('Account updated successfully');
    } catch (err) { toast.error('Update failed'); } finally { setSaving(false); }
  }

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div></div>;
  if (!data) return <p>Account not found.</p>;

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/admin/accounts')} className="btn-secondary text-sm">Back</button>
        <h1 className="text-2xl font-bold text-gray-800">Update Account</h1>
      </div>
      <div className="card max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div><label className="label">First Name</label><input type="text" value={data.firstname || ''} onChange={(e) => handleChange('firstname', e.target.value)} className="input-field" /></div>
            <div><label className="label">Last Name</label><input type="text" value={data.lastname || ''} onChange={(e) => handleChange('lastname', e.target.value)} className="input-field" /></div>
            <div><label className="label">Middle Name</label><input type="text" value={data.middlename || ''} onChange={(e) => handleChange('middlename', e.target.value)} className="input-field" /></div>
          </div>
          <div><label className="label">Username</label><input type="text" value={data.username || ''} className="input-field bg-gray-50" disabled /></div>
          <div><label className="label">New Password <span className="text-xs text-gray-400">(leave blank to keep current)</span></label><input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="input-field" placeholder="Enter new password" /></div>
          <div><label className="label">Address</label><input type="text" value={data.address || ''} onChange={(e) => handleChange('address', e.target.value)} className="input-field" /></div>
          <div><label className="label">Contact Numbers</label><input type="text" value={data.contactnos || ''} onChange={(e) => handleChange('contactnos', e.target.value)} className="input-field" /></div>
          <div>
            <label className="label">Payout Option</label>
            <select value={data.payoutid || ''} onChange={(e) => handleChange('payoutid', e.target.value)} className="input-field">
              <option value="">Select...</option>
              {PAYOUT_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
          <div><label className="label">Payout Details</label><input type="text" value={data.payoutdetails || ''} onChange={(e) => handleChange('payoutdetails', e.target.value)} className="input-field" /></div>
          <button type="submit" disabled={saving} className="btn-success disabled:opacity-50">{saving ? 'Saving...' : 'Update Account'}</button>
        </form>
      </div>
    </div>
  );
}
