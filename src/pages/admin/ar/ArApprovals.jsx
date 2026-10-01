import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  arApi, MODE_LABELS, PAYMENT_LABELS, PageHeader, ConfirmDialog, ErrorState, PartChip, peso, formatArNo, formatDate, errorText, useIntentKey,
  BTN_SUCCESS, BTN_SECONDARY, FOCUS_RING, MONEY, AR_NO,
} from './arShared';

const QUEUE_LIMIT = 200; // the list endpoint returns newest first, so a longer queue is truncated at the old end

/**
 * Super Admin approval queue. Approving releases activation codes straight into the recipient's
 * account, which cannot be undone, so every approval goes through a confirmation that lists
 * exactly what will be released and to whom.
 */
export default function ArApprovals() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [selected, setSelected] = useState(null); // full AR (with items) being confirmed
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const intent = useIntentKey();
  // Items and payment reference are not on the list rows. A row's full AR is fetched only when the admin
  // asks for it (Show items / Review), not for the whole queue on load.
  // null = could not be loaded; 'loading' = request in flight.
  const [details, setDetails] = useState({});
  const detailsRef = useRef({});

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const data = await arApi.receipts({ status: 'pending_approval', limit: QUEUE_LIMIT });
      setRows(data.rows);
      setTotal(Number(data.total || data.rows.length));
    } catch (err) {
      // An empty queue would read as "nothing to approve", so drop the rows and show the failure instead.
      setRows([]);
      setTotal(0);
      setLoadError(errorText(err, 'Could not load the approval queue'));
      toast.error(errorText(err, 'Could not load the approval queue'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function setDetail(id, value) {
    detailsRef.current = { ...detailsRef.current, [id]: value };
    setDetails(detailsRef.current);
  }

  async function showItems(row) {
    if (detailsRef.current[row.id] === 'loading') return;
    setDetail(row.id, 'loading');
    try {
      setDetail(row.id, await arApi.receipt(row.id));
    } catch {
      setDetail(row.id, null);
    }
  }

  // The queue: oldest first, so nothing waits behind newer ARs.
  const queueRows = useMemo(() => [...rows].sort((a, b) => Number(a.id) - Number(b.id)), [rows]);

  async function openConfirm(row) {
    try {
      const full = await arApi.receipt(row.id);
      setDetail(row.id, full);
      setSelected(full);
    } catch (err) {
      toast.error(errorText(err, 'Could not load this AR'));
    }
  }

  async function approve() {
    if (!selected || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      const out = await arApi.approve(selected.id, intent.keyFor({ approve: selected.id }));
      intent.reset();
      toast.success(`AR ${formatArNo(out.arNo)} approved - ${out.codesReleased} code(s) released to ${selected.recipient_username}`);
      setSelected(null);
      await load();
    } catch (err) {
      toast.error(errorText(err, 'Approval failed. Nothing was released.'));
      detailsRef.current = {};
      setDetails({});
      await load();
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  const codeLines = selected?.items?.filter((i) => Number(i.generates_codes)) || [];
  const codeCount = codeLines.reduce((s, i) => s + Number(i.qty), 0);

  return (
    <div>
      <PageHeader title="AR Approvals" subtitle="Approving an AR generates its activation codes and sends them straight to the recipient's account. Check the payment first." />

      {total > rows.length && (
        <p className="portal-warning-chip mb-4 rounded-xl p-3 text-sm" role="status">
          Showing the newest {rows.length} of {total} waiting ARs. Approve some to bring the older ones into view.
        </p>
      )}

      <div className="glass-card overflow-x-auto rounded-2xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="table-header">
              <th className="px-4 py-3 text-left">AR no.</th>
              <th className="px-4 py-3 text-left">Created</th>
              <th className="px-4 py-3 text-left">Buyer / codes to</th>
              <th className="px-4 py-3 text-left">Items</th>
              <th className="px-4 py-3 text-left">Payment</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3 text-left">Prepared by</th>
              <th className="px-4 py-3"><span className="sr-only">Action</span></th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={8} className="portal-card-muted px-4 py-6 text-center">Loading...</td></tr>}
            {!loading && loadError && <tr><td colSpan={8} className="px-4 py-6"><ErrorState message={loadError} onRetry={load} /></td></tr>}
            {!loading && !loadError && rows.length === 0 && <tr><td colSpan={8} className="portal-card-muted px-4 py-6 text-center">Nothing is waiting for approval.</td></tr>}
            {!loading && !loadError && queueRows.map((r) => {
              const full = details[r.id];
              return (
                <tr key={r.id} className="portal-zebra-row">
                  <td className="px-4 py-3">
                    <Link to={`/admin/ar/${r.id}`} className={`portal-gold-text ${AR_NO} rounded font-semibold hover:underline ${FOCUS_RING}`}>{formatArNo(r.ar_no)}</Link>
                    {/* Parts of one order are approved one by one; the label keeps them recognisable as a set. */}
                    {r.split_count ? <span className="mt-1 block"><PartChip part={r.split_part} count={r.split_count} /></span> : null}
                    {r.release_error && <p className="portal-danger-text mt-1 max-w-xs text-xs">Last attempt failed: {r.release_error}</p>}
                  </td>
                  <td className="portal-card-text px-4 py-3 whitespace-nowrap">{formatDate(r.created_at)}</td>
                  <td className="portal-card-text px-4 py-3">
                    {r.buyer_name} <span className="portal-card-muted">({r.buyer_username})</span>
                    <span className="portal-card-muted block text-xs">Codes to {r.recipient_username}</span>
                  </td>
                  <td className="portal-card-text px-4 py-3">
                    {full === undefined && (
                      <button type="button" onClick={() => showItems(r)} className={`${BTN_SECONDARY}`}>Show items</button>
                    )}
                    {full === 'loading' && <span className="portal-card-muted text-xs">Loading items...</span>}
                    {full === null && (
                      <button type="button" onClick={() => showItems(r)} className={`${BTN_SECONDARY}`}>Could not load - retry</button>
                    )}
                    {full && full !== 'loading' && (
                      <ul className="space-y-0.5">
                        {full.items.map((i) => <li key={i.id}><span className={MONEY}>{i.qty} &times;</span> {i.description}</li>)}
                      </ul>
                    )}
                    <span className="portal-card-muted block text-xs">{MODE_LABELS[r.mode]}</span>
                  </td>
                  <td className="portal-card-text px-4 py-3">
                    {PAYMENT_LABELS[r.payment_method] || r.payment_method}
                    {full && full !== 'loading' && full.payment_ref ? <span className="portal-card-muted block text-xs">ref {full.payment_ref}</span> : null}
                  </td>
                  <td className={`portal-card-title px-4 py-3 text-right font-semibold ${MONEY}`}>{peso(r.total)}</td>
                  <td className="portal-card-text px-4 py-3">{r.prepared_by}<span className="portal-card-muted block text-xs">{r.center_name}</span></td>
                  <td className="px-4 py-3 text-right">
                    <button type="button" onClick={() => openConfirm(r)} className={BTN_SUCCESS}>
                      Review and approve
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={Boolean(selected)}
        title={selected ? `Approve AR ${formatArNo(selected.ar_no)}?` : ''}
        confirmLabel={`Approve and release ${codeCount} code(s)`}
        confirmClass={BTN_SUCCESS}
        busy={busy}
        onCancel={() => !busy && setSelected(null)}
        onConfirm={approve}
      >
        {selected && (
          <>
            <p><strong>{codeCount}</strong> activation code(s) will be generated and sent to <strong>{selected.recipient_username}</strong>. This cannot be undone.</p>
            <ul className="portal-soft-panel list-inside list-disc rounded-xl p-3">
              {codeLines.map((i) => <li key={i.id}>{i.qty} x {i.description}</li>)}
            </ul>
            <p>Buyer: {selected.buyer_name} ({selected.buyer_username}) - paid {peso(selected.total)}{selected.payment_ref ? `, ref ${selected.payment_ref}` : ''}.</p>
          </>
        )}
      </ConfirmDialog>
    </div>
  );
}
