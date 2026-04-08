import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
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

export default function CDAccounts() {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [stats, setStats] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAccounts();
  }, [page]);

  async function loadAccounts(searchTerm) {
    setLoading(true);
    try {
      const q = searchTerm !== undefined ? searchTerm : search;
      const res = await api.get(
        `/admin/cd-accounts?page=${page}&search=${encodeURIComponent(q)}`
      );
      setAccounts(res.data.accounts);
      setTotalPages(res.data.totalPages);
      setStats(res.data.stats);
    } catch {
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e) {
    e.preventDefault();
    setPage(1);
    loadAccounts(search);
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
          color: '#D4AF37',
          bg: 'rgba(212,175,55,0.10)',
          border: 'rgba(212,175,55,0.20)',
        },
        {
          label: 'Fully Paid',
          value: stats.fullyPaid,
          icon: HiOutlineBadgeCheck,
          color: '#4ade80',
          bg: 'rgba(74,222,128,0.10)',
          border: 'rgba(74,222,128,0.20)',
        },
        {
          label: 'Still Paying',
          value: stats.stillPaying,
          icon: HiOutlineClock,
          color: '#fbbf24',
          bg: 'rgba(251,191,36,0.10)',
          border: 'rgba(251,191,36,0.20)',
        },
        {
          label: 'Total CD Amount',
          value: `₱${fmt(stats.totalCdAmount)}`,
          icon: HiOutlineExclamationCircle,
          color: '#f87171',
          bg: 'rgba(248,113,113,0.10)',
          border: 'rgba(248,113,113,0.20)',
        },
        {
          label: 'Total Paid So Far',
          value: `₱${fmt(stats.totalPaid)}`,
          icon: HiOutlineCash,
          color: '#34d399',
          bg: 'rgba(52,211,153,0.10)',
          border: 'rgba(52,211,153,0.20)',
        },
      ]
    : [];

  return (
    <div>
      {/* Header */}
      <div className="mb-7">
        <h1 className="font-display text-2xl font-bold text-white">
          CD Account Management
        </h1>
        <div
          className="w-12 h-0.5 mt-2"
          style={{
            background: 'linear-gradient(90deg,#D4AF37,transparent)',
          }}
        />
      </div>

      {/* Summary Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
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
                style={{ color: 'rgba(255,255,255,0.35)' }}
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

      {/* Search */}
      <div className="glass-card rounded-2xl p-6 mb-6">
        <form onSubmit={handleSearch} className="flex gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="glass-input flex-1 rounded-xl px-4 py-2.5 text-sm"
            placeholder="Search by username..."
          />
          <button type="submit" className="gold-btn rounded-xl py-2.5 px-5 text-sm">
            Search
          </button>
        </form>
      </div>

      {/* Table Card */}
      <div className="glass-card rounded-2xl p-6 overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <p
            className="text-sm font-medium"
            style={{ color: 'rgba(255,255,255,0.4)' }}
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
              style={{ color: 'rgba(255,255,255,0.5)' }}
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
                  const isFullyPaid =
                    Number(a.cdstatus) === 2 || cdRemaining <= 0;
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
                      <td className="py-3 px-3 font-mono text-sm text-white/70">
                        {a.username}
                      </td>
                      <td className="py-3 px-3 font-medium text-white/80">
                        {a.fullname}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                          style={{
                            background: 'rgba(212,175,55,0.12)',
                            color: '#D4AF37',
                            border: '1px solid rgba(212,175,55,0.2)',
                          }}
                        >
                          {packageName}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-white/75 font-medium">
                        ₱{fmt(cdAmount)}
                      </td>
                      <td className="py-3 px-3 text-white/60">
                        ₱{fmt(cdPaid)}
                      </td>
                      <td
                        className="py-3 px-3 font-medium"
                        style={{
                          color: isFullyPaid ? '#4ade80' : '#fca5a5',
                        }}
                      >
                        ₱{fmt(cdRemaining)}
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
                                ? '#4ade80'
                                : 'rgba(255,255,255,0.5)',
                              minWidth: '32px',
                              textAlign: 'right',
                            }}
                          >
                            {progressPct}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
                          style={
                            isFullyPaid
                              ? {
                                  background: 'rgba(74,222,128,0.12)',
                                  color: '#4ade80',
                                  border: '1px solid rgba(74,222,128,0.22)',
                                }
                              : {
                                  background: 'rgba(251,191,36,0.12)',
                                  color: '#fbbf24',
                                  border: '1px solid rgba(251,191,36,0.22)',
                                }
                          }
                        >
                          {isFullyPaid ? 'Fully Paid' : 'Paying'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-xs text-white/40">
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
                              color: '#D4AF37',
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
                              color: '#93c5fd',
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
                              color: '#34d399',
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
                      colSpan="10"
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
