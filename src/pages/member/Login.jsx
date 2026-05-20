import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import api from '../../api';

/* ── SVG Icons ────────────────────────────────────────────── */
const CheckIcon = () => (
  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
  </svg>
);
const UserIcon = () => (
  <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);
const LockIcon = () => (
  <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);
const EyeOpenIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="#6B7280" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);
const EyeClosedIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="#6B7280" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
  </svg>
);
const SpinnerIcon = () => (
  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

const features = [
  'Track your binary genealogy tree',
  'Monitor all income & earnings',
  'Manage your activation codes',
  'View pairing & referral reports',
];

export default function Login() {
  const [username, setUsername]       = useState('');
  const [password, setPassword]       = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]         = useState(false);
  const [forgotOpen, setForgotOpen]   = useState(false);
  const [resetIdentifier, setResetIdentifier] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const { loginMember } = useAuth();
  const navigate = useNavigate();
  const stats = [
    { value: '99.9%', label: 'Uptime' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading('Signing in…');
    try {
      await loginMember(username, password);
      toast.success('Welcome back!', { id: toastId });
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.error || 'Invalid username or password.';
      toast.error(msg, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const submitForgotPassword = async (e) => {
    e.preventDefault();
    setResetLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email: resetIdentifier });
      toast.success('If the account exists, reset instructions will be sent.');
      if (res.data?.debugResetToken) {
        toast(`Dev reset token: ${res.data.debugResetToken}`, { duration: 10000 });
      }
      setForgotOpen(false);
      setResetIdentifier('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Unable to request reset instructions.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-cover bg-center bg-no-repeat bg-[url('/img/portalBG_light.png')] dark:bg-[url('/img/portalBG_dark.png')]">

      {/* ── LEFT BRAND PANEL ─────────────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-[52%] relative flex-col justify-between p-12 overflow-hidden bg-white/10 dark:bg-black/60 backdrop-blur-md border-r border-white/10 dark:border-white/10"
      >
        {/* Large gold orb — top left */}
        <div
          className="absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.12) 0%, transparent 65%)', filter: 'blur(40px)' }}
        />
        {/* Gold orb — bottom right */}
        <div
          className="absolute bottom-0 right-0 w-[360px] h-[360px] rounded-full pointer-events-none translate-x-1/3 translate-y-1/3"
          style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.08) 0%, transparent 70%)', filter: 'blur(32px)' }}
        />

        {/* Gold dot grid */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(212,175,55,0.06) 1px, transparent 1px)',
            backgroundSize: '30px 30px',
          }}
        />

        {/* Top gold accent line */}
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(212,175,55,0.5) 50%, transparent 100%)' }}
        />

        {/* ── Logo ── */}
        <div className="relative z-10 flex items-center gap-3.5">
          <img
            src="/img/nogatu_logo.png"
            alt="NOGATU Alliance"
            className="h-14 w-auto object-contain"
            style={{ filter: 'drop-shadow(0 4px 16px rgba(212,175,55,0.3))' }}
          />
          <div>
            <h1 className="font-brand text-xl font-semibold tracking-widest text-[#D4AF37]">NOGATU</h1>
            <p className="text-[11px] tracking-wider uppercase text-gray-800 dark:text-white font-bold">Alliance</p>
          </div>
        </div>

          {/* ── Hero copy ── */}
          <div className="relative z-10 space-y-8">
            <div>
              <h2 className="font-display text-4xl xl:text-5xl font-bold text-gray-900 dark:text-white leading-snug">
                Build Your Network,<br />
                <span className="gold-text">Build Your Future.</span>
              </h2>
              <p className="text-sm leading-relaxed mt-4 max-w-sm text-gray-700 dark:text-white/75">
                Access your complete dashboard to manage your downline, track earnings, and grow your business.
              </p>
            </div>

          {/* Feature list */}
          <ul className="space-y-3">
            {features.map((f) => (
              <li key={f} className="flex items-center gap-3.5">
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-white"
                  style={{
                    background: 'linear-gradient(135deg, #9A7B0A, #D4AF37)',
                    boxShadow: '0 4px 12px rgba(212,175,55,0.4)',
                  }}
                >
                  <CheckIcon />
                </span>
                <span className="text-sm text-gray-800 dark:text-white/80 font-medium">{f}</span>
              </li>
            ))}
          </ul>

          {/* Stats row */}
          <div className="flex gap-8 pt-6 border-t border-gray-300 dark:border-white/10">
            {stats.map((s) => (
              <div key={s.label}>
                <p className="text-gray-900 dark:text-white font-bold text-2xl">{s.value}</p>
                <p className="text-xs mt-0.5 font-bold" style={{ color: '#D4AF37' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="relative z-10 text-[11px] font-medium text-gray-600 dark:text-gray-300">
          © {new Date().getFullYear()} NOGATU Alliance. All rights reserved.
        </p>
      </div>

      {/* ── RIGHT FORM PANEL ─────────────────────────────────── */}
      <div
        className="flex-1 flex items-center justify-center px-6 py-12 relative overflow-hidden bg-transparent"
      >
        <button
          type="button"
          onClick={() => window.location.href = '/'}
          className="absolute left-4 top-4 sm:left-6 sm:top-6 z-20 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-gray-800 dark:text-white bg-white/60 dark:bg-black/30 border border-white/50 dark:border-white/10 backdrop-blur-md shadow-sm hover:bg-white/80 dark:hover:bg-black/45 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back
        </button>
        {/* Subtle orb */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.04) 0%, transparent 65%)' }}
        />

        <div className="relative z-10 w-full max-w-[400px]">

          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-10">
            <img
              src="/img/nogatu_logo.png"
              alt="NOGATU Alliance"
              className="h-16 w-auto object-contain mx-auto mb-3"
              style={{ filter: 'drop-shadow(0 4px 12px rgba(212,175,55,0.3))' }}
            />
            <p className="font-brand text-xs tracking-widest" style={{ color: 'rgba(212,175,55,0.5)' }}>MEMBER PORTAL</p>
          </div>

          {/* Heading */}
          <div className="mb-7">
            <h2 className="font-display text-[26px] font-bold text-gray-900 dark:text-white leading-tight">Welcome back</h2>
            <p className="text-sm mt-1.5 text-gray-600 dark:text-gray-400">
              Sign in to access your member account
            </p>
            <div className="w-12 h-0.5 mt-3 rounded-full" style={{ background: 'linear-gradient(90deg, #D4AF37, transparent)' }} />
          </div>

          {/* Glass form card */}
          <form
            onSubmit={handleSubmit}
            className="glass-card rounded-2xl p-7 space-y-5"
          >
            {/* Username */}
            <div>
              <label className="label">Username</label>
              <div className="relative mt-1">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  required
                  autoComplete="username"
                  className="glass-input px-4"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="label">Password</label>
              <div className="relative mt-1">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                  className="glass-input pl-4 pr-11"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 pr-3.5 flex items-center z-20"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeClosedIcon /> : <EyeOpenIcon />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="gold-btn w-full py-2.5 px-5 rounded-xl text-sm flex items-center justify-center gap-2 mt-1"
            >
              {loading ? <><SpinnerIcon /> Signing in…</> : 'Sign In'}
            </button>
            <button
              type="button"
              onClick={() => setForgotOpen(true)}
              className="w-full text-xs font-semibold"
              style={{ color: '#D4AF37' }}
            >
              Forgot password?
            </button>
          </form>

          <p className="text-center text-xs mt-5 text-gray-600 dark:text-gray-400">
            New member?{' '}
            <span className="cursor-default text-brand-gold">
              Contact your upline to get registered.
            </span>
          </p>

          <div
            className="mt-4 rounded-2xl border px-4 py-4 text-left shadow-sm backdrop-blur-md"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.72), rgba(255,248,225,0.88))',
              borderColor: 'rgba(212,175,55,0.22)',
            }}
          >
            <p className="text-[11px] font-bold tracking-[0.24em] uppercase" style={{ color: '#B8860B' }}>
              Distributor Path
            </p>
            <h3 className="mt-2 text-sm font-bold text-gray-900">Applying as a Distributor first?</h3>
            <p className="mt-1 text-xs leading-5 text-gray-600">
              Submit your distributor inquiry on the NOGATU landing page, download the printable form, and bring it to the nearest branch before requesting portal access.
            </p>
            <a
              href="/#stockist-apply"
              className="mt-3 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold text-white transition-all duration-300 hover:-translate-y-0.5"
              style={{
                background: 'linear-gradient(135deg, #B8860B 0%, #D4A528 55%, #E7C679 100%)',
                boxShadow: '0 12px 24px rgba(184,134,11,0.22)',
              }}
            >
              Open Distributor Form
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </a>
          </div>
        </div>
      </div>
      {forgotOpen && (
        <div className="portal-overlay fixed inset-0 z-50 flex items-center justify-center p-4" onMouseDown={() => setForgotOpen(false)}>
          <form
            onSubmit={submitForgotPassword}
            onMouseDown={(event) => event.stopPropagation()}
            className="portal-modal-panel w-full max-w-md rounded-2xl p-6 shadow-2xl"
          >
            <h2 className="portal-modal-title font-display text-xl font-bold">Reset Password</h2>
            <p className="portal-modal-text text-sm mt-1 mb-4 leading-6">
              Enter the email address saved on your account. A single-use reset code expires after 15 minutes.
            </p>
            <input
              value={resetIdentifier}
              onChange={(event) => setResetIdentifier(event.target.value)}
              className="glass-input mb-4"
              placeholder="Email address"
              required
            />
            <div className="flex gap-2">
              <button type="button" onClick={() => setForgotOpen(false)} className="portal-muted-button flex-1 rounded-xl py-2 text-sm font-medium">Cancel</button>
              <button type="submit" disabled={resetLoading} className="gold-btn flex-1 rounded-xl py-2 text-sm">
                {resetLoading ? 'Sending...' : 'Send'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
