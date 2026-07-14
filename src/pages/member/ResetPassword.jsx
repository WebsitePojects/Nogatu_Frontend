import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api';

/* ── SVG Icons (matched to Login.jsx) ────────────────────────── */
const EyeOpenIcon = () => (
  <svg className="size-5" fill="none" stroke="#6B7280" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);
const EyeClosedIcon = () => (
  <svg className="size-5" fill="none" stroke="#6B7280" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
  </svg>
);
const SpinnerIcon = () => (
  <svg className="animate-spin size-4" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

function PageShell({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-cover bg-center bg-no-repeat bg-[url('/img/portalBG_light.png')] dark:bg-[url('/img/portalBG_dark.png')]">
      {/* Subtle orb (matches Login.jsx right panel) */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[500px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.04) 0%, transparent 65%)' }}
      />
      <div className="relative z-10 w-full max-w-[400px]">
        {/* Logo */}
        <div className="text-center mb-10">
          <img
            src="/img/nogatu_logo.png"
            alt="NOGATU Alliance"
            className="h-16 w-auto object-contain mx-auto mb-3"
            style={{ filter: 'drop-shadow(0 4px 12px rgba(212,175,55,0.3))' }}
          />
          <p className="font-brand text-xs tracking-widest" style={{ color: 'rgba(212,175,55,0.5)' }}>MEMBER PORTAL</p>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = (searchParams.get('token') || '').trim();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!token) {
    return (
      <PageShell>
        <div className="mb-7">
          <h2 className="font-display text-[26px] font-bold text-gray-900 dark:text-white leading-tight">Invalid link</h2>
          <p className="text-sm mt-1.5 text-gray-600 dark:text-gray-400">
            This reset link is invalid.
          </p>
          <div className="w-12 h-0.5 mt-3 rounded-full" style={{ background: 'linear-gradient(90deg, #D4AF37, transparent)' }} />
        </div>
        <div className="glass-card rounded-2xl p-7">
          <p className="text-sm text-gray-700 dark:text-white/75">
            The password reset link is missing its token. Please request a new reset link from the login page.
          </p>
          <Link
            to="/login"
            className="gold-btn w-full py-2.5 px-5 rounded-xl text-sm flex items-center justify-center gap-2 mt-5"
          >
            Back to Login
          </Link>
        </div>
      </PageShell>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    setLoading(true);
    const toastId = toast.loading('Updating password…');
    try {
      await api.post('/auth/reset-password', { token, newPassword, confirmPassword });
      toast.success('Password updated. Please sign in.', { id: toastId });
      navigate('/login');
    } catch (err) {
      const msg = err.response?.data?.error || 'Unable to reset password. The link may have expired.';
      toast.error(msg, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell>
      {/* Heading */}
      <div className="mb-7">
        <h2 className="font-display text-[26px] font-bold text-gray-900 dark:text-white leading-tight">Reset your password</h2>
        <p className="text-sm mt-1.5 text-gray-600 dark:text-gray-400">
          Choose a new password for your account
        </p>
        <div className="w-12 h-0.5 mt-3 rounded-full" style={{ background: 'linear-gradient(90deg, #D4AF37, transparent)' }} />
      </div>

      {/* Glass form card */}
      <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-7 space-y-5">
        {/* New Password */}
        <div>
          <label className="label">New Password</label>
          <div className="relative mt-1">
            <input
              type={showPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 8 characters"
              required
              minLength={8}
              autoComplete="new-password"
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

        {/* Confirm Password */}
        <div>
          <label className="label">Confirm New Password</label>
          <div className="relative mt-1">
            <input
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your new password"
              required
              minLength={8}
              autoComplete="new-password"
              className="glass-input pl-4 pr-11"
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-0 top-1/2 -translate-y-1/2 pr-3.5 flex items-center z-20"
              aria-label={showConfirm ? 'Hide password' : 'Show password'}
            >
              {showConfirm ? <EyeClosedIcon /> : <EyeOpenIcon />}
            </button>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="gold-btn w-full py-2.5 px-5 rounded-xl text-sm flex items-center justify-center gap-2 mt-1"
        >
          {loading ? <><SpinnerIcon /> Updating…</> : 'Update Password'}
        </button>
      </form>

      <p className="text-center text-xs mt-5 text-gray-600 dark:text-gray-400">
        Remembered your password?{' '}
        <Link to="/login" className="font-semibold" style={{ color: '#D4AF37' }}>
          Back to Login
        </Link>
      </p>
    </PageShell>
  );
}
