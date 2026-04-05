import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api';

function fmt(n) {
  return Number(n || 0).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function CDPaymentDetails() {
  const { uid } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/admin/accounts/${uid}/cd`)
      .then((res) => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [uid]);

  const totals = useMemo(() => {
    const records = data?.records || [];
    let cddeduction = 0;
    let netEncashment = 0;

    for (const row of records) {
      cddeduction += Number(row.cddeduction || 0);
      netEncashment += Number(row.encashment || 0);
    }

    return {
      cddeduction,
      netEncashment,
      count: records.length,
    };
  }, [data]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-4" style={{ borderColor: 'rgba(212,175,55,0.15)', borderTopColor: '#D4AF37' }} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20" style={{ color: 'rgba(255,255,255,0.35)' }}>
        CD payment details not found.
      </div>
    );
  }

  const { member, records } = data;
  const cdSettled = Number(member.cdRemaining || 0) <= 0 || Number(member.cdstatus) === 2;

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={() => navigate('/admin/accounts')}
          className="text-sm px-3 py-1.5 rounded-lg cursor-pointer"
          style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          ← Back
        </button>
        <div>
          <h1 className="font-display text-2xl font-bold text-white">CD Payment Details</h1>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(212,175,55,0.5)' }}>
            {member.fullname} <span className="font-mono text-white/30">({member.username})</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <div className="glass-card rounded-2xl p-4">
          <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>CD Amount</p>
          <p className="text-base font-bold text-white/80">₱{fmt(member.cdamount)}</p>
        </div>
        <div className="glass-card rounded-2xl p-4">
          <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>CD Paid</p>
          <p className="text-base font-bold text-white/80">₱{fmt(member.cdtotal)}</p>
        </div>
        <div className="glass-card rounded-2xl p-4">
          <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>CD Remaining</p>
          <p className="text-base font-bold" style={{ color: cdSettled ? '#4ade80' : '#fca5a5' }}>₱{fmt(member.cdRemaining)}</p>
        </div>
        <div className="glass-card rounded-2xl p-4">
          <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>Status</p>
          <p className="text-base font-bold" style={{ color: cdSettled ? '#4ade80' : '#fbbf24' }}>{cdSettled ? 'Settled' : 'Active'}</p>
        </div>
        <div className="glass-card rounded-2xl p-4">
          <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>CD Deductions</p>
          <p className="text-base font-bold" style={{ color: '#f87171' }}>₱{fmt(totals.cddeduction)}</p>
        </div>
        <div className="glass-card rounded-2xl p-4">
          <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>CD Encashments</p>
          <p className="text-base font-bold" style={{ color: '#D4AF37' }}>{totals.count}</p>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6 overflow-hidden">
        <p className="text-sm font-semibold text-white/70 mb-4">CD Deduction History ({records.length})</p>
        {records.length === 0 ? (
          <p className="text-center py-10 text-sm" style={{ color: 'rgba(255,255,255,0.25)' }}>No CD deduction records found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  {['Date', 'Net Encashment', 'Tax + Fee', 'CD Deduction'].map((h) => (
                    <th key={h} className="table-header py-3 px-4 text-left font-semibold text-xs uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.map((row, idx) => (
                  <tr
                    key={row.pid}
                    style={{ background: idx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(212,175,55,0.05)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = idx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent'; }}
                  >
                    <td className="py-3 px-4 text-xs text-white/60">{new Date(row.transdate).toLocaleDateString('en-PH')}</td>
                    <td className="py-3 px-4 text-xs text-white/75">₱{fmt(row.encashment)}</td>
                    <td className="py-3 px-4 text-xs text-white/60">₱{fmt(row.taxAndFee)}</td>
                    <td className="py-3 px-4 text-xs font-bold" style={{ color: '#f87171' }}>₱{fmt(row.cddeduction)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td className="py-3 px-4 text-xs font-semibold text-white/70">Totals</td>
                  <td className="py-3 px-4 text-xs font-semibold text-white/70">₱{fmt(totals.netEncashment)}</td>
                  <td className="py-3 px-4" />
                  <td className="py-3 px-4 text-xs font-semibold" style={{ color: '#f87171' }}>₱{fmt(totals.cddeduction)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
