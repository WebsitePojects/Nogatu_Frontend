import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import CodeUseConfirmModal from '../../components/CodeUseConfirmModal';
import { formatTin, isValidTin } from '../../utils/tin';
import { apiUrl } from '../../utils/apiBase';

export default function Join() {
  const { token } = useParams();
  const [invite, setInvite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [codePreview, setCodePreview] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  const [form, setForm] = useState({
    activationCode: '',
    username: '',
    password: '',
    firstname: '',
    lastname: '',
    middlename: '',
    email: '',
    address: '',
    tin: '',
    contactno: '',
    dob: '',
  });

  useEffect(() => {
    async function loadInvite() {
      try {
        const res = await fetch(apiUrl(`/registration/referral/${token}`), { credentials: 'include' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Referral invite not found.');
        setInvite(data.invite);
      } catch (err) {
        setMessage({ type: 'error', text: err.message || 'Referral invite not found.' });
      } finally {
        setLoading(false);
      }
    }
    loadInvite();
  }, [token]);

  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  async function validateCode(showFeedback = true) {
    if (!form.activationCode) return null;
    const res = await fetch(apiUrl(`/registration/validate-code?code=${encodeURIComponent(form.activationCode)}`), { credentials: 'include' });
    const data = await res.json();
    setCodePreview(data);
    if (showFeedback && (!data.valid || !data.canRegister)) {
      setConfirmModal({
        tone: 'red',
        title: 'This code cannot be used for registration',
        message: data.reason || 'Only available package entry codes can be used for registration.',
        details: data.code ? [
          { label: 'Code', value: data.code },
          { label: 'Detected type', value: data.accountLabel || 'Unknown' },
        ] : [],
      });
    }
    return data;
  }

  async function performSubmit() {
    setSubmitting(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await fetch(apiUrl('/registration/public-register'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, token, slug: invite?.reusable ? token : undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed.');
      setConfirmModal(null);
      setMessage({ type: 'success', text: 'Account registered successfully. You may now sign in through the member portal.' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Registration failed.' });
    } finally {
      setSubmitting(false);
    }
  }

  async function submit(e) {
    e.preventDefault();
    const preview = await validateCode(false);
    if (!preview?.valid || !preview?.canRegister) {
      setConfirmModal({
        tone: 'red',
        title: 'Registration code is not ready to use',
        message: preview?.reason || 'Please use a valid package entry code before continuing.',
        details: preview?.code ? [
          { label: 'Code', value: preview.code },
          { label: 'Detected type', value: preview.accountLabel || 'Unknown' },
        ] : [],
      });
      return;
    }

    if (!isValidTin(form.tin)) {
      setMessage({ type: 'error', text: 'TIN must contain 9-15 digits.' });
      return;
    }

    setConfirmModal({
      tone: 'gold',
      title: 'Consume this code and create the account?',
      message: 'This code will be consumed immediately after confirmation and cannot be reused.',
      confirmLabel: 'Register Account',
      onConfirm: performSubmit,
      details: [
        { label: 'Code', value: preview.code || form.activationCode },
        { label: 'Account type', value: preview.accountLabel || 'Package entry code' },
        { label: 'Sponsor', value: invite?.sponsor_username || 'Sponsor account' },
      ],
    });
  }

  return (
    <div className="pt-28 sm:pt-32 pb-14 min-h-screen bg-[#FFFDF5] relative overflow-hidden">
      <CodeUseConfirmModal
        open={Boolean(confirmModal)}
        tone={confirmModal?.tone || 'gold'}
        title={confirmModal?.title}
        message={confirmModal?.message}
        details={confirmModal?.details || []}
        confirmLabel={confirmModal?.confirmLabel || 'Close'}
        onConfirm={confirmModal?.onConfirm || (() => setConfirmModal(null))}
        onClose={() => setConfirmModal(null)}
        busy={submitting}
      />

      <div className="absolute inset-0 pointer-events-none bg-geo-pattern" />
      <div className="section-container relative z-10">
        <div className="max-w-3xl mx-auto text-center mb-10">
          <span className="inline-block px-4 py-1.5 rounded-full bg-brand-gold/10 text-brand-gold-dark font-medium text-sm mb-4 border border-brand-gold/20">
            Referral Registration
          </span>
          <h1 className="text-3xl md:text-5xl font-bold text-brand-brown mb-4">Create Your Member Account</h1>
          <p className="text-gray-600 leading-relaxed">
            Use your sponsor's referral ID and your activation code to register your account.
          </p>
        </div>

        <div className="max-w-2xl mx-auto rounded-2xl border border-brand-gold/25 bg-white p-6 sm:p-8 shadow-xl">
          {loading ? (
            <p className="text-gray-600">Checking referral ID...</p>
          ) : invite ? (
            <>
              <div className="rounded-xl bg-[#FFF8E1] border border-brand-gold/25 p-4 mb-6 text-sm text-brand-brown">
                Sponsor: <strong>{invite.sponsor_username}</strong>{invite.reusable ? ' | Reusable sponsor referral' : ` | Placement UID: ${invite.placement_uid} | Position: ${Number(invite.position) === 1 ? 'Left' : 'Right'}`}
                {invite.placement?.note ? (
                  <div className="mt-2 text-brand-brown/80">
                    {invite.placement.note}
                  </div>
                ) : null}
              </div>
              <form onSubmit={submit} className="space-y-4">
                {[
                  { key: 'activationCode', label: 'Activation Code', type: 'text' },
                  { key: 'firstname', label: 'First Name', type: 'text' },
                  { key: 'lastname', label: 'Last Name', type: 'text' },
                  { key: 'middlename', label: 'Middle Name', type: 'text', optional: true },
                  { key: 'email', label: 'Email', type: 'email' },
                  { key: 'address', label: 'Address', type: 'text' },
                  { key: 'contactno', label: 'Contact Number', type: 'text' },
                  { key: 'dob', label: 'Date of Birth', type: 'date' },
                  { key: 'tin', label: 'TIN', type: 'text' },
                  { key: 'username', label: 'Username', type: 'text' },
                  { key: 'password', label: 'Password', type: 'password' },
                ].map((field) => (
                  <label key={field.key} className="block">
                    <span className="block text-sm font-semibold text-brand-brown mb-2">{field.label}</span>
                    {field.key === 'password' ? (
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={form[field.key]}
                          onChange={(e) => updateField(field.key, e.target.value)}
                          required={!field.optional}
                          className="w-full rounded-xl border border-primary-200/70 bg-[#FFFDF5] px-4 py-3 pr-20 text-sm text-gray-800 outline-none focus:border-brand-gold-dark focus:ring-2 focus:ring-brand-gold/20"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((current) => !current)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-brand-gold-dark"
                        >
                          {showPassword ? 'Hide' : 'Show'}
                        </button>
                      </div>
                    ) : (
                      <input
                        type={field.type}
                        value={form[field.key]}
                        onChange={(e) => updateField(field.key, field.key === 'tin' ? formatTin(e.target.value) : e.target.value)}
                        onBlur={field.key === 'activationCode' ? () => validateCode(true) : undefined}
                        required={!field.optional}
                        className="w-full rounded-xl border border-primary-200/70 bg-[#FFFDF5] px-4 py-3 text-sm text-gray-800 outline-none focus:border-brand-gold-dark focus:ring-2 focus:ring-brand-gold/20"
                      />
                    )}
                  </label>
                ))}
                {codePreview?.accountLabel && codePreview?.valid && codePreview?.canRegister ? (
                  <div className="rounded-xl bg-[#FFF8E1] border border-brand-gold/25 px-4 py-3 text-sm text-brand-brown">
                    This code will consume: <strong>{codePreview.accountLabel}</strong>
                  </div>
                ) : null}
                {message.text && (
                  <div className={`rounded-xl px-4 py-3 text-sm ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    {message.text}
                  </div>
                )}
                <button type="submit" disabled={submitting || message.type === 'success'} className="btn-landing-primary w-full disabled:opacity-60">
                  {submitting ? 'Registering...' : 'Register Account'}
                </button>
              </form>
            </>
          ) : (
            <div className="rounded-xl bg-red-50 text-red-700 border border-red-200 px-4 py-3 text-sm">
              {message.text || 'Referral invite not found.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
