import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import toast from 'react-hot-toast';
import { PaginationButton } from '../../components/PaginationButton';
import html2canvas from 'html2canvas';
import { useTheme } from '../../contexts/ThemeContext';
import { apiUrl } from '../../utils/apiBase';

const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function triggerBrowserDownload(url) {
  const link = document.createElement('a');
  link.href = url;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export default function Encashment() {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [keyword, setKeyword] = useState('');
  const [exporting, setExporting] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [activeDetails, setActiveDetails] = useState(null);
  const [dailyExpanded, setDailyExpanded] = useState(false);
  const [dailyPage, setDailyPage] = useState(1);
  const receiptRef = useRef(null);
  const textStrong = isDarkMode ? 'rgba(255,255,255,0.8)' : '#334155';
  const textSoft = isDarkMode ? 'rgba(255,255,255,0.7)' : '#475569';
  const goldText = isDarkMode ? '#D4AF37' : '#7a5c08';
  const amberText = isDarkMode ? '#fbbf24' : '#9a6700';
  const redText = isDarkMode ? '#fda4af' : '#b91c1c';
  const greenText = isDarkMode ? '#34d399' : '#047857';

  useEffect(() => { loadData(page); }, [page]);

  async function loadData(targetPage = page, nextFilters = {}) {
    setLoading(true);
    try {
      const activeStart = nextFilters.startDate ?? startDate;
      const activeEnd = nextFilters.endDate ?? endDate;
      const activeKeyword = nextFilters.keyword ?? keyword;

      let url = `/admin/encashment?page=${targetPage}`;
      if (activeStart) url += `&startDate=${activeStart}`;
      if (activeEnd) url += `&endDate=${activeEnd}`;
      if (activeKeyword.trim()) url += `&q=${encodeURIComponent(activeKeyword.trim())}`;
      const res = await api.get(url);
      setRecords(res.data.records);
      setTotalPages(res.data.totalPages);
      setSummary(res.data.summary || null);
      setDailyPage(1);
    } catch { } finally { setLoading(false); }
  }

  async function handleExport(format = 'csv') {
    setExporting(true);
    try {
      let url = `/admin/encashment/export?format=${format}`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;
      if (keyword.trim()) url += `&q=${encodeURIComponent(keyword.trim())}`;
      triggerBrowserDownload(apiUrl(url));
    } catch {
      toast.error('Failed to export encashment report');
    } finally {
      window.setTimeout(() => setExporting(false), 500);
    }
  }

  async function handleProcess(record) {
    const fullname = record?.fullname || `UID ${record?.uid || 'unknown'}`;
    const amount = fmt(record?.encashment);
    const confirmed = window.confirm(
      `Mark PHP ${amount} as paid for ${fullname}? This cannot be undone.`
    );
    if (!confirmed) {
      return false;
    }

    try {
      await api.put(`/admin/encashment/${record.pid}/process`, { uid: record.uid });
      toast.success('Encashment marked as processed');
      loadData();
      return true;
    } catch (err) {
      toast.error('Failed to process');
      return false;
    }
  }

  async function openDetails(record) {
    setDetailsLoading(true);
    try {
      const res = await api.get(`/admin/encashment/${record.pid}/details?uid=${record.uid}`);
      setActiveDetails(res.data);
    } catch {
      toast.error('Failed to load encashment details');
    } finally {
      setDetailsLoading(false);
    }
  }

  async function handleDownloadDetails() {
    if (!receiptRef.current) return;

    const canvas = await html2canvas(receiptRef.current, {
      backgroundColor: '#141008',
      scale: 2,
      useCORS: true,
    });

    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `admin-encashment-${activeDetails?.pid || 'nogatu'}.png`;
    link.click();
  }

  const dailyPerPage = dailyExpanded ? 100 : 30;
  const dailyRows = summary?.daily || [];
  const dailyTotalPages = Math.max(1, Math.ceil(dailyRows.length / dailyPerPage));
  const visibleDailyRows = dailyRows.slice((dailyPage - 1) * dailyPerPage, dailyPage * dailyPerPage);

  return (
    <div>
      <div className="mb-7">
        <h1 className="font-display text-2xl font-bold text-white">Encashment Management</h1>
        <div className="w-12 h-0.5 mt-2" style={{ background: 'linear-gradient(90deg,#D4AF37,transparent)' }} />
      </div>

      {/* Filter */}
      <div className="glass-card rounded-2xl p-4 sm:p-6 mb-6 relative overflow-hidden">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="label">Account Search</label>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Username or account name"
              className="glass-input w-full rounded-xl px-4 py-2.5 text-sm mt-1.5"
            />
          </div>
          <div>
            <label className="label">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="glass-input w-full rounded-xl px-4 py-2.5 text-sm mt-1.5"
            />
          </div>
          <div>
            <label className="label">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="glass-input w-full rounded-xl px-4 py-2.5 text-sm mt-1.5"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2.5 mt-4 pt-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.12)' }}>
          <button
            onClick={() => {
              setPage(1);
              loadData(1);
            }}
            className="gold-btn rounded-xl py-2.5 px-5 text-sm flex-1 sm:flex-initial text-center justify-center items-center"
           type="button">
            Filter
          </button>
          <button
            onClick={() => {
              setKeyword('');
              setStartDate('');
              setEndDate('');
              setPage(1);
              setTimeout(() => loadData(1, { keyword: '', startDate: '', endDate: '' }), 0);
            }}
            className="rounded-xl py-2.5 px-5 text-sm font-medium border flex-1 sm:flex-initial text-center justify-center items-center"
            style={{ borderColor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.65)', background: 'rgba(255,255,255,0.05)' }}
           type="button">
            Clear
          </button>
          <button
            onClick={() => handleExport('csv')}
            disabled={exporting}
            className="rounded-xl py-2.5 px-5 text-sm font-medium border disabled:opacity-50 flex-1 sm:flex-initial text-center justify-center items-center"
            style={{ borderColor: 'rgba(59,130,246,0.22)', color: '#93c5fd', background: 'rgba(59,130,246,0.08)' }}
           type="button">
            {exporting ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>
      </div>

      {summary?.overview && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Net Receivable', value: `PHP ${fmt(summary.overview.netReceivable)}`, color: '#D4AF37' },
            { label: 'Gross Encashment', value: `PHP ${fmt(summary.overview.grossEncashment)}`, color: '#fbbf24' },
            { label: 'Total Deductions', value: `PHP ${fmt(summary.overview.totalDeductions)}`, color: '#f87171' },
            { label: 'CD Deductions', value: `PHP ${fmt(summary.overview.totalCdDeduction)}`, color: '#fb7185' },
            { label: 'Paid Requests', value: summary.overview.paidCount, color: '#34d399' },
            { label: 'Pending Requests', value: summary.overview.pendingCount, color: '#f59e0b' },
            { label: 'Members Covered', value: summary.overview.uniqueMembers, color: '#93c5fd' },
            { label: 'Total Records', value: summary.overview.totalRecords, color: '#c4b5fd' },
          ].map((card) => (
            <div key={card.label} className="glass-card rounded-2xl p-4" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
              <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>{card.label}</p>
              <p className="text-lg font-bold" style={{ color: card.color }}>{card.value}</p>
            </div>
          ))}
        </div>
      )}

      {summary?.daily?.length > 0 && (
        <div className="glass-card rounded-2xl p-4 sm:p-6 mb-6 overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>Daily Encashment Totals</p>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  setDailyExpanded((current) => !current);
                  setDailyPage(1);
                }}
                className="rounded-xl px-4 py-2 text-xs font-semibold border flex-1 sm:flex-initial text-center"
                style={{ background: 'rgba(212,175,55,0.1)', color: goldText, border: '1px solid rgba(212,175,55,0.2)' }}
              >
                {dailyExpanded ? 'Retract to 30 Rows' : 'Expand to 100 Rows'}
              </button>
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{summary.daily.length} day rows</span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Showing {visibleDailyRows.length} rows per page ({dailyPerPage} max)
            </span>
            <div className="flex items-center gap-2 justify-end w-full sm:w-auto">
              <PaginationButton style={{ background: 'rgba(212,175,55,0.08)', color: 'rgba(212,175,55,0.8)', border: '1px solid rgba(212,175,55,0.15)' }} onClick={() => setDailyPage((p) => Math.max(1, p - 1))} disabled={dailyPage <= 1}>Prev</PaginationButton>
              <span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{dailyPage} / {dailyTotalPages}</span>
              <PaginationButton style={{ background: 'rgba(212,175,55,0.08)', color: 'rgba(212,175,55,0.8)', border: '1px solid rgba(212,175,55,0.15)' }} onClick={() => setDailyPage((p) => Math.min(dailyTotalPages, p + 1))} disabled={dailyPage >= dailyTotalPages}>Next</PaginationButton>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  {['Date', 'Requests', 'Members', 'Gross', 'Net', 'Deductions', 'CD', 'Paid', 'Pending'].map((h) => (
                    <th key={h} className="table-header p-3 text-left font-semibold text-xs uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleDailyRows.map((row, idx) => (
                  <tr key={row.date} style={{ background: idx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                    <td className="p-3 font-medium" style={{ color: textStrong }}>{row.date}</td>
                    <td className="p-3" style={{ color: textSoft }}>{row.totalRecords}</td>
                    <td className="p-3" style={{ color: textSoft }}>{row.uniqueMembers}</td>
                    <td className="p-3" style={{ color: textStrong }}>PHP {fmt(row.grossEncashment)}</td>
                    <td className="p-3 font-medium" style={{ color: goldText }}>PHP {fmt(row.netReceivable)}</td>
                    <td className="p-3 font-medium" style={{ color: redText }}>PHP {fmt(row.totalDeductions)}</td>
                    <td className="p-3 font-medium" style={{ color: amberText }}>PHP {fmt(row.totalCdDeduction)}</td>
                    <td className="p-3 font-medium" style={{ color: greenText }}>{row.paidCount}</td>
                    <td className="p-3 font-medium" style={{ color: amberText }}>{row.pendingCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <PaginationButton style={{ background: 'rgba(212,175,55,0.08)', color: 'rgba(212,175,55,0.8)', border: '1px solid rgba(212,175,55,0.15)' }} onClick={() => setDailyPage((p) => Math.max(1, p - 1))} disabled={dailyPage <= 1}>Prev</PaginationButton>
              <span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{dailyPage} / {dailyTotalPages}</span>
              <PaginationButton style={{ background: 'rgba(212,175,55,0.08)', color: 'rgba(212,175,55,0.8)', border: '1px solid rgba(212,175,55,0.15)' }} onClick={() => setDailyPage((p) => Math.min(dailyTotalPages, p + 1))} disabled={dailyPage >= dailyTotalPages}>Next</PaginationButton>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="glass-card rounded-2xl p-4 sm:p-6 overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>Encashment Records</p>
          <div className="flex items-center gap-2 justify-end w-full sm:w-auto">
            <PaginationButton style={{ background: 'rgba(212,175,55,0.08)', color: 'rgba(212,175,55,0.8)', border: '1px solid rgba(212,175,55,0.15)' }} onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>Prev</PaginationButton>
            <span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{page} / {totalPages}</span>
            <PaginationButton style={{ background: 'rgba(212,175,55,0.08)', color: 'rgba(212,175,55,0.8)', border: '1px solid rgba(212,175,55,0.15)' }} onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Next</PaginationButton>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <div
              className="animate-spin rounded-full size-8 border-4"
              style={{ borderColor: 'rgba(212,175,55,0.15)', borderTopColor: 'rgba(212,175,55,0.75)' }}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  {['Name', 'Username', 'Date', 'Amount', 'Deductions', 'Income Details', 'Payout Details', 'Status', 'Actions'].map(h => (
                    <th key={h} className="table-header p-3 text-left font-semibold text-xs uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.map((r, idx) => (
                  <tr
                    key={r.pid}
                    className="motion-safe:transition-colors"
                    style={{ background: idx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(212,175,55,0.05)'}
                    onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent'}
                  >
                    <td className="p-3 font-medium text-white/80">{r.fullname}</td>
                    <td className="p-3 text-white/60">{r.username}</td>
                    <td className="p-3 text-xs text-white/40">{r.cashtransdate || '-'}</td>
                    <td className="p-3 text-white/80 font-medium">&#8369;{fmt(r.encashment)}</td>
                    <td className="p-3 text-white/60">&#8369;{fmt(r.deductions)}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          onClick={() => navigate(`/admin/accounts/${r.uid}/income`)}
                          className="text-[11px] px-2.5 py-1 rounded-lg font-medium cursor-pointer motion-safe:transition-colors"
                          style={{ background: 'rgba(59,130,246,0.12)', color: '#93c5fd', border: '1px solid rgba(59,130,246,0.2)' }}
                         type="button">
                          View Details
                        </button>
                        <button
                          onClick={() => openDetails(r)}
                          className="text-[11px] px-2.5 py-1 rounded-lg font-medium cursor-pointer motion-safe:transition-colors"
                          style={{ background: 'rgba(212,175,55,0.12)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.2)' }}
                         type="button">
                          Encashment Slip
                        </button>
                        {r.canViewCdDetails && (
                          <button
                            onClick={() => navigate(`/admin/accounts/${r.uid}/cd`)}
                            className="text-[11px] px-2.5 py-1 rounded-lg font-medium cursor-pointer motion-safe:transition-colors"
                            style={{ background: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.2)' }}
                           type="button">
                            CD Details
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-white/60">{r.payoutDetails || 'N/A'}</td>
                    <td className="p-3">
                      <span
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
                        style={
                          Number(r.cashStatus) === 1
                            ? { background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.22)' }
                            : { background: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.22)' }
                        }
                      >
                        {r.cashStatusLabel}
                      </span>
                    </td>
                    <td className="p-3">
                      {Number(r.cashStatus) !== 1 && (
                        <button
                          onClick={() => handleProcess(r)}
                          className="text-xs px-2.5 py-1 rounded-lg font-medium cursor-pointer motion-safe:transition-colors"
                          style={{ background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)' }}
                         type="button">
                          Set As Paid
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {records.length === 0 && (
                  <tr>
                    <td colSpan="9" className="py-12 text-center" style={{ color: 'rgba(255,255,255,0.25)' }}>
                      No records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <div className="flex items-center justify-end mt-4 gap-2">
              <PaginationButton style={{ background: 'rgba(212,175,55,0.08)', color: 'rgba(212,175,55,0.8)', border: '1px solid rgba(212,175,55,0.15)' }} onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>Prev</PaginationButton>
              <span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{page} / {totalPages}</span>
              <PaginationButton style={{ background: 'rgba(212,175,55,0.08)', color: 'rgba(212,175,55,0.8)', border: '1px solid rgba(212,175,55,0.15)' }} onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Next</PaginationButton>
            </div>
          </div>
        )}
      </div>

      {(detailsLoading || activeDetails) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div
            className="w-full max-w-2xl rounded-2xl p-7 shadow-2xl"
            style={{
              background: 'var(--surface-1)',
              border: '1px solid var(--surface-border)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.35)',
            }}
          >
            {detailsLoading ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full size-8 border-4" style={{ borderColor: 'rgba(212,175,55,0.15)', borderTopColor: 'rgba(212,175,55,0.75)' }} />
              </div>
            ) : (
              <>
                <div ref={receiptRef}>
                  <div
                    className="rounded-2xl p-4 mb-4"
                    style={{
                      background: 'linear-gradient(135deg, rgba(212,175,55,0.14), rgba(212,175,55,0.04))',
                      border: '1px solid rgba(212,175,55,0.22)',
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="font-display text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Encashment Details</h2>
                        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Ref #{activeDetails?.pid}</p>
                      </div>
                      <span
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
                        style={
                          Number(activeDetails?.status) === 1
                            ? { background: 'rgba(16,185,129,0.12)', color: '#059669', border: '1px solid rgba(16,185,129,0.25)' }
                            : { background: 'rgba(245,158,11,0.12)', color: '#d97706', border: '1px solid rgba(245,158,11,0.25)' }
                        }
                      >
                        {activeDetails?.statusLabel}
                      </span>
                    </div>
                    <div className="w-14 h-0.5 mt-3" style={{ background: 'linear-gradient(90deg,#D4AF37,transparent)' }} />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                    <p><strong>Member:</strong> {activeDetails?.fullname} ({activeDetails?.username})</p>
                    <p><strong>Package:</strong> {activeDetails?.packageType}</p>
                    <p><strong>Date:</strong> {activeDetails?.transdate || activeDetails?.cashtransdate || '-'}</p>
                    <p><strong>Payment:</strong> {activeDetails?.paymentOption || 'N/A'}{activeDetails?.paymentDetails ? ` / ${activeDetails.paymentDetails}` : ''}</p>
                  </div>

                  <div className="rounded-xl p-3 mb-4" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.18)' }}>
                    <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>Balance Window</p>
                    <div className="grid grid-cols-2 gap-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      <p><strong>Beginning Balance:</strong> ₱{fmt(activeDetails?.beginningBalance)}</p>
                      <p><strong>Ending Balance:</strong> ₱{fmt(activeDetails?.endingBalance)}</p>
                    </div>
                  </div>

                  <div className="mt-4 text-sm space-y-1 rounded-xl p-3" style={{ color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(148,163,184,0.2)' }}>
                    <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Income Breakdown</p>
                    <p>Direct Referral: ₱{fmt(activeDetails?.income?.directReferral)}</p>
                    <p>Pairing: ₱{fmt(activeDetails?.income?.pairing)}</p>
                    <p>Leadership: ₱{fmt(activeDetails?.income?.leadership)}</p>
                    <p>Hi-Five: ₱{fmt(activeDetails?.income?.hifive)}</p>
                    <p>Ranking Bonus: ₱{fmt(activeDetails?.income?.rankingBonus)}</p>
                  </div>

                  <div className="mt-4 text-sm space-y-1 rounded-xl p-3" style={{ color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(148,163,184,0.2)' }}>
                    <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Encashment Deductions</p>
                    <p>Gross Encashment: ₱{fmt(activeDetails?.grossEncashment)}</p>
                    <p>Tax (10%): -₱{fmt(activeDetails?.deductions?.tax)}</p>
                    <p>Fee: -₱{fmt(activeDetails?.deductions?.fee)}</p>
                    <p>CD Deduction: -₱{fmt(activeDetails?.deductions?.cdDeduction)}</p>
                    <p className="pt-1 border-t" style={{ borderColor: 'rgba(212,175,55,0.2)', color: '#D4AF37', fontWeight: 700 }}>
                      Net Receivable: ₱{fmt(activeDetails?.netReceivable)}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
                  <button
                    onClick={() => navigate(`/admin/accounts/${activeDetails?.uid}/income`)}
                    className="text-xs px-3 py-2 rounded-lg font-medium"
                    style={{ background: 'rgba(59,130,246,0.12)', color: '#93c5fd', border: '1px solid rgba(59,130,246,0.2)' }}
                   type="button">
                    View Income Details
                  </button>
                  {Number(activeDetails?.deductions?.cdDeduction || 0) > 0 && (
                    <button
                      onClick={() => navigate(`/admin/accounts/${activeDetails?.uid}/cd`)}
                      className="text-xs px-3 py-2 rounded-lg font-medium"
                      style={{ background: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.2)' }}
                     type="button">
                      CD Details
                    </button>
                  )}
                  {Number(activeDetails?.status) !== 1 && (
                    <button
                      onClick={async () => {
                        const ok = await handleProcess({
                          pid: activeDetails.pid,
                          uid: activeDetails.uid,
                          fullname: activeDetails.fullname,
                          encashment: activeDetails.netReceivable,
                        });
                        if (ok) {
                          setActiveDetails({ ...activeDetails, status: 1, statusLabel: 'Paid' });
                        }
                      }}
                      className="text-xs px-3 py-2 rounded-lg font-medium"
                      style={{ background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)' }}
                     type="button">
                      Set As Paid
                    </button>
                  )}
                  <button
                    onClick={handleDownloadDetails}
                    className="text-xs px-3 py-2 rounded-lg font-medium"
                    style={{ background: 'rgba(212,175,55,0.12)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.2)' }}
                   type="button">
                    Download PNG
                  </button>
                  <button
                    onClick={() => setActiveDetails(null)}
                    className="text-xs px-3 py-2 rounded-lg font-medium"
                    style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.12)' }}
                   type="button">
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
