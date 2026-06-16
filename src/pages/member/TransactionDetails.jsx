import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../../api';
import { useTheme } from '../../contexts/ThemeContext';
import { formatDateTimeManila } from '../../utils/dateTime';

const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function normalizeTransaction(data) {
  const candidate = data?.transaction || data?.details?.transaction || data?.record || data?.payload?.transaction || null;
  if (!candidate || (candidate.pid == null && candidate.transdate == null && candidate.transactionType == null && candidate.transactiontype == null)) {
    return null;
  }

  return {
    pid: candidate.pid ?? candidate.id ?? null,
    transactionTypeName: candidate.transactionTypeName || candidate.transaction_type_name || (
      Number(candidate.transactionType ?? candidate.transactiontype ?? 0) === 1
        ? 'Income'
        : Number(candidate.transactionType ?? candidate.transactiontype ?? 0) === 10
          ? 'Encashment'
          : Number(candidate.transactionType ?? candidate.transactiontype ?? 0) === 11
            ? 'Voucher'
            : 'Other'
    ),
    transdate: candidate.transdate || candidate.transactionDate || candidate.cashtransdate || null,
    beginningBalance: candidate.beginningBalance ?? candidate.beginningbalance ?? 0,
    endingBalance: candidate.endingBalance ?? candidate.endingbalance ?? 0,
    directReferral: candidate.directReferral ?? candidate.income1 ?? 0,
    pairing: candidate.pairing ?? candidate.income2 ?? 0,
    leadership: candidate.leadership ?? candidate.income3 ?? 0,
    unilevel: candidate.unilevel ?? candidate.income4 ?? 0,
    hifive: candidate.hifive ?? candidate.income5 ?? 0,
    rankingBonus: candidate.rankingBonus ?? candidate.income6 ?? 0,
    encashment: candidate.encashment ?? candidate.encashment1 ?? 0,
    deductions: candidate.deductions ?? 0,
    cashPaid: candidate.cashPaid ?? candidate.cash_paid ?? 0,
    voucherUsed: candidate.voucherUsed ?? candidate.voucher_used ?? 0,
    totalProductValue: candidate.totalProductValue ?? candidate.total_value ?? 0,
  };
}

function normalizeVoucherDetail(data) {
  const v = data?.voucherDetail || data?.details?.voucherDetail || null;
  if (!v) return null;
  return {
    source: v.source || (v.requestSource === 'cashier' ? 'Cashier (manual transaction)' : 'Member-side request'),
    requestSource: v.requestSource || null,
    erNumber: v.erNumber || null,
    claimStatus: v.claimStatus || null,
    availmentDate: v.availmentDate || null,
    processedByAdmin: v.processedByAdmin || null,
    items: Array.isArray(v.items) ? v.items.filter(Boolean) : [],
    itemsTotal: Number(v.itemsTotal || 0),
  };
}

function normalizeAccount(data) {
  const candidate = data?.account || data?.details?.account || {};
  return {
    entryState: candidate.entryState || candidate.accountState || '-',
    cdAmount: candidate.cdAmount ?? candidate.cdamount ?? 0,
    cdTotal: candidate.cdTotal ?? candidate.cdtotal ?? 0,
    cdStatus: candidate.cdStatus ?? candidate.cdstatus ?? 0,
  };
}

function normalizeSupporting(data) {
  const supporting = data?.supporting || data?.details?.supporting || {};
  return {
    directReferrals: Array.isArray(supporting.directReferrals) ? supporting.directReferrals.filter(Boolean) : [],
    leadershipSources: Array.isArray(supporting.leadershipSources) ? supporting.leadershipSources.filter(Boolean) : [],
    pairingTrace: Array.isArray(supporting.pairingTrace) ? supporting.pairingTrace.filter(Boolean) : [],
    hiFiveSources: Array.isArray(supporting.hiFiveSources) ? supporting.hiFiveSources.filter(Boolean) : [],
    hiFiveSummary: supporting.hiFiveSummary || null,
    unilevelSources: Array.isArray(supporting.unilevelSources) ? supporting.unilevelSources.filter(Boolean) : [],
    rankingSources: Array.isArray(supporting.rankingSources) ? supporting.rankingSources.filter(Boolean) : [],
    notes: supporting.notes || {},
  };
}

function EmptySupportMessage({ message }) {
  return <div className="portal-card-muted text-sm">{message}</div>;
}

