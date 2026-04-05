import { useState, useEffect } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';
import { HiOutlineUser, HiOutlineLockClosed, HiOutlineLocationMarker, HiOutlinePhone, HiOutlineCreditCard } from 'react-icons/hi';

const PAYOUT_OPTIONS = [
  { id: 1, label: 'Pickup' },
  { id: 2, label: 'GCash' },
  { id: 3, label: 'Remittance Center' },
  { id: 4, label: 'Bank Deposit' },
  { id: 5, label: 'Others' },
];

function Spinner() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <div className="w-10 h-10 rounded-full border-[3px] animate-spin" style={{ borderColor: 'rgba(212,175,55,0.12)', borderTopColor: '#D4AF37' }} />
    </div>
  );
}

function FieldRow({ icon: Icon, label, children }) {
  return (
    <div>
      <label className="label flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5" style={{ color: 'rgba(212,175,55,0.5)' }} />
        {label}
      </label>
      {children}
    </div>
  );
}

export default function AccountDetails() {
  const [data, setData]           = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);

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
        address:       data.address,
        password:      newPassword || '',
        payoutdetails: data.payoutdetails,
        payoutoptions: Number(data.payoutid) || '',
        contactnos:    data.contactnos,
        tinno:         data.tinno || '',
      });
      toast.success('Account updated successfully');
      setNewPassword('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Update failed');
    } finally { setSaving(false); }
  }

  if (loading) return <Spinner />;
  if (!data)   return <p style={{ color: 'rgba(255,255,255,0.4)' }}>Failed to load account data.</p>;

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Account Details</h1>
        <div className="w-10 h-0.5 mt-2 rounded-full" style={{ background: 'linear-gradient(90deg,#D4AF37,transparent)' }} />
      </div>

      <div className="glass-card rounded-2xl p-7 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Read-only fields */}
          <FieldRow icon={HiOutlineUser} label="Account Name">
            <input
              type="text"
              value={data.fullname || ''}
              className="glass-input opacity-50 cursor-not-allowed"
              disabled
            />
          </FieldRow>

          <FieldRow icon={HiOutlineUser} label="Username">
            <input
              type="text"
              value={data.username || ''}
              className="glass-input opacity-50 cursor-not-allowed"
              disabled
            />
          </FieldRow>

          <FieldRow icon={HiOutlineCreditCard} label="TIN (Tax Identification Number)">
            <input
              type="text"
              value={data.tin || 'Not available'}
              className="glass-input opacity-50 cursor-not-allowed"
              disabled
            />
          </FieldRow>

          {/* Password */}
          <FieldRow icon={HiOutlineLockClosed} label={<>New Password <span className="text-xs ml-1" style={{ color: 'rgba(255,255,255,0.25)' }}>(leave blank to keep current)</span></>}>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="glass-input pr-16"
                placeholder="Enter new password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium transition-colors px-1"
                style={{ color: 'rgba(212,175,55,0.5)' }}
                onMouseEnter={e => e.currentTarget.style.color = 'rgba(212,175,55,0.9)'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(212,175,55,0.5)'}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </FieldRow>

          {/* Address */}
          <FieldRow icon={HiOutlineLocationMarker} label="Address">
            <input
              type="text"
              value={data.address || ''}
              onChange={(e) => handleChange('address', e.target.value)}
              className="glass-input"
              placeholder="Your address"
            />
          </FieldRow>

          {/* Contact */}
          <FieldRow icon={HiOutlinePhone} label="Contact Numbers">
            <input
              type="text"
              value={data.contactnos || ''}
              onChange={(e) => handleChange('contactnos', e.target.value)}
              className="glass-input"
              placeholder="e.g. 09xxxxxxxxx"
            />
          </FieldRow>

          {/* TIN No */}
          <FieldRow icon={HiOutlineCreditCard} label="TIN No.">
            <input
              type="text"
              value={data.tinno || ''}
              onChange={(e) => handleChange('tinno', e.target.value)}
              className="glass-input"
              placeholder="e.g. 123-456-789-000"
            />
          </FieldRow>

          {/* Payout Option */}
          <FieldRow icon={HiOutlineCreditCard} label="Payout Option">
            <select
              value={data.payoutid || ''}
              onChange={(e) => handleChange('payoutid', Number(e.target.value) || '')}
              className="glass-input"
              style={{ appearance: 'none', cursor: 'pointer' }}
            >
              <option value="" style={{ background: '#1A1610' }}>Select option…</option>
              {PAYOUT_OPTIONS.map(opt => (
                <option key={opt.id} value={opt.id} style={{ background: '#1A1610' }}>{opt.label}</option>
              ))}
            </select>
          </FieldRow>

          {/* Payout Details */}
          {Number(data.payoutid) === 1 ? (
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Pickup - bring valid ID on payout day (Friday).</p>
          ) : (
            <FieldRow icon={HiOutlineCreditCard} label="Payout Details">
              <input
                type="text"
                value={data.payoutdetails || ''}
                onChange={(e) => handleChange('payoutdetails', e.target.value)}
                className="glass-input"
                placeholder="e.g. GCash 09xxxxxxxxx"
              />
            </FieldRow>
          )}

          {/* Divider */}
          <div className="h-px" style={{ background: 'rgba(212,175,55,0.1)' }} />

          <button
            type="submit"
            disabled={saving}
            className="gold-btn py-2.5 px-7 rounded-xl text-sm"
          >
            {saving ? 'Saving…' : 'Update Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
