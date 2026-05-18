import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import toast from 'react-hot-toast';
import { useTheme } from '../../contexts/ThemeContext';
import {
  HiOutlineCreditCard,
  HiOutlineBadgeCheck,
  HiOutlineClock,
  HiOutlineCash,
  HiOutlineExclamationCircle,
} from 'react-icons/hi';

const fmt = (n) =>
  Number(n || 0).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const PACKAGE_NAMES = {
  10: 'Bronze',
  20: 'Silver',
  30: 'Gold',
  40: 'Platinum',
  50: 'Garnet',
  60: 'Diamond',
};

function triggerBrowserDownload(url) {
  const link = document.createElement('a');
  link.href = url;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export default function CDAccounts() {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const [accounts, setAccounts] = useState([]);
  const [stats, setStats] = useState(null);
  const [packageBreakdown, setPackageBreakdown] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [packageType, setPackageType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const headingText = isDarkMode ? '#ffffff' : '#111827';
  const mutedText = isDarkMode ? 'rgba(255,255,255,0.4)' : '#64748b';
  const subtleText = isDarkMode ? 'rgba(255,255,255,0.35)' : '#94a3b8';
  const rowStrong = isDarkMode ? 'rgba(255,255,255,0.8)' : '#334155';
  const rowSoft = isDarkMode ? 'rgba(255,255,255,0.7)' : '#475569';
  const goldText = isDarkMode ? '#D4AF37' : '#7a5c08';
  const amberText = isDarkMode ? '#fbbf24' : '#9a6700';
  const redText = isDarkMode ? '#fca5a5' : '#b91c1c';
  const greenText = isDarkMode ? '#4ade80' : '#047857';
  const blueText = isDarkMode ? '#93c5fd' : '#1d4ed8';

  useEffect(() => {
    loadAccounts(page);
  }, [page]);

  async function loadAccounts(targetPage = page, searchTerm = search, statusValue = status, packageValue = packageType) {
    setLoading(true);
    try {
      const res = await api.get(
        `/admin/cd-accounts?page=${targetPage}&search=${encodeURIComponent(searchTerm)}&status=${encodeURIComponent(statusValue)}&packageType=${encodeURIComponent(packageValue)}`
      );
      setAccounts(res.data.accounts);
      setTotalPages(res.data.totalPages);
      setStats(res.data.stats);
      setPackageBreakdown(res.data.packageBreakdown || []);
    } catch {
      toast.error('Failed to load CD accounts');
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e) {
    e.preventDefault();
    setPage(1);
    loadAccounts(1, search, status, packageType);
  }

  async function handleExport(format = 'xlsx') {
    setExporting(true);
    try {
      const url = `/api/admin/cd-accounts/export?format=${encodeURIComponent(format)}&search=${encodeURIComponent(search)}&status=${encodeURIComponent(status)}&packageType=${encodeURIComponent(packageType)}`;
      triggerBrowserDownload(url);
    } catch {
      toast.error('Failed to export CD accounts');
    } finally {
      window.setTimeout(() => setExporting(false), 500);
    }
  }

  const PaginationBtn = ({ onClick, disabled, children }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className="text-sm py-1.5 px-3 rounded-lg font-medium motion-safe:transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
      style={{
        background: 'rgba(212,175,55,0.08)',
        color: 'rgba(212,175,55,0.8)',
        border: '1px solid rgba(212,175,55,0.15)',
      }}
    >
      {children}
    </button>
  );

  const statCards = stats
    ? [
        {
          label: 'Total CD Accounts',
          value: stats.total,
          icon: HiOutlineCreditCard,
          color: goldText,
          bg: 'rgba(212,175,55,0.10)',
          border: 'rgba(212,175,55,0.20)',
        },
        {
          label: 'Fully Paid',
          value: stats.fullyPaid,
          icon: HiOutlineBadgeCheck,
          color: greenText,
          bg: 'rgba(74,222,128,0.10)',
          border: 'rgba(74,222,128,0.20)',
        },
        {
          label: 'Still Paying',
          value: stats.stillPaying,
          icon: HiOutlineClock,
          color: amberText,
          bg: 'rgba(251,191,36,0.10)',
          border: 'rgba(251,191,36,0.20)',
        },
        {
          label: 'Total CD Amount',
          value: `PHP ${fmt(stats.totalCdAmount)}`,
          icon: HiOutlineExclamationCircle,
          color: redText,
          bg: 'rgba(248,113,113,0.10)',
          border: 'rgba(248,113,113,0.20)',
        },
        {
          label: 'Total Paid So Far',
          value: `PHP ${fmt(stats.totalPaid)}`,
          icon: HiOutlineCash,
          color: greenText,
          bg: 'rgba(52,211,153,0.10)',
          border: 'rgba(52,211,153,0.20)',
        },
        {
          label: 'CD Deductions',
          value: `PHP ${fmt(stats.totalCdDeduction)}`,
          icon: HiOutlineExclamationCircle,
          color: redText,
          bg: 'rgba(251,113,133,0.10)',
          border: 'rgba(251,113,133,0.20)',
        },
        {
          label: 'Net Encashment',
          value: `PHP ${fmt(stats.totalNetEncashment)}`,
          icon: HiOutlineCash,
          color: blueText,
          bg: 'rgba(59,130,246,0.10)',
          border: 'rgba(59,130,246,0.20)',
        },
      ]
    : [];

  return (
    <div>
      <div className="mb-7">
        <h1 className="font-display text-2xl font-bold" style={{ color: headingText }}>
          CD Account Management
        </h1>
        <div
          className="w-12 h-0.5 mt-2"
          style={{
            background: 'linear-gradient(90deg,#D4AF37,transparent)',
          }}
        />
      </div>

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-7 gap-3 mb-6">
          {statCards.map((card) => (
            <div
              key={card.label}
              className="glass-card rounded-2xl p-4"
              style={{ border: `1px solid ${card.border}` }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: card.bg }}
                >
                  <card.icon className="w-4 h-4" style={{ color: card.color }} />
                </div>
              </div>
              <p
                className="text-[10px] uppercase tracking-wider mb-1"
                style={{ color: subtleText }}
              >
                {card.label}
              </p>
              <p className="text-lg font-bold" style={{ color: card.color }}>
                {card.value}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="glass-card rounded-2xl p-4 mb-6">
        <form onSubmit={handleSearch} className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.3fr)_220px_220px_auto_auto_auto] gap-3 items-center">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="glass-input rounded-xl px-4 py-2.5 text-sm h-[46px]"
            placeholder="Type account name or username..."
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="glass-input rounded-xl px-4 py-2.5 text-sm h-[46px]"
          >
            <option value="all">All CD Status</option>
            <option value="paid">Fully Paid</option>
            <option value="unpaid">Still Paying</option>
          </select>
          <select
            value={packageType}
            onChange={(e) => setPackageType(e.target.value)}
            className="glass-input rounded-xl px-4 py-2.5 text-sm h-[46px]"
          >
            <option value="all">All Packages</option>
            {Object.entries(PACKAGE_NAMES).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <button type="submit" className="gold-btn rounded-xl py-2.5 px-5 text-sm h-[46px]">
            Search
          </button>
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setStatus('all');
              setPackageType('all');
              setPage(1);
              loadAccounts(1, '', 'all', 'all');
            }}
            className="rounded-xl py-2.5 px-5 text-sm font-medium border h-[46px]"
            style={{ borderColor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.65)' }}
          >
            Clear
          </button>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleExport('xlsx')}
              disabled={exporting}
              className="rounded-xl py-2.5 px-4 text-sm font-medium border disabled:opacity-50 h-[46px]"
              style={{ borderColor: 'rgba(59,130,246,0.22)', color: blueText, background: 'rgba(59,130,246,0.08)' }}
            >
              {exporting ? 'Exporting...' : 'Export XLSX'}
            </button>
            <button
              type="button"
              onClick={() => handleExport('pdf')}
              disabled={exporting}
              className="rounded-xl py-2.5 px-4 text-sm font-medium border disabled:opacity-50 h-[46px]"
              style={{ borderColor: 'rgba(16,185,129,0.22)', color: greenText, background: 'rgba(16,185,129,0.08)' }}
            >
              {exporting ? 'Preparing PDF...' : 'Export PDF'}
            </button>
          </div>
        </form>
      </div>

      {packageBreakdown.length > 0 && (
        <div className="glass-card rounded-2xl p-6 mb-6 overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <p
              className="text-sm font-medium"
              style={{ color: mutedText }}
            >
              CD Package Breakdown
            </p>
            <span className="text-xs" style={{ color: subtleText }}>
              {packageBreakdown.length} package rows
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  {['Package', 'Accounts', 'Fully Paid', 'Paying', 'CD Amount', 'Paid', 'Remaining', 'Net Encashment'].map((h) => (
                    <th key={h} className="table-header py-3 px-3 text-left font-semibold text-xs uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {packageBreakdown.map((row, idx) => (
                  <tr key={row.package} style={{ background: idx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                    <td className="py-3 px-3 font-medium" style={{ color: rowStrong }}>{row.package}</td>
                    <td className="py-3 px-3" style={{ color: rowSoft }}>{row.totalAccounts}</td>
                    <td className="py-3 px-3 font-medium" style={{ color: greenText }}>{row.fullyPaid}</td>
                    <td className="py-3 px-3 font-medium" style={{ color: amberText }}>{row.stillPaying}</td>
                    <td className="py-3 px-3" style={{ color: rowStrong }}>PHP {fmt(row.totalCdAmount)}</td>
                    <td className="py-3 px-3" style={{ color: rowStrong }}>PHP {fmt(row.totalPaid)}</td>
                    <td className="py-3 px-3 font-medium" style={{ color: redText }}>PHP {fmt(row.totalRemaining)}</td>
                    <td className="py-3 px-3 font-medium" style={{ color: blueText }}>PHP {fmt(row.totalNetEncashment)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="glass-card rounded-2xl p-6 overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <p
            className="text-sm font-medium"
            style={{ color: mutedText }}
          >
            CD Accounts
          </p>
          <div className="flex items-center gap-2">
            <PaginationBtn
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              Prev
            </PaginationBtn>
            <span
              className="text-sm"
              style={{ color: isDarkMode ? 'rgba(255,255,255,0.5)' : '#64748b' }}
            >
              {page} / {totalPages}
            </span>
            <PaginationBtn
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Next
            </PaginationBtn>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <div
              className="animate-spin rounded-full h-8 w-8 border-4"
              style={{
                borderColor: 'rgba(212,175,55,0.15)',
                borderTopColor: 'rgba(212,175,55,0.75)',
              }}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  {[
                    'Username',
                    'Full Name',
                    'Package',
                    'CD Amount',
                    'Paid',
                    'Remaining',
                    'Progress',
                    'CD Logs',
                    'Net Encashment',
                    'Last Deduction',
                    'Status',
                    'Date Reg',
                    'Actions',
                  ].map((h) => (
                    <th
                      key={h}
                      className="table-header py-3 px-3 text-left font-semibold text-xs uppercase tracking-wide"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {accounts.map((a, idx) => {
                  const cdAmount = Number(a.cdamount || 0);
                  const cdPaid = Number(a.cdtotal || 0);
                  const cdRemaining = Math.max(0, cdAmount - cdPaid);
                  const progressPct =
                    cdAmount > 0
                      ? Math.min(100, Math.round((cdPaid / cdAmount) * 100))
                      : 0;
                  const isFullyPaid = Boolean(a.isCdStatusPaid);
                  const packageName =
                    PACKAGE_NAMES[a.accttype] || `Type ${a.accttype}`;

                  return (
                    <tr
                      key={a.uid}
                      className="motion-safe:transition-colors"
                      style={{
                        background:
                          idx % 2 === 0
                            ? 'rgba(255,255,255,0.02)'
                            : 'transparent',
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background =
                          'rgba(212,175,55,0.05)')
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background =
                          idx % 2 === 0
                            ? 'rgba(255,255,255,0.02)'
                            : 'transparent')
                      }
                    >
                      <td className="py-3 px-3 font-mono text-sm" style={{ color: rowSoft }}>
                        {a.username}
                      </td>
                      <td className="py-3 px-3 font-medium" style={{ color: rowStrong }}>
                        {a.fullname}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                          style={{
                            background: 'rgba(212,175,55,0.12)',
                            color: goldText,
                            border: '1px solid rgba(212,175,55,0.2)',
                          }}
                        >
                          {packageName}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-medium" style={{ color: rowSoft }}>
                        PHP {fmt(cdAmount)}
                      </td>
                      <td className="py-3 px-3" style={{ color: rowSoft }}>
                        PHP {fmt(cdPaid)}
                      </td>
                      <td
                        className="py-3 px-3 font-medium"
                        style={{
                          color: isFullyPaid ? greenText : redText,
                        }}
                      >
                        PHP {fmt(cdRemaining)}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2 min-w-[120px]">
                          <div
                            className="flex-1 h-2 rounded-full overflow-hidden"
                            style={{
                              background: 'rgba(255,255,255,0.06)',
                            }}
                          >
                            <div
                              className="h-full rounded-full motion-safe:transition-all"
                              style={{
                                width: `${progressPct}%`,
                                background: isFullyPaid
                                  ? 'linear-gradient(90deg, #4ade80, #22c55e)'
                                  : progressPct >= 75
                                  ? 'linear-gradient(90deg, #fbbf24, #f59e0b)'
                                  : progressPct >= 50
                                  ? 'linear-gradient(90deg, #D4AF37, #b8962e)'
                                  : 'linear-gradient(90deg, #f87171, #ef4444)',
                              }}
                            />
                          </div>
                          <span
                            className="text-xs font-medium tabular-nums"
                            style={{
                              color: isFullyPaid
                                ? greenText
                                : (isDarkMode ? 'rgba(255,255,255,0.5)' : '#64748b'),
                              minWidth: '32px',
                              textAlign: 'right',
                            }}
                          >
                            {progressPct}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3" style={{ color: rowSoft }}>
                        {a.deductionCount} deductions / {a.encashmentCount} encashments
                      </td>
                      <td className="py-3 px-3 font-medium" style={{ color: blueText }}>
                        PHP {fmt(a.netEncashment)}
                      </td>
                      <td className="py-3 px-3 text-xs" style={{ color: isDarkMode ? 'rgba(255,255,255,0.5)' : '#64748b' }}>
                        {a.lastDeductionDate || '-'}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
                          style={
                            isFullyPaid
                              ? {
                                  background: 'rgba(74,222,128,0.12)',
                                  color: greenText,
                                  border: '1px solid rgba(74,222,128,0.22)',
                                }
                              : {
                                  background: 'rgba(251,191,36,0.12)',
                                  color: amberText,
                                  border: '1px solid rgba(251,191,36,0.22)',
                                }
                          }
                        >
                          {a.cdstatusLabel || (isFullyPaid ? 'CD - Paid' : 'Paying')}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-xs" style={{ color: mutedText }}>
                        {a.datereg}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex gap-1.5 flex-wrap">
                          <button
                            onClick={() =>
                              navigate(`/admin/accounts/${a.uid}/cd`)
                            }
                            className="text-xs px-2.5 py-1 rounded-lg font-medium motion-safe:transition-colors cursor-pointer"
                            style={{
                              background: 'rgba(212,175,55,0.12)',
                              color: goldText,
                              border: '1px solid rgba(212,175,55,0.2)',
                            }}
                          >
                            Details
                          </button>
                          <button
                            onClick={() =>
                              navigate(`/admin/accounts/${a.uid}`)
                            }
                            className="text-xs px-2.5 py-1 rounded-lg font-medium motion-safe:transition-colors cursor-pointer"
                            style={{
                              background: 'rgba(59,130,246,0.1)',
                              color: blueText,
                              border: '1px solid rgba(59,130,246,0.25)',
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() =>
                              navigate(`/admin/genealogy?id=${a.uid}`)
                            }
                            className="text-xs px-2.5 py-1 rounded-lg font-medium motion-safe:transition-colors cursor-pointer"
                            style={{
                              background: 'rgba(16,185,129,0.1)',
                              color: greenText,
                              border: '1px solid rgba(16,185,129,0.2)',
                            }}
                          >
                            Tree
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {accounts.length === 0 && (
                  <tr>
                    <td
                      colSpan="13"
                      className="py-12 text-center"
                      style={{ color: 'rgba(255,255,255,0.25)' }}
                    >
                      No CD accounts found.
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
