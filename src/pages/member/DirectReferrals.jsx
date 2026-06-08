import { useEffect, useState } from 'react';
import { HiOutlineUsers } from 'react-icons/hi';
import api from '../../api';
import { useTheme } from '../../contexts/ThemeContext';

const PKG_COLORS = {
  Bronze: '#CD7F32',
  Silver: '#A8A9AD',
  Gold: '#DAA520',
  Platinum: '#6C757D',
  Garnet: '#9B2335',
  Diamond: '#4FC3F7',
};

const ENTRY_STYLES = {
  PD: { bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.25)', color: '#4ade80' },
  FS: { bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.25)', color: '#fbbf24' },
  CD: { bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.22)', color: '#f87171' },
  'CD-PAID': { bg: 'rgba(96,165,250,0.1)', border: 'rgba(96,165,250,0.24)', color: '#60a5fa' },
  UNKNOWN: { bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.2)', color: '#94a3b8' },
};

function Spinner() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24">
      <div className="h-10 w-10 animate-spin rounded-full border-[3px]" style={{ borderColor: 'rgba(212,175,55,0.12)', borderTopColor: '#D4AF37' }} />
    </div>
  );
}

const formatDate = (value) => (
  value
    ? new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    : '-'
);

export default function DirectReferrals() {
  const { isDarkMode } = useTheme();
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/referrals')
      .then((res) => setReferrals(res.data.referrals))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const headingTone = isDarkMode ? 'text-white' : 'text-slate-900';
  const summaryText = isDarkMode ? 'rgba(212,175,55,0.9)' : '#8b6508';
  const rowAlt = isDarkMode ? 'var(--portal-zebra-bg)' : 'rgba(226,232,240,0.42)';
  const nameText = isDarkMode ? 'rgba(255,255,255,0.86)' : '#18212f';
  const bodyText = isDarkMode ? 'rgba(255,255,255,0.74)' : '#334155';
  const mutedText = isDarkMode ? 'rgba(255,255,255,0.56)' : '#5f6b7a';
  const subtleText = isDarkMode ? 'rgba(255,255,255,0.46)' : '#64748b';
  const mobileCardStyle = {
    background: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(247,249,252,0.96)',
    border: isDarkMode ? '1px solid rgba(212,175,55,0.12)' : '1px solid rgba(203,213,225,0.9)',
    boxShadow: 'var(--portal-box-shadow)',
  };

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-3xl p-6 sm:p-8 overflow-hidden relative">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at top right, rgba(212,175,55,0.12), transparent 55%)' }} />
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-3xl">
            <div className="size-12 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.24)' }}>
              <HiOutlineUsers className="size-6" style={{ color: '#D4AF37' }} />
            </div>
            <h1 className={`portal-page-title font-display text-2xl sm:text-3xl font-bold ${headingTone}`}>Direct Referrals</h1>
            <p className="mt-3 text-sm leading-relaxed portal-card-text">
              Review the members personally referred to this account, their package type, entry status, and registration date.
            </p>
          </div>

          <div
            className="inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold self-start"
            style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.18)' }}
          >
            <HiOutlineUsers className="h-4 w-4" style={{ color: '#D4AF37' }} />
            <span style={{ color: summaryText }}>{referrals.length} total referrals</span>
          </div>
        </div>
      </div>

      <div className="space-y-3 md:hidden">
        {referrals.map((r) => {
          const pkgColor = PKG_COLORS[r.accttypeName] || '#D4AF37';
          const entryStyle = ENTRY_STYLES[r.entryCode] || ENTRY_STYLES.UNKNOWN;
          return (
            <article key={r.uid} className="rounded-2xl p-4" style={mobileCardStyle}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em]" style={{ color: subtleText }}>Account Name</p>
                  <p className="mt-1 text-base font-semibold leading-snug" style={{ color: nameText }}>{r.fullname}</p>
                </div>
                <span
                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold"
                  style={{ background: `${pkgColor}18`, color: pkgColor, border: `1px solid ${pkgColor}30` }}
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: pkgColor }} />
                  {r.accttypeName}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: subtleText }}>Username</p>
                  <p className="mt-1 font-mono text-xs" style={{ color: bodyText }}>{r.username}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: subtleText }}>Date Registered</p>
                  <p className="mt-1 text-sm" style={{ color: bodyText }}>{formatDate(r.datereg)}</p>
                </div>
              </div>

              <div className="mt-4 rounded-xl p-3" style={{ background: isDarkMode ? 'rgba(255,255,255,0.025)' : 'rgba(241,245,249,0.85)', border: isDarkMode ? '1px solid rgba(212,175,55,0.08)' : '1px solid rgba(203,213,225,0.7)' }}>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: subtleText }}>Entry Type</p>
                  <span
                    className="inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold"
                    style={{ background: entryStyle.bg, color: entryStyle.color, border: `1px solid ${entryStyle.border}` }}
                  >
                    {r.entryType}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-5" style={{ color: mutedText }}>
                  {r.sponsorCreditEligible ? 'Counts for sponsor referral credit' : 'Does not count for sponsor referral credit'}
                </p>
              </div>
            </article>
          );
        })}

        {referrals.length === 0 && (
          <div className="rounded-2xl p-10 text-center" style={mobileCardStyle}>
            <HiOutlineUsers className="mx-auto mb-2 h-8 w-8" style={{ color: 'rgba(212,175,55,0.24)' }} />
            <p className="portal-card-muted">No direct referrals yet.</p>
          </div>
        )}
      </div>

      <div className="glass-card hidden overflow-hidden rounded-3xl md:block">
        <div className="overflow-x-auto">
          <table className="min-w-[600px] w-full text-sm">
            <thead>
              <tr>
                <th className="table-header px-4 py-3">Account Name</th>
                <th className="table-header px-4 py-3">Username</th>
                <th className="table-header px-4 py-3">Package</th>
                <th className="table-header px-4 py-3">Entry Type</th>
                <th className="table-header px-4 py-3">Date Registered</th>
              </tr>
            </thead>
            <tbody>
              {referrals.map((r, i) => {
                const pkgColor = PKG_COLORS[r.accttypeName] || '#D4AF37';
                const entryStyle = ENTRY_STYLES[r.entryCode] || ENTRY_STYLES.UNKNOWN;
                return (
                  <tr
                    key={r.uid}
                    className="portal-table-row-hover transition-colors"
                    style={{
                      background: i % 2 === 0 ? rowAlt : 'transparent',
                      borderBottom: '1px solid var(--portal-row-border)',
                    }}
                  >
                    <td className="px-4 py-3 font-medium" style={{ color: nameText }}>{r.fullname}</td>
                    <td className="px-4 py-3 font-mono text-xs" style={{ color: mutedText }}>{r.username}</td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold"
                        style={{ background: `${pkgColor}18`, color: pkgColor, border: `1px solid ${pkgColor}30` }}
                      >
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: pkgColor }} />
                        {r.accttypeName}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold"
                        style={{ background: entryStyle.bg, color: entryStyle.color, border: `1px solid ${entryStyle.border}` }}
                      >
                        {r.entryType}
                      </span>
                      <p className="mt-1 text-[10px]" style={{ color: subtleText }}>
                        {r.sponsorCreditEligible ? 'Counts for sponsor referral credit' : 'Does not count for sponsor referral credit'}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: mutedText }}>
                      {formatDate(r.datereg)}
                    </td>
                  </tr>
                );
              })}

              {referrals.length === 0 && (
                <tr>
                  <td colSpan="5" className="py-14 text-center">
                    <HiOutlineUsers className="mx-auto mb-2 h-8 w-8" style={{ color: 'rgba(212,175,55,0.2)' }} />
                    <p className="portal-card-muted">No direct referrals yet.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
