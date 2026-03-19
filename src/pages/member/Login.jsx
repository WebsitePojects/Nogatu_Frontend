import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const CheckIcon = () => (
  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
  </svg>
);

const UserIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const LockIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const EyeOpenIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const EyeClosedIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
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
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const stats = { activeMembers: 5900, networksBuilt: 5900 };
  const { loginMember } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading('Signing in...');
    try {
      await loginMember(username, password);
      toast.success('Welcome back!', { id: toastId });
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.error || 'Invalid username or password.';
      console.error('[Login Error]', err);
      toast.error(msg, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n) => n === null ? '—' : n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);

  return (
    <div className="min-h-screen flex">

      {/* ── Left brand panel — Gold-Brown gradient ─────────────── */}
      <div
        className="hidden lg:flex lg:w-[52%] relative flex-col justify-between p-12 overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #3A1000 0%, #592219 45%, #6d3028 100%)' }}
      >
        {/* Decorative blobs */}
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #D4A528, transparent)' }} />
        <div className="absolute bottom-0 right-0 w-[480px] h-[480px] rounded-full opacity-5 translate-x-1/3 translate-y-1/3" style={{ background: 'radial-gradient(circle, #E7C679, transparent)' }} />

        {/* Dot grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(212,165,40,0.8) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        {/* Gold accent line */}
        <div
          className="absolute top-0 left-0 right-0 h-0.5"
          style={{ background: 'linear-gradient(90deg, transparent, #D4A528 50%, transparent)' }}
        />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <img src="/img/nogatu_logo.jpg" alt="NOGATU Alliance" className="h-10 w-auto object-contain" />
        </div>

        {/* Hero copy */}
        <div className="relative z-10 space-y-7">
          <div>
            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-snug">
              Build Your Network,<br />
              <span className="text-brand-gold-light">Build Your Future.</span>
            </h1>
            <p className="text-white/60 text-base leading-relaxed mt-4 max-w-xs">
              Access your complete dashboard to manage your downline, track earnings, and grow your business.
            </p>
          </div>

          {/* Features */}
          <ul className="space-y-3">
            {features.map((f) => (
              <li key={f} className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 shadow-md" style={{ background: 'linear-gradient(135deg, #B8860B, #D4A528)', boxShadow: '0 4px 12px rgba(184,134,11,0.35)' }}>
                  <CheckIcon />
                </span>
                <span className="text-white/70 text-sm">{f}</span>
              </li>
            ))}
          </ul>

          {/* Live stats */}
          <div className="flex gap-8 pt-5 border-t border-white/10">
            <div>
              <p className="text-white font-bold text-2xl">{fmt(stats.activeMembers)}+</p>
              <p className="text-brand-gold/50 text-xs mt-0.5">Active Members</p>
            </div>
            <div>
              <p className="text-white font-bold text-2xl">{fmt(stats.networksBuilt)}+</p>
              <p className="text-brand-gold/50 text-xs mt-0.5">Networks Built</p>
            </div>
            <div>
              <p className="text-white font-bold text-2xl">99.9%</p>
              <p className="text-brand-gold/50 text-xs mt-0.5">Uptime</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="relative z-10 text-white/20 text-xs">
          © {new Date().getFullYear()} NOGATU Alliance. All rights reserved.
        </p>
      </div>

      {/* ── Right form panel ────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12" style={{ background: '#FFFDF5' }}>
        <div className="w-full max-w-[400px]">

          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-10">
            <img src="/img/nogatu_logo.jpg" alt="NOGATU Alliance" className="h-16 w-auto object-contain mx-auto mb-4" />
            <p className="text-gray-500 text-sm">Member Portal</p>
          </div>

          {/* Heading */}
          <div className="mb-7">
            <h2 className="text-[28px] font-bold text-gray-900 leading-tight">Welcome back</h2>
            <p className="text-gray-500 text-sm mt-1">Sign in to access your member account</p>
          </div>

          {/* Form card */}
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-primary-200/40 shadow-sm p-7 space-y-5">

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Username</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 pointer-events-none">
                  <UserIcon />
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  required
                  autoComplete="username"
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-primary-200/60 bg-primary-50/30 text-gray-900 text-sm placeholder-gray-400 outline-none focus:ring-2 focus:ring-primary-400/40 focus:border-transparent focus:bg-white motion-safe:transition"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 pointer-events-none">
                  <LockIcon />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                  className="w-full pl-11 pr-11 py-2.5 rounded-xl border border-primary-200/60 bg-primary-50/30 text-gray-900 text-sm placeholder-gray-400 outline-none focus:ring-2 focus:ring-primary-400/40 focus:border-transparent focus:bg-white motion-safe:transition"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 motion-safe:transition"
                >
                  {showPassword ? <EyeClosedIcon /> : <EyeOpenIcon />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-5 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 motion-safe:transition-all motion-safe:duration-200 disabled:opacity-60 disabled:cursor-not-allowed mt-1"
              style={{
                background: loading
                  ? 'rgba(212,165,40,0.5)'
                  : 'linear-gradient(135deg, #B8860B 0%, #D4A528 100%)',
                boxShadow: loading ? 'none' : '0 4px 14px rgba(184,134,11,0.35)',
              }}
            >
              {loading ? <><SpinnerIcon /> Signing in...</> : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-gray-400 text-xs mt-6">
            New member?{' '}
            <span className="text-brand-gold-dark font-medium cursor-default">Contact your upline</span>
            {' '}to get registered.
          </p>
        </div>
      </div>
    </div>
  );
}
