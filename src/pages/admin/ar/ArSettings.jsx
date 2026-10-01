import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import {
  arApi, MODE_LABELS, STOCKIST_LABELS, PageHeader, ConfirmDialog, ErrorState, peso, formatArNo, errorText, useIntentKey, moveSelection,
  BTN_PRIMARY, BTN_SECONDARY, BTN_DANGER, FOCUS_RING,
} from './arShared';

const TABS = [
  ['sequence', 'AR numbering'],
  ['prices', 'Price list'],
  ['discounts', 'Stockist discounts'],
  ['stockists', 'Stockists'],
  ['cashiers', 'Cashiers'],
  ['legacy', 'Encode paper AR'],
];
const TAB_KEYS = TABS.map(([key]) => key);
const PACKAGE_TYPES = [10, 20, 30, 40, 50, 60];
const PAPER_AR_NO = /^\d{4,20}$/; // mirrors isValidArNo on the server

// Receipts print year + zero-padded sequence (2026-004513), so show that, not the bare counter.
// Manila year, like the server, so the preview matches at the new-year boundary.
const printedArNo = (seq) => formatArNo(`${new Date(Date.now() + 8 * 3600 * 1000).getUTCFullYear()}${String(seq).padStart(6, '0')}`);

const PACKAGE_NAMES = { 10: 'Bronze', 20: 'Silver', 30: 'Gold', 40: 'Platinum', 50: 'Garnet', 60: 'Diamond' };

export default function ArSettings() {
  const [tab, setTab] = useState('sequence');
  return (
    <div>
      <PageHeader title="AR Settings" subtitle="Super Admin only. Every change here is recorded with who made it and the before/after values. Past ARs keep the prices they were created with." />
      <div className="glass-card mb-5 flex flex-wrap items-center gap-2 rounded-2xl p-2" role="tablist" aria-label="AR settings">
        {TABS.map(([key, label]) => (
          <button key={key} type="button" role="tab" data-key={key} aria-selected={tab === key} tabIndex={tab === key ? 0 : -1}
            onClick={() => setTab(key)} onKeyDown={(e) => moveSelection(e, TAB_KEYS, tab, setTab)}
            className={`${tab === key ? 'portal-accent-chip' : 'portal-card-muted border border-transparent'} min-h-[44px] rounded-lg border px-4 text-sm font-semibold ${FOCUS_RING}`}>
            {label}
          </button>
        ))}
      </div>
      {tab === 'sequence' && <SequenceTab />}
      {tab === 'prices' && <PricesTab />}
      {tab === 'discounts' && <DiscountsTab />}
      {tab === 'stockists' && <StockistsTab />}
      {tab === 'cashiers' && <CashiersTab />}
      {tab === 'legacy' && <LegacyTab />}
    </div>
  );
}

function UnsavedChip() {
  return <span className="portal-warning-chip ml-2 inline-block rounded-full px-2 text-xs font-semibold whitespace-nowrap">Unsaved</span>;
}

// Returns [data, reload, error]. A failed load clears data and sets error, so callers show a retry
// instead of an endless "Loading..." or an empty list that reads as "nothing configured".
function useLoad(fetcher) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const reload = useCallback(async () => {
    setError('');
    try {
      setData(await fetcher());
    } catch (err) {
      setData(null);
      setError(errorText(err, 'Could not load'));
      toast.error(errorText(err, 'Could not load'));
    }
  }, [fetcher]);
  useEffect(() => { reload(); }, [reload]);
  return [data, reload, error];
}

