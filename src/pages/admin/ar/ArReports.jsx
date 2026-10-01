import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { HiOutlineDownload } from 'react-icons/hi';
import { arApi, MODE_LABELS, PageHeader, FilterPill, peso, errorText, BTN_PRIMARY, BTN_SECONDARY, MONEY } from './arShared';

function monthRange(offset = 0) {
  const now = new Date(Date.now() + 8 * 3600 * 1000); // Manila calendar
  const first = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offset, 1));
  const last = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offset + 1, 0));
  const iso = (d) => d.toISOString().slice(0, 10);
  return { from: iso(first), to: iso(last) };
}

function weekRange() {
  const now = new Date(Date.now() + 8 * 3600 * 1000);
  const day = (now.getUTCDay() + 6) % 7; // Monday = 0
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - day));
  const sunday = new Date(Date.UTC(monday.getUTCFullYear(), monday.getUTCMonth(), monday.getUTCDate() + 6));
  return { from: monday.toISOString().slice(0, 10), to: sunday.toISOString().slice(0, 10) };
}

// A blob response hides the server's JSON error body inside the Blob, so read it back out.
async function exportErrorText(err, fallback) {
  const data = err?.response?.data;
  if (typeof Blob !== 'undefined' && data instanceof Blob) {
    try {
      const parsed = JSON.parse(await data.text());
      if (parsed && typeof parsed.error === 'string' && parsed.error) return parsed.error;
    } catch { /* not JSON: use the fallback */ }
    return fallback;
  }
  return errorText(err, fallback);
}

export default function ArReports() {
  const [range, setRange] = useState(monthRange(0));
  // The range the shown report was BUILT with. Export and the "stale" check use this, never the live inputs.
  const [built, setBuilt] = useState(null); // { range, data }
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const loadingRef = useRef(false);
  const exportingRef = useRef(false);

  const report = built?.data || null;
  const stale = Boolean(built) && (built.range.from !== range.from || built.range.to !== range.to);

  async function run(next = range) {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setRange(next);
    setLoading(true);
    try {
      const data = await arApi.report(next);
      setBuilt({ range: { from: next.from, to: next.to }, data });
    } catch (err) {
      // Keeping the previous report would show numbers for a range the admin no longer has selected.
      setBuilt(null);
      toast.error(errorText(err, 'Could not build the report'));
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }

  async function exportXlsx() {
    if (!built || stale || exportingRef.current) return;
    exportingRef.current = true;
    setExporting(true);
    const { from, to } = built.range;
    try {
      const res = await arApi.exportReport({ from, to });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `AR-consolidation-${from}-to-${to}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(await exportErrorText(err, 'Export failed'));
    } finally {
      exportingRef.current = false;
      setExporting(false);
    }
  }

  const presets = [
    { label: 'This week', value: weekRange() },
    { label: 'This month', value: monthRange(0) },
    { label: 'Last month', value: monthRange(-1) },
  ];

  return (
    <div>
      <PageHeader title="AR Consolidation" subtitle="Completed ARs only; void ARs are excluded and legacy paper ARs count on their paper date.">
        <button type="button" onClick={exportXlsx} disabled={!report || stale || exporting} aria-busy={exporting} className={BTN_SECONDARY}>
          <HiOutlineDownload aria-hidden="true" /> {exporting ? 'Exporting...' : 'Export to Excel'}
        </button>
      </PageHeader>

      <div className="glass-card mb-5 space-y-4 rounded-2xl p-4">
        <div role="group" aria-label="Date presets" className="flex flex-wrap gap-2">
          {presets.map((p) => (
            <FilterPill key={p.label} active={range.from === p.value.from && range.to === p.value.to} disabled={loading} onClick={() => run(p.value)}>
              {p.label}
            </FilterPill>
          ))}
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="label" htmlFor="rep-from">From</label>
            <input id="rep-from" type="date" className="glass-input mt-1.5 min-h-[44px] w-44 rounded-xl px-3 text-sm" value={range.from} onChange={(e) => setRange({ ...range, from: e.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="rep-to">To</label>
            <input id="rep-to" type="date" className="glass-input mt-1.5 min-h-[44px] w-44 rounded-xl px-3 text-sm" value={range.to} onChange={(e) => setRange({ ...range, to: e.target.value })} />
          </div>
          <button type="button" onClick={() => run(range)} disabled={loading} aria-busy={loading} className={BTN_PRIMARY}>
            {loading ? 'Building...' : 'Build report'}
          </button>
        </div>
      </div>

      {report && stale && (
        <p className="portal-warning-chip mb-4 rounded-xl p-3 text-sm" role="status">
          The report below is for {built.range.from} to {built.range.to}. The dates have changed, so press Build report to match them before exporting.
        </p>
      )}

      {report && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Stat label="ARs" value={Number(report.totals.receipts).toLocaleString('en-PH')} />
            <Stat label="Sales" value={peso(report.totals.total)} />
            <Stat label="Stockist discounts given" value={peso(report.totals.discounts)} />
          </div>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <Table title="By leader (sponsor and binary trees, side by side)" rows={report.byLeader} cols={[
              ['Tree', (r) => (r.tree === 'sponsor' ? 'Sponsor' : 'Binary')], ['Leader', (r) => r.leader], ['ARs', (r) => r.receipts, 'right'], ['Total', (r) => peso(r.total), 'right'],
            ]} />
            <Table title="By center" rows={report.byCenter} cols={[['Center', (r) => r.center], ['ARs', (r) => r.receipts, 'right'], ['Total', (r) => peso(r.total), 'right']]} />
            <Table title="By cashier" rows={report.byCashier} cols={[['Cashier', (r) => r.cashier], ['ARs', (r) => r.receipts, 'right'], ['Total', (r) => peso(r.total), 'right']]} />
            <Table title="By mode" rows={report.byMode} cols={[['Mode', (r) => MODE_LABELS[r.mode] || r.mode], ['ARs', (r) => r.receipts, 'right'], ['Total', (r) => peso(r.total), 'right']]} />
          </div>
          <Table title="By buyer" rows={report.byBuyer} cols={[
            ['Buyer', (r) => r.buyer_name], ['Sponsor leader', (r) => r.sponsor_leader || '-'], ['Binary leader', (r) => r.binary_leader || '-'],
            ['ARs', (r) => r.receipts, 'right'], ['Total', (r) => peso(r.total), 'right'],
          ]} />
          <p className="portal-field-hint text-xs">Each sale appears once under its sponsor-tree leader and once under its binary-tree leader, so the two trees are totalled separately - never add them together.</p>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="glass-card rounded-2xl p-4">
      <p className="portal-card-muted text-xs uppercase tracking-wide">{label}</p>
      <p className={`portal-card-title mt-1 text-xl font-bold ${MONEY}`}>{value}</p>
    </div>
  );
}

function Table({ title, rows, cols }) {
  return (
    <div className="glass-card overflow-x-auto rounded-2xl">
      <h2 className="portal-card-title px-4 pt-4 font-semibold">{title}</h2>
      <table className="mt-2 w-full text-sm">
        <thead><tr className="table-header">{cols.map(([h, , align]) => <th key={h} className={`px-4 py-2 ${align === 'right' ? 'text-right' : 'text-left'}`}>{h}</th>)}</tr></thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan={cols.length} className="portal-card-muted p-4 text-center">No sales in this range.</td></tr>}
          {rows.map((r, i) => (
            <tr key={i} className="portal-zebra-row">
              {cols.map(([h, get, align]) => <td key={h} className={`portal-card-text px-4 py-2 ${align === 'right' ? `text-right ${MONEY}` : ''}`}>{get(r)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
