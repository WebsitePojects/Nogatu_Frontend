import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api';
import toast from 'react-hot-toast';

const PAYOUT_OPTIONS = [
  { id: 1, label: 'Pickup' },
  { id: 2, label: 'GCash' },
  { id: 3, label: 'Remittance Center' },
  { id: 4, label: 'Bank Deposit' },
  { id: 5, label: 'Others' },
  { id: 6, label: 'PSBank' },
];

export default function UpdateAccounts() {
  const { uid } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get(`/admin/accounts/${uid}`)
      .then(res => {
        const acct = res.data || {};
        // payoutid may be stored as the option LABEL ("PSBank") but the Payout Option
        // <select> matches numeric ids -> it rendered blank "Select...". Coerce to the
        // resolved numeric id (payoutOption from backend, else label/numeric fallback).
        const labelMatch = PAYOUT_OPTIONS.find(
          (o) => o.label.toLowerCase() === String(acct.payoutid || '').trim().toLowerCase()
        );
        const resolvedPayoutId = Number(acct.payoutOption?.id) || labelMatch?.id || Number(acct.payoutid) || '';
        setData({ ...acct, payoutid: resolvedPayoutId });
      })
      .catch(() => toast.error('Account not found'))
      .finally(() => setLoading(false));
  }, [uid]);

  const handleChange = (field, value) => setData(prev => ({ ...prev, [field]: value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const normalizedTin = data.tin ?? data.tinno ?? '';
      await api.put(`/admin/accounts/${uid}`, {
        firstname: data.firstname, lastname: data.lastname, middlename: data.middlename,
        address: data.address, password: newPassword || '',
        payoutdetails: data.payoutdetails, payoutoptions: data.payoutid, contactnos: data.contactnos,
        tin: normalizedTin,
        tinno: normalizedTin,
      });
      toast.success('Account updated successfully');
    } catch (err) { toast.error('Update failed'); } finally { setSaving(false); }
  }

  if (loading) return (
    <div className="flex justify-center py-20">
      <div
        className="animate-spin rounded-full size-10 border-4"
        style={{ borderColor: 'rgba(212,175,55,0.15)', borderTopColor: 'rgba(212,175,55,0.75)' }}
      />
    </div>
  );

  if (!data) return (
    <p className="text-white/40 text-center py-20">Account not found.</p>
  );

  return (
    <div>
      <div className="flex items-center gap-4 mb-7">
        <button
          onClick={() => navigate('/admin/accounts')}
          className="gold-btn rounded-lg py-1.5 px-4 text-sm"
         type="button">
          Back
        </button>
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Update Account</h1>
          <div className="w-12 h-0.5 mt-2" style={{ background: 'linear-gradient(90deg,#D4AF37,transparent)' }} />
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label">First Name</label>
              <input
                type="text"
                value={data.firstname || ''}
                onChange={(e) => handleChange('firstname', e.target.value)}
                className="glass-input w-full rounded-xl px-4 py-2.5 text-sm mt-1.5"
              />
            </div>
            <div>
              <label className="label">Last Name</label>
              <input
                type="text"
                value={data.lastname || ''}
                onChange={(e) => handleChange('lastname', e.target.value)}
                className="glass-input w-full rounded-xl px-4 py-2.5 text-sm mt-1.5"
              />
            </div>
            <div>
              <label className="label">Middle Name</label>
              <input
                type="text"
                value={data.middlename || ''}
                onChange={(e) => handleChange('middlename', e.target.value)}
                className="glass-input w-full rounded-xl px-4 py-2.5 text-sm mt-1.5"
              />
            </div>
          </div>

          {/* Username (read-only) */}
          <div>
            <label className="label">Username</label>
            <input
              type="text"
              value={data.username || ''}
              className="glass-input w-full rounded-xl px-4 py-2.5 text-sm mt-1.5 opacity-50 cursor-not-allowed"
              disabled
            />
          </div>

          {/* New Password */}
          <div>
            <label className="label">
              New Password{' '}
              <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.7rem' }}>(leave blank to keep current)</span>
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="glass-input w-full rounded-xl px-4 py-2.5 text-sm mt-1.5"
              placeholder="Enter new password"
            />
          </div>

          {/* Address */}
          <div>
            <label className="label">Address</label>
            <input
              type="text"
              value={data.address || ''}
              onChange={(e) => handleChange('address', e.target.value)}
              className="glass-input w-full rounded-xl px-4 py-2.5 text-sm mt-1.5"
            />
          </div>

          {/* Contact */}
          <div>
            <label className="label">Contact Numbers</label>
            <input
              type="text"
              value={data.contactnos || ''}
              onChange={(e) => handleChange('contactnos', e.target.value)}
              className="glass-input w-full rounded-xl px-4 py-2.5 text-sm mt-1.5"
            />
          </div>

          {/* TIN No. */}
          <div>
            <label className="label">TIN No.</label>
            <input
              type="text"
              value={data.tin ?? data.tinno ?? ''}
              onChange={(e) => {
                const nextTin = e.target.value;
                handleChange('tin', nextTin);
                handleChange('tinno', nextTin);
              }}
              className="glass-input w-full rounded-xl px-4 py-2.5 text-sm mt-1.5"
              placeholder="Enter TIN number"
            />
          </div>

          {/* Payout Option */}
          <div>
            <label className="label">Payout Option</label>
            <select
              value={data.payoutid || ''}
              onChange={(e) => handleChange('payoutid', Number(e.target.value) || '')}
              className="glass-input w-full rounded-xl px-4 py-2.5 text-sm mt-1.5"
            >
              <option value="">Select...</option>
              {PAYOUT_OPTIONS.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
            </select>
          </div>

          {/* Payout Details */}
          <div>
            <label className="label">Payout Details</label>
            <input
              type="text"
              value={data.payoutdetails || ''}
              onChange={(e) => handleChange('payoutdetails', e.target.value)}
              className="glass-input w-full rounded-xl px-4 py-2.5 text-sm mt-1.5"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="btn-success w-full rounded-xl py-2.5 px-5 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {saving ? 'Saving...' : 'Update Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
