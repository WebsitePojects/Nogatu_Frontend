import { useState, useEffect } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';
import { HiOutlineUser, HiOutlineLockClosed, HiOutlineLocationMarker, HiOutlinePhone, HiOutlineCreditCard, HiOutlineMail, HiOutlineCalendar } from 'react-icons/hi';
import { formatTin, isValidTin } from '../../utils/tin';
import { formatDateManila } from '../../utils/dateTime';

const PAYOUT_OPTIONS = [
  { id: 1, label: 'Pickup' },
  { id: 2, label: 'GCash' },
  { id: 3, label: 'Remittance Center' },
  { id: 4, label: 'Bank Deposit' },
  { id: 5, label: 'Others' },
  { id: 6, label: 'PSBank' },
];

function Spinner() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <div className="size-10 rounded-full border-[3px] animate-spin" style={{ borderColor: 'rgba(212,175,55,0.12)', borderTopColor: '#D4AF37' }} />
    </div>
  );
}

function FieldRow({ icon: Icon, label, children }) {
  return (
    <div>
      <label className="label flex items-center gap-1.5">
        <Icon className="size-3.5" style={{ color: 'rgba(212,175,55,0.5)' }} />
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
      const acct = res.data || {};
      // payoutid may be stored as the option LABEL (e.g. "PSBank"), but the Payout
      // Option <select> matches numeric option ids — so it showed blank "Select...".
      // Coerce to the resolved numeric id (backend resolves the stored value into
      // payoutOption; also match the label or an already-numeric value as fallbacks).
      const labelMatch = PAYOUT_OPTIONS.find(
        (o) => o.label.toLowerCase() === String(acct.payoutid || '').trim().toLowerCase()
      );
      const resolvedPayoutId = Number(acct.payoutOption?.id) || labelMatch?.id || Number(acct.payoutid) || '';
      setData({ ...acct, payoutid: resolvedPayoutId });
    } catch { } finally { setLoading(false); }
  }

  const handleChange = (field, value) => setData(prev => ({ ...prev, [field]: value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const normalizedTin = formatTin(data.tin || data.tinno || '');
      if (normalizedTin && !isValidTin(normalizedTin)) {
        toast.error('TIN must be 9–12 digits (e.g. 123-456-789-000). Use 000-000-000-000 if you do not have a TIN.');
        setSaving(false);
        return;
      }
      await api.put('/account', {
        address:       data.address,
        password:      newPassword || '',
        payoutdetails: data.payoutdetails,
        payoutoptions: Number(data.payoutid) || '',
        contactnos:    data.contactnos,
        tin:           normalizedTin,
        email:         data.email || '',
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

          <FieldRow icon={HiOutlineCalendar} label="Registered">
            <input
              type="text"
              value={formatDateManila(data.datereg, 'Not available')}
              className="glass-input opacity-50 cursor-not-allowed"
              disabled
              readOnly
            />
          </FieldRow>

          <FieldRow icon={HiOutlineMail} label={<>Email {data.emailRequired ? <span className="text-xs ml-1" style={{ color: '#F2D06B' }}>(required for password reset)</span> : null}</>}>
            <input
              type="email"
              value={data.email || ''}
              onChange={(e) => handleChange('email', e.target.value)}
              className="glass-input"
              placeholder="you@example.com"
              required
            />
          </FieldRow>

          <FieldRow icon={HiOutlineCreditCard} label="TIN No.">
            <input
              type="text"
              value={data.tin || data.tinno || ''}
              onChange={(e) => {
                const nextTin = formatTin(e.target.value);
                handleChange('tin', nextTin);
                handleChange('tinno', nextTin);
              }}
              className="glass-input"
              placeholder="e.g. 123-456-789-000"
            />
          </FieldRow>

          {data.emailRequired && (
            <p className="text-xs -mt-2" style={{ color: 'rgba(242,208,107,0.82)' }}>
              Add an email address now. This will be required for future password reset requests.
            </p>
          )}

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
