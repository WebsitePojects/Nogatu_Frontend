import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import CodeUseConfirmModal from '../../components/CodeUseConfirmModal';
import DobPicker from '../../components/DobPicker';
import { formatTin, isValidTin, isZeroTin } from '../../utils/tin';
import { apiUrl } from '../../utils/apiBase';

export default function Join() {
  const { token } = useParams();
  const [invite, setInvite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [codePreview, setCodePreview] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  const [feedbackModal, setFeedbackModal] = useState(null);
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
        setFeedbackModal({
          tone: 'red',
          title: 'Referral link unavailable',
          message: err.message || 'Referral invite not found.',
        });
      } finally {
        setLoading(false);
      }
    }
    loadInvite();
  }, [token]);

  const NAME_FIELDS = new Set(['firstname', 'lastname', 'middlename']);
  const updateField = (field, value) => {
    const sanitized = NAME_FIELDS.has(field) ? value.replace(/[0-9]/g, '') : value;
    setForm((current) => ({ ...current, [field]: sanitized }));
  };

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
    try {
      const res = await fetch(apiUrl('/registration/public-register'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, token, slug: invite?.reusable ? token : undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed.');
      setFeedbackModal({
        tone: 'gold',
        title: 'Registration successful',
        message: 'Account registered successfully. You may now sign in through the member portal.',
      });
    } catch (err) {
      setFeedbackModal({
        tone: 'red',
        title: 'Registration failed',
        message: err.message || 'Registration failed.',
      });
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

    // Phone: 10–11 digits
    const phoneDigits = String(form.contactno || '').replace(/\D/g, '');
    if (phoneDigits.length < 10 || phoneDigits.length > 11) {
      setFeedbackModal({ tone: 'red', title: 'Invalid contact number', message: 'Contact number must be 10–11 digits (e.g. 09XXXXXXXXX).' });
      return;
    }

    // DOB: must be in the past (no future dates)
    if (form.dob) {
      const dob = new Date(form.dob);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const maxAge = new Date(today);
      maxAge.setFullYear(maxAge.getFullYear() - 120);
      if (dob >= today) {
        setFeedbackModal({ tone: 'red', title: 'Invalid date of birth', message: 'Date of birth must be in the past.' });
        return;
      }
      if (dob < maxAge) {
        setFeedbackModal({ tone: 'red', title: 'Invalid date of birth', message: 'Please enter a valid date of birth.' });
        return;
      }
    }

    // TIN: 000-000-000-000 bypasses duplicate check; otherwise validate format
    const tinVal = formatTin(form.tin);
    if (tinVal && !isZeroTin(tinVal) && !isValidTin(tinVal)) {
      setFeedbackModal({
        tone: 'red',
        title: 'Invalid TIN',
        message: 'TIN must be 9–12 digits (e.g. 123-456-789-000). Use 000-000-000-000 if you do not have a TIN.',
      });
      return;
    }

    setConfirmModal({
      tone: 'gold',
      title: 'Consume this code and create the account?',
      message: 'This code will be consumed immediately after confirmation and cannot be reused.',
      confirmLabel: 'Register Account',
      onConfirm: async () => {
        setConfirmModal(null);
        await performSubmit();
      },
      details: [
        { label: 'Code', value: preview.code || form.activationCode },
        { label: 'Account type', value: preview.accountLabel || 'Package entry code' },
        { label: 'Sponsor', value: invite?.sponsor_fullname ? `${invite.sponsor_fullname} (${invite.sponsor_username})` : (invite?.sponsor_username || 'Sponsor account') },
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
      <CodeUseConfirmModal
        open={Boolean(feedbackModal)}
        tone={feedbackModal?.tone || 'gold'}
        title={feedbackModal?.title}
        message={feedbackModal?.message}
        confirmLabel="Close"
        showCancel={false}
        onConfirm={() => setFeedbackModal(null)}
        onClose={() => setFeedbackModal(null)}
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
                Sponsor: <strong>{invite.sponsor_fullname ? `${invite.sponsor_fullname} (${invite.sponsor_username})` : invite.sponsor_username}</strong>{invite.reusable ? ' | Reusable sponsor referral' : ` | Placement UID: ${invite.placement_uid} | Position: ${Number(invite.position) === 1 ? 'Left' : 'Right'}`}
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
                  { key: 'tin', label: 'TIN', type: 'text', optional: true },
                  { key: 'username', label: 'Username', type: 'text' },
                  { key: 'password', label: 'Password', type: 'password' },
                ].map((field) => (
                  <label key={field.key} className="block">
                    <span className="block text-sm font-semibold text-brand-brown mb-2">
                      {field.label}
                      {!field.optional ? <span className="text-red-500"> *</span> : null}
                    </span>
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
                    ) : field.key === 'dob' ? (
                      <>
                        <DobPicker
                          value={form.dob}
                          onChange={(v) => updateField('dob', v)}
                          id="join-dob"
                          required={!field.optional}
                          selectClassName="w-full rounded-xl border border-primary-200/70 bg-[#FFFDF5] px-3 py-3 text-sm text-gray-800 outline-none focus:border-brand-gold-dark focus:ring-2 focus:ring-brand-gold/20"
                        />
                        <span className="mt-1 block text-xs text-brand-brown/70">Pick month, day, year — type to jump to a year.</span>
                      </>
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
                <button type="submit" disabled={submitting} className="btn-landing-primary w-full disabled:opacity-60">
                  {submitting ? 'Registering...' : 'Register Account'}
                </button>
              </form>
            </>
          ) : (
            <div className="rounded-xl bg-red-50 text-red-700 border border-red-200 px-4 py-3 text-sm">
              Referral invite not found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
