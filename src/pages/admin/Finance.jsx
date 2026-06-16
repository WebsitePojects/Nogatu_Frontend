import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../api';
import { useTheme } from '../../contexts/ThemeContext';
import { apiUrl } from '../../utils/apiBase';

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

function BarChartCard({ title, subtitle, rows = [] }) {
  const maxValue = Math.max(1, ...rows.map((row) => Number(row.value || 0)));
  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="mb-4">
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>{subtitle}</p>
      </div>
      <div className="space-y-3">
        {rows.map((row) => {
          const width = Math.max(4, Math.round((Number(row.value || 0) / maxValue) * 100));
          return (
            <div key={row.label}>
              <div className="flex items-center justify-between gap-3 mb-1.5">
                <span className="text-xs font-medium text-white/75">{row.label}</span>
                <span className="text-xs font-semibold" style={{ color: row.color || '#D4AF37' }}>{row.valueLabel}</span>
              </div>
              <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.04)' }}>
                <div
                  className="h-full rounded-full motion-safe:transition-all"
                  style={{
                    width: `${width}%`,
                    background: row.color || '#D4AF37',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Finance() {
  const { isDarkMode } = useTheme();
  const [year, setYear] = useState(currentYear());
  const [loading, setLoading] = useState(true);
  const [savingPackage, setSavingPackage] = useState(null);
  const [exporting, setExporting] = useState('');
  const [snapshot, setSnapshot] = useState(null);
  const [drafts, setDrafts] = useState({});
  const [selectedPanel, setSelectedPanel] = useState('expenseReserve');
  const headingText = isDarkMode ? '#ffffff' : '#111827';
  const strongText = isDarkMode ? 'rgba(255,255,255,0.85)' : '#334155';
  const softText = isDarkMode ? 'rgba(255,255,255,0.7)' : '#475569';
  const packageIdleText = isDarkMode ? '#ffffff' : '#334155';
  const directReferralText = isDarkMode ? '#fcd34d' : '#9a6700';
  const reserveTotalText = isDarkMode ? '#fecdd3' : '#be185d';
  const marginText = isDarkMode ? '#86efac' : '#047857';
  const saveText = isDarkMode ? '#D4AF37' : '#7a5c08';

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
      triggerBrowserDownload(apiUrl(`/admin/finance/export?year=${year}&format=${format}`));
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

  const packageBreakdowns = useMemo(
    () => (snapshot?.packageRows || []).map((row) => ({
      packageType: row.packageType,
      title: `${row.packageLabel} package breakdown`,
      details: [
        { label: 'Codes Used', value: fmtInt(row.soldCount) },
        { label: 'Gross Sales', value: `PHP ${fmtMoney(row.grossSales)}` },
        { label: 'Product Cost / Code', value: `PHP ${fmtMoney(row.productCost)}` },
        { label: 'Sales Match Reserve / Code', value: `PHP ${fmtMoney(row.salesMatchCeiling)}` },
        { label: 'Direct Referral / Code', value: `PHP ${fmtMoney(row.directReferralFixed)}` },
        { label: 'Admin / Ops Reserve / Code', value: `PHP ${fmtMoney(row.adminExtraCost)}` },
        { label: 'Reserve / Code', value: `PHP ${fmtMoney(row.reservePerCode)}` },
        { label: 'Reserve Total', value: `PHP ${fmtMoney(row.reserveTotal)}` },
        { label: 'Projected Margin', value: `PHP ${fmtMoney(row.projectedOperatingMargin)}` },
      ],
    })),
    [snapshot]
  );

  const selectedSummaryPanel = selectedCard
    ? {
      title: selectedCard.label,
      subtitle: selectedCard.description,
      details: selectedCard.details,
    }
    : null;

  const packageGraphRows = useMemo(
    () => (snapshot?.packageRows || []).map((row) => ({
      label: row.packageLabel,
      value: Number(row.grossSales || 0),
      valueLabel: `PHP ${fmtMoney(row.grossSales)}`,
      color: '#D4AF37',
    })),
    [snapshot]
  );

  const walletGraphRows = useMemo(() => {
    if (!snapshot?.wallets) return [];
    return [
      {
        label: 'Expense Reserve',
        value: Number(snapshot.wallets.expenseReserveWallet || 0),
        valueLabel: `PHP ${fmtMoney(snapshot.wallets.expenseReserveWallet)}`,
        color: '#f59e0b',
      },
      {
        label: 'Encashment Requested',
        value: Number(snapshot.wallets.encashmentWallet?.requestedAmount || 0),
        valueLabel: `PHP ${fmtMoney(snapshot.wallets.encashmentWallet?.requestedAmount)}`,
        color: '#60a5fa',
      },
      {
        label: 'Service + Maintenance',
        value: Number(snapshot.wallets.serviceAndMaintenanceWallet?.total || 0),
        valueLabel: `PHP ${fmtMoney(snapshot.wallets.serviceAndMaintenanceWallet?.total)}`,
        color: '#34d399',
      },
      {
        label: 'CD Recovery',
        value: Number(snapshot.wallets.cdRecoveryWallet?.totalCdDeduction || 0),
        valueLabel: `PHP ${fmtMoney(snapshot.wallets.cdRecoveryWallet?.totalCdDeduction)}`,
        color: '#f472b6',
      },
    ];
  }, [snapshot]);

  return (
    <div className="space-y-6 max-w-none">
      <div className="mb-1">
        <h1 className="font-display text-2xl font-bold" style={{ color: headingText }}>Finance Accounting</h1>
        <div className="w-12 h-0.5 mt-2" style={{ background: 'linear-gradient(90deg,#D4AF37,transparent)' }} />
      </div>

      <div className="glass-card rounded-2xl p-5">
        <div className="flex flex-col 2xl:flex-row 2xl:items-end gap-4 2xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold text-white">Annual accounting workspace</p>
            <p className="text-xs mt-1 leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
              This workspace tracks package sales, reserve buckets, encashment obligations, service-fee capture, and the manual admin or ops reserve per package.
              {' '}<span className="text-white/75 font-medium">Admin / Ops Reserve</span> is the extra amount you intentionally set aside for handling, freight, support, packaging, and other operating costs not already covered by product cost, direct referral, or SMB reserve.
              {' '}Custom budget columns let you add package-specific reserve wallets for any other operating or product budget you want to track.
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
            <button onClick={() => loadFinance(year)} className="gold-btn rounded-xl py-2.5 px-5 text-sm" type="button">
              Load Year
            </button>
            <button
              type="button"
              onClick={() => handleExport('csv')}
              disabled={exporting === 'csv'}
              className="rounded-xl py-2.5 px-5 text-sm font-medium border disabled:opacity-50"
              style={{ borderColor: 'rgba(59,130,246,0.22)', color: '#93c5fd', background: 'rgba(59,130,246,0.08)' }}
            >
              {exporting === 'csv' ? 'Exporting...' : 'Export CSV'}
            </button>
          </div>
        </div>
      </div>

      {summaryCards.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-3">
          {summaryCards.map((card) => {
            const active = selectedPanel === card.key;
            return (
              <button
                key={card.key}
                type="button"
                onClick={() => setSelectedPanel(card.key)}
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

      {(packageGraphRows.length > 0 || walletGraphRows.length > 0) && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <BarChartCard
            title="Package Sales Graph"
            subtitle="Zoho-inspired view of which packages are carrying the gross package sales for the selected year."
            rows={packageGraphRows}
          />
          <BarChartCard
            title="Wallet Allocation Graph"
            subtitle="Reserve and payout buckets derived from the accounting snapshot and existing encashment records."
            rows={walletGraphRows}
          />
        </div>
      )}

      <div className="space-y-6">
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
              Every package&apos;s full breakdown is shown below.
            </span>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full size-8 border-4" style={{ borderColor: 'rgba(212,175,55,0.15)', borderTopColor: 'rgba(212,175,55,0.75)' }} />
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
                      <th key={header} className="table-header p-3 text-left font-semibold text-xs uppercase tracking-wide">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(snapshot?.packageRows || []).map((row, index) => {
                    const draft = drafts[row.packageType] || {};
                    return (
                      <tr
                        key={row.packageType}
                        style={{
                          background: index % 2 === 0
                            ? 'rgba(255,255,255,0.02)'
                            : 'transparent',
                        }}
                      >
                        <td className="p-3">
                          <span className="font-semibold" style={{ color: packageIdleText }}>
                            {row.packageLabel}
                          </span>
                        </td>
                        <td className="p-3" style={{ color: softText }}>{fmtInt(row.soldCount)}</td>
                        <td className="p-3" style={{ color: strongText }}>PHP {fmtMoney(row.grossSales)}</td>
                        <td className="p-3 min-w-[140px]">
                          <input
                            type="number"
                            value={draft.productCost ?? 0}
                            onChange={(event) => updateDraft(row.packageType, 'productCost', event.target.value)}
                            className="glass-input rounded-xl px-3 py-2 text-xs w-full"
                          />
                        </td>
                        <td className="p-3 min-w-[160px]">
                          <input
                            type="number"
                            value={draft.salesMatchCeiling ?? row.salesMatchCeiling}
                            onChange={(event) => updateDraft(row.packageType, 'salesMatchCeiling', event.target.value)}
                            className="glass-input rounded-xl px-3 py-2 text-xs w-full"
                          />
                        </td>
                        <td className="p-3 font-medium" style={{ color: directReferralText }}>PHP {fmtMoney(row.directReferralFixed)}</td>
                        <td className="p-3 min-w-[150px]">
                          <input
                            type="number"
                            value={draft.adminExtraCost ?? 0}
                            onChange={(event) => updateDraft(row.packageType, 'adminExtraCost', event.target.value)}
                            className="glass-input rounded-xl px-3 py-2 text-xs w-full"
                          />
                        </td>
                        <td className="p-3" style={{ color: strongText }}>PHP {fmtMoney(row.reservePerCode)}</td>
                        <td className="p-3 font-medium" style={{ color: reserveTotalText }}>PHP {fmtMoney(row.reserveTotal)}</td>
                        <td className="p-3 font-medium" style={{ color: marginText }}>PHP {fmtMoney(row.projectedOperatingMargin)}</td>
                        <td className="p-3 min-w-[220px]">
                          <input
                            type="text"
                            value={draft.notes ?? ''}
                            onChange={(event) => updateDraft(row.packageType, 'notes', event.target.value)}
                            className="glass-input rounded-xl px-3 py-2 text-xs w-full"
                            placeholder="Internal notes"
                          />
                        </td>
                        <td className="p-3">
                          <button
                            type="button"
                            onClick={() => saveDraft(row.packageType)}
                            disabled={savingPackage === row.packageType}
                            className="rounded-xl py-2 px-3 text-xs font-medium border disabled:opacity-50"
                            style={{ borderColor: 'rgba(212,175,55,0.22)', color: saveText, background: 'rgba(212,175,55,0.08)' }}
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

        <div className="grid grid-cols-1 2xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)] gap-6 items-start">
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <p className="text-sm font-semibold text-white">{selectedSummaryPanel?.title || 'Finance calculations'}</p>
                <p className="text-xs mt-1 leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  {selectedSummaryPanel?.subtitle || 'Select a top finance card to inspect the calculation summary for that bucket.'}
                </p>
              </div>
            </div>

            <DetailList items={selectedSummaryPanel?.details || []} />

            <div className="mt-4 rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'rgba(212,175,55,0.7)' }}>
                Quick actions
              </p>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleExport('csv')}
                  disabled={Boolean(exporting)}
                  className="rounded-xl py-2.5 px-4 text-sm font-medium border disabled:opacity-50"
                  style={{ borderColor: 'rgba(59,130,246,0.22)', color: '#93c5fd', background: 'rgba(59,130,246,0.08)' }}
                >
                  {exporting === 'csv' ? 'Exporting CSV...' : 'Export current year to CSV'}
                </button>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <p className="text-sm font-semibold text-white">Package breakdowns</p>
                <p className="text-xs mt-1 leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  Full reserve math for every package in the selected year.
                </p>
              </div>
            </div>

            <div className="space-y-5">
              {packageBreakdowns.length === 0 ? (
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  No package data for this year.
                </p>
              ) : (
                packageBreakdowns.map((pkg) => (
                  <div key={pkg.packageType}>
                    <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'rgba(212,175,55,0.8)' }}>
                      {pkg.title}
                    </p>
                    <DetailList items={pkg.details} />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
