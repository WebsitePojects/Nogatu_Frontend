import { useState, useEffect } from 'react';
import api from '../../api';
import { HiOutlineUsers } from 'react-icons/hi';

const PKG_COLORS = {
  Bronze: '#CD7F32', Silver: '#C0C0C0', Gold: '#FFD700',
  Platinum: '#E5E4E2', Garnet: '#9B4444', Diamond: '#B9F2FF',
};

const CODE_LABELS = { 1: 'PD', 2: 'FS', 3: 'CD' };
const CODE_STYLES = {
  1: { bg: 'rgba(34,197,94,0.1)',  border: 'rgba(34,197,94,0.25)',  color: '#4ade80' },
  2: { bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.25)', color: '#fbbf24' },
  3: { bg: 'rgba(148,163,184,0.1)',border: 'rgba(148,163,184,0.2)', color: '#94a3b8' },
};

function Spinner() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-10 h-10 rounded-full border-[3px] animate-spin" style={{ borderColor: 'rgba(212,175,55,0.12)', borderTopColor: '#D4AF37' }} />
    </div>
  );
}

export default function DirectReferrals() {
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/referrals')
      .then(res => setReferrals(res.data.referrals))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Direct Referrals</h1>
        <div className="w-10 h-0.5 mt-2 rounded-full" style={{ background: 'linear-gradient(90deg,#D4AF37,transparent)' }} />
      </div>

      {/* Summary chip */}
      <div
        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-sm"
        style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.18)' }}
      >
        <HiOutlineUsers className="w-4 h-4" style={{ color: '#D4AF37' }} />
        <span style={{ color: 'rgba(212,175,55,0.85)' }}>{referrals.length} total referrals</span>
      </div>

      {/* Table card */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr>
                <th className="table-header py-3 px-4">Account Name</th>
                <th className="table-header py-3 px-4">Username</th>
                <th className="table-header py-3 px-4">Package</th>
                <th className="table-header py-3 px-4">Entry Type</th>
                <th className="table-header py-3 px-4">Date Registered</th>
              </tr>
            </thead>
            <tbody>
              {referrals.map((r, i) => {
                const pkgColor = PKG_COLORS[r.accttypeName] || '#D4AF37';
                const codeStyle = CODE_STYLES[r.codeid] || CODE_STYLES[3];
                return (
                  <tr
                    key={r.uid}
                    style={{
                      background: i % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent',
                      borderBottom: '1px solid rgba(212,175,55,0.06)',
                    }}
                    className="hover:bg-white/[0.03] transition-colors"
                  >
                    <td className="py-3 px-4 font-medium text-white/85">{r.fullname}</td>
                    <td className="py-3 px-4 font-mono text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{r.username}</td>
                    <td className="py-3 px-4">
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold"
                        style={{ background: `${pkgColor}18`, color: pkgColor, border: `1px solid ${pkgColor}30` }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: pkgColor }} />
                        {r.accttypeName}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold"
                        style={{ background: codeStyle.bg, color: codeStyle.color, border: `1px solid ${codeStyle.border}` }}
                      >
                        {CODE_LABELS[r.codeid] || r.entryType}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      {r.datereg ? new Date(r.datereg).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                    </td>
                  </tr>
                );
              })}
              {referrals.length === 0 && (
                <tr>
                  <td colSpan="5" className="py-14 text-center">
                    <HiOutlineUsers className="w-8 h-8 mx-auto mb-2" style={{ color: 'rgba(212,175,55,0.2)' }} />
                    <p style={{ color: 'rgba(255,255,255,0.3)' }}>No direct referrals yet.</p>
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