function SupportCard({ title, rows = [], emptyMessage, renderRow, note = null, footer = null }) {
  return (
    <div className="portal-support-card rounded-xl p-4">
      <p className="portal-card-title text-sm font-semibold">{title}</p>
      {note && (
        <p className="portal-card-muted text-xs mt-2 leading-5">{note}</p>
      )}
      <div className="space-y-2 mt-3 max-h-64 overflow-y-auto">
        {rows.map(renderRow)}
        {rows.length === 0 && <EmptySupportMessage message={emptyMessage} />}
      </div>
      {footer}
    </div>
  );
}

export default function TransactionDetails() {
  const { pid } = useParams();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
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

  const tx = normalizeTransaction(data);
  const account = normalizeAccount(data);
  const supporting = normalizeSupporting(data);
  const voucherDetail = normalizeVoucherDetail(data);
  const isVoucher = tx?.transactionTypeName === 'Voucher';
  const notes = supporting.notes || {};
  // CD Details section is only relevant for CD accounts (cdStatus 1 or 2)
  const isCdAccount = Number(account.cdStatus) === 1 || Number(account.cdStatus) === 2
    || String(account.entryState || '').toUpperCase().includes('CD');
  const breadcrumbText = isDarkMode ? 'rgba(255,255,255,0.52)' : '#64748b';
  const detailButtonStyle = isDarkMode
    ? { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.72)', border: '1px solid rgba(255,255,255,0.12)' }
    : { background: 'rgba(235,240,246,0.94)', color: '#475569', border: '1px solid rgba(148,163,184,0.3)' };
  const detailValueTone = isDarkMode ? 'text-white' : 'text-slate-800';
  const supportTextTone = isDarkMode ? 'text-white/75' : 'text-slate-700';
  const supportMutedTone = isDarkMode ? 'text-white/45' : 'text-slate-500';

  if (!data || !tx) {
    return <p className="portal-card-muted">Unable to load this transaction detail.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm" style={{ color: breadcrumbText }}>
        <Link to="/transactions" style={{ color: '#D4AF37' }}>Transactions</Link>
        <span>/</span>
        <span>Details #{tx.pid}</span>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="portal-page-title font-display text-2xl font-bold">Transaction Details</h1>
            <p className="portal-card-muted text-sm mt-2">
              Full income breakdown, account CD state, and only the supporting connections tied to this specific transaction.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/transactions')}
            className="rounded-lg px-3 py-1.5 text-sm"
            style={detailButtonStyle}
          >
            Back
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="portal-detail-card rounded-2xl p-4"><p className="portal-detail-label">Type</p><p className={`mmt-1 font-semibold ${detailValueTone}`}>{tx.transactionTypeName}</p></div>
        <div className="portal-detail-card rounded-2xl p-4"><p className="portal-detail-label">Date</p><p className={`mmt-1 font-semibold ${detailValueTone}`}>{formatDateTimeManila(tx.transdate)}</p></div>
        {isVoucher ? (
          <>
            <div className="portal-detail-card rounded-2xl p-4"><p className="portal-detail-label">Voucher Used</p><p className={`mmt-1 font-semibold ${detailValueTone}`}>PHP {fmt(tx.voucherUsed)}</p></div>
            <div className="portal-detail-card rounded-2xl p-4"><p className="portal-detail-label">Cash Paid</p><p className={`mmt-1 font-semibold ${detailValueTone}`}>PHP {fmt(tx.cashPaid)}</p></div>
          </>
        ) : (
          <>
            <div className="portal-detail-card rounded-2xl p-4"><p className="portal-detail-label">Beginning</p><p className={`mmt-1 font-semibold ${detailValueTone}`}>PHP {fmt(tx.beginningBalance)}</p></div>
            <div className="portal-detail-card rounded-2xl p-4"><p className="portal-detail-label">Ending</p><p className={`mmt-1 font-semibold ${detailValueTone}`}>PHP {fmt(tx.endingBalance)}</p></div>
          </>
        )}
      </div>

      {isVoucher && (
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h2 className="portal-page-title font-display text-lg font-semibold">Voucher Details</h2>
              <p className="portal-card-muted text-sm mt-1">
                {voucherDetail?.source || 'Voucher availment'}
                {voucherDetail?.availmentDate ? ` · ${formatDateTimeManila(voucherDetail.availmentDate)}` : ''}
              </p>
            </div>
            {voucherDetail?.erNumber && (
              <span className="text-xs font-semibold px-2 py-1 rounded-lg" style={{ background: 'rgba(212,175,55,0.14)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.28)' }}>
                ER {voucherDetail.erNumber}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 text-sm">
            <div className="portal-detail-card rounded-xl px-4 py-3"><p className="portal-detail-label">Source</p><p className={`mmt-1 font-semibold ${detailValueTone}`}>{voucherDetail?.source || '-'}</p></div>
            <div className="portal-detail-card rounded-xl px-4 py-3"><p className="portal-detail-label">Processed By</p><p className={`mmt-1 font-semibold ${detailValueTone}`}>{voucherDetail?.processedByAdmin || (voucherDetail?.requestSource === 'cashier' ? 'Cashier' : 'Member')}</p></div>
            <div className="portal-detail-card rounded-xl px-4 py-3"><p className="portal-detail-label">Voucher Used</p><p className={`mmt-1 font-semibold ${detailValueTone}`}>PHP {fmt(tx.voucherUsed)}</p></div>
            <div className="portal-detail-card rounded-xl px-4 py-3"><p className="portal-detail-label">Cash Paid</p><p className={`mmt-1 font-semibold ${detailValueTone}`}>PHP {fmt(tx.cashPaid)}</p></div>
          </div>

          <div className="mt-5">
            <p className="portal-detail-label mb-2">Products Purchased</p>
            {voucherDetail && voucherDetail.items.length > 0 ? (
              <div className="portal-detail-card rounded-xl overflow-hidden">
                {voucherDetail.items.map((item, idx) => (
                  <div key={`${item.lineNo}-${idx}`} className="flex items-center justify-between px-4 py-3" style={{ borderTop: idx === 0 ? 'none' : '1px solid rgba(148,163,184,0.18)' }}>
                    <span className={`text-sm ${supportTextTone}`}>
                      {idx + 1}. {item.label}
                      {item.productCode != null && <span className={supportMutedTone}> (#{item.productCode})</span>}
                    </span>
                    <span className="portal-gold-text text-sm font-semibold">PHP {fmt(item.amount)}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: '1px solid rgba(212,175,55,0.35)', background: 'rgba(212,175,55,0.06)' }}>
                  <span className={`text-sm font-semibold ${detailValueTone}`}>Total</span>
                  <span className="portal-gold-text text-sm font-bold">PHP {fmt(voucherDetail.itemsTotal || tx.totalProductValue)}</span>
                </div>
              </div>
            ) : (
              <div className="portal-card-muted text-sm">
                Itemized products were not recorded for this voucher transaction. Total value: PHP {fmt(tx.totalProductValue)}.
              </div>
            )}
          </div>
        </div>
      )}

      {!isVoucher && (
      <div className="glass-card rounded-2xl p-6">
        <h2 className="portal-page-title font-display text-lg font-semibold">Breakdown</h2>
        <div className="grid grid-cols-1 gap-3 mt-4 text-sm md:grid-cols-2">
          {[
            { label: 'Direct Referral', value: tx.directReferral },
            { label: 'Pairing', value: tx.pairing },
            { label: 'Leadership', value: tx.leadership },
            { label: 'Unilevel', value: tx.unilevel },
            { label: 'Hi-Five', value: tx.hifive },
            { label: 'Ranking Bonus', value: tx.rankingBonus },
            { label: 'Encashment', value: tx.encashment },
            { label: 'Deductions', value: tx.deductions },
          ].map(({ label, value }) => {
            const active = Number(value) > 0;
            return (
              <div
                key={label}
                className="portal-detail-card flex justify-between rounded-xl px-4 py-3"
                style={active ? { borderLeft: '3px solid rgba(212,175,55,0.6)', background: 'rgba(212,175,55,0.06)' } : {}}
              >
                <span className="portal-card-text flex items-center gap-2">
                  {label}
                  {active && (
                    <span
                      className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                      style={{ background: 'rgba(212,175,55,0.18)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.3)' }}
                    >
                      Credited
                    </span>
                  )}
                </span>
                <span className="portal-detail-value">PHP {fmt(value)}</span>
              </div>
            );
          })}
        </div>
      </div>
      )}

      {isCdAccount && (
        <div className="glass-card rounded-2xl p-6">
          <h2 className="portal-page-title font-display text-lg font-semibold">CD Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
            <div className="portal-detail-card rounded-xl px-4 py-3"><p className="portal-detail-label">Account State</p><p className={`mmt-1 font-semibold ${detailValueTone}`}>{account.entryState}</p></div>
            <div className="portal-detail-card rounded-xl px-4 py-3"><p className="portal-detail-label">CD Amount</p><p className={`mmt-1 font-semibold ${detailValueTone}`}>PHP {fmt(account.cdAmount)}</p></div>
            <div className="portal-detail-card rounded-xl px-4 py-3"><p className="portal-detail-label">CD Recovered</p><p className={`mmt-1 font-semibold ${detailValueTone}`}>PHP {fmt(account.cdTotal)}</p></div>
            <div className="portal-detail-card rounded-xl px-4 py-3"><p className="portal-detail-label">CD Status</p><p className={`mmt-1 font-semibold ${detailValueTone}`}>{Number(account.cdStatus) === 2 ? 'Fully Paid' : 'Unpaid'}</p></div>
          </div>
        </div>
      )}

      <div className="glass-card rounded-2xl p-6">
        <h2 className="portal-page-title font-display text-lg font-semibold">Supporting Connections</h2>
        <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-4 mt-4">
          <SupportCard
            title="Direct Referrals"
            rows={supporting.directReferrals || []}
            note={notes.directReferrals}
            emptyMessage="No direct referral contributors are tied to this record."
            renderRow={(row, index) => (
              <div key={`${row.uid}-${index}`} className={`ttext-sm ${supportTextTone}`}>
                {index + 1}. {row.fullname || row.username}
                {row.username && <span className={supportMutedTone}> @{row.username}</span>}
                {row.entryType && (
                  <span
                    className="ml-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full align-middle"
                    style={{ background: 'rgba(212,175,55,0.14)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.28)' }}
                  >
                    {row.entryType}
                  </span>
                )}{' '}
                <span className="portal-gold-text">PHP {fmt(row.amount || 0)}</span>
              </div>
            )}
          />
          <SupportCard
            title="Leadership Sources"
            rows={supporting.leadershipSources || []}
            note={notes.leadershipSources}
            emptyMessage="No leadership contributors are tied to this record."
            renderRow={(row, index) => (
              <div key={`${row.uid}-${index}`} className={`ttext-sm ${supportTextTone}`}>
                {index + 1}. {row.fullName || row.username} - L{row.level} - PHP {fmt(row.leadershipBonus)}
              </div>
            )}
          />
          <SupportCard
            title="Pairing Trace"
            rows={(supporting.pairingTrace || []).slice(0, 12)}
            note={notes.pairingTrace}
            emptyMessage="No pairing contributors are tied to this record."
            footer={(supporting.pairingTrace || []).length > 0 ? (
              <button
                type="button"
                onClick={() => navigate('/pairing')}
                className="mt-3 w-full text-xs font-semibold py-2 rounded-lg transition-colors"
                style={{ background: 'rgba(212,175,55,0.12)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.28)' }}
              >
                View all pairing events in Pairing Reports →
              </button>
            ) : null}
            renderRow={(row, index) => {
              const leftName = row.left?.username || row.left?.fullname;
              const rightName = row.right?.username || row.right?.fullname;
              const hasAccounts = leftName || rightName;
              const matchedPV = row.matchedPoints != null ? Math.round(row.matchedPoints / 250) : null;
              return (
                <div key={`${row.ledgerUid || row.historyUid}-${index}`} className={`ttext-sm ${supportTextTone}`}>
                  {hasAccounts ? (
                    <>
                      {index + 1}. {leftName || '—'} × {rightName || '—'} -{' '}
                      <span className="portal-gold-text">PHP {fmt(row.creditedIncome)}</span>
                      {matchedPV != null && <span className={supportMutedTone}> ({matchedPV} PV matched)</span>}
                    </>
                  ) : (
                    <>
                      {index + 1}. <span className="portal-gold-text">PHP {fmt(row.creditedIncome)}</span>
                      <span className={supportMutedTone}> — legacy record</span>
                    </>
                  )}
                </div>
              );
            }}
          />
          <SupportCard
            title="Hi-Five Sources"
            rows={supporting.hiFiveSources || []}
            note={notes.hiFiveSources || (supporting.hiFiveSummary ? `Matched from the paid Hi-Five claim for ${supporting.hiFiveSummary.totalContributors || 0} qualifying contributor${Number(supporting.hiFiveSummary.totalContributors || 0) === 1 ? '' : 's'}.` : null)}
            emptyMessage="No Hi-Five contributors are tied to this record."
            renderRow={(row, index) => (
              <div key={`${row.uid}-${index}`} className={`ttext-sm ${supportTextTone}`}>
                {index + 1}. {row.fullName || row.username} <span className={supportMutedTone}>({row.packageName || row.registrationAudit?.activationCode || 'Qualifier'})</span>
              </div>
            )}
          />
          <SupportCard
            title="Unilevel Sources"
            rows={supporting.unilevelSources || []}
            note={notes.unilevelSources}
            emptyMessage="No unilevel contributors are tied to this record."
            renderRow={(row, index) => (
              <div key={`${row.uid}-${index}`} className={`ttext-sm ${supportTextTone}`}>
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
              <div key={`${row.uid}-${index}`} className={`ttext-sm ${supportTextTone}`}>
                {index + 1}. {row.fullName || row.username}
              </div>
            )}
          />
        </div>
      </div>
    </div>
  );
}
