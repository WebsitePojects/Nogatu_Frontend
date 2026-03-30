import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api';

const PKG_COLORS = {
  Bronze:   '#CD7F32',
  Silver:   '#C0C0C0',
  Gold:     '#FFD700',
  Platinum: '#E5E4E2',
  Garnet:   '#733635',
  Diamond:  '#B9F2FF',
};

function fmt(n) {
  return Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function PkgBadge({ pkg }) {
  const color = PKG_COLORS[pkg] || '#D4AF37';
  return (
    <span
      className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full"
      style={{ background: `${color}22`, color, border: `1px solid ${color}44` }}
    >
      {pkg}
    </span>
  );
}

function IncomeModal({ tx, directReferrals, binaryChildren, leadershipDownline, onClose }) {
  if (!tx) return null;

  function incomeRow(label, desc, value, color) {
    const earned = value > 0;
    return (
      <div
        key={label}
        className="rounded-xl mb-3 overflow-hidden"
        style={{
          borderLeft: `3px solid ${earned ? color : 'rgba(255,255,255,0.1)'}`,
          background: earned ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.01)',
        }}
      >
        <div className="flex items-start justify-between px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-white/80">{label}</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{desc}</p>
          </div>
          <p
            className="text-sm font-bold whitespace-nowrap pl-4"
            style={{ color: earned ? '#4ade80' : 'rgba(255,255,255,0.2)' }}
          >
            {earned ? '+' : ''} ₱{fmt(value)}
          </p>
        </div>
      </div>
    );
  }

  const pairCard = (child) => {
    const isLeft = child.side === 'Left';
    return (
      <div
        key={child.username}
        className="flex-1 rounded-xl p-3"
        style={{
          background: isLeft ? 'rgba(59,130,246,0.08)' : 'rgba(239,68,68,0.08)',
          border: `1px solid ${isLeft ? 'rgba(59,130,246,0.25)' : 'rgba(239,68,68,0.25)'}`,
        }}
      >
        <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: isLeft ? '#60a5fa' : '#f87171' }}>{child.side} Leg</p>
        <p className="text-sm font-semibold text-white/80">{child.name}</p>
        <p className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.4)' }}>{child.username}</p>
        {child.pkg && <PkgBadge pkg={child.pkg} />}
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl"
        style={{ background: '#0e1117', border: '1px solid rgba(212,175,55,0.15)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5" style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.15), rgba(212,175,55,0.05))', borderBottom: '1px solid rgba(212,175,55,0.12)' }}>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'rgba(212,175,55,0.5)' }}>Income Credit</p>
          <p className="text-lg font-bold text-white">Transaction #{tx.pid}</p>
          <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {new Date(tx.transdate).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div className="px-6 py-5">
          {/* Balance movement */}
          <div className="flex items-center justify-between gap-2 rounded-xl px-4 py-3 mb-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="text-center">
              <p className="text-[9px] uppercase tracking-wider text-white/30 mb-1">Beginning</p>
              <p className="text-sm font-bold text-white/60">₱{fmt(tx.beginningbalance)}</p>
            </div>
            <span style={{ color: 'rgba(74,222,128,0.5)', fontSize: 18 }}>→</span>
            <div className="text-center">
              <p className="text-[9px] uppercase tracking-wider text-white/30 mb-1">Income Added</p>
              <p className="text-sm font-bold" style={{ color: '#4ade80' }}>+₱{fmt(tx.total)}</p>
            </div>
            <span style={{ color: 'rgba(96,165,250,0.5)', fontSize: 18 }}>→</span>
            <div className="text-center">
              <p className="text-[9px] uppercase tracking-wider text-white/30 mb-1">Ending</p>
              <p className="text-sm font-bold text-white/80">₱{fmt(tx.endingbalance)}</p>
            </div>
          </div>

          {/* Income breakdown */}
          <p className="text-[9px] font-bold uppercase tracking-widest mb-3" style={{ color: 'rgba(212,175,55,0.4)' }}>Income Breakdown</p>
          {incomeRow('Direct Referral Bonus', 'Fixed % of new recruit package value.', tx.income1, '#4ade80')}
          {incomeRow('Pairing Bonus', 'Per completed left-right binary pair match.', tx.income2, '#fb923c')}
          {incomeRow('Leadership Bonus', 'Generational override from downline income.', tx.income3, '#c084fc')}
          {incomeRow('Unilevel Bonus', 'Depth-based commission across unilevel network.', tx.income4, '#38bdf8')}
          {incomeRow('Hi-Five Product Bonus', 'Earned per 5 direct referrals of same package.', tx.income5, '#fbbf24')}

          {/* Total row */}
          <div className="flex justify-between items-center rounded-xl px-4 py-3 mt-1" style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)' }}>
            <span className="text-sm font-bold" style={{ color: '#4ade80' }}>Total Income Credited</span>
            <span className="text-base font-bold" style={{ color: '#4ade80' }}>₱{fmt(tx.total)}</span>
          </div>

          {/* Binary pair children */}
          {binaryChildren.length > 0 && (
            <div className="mt-5">
              <p className="text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: 'rgba(212,175,55,0.4)' }}>Binary Leg Children</p>
              <div className="flex gap-3">
                {binaryChildren.map(pairCard)}
              </div>
            </div>
          )}

          {/* Direct referrals summary */}
          {directReferrals.length > 0 && (
            <div className="mt-5">
              <p className="text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: 'rgba(212,175,55,0.4)' }}>Direct Referrals ({directReferrals.length})</p>
              <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                {directReferrals.map((d, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 px-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <div>
                      <span className="text-xs text-white/70">{d.name}</span>
                      <span className="text-xs font-mono ml-2" style={{ color: 'rgba(255,255,255,0.3)' }}>{d.username}</span>
                    </div>
                    {d.pkg && <PkgBadge pkg={d.pkg} />}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 pb-5 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-sm font-semibold cursor-pointer"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function IncomeDetails() {
  const { uid } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTx, setSelectedTx] = useState(null);

  useEffect(() => {
    api.get(`/admin/accounts/${uid}/income`)
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [uid]);

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
        Account not found.
      </div>
    );
  }

  const { member, totals, transactions, directReferrals, binaryChildren, leadershipDownline } = data;

  const totalCards = [
    { label: 'Direct Referral', value: totals.ttlincome1, color: '#4ade80' },
    { label: 'Pairing Bonus', value: totals.ttlincome2, color: '#fb923c' },
    { label: 'Leadership', value: totals.ttlincome3, color: '#c084fc' },
    { label: 'Unilevel', value: totals.ttlincome4, color: '#38bdf8' },
    { label: 'Hi-Five', value: totals.ttlincome5, color: '#fbbf24' },
    { label: 'Cash Balance', value: totals.ttlcashbalance, color: '#D4AF37' },
  ];

  return (
    <div>
      {/* Back + title */}
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={() => navigate('/admin/accounts')}
          className="text-sm px-3 py-1.5 rounded-lg cursor-pointer"
          style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          ← Back
        </button>
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Income Details</h1>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(212,175,55,0.5)' }}>
            {member.fullname} <span className="font-mono text-white/30">({member.username})</span>
          </p>
        </div>
      </div>

      {/* Cumulative totals */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {totalCards.map(c => (
          <div key={c.label} className="glass-card rounded-2xl p-4">
            <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>{c.label}</p>
            <p className="text-base font-bold" style={{ color: c.color }}>₱{fmt(c.value)}</p>
          </div>
        ))}
      </div>

      {/* Network cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Direct referrals */}
        <div className="glass-card rounded-2xl p-5">
          <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'rgba(212,175,55,0.4)' }}>
            Direct Referrals ({directReferrals.length})
          </p>
          {directReferrals.length === 0 ? (
            <p className="text-xs italic" style={{ color: 'rgba(255,255,255,0.25)' }}>None yet.</p>
          ) : (
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {directReferrals.map((d, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-white/70">{d.name}</p>
                    <p className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>{d.username}</p>
                  </div>
                  {d.pkg && <PkgBadge pkg={d.pkg} />}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Binary children */}
        <div className="glass-card rounded-2xl p-5">
          <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'rgba(212,175,55,0.4)' }}>Binary Leg Children</p>
          {binaryChildren.length === 0 ? (
            <p className="text-xs italic" style={{ color: 'rgba(255,255,255,0.25)' }}>No binary children yet.</p>
          ) : (
            <div className="flex gap-3">
              {binaryChildren.map(c => {
                const isLeft = c.side === 'Left';
                return (
                  <div
                    key={c.username}
                    className="flex-1 rounded-xl p-3"
                    style={{
                      background: isLeft ? 'rgba(59,130,246,0.08)' : 'rgba(239,68,68,0.08)',
                      border: `1px solid ${isLeft ? 'rgba(59,130,246,0.2)' : 'rgba(239,68,68,0.2)'}`,
                    }}
                  >
                    <p className="text-[9px] font-bold uppercase tracking-wider mb-1" style={{ color: isLeft ? '#60a5fa' : '#f87171' }}>{c.side}</p>
                    <p className="text-xs font-semibold text-white/80">{c.name}</p>
                    <p className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.35)' }}>{c.username}</p>
                    {c.pkg && <div className="mt-1"><PkgBadge pkg={c.pkg} /></div>}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Leadership downline */}
        <div className="glass-card rounded-2xl p-5">
          <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'rgba(212,175,55,0.4)' }}>
            Leadership Downline ({leadershipDownline.length})
          </p>
          {leadershipDownline.length === 0 ? (
            <p className="text-xs italic" style={{ color: 'rgba(255,255,255,0.25)' }}>None yet.</p>
          ) : (
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {leadershipDownline.map((d, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-white/70">{d.name}</p>
                    <p className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>{d.username}</p>
                  </div>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(192,132,252,0.12)', color: '#c084fc', border: '1px solid rgba(192,132,252,0.25)' }}
                  >
                    {d.lvl}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Transactions table */}
      <div className="glass-card rounded-2xl p-6 overflow-hidden">
        <p className="text-sm font-semibold text-white/70 mb-4">Income Transactions ({transactions.length})</p>
        {transactions.length === 0 ? (
          <p className="text-center py-10 text-sm" style={{ color: 'rgba(255,255,255,0.25)' }}>No income transactions found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  {['Date', 'Direct Referral', 'Pairing', 'Leadership', 'Unilevel', 'Hi-Five', 'Total', ''].map(h => (
                    <th key={h} className="table-header py-3 px-4 text-left font-semibold text-xs uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx, idx) => (
                  <tr
                    key={tx.pid}
                    style={{ background: idx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(212,175,55,0.05)'}
                    onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent'}
                  >
                    <td className="py-3 px-4 text-xs text-white/60">
                      {new Date(tx.transdate).toLocaleDateString('en-PH')}
                    </td>
                    <td className="py-3 px-4 text-xs" style={{ color: tx.income1 > 0 ? '#4ade80' : 'rgba(255,255,255,0.3)' }}>₱{fmt(tx.income1)}</td>
                    <td className="py-3 px-4 text-xs" style={{ color: tx.income2 > 0 ? '#fb923c' : 'rgba(255,255,255,0.3)' }}>₱{fmt(tx.income2)}</td>
                    <td className="py-3 px-4 text-xs" style={{ color: tx.income3 > 0 ? '#c084fc' : 'rgba(255,255,255,0.3)' }}>₱{fmt(tx.income3)}</td>
                    <td className="py-3 px-4 text-xs" style={{ color: tx.income4 > 0 ? '#38bdf8' : 'rgba(255,255,255,0.3)' }}>₱{fmt(tx.income4)}</td>
                    <td className="py-3 px-4 text-xs" style={{ color: tx.income5 > 0 ? '#fbbf24' : 'rgba(255,255,255,0.3)' }}>₱{fmt(tx.income5)}</td>
                    <td className="py-3 px-4 text-sm font-bold" style={{ color: '#D4AF37' }}>₱{fmt(tx.total)}</td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => setSelectedTx(tx)}
                        className="text-xs px-2.5 py-1 rounded-lg font-medium cursor-pointer"
                        style={{ background: 'rgba(212,175,55,0.1)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.2)' }}
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedTx && (
        <IncomeModal
          tx={selectedTx}
          directReferrals={directReferrals}
          binaryChildren={binaryChildren}
          leadershipDownline={leadershipDownline}
          onClose={() => setSelectedTx(null)}
        />
      )}
    </div>
  );
}