function SequenceTab() {
  const [status, reload, error] = useLoad(arApi.sequence);
  const [value, setValue] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const intent = useIntentKey();
  async function save() {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      await arApi.seed(Number(value), intent.keyFor({ value }));
      intent.reset();
      toast.success('AR numbering set');
      setConfirm(false);
      reload();
    } catch (err) {
      toast.error(errorText(err, 'Could not set the numbering'));
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!status) return <p className="portal-card-muted text-sm">Loading...</p>;
  const valid = /^\d{1,9}$/.test(value);
  return (
    <div className="glass-card max-w-xl rounded-2xl p-5">
      {status.seeded ? (
        <p className="portal-card-text text-sm">Next AR number: <strong className="portal-gold-text font-mono">{printedArNo(status.next_seq)}</strong> (set by {status.seeded_by} from paper AR {status.seeded_from}).</p>
      ) : (
        <p className="portal-warning-text text-sm font-semibold">Not set yet. No AR can be created until you enter the latest paper AR number.</p>
      )}
      {status.locked ? (
        <p className="portal-card-muted mt-3 text-sm">Locked: live ARs have been issued, so the numbering can no longer be changed.</p>
      ) : (
        <div className="mt-4">
          <label className="label" htmlFor="seq">Latest paper AR number</label>
          <div className="mt-1.5 flex gap-2">
            <input id="seq" inputMode="numeric" className="glass-input min-h-[44px] w-full rounded-xl px-4 py-2.5 text-sm" value={value} onChange={(e) => setValue(e.target.value.replace(/\D/g, ''))} placeholder="e.g. 4512" />
            <button type="button" disabled={!valid || busy} onClick={() => setConfirm(true)} className={BTN_PRIMARY}>{busy ? 'Setting...' : 'Set'}</button>
          </div>
          <p className="portal-field-hint mt-1 text-xs">The first system AR will continue from the next number. This can only be changed until the first AR is issued.</p>
        </div>
      )}
      <ConfirmDialog open={confirm} title="Set AR numbering?" confirmLabel="Set numbering" busy={busy} onCancel={() => !busy && setConfirm(false)} onConfirm={save}>
        <p>The next AR will be number <strong>{valid ? printedArNo(Number(value) + 1) : ''}</strong>. Once the first AR is issued this cannot be changed.</p>
      </ConfirmDialog>
    </div>
  );
}

