import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import api from '../../api';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import {
  HiOutlineBan,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineEye,
  HiOutlineLockClosed,
  HiOutlineLockOpen,
  HiOutlinePencilAlt,
  HiOutlinePlusCircle,
  HiOutlineReceiptTax,
  HiOutlineSearch,
  HiOutlineTicket,
  HiOutlineX,
} from 'react-icons/hi';
import {
  MAINTENANCE_PRODUCTS,
} from '../../constants/maintenanceProducts';

const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Unique, searchable voucher code derived from the immutable id. Falls back here so
// the UI still renders a proper code even before the backend `code` field deploys.
const voucherCode = (voucher) => voucher?.code || `VCH-${String(Number(voucher?.id) || 0).padStart(6, '0')}`;

const STATUS_MAP = { 1: 'Active', 2: 'Expired', 3: 'Fully Used', 4: 'Suspended' };

const STATUS_STYLES = {
  1: { color: '#34d399', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)' },
  2: { color: '#fbbf24', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)' },
  3: { color: '#93c5fd', background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)' },
  4: { color: '#f87171', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' },
};

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: '1', label: 'Active' },
  { key: '2', label: 'Expired' },
  { key: '3', label: 'Fully Used' },
  { key: '4', label: 'Suspended' },
];

const PRODUCT_BY_CODE = Object.fromEntries(MAINTENANCE_PRODUCTS.map((product) => [Number(product.code), product]));

const CLAIM_STATUS_STYLES = {
  requested: { color: '#fbbf24', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)' },
  claimed: { color: '#34d399', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)' },
};

// `amount` here is the per-UNIT price; the line total is amount × quantity.
const emptyAvailmentItem = () => ({ productCode: '', productKey: '', description: '', quantity: '1', amount: '' });

function itemLineTotal(item) {
  const unit = Math.round(Number(item?.amount || 0) * 100) / 100;
  const qty = Math.max(1, Math.floor(Number(item?.quantity || 1)));
  return Number.isFinite(unit) && unit > 0 ? Math.round(unit * qty * 100) / 100 : 0;
}

function toLocalDateTimeInput(value) {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  const offsetMs = parsed.getTimezoneOffset() * 60000;
  return new Date(parsed.getTime() - offsetMs).toISOString().slice(0, 16);
}

function makeDefaultAvailmentForm() {
  return {
    availmentDate: toLocalDateTimeInput(new Date()),
    erNumber: '',
    note: '',
    items: [emptyAvailmentItem()],
  };
}

function sumAvailmentItems(items = []) {
  return Math.round(
    (Array.isArray(items) ? items : []).reduce((sum, item) => sum + itemLineTotal(item), 0) * 100
  ) / 100;
}

