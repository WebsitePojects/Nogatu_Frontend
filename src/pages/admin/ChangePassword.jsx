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
      <div className="mb-7">
        <h1 className="font-display text-2xl font-bold text-white">Change Password</h1>
        <div className="w-12 h-0.5 mt-2" style={{ background: 'linear-gradient(90deg,#D4AF37,transparent)' }} />
      </div>

      <div className="glass-card rounded-2xl p-6 max-w-md">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="label">Administrator Account</label>
            <select
              value={adminAccount}
              onChange={(e) => setAdminAccount(e.target.value)}
              className="glass-input w-full rounded-xl px-4 py-2.5 text-sm mt-1.5"
            >
              <option value="">Select account...</option>
              <option value="nogatuadmin">Nogatu Administrator</option>
              <option value="nogatucashier">Cashier</option>
              <option value="nogatubod">BOD</option>
            </select>
          </div>

          <div>
            <label className="label">Current Password</label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="glass-input w-full rounded-xl px-4 py-2.5 text-sm mt-1.5"
              required
            />
          </div>

          <div>
            <label className="label">New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="glass-input w-full rounded-xl px-4 py-2.5 text-sm mt-1.5"
              required
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="btn-success w-full rounded-xl py-2.5 px-5 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed mt-1"
          >
            {saving ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