function PricesTab() {
  const [rows, reload, error] = useLoad(arApi.prices);
  const [edits, setEdits] = useState({});
  const [saving, setSaving] = useState(null);
  const savingRef = useRef(false);
  const edit = (pt, field, value) => setEdits((e) => ({ ...e, [pt]: { ...e[pt], [field]: value } }));
  async function save(row) {
    if (savingRef.current) return;
    const e = edits[row.producttype] || {};
    savingRef.current = true;
    setSaving(row.producttype);
    try {
      await arApi.savePrice({
        producttype: row.producttype, itemName: row.item_name,
        memberPrice: e.member_price ?? row.member_price, stockistPrice: e.stockist_price ?? row.stockist_price, srp: e.srp ?? row.srp,
        active: e.active ?? Number(row.active) === 1,
      });
      setEdits((x) => { const n = { ...x }; delete n[row.producttype]; return n; });
      toast.success(`${row.item_name} saved`);
      reload();
    } catch (err) {
      toast.error(errorText(err, 'Could not save'));
    } finally {
      savingRef.current = false;
      setSaving(null);
    }
  }
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!rows) return <p className="portal-card-muted text-sm">Loading...</p>;
  if (rows.length === 0) return <p className="portal-warning-text text-sm">The price list is empty. On staging, run the AR staging setup script to load starting prices.</p>;
  return (
    <div className="glass-card overflow-x-auto rounded-2xl">
      <table className="w-full text-sm">
        <thead><tr className="table-header">
          <th className="px-3 py-2 text-left">Item</th><th className="px-3 py-2 text-right">Member</th><th className="px-3 py-2 text-right">Stockist</th>
          <th className="px-3 py-2 text-right">SRP</th><th className="px-3 py-2 text-center">Active</th><th className="px-3 py-2"><span className="sr-only">Save</span></th>
        </tr></thead>
        <tbody>
          {rows.map((row) => {
            const e = edits[row.producttype] || {};
            const dirty = Object.keys(e).length > 0;
            const money = (field) => (
              <input type="number" min="0" step="0.01" inputMode="decimal" aria-label={`${row.item_name} ${field.replace('_', ' ')}`}
                className="glass-input min-h-[44px] w-28 rounded-lg p-2 text-right text-sm tabular-nums" value={e[field] ?? row[field]} onChange={(ev) => edit(row.producttype, field, ev.target.value)} />
            );
            return (
              <tr key={row.producttype} className="portal-zebra-row" style={dirty ? { background: 'var(--portal-accent-bg)' } : undefined}>
                <td className="portal-card-text px-3 py-2">{row.item_name}{dirty && <UnsavedChip />}<span className="portal-card-muted block text-xs">code {row.producttype}{row.updated_by ? ` - last edit ${row.updated_by}` : ''}</span></td>
                <td className="px-3 py-2 text-right">{money('member_price')}</td>
                <td className="px-3 py-2 text-right">{money('stockist_price')}</td>
                <td className="px-3 py-2 text-right">{money('srp')}</td>
                <td className="px-3 py-2 text-center">
                  <label className="mx-auto flex size-11 cursor-pointer items-center justify-center">
                    <input type="checkbox" aria-label={`${row.item_name} active`} className="size-5" checked={e.active ?? Number(row.active) === 1} onChange={(ev) => edit(row.producttype, 'active', ev.target.checked)} />
                  </label>
                </td>
                <td className="px-3 py-2 text-right">
                  <button type="button" disabled={!dirty || saving !== null} onClick={() => save(row)} className={BTN_PRIMARY}>
                    {saving === row.producttype ? 'Saving...' : 'Save'}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function DiscountsTab() {
  const [rows, reload, error] = useLoad(arApi.discounts);
  const [draft, setDraft] = useState({});
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!rows) return <p className="portal-card-muted text-sm">Loading...</p>;
  const value = (type, pt) => draft[`${type}:${pt}`] ?? rows.find((r) => Number(r.stockist_type) === type && Number(r.producttype) === pt)?.peso_discount ?? 0;
  async function saveAll() {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      for (const [key, pesoDiscount] of Object.entries(draft)) {
        const [stockistType, producttype] = key.split(':').map(Number);
        await arApi.saveDiscount({ stockistType, producttype, pesoDiscount });
      }
      setDraft({});
      toast.success('Discounts saved');
      reload();
    } catch (err) {
      toast.error(errorText(err, 'Could not save discounts'));
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }
  return (
    <div className="glass-card overflow-x-auto rounded-2xl p-4">
      <p className="portal-card-muted mb-3 text-sm">Peso off each package when a registered stockist buys packages. Applies to {MODE_LABELS.package} ARs only and never stacks with member pricing.</p>
      <table className="w-full text-sm">
        <thead><tr className="table-header"><th className="px-3 py-2 text-left">Stockist</th>{PACKAGE_TYPES.map((pt) => <th key={pt} className="px-3 py-2 text-right">{PACKAGE_NAMES[pt]}</th>)}</tr></thead>
        <tbody>
          {[4, 3, 2].map((type) => {
            const rowEdited = PACKAGE_TYPES.some((pt) => `${type}:${pt}` in draft);
            return (
              <tr key={type} className="portal-zebra-row" style={rowEdited ? { background: 'var(--portal-accent-bg)' } : undefined}>
                <td className="portal-card-text px-3 py-2 font-semibold">{STOCKIST_LABELS[type]}{rowEdited && <UnsavedChip />}</td>
                {PACKAGE_TYPES.map((pt) => (
                  <td key={pt} className="px-3 py-2 text-right">
                    <input type="number" min="0" step="0.01" aria-label={`${STOCKIST_LABELS[type]} ${PACKAGE_NAMES[pt]} discount`}
                      className="glass-input min-h-[44px] w-24 rounded-lg p-2 text-right text-sm tabular-nums" value={value(type, pt)}
                      onChange={(e) => setDraft((d) => ({ ...d, [`${type}:${pt}`]: e.target.value }))} />
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
      <button type="button" disabled={busy || Object.keys(draft).length === 0} onClick={saveAll} className={`${BTN_PRIMARY} mt-4`}>
        {busy ? 'Saving...' : `Save ${Object.keys(draft).length || ''} change(s)`}
      </button>
    </div>
  );
}

function StockistsTab() {
  const [rows, reload, error] = useLoad(arApi.stockists);
  const [username, setUsername] = useState('');
  const [type, setType] = useState('4');
  const [busy, setBusy] = useState(null); // username being saved or removed
  const busyRef = useRef(false);
  async function save(u, t) {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(u);
    try {
      await arApi.saveStockist({ username: u, stockistType: Number(t) });
      toast.success(Number(t) ? `${u} saved as ${STOCKIST_LABELS[t]} stockist` : `${u} removed`);
      setUsername('');
      reload();
    } catch (err) {
      toast.error(errorText(err, 'Could not save'));
    } finally {
      busyRef.current = false;
      setBusy(null);
    }
  }
  return (
    <div className="space-y-5">
      <div className="glass-card flex flex-wrap items-end gap-3 rounded-2xl p-4">
        <div>
          <label className="label" htmlFor="st-user">Member username</label>
          <input id="st-user" className="glass-input min-h-[44px] mt-1.5 rounded-xl px-4 py-2.5 text-sm" value={username} onChange={(e) => setUsername(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="st-type">Type</label>
          <select id="st-type" className="glass-input min-h-[44px] mt-1.5 rounded-xl px-4 py-2.5 text-sm" value={type} onChange={(e) => setType(e.target.value)}>
            {[4, 3, 2].map((t) => <option key={t} value={t}>{STOCKIST_LABELS[t]}</option>)}
          </select>
        </div>
        <button type="button" disabled={busy !== null || !username.trim()} aria-busy={busy !== null} onClick={() => save(username.trim(), type)} className={BTN_PRIMARY}>
          {busy !== null && busy === username.trim() ? 'Saving...' : 'Add / update'}
        </button>
        <p className="portal-field-hint w-full text-xs">Used only for AR pricing. It does not change Global Bonus or any other income.</p>
      </div>
      <div className="glass-card overflow-x-auto rounded-2xl">
        <table className="w-full text-sm">
          <thead><tr className="table-header"><th className="px-3 py-2 text-left">Member</th><th className="px-3 py-2 text-left">Type</th><th className="px-3 py-2 text-left">Set by</th><th className="px-3 py-2"><span className="sr-only">Remove</span></th></tr></thead>
          <tbody>
            {error && <tr><td colSpan={4} className="px-3 py-4"><ErrorState message={error} onRetry={reload} /></td></tr>}
            {!rows && !error && <tr><td colSpan={4} className="portal-card-muted px-3 py-4 text-center">Loading...</td></tr>}
            {rows && rows.length === 0 && <tr><td colSpan={4} className="portal-card-muted px-3 py-4 text-center">No stockists registered for AR yet.</td></tr>}
            {rows?.map((r) => (
              <tr key={r.uid} className="portal-zebra-row">
                <td className="portal-card-text px-3 py-2">{r.full_name} <span className="portal-card-muted">({r.username})</span></td>
                <td className="portal-card-text px-3 py-2">{STOCKIST_LABELS[r.stockist_type]}</td>
                <td className="portal-card-muted px-3 py-2">{r.set_by}</td>
                <td className="px-3 py-2 text-right">
                  <button type="button" disabled={busy !== null} aria-busy={busy === r.username} onClick={() => save(r.username, 0)} className={BTN_DANGER}>
                    {busy === r.username ? 'Removing...' : 'Remove'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CashiersTab() {
  const [rows, reload, rowsError] = useLoad(arApi.cashiers);
  const [centers, reloadCenters, centersError] = useLoad(arApi.centers);
  const [busy, setBusy] = useState(null);
  const busyRef = useRef(false);
  async function assign(accessId, centerId) {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(accessId);
    try {
      await arApi.saveCashier({ accessId, centerId: centerId || null });
      toast.success('Cashier center saved');
      reload();
    } catch (err) {
      toast.error(errorText(err, 'Could not save'));
    } finally {
      busyRef.current = false;
      setBusy(null);
    }
  }
  if (rowsError || centersError) return <ErrorState message={rowsError || centersError} onRetry={() => { reload(); reloadCenters(); }} />;
  if (!rows || !centers) return <p className="portal-card-muted text-sm">Loading...</p>;
  return (
    <div className="glass-card overflow-x-auto rounded-2xl">
      <p className="portal-card-muted px-4 pt-4 text-sm">Each cashier prepares ARs for one center. A cashier without a center cannot create ARs. Create new cashier logins in Access Accounts.</p>
      <table className="mt-2 w-full text-sm">
        <thead><tr className="table-header"><th className="px-3 py-2 text-left">Account</th><th className="px-3 py-2 text-left">Role</th><th className="px-3 py-2 text-left">Center</th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="portal-zebra-row">
              <td className="portal-card-text px-3 py-2">{r.name} <span className="portal-card-muted">({r.username})</span></td>
              <td className="portal-card-text px-3 py-2">{Number(r.rights) === 1 ? 'Super Admin' : 'Cashier'}</td>
              <td className="px-3 py-2">
                {Number(r.rights) === 2 ? (
                  <>
                  <select aria-label={`Center for ${r.username}`} className="glass-input min-h-[44px] rounded-xl px-3 py-2 text-sm" value={r.ar_center_id || ''} disabled={busy !== null} aria-busy={busy === r.id}
                    onChange={(e) => assign(r.id, e.target.value ? Number(e.target.value) : null)}>
                    <option value="">No center</option>
                    {centers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  {busy === r.id && <span className="portal-card-muted ml-2 text-xs" role="status">Saving...</span>}
                  </>
                ) : <span className="portal-card-muted">Chooses per AR</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LegacyTab() {
  const [centers, reloadCenters, centersError] = useLoad(arApi.centers);
  const blank = { arNo: '', legacyDate: '', mode: 'package', centerId: '', buyerUsername: '', buyerName: '', paymentRef: '', notes: '' };
  const [form, setForm] = useState(blank);
  const [items, setItems] = useState([{ description: '', qty: 1, unitPrice: '' }]);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const intent = useIntentKey();
  const total = items.reduce((s, i) => s + (Number(i.qty) || 0) * (Number(i.unitPrice) || 0), 0);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const valid = PAPER_AR_NO.test(form.arNo) && form.legacyDate && form.centerId && items.every((i) => i.description.trim() && Number(i.qty) >= 1 && i.unitPrice !== '');
  async function submit(e) {
    e.preventDefault();
    if (!valid || busyRef.current) return;
    const body = { ...form, centerId: Number(form.centerId), items: items.map((i) => ({ ...i, qty: Number(i.qty), unitPrice: Number(i.unitPrice) })) };
    busyRef.current = true;
    setBusy(true);
    try {
      await arApi.legacy(body, intent.keyFor(body));
      intent.reset();
      toast.success(`Paper AR ${form.arNo} recorded`);
      setForm(blank);
      setItems([{ description: '', qty: 1, unitPrice: '' }]);
    } catch (err) {
      toast.error(errorText(err, 'Could not record this AR'));
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className="glass-card max-w-3xl space-y-4 rounded-2xl p-5">
      <p className="portal-card-muted text-sm">Record an old paper AR exactly as written so it appears in reports. No codes are generated.</p>
      {centersError && <ErrorState message={`${centersError}. Centers are needed to record a paper AR.`} onRetry={reloadCenters} />}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field id="lg-no" label="Paper AR number *"><input id="lg-no" inputMode="numeric" className="glass-input min-h-[44px] mt-1.5 w-full rounded-xl px-4 py-2.5 text-sm" value={form.arNo} onChange={(e) => set('arNo', e.target.value.replace(/\D/g, ''))} aria-describedby="lg-no-hint" />
          {form.arNo && !PAPER_AR_NO.test(form.arNo) && <p id="lg-no-hint" className="portal-danger-text mt-1 text-xs">The paper AR number must be 4 to 20 digits.</p>}
        </Field>
        <Field id="lg-date" label="Date on the paper *"><input id="lg-date" type="date" className="glass-input min-h-[44px] mt-1.5 w-full rounded-xl px-4 py-2.5 text-sm" value={form.legacyDate} onChange={(e) => set('legacyDate', e.target.value)} /></Field>
        <Field id="lg-center" label="Center *">
          <select id="lg-center" className="glass-input min-h-[44px] mt-1.5 w-full rounded-xl px-4 py-2.5 text-sm" value={form.centerId} onChange={(e) => set('centerId', e.target.value)}>
            <option value="">Choose center</option>{(centers || []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field id="lg-mode" label="Mode">
          <select id="lg-mode" className="glass-input min-h-[44px] mt-1.5 w-full rounded-xl px-4 py-2.5 text-sm" value={form.mode} onChange={(e) => set('mode', e.target.value)}>
            {Object.entries(MODE_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </Field>
        <Field id="lg-buyer" label="Buyer username (optional)"><input id="lg-buyer" className="glass-input min-h-[44px] mt-1.5 w-full rounded-xl px-4 py-2.5 text-sm" value={form.buyerUsername} onChange={(e) => set('buyerUsername', e.target.value)} /></Field>
        <Field id="lg-name" label="Name on the paper"><input id="lg-name" className="glass-input min-h-[44px] mt-1.5 w-full rounded-xl px-4 py-2.5 text-sm" value={form.buyerName} onChange={(e) => set('buyerName', e.target.value)} /></Field>
      </div>
      <div className="space-y-2">
        <span className="label">Items as written</span>
        {items.map((it, idx) => (
          <div key={idx} className="grid grid-cols-12 gap-2">
            <input aria-label="Description" className="glass-input min-h-[44px] col-span-6 rounded-xl px-3 py-2 text-sm" placeholder="Description" value={it.description} onChange={(e) => setItems(items.map((x, i) => (i === idx ? { ...x, description: e.target.value } : x)))} />
            <input aria-label="Quantity" type="number" min="1" className="glass-input min-h-[44px] col-span-2 rounded-xl px-3 py-2 text-sm" value={it.qty} onChange={(e) => setItems(items.map((x, i) => (i === idx ? { ...x, qty: e.target.value } : x)))} />
            <input aria-label="Unit price" type="number" min="0" step="0.01" className="glass-input min-h-[44px] col-span-3 rounded-xl px-3 py-2 text-sm" placeholder="Unit price" value={it.unitPrice} onChange={(e) => setItems(items.map((x, i) => (i === idx ? { ...x, unitPrice: e.target.value } : x)))} />
            <button type="button" aria-label="Remove item" className={`portal-table-icon-button col-span-1 min-h-[44px] rounded-xl ${FOCUS_RING}`} disabled={items.length === 1} onClick={() => setItems(items.filter((_, i) => i !== idx))}>x</button>
          </div>
        ))}
        <button type="button" className={BTN_SECONDARY} onClick={() => setItems([...items, { description: '', qty: 1, unitPrice: '' }])}>Add item</button>
      </div>
      <div className="flex items-center justify-between">
        <span className="portal-card-title font-semibold">Total {peso(total)}</span>
        <button type="submit" disabled={!valid || busy} className={BTN_PRIMARY}>{busy ? 'Saving...' : 'Record paper AR'}</button>
      </div>
    </form>
  );
}

function Field({ id, label, children }) {
  return <div><label className="label" htmlFor={id}>{label}</label>{children}</div>;
}