export default function VoucherManagement() {
  const navigate = useNavigate();
  const location = useLocation();
  const { voucherId: routeVoucherId } = useParams();
  const { admin } = useAuth();
  const detailPageVoucherId = Number(routeVoucherId || 0);
  const isDetailPage = Number.isFinite(detailPageVoucherId) && detailPageVoucherId > 0;

  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [counts, setCounts] = useState({ all: 0, active: 0, expired: 0, fullyUsed: 0, suspended: 0 });

  const [detailVoucher, setDetailVoucher] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [availments, setAvailments] = useState([]);

  const [suspendTarget, setSuspendTarget] = useState(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [suspendLoading, setSuspendLoading] = useState(false);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState('create');
  const [editingAvailment, setEditingAvailment] = useState(null);
  const [viewingAvailment, setViewingAvailment] = useState(null);
  const [claimingAvailmentId, setClaimingAvailmentId] = useState(null);
  const [availmentForm, setAvailmentForm] = useState(makeDefaultAvailmentForm());
  const [savingAvailment, setSavingAvailment] = useState(false);
  const [directOpenRequest, setDirectOpenRequest] = useState(null);

  const rights = Number(admin?.rights || 0);
  const canGrant = rights === 1 || rights === 2 || rights === 3;
  const canSuspend = rights === 1 || rights === 2 || rights === 3;
  const canManageAvailments = rights === 1 || rights === 2 || rights === 3;

  useEffect(() => {
    loadData();
  }, [page, status, search]);

  useEffect(() => {
    if (isDetailPage) return;
    const params = new URLSearchParams(location.search);
    const voucherId = Number(params.get('voucherId') || 0);
    if (!voucherId) {
      setDirectOpenRequest(null);
      setSearchInput('');
      setSearch('');
      setPage(1);
      return;
    }
    const mode = params.get('mode') === 'add' ? 'add' : null;

    setDirectOpenRequest(mode ? {
      voucherId,
      mode,
    } : null);
    setStatus('all');
    setSearchInput(String(voucherId));
    setSearch(String(voucherId));
    setPage(1);
  }, [isDetailPage, location.search]);

  useEffect(() => {
    if (!isDetailPage) return;

    setDirectOpenRequest({
      voucherId: detailPageVoucherId,
      mode: 'view',
    });
    setStatus('all');
    setSearchInput(String(detailPageVoucherId));
    setSearch(String(detailPageVoucherId));
    setPage(1);
  }, [detailPageVoucherId, isDetailPage]);

  useEffect(() => {
    if (!directOpenRequest || loading || rows.length === 0) return;
    const voucher = rows.find((row) => Number(row.id) === Number(directOpenRequest.voucherId));
    if (!voucher) return;

    setDirectOpenRequest(null);
    if (directOpenRequest.mode === 'add') {
      openAddVoucher(voucher);
      return;
    }
    openDetails(voucher);
  }, [directOpenRequest, loading, rows]);

  async function loadData(showLoader = true) {
    if (showLoader) setLoading(true);
    try {
      const params = new URLSearchParams({ page, status });
      if (search.trim()) params.set('search', search.trim());
      const res = await api.get(`/admin/voucher-management?${params.toString()}`);
      setRows(res.data.vouchers || []);
      setPagination(res.data.pagination || { page: 1, totalPages: 1 });
      setCounts(res.data.counts || { all: 0, active: 0, expired: 0, fullyUsed: 0, suspended: 0 });
      return res.data;
    } catch {
      setRows([]);
      return null;
    } finally {
      if (showLoader) setLoading(false);
    }
  }

  async function loadVoucherDetailCollections(voucher) {
    setDetailVoucher(voucher);
    setDetailLoading(true);
    setTransactions([]);
    setAvailments([]);
    try {
      const [transactionRes, availmentRes] = await Promise.all([
        api.get(`/admin/voucher-management/${voucher.id}/transactions`),
        api.get(`/admin/voucher-management/${voucher.id}/availments`),
      ]);
      setTransactions(transactionRes.data.transactions || []);
      setAvailments(availmentRes.data.availments || []);
    } catch {
      toast.error('Failed to load voucher details');
    } finally {
      setDetailLoading(false);
    }
  }

  async function refreshDetailVoucher(voucherId) {
    const latestList = await loadData(false);
    const updatedVoucher = (latestList?.vouchers || []).find((row) => Number(row.id) === Number(voucherId));
    if (updatedVoucher) {
      await loadVoucherDetailCollections(updatedVoucher);
    }
  }

  function handleSearch(event) {
    event.preventDefault();
    setSearch(searchInput);
    setPage(1);
  }

  async function openDetails(voucher) {
    if (!isDetailPage) {
      navigate(`/admin/voucher-management/${voucher.id}`);
      return;
    }
    await loadVoucherDetailCollections(voucher);
  }

  async function openAddVoucher(voucher) {
    await loadVoucherDetailCollections(voucher);
    if (!canManageAvailments || Number(voucher.status) !== 1) {
      toast.error('Only active vouchers can receive transact entries');
      return;
    }
    openCreateAvailmentEditor();
  }

  function closeDetails() {
    setDetailVoucher(null);
    setTransactions([]);
    setAvailments([]);
  }

  function openSuspend(voucher) {
    setSuspendTarget(voucher);
    setSuspendReason('');
  }

  async function confirmSuspend() {
    if (!suspendReason.trim()) {
      return toast.error('Please enter a reason for suspension');
    }

    const targetId = suspendTarget.id;
    setSuspendLoading(true);
    try {
      await api.put(`/admin/voucher-management/${targetId}/suspend`, { reason: suspendReason.trim() });
      toast.success('Voucher suspended');
      setSuspendTarget(null);
      setSuspendReason('');
      await loadData(false);
      if (detailVoucher?.id === targetId) {
        await refreshDetailVoucher(targetId);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to suspend voucher');
    } finally {
      setSuspendLoading(false);
    }
  }

  async function handleUnsuspend(voucher) {
    try {
      await api.put(`/admin/voucher-management/${voucher.id}/unsuspend`);
      toast.success('Voucher reactivated');
      await loadData(false);
      if (detailVoucher?.id === voucher.id) {
        await refreshDetailVoucher(voucher.id);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to unsuspend voucher');
    }
  }

  function closeAvailmentEditor() {
    setEditorOpen(false);
    setEditorMode('create');
    setEditingAvailment(null);
    setAvailmentForm(makeDefaultAvailmentForm());
  }

  function openCreateAvailmentEditor() {
    setEditorMode('create');
    setEditingAvailment(null);
    setAvailmentForm(makeDefaultAvailmentForm());
    setEditorOpen(true);
  }

  async function openEditAvailmentEditor(availment) {
    try {
      const res = await api.get(`/admin/voucher-management/availments/${availment.id}`);
      const fullAvailment = res.data.availment;
      setEditorMode('edit');
      setEditingAvailment(fullAvailment);
      setAvailmentForm({
        availmentDate: toLocalDateTimeInput(fullAvailment.availmentDate),
        erNumber: fullAvailment.erNumber || '',
        note: fullAvailment.note || '',
        items: (fullAvailment.items || []).length > 0
          ? fullAvailment.items.map((item) => ({
              productCode: item.productCode ? String(item.productCode) : '',
              productKey: item.productKey || '',
              description: item.description || '',
              quantity: String(item.quantity ?? 1),
              // form amount field is the per-UNIT price
              amount: String(item.unitAmount ?? item.amount ?? ''),
            }))
          : [emptyAvailmentItem()],
      });
      setEditorOpen(true);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to load availment entry');
    }
  }

  function updateAvailmentItem(index, field, value) {
    if (field === 'productCode') {
      const product = PRODUCT_BY_CODE[Number(value)];
      setAvailmentForm((current) => ({
        ...current,
        items: current.items.map((item, itemIndex) => (
          itemIndex === index
            ? {
                ...item,
                productCode: value,
                productKey: product?.key || '',
                description: product?.name || '',
                amount: product ? String(product.price) : '',
              }
            : item
        )),
      }));
      return;
    }

    setAvailmentForm((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) => (
        itemIndex === index ? { ...item, [field]: value } : item
      )),
    }));
  }

  function addAvailmentItem() {
    setAvailmentForm((current) => ({
      ...current,
      items: [...current.items, emptyAvailmentItem()],
    }));
  }

  function removeAvailmentItem(index) {
    setAvailmentForm((current) => ({
      ...current,
      items: current.items.length <= 1
        ? [emptyAvailmentItem()]
        : current.items.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  async function submitAvailment(event) {
    event.preventDefault();

    if (!detailVoucher) return;

    setSavingAvailment(true);
    try {
      const payload = {
        availmentDate: availmentForm.availmentDate,
        erNumber: availmentForm.erNumber,
        note: availmentForm.note || '',
        items: availmentForm.items.map((item) => ({
          description: item.description,
          // `amount` is the per-unit price; backend multiplies by quantity for the line total.
          amount: item.amount,
          quantity: item.quantity,
          productCode: item.productCode,
          productKey: item.productKey,
        })),
      };

      if (editorMode === 'edit' && editingAvailment) {
        await api.put(`/admin/voucher-management/availments/${editingAvailment.id}`, payload);
        toast.success('Voucher availment updated');
      } else {
        await api.post(`/admin/voucher-management/${detailVoucher.id}/availments`, payload);
        toast.success('Voucher transaction recorded');
      }

      closeAvailmentEditor();
      await refreshDetailVoucher(detailVoucher.id);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save voucher availment');
    } finally {
      setSavingAvailment(false);
    }
  }

  async function openViewAvailment(availment) {
    try {
      const res = await api.get(`/admin/voucher-management/availments/${availment.id}`);
      setViewingAvailment(res.data.availment);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to load voucher request');
    }
  }

  async function markClaimed(availment) {
    setClaimingAvailmentId(availment.id);
    try {
      const res = await api.put(`/admin/voucher-management/availments/${availment.id}/claim`);
      toast.success('Voucher product request marked as claimed');
      if (viewingAvailment?.id === availment.id) {
        setViewingAvailment(res.data.availment);
      }
      if (detailVoucher?.id) {
        await refreshDetailVoucher(detailVoucher.id);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to mark request as claimed');
    } finally {
      setClaimingAvailmentId(null);
    }
  }

  const summaryCards = [
    { label: 'Total Vouchers', value: counts.all, icon: HiOutlineTicket, gradient: 'linear-gradient(135deg, #1d4ed8, #3b82f6)', shadow: '0 10px 24px rgba(37,99,235,0.3)' },
    { label: 'Active', value: counts.active, icon: HiOutlineCheckCircle, gradient: 'linear-gradient(135deg, #047857, #10b981)', shadow: '0 10px 24px rgba(16,185,129,0.3)' },
    { label: 'Expired', value: counts.expired, icon: HiOutlineClock, gradient: 'linear-gradient(135deg, #b45309, #f59e0b)', shadow: '0 10px 24px rgba(217,119,6,0.28)' },
    { label: 'Suspended', value: counts.suspended, icon: HiOutlineBan, gradient: 'linear-gradient(135deg, #991b1b, #ef4444)', shadow: '0 10px 24px rgba(239,68,68,0.3)' },
    { label: 'Fully Used', value: counts.fullyUsed, icon: HiOutlineCheckCircle, gradient: 'linear-gradient(135deg, #4f46e5, #818cf8)', shadow: '0 10px 24px rgba(79,70,229,0.28)' },
  ];

  const availmentTotal = useMemo(
    () => sumAvailmentItems(availmentForm.items),
    [availmentForm.items]
  );

  const editingPreviousTotal = Number(editingAvailment?.totalAmount || 0);
  const balanceBeforeEdit = detailVoucher
    ? Number(detailVoucher.remaining || 0) + (editorMode === 'edit' ? editingPreviousTotal : 0)
    : 0;
  const balanceAfterEdit = Math.max(0, balanceBeforeEdit - availmentTotal);
  const overBudget = availmentTotal > balanceBeforeEdit;

  return (
    <div className="space-y-6">
      {!isDetailPage && (
        <>
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Voucher Management</h1>
          <div className="w-12 h-0.5 mt-2" style={{ background: 'linear-gradient(90deg,#D4AF37,transparent)' }} />
          <p className="mt-3 text-sm max-w-3xl" style={{ color: 'rgba(255,255,255,0.56)' }}>
            Track voucher balances, record cashier ER availments, and keep every voucher usage line item tied to a dated reference.
          </p>
        </div>

        <div className="glass-card rounded-2xl px-4 py-3 min-w-[280px]">
          <p className="text-[11px] uppercase tracking-[0.18em]" style={{ color: 'rgba(212,175,55,0.72)' }}>Cashier Access</p>
          <p className="mt-2 text-sm text-white">Voucher management stays active, while manage codes and generate codes remain available for cashier accounts.</p>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-2 flex flex-wrap items-center gap-2">
        <button
          className="px-3 py-2 rounded-lg text-sm font-semibold"
          style={{
            background: 'rgba(212,175,55,0.16)',
            border: '1px solid rgba(212,175,55,0.3)',
            color: '#D4AF37',
          }}
          type="button"
        >
          Voucher List
        </button>
        {canGrant && (
          <button
            onClick={() => navigate('/admin/voucher-management/grant')}
            className="portal-button portal-neutral-button px-3 py-2 text-sm"
            type="button"
          >
            Grant Vouchers
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {summaryCards.map((card) => (
          <div key={card.label} className="glass-card rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div
                className="size-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: card.gradient, boxShadow: card.shadow }}
              >
                <card.icon className="size-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium truncate" style={{ color: 'rgba(255,255,255,0.5)' }}>{card.label}</p>
                <p className="text-lg font-bold text-white">{Number(card.value || 0).toLocaleString()}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="portal-soft-panel rounded-2xl p-4 space-y-3">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <HiOutlineSearch className="portal-card-muted absolute left-3 top-1/2 -translate-y-1/2 size-4" />
            <input
              type="text"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search by activation code (the code you distributed) or username..."
              className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm portal-card-title outline-none bg-[var(--portal-soft-bg)] border border-[var(--portal-soft-border)] placeholder:text-[color:var(--portal-card-muted)]"
            />
          </div>
          <button
            type="submit"
            className="portal-button portal-gold-button px-4 py-2.5 text-sm"
          >
            Search
          </button>
          {(search || searchInput) && (
            <button
              type="button"
              onClick={() => { setSearchInput(''); setSearch(''); setPage(1); }}
              className="portal-button portal-neutral-button px-4 py-2.5 text-sm"
              title="Clear search and show all vouchers"
            >
              Clear
            </button>
          )}
        </form>

        <div className="flex flex-wrap items-center gap-2">
          {FILTERS.map((filter) => (
            <button
              key={filter.key}
              onClick={() => { setStatus(filter.key); setPage(1); }}
              className={`text-xs px-3 py-1.5 rounded-xl font-semibold border transition-colors ${
                status === filter.key ? 'portal-accent-chip' : 'portal-card-muted bg-[var(--portal-soft-bg)] border-[var(--portal-soft-border)]'
              }`}
              type="button"
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="size-8 rounded-full border-4 animate-spin" style={{ borderColor: 'rgba(212,175,55,0.15)', borderTopColor: '#D4AF37' }} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  {['Code', 'Username', 'Full Name', 'Package', 'Amount', 'Remaining', 'Status', 'Issued', 'Expiry', 'Actions'].map((header) => (
                    <th key={header} className="table-header p-3 text-left text-xs uppercase tracking-wide">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="hover:bg-white/[0.04] transition-colors">
                    <td className="p-3 font-mono text-xs">
                      {row.code
                        ? <span style={{ color: 'rgba(212,175,55,0.9)' }}>{row.code}</span>
                        : <span className="text-white/30" title="No used activation code for this package">—</span>}
                    </td>
                    <td className="p-3 text-white/80">{row.username}</td>
                    <td className="p-3 text-white/60">{row.fullName || 'N/A'}</td>
                    <td className="p-3 text-white/70">{row.package || '-'}</td>
                    <td className="p-3 text-white/80 font-mono">{fmt(row.amount)}</td>
                    <td className="p-3 text-white/80 font-mono">{fmt(row.remaining)}</td>
                    <td className="p-3">
                      <span
                        className="inline-block text-xs px-2.5 py-0.5 rounded-full"
                        style={STATUS_STYLES[row.status] || STATUS_STYLES[1]}
                      >
                        {STATUS_MAP[row.status] || 'Unknown'}
                      </span>
                    </td>
                    <td className="p-3 text-white/50 text-xs">{row.issuedAt || '-'}</td>
                    <td className="p-3 text-white/50 text-xs">
                      <div>{row.expiryAt || '-'}</div>
                      <div className="mt-1 text-[10px]" style={{ color: 'rgba(212,175,55,0.7)' }}>{row.expiryLabel}</div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openDetails(row)}
                          className="portal-button portal-gold-button text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1"
                          title="View details"
                          type="button"
                        >
                          <HiOutlineEye className="size-3.5" />
                          <span className="hidden sm:inline">View</span>
                        </button>
                        {canManageAvailments && Number(row.status) === 1 && (
                          <button
                            onClick={() => openAddVoucher(row)}
                            className="portal-button portal-neutral-button text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1"
                            title="Transact voucher with ER trace"
                            type="button"
                          >
                            <HiOutlinePlusCircle className="size-3.5" />
                            <span className="hidden sm:inline">Transact</span>
                          </button>
                        )}
                        {canSuspend && Number(row.status) === 1 && (
                          <button
                            onClick={() => openSuspend(row)}
                            className="portal-button portal-danger-button text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1"
                            title="Suspend voucher"
                            type="button"
                          >
                            <HiOutlineLockClosed className="size-3.5" />
                            <span className="hidden sm:inline">Suspend</span>
                          </button>
                        )}
                        {canSuspend && Number(row.status) === 4 && (
                          <button
                            onClick={() => handleUnsuspend(row)}
                            className="portal-button portal-success-button text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1"
                            title="Unsuspend voucher"
                            type="button"
                          >
                            <HiOutlineLockOpen className="size-3.5" />
                            <span className="hidden sm:inline">Unsuspend</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan="10" className="py-12 text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>
                      No vouchers found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 mt-4">
          <button
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={pagination.page <= 1}
            className="text-sm py-1.5 px-3 rounded-lg font-medium disabled:opacity-40"
            style={{ background: 'rgba(212,175,55,0.08)', color: 'rgba(212,175,55,0.85)', border: '1px solid rgba(212,175,55,0.15)' }}
            type="button"
          >
            Prev
          </button>
          <span className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>{pagination.page} / {pagination.totalPages || 1}</span>
          <button
            onClick={() => setPage((current) => Math.min(Number(pagination.totalPages || 1), current + 1))}
            disabled={pagination.page >= Number(pagination.totalPages || 1)}
            className="text-sm py-1.5 px-3 rounded-lg font-medium disabled:opacity-40"
            style={{ background: 'rgba(212,175,55,0.08)', color: 'rgba(212,175,55,0.85)', border: '1px solid rgba(212,175,55,0.15)' }}
            type="button"
          >
            Next
          </button>
        </div>
      </div>
        </>
      )}

      {isDetailPage && !detailVoucher && (
        <div className="glass-card rounded-3xl p-10 flex justify-center">
          <div className="size-8 rounded-full border-4 animate-spin" style={{ borderColor: 'rgba(212,175,55,0.15)', borderTopColor: '#D4AF37' }} />
        </div>
      )}

      {detailVoucher && isDetailPage && (
        <div className="space-y-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between p-6 pb-4 shrink-0">
              <div>
                {isDetailPage && (
                  <button
                    onClick={() => navigate('/admin/voucher-management')}
                    className="portal-button portal-neutral-button text-xs px-3 py-2 mb-4"
                    type="button"
                  >
                    Back to Voucher List
                  </button>
                )}
                <h2 className="portal-modal-title font-display text-xl">Voucher Owner Details</h2>
                <p className="portal-modal-muted text-sm mt-1">ER-based voucher tracing, balances, and transaction history for voucher {voucherCode(detailVoucher)}</p>
              </div>
              {!isDetailPage && (
                <button onClick={closeDetails} className="portal-modal-muted hover:opacity-80 p-1" aria-label="Close modal" type="button">
                  <HiOutlineX className="size-5" />
                </button>
              )}
            </div>

            <div className={isDetailPage ? 'space-y-6' : 'flex-1 overflow-y-auto px-6 pb-6 space-y-6'}>
              <div className="grid grid-cols-1 lg:grid-cols-[1.25fr_1fr] gap-4">
                <div className="glass-card rounded-3xl p-5">
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                    <div>
                      <p className="portal-modal-muted text-xs uppercase tracking-wide mb-1">Voucher Code</p>
                      <p className="portal-modal-title font-mono">{voucherCode(detailVoucher)}</p>
                    </div>
                    <div>
                      <p className="portal-modal-muted text-xs uppercase tracking-wide mb-1">Username</p>
                      <p className="portal-modal-title">{detailVoucher.username}</p>
                    </div>
                    <div>
                      <p className="portal-modal-muted text-xs uppercase tracking-wide mb-1">Full Name</p>
                      <p className="portal-modal-title">{detailVoucher.fullName || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="portal-modal-muted text-xs uppercase tracking-wide mb-1">Package</p>
                      <p className="portal-modal-title">{detailVoucher.package || '-'}</p>
                    </div>
                    <div>
                      <p className="portal-modal-muted text-xs uppercase tracking-wide mb-1">Voucher Amount</p>
                      <p className="portal-modal-title font-mono">{fmt(detailVoucher.amount)}</p>
                    </div>
                    <div>
                      <p className="portal-modal-muted text-xs uppercase tracking-wide mb-1">Remaining</p>
                      <p className="portal-modal-title font-mono">{fmt(detailVoucher.remaining)}</p>
                    </div>
                    <div>
                      <p className="portal-modal-muted text-xs uppercase tracking-wide mb-1">Status</p>
                      <span
                        className="inline-block text-xs px-2.5 py-0.5 rounded-full"
                        style={STATUS_STYLES[detailVoucher.status] || STATUS_STYLES[1]}
                      >
                        {STATUS_MAP[detailVoucher.status] || 'Unknown'}
                      </span>
                    </div>
                    <div>
                      <p className="portal-modal-muted text-xs uppercase tracking-wide mb-1">Expiry Mode</p>
                      <p className="portal-modal-title capitalize">{detailVoucher.expiryMode || 'unused'}</p>
                    </div>
                    <div>
                      <p className="portal-modal-muted text-xs uppercase tracking-wide mb-1">Issued</p>
                      <p className="portal-modal-title text-xs">{detailVoucher.issuedAt || '-'}</p>
                    </div>
                    <div>
                      <p className="portal-modal-muted text-xs uppercase tracking-wide mb-1">Active Until</p>
                      <p className="portal-modal-title text-xs">{detailVoucher.useExpiresAt || detailVoucher.expiryAt || '-'}</p>
                    </div>
                    {detailVoucher.suspendReason && (
                      <div className="col-span-2">
                        <p className="portal-danger-text text-xs uppercase tracking-wide mb-1">Suspend Reason</p>
                        <p className="portal-danger-text text-sm">{detailVoucher.suspendReason}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="glass-card rounded-3xl p-5">
                  <p className="text-[11px] uppercase tracking-[0.18em]" style={{ color: 'rgba(212,175,55,0.72)' }}>Tracing Snapshot</p>
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-2xl p-4" style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.14)' }}>
                      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.52)' }}>Used So Far</p>
                      <p className="mt-1 text-xl font-semibold text-white font-mono">{fmt(Number(detailVoucher.amount || 0) - Number(detailVoucher.remaining || 0))}</p>
                    </div>
                    <div className="rounded-2xl p-4" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.14)' }}>
                      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.52)' }}>ER Logs</p>
                      <p className="mt-1 text-xl font-semibold text-white">{availments.length}</p>
                    </div>
                    <div className="rounded-2xl p-4" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.14)' }}>
                      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.52)' }}>Transactions</p>
                      <p className="mt-1 text-xl font-semibold text-white">{transactions.length}</p>
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <p className="portal-modal-title text-sm">Voucher expiry starts on first actual availment.</p>
                    <p className="portal-modal-muted text-xs mt-2 leading-relaxed">
                      This cashier ledger keeps the ER number, availment date, itemized usage, and remaining balance in one place so the first-use countdown is easier to trace.
                    </p>
                  </div>
                </div>
              </div>

              <div className="glass-card rounded-3xl p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="portal-modal-title text-sm font-semibold">Voucher Transactions</h3>
                    <p className="portal-modal-muted text-xs mt-1">One ER can carry multiple availed items. The voucher deduction is always the total of those item amounts.</p>
                  </div>
                  {canManageAvailments && Number(detailVoucher.status) === 1 && (
                    <button
                      onClick={openCreateAvailmentEditor}
                      className="portal-button portal-gold-button px-3.5 py-2 text-xs inline-flex items-center gap-2"
                      type="button"
                    >
                      <HiOutlinePlusCircle className="size-4" />
                      Transact
                    </button>
                  )}
                </div>

                {detailLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="size-6 rounded-full border-4 animate-spin" style={{ borderColor: 'rgba(212,175,55,0.15)', borderTopColor: '#D4AF37' }} />
                  </div>
                ) : availments.length === 0 ? (
                  <div className="rounded-2xl px-4 py-8 text-center mt-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.12)' }}>
                    <HiOutlineReceiptTax className="size-7 mx-auto mb-2" style={{ color: 'rgba(212,175,55,0.8)' }} />
                    <p className="portal-modal-title text-sm">No manual availments yet.</p>
                    <p className="portal-modal-muted text-xs mt-2">Use this section when a cashier needs to log what was availed, on what date, and how much voucher value was consumed.</p>
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    {availments.map((availment) => (
                      <div
                        key={availment.id}
                        className="rounded-2xl p-4"
                        style={{ background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.08)' }}
                      >
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs px-2.5 py-1 rounded-full" style={{ color: '#D4AF37', background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.22)' }}>
                                {availment.reference || availment.erNumber}
                              </span>
                              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.56)' }}>{availment.availmentDate || '-'}</span>
                              <span className="text-xs px-2.5 py-1 rounded-full capitalize" style={{ color: 'rgba(191,219,254,0.95)', background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.22)' }}>
                                {(availment.requestSource || 'cashier') === 'member' ? 'Member Request' : 'Cashier Entry'}
                              </span>
                              <span
                                className="text-xs px-2.5 py-1 rounded-full capitalize"
                                style={CLAIM_STATUS_STYLES[availment.claimStatus || 'requested'] || CLAIM_STATUS_STYLES.requested}
                              >
                                {availment.claimStatus || 'requested'}
                              </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                              <div>
                                <p className="portal-modal-muted text-[11px] uppercase tracking-wide">ER Number</p>
                                <p className="portal-modal-title">{availment.erNumber || '-'}</p>
                              </div>
                              <div>
                                <p className="portal-modal-muted text-[11px] uppercase tracking-wide">Item Count</p>
                                <p className="portal-modal-title">{availment.itemCount || 0}</p>
                              </div>
                              <div>
                                <p className="portal-modal-muted text-[11px] uppercase tracking-wide">Voucher Used</p>
                                <p className="portal-modal-title font-mono">{fmt(availment.totalAmount)}</p>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 self-start">
                            <button
                              onClick={() => openViewAvailment(availment)}
                              className="portal-button portal-gold-button px-3 py-2 text-xs inline-flex items-center gap-2"
                              type="button"
                            >
                              <HiOutlineEye className="size-4" />
                              View
                            </button>
                            {canManageAvailments && Number(detailVoucher.status) !== 4 && Number(detailVoucher.status) !== 2 && (
                              <button
                                onClick={() => openEditAvailmentEditor(availment)}
                                className="portal-button portal-neutral-button px-3 py-2 text-xs inline-flex items-center gap-2"
                                type="button"
                              >
                                <HiOutlinePencilAlt className="size-4" />
                                Edit Entry
                              </button>
                            )}
                            {canManageAvailments && (availment.requestSource || 'cashier') === 'member' && (availment.claimStatus || 'requested') === 'requested' && (
                              <button
                                onClick={() => markClaimed(availment)}
                                disabled={claimingAvailmentId === availment.id}
                                className="portal-button portal-success-button px-3 py-2 text-xs inline-flex items-center gap-2 disabled:opacity-50"
                                type="button"
                              >
                                <HiOutlineCheckCircle className="size-4" />
                                {claimingAvailmentId === availment.id ? 'Claiming...' : 'Mark Claimed'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="glass-card rounded-3xl p-5">
                <h3 className="portal-modal-title text-sm font-semibold mb-3">Transaction History</h3>
                {detailLoading ? (
                  <div className="flex justify-center py-6">
                    <div className="size-6 rounded-full border-4 animate-spin" style={{ borderColor: 'rgba(212,175,55,0.15)', borderTopColor: '#D4AF37' }} />
                  </div>
                ) : transactions.length === 0 ? (
                  <p className="portal-modal-muted text-center py-6 text-sm">No transactions found for this voucher.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr>
                          {['Date', 'Type', 'Amount', 'Reference', 'Note'].map((header) => (
                            <th key={header} className="table-header py-2 px-3 text-left text-xs uppercase tracking-wide">{header}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map((transaction, index) => (
                          <tr key={transaction.id || index} className="hover:bg-white/[0.04] transition-colors">
                            <td className="portal-modal-muted py-2 px-3 text-xs">{transaction.date || '-'}</td>
                            <td className="portal-modal-text py-2 px-3">{transaction.type || '-'}</td>
                            <td className="portal-modal-title py-2 px-3 font-mono">{fmt(transaction.amount)}</td>
                            <td className="portal-modal-muted py-2 px-3 text-xs font-mono">{transaction.reference || '-'}</td>
                            <td className="portal-modal-muted py-2 px-3 text-xs max-w-[160px] truncate" title={transaction.note || ''}>{transaction.note || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 p-6 pt-4 shrink-0 border-t portal-row-divider">
              {canSuspend && Number(detailVoucher.status) === 1 && (
                <button
                  onClick={() => openSuspend(detailVoucher)}
                  className="portal-button portal-danger-button text-xs px-3.5 py-2.5"
                  type="button"
                >
                  Suspend
                </button>
              )}
              {canSuspend && Number(detailVoucher.status) === 4 && (
                <button
                  onClick={() => { handleUnsuspend(detailVoucher); closeDetails(); }}
                  className="portal-button portal-success-button text-xs px-3.5 py-2.5"
                  type="button"
                >
                  Unsuspend
                </button>
              )}
              <button
                onClick={() => navigate('/admin/voucher-management')}
                className="portal-button portal-neutral-button text-xs px-3.5 py-2.5 ml-auto"
                type="button"
              >
                Back to Voucher List
              </button>
            </div>
          </div>
        </div>
      )}

      {viewingAvailment && (
        <div className="portal-overlay fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="portal-modal-panel w-full max-w-2xl rounded-3xl shadow-[0_28px_64px_rgba(15,23,42,0.22)] dark:shadow-[0_30px_70px_rgba(0,0,0,0.45)]">
            <div className="flex items-start justify-between gap-4 p-6 pb-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em]" style={{ color: 'rgba(212,175,55,0.75)' }}>Voucher Request Cross-Check</p>
                <h2 className="portal-modal-title font-display text-xl mt-1">{viewingAvailment.reference || viewingAvailment.erNumber}</h2>
                <p className="portal-modal-muted text-sm mt-1">Verify ER, selected products, amount used, and claim status before releasing products.</p>
              </div>
              <button onClick={() => setViewingAvailment(null)} className="portal-modal-muted hover:opacity-80 p-1" aria-label="Close view modal" type="button">
                <HiOutlineX className="size-5" />
              </button>
            </div>

            <div className="px-6 pb-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-2xl p-4" style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.14)' }}>
                  <p className="portal-modal-muted text-xs">ER Number</p>
                  <p className="portal-modal-title mt-1 font-semibold">{viewingAvailment.erNumber || '-'}</p>
                </div>
                <div className="rounded-2xl p-4" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.14)' }}>
                  <p className="portal-modal-muted text-xs">Request Date</p>
                  <p className="portal-modal-title mt-1 font-semibold">{viewingAvailment.availmentDate || '-'}</p>
                </div>
                <div className="rounded-2xl p-4" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.14)' }}>
                  <p className="portal-modal-muted text-xs">Claim Status</p>
                  <span
                    className="inline-block mt-2 text-xs px-2.5 py-1 rounded-full capitalize"
                    style={CLAIM_STATUS_STYLES[viewingAvailment.claimStatus || 'requested'] || CLAIM_STATUS_STYLES.requested}
                  >
                    {viewingAvailment.claimStatus || 'requested'}
                  </span>
                </div>
              </div>

              <div className="rounded-3xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      {['Product Code', 'Product', 'Unit Price', 'Qty', 'Amount Used'].map((header) => (
                        <th key={header} className="table-header py-2.5 px-3 text-left text-xs uppercase tracking-wide">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(viewingAvailment.items || []).map((item, index) => (
                      <tr key={`${item.productCode || index}-${item.lineNo || index}`} className="hover:bg-white/[0.04]">
                        <td className="portal-modal-muted py-2.5 px-3 font-mono">{item.productCode || '-'}</td>
                        <td className="portal-modal-title py-2.5 px-3">
                          <div>{item.description || '-'}</div>
                        </td>
                        <td className="portal-modal-muted py-2.5 px-3 font-mono">PHP {fmt(item.unitAmount ?? item.amount)}</td>
                        <td className="portal-modal-title py-2.5 px-3 font-mono">{item.quantity ?? 1}</td>
                        <td className="portal-modal-title py-2.5 px-3 font-mono">PHP {fmt(item.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {viewingAvailment.note && (
                <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <p className="portal-modal-muted text-xs">Note</p>
                  <p className="portal-modal-title text-sm mt-1 whitespace-pre-wrap break-words">{viewingAvailment.note}</p>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div>
                  <p className="portal-modal-muted text-xs">Total Voucher Used</p>
                  <p className="portal-modal-title text-lg font-semibold font-mono">PHP {fmt(viewingAvailment.totalAmount)}</p>
                  {viewingAvailment.claimedAt && (
                    <p className="portal-modal-muted text-xs mt-1">Claimed {viewingAvailment.claimedAt} by {viewingAvailment.claimedBy || 'cashier'}</p>
                  )}
                </div>
                {(viewingAvailment.requestSource || 'cashier') === 'member' && (viewingAvailment.claimStatus || 'requested') === 'requested' && (
                  <button
                    onClick={() => markClaimed(viewingAvailment)}
                    disabled={claimingAvailmentId === viewingAvailment.id}
                    className="portal-button portal-success-button px-4 py-2.5 text-xs disabled:opacity-50"
                    type="button"
                  >
                    {claimingAvailmentId === viewingAvailment.id ? 'Claiming...' : 'Mark Claimed'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {editorOpen && detailVoucher && (
        <div className="portal-overlay fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="portal-modal-panel w-full max-w-3xl max-h-[88vh] flex flex-col rounded-3xl shadow-[0_28px_64px_rgba(15,23,42,0.22)] dark:shadow-[0_30px_70px_rgba(0,0,0,0.45)]">
            <div className="flex items-center justify-between p-6 pb-4 shrink-0">
              <div>
                <h2 className="portal-modal-title font-display text-xl">{editorMode === 'edit' ? 'Edit Voucher Transaction' : 'Transact Voucher'}</h2>
                <p className="portal-modal-muted text-sm mt-1">Capture the ER number, availment date, product pricing, and every item that consumed the voucher.</p>
              </div>
              <button onClick={closeAvailmentEditor} className="portal-modal-muted hover:opacity-80 p-1" aria-label="Close modal" type="button">
                <HiOutlineX className="size-5" />
              </button>
            </div>

            <form onSubmit={submitAvailment} className="flex-1 overflow-y-auto px-6 pb-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="portal-modal-muted block text-xs font-medium mb-1.5">Availment Date</label>
                  <input
                    type="datetime-local"
                    value={availmentForm.availmentDate}
                    onChange={(event) => setAvailmentForm((current) => ({ ...current, availmentDate: event.target.value }))}
                    className="w-full px-3 py-2.5 rounded-2xl text-sm portal-modal-title outline-none bg-[var(--portal-soft-bg)] border border-[var(--portal-soft-border)]"
                    required
                  />
                </div>
                <div>
                  <label className="portal-modal-muted block text-xs font-medium mb-1.5">ER Number</label>
                  <input
                    type="text"
                    value={availmentForm.erNumber}
                    onChange={(event) => setAvailmentForm((current) => ({ ...current, erNumber: event.target.value }))}
                    placeholder="Example: ER-2026-00124"
                    className="w-full px-3 py-2.5 rounded-2xl text-sm portal-modal-title outline-none bg-[var(--portal-soft-bg)] border border-[var(--portal-soft-border)] placeholder:text-[color:var(--portal-modal-muted)]"
                    required
                  />
                </div>
              </div>

              <div className="rounded-3xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="portal-modal-title text-sm font-semibold">Transacted Items</h3>
                    <p className="portal-modal-muted text-xs mt-1">Pick a product to prefill its price, then adjust the amount if operations need a different deduction.</p>
                  </div>
                  <button
                    onClick={addAvailmentItem}
                    className="portal-button portal-neutral-button px-3 py-2 text-xs inline-flex items-center gap-2"
                    type="button"
                  >
                    <HiOutlinePlusCircle className="size-4" />
                    Add Line
                  </button>
                </div>

                <div className="mt-4 space-y-3">
                  {availmentForm.items.map((item, index) => {
                    return (
                      <div key={`${index}-${editorMode}`} className="space-y-2 rounded-2xl p-3" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="grid grid-cols-1 md:grid-cols-[1.4fr_0.7fr_0.55fr_auto] gap-3 items-end">
                          <div>
                            <label className="portal-modal-muted block text-[11px] font-medium mb-1.5">Product / Availment</label>
                            <select
                              value={item.productCode || ''}
                              onChange={(event) => updateAvailmentItem(index, 'productCode', event.target.value)}
                              className="w-full px-3 py-2.5 rounded-2xl text-sm portal-modal-title outline-none bg-[var(--portal-soft-bg)] border border-[var(--portal-soft-border)] placeholder:text-[color:var(--portal-modal-muted)]"
                              required
                            >
                              <option value="">Select product...</option>
                              {MAINTENANCE_PRODUCTS.map((product) => (
                                <option key={product.code} value={product.code}>
                                  {product.name} - PHP {fmt(product.price)}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label htmlFor={`avail-unit-${index}`} className="portal-modal-muted block text-[11px] font-medium mb-1.5">Unit Price</label>
                            <input
                              id={`avail-unit-${index}`}
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.amount}
                              placeholder="0.00"
                              onChange={(event) => updateAvailmentItem(index, 'amount', event.target.value)}
                              className="w-full px-3 py-2.5 rounded-2xl text-sm portal-modal-title outline-none bg-[var(--portal-soft-bg)] border border-[var(--portal-soft-border)]"
                            />
                          </div>
                          <div>
                            <label htmlFor={`avail-qty-${index}`} className="portal-modal-muted block text-[11px] font-medium mb-1.5">Qty</label>
                            <input
                              id={`avail-qty-${index}`}
                              type="number"
                              min="1"
                              step="1"
                              value={item.quantity}
                              placeholder="1"
                              onChange={(event) => updateAvailmentItem(index, 'quantity', event.target.value)}
                              className="w-full px-3 py-2.5 rounded-2xl text-sm portal-modal-title outline-none bg-[var(--portal-soft-bg)] border border-[var(--portal-soft-border)]"
                            />
                          </div>
                          <button
                            onClick={() => removeAvailmentItem(index)}
                            className="portal-button portal-danger-button px-3 py-2.5 text-xs"
                            type="button"
                          >
                            Remove
                          </button>
                        </div>
                        <p className="portal-modal-muted text-[11px] text-right">
                          Line total: <span className="portal-modal-title font-mono">PHP {fmt(itemLineTotal(item))}</span>
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label htmlFor="avail-note" className="portal-modal-muted block text-xs font-medium mb-1.5">Note <span className="font-normal">(optional)</span></label>
                <textarea
                  id="avail-note"
                  value={availmentForm.note}
                  onChange={(event) => setAvailmentForm((current) => ({ ...current, note: event.target.value }))}
                  rows={2}
                  maxLength={500}
                  placeholder="Add a note for this transaction (e.g. cashier remarks, claim details)…"
                  className="w-full px-3 py-2.5 rounded-2xl text-sm portal-modal-title outline-none resize-none bg-[var(--portal-soft-bg)] border border-[var(--portal-soft-border)] placeholder:text-[color:var(--portal-modal-muted)]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="rounded-2xl p-4" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.16)' }}>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.54)' }}>Voucher Before Save</p>
                  <p className="mt-1 text-lg font-semibold text-white font-mono">{fmt(balanceBeforeEdit)}</p>
                </div>
                <div className="rounded-2xl p-4" style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.16)' }}>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.54)' }}>Availment Total</p>
                  <p className="mt-1 text-lg font-semibold text-white font-mono">{fmt(availmentTotal)}</p>
                </div>
                <div className="rounded-2xl p-4" style={{ background: overBudget ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)', border: overBudget ? '1px solid rgba(239,68,68,0.18)' : '1px solid rgba(16,185,129,0.16)' }}>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.54)' }}>Remaining After Save</p>
                  <p className="mt-1 text-lg font-semibold text-white font-mono">{fmt(balanceAfterEdit)}</p>
                </div>
              </div>

              {overBudget && (
                <div className="rounded-2xl px-4 py-3 text-sm" style={{ color: '#fca5a5', background: 'rgba(127,29,29,0.2)', border: '1px solid rgba(248,113,113,0.28)' }}>
                  The summed item amounts are higher than the voucher balance available for this entry.
                </div>
              )}
            </form>

            <div className="flex flex-wrap justify-end gap-2 p-6 pt-4 border-t portal-row-divider shrink-0">
              <button
                onClick={closeAvailmentEditor}
                className="portal-button portal-neutral-button text-xs px-3.5 py-2.5"
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={submitAvailment}
                disabled={savingAvailment || overBudget}
                className="portal-button portal-gold-button text-xs px-4 py-2.5 font-semibold disabled:opacity-50"
                type="button"
              >
                {savingAvailment ? 'Saving...' : editorMode === 'edit' ? 'Save Changes' : 'Transact'}
              </button>
            </div>
          </div>
        </div>
      )}

      {suspendTarget && (
        <div className="portal-overlay fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="portal-modal-panel w-full max-w-md rounded-3xl p-6 shadow-[0_28px_64px_rgba(15,23,42,0.22)] dark:shadow-[0_30px_70px_rgba(0,0,0,0.45)]">
            <div className="flex items-center justify-between">
              <h2 className="portal-modal-title font-display text-xl">Suspend Voucher</h2>
              <button onClick={() => setSuspendTarget(null)} className="portal-modal-muted hover:opacity-80 p-1" aria-label="Close modal" type="button">
                <HiOutlineX className="size-5" />
              </button>
            </div>
            <p className="portal-modal-text mt-3 text-sm">
              Suspending voucher <span className="portal-modal-title font-mono">{voucherCode(suspendTarget)}</span> for <span className="portal-modal-title">{suspendTarget.username}</span>.
            </p>
            <div className="mt-4">
              <label className="portal-modal-muted block text-xs font-medium mb-1.5">
                Reason <span className="portal-danger-text">*</span>
              </label>
              <textarea
                value={suspendReason}
                onChange={(event) => setSuspendReason(event.target.value)}
                rows={3}
                placeholder="Enter reason for suspension..."
                className="w-full px-3 py-2 rounded-2xl text-sm portal-modal-title outline-none resize-none bg-[var(--portal-soft-bg)] border border-[var(--portal-soft-border)] placeholder:text-[color:var(--portal-modal-muted)]"
              />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setSuspendTarget(null)}
                className="portal-button portal-neutral-button text-xs px-3.5 py-2.5"
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={confirmSuspend}
                disabled={suspendLoading}
                className="portal-button portal-danger-button text-xs px-4 py-2.5 font-semibold"
                type="button"
              >
                {suspendLoading ? 'Suspending...' : 'Confirm Suspend'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
