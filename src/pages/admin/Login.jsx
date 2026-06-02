import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import usePublicStats from '../../hooks/usePublicStats';

const CheckIcon = () => (
  <svg className="size-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
  </svg>
);

const UserIcon = () => (
  <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const LockIcon = () => (
  <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const EyeOpenIcon = () => (
  <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const EyeClosedIcon = () => (
  <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
  </svg>
);

const SpinnerIcon = () => (
  <svg className="animate-spin size-4" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const adminFeatures = [
  'Manage all member accounts',
  'Generate and release codes',
  'Process encashment requests',
  'View system analytics',
];

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { loginAdmin } = useAuth();
  const navigate = useNavigate();
  const { stats } = usePublicStats();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading('Authenticating...');
    try {
      await loginAdmin(username, password);
      toast.success('Access granted', { id: toastId });
      navigate('/admin/dashboard');
    } catch (err) {
      const msg = err.response?.data?.error || 'Invalid credentials.';
      console.error('[Admin Login Error]', err);
      toast.error(msg, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n) => n === null ? '—' : n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);

  return (
    <div className="min-h-screen flex bg-cover bg-center bg-no-repeat bg-[url('/img/portalBG_light.png')] dark:bg-[url('/img/portalBG_dark.png')]">

      {/* Left admin panel */}
      <div
        className="hidden lg:flex lg:w-[52%] relative flex-col justify-between p-12 overflow-hidden bg-white/10 dark:bg-black/60 backdrop-blur-md border-r border-white/10 dark:border-white/10"
      >
        {/* Decorative blobs */}
        <div
          className="absolute -top-40 -right-40 size-96 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #D4AF37, transparent)' }}
        />
        <div
          className="absolute bottom-0 left-0 size-[400px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #7f1d1d, transparent)' }}
        />

        {/* Dot grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(212,175,55,0.8) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        {/* Top accent line */}
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, #D4AF37 50%, transparent)' }}
        />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <img src="/img/nogatu_logo.png" alt="NOGATU Alliance" className="h-14 w-auto object-contain" />
          <span className="font-brand text-xs tracking-widest uppercase text-gray-900 dark:text-white font-bold">
            Admin Console
          </span>
        </div>

        {/* Hero copy */}
        <div className="relative z-10 space-y-7">
          <div>
            <div
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-5"
              style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.18)' }}
            >
              <span className="size-2 rounded-full animate-pulse" style={{ background: '#D4AF37' }} />
              <span
                className="text-xs font-medium tracking-wide uppercase"
                style={{ color: '#D4AF37' }}
              >
                Secure Admin Access
              </span>
            </div>
            <h1 className="font-display text-4xl xl:text-5xl font-bold text-gray-900 dark:text-white leading-snug">
              Command Your<br />
              <span className="gold-text">Alliance Network.</span>
            </h1>
            <p className="text-base leading-relaxed mt-4 max-w-xs text-gray-600 dark:text-gray-400">
              Full control over members, earnings, genealogy, and platform content from one secure panel.
            </p>
          </div>

          {/* Features */}
          <ul className="space-y-3">
            {adminFeatures.map((f) => (
              <li key={f} className="flex items-center gap-3">
                <span
                  className="size-5 rounded-full flex items-center justify-center flex-shrink-0 text-gray-900 dark:text-white"
                  style={{
                    background: 'linear-gradient(135deg, #7f1d1d, #D4AF37)',
                    boxShadow: '0 4px 12px rgba(212,175,55,0.25)',
                  }}
                >
                  <CheckIcon />
                </span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{f}</span>
              </li>
            ))}
          </ul>

          {/* Live stats */}
          <div className="flex gap-8 pt-5 border-t border-gray-300">
            <div>
              <p className="text-gray-900 dark:text-white font-bold text-2xl">{fmt(stats.activeMembers)}+</p>
              <p className="text-xs mt-0.5 text-gray-600 dark:text-white font-medium">Active Members</p>
            </div>
            <div>
              <p className="text-gray-900 dark:text-white font-bold text-2xl">{fmt(stats.networksBuilt)}+</p>
              <p className="text-xs mt-0.5 text-gray-600 dark:text-white font-medium">Networks Built</p>
            </div>
            <div>
              <p className="text-gray-900 dark:text-white font-bold text-2xl">99.9%</p>
              <p className="text-xs mt-0.5 text-gray-600 dark:text-white font-medium">Uptime</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="relative z-10 text-xs font-medium text-gray-600 dark:text-gray-400">
          &copy; {new Date().getFullYear()} NOGATU Alliance. All rights reserved.
        </p>
      </div>

      {/* Right form panel */}
      <div
        className="flex-1 flex items-center justify-center px-6 py-12 bg-transparent"
      >
        <div className="w-full max-w-[400px]">
          <button
            type="button"
            onClick={() => { window.location.href = '/'; }}
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 mb-6 text-sm font-semibold border border-brand-gold/20 bg-white/70 text-brand-brown hover:bg-white motion-safe:transition-all motion-safe:duration-300 shadow-sm"
          >
            <ArrowLeftIcon />
            Back to Landing Page
          </button>

          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-10">
            <img src="/img/nogatu_logo.png" alt="NOGATU Alliance" className="h-20 w-auto object-contain mx-auto mb-4" />
            <p className="text-sm" style={{ color: 'rgba(212,175,55,0.55)' }}>Admin Console</p>
          </div>

          {/* Heading */}
          <div className="mb-7">
            <h2 className="font-display text-[28px] font-bold text-gray-900 dark:text-white leading-tight">Welcome back</h2>
            <p className="text-sm mt-1 text-gray-600 dark:text-gray-400">Sign in to access your admin account</p>
          </div>

          {/* Form card */}
          <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-7 space-y-5">

            {/* Username */}
            <div>
              <label className="label">Username</label>
              <div className="relative mt-1.5">
                <span
                  className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"
                  style={{ color: 'rgba(212,175,55,0.5)' }}
                >
                  <UserIcon />
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  required
                  autoComplete="username"
                  className="glass-input w-full pl-11 pr-4 py-2.5 rounded-xl text-sm"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="label">Password</label>
                <button
                  type="button"
                  onClick={() => toast('Password reset is handled by your system administrator.', { icon: '🔒' })}
                  className="text-xs font-medium motion-safe:transition-colors"
                  style={{ color: 'rgba(212,175,55,0.6)' }}
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <span
                  className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"
                  style={{ color: 'rgba(212,175,55,0.5)' }}
                >
                  <LockIcon />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                  className="glass-input w-full pl-11 pr-11 py-2.5 rounded-xl text-sm"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center motion-safe:transition text-gray-400 hover:text-brand-gold dark:text-gray-500 dark:hover:text-brand-gold"
                >
                  {showPassword ? <EyeClosedIcon /> : <EyeOpenIcon />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="gold-btn w-full py-2.5 px-5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 motion-safe:transition-all motion-safe:duration-200 disabled:opacity-60 disabled:cursor-not-allowed mt-1"
            >
              {loading ? <><SpinnerIcon /> Authenticating...</> : 'Sign In to Admin'}
            </button>
          </form>

          {/* Security note */}
          <div
            className="mt-5 rounded-xl px-4 py-3 flex items-start gap-3"
            style={{ background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.12)' }}
          >
            <svg
              className="size-4 mt-0.5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              style={{ color: 'rgba(212,175,55,0.6)' }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-400">
              Restricted to authorized administrators only. All access is logged.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
