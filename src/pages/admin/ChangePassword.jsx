import { useState } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';

export default function ChangePassword() {
  const [adminAccount, setAdminAccount] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!adminAccount || !password || !oldPassword) return toast.error('All fields required');
    if (password.length < 6) return toast.error('New password must be at least 6 characters');
    setSaving(true);
    try {
      await api.post('/admin/accounts/change-password', { adminAccount, password, oldPassword });
      toast.success('Password changed successfully');
      setPassword('');
      setOldPassword('');
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); } finally { setSaving(false); }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Change Password</h1>
      <div className="card max-w-md">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="label">Administrator Account</label>
            <select value={adminAccount} onChange={(e) => setAdminAccount(e.target.value)} className="input-field">
              <option value="">Select account...</option>
              <option value="admin">Nogatu Administrator</option>
              <option value="cashier">Cashier</option>
              <option value="bod">BOD</option>
            </select>
          </div>
          <div>
            <label className="label">Current Password</label>
            <input type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} className="input-field" required />
          </div>
          <div>
            <label className="label">New Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field" required />
          </div>
          <button type="submit" disabled={saving} className="btn-success disabled:opacity-50">{saving ? 'Changing...' : 'Change Password'}</button>
        </form>
      </div>
    </div>
  );
}
