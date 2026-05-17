import { useEffect, useState } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';

const fmtMoney = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtInt = (n) => Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 0 });

function lastClosedYear() {
  return new Date().getFullYear() - 1;
}

export default function GlobalBonus() {
  const [year, setYear] = useState(lastClosedYear());
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [data, setData] = useState(null);

  useEffect(() => {
    loadReport(year, page);
  }, [page]);

  async function loadReport(targetYear = year, targetPage = page) {
    setLoading(true);
    try {
      const res = await api.get(`/admin/global-bonus?year=${targetYear}&page=${targetPage}`);
      setData(res.data);
    } catch (error) {
      setData(null);
      toast.error(error.response?.data?.error || 'Failed to load annual global bonus');
    } finally {
      setLoading(false);
    }
  }

  async function loadLatest() {
    try {
      const res = await api.get('/admin/global-bonus/latest');
      if (!res.data?.latest) {
        toast('No annual global bonus has been distributed yet');
        return;
      }
      const latest = res.data.latest;
      setYear(latest.year);
      setPage(1);
      await loadReport(latest.year, 1);
      toast.success('Loaded latest distributed annual global bonus');
    } catch {
      toast.error('Failed to load latest annual distribution');
    }
  }

  async function distribute() {
    setProcessing(true);
    try {
      const res = await api.post('/admin/global-bonus/distribute', { year });
      toast.success(res.data?.message || 'Annual distribution completed');
      await loadReport(year, page);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Annual distribution failed');
    } finally {
      setProcessing(false);
    }
  }

  const pool = data?.pool;
  const preview = data?.preview;
  const recipients = data?.distributedRecipients || [];
  const totalPages = Math.max(1, Number(data?.totalPages || 1));
  const canDistribute = year < new Date().getFullYear();
  const blockedReason = !canDistribute ? 'Only fully completed years can be distributed.' : (preview?.blockedReason || '');

  return (
    <div>
      <div className="mb-7">
        <h1 className="font-display text-2xl font-bold text-white">Global Bonus</h1>
        <div className="w-12 h-0.5 mt-2" style={{ background: 'linear-gradient(90deg,#D4AF37,transparent)' }} />
      </div>

      <div className="glass-card rounded-2xl p-6 mb-6">
        <div className="flex flex-col xl:flex-row xl:items-end gap-3">
          <div className="xl:min-w-[280px]">
            <label className="label">Completed Year</label>
            <input
              type="number"
              min="2000"
              value={year}
              onChange={(event) => setYear(Number(event.target.value || lastClosedYear()))}
              className="glass-input rounded-xl px-4 py-2.5 text-sm mt-1.5 w-[160px]"
            />
            <p className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
              The PPT rule is annual. The current year cannot be distributed until the year is complete.
            </p>
          </div>
          <button onClick={() => { setPage(1); loadReport(year, 1); }} className="gold-btn rounded-xl py-2.5 px-5 text-sm">
            Load Annual Report
          </button>
          <button
            onClick={loadLatest}
            className="rounded-xl py-2.5 px-5 text-sm font-medium border"
            style={{ borderColor: 'rgba(59,130,246,0.35)', color: '#93c5fd', background: 'rgba(59,130,246,0.1)' }}
          >
            Latest Distributed
          </button>
          <button
            onClick={distribute}
            disabled={processing || !canDistribute}
            className="btn-success rounded-xl py-2.5 px-5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? 'Distributing...' : 'Distribute Annual Pool'}
          </button>
        </div>

        {blockedReason && (
          <div className="mt-4 rounded-xl px-4 py-3 text-sm" style={{ background: 'rgba(245,158,11,0.10)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.2)' }}>
            {blockedReason}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <div className="glass-card rounded-2xl p-5">
          <p className="text-xs uppercase" style={{ color: 'rgba(212,175,55,0.5)' }}>Annual Net Sales</p>
          <p className="text-2xl font-bold text-white mt-1">P{fmtMoney(pool?.totalNetSales ?? preview?.totalNetSales)}</p>
        </div>
        <div className="glass-card rounded-2xl p-5">
          <p className="text-xs uppercase" style={{ color: 'rgba(212,175,55,0.5)' }}>Bonus Pool (2%)</p>
          <p className="text-2xl font-bold text-white mt-1">P{fmtMoney(pool?.bonusPool ?? preview?.bonusPool)}</p>
        </div>
        <div className="glass-card rounded-2xl p-5">
          <p className="text-xs uppercase" style={{ color: 'rgba(212,175,55,0.5)' }}>Total Portions</p>
          <p className="text-2xl font-bold text-white mt-1">{fmtInt(pool?.totalPortions ?? preview?.totalPortions)}</p>
        </div>
        <div className="glass-card rounded-2xl p-5">
          <p className="text-xs uppercase" style={{ color: 'rgba(212,175,55,0.5)' }}>Per Portion Value</p>
          <p className="text-2xl font-bold text-white mt-1">P{fmtMoney(pool?.perPortionValue ?? preview?.perPortionValue)}</p>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6 overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Distributed recipients for Year {year}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              disabled={page <= 1}
              className="text-sm py-1.5 px-3 rounded-lg font-medium disabled:opacity-40"
              style={{ background: 'rgba(212,175,55,0.08)', color: 'rgba(212,175,55,0.85)', border: '1px solid rgba(212,175,55,0.15)' }}
            >
              Prev
            </button>
            <span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{page} / {totalPages}</span>
            <button
              onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
              disabled={page >= totalPages}
              className="text-sm py-1.5 px-3 rounded-lg font-medium disabled:opacity-40"
              style={{ background: 'rgba(212,175,55,0.08)', color: 'rgba(212,175,55,0.85)', border: '1px solid rgba(212,175,55,0.15)' }}
            >
              Next
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-4" style={{ borderColor: 'rgba(212,175,55,0.15)', borderTopColor: 'rgba(212,175,55,0.75)' }} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  {['Member', 'Username', 'Member Type', 'Portions', 'Share Amount', 'Distributed Date'].map((header) => (
                    <th key={header} className="table-header py-3 px-3 text-left text-xs uppercase tracking-wide">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recipients.map((recipient, index) => (
                  <tr
                    key={`${recipient.uid}-${index}`}
                    style={{ background: index % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}
                    className="motion-safe:transition-colors hover:bg-white/[0.04]"
                  >
                    <td className="py-3 px-3 font-medium text-white/85">{recipient.fullname || `UID ${recipient.uid}`}</td>
                    <td className="py-3 px-3 text-white/60">{recipient.username || '-'}</td>
                    <td className="py-3 px-3 text-white/70">{recipient.memberType || 'Qualified'}</td>
                    <td className="py-3 px-3 text-white/70">{fmtInt(recipient.portions)}</td>
                    <td className="py-3 px-3 font-semibold" style={{ color: '#D4AF37' }}>P{fmtMoney(recipient.shareAmount)}</td>
                    <td className="py-3 px-3 text-xs text-white/45">{recipient.distributedDate || '-'}</td>
                  </tr>
                ))}

                {recipients.length === 0 && (
                  <tr>
                    <td colSpan="6" className="py-12 text-center" style={{ color: 'rgba(255,255,255,0.25)' }}>
                      No distributed annual records for this year yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
