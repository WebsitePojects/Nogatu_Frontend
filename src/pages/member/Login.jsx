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
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const EyeClosedIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
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
  const { loginMember } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await loginMember(username, password);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">

      {/* ── Left brand panel (desktop only) ─────────────────────── */}
      <div
        className="hidden lg:flex lg:w-[52%] relative flex-col justify-between p-12 overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #1e3a8a 0%, #1d4ed8 45%, #4338ca 100%)' }}
      >
        {/* Decorative circles */}
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-white opacity-5" />
        <div className="absolute bottom-0 right-0 w-[480px] h-[480px] rounded-full bg-indigo-300 opacity-5 translate-x-1/3 translate-y-1/3" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full bg-blue-200 opacity-5 -translate-x-1/2 -translate-y-1/2" />

        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)',
            backgroundSize: '44px 44px',
          }}
        />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center backdrop-blur">
            <span className="text-white font-black text-sm tracking-tighter">NA</span>
          </div>
          <span className="text-white/90 font-semibold text-base tracking-wide">NOGATU Alliance</span>
        </div>

        {/* Hero copy */}
        <div className="relative z-10 space-y-7">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-white/75 text-xs font-medium tracking-wide uppercase">Member Portal</span>
            </div>
            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-snug">
              Build Your Network,<br />
              <span className="text-blue-200">Build Your Future.</span>
            </h1>
            <p className="text-blue-200/80 text-base leading-relaxed mt-4 max-w-xs">
              Access your complete dashboard to manage your downline, track earnings, and grow your business.
            </p>
          </div>

          {/* Features */}
          <ul className="space-y-3">
            {features.map((f) => (
              <li key={f} className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 shadow-md shadow-emerald-500/40">
                  <CheckIcon />
                </span>
                <span className="text-blue-100/80 text-sm">{f}</span>
              </li>
            ))}
          </ul>

          {/* Stats */}
          <div className="flex gap-8 pt-5 border-t border-white/10">
            {[['Active Members', '10K+'], ['Networks', '500+'], ['Uptime', '99.9%']].map(([label, val]) => (
              <div key={label}>
                <p className="text-white font-bold text-2xl">{val}</p>
                <p className="text-blue-300/70 text-xs mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer note */}
        <p className="relative z-10 text-blue-300/40 text-xs">
          © {new Date().getFullYear()} NOGATU Alliance. All rights reserved.
        </p>
      </div>

      {/* ── Right form panel ────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-[#f8f9fc]">
        <div className="w-full max-w-[400px]">

          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-10">
            <div
              className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg"
              style={{ background: 'linear-gradient(135deg, #1d4ed8, #4338ca)' }}
            >
              <span className="text-white font-black text-xl">NA</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">NOGATU Alliance</h1>
            <p className="text-gray-500 text-sm">Member Portal</p>
          </div>

          {/* Heading */}
          <div className="mb-7">
            <h2 className="text-[28px] font-bold text-gray-900 leading-tight">Welcome back</h2>
            <p className="text-gray-500 text-sm mt-1">Sign in to access your member account</p>
          </div>

          {/* Form card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7 space-y-5">

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
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/60 text-gray-900 text-sm placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition"
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
                  className="w-full pl-11 pr-11 py-2.5 rounded-xl border border-gray-200 bg-gray-50/60 text-gray-900 text-sm placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition"
                >
                  {showPassword ? <EyeClosedIcon /> : <EyeOpenIcon />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              form="member-login-form"
              disabled={loading}
              onClick={handleSubmit}
              className="w-full py-2.5 px-5 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed mt-1"
              style={{
                background: loading
                  ? '#93c5fd'
                  : 'linear-gradient(135deg, #1d4ed8 0%, #4338ca 100%)',
                boxShadow: loading ? 'none' : '0 4px 14px rgba(29,78,216,0.35)',
              }}
            >
              {loading ? (
                <><SpinnerIcon /> Signing in...</>
              ) : (
                'Sign In'
              )}
            </button>
          </div>

          <p className="text-center text-gray-400 text-xs mt-6">
            New member?{' '}
            <span className="text-blue-600 font-medium cursor-default">Contact your upline</span>
            {' '}to get registered.
          </p>
        </div>
      </div>

      {/* Hidden actual form for accessibility */}
      <form id="member-login-form" onSubmit={handleSubmit} className="hidden" />
    </div>
  );
}
