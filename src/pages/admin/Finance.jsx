import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../api';

const fmtMoney = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtInt = (n) => Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 0 });

function currentYear() {
  return new Date().getFullYear();
}

function triggerBrowserDownload(url) {
  const link = document.createElement('a');
  link.href = url;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function DetailList({ items = [] }) {
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-start justify-between gap-3 rounded-xl px-3 py-2.5"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>{item.label}</span>
          <span className="text-sm font-semibold text-right text-white">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function Finance() {
  const [year, setYear] = useState(currentYear());
  const [loading, setLoading] = useState(true);
  const [savingPackage, setSavingPackage] = useState(null);
  const [exporting, setExporting] = useState('');
  const [snapshot, setSnapshot] = useState(null);
  const [drafts, setDrafts] = useState({});
  const [selectedPanel, setSelectedPanel] = useState('expenseReserve');
  const [selectedPackageType, setSelectedPackageType] = useState(null);

  useEffect(() => {
    loadFinance(year);
  }, []);

  async function loadFinance(targetYear = year) {
    setLoading(true);
    try {
      const res = await api.get(`/admin/finance?year=${targetYear}`);
      setSnapshot(res.data);
      const nextDrafts = {};
      for (const config of res.data.packageConfigs || []) {
        nextDrafts[config.packageType] = {
          productCost: config.productCost,
          salesMatchCeiling: config.salesMatchCeiling,
          adminExtraCost: config.adminExtraCost,
          notes: config.notes || '',
        };
      }
      setDrafts(nextDrafts);
      if (!selectedPackageType && (res.data.packageRows || []).length > 0) {
        setSelectedPackageType(res.data.packageRows[0].packageType);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to load finance data');
    } finally {
      setLoading(false);
    }
  }

  function updateDraft(packageType, field, value) {
    setDrafts((current) => ({
      ...current,
      [packageType]: {
        ...current[packageType],
        [field]: value,
      },
    }));
  }

  async function saveDraft(packageType) {
    setSavingPackage(packageType);
    try {
      const payload = drafts[packageType] || {};
      await api.put(`/admin/finance/package-config/${packageType}`, payload);
      toast.success('Package finance settings saved');
      await loadFinance(year);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save package settings');
    } finally {
      setSavingPackage(null);
    }
  }

  async function handleExport(format) {
    setExporting(format);
    try {
      triggerBrowserDownload(`/api/admin/finance/export?year=${year}&format=${format}`);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to export finance report');
    } finally {
      window.setTimeout(() => setExporting(''), 500);
    }
  }

  const summaryCards = useMemo(() => {
    if (!snapshot?.totals || !snapshot?.wallets) return [];
    return [
      {
        key: 'grossSales',
        label: 'Gross Sales',
        value: `PHP ${fmtMoney(snapshot.totals.grossSales)}`,
        color: '#F9E08A',
        description: 'All used package-entry codes for the selected year.',
        details: [
          { label: 'Codes Used', value: fmtInt(snapshot.totals.totalPackagesSold) },
          { label: 'Gross Sales', value: `PHP ${fmtMoney(snapshot.totals.grossSales)}` },
          { label: 'Projected Margin', value: `PHP ${fmtMoney(snapshot.totals.projectedOperatingMargin)}` },
        ],
      },
      {
        key: 'expenseReserve',
        label: 'Expense Reserve',
        value: `PHP ${fmtMoney(snapshot.totals.expenseReserveWallet)}`,
        color: '#fbbf24',
        description: 'Package-linked reserve for product, SMB reserve, direct referral, and admin or ops reserve.',
        details: [
          { label: 'Product Cost Reserve', value: `PHP ${fmtMoney(snapshot.totals.productCostTotal)}` },
          { label: 'Sales Match Reserve', value: `PHP ${fmtMoney(snapshot.totals.salesMatchReserveTotal)}` },
          { label: 'Direct Referral Reserve', value: `PHP ${fmtMoney(snapshot.totals.directReferralTotal)}` },
          { label: 'Admin / Ops Reserve', value: `PHP ${fmtMoney(snapshot.totals.adminExtraTotal)}` },
        ],
      },
      {
        key: 'serviceWallet',
        label: 'Service + Maintenance',
        value: `PHP ${fmtMoney(snapshot.wallets.serviceAndMaintenanceWallet.total)}`,
        color: '#34d399',
        description: 'Captured tax, processing, and system maintenance fees.',
        details: [
          { label: 'Tax', value: `PHP ${fmtMoney(snapshot.wallets.serviceAndMaintenanceWallet.taxAmount)}` },
          { label: 'Processing Fee', value: `PHP ${fmtMoney(snapshot.wallets.serviceAndMaintenanceWallet.processingFee)}` },
          { label: 'Maintenance Fee', value: `PHP ${fmtMoney(snapshot.wallets.serviceAndMaintenanceWallet.maintenanceFee)}` },
          { label: 'Total Wallet', value: `PHP ${fmtMoney(snapshot.wallets.serviceAndMaintenanceWallet.total)}` },
        ],
      },
      {
        key: 'encashmentWallet',
        label: 'Encashment Requested',
        value: `PHP ${fmtMoney(snapshot.wallets.encashmentWallet.requestedAmount)}`,
        color: '#93c5fd',
        description: 'All encashment requests for the selected year.',
        details: [
          { label: 'Total Requests', value: fmtInt(snapshot.wallets.encashmentWallet.totalRequests) },
          { label: 'Requested Amount', value: `PHP ${fmtMoney(snapshot.wallets.encashmentWallet.requestedAmount)}` },
          { label: 'Net Payout', value: `PHP ${fmtMoney(snapshot.wallets.encashmentWallet.netPayout)}` },
          { label: 'Paid Out', value: `PHP ${fmtMoney(snapshot.wallets.encashmentWallet.paidOut)}` },
          { label: 'Pending Payout', value: `PHP ${fmtMoney(snapshot.wallets.encashmentWallet.pendingPayout)}` },
        ],
      },
      {
        key: 'cdRecovery',
        label: 'CD Recovery Wallet',
        value: `PHP ${fmtMoney(snapshot.wallets.cdRecoveryWallet.totalCdDeduction)}`,
        color: '#f59e0b',
        description: 'Recovered CD deductions collected during encashment.',
        details: [
          { label: 'Recovered CD Deductions', value: `PHP ${fmtMoney(snapshot.wallets.cdRecoveryWallet.totalCdDeduction)}` },
        ],
      },
      {
        key: 'projectedMargin',
        label: 'Projected Margin',
        value: `PHP ${fmtMoney(snapshot.totals.projectedOperatingMargin)}`,
        color: '#4ade80',
        description: 'Gross sales less the configured reserve buckets.',
        details: [
          { label: 'Gross Sales', value: `PHP ${fmtMoney(snapshot.totals.grossSales)}` },
          { label: 'Expense Reserve', value: `PHP ${fmtMoney(snapshot.totals.expenseReserveWallet)}` },
          { label: 'Projected Margin', value: `PHP ${fmtMoney(snapshot.totals.projectedOperatingMargin)}` },
        ],
      },
    ];
  }, [snapshot]);

  const selectedCard = useMemo(
    () => summaryCards.find((card) => card.key === selectedPanel) || summaryCards[0] || null,
    [selectedPanel, summaryCards]
  );

  const selectedPackage = useMemo(
    () => (snapshot?.packageRows || []).find((row) => Number(row.packageType) === Number(selectedPackageType)) || null,
    [selectedPackageType, snapshot]
  );

  const detailPanel = selectedPackage
    ? {
      title: `${selectedPackage.packageLabel} package breakdown`,
      subtitle: 'This package row shows the reserve math per code and in aggregate for the selected year.',
      details: [
        { label: 'Codes Used', value: fmtInt(selectedPackage.soldCount) },
        { label: 'Gross Sales', value: `PHP ${fmtMoney(selectedPackage.grossSales)}` },
        { label: 'Product Cost / Code', value: `PHP ${fmtMoney(selectedPackage.productCost)}` },
        { label: 'Sales Match Reserve / Code', value: `PHP ${fmtMoney(selectedPackage.salesMatchCeiling)}` },
        { label: 'Direct Referral / Code', value: `PHP ${fmtMoney(selectedPackage.directReferralFixed)}` },
        { label: 'Admin / Ops Reserve / Code', value: `PHP ${fmtMoney(selectedPackage.adminExtraCost)}` },
        { label: 'Reserve / Code', value: `PHP ${fmtMoney(selectedPackage.reservePerCode)}` },
        { label: 'Reserve Total', value: `PHP ${fmtMoney(selectedPackage.reserveTotal)}` },
        { label: 'Projected Margin', value: `PHP ${fmtMoney(selectedPackage.projectedOperatingMargin)}` },
      ],
    }
    : selectedCard
      ? {
        title: selectedCard.label,
        subtitle: selectedCard.description,
        details: selectedCard.details,
      }
      : null;

  return (
    <div className="space-y-6 max-w-none">
      <div className="mb-1">
        <h1 className="font-display text-2xl font-bold text-white">Finance Accounting</h1>
        <div className="w-12 h-0.5 mt-2" style={{ background: 'linear-gradient(90deg,#D4AF37,transparent)' }} />
      </div>

      <div className="glass-card rounded-2xl p-5">
        <div className="flex flex-col 2xl:flex-row 2xl:items-end gap-4 2xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold text-white">Annual accounting workspace</p>
            <p className="text-xs mt-1 leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
              This workspace tracks package sales, reserve buckets, encashment obligations, service-fee capture, and the manual admin or ops reserve per package.
              {' '}<span className="text-white/75 font-medium">Admin / Ops Reserve</span> is the extra amount you intentionally set aside for handling, freight, support, packaging, and other operating costs not already covered by product cost, direct referral, or SMB reserve.
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="label">Year</label>
              <input
                type="number"
                min="2000"
                value={year}
                onChange={(event) => setYear(Number(event.target.value || currentYear()))}
                className="glass-input rounded-xl px-4 py-2.5 text-sm mt-1.5 w-[140px]"
              />
            </div>
            <button onClick={() => loadFinance(year)} className="gold-btn rounded-xl py-2.5 px-5 text-sm">
              Load Year
            </button>
            <button
              type="button"
              onClick={() => handleExport('xlsx')}
              disabled={exporting === 'xlsx'}
              className="rounded-xl py-2.5 px-5 text-sm font-medium border disabled:opacity-50"
              style={{ borderColor: 'rgba(59,130,246,0.22)', color: '#93c5fd', background: 'rgba(59,130,246,0.08)' }}
            >
              {exporting === 'xlsx' ? 'Exporting...' : 'Export XLSX'}
            </button>
            <button
              type="button"
              onClick={() => handleExport('pdf')}
              disabled={exporting === 'pdf'}
              className="rounded-xl py-2.5 px-5 text-sm font-medium border disabled:opacity-50"
              style={{ borderColor: 'rgba(16,185,129,0.22)', color: '#6ee7b7', background: 'rgba(16,185,129,0.08)' }}
            >
              {exporting === 'pdf' ? 'Preparing PDF...' : 'Export PDF'}
            </button>
          </div>
        </div>
      </div>

      {summaryCards.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-3">
          {summaryCards.map((card) => {
            const active = !selectedPackage && selectedPanel === card.key;
            return (
              <button
                key={card.key}
                type="button"
                onClick={() => {
                  setSelectedPackageType(null);
                  setSelectedPanel(card.key);
                }}
                className="glass-card rounded-2xl p-4 text-left motion-safe:transition-all"
                style={{
                  border: active ? '1px solid rgba(212,175,55,0.3)' : '1px solid rgba(255,255,255,0.08)',
                  background: active ? 'rgba(212,175,55,0.08)' : undefined,
                }}
              >
                <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>{card.label}</p>
                <p className="text-lg font-bold" style={{ color: card.color }}>{card.value}</p>
                <p className="text-[11px] mt-2 leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>{card.description}</p>
              </button>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-6 items-start">
        <div className="glass-card rounded-2xl p-6 overflow-hidden">
          <div className="flex items-center justify-between mb-4 gap-4">
            <div>
              <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.45)' }}>
                Package accounting breakdown
              </p>
              <p className="text-xs mt-1 leading-relaxed" style={{ color: 'rgba(255,255,255,0.35)' }}>
                Direct referral stays fixed at 10% of package amount. Admin / Ops Reserve is the manual reserve bucket you control per code.
              </p>
            </div>
            <span className="text-xs text-right" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Click a package name to inspect its full breakdown.
            </span>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-4" style={{ borderColor: 'rgba(212,175,55,0.15)', borderTopColor: 'rgba(212,175,55,0.75)' }} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    {[
                      'Package',
                      'Codes Used',
                      'Gross Sales',
                      'Product Cost',
                      'Sales Match Reserve',
                      'Direct Referral',
                      'Admin / Ops Reserve',
                      'Reserve / Code',
                      'Reserve Total',
                      'Projected Margin',
                      'Notes',
                      'Save',
                    ].map((header) => (
                      <th key={header} className="table-header py-3 px-3 text-left font-semibold text-xs uppercase tracking-wide">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(snapshot?.packageRows || []).map((row, index) => {
                    const draft = drafts[row.packageType] || {};
                    const active = Number(selectedPackageType) === Number(row.packageType);
                    return (
                      <tr
                        key={row.packageType}
                        style={{
                          background: active
                            ? 'rgba(212,175,55,0.06)'
                            : index % 2 === 0
                              ? 'rgba(255,255,255,0.02)'
                              : 'transparent',
                        }}
                      >
                        <td className="py-3 px-3">
                          <button
                            type="button"
                            onClick={() => setSelectedPackageType(row.packageType)}
                            className="font-semibold text-left"
                            style={{ color: active ? '#F9E08A' : '#ffffff' }}
                          >
                            {row.packageLabel}
                          </button>
                        </td>
                        <td className="py-3 px-3 text-white/70">{fmtInt(row.soldCount)}</td>
                        <td className="py-3 px-3 text-white/85">PHP {fmtMoney(row.grossSales)}</td>
                        <td className="py-3 px-3 min-w-[140px]">
                          <input
                            type="number"
                            value={draft.productCost ?? 0}
                            onChange={(event) => updateDraft(row.packageType, 'productCost', event.target.value)}
                            className="glass-input rounded-xl px-3 py-2 text-xs w-full"
                          />
                        </td>
                        <td className="py-3 px-3 min-w-[160px]">
                          <input
                            type="number"
                            value={draft.salesMatchCeiling ?? row.salesMatchCeiling}
                            onChange={(event) => updateDraft(row.packageType, 'salesMatchCeiling', event.target.value)}
                            className="glass-input rounded-xl px-3 py-2 text-xs w-full"
                          />
                        </td>
                        <td className="py-3 px-3 text-amber-300">PHP {fmtMoney(row.directReferralFixed)}</td>
                        <td className="py-3 px-3 min-w-[150px]">
                          <input
                            type="number"
                            value={draft.adminExtraCost ?? 0}
                            onChange={(event) => updateDraft(row.packageType, 'adminExtraCost', event.target.value)}
                            className="glass-input rounded-xl px-3 py-2 text-xs w-full"
                          />
                        </td>
                        <td className="py-3 px-3 text-white/80">PHP {fmtMoney(row.reservePerCode)}</td>
                        <td className="py-3 px-3 text-rose-200">PHP {fmtMoney(row.reserveTotal)}</td>
                        <td className="py-3 px-3 text-emerald-300">PHP {fmtMoney(row.projectedOperatingMargin)}</td>
                        <td className="py-3 px-3 min-w-[220px]">
                          <input
                            type="text"
                            value={draft.notes ?? ''}
                            onChange={(event) => updateDraft(row.packageType, 'notes', event.target.value)}
                            className="glass-input rounded-xl px-3 py-2 text-xs w-full"
                            placeholder="Internal notes"
                          />
                        </td>
                        <td className="py-3 px-3">
                          <button
                            type="button"
                            onClick={() => saveDraft(row.packageType)}
                            disabled={savingPackage === row.packageType}
                            className="rounded-xl py-2 px-3 text-xs font-medium border disabled:opacity-50"
                            style={{ borderColor: 'rgba(212,175,55,0.22)', color: '#D4AF37', background: 'rgba(212,175,55,0.08)' }}
                          >
                            {savingPackage === row.packageType ? 'Saving...' : 'Save'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="glass-card rounded-2xl p-5 xl:sticky xl:top-24">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <p className="text-sm font-semibold text-white">{detailPanel?.title || 'Finance details'}</p>
              <p className="text-xs mt-1 leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
                {detailPanel?.subtitle || 'Select a card or package row to inspect its reserve math and export actions.'}
              </p>
            </div>
          </div>

          <DetailList items={detailPanel?.details || []} />

          <div className="mt-4 rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'rgba(212,175,55,0.7)' }}>
              Quick actions
            </p>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => handleExport('xlsx')}
                disabled={Boolean(exporting)}
                className="rounded-xl py-2.5 px-4 text-sm font-medium border disabled:opacity-50"
                style={{ borderColor: 'rgba(59,130,246,0.22)', color: '#93c5fd', background: 'rgba(59,130,246,0.08)' }}
              >
                {exporting === 'xlsx' ? 'Exporting XLSX...' : 'Export current year to XLSX'}
              </button>
              <button
                type="button"
                onClick={() => handleExport('pdf')}
                disabled={Boolean(exporting)}
                className="rounded-xl py-2.5 px-4 text-sm font-medium border disabled:opacity-50"
                style={{ borderColor: 'rgba(16,185,129,0.22)', color: '#6ee7b7', background: 'rgba(16,185,129,0.08)' }}
              >
                {exporting === 'pdf' ? 'Preparing PDF report...' : 'Export current year to PDF'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
