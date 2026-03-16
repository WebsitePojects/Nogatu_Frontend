import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const ShieldIcon = () => (
  <svg className="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const UserIcon = () => (
  <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
    style={{ width: '18px', height: '18px' }}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const LockIcon = () => (
  <svg style={{ width: '18px', height: '18px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const EyeOpenIcon = () => (
  <svg style={{ width: '18px', height: '18px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const EyeClosedIcon = () => (
  <svg style={{ width: '18px', height: '18px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
  </svg>
);

const SpinnerIcon = () => (
  <svg className="animate-spin" style={{ width: '16px', height: '16px' }} fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { loginAdmin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await loginAdmin(username, password);
      navigate('/admin/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10 relative overflow-hidden"
      style={{ background: 'linear-gradient(145deg, #0a0f1e 0%, #0f1b35 50%, #0d1f2d 100%)' }}
    >
      {/* Background rings */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full border border-white/[0.03]"
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border border-white/[0.04]"
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full border border-white/[0.05]"
      />

      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Glow behind card */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl opacity-10"
        style={{ background: 'radial-gradient(circle, #10b981, transparent)' }}
      />

      {/* Login card */}
      <div
        className="relative z-10 w-full max-w-[400px] rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(15,25,50,0.85)',
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)',
        }}
      >
        {/* Card top accent bar */}
        <div
          className="h-0.5 w-full"
          style={{ background: 'linear-gradient(90deg, transparent, #10b981 50%, transparent)' }}
        />

        <div className="px-8 pt-8 pb-9">
          {/* Logo & title */}
          <div className="text-center mb-8">
            <div
              className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
              style={{
                background: 'rgba(16,185,129,0.1)',
                border: '1px solid rgba(16,185,129,0.25)',
                boxShadow: '0 0 20px rgba(16,185,129,0.12)',
              }}
            >
              <ShieldIcon />
            </div>
            <h1 className="text-white font-bold text-xl tracking-tight">Admin Panel</h1>
            <p className="text-gray-500 text-xs mt-1 tracking-wide uppercase">NOGATU Alliance</p>
          </div>

          {/* Divider */}
          <div className="h-px bg-white/[0.06] mb-7" />

          {/* Section heading */}
          <div className="mb-5">
            <p className="text-gray-300 text-sm font-medium">Secure Access</p>
            <p className="text-gray-600 text-xs mt-0.5">Authorized personnel only</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Username */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5 tracking-wide uppercase">
                Username
              </label>
              <div className="relative">
                <span
                  className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"
                  style={{ color: 'rgba(107,114,128,0.7)' }}
                >
                  <UserIcon />
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Admin username"
                  required
                  autoComplete="username"
                  className="w-full pl-10 pr-4 py-2.5 text-sm text-gray-200 placeholder-gray-600 rounded-xl outline-none transition"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                  onFocus={(e) => {
                    e.target.style.border = '1px solid rgba(16,185,129,0.4)';
                    e.target.style.background = 'rgba(255,255,255,0.06)';
                  }}
                  onBlur={(e) => {
                    e.target.style.border = '1px solid rgba(255,255,255,0.08)';
                    e.target.style.background = 'rgba(255,255,255,0.04)';
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5 tracking-wide uppercase">
                Password
              </label>
              <div className="relative">
                <span
                  className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"
                  style={{ color: 'rgba(107,114,128,0.7)' }}
                >
                  <LockIcon />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full pl-10 pr-11 py-2.5 text-sm text-gray-200 placeholder-gray-600 rounded-xl outline-none transition"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                  onFocus={(e) => {
                    e.target.style.border = '1px solid rgba(16,185,129,0.4)';
                    e.target.style.background = 'rgba(255,255,255,0.06)';
                  }}
                  onBlur={(e) => {
                    e.target.style.border = '1px solid rgba(255,255,255,0.08)';
                    e.target.style.background = 'rgba(255,255,255,0.04)';
                  }}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center transition"
                  style={{ color: 'rgba(107,114,128,0.7)' }}
                >
                  {showPassword ? <EyeClosedIcon /> : <EyeOpenIcon />}
                </button>
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 mt-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: loading
                  ? 'rgba(16,185,129,0.3)'
                  : 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                color: '#fff',
                boxShadow: loading ? 'none' : '0 4px 20px rgba(16,185,129,0.3)',
              }}
            >
              {loading ? (
                <><SpinnerIcon /> Authenticating...</>
              ) : (
                'Sign In to Admin Panel'
              )}
            </button>
          </form>

          {/* Security note */}
          <div
            className="mt-6 rounded-xl px-4 py-3 flex items-start gap-3"
            style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.12)' }}
          >
            <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="#f59e0b" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <p className="text-yellow-600/80 text-xs leading-relaxed">
              This area is restricted to authorized administrators only. All access attempts are logged.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom label */}
      <p className="absolute bottom-5 text-gray-700 text-xs tracking-wide">
        NOGATU Alliance © {new Date().getFullYear()}
      </p>
    </div>
  );
}
