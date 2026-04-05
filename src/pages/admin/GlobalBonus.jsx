import { useEffect, useState } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';

const fmtMoney = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtInt = (n) => Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 0 });

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function currentPeriod() {
  const d = new Date();
  return { month: d.getMonth() + 1, year: d.getFullYear() };
}

export default function GlobalBonus() {
  const now = currentPeriod();
  const [month, setMonth] = useState(now.month);
  const [year, setYear] = useState(now.year);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [data, setData] = useState(null);

  useEffect(() => {
    loadReport();
  }, [page]);

  async function loadReport(customMonth = month, customYear = year) {
    setLoading(true);
    try {
      const res = await api.get(`/admin/global-bonus?month=${customMonth}&year=${customYear}&page=${page}`);
      setData(res.data);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  async function loadLatest() {
    try {
      const res = await api.get('/admin/global-bonus/latest');
      if (!res.data?.latest) {
        toast('No distributed period yet');
        return;
      }
      const latest = res.data.latest;
      setMonth(latest.month);
      setYear(latest.year);
      setPage(1);
      await loadReport(latest.month, latest.year);
      toast.success('Loaded latest distributed period');
    } catch {
      toast.error('Failed to load latest period');
    }
  }

  async function distribute() {
    setProcessing(true);
    try {
      const res = await api.post('/admin/global-bonus/distribute', { month, year });
      toast.success(res.data?.message || 'Distribution completed');
      await loadReport(month, year);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Distribution failed');
    } finally {
      setProcessing(false);
    }
  }

  const pool = data?.pool;
  const preview = data?.preview;
  const recipients = data?.distributedRecipients || [];
  const totalPages = Math.max(1, Number(data?.totalPages || 1));

  return (
    <div>
      <div className="mb-7">
        <h1 className="font-display text-2xl font-bold text-white">Global Bonus</h1>
        <div className="w-12 h-0.5 mt-2" style={{ background: 'linear-gradient(90deg,#D4AF37,transparent)' }} />
      </div>

      <div className="glass-card rounded-2xl p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-end gap-3">
          <div>
            <label className="label">Month</label>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="glass-input rounded-xl px-4 py-2.5 text-sm mt-1.5"
            >
              {MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Year</label>
            <input
              type="number"
              min="2000"
              value={year}
              onChange={(e) => setYear(Number(e.target.value || now.year))}
              className="glass-input rounded-xl px-4 py-2.5 text-sm mt-1.5 w-[140px]"
            />
          </div>
          <button
            onClick={() => { setPage(1); loadReport(month, year); }}
            className="gold-btn rounded-xl py-2.5 px-5 text-sm"
          >
            Load Period
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
            disabled={processing}
            className="btn-success rounded-xl py-2.5 px-5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? 'Distributing...' : 'Distribute This Period'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <div className="glass-card rounded-2xl p-5">
          <p className="text-xs uppercase" style={{ color: 'rgba(212,175,55,0.5)' }}>Total Net Sales</p>
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
            Distributed recipients for {MONTHS[Math.max(0, month - 1)]} {year}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="text-sm py-1.5 px-3 rounded-lg font-medium disabled:opacity-40"
              style={{ background: 'rgba(212,175,55,0.08)', color: 'rgba(212,175,55,0.85)', border: '1px solid rgba(212,175,55,0.15)' }}
            >
              Prev
            </button>
            <span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{page} / {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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
            <div
              className="animate-spin rounded-full h-8 w-8 border-4"
              style={{ borderColor: 'rgba(212,175,55,0.15)', borderTopColor: 'rgba(212,175,55,0.75)' }}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  {['Member', 'Username', 'Member Type', 'Portions', 'Share Amount', 'Distributed Date'].map((h) => (
                    <th key={h} className="table-header py-3 px-3 text-left text-xs uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recipients.map((r, idx) => (
                  <tr
                    key={`${r.uid}-${idx}`}
                    style={{ background: idx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}
                    className="motion-safe:transition-colors hover:bg-white/[0.04]"
                  >
                    <td className="py-3 px-3 font-medium text-white/85">{r.fullname || `UID ${r.uid}`}</td>
                    <td className="py-3 px-3 text-white/60">{r.username || '—'}</td>
                    <td className="py-3 px-3 text-white/70">{r.memberType || 'Qualified'}</td>
                    <td className="py-3 px-3 text-white/70">{fmtInt(r.portions)}</td>
                    <td className="py-3 px-3 font-semibold" style={{ color: '#D4AF37' }}>P{fmtMoney(r.shareAmount)}</td>
                    <td className="py-3 px-3 text-xs text-white/45">{r.distributedDate || '—'}</td>
                  </tr>
                ))}

                {recipients.length === 0 && (
                  <tr>
                    <td colSpan="6" className="py-12 text-center" style={{ color: 'rgba(255,255,255,0.25)' }}>
                      No distributed records for this period yet.
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
