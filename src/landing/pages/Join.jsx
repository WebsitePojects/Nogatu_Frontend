import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

export default function Join() {
  const { token } = useParams();
  const [invite, setInvite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [form, setForm] = useState({
    activationCode: '',
    username: '',
    password: '',
    firstname: '',
    lastname: '',
    middlename: '',
    email: '',
    tin: '',
  });

  useEffect(() => {
    async function loadInvite() {
      try {
        const res = await fetch(`/api/registration/referral/${token}`);
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

  async function submit(e) {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await fetch('/api/registration/public-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, token, slug: invite?.reusable ? token : undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed.');
      setMessage({ type: 'success', text: 'Account registered successfully. You may now sign in through the member portal.' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Registration failed.' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="pt-28 sm:pt-32 pb-14 min-h-screen bg-[#FFFDF5] relative overflow-hidden">
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
              </div>
              <form onSubmit={submit} className="space-y-4">
                {[
                  { key: 'activationCode', label: 'Activation Code', type: 'text' },
                  { key: 'firstname', label: 'First Name', type: 'text' },
                  { key: 'lastname', label: 'Last Name', type: 'text' },
                  { key: 'middlename', label: 'Middle Name', type: 'text', optional: true },
                  { key: 'email', label: 'Email', type: 'email' },
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
                        onChange={(e) => updateField(field.key, e.target.value)}
                        required={!field.optional}
                        className="w-full rounded-xl border border-primary-200/70 bg-[#FFFDF5] px-4 py-3 text-sm text-gray-800 outline-none focus:border-brand-gold-dark focus:ring-2 focus:ring-brand-gold/20"
                      />
                    )}
                  </label>
                ))}
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
