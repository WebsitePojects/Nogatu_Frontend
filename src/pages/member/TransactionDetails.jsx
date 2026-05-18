import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../../api';
import { formatDateTimeManila } from '../../utils/dateTime';

const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function EmptySupportMessage({ message }) {
  return <div className="text-sm text-white/45">{message}</div>;
}

function SupportCard({ title, rows = [], emptyMessage, renderRow, note = null }) {
  return (
    <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
      <p className="text-sm font-semibold text-white">{title}</p>
      {note && (
        <p className="text-xs mt-2 leading-5" style={{ color: 'rgba(255,255,255,0.45)' }}>{note}</p>
      )}
      <div className="space-y-2 mt-3 max-h-64 overflow-y-auto">
        {rows.map(renderRow)}
        {rows.length === 0 && <EmptySupportMessage message={emptyMessage} />}
      </div>
    </div>
  );
}

export default function TransactionDetails() {
  const { pid } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await api.get(`/transactions/${pid}`);
        if (!cancelled) setData(res.data);
      } catch {
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [pid]);

  if (loading) {
    return <p className="portal-card-muted">Loading transaction details...</p>;
  }

  if (!data) {
    return <p className="portal-card-muted">Unable to load this transaction detail.</p>;
  }

  const tx = data.transaction;
  const account = data.account;
  const supporting = data.supporting || {};
  const notes = supporting.notes || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm" style={{ color: 'rgba(255,255,255,0.52)' }}>
        <Link to="/transactions" style={{ color: '#D4AF37' }}>Transactions</Link>
        <span>/</span>
        <span>Details #{tx.pid}</span>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-white">Transaction Details</h1>
            <p className="text-sm mt-2" style={{ color: 'rgba(255,255,255,0.55)' }}>
              Full income breakdown, account CD state, and only the supporting connections tied to this specific transaction.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/transactions')}
            className="rounded-lg px-3 py-1.5 text-sm"
            style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.72)', border: '1px solid rgba(255,255,255,0.12)' }}
          >
            Back
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-4"><p className="text-xs text-white/45">Type</p><p className="text-white font-semibold mt-1">{tx.transactionTypeName}</p></div>
        <div className="glass-card rounded-2xl p-4"><p className="text-xs text-white/45">Date</p><p className="text-white font-semibold mt-1">{formatDateTimeManila(tx.transdate)}</p></div>
        <div className="glass-card rounded-2xl p-4"><p className="text-xs text-white/45">Beginning</p><p className="text-white font-semibold mt-1">PHP {fmt(tx.beginningBalance)}</p></div>
        <div className="glass-card rounded-2xl p-4"><p className="text-xs text-white/45">Ending</p><p className="text-white font-semibold mt-1">PHP {fmt(tx.endingBalance)}</p></div>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <h2 className="font-display text-lg font-semibold text-white">Breakdown</h2>
        <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
          <div className="flex justify-between"><span>Direct Referral</span><span>PHP {fmt(tx.directReferral)}</span></div>
          <div className="flex justify-between"><span>Pairing</span><span>PHP {fmt(tx.pairing)}</span></div>
          <div className="flex justify-between"><span>Leadership</span><span>PHP {fmt(tx.leadership)}</span></div>
          <div className="flex justify-between"><span>Unilevel</span><span>PHP {fmt(tx.unilevel)}</span></div>
          <div className="flex justify-between"><span>Hi-Five</span><span>PHP {fmt(tx.hifive)}</span></div>
          <div className="flex justify-between"><span>Ranking Bonus</span><span>PHP {fmt(tx.rankingBonus)}</span></div>
          <div className="flex justify-between"><span>Encashment</span><span>PHP {fmt(tx.encashment)}</span></div>
          <div className="flex justify-between"><span>Deductions</span><span>PHP {fmt(tx.deductions)}</span></div>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <h2 className="font-display text-lg font-semibold text-white">CD Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          <div><p className="text-xs text-white/45">Account State</p><p className="text-white font-semibold mt-1">{account.entryState}</p></div>
          <div><p className="text-xs text-white/45">CD Amount</p><p className="text-white font-semibold mt-1">PHP {fmt(account.cdAmount)}</p></div>
          <div><p className="text-xs text-white/45">CD Recovered</p><p className="text-white font-semibold mt-1">PHP {fmt(account.cdTotal)}</p></div>
          <div><p className="text-xs text-white/45">CD Status</p><p className="text-white font-semibold mt-1">{Number(account.cdStatus) === 2 ? 'Fully Paid' : Number(account.cdStatus) === 1 ? 'Unpaid' : 'Not CD'}</p></div>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <h2 className="font-display text-lg font-semibold text-white">Supporting Connections</h2>
        <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-4 mt-4">
          <SupportCard
            title="Direct Referrals"
            rows={supporting.directReferrals || []}
            note={notes.directReferrals}
            emptyMessage="No direct referral contributors are tied to this record."
            renderRow={(row, index) => (
              <div key={`${row.uid}-${index}`} className="text-sm text-white/75">
                {index + 1}. {row.fullname} <span className="text-white/45">({row.entryType})</span>
              </div>
            )}
          />
          <SupportCard
            title="Leadership Sources"
            rows={supporting.leadershipSources || []}
            note={notes.leadershipSources}
            emptyMessage="No leadership contributors are tied to this record."
            renderRow={(row, index) => (
              <div key={`${row.uid}-${index}`} className="text-sm text-white/75">
                {index + 1}. {row.fullName || row.username} - L{row.level} - PHP {fmt(row.leadershipBonus)}
              </div>
            )}
          />
          <SupportCard
            title="Pairing Trace"
            rows={(supporting.pairingTrace || []).slice(0, 12)}
            note={notes.pairingTrace}
            emptyMessage="No pairing contributors are tied to this record."
            renderRow={(row, index) => (
              <div key={`${row.ledgerUid}-${index}`} className="text-sm text-white/75">
                {index + 1}. {row.left?.username || '-'} x {row.right?.username || '-'} - PHP {fmt(row.creditedIncome)}
              </div>
            )}
          />
          <SupportCard
            title="Hi-Five Sources"
            rows={supporting.hiFiveSources || []}
            note={notes.hiFiveSources || (supporting.hiFiveSummary ? `Matched from the paid Hi-Five claim for ${supporting.hiFiveSummary.totalContributors || 0} qualifying contributor${Number(supporting.hiFiveSummary.totalContributors || 0) === 1 ? '' : 's'}.` : null)}
            emptyMessage="No Hi-Five contributors are tied to this record."
            renderRow={(row, index) => (
              <div key={`${row.uid}-${index}`} className="text-sm text-white/75">
                {index + 1}. {row.fullName || row.username} <span className="text-white/45">({row.packageName || row.registrationAudit?.activationCode || 'Qualifier'})</span>
              </div>
            )}
          />
          <SupportCard
            title="Unilevel Sources"
            rows={supporting.unilevelSources || []}
            note={notes.unilevelSources}
            emptyMessage="No unilevel contributors are tied to this record."
            renderRow={(row, index) => (
              <div key={`${row.uid}-${index}`} className="text-sm text-white/75">
                {index + 1}. {row.fullName || row.username}
              </div>
            )}
          />
          <SupportCard
            title="Ranking Bonus Sources"
            rows={supporting.rankingSources || []}
            note={notes.rankingSources}
            emptyMessage="No ranking bonus contributors are tied to this record."
            renderRow={(row, index) => (
              <div key={`${row.uid}-${index}`} className="text-sm text-white/75">
                {index + 1}. {row.fullName || row.username}
              </div>
            )}
          />
        </div>
      </div>
    </div>
  );
}
