import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api';
import {
  HiOutlineArrowLeft, HiOutlineUser, HiOutlineCurrencyDollar,
  HiOutlineChartBar, HiOutlineShare, HiOutlineDocumentText,
  HiOutlineUsers, HiOutlineBan, HiOutlineEye,
} from 'react-icons/hi';

const fmt = (n) => Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtPts = (n) => Number(n || 0).toLocaleString('en-PH');

const PKG_COLORS = { Bronze: '#CD7F32', Silver: '#C0C0C0', Gold: '#FFD700', Platinum: '#E5E4E2', Garnet: '#733635', Diamond: '#B9F2FF' };
const CODE_LABELS = { 1: 'PD', 2: 'FS', 3: 'CD' };
const CODE_COLORS = { 1: '#4ade80', 2: '#60a5fa', 3: '#f59e0b' };

function Badge({ children, color }) {
  return (
    <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${color}22`, color, border: `1px solid ${color}44` }}>
      {children}
    </span>
  );
}

function Spinner() {
  return (
    <div className="flex justify-center py-16">
      <div className="size-8 border-4 rounded-full animate-spin" style={{ borderColor: 'rgba(212,175,55,0.2)', borderTopColor: '#D4AF37' }} />
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-white/5 last:border-0">
      <span className="text-xs text-slate-400">{label}</span>
      <span className="text-sm font-medium text-slate-200 text-right max-w-[60%] truncate">{value || '—'}</span>
    </div>
  );
}

// ─── Tab: Profile ────────────────────────────────────────────────────────────
function ProfileTab({ uid }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/admin/view-as/${uid}/profile`)
      .then(r => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [uid]);

  if (loading) return <Spinner />;
  if (!data) return <p className="text-slate-500 text-sm py-8 text-center">Failed to load profile.</p>;

  const codeColor = CODE_COLORS[data.codeid] || '#D4AF37';
  const pkgColor = PKG_COLORS[data.acctTypeName] || '#D4AF37';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div className="glass-card rounded-2xl p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-amber-400 mb-3">Account Info</p>
        <InfoRow label="Username" value={data.username} />
        <InfoRow label="Full Name" value={data.fullname} />
        <InfoRow label="Email" value={data.email} />
        <InfoRow label="Mobile" value={data.mobileno} />
        <InfoRow label="Gender" value={data.gender} />
        <InfoRow label="Date of Birth" value={data.birthdate} />
        <InfoRow label="Address" value={data.address} />
      </div>
      <div className="space-y-4">
        <div className="glass-card rounded-2xl p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-400 mb-3">Package & Code</p>
          <div className="flex gap-2 mb-3">
            <Badge color={pkgColor}>{data.acctTypeName}</Badge>
            <Badge color={codeColor}>{CODE_LABELS[data.codeid] || `Code ${data.codeid}`}</Badge>
            {data.codeid === 3 && <Badge color={data.cdstatus === 2 ? '#4ade80' : '#f59e0b'}>{data.cdstatus === 2 ? 'CD Paid' : 'CD Unpaid'}</Badge>}
          </div>
          <InfoRow label="Active Date" value={data.activedate} />
          <InfoRow label="Binary Points" value={fmtPts(data.binarypoints)} />
          <InfoRow label="Position" value={data.position ? (data.position === 'L' ? 'Left' : 'Right') : '—'} />
          <InfoRow label="Account Status" value={data.accountStatus} />
          {data.accountStatusReason && <InfoRow label="Reason" value={data.accountStatusReason} />}
        </div>
        <div className="glass-card rounded-2xl p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-400 mb-3">Network</p>
          <InfoRow label="Binary Parent" value={data.binaryParent ? `${data.binaryParent.username}` : '—'} />
          <InfoRow label="Sponsor" value={data.sponsor ? `${data.sponsor.username}` : '—'} />
        </div>
        {data.codeid === 3 && (
          <div className="glass-card rounded-2xl p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-400 mb-3">CD Obligation</p>
            <InfoRow label="CD Amount" value={`₱${fmt(data.cdamount)}`} />
            <InfoRow label="CD Paid So Far" value={`₱${fmt(data.cdtotal)}`} />
            <InfoRow label="Remaining" value={`₱${fmt(Math.max(0, (data.cdamount || 0) - (data.cdtotal || 0)))}`} />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Tab: Dashboard ──────────────────────────────────────────────────────────
function DashboardTab({ uid }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/admin/view-as/${uid}/dashboard`)
      .then(r => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [uid]);

  if (loading) return <Spinner />;
  if (!data) return <p className="text-slate-500 text-sm py-8 text-center">Failed to load dashboard.</p>;

  const inc = data.income || {};
  const incomeRows = [
    { label: 'Direct Referral', value: inc.income1 || 0, color: '#4ade80' },
    { label: 'Binary Pairing', value: inc.income2 || 0, color: '#60a5fa' },
    { label: 'Leadership Bonus', value: inc.income3 || 0, color: '#a78bfa' },
    { label: 'Unilevel', value: inc.income4 || 0, color: '#f59e0b' },
    { label: 'Hi-Five Cash', value: inc.income5 || 0, color: '#f472b6' },
    { label: 'LPC Bonus', value: inc.income6 || 0, color: '#34d399' },
  ];

  const total = incomeRows.reduce((s, r) => s + r.value, 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-4">
          <p className="text-xs text-slate-400 mb-1">Total Earnings</p>
          <p className="text-2xl font-bold text-amber-400">₱{fmt(total)}</p>
        </div>
        <div className="glass-card rounded-2xl p-4">
          <p className="text-xs text-slate-400 mb-1">Left Leg Points</p>
          <p className="text-2xl font-bold text-blue-400">{fmtPts(data.binaryPoints?.left)}</p>
        </div>
        <div className="glass-card rounded-2xl p-4">
          <p className="text-xs text-slate-400 mb-1">Right Leg Points</p>
          <p className="text-2xl font-bold text-red-400">{fmtPts(data.binaryPoints?.right)}</p>
        </div>
        <div className="glass-card rounded-2xl p-4">
          <p className="text-xs text-slate-400 mb-1">Direct Referrals</p>
          <p className="text-2xl font-bold text-green-400">{data.directReferrals || 0}</p>
        </div>
        <div className="glass-card rounded-2xl p-4">
          <p className="text-xs text-slate-400 mb-1">Encashed</p>
          <p className="text-2xl font-bold text-slate-200">₱{fmt(inc.encashed)}</p>
        </div>
        <div className="glass-card rounded-2xl p-4">
          <p className="text-xs text-slate-400 mb-1">Available Balance</p>
          <p className="text-2xl font-bold text-emerald-400">₱{fmt(total - (inc.encashed || 0))}</p>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-amber-400 mb-4">Income Breakdown</p>
        <div className="space-y-2">
          {incomeRows.map(r => (
            <div key={r.label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full" style={{ background: r.color }} />
                <span className="text-sm text-slate-300">{r.label}</span>
              </div>
              <span className="text-sm font-semibold" style={{ color: r.value > 0 ? r.color : 'rgba(255,255,255,0.25)' }}>
                ₱{fmt(r.value)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Wallet ─────────────────────────────────────────────────────────────
function WalletTab({ uid }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/admin/view-as/${uid}/wallet`)
      .then(r => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [uid]);

  if (loading) return <Spinner />;
  if (!data) return <p className="text-slate-500 text-sm py-8 text-center">Failed to load wallet.</p>;

  const inc = data.income || {};
  const incomeTypes = [
    { label: 'Direct Referral', key: 'income1', color: '#4ade80' },
    { label: 'Binary Pairing', key: 'income2', color: '#60a5fa' },
    { label: 'Leadership Bonus', key: 'income3', color: '#a78bfa' },
    { label: 'Unilevel', key: 'income4', color: '#f59e0b' },
    { label: 'Hi-Five Cash', key: 'income5', color: '#f472b6' },
    { label: 'LPC Bonus', key: 'income6', color: '#34d399' },
  ];
  const gross = incomeTypes.reduce((s, t) => s + (inc[t.key] || 0), 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-5">
          <p className="text-xs text-slate-400 mb-1">Gross Income</p>
          <p className="text-2xl font-bold text-amber-400">₱{fmt(gross)}</p>
        </div>
        <div className="glass-card rounded-2xl p-5">
          <p className="text-xs text-slate-400 mb-1">Total Encashed</p>
          <p className="text-2xl font-bold text-red-400">₱{fmt(inc.encashed)}</p>
        </div>
        <div className="glass-card rounded-2xl p-5">
          <p className="text-xs text-slate-400 mb-1">Available Balance</p>
          <p className="text-2xl font-bold text-emerald-400">₱{fmt(gross - (inc.encashed || 0))}</p>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-amber-400 mb-4">Income Sources</p>
        {incomeTypes.map(t => (
          <div key={t.key} className="flex justify-between items-center py-2.5 border-b border-white/5 last:border-0">
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full" style={{ background: t.color }} />
              <span className="text-sm text-slate-300">{t.label}</span>
            </div>
            <span className="text-sm font-semibold" style={{ color: (inc[t.key] || 0) > 0 ? t.color : 'rgba(255,255,255,0.25)' }}>
              ₱{fmt(inc[t.key])}
            </span>
          </div>
        ))}
      </div>

      {data.codeid === 3 && (
        <div className="glass-card rounded-2xl p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-400 mb-3">CD Deduction Status</p>
          <InfoRow label="CD Amount" value={`₱${fmt(data.cdamount)}`} />
          <InfoRow label="Paid So Far" value={`₱${fmt(data.cdtotal)}`} />
          <InfoRow label="Status" value={data.cdstatus === 2 ? 'Fully Paid' : 'Outstanding'} />
        </div>
      )}

      {data.globalBonus?.hasGlobalBonus && (
        <div className="glass-card rounded-2xl p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-400 mb-3">Global Bonus</p>
          <InfoRow label="Global Bonus Amount" value={`₱${fmt(data.globalBonus.globalBonusAmount)}`} />
        </div>
      )}

      <div className="glass-card rounded-2xl p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-amber-400 mb-3">Unilevel Maintenance</p>
        <InfoRow label="Maintenance Met" value={data.unilevelMaintenance?.maintenanceMet ? 'Yes' : 'No'} />
        <InfoRow label="Projected Unilevel" value={`₱${fmt(data.unilevelMaintenance?.projectedUnilevel)}`} />
      </div>
    </div>
  );
}

// ─── Tab: Genealogy ──────────────────────────────────────────────────────────
function GenealogyTab({ uid }) {
  const [treeType, setTreeType] = useState('binary');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setData(null);
    api.get(`/admin/view-as/${uid}/genealogy?type=${treeType}`)
      .then(r => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [uid, treeType]);

  const pkgColor = (name) => PKG_COLORS[name] || '#D4AF37';

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {['binary', 'unilevel'].map(t => (
          <button
            key={t}
            onClick={() => setTreeType(t)}
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={treeType === t
              ? { background: 'rgba(212,175,55,0.2)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.4)' }
              : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)' }
            }
          >
            {t === 'binary' ? 'Binary Tree' : 'Unilevel Tree'}
          </button>
        ))}
      </div>

      {loading ? <Spinner /> : !data ? (
        <p className="text-slate-500 text-sm py-8 text-center">Failed to load genealogy.</p>
      ) : data.members.length === 0 ? (
        <div className="glass-card rounded-2xl p-8 text-center">
          <p className="text-slate-400 text-sm">No {treeType} downlines found.</p>
        </div>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400">Username</th>
                {treeType === 'binary' && <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400">Position</th>}
                {treeType === 'unilevel' && <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400">Level</th>}
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400">Package</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400">Code</th>
                {treeType === 'binary' && <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400">Pts</th>}
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400">Active</th>
              </tr>
            </thead>
            <tbody>
              {data.members.map(m => (
                <tr key={m.uid} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="px-4 py-3 font-mono text-slate-200">{m.username}</td>
                  {treeType === 'binary' && (
                    <td className="px-4 py-3">
                      <span className="text-xs font-bold" style={{ color: m.position === 'L' ? '#60a5fa' : '#f87171' }}>
                        {m.position === 'L' ? 'Left' : m.position === 'R' ? 'Right' : '—'}
                      </span>
                    </td>
                  )}
                  {treeType === 'unilevel' && (
                    <td className="px-4 py-3 text-slate-400 text-xs">L{m.level}</td>
                  )}
                  <td className="px-4 py-3">
                    <Badge color={pkgColor(m.acctTypeName)}>{m.acctTypeName}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge color={CODE_COLORS[m.codeid] || '#D4AF37'}>{CODE_LABELS[m.codeid] || m.codeid}</Badge>
                  </td>
                  {treeType === 'binary' && (
                    <td className="px-4 py-3 text-right text-slate-300">{fmtPts(m.binaryPoints)}</td>
                  )}
                  <td className="px-4 py-3 text-xs text-slate-400">{m.activedate ? m.activedate.slice(0, 10) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Transactions ───────────────────────────────────────────────────────
const INCOME_LABELS = { 1: 'Direct Referral', 2: 'Binary Pairing', 3: 'Leadership', 4: 'Unilevel', 5: 'Hi-Five', 6: 'LPC', 7: 'Encashment', 8: 'CD Deduction' };

function TransactionsTab({ uid }) {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const limit = 20;

  useEffect(() => {
    setLoading(true);
    api.get(`/admin/view-as/${uid}/transactions?page=${page}&limit=${limit}`)
      .then(r => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [uid, page]);

  const totalPages = data ? Math.ceil(data.total / limit) : 1;

  return (
    <div className="space-y-4">
      {loading ? <Spinner /> : !data ? (
        <p className="text-slate-500 text-sm py-8 text-center">Failed to load transactions.</p>
      ) : data.transactions.length === 0 ? (
        <div className="glass-card rounded-2xl p-8 text-center">
          <p className="text-slate-400 text-sm">No transactions found.</p>
        </div>
      ) : (
        <>
          <div className="glass-card rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400">Type</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400">Amount</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.transactions.map(tx => (
                  <tr key={tx.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="px-4 py-3 text-xs text-slate-400">{tx.transdate ? String(tx.transdate).slice(0, 10) : '—'}</td>
                    <td className="px-4 py-3 text-slate-300">{INCOME_LABELS[tx.incometype] || `Type ${tx.incometype}`}</td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-400">₱{fmt(tx.amount)}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full" style={
                        tx.status === 'released' || tx.status === 1
                          ? { background: 'rgba(74,222,128,0.12)', color: '#4ade80' }
                          : { background: 'rgba(251,191,36,0.12)', color: '#fbbf24' }
                      }>
                        {tx.status || 'pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">Page {page} of {totalPages} &middot; {data.total} records</p>
              <div className="flex gap-2">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-30"
                  style={{ background: 'rgba(255,255,255,0.06)', color: '#D4AF37' }}>
                  Prev
                </button>
                <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-30"
                  style={{ background: 'rgba(255,255,255,0.06)', color: '#D4AF37' }}>
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Tab: Referrals ──────────────────────────────────────────────────────────
function ReferralsTab({ uid }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/admin/view-as/${uid}/referrals`)
      .then(r => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [uid]);

  const pkgColor = (name) => PKG_COLORS[name] || '#D4AF37';

  if (loading) return <Spinner />;
  if (!data) return <p className="text-slate-500 text-sm py-8 text-center">Failed to load referrals.</p>;

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-400">{data.referrals.length} direct referral{data.referrals.length !== 1 ? 's' : ''}</p>
      {data.referrals.length === 0 ? (
        <div className="glass-card rounded-2xl p-8 text-center">
          <p className="text-slate-400 text-sm">No direct referrals yet.</p>
        </div>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400">Username</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400">Full Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400">Package</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400">Code</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400">Position</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400">Active</th>
              </tr>
            </thead>
            <tbody>
              {data.referrals.map(r => (
                <tr key={r.uid} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="px-4 py-3 font-mono text-slate-200">{r.username}</td>
                  <td className="px-4 py-3 text-slate-300 truncate max-w-[140px]">{r.fullname || '—'}</td>
                  <td className="px-4 py-3"><Badge color={pkgColor(r.acctTypeName)}>{r.acctTypeName}</Badge></td>
                  <td className="px-4 py-3"><Badge color={CODE_COLORS[r.codeid] || '#D4AF37'}>{CODE_LABELS[r.codeid] || r.codeid}</Badge></td>
                  <td className="px-4 py-3 text-xs font-bold" style={{ color: r.position === 'L' ? '#60a5fa' : '#f87171' }}>
                    {r.position === 'L' ? 'Left' : r.position === 'R' ? 'Right' : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">{r.activedate ? String(r.activedate).slice(0, 10) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: HiOutlineChartBar },
  { id: 'wallet',    label: 'Wallet',    icon: HiOutlineCurrencyDollar },
  { id: 'genealogy', label: 'Genealogy', icon: HiOutlineShare },
  { id: 'referrals', label: 'Referrals', icon: HiOutlineUsers },
  { id: 'transactions', label: 'Transactions', icon: HiOutlineDocumentText },
  { id: 'profile',   label: 'Profile',   icon: HiOutlineUser },
];

export default function ViewAsMember() {
  const { uid } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState('dashboard');
  const [header, setHeader] = useState(null);

  // Load minimal header info from search result cached in profile
  useEffect(() => {
    api.get(`/admin/view-as/${uid}/profile`)
      .then(r => setHeader({ username: r.data.username, fullname: r.data.fullname, acctTypeName: r.data.acctTypeName, codeid: r.data.codeid }))
      .catch(() => {});
  }, [uid]);

  return (
    <div>
      {/* View-As Banner */}
      <div className="flex items-center gap-2 mb-4 px-3 py-2.5 rounded-xl text-xs font-semibold"
        style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.25)', color: '#D4AF37' }}>
        <HiOutlineEye className="size-4 shrink-0" />
        <span>Read-Only View — you are viewing this account as a proxy. No changes can be made.</span>
      </div>

      {/* Header */}
      <div className="glass-card rounded-2xl p-5 mb-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="size-9 flex items-center justify-center rounded-xl hover:bg-white/10 transition-colors"
            style={{ border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <HiOutlineArrowLeft className="size-5 text-slate-300" />
          </button>
          <div>
            <p className="font-bold text-lg text-slate-100">{header?.username || `UID ${uid}`}</p>
            <p className="text-xs text-slate-400">{header?.fullname || ''}</p>
          </div>
          {header && (
            <div className="flex gap-2">
              <Badge color={PKG_COLORS[header.acctTypeName] || '#D4AF37'}>{header.acctTypeName}</Badge>
              <Badge color={CODE_COLORS[header.codeid] || '#D4AF37'}>{CODE_LABELS[header.codeid] || `Code ${header.codeid}`}</Badge>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <HiOutlineBan className="size-3.5" />
          <span>View Only</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1">
        {TABS.map(t => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all"
              style={active
                ? { background: 'rgba(212,175,55,0.18)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.35)' }
                : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.07)' }
              }
            >
              <Icon className="size-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {tab === 'dashboard'    && <DashboardTab    uid={uid} />}
      {tab === 'wallet'       && <WalletTab        uid={uid} />}
      {tab === 'genealogy'    && <GenealogyTab     uid={uid} />}
      {tab === 'referrals'    && <ReferralsTab     uid={uid} />}
      {tab === 'transactions' && <TransactionsTab  uid={uid} />}
      {tab === 'profile'      && <ProfileTab       uid={uid} />}
    </div>
  );
}
