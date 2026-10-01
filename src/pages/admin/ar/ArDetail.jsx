import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { HiOutlineArrowLeft, HiOutlinePrinter, HiOutlinePlus } from 'react-icons/hi';
import { useAuth } from '../../../contexts/AuthContext';
import {
  arApi, MODE_LABELS, PAYMENT_LABELS, STOCKIST_LABELS, PageHeader, StatusChip, ConfirmDialog, ErrorState,
  peso, formatArNo, formatDate, errorText, useIntentKey,
  BTN_PRIMARY, BTN_SECONDARY, BTN_DANGER, FOCUS_RING, MONEY, AR_NO,
} from './arShared';

/*
 * Print layout lives in a plain <style> block so it works with any printer the browser can reach.
 * `size: A4` or `size: A5` (half-sheet) is chosen per print; everything except the receipt is hidden.
 */
const PRINT_CSS = `
@media print {
  body * { visibility: hidden !important; }
  #ar-print, #ar-print * { visibility: visible !important; }
  #ar-print { position: absolute; inset: 0; padding: 12mm; color: #000 !important; background: #fff !important; }
  #ar-print * { color: #000 !important; background: transparent !important; border-color: #000 !important; box-shadow: none !important; }
}
`;

export default function ArDetail() {
  const { id } = useParams();
  const { admin } = useAuth();
  const rights = Number(admin?.rights || 0);
  const [ar, setAr] = useState(null);
  const [loading, setLoading] = useState(true);
  const [voidOpen, setVoidOpen] = useState(false);
  const [voidReason, setVoidReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [paper, setPaper] = useState('A4');
  const busyRef = useRef(false);
  const printingRef = useRef(false);
  const intent = useIntentKey();

  const load = useCallback(async () => {
    setLoadError('');
    try {
      setAr(await arApi.receipt(id));
    } catch (err) {
      setLoadError(errorText(err, 'Could not load this AR'));
      toast.error(errorText(err, 'Could not load this AR'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function print(size) {
    if (printingRef.current) return;
    printingRef.current = true;
    setPrinting(true);
    setPaper(size);
    try {
      // Count first so the printed copy already says REPRINT from the second print on.
      setAr(await arApi.print(id));
    } catch (err) {
      // Printing must not be blocked by the counter, but a copy that is not counted is not marked REPRINT later.
      toast(`${errorText(err, 'Could not record this print')}. The copy count was not recorded; printing anyway.`, { icon: '\u26A0\uFE0F', duration: 7000 });
    } finally {
      printingRef.current = false;
      setPrinting(false);
    }
    const style = document.createElement('style');
    style.textContent = `@page { size: ${size === 'A5' ? 'A5' : 'A4'}; margin: 0; }`;
    document.head.appendChild(style);
    setTimeout(() => { window.print(); style.remove(); }, 50);
  }

  async function doVoid() {
    if (busyRef.current || !voidReason.trim()) return;
    busyRef.current = true;
    setBusy(true);
    try {
      await arApi.void(id, voidReason.trim(), intent.keyFor({ id, voidReason: voidReason.trim() }));
      intent.reset();
      toast.success('AR voided');
      setVoidOpen(false);
      await load();
    } catch (err) {
      toast.error(errorText(err, 'Could not void this AR'));
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  if (loading) return <p className="portal-card-muted p-6 text-sm" role="status">Loading AR...</p>;
  if (loadError && !ar) return <div className="p-6"><ErrorState message={loadError} onRetry={load} /></div>;
  if (!ar) return <p className="portal-danger-text p-6 text-sm">AR not found.</p>;

  // The admin session exposes username (not the numeric id); the server re-checks ownership by id.
  const canVoid = ar.status === 'pending_approval' && (rights === 1 || (rights === 2 && ar.prepared_by === admin?.username));
  const isReprint = Number(ar.print_count) > 1;
  const canSell = rights === 1 || rights === 2;
  // BOD (rights 3) is read-only, and printing writes the print counter.
  const canPrint = canSell;

  return (
    <div>
      <style>{PRINT_CSS}</style>
      <Link to="/admin/ar" className={`portal-gold-text -ml-1 mb-2 inline-flex min-h-[44px] items-center gap-1.5 rounded-lg px-1 text-sm font-semibold hover:underline ${FOCUS_RING}`}>
        <HiOutlineArrowLeft aria-hidden="true" /> All ARs
      </Link>
      <PageHeader title={<>AR <span className={AR_NO}>{formatArNo(ar.ar_no)}</span></>} subtitle={`${ar.center_name} - ${MODE_LABELS[ar.mode]}`}>
        {canPrint && (
          <>
            <button type="button" onClick={() => print('A4')} disabled={printing} aria-busy={printing} className={BTN_SECONDARY}>
              <HiOutlinePrinter aria-hidden="true" /> {printing ? 'Preparing...' : 'Print A4'}
            </button>
            <button type="button" onClick={() => print('A5')} disabled={printing} aria-busy={printing} className={BTN_SECONDARY}>
              <HiOutlinePrinter aria-hidden="true" /> {printing ? 'Preparing...' : 'Print half-sheet'}
            </button>
          </>
        )}
        {canVoid && (
          <button type="button" onClick={() => setVoidOpen(true)} className={BTN_DANGER}>Void</button>
        )}
        {canSell && (
          <Link to="/admin/ar/new" className={BTN_PRIMARY}>
            <HiOutlinePlus aria-hidden="true" /> New AR
          </Link>
        )}
      </PageHeader>

      {ar.status === 'pending_approval' && (
        <div className="portal-info-box mb-5 rounded-xl p-4 text-sm">
          Waiting for Super Admin approval. Codes are released to <strong>{ar.recipient_username}</strong> automatically once approved.
          {ar.release_error && <p className="portal-danger-text mt-1">Last release attempt failed: {ar.release_error}</p>}
        </div>
      )}

      {/* The printable receipt */}
      <div id="ar-print" className="glass-card rounded-2xl p-6" data-paper={paper}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="portal-card-title text-lg font-bold">NOGATU ALLIANCE - Acknowledgement Receipt</p>
            <p className="portal-card-muted text-sm">{ar.center_name}{ar.center_address ? ` - ${ar.center_address}` : ''}</p>
            {ar.center_contact && <p className="portal-card-muted text-sm">Tel. {ar.center_contact}</p>}
          </div>
          <div className="text-right">
            <p className={`portal-card-title ${AR_NO} text-xl font-bold`}>No. {formatArNo(ar.ar_no)}</p>
            <p className="portal-card-muted text-sm">{ar.is_legacy ? `Paper AR dated ${String(ar.legacy_date).slice(0, 10)}` : formatDate(ar.created_at)}</p>
            <div className="mt-1 flex justify-end"><StatusChip status={ar.status} legacy={Boolean(ar.is_legacy)} /></div>
            {isReprint && <p className="portal-warning-text mt-1 text-xs font-bold">REPRINT</p>}
          </div>
        </div>

        <dl className="mt-5 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <Detail label="Received from" value={`${ar.buyer_name}${ar.buyer_username ? ` (${ar.buyer_username})` : ''}`} />
          {ar.recipient_username && <Detail label="Codes sent to" value={ar.recipient_username} />}
          {ar.stockist_type && <Detail label="Stockist" value={STOCKIST_LABELS[ar.stockist_type]} />}
          <Detail label="Payment" value={`${PAYMENT_LABELS[ar.payment_method] || ar.payment_method}${ar.payment_ref ? ` - ref ${ar.payment_ref}` : ''}`} />
        </dl>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="table-header">
                <th className="px-3 py-2 text-left">Item</th>
                <th className="px-3 py-2 text-center">Qty</th>
                <th className="px-3 py-2 text-right">Unit price</th>
                <th className="px-3 py-2 text-right">Discount</th>
                <th className="px-3 py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {ar.items.map((item) => (
                <tr key={item.id} className="portal-row-divider">
                  <td className="portal-card-text px-3 py-2">{item.description}</td>
                  <td className={`portal-card-text px-3 py-2 text-center ${MONEY}`}>{item.qty}</td>
                  <td className={`portal-card-text px-3 py-2 text-right ${MONEY}`}>{peso(item.unit_price)}</td>
                  <td className={`portal-card-text px-3 py-2 text-right ${MONEY}`}>{Number(item.discount_each) ? `- ${peso(item.discount_each)}` : '-'}</td>
                  <td className={`portal-card-title px-3 py-2 text-right font-semibold ${MONEY}`}>{peso(item.line_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <dl className="ml-auto mt-4 max-w-xs space-y-1 text-sm">
          <div className="flex justify-between"><dt className="portal-card-muted">Subtotal</dt><dd className={`portal-card-text ${MONEY}`}>{peso(ar.subtotal)}</dd></div>
          {Number(ar.discount_total) > 0 && <div className="flex justify-between"><dt className="portal-card-muted">Discount</dt><dd className={`portal-card-text ${MONEY}`}>- {peso(ar.discount_total)}</dd></div>}
          <div className="portal-row-divider flex justify-between pt-1 text-base font-bold"><dt className="portal-card-title">Total</dt><dd className={`portal-gold-text ${MONEY}`}>{peso(ar.total)}</dd></div>
        </dl>

        <div className="mt-8 grid grid-cols-1 gap-6 text-sm sm:grid-cols-3">
          <Signature label="Prepared by" name={ar.prepared_by} />
          <Signature label="Released by" name={ar.released_by || ''} />
          <Signature label="Received by" name={ar.buyer_name} />
        </div>
        {ar.status === 'completed' && Number(ar.codes_released) > 0 && (
          <p className="portal-card-muted mt-6 text-xs">{ar.codes_released} activation code(s) released directly to {ar.recipient_username}'s account. Approved by {ar.approved_by} on {formatDate(ar.approved_at)}.</p>
        )}
        {ar.status === 'void' && <p className="portal-danger-text mt-6 text-sm font-semibold">VOID - {ar.void_reason} ({ar.voided_by})</p>}
        {ar.notes && <p className="portal-card-muted mt-3 text-xs">Notes: {ar.notes}</p>}
      </div>

      <ConfirmDialog
        open={voidOpen}
        title={`Void AR ${formatArNo(ar.ar_no)}?`}
        confirmLabel="Void AR"
        confirmClass={BTN_DANGER}
        busy={busy}
        onCancel={() => setVoidOpen(false)}
        onConfirm={doVoid}
      >
        <p>No codes have been released for this AR. Voiding it cancels the receipt; the number stays used and is shown as void in reports.</p>
        <label className="label mt-3 block" htmlFor="void-reason">Reason <span className="portal-required">*</span></label>
        <input id="void-reason" className="glass-input mt-1.5 w-full rounded-xl px-4 py-2.5 text-sm" value={voidReason}
          onChange={(e) => setVoidReason(e.target.value)} maxLength={255} placeholder="e.g. wrong buyer" disabled={busy} />
      </ConfirmDialog>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <dt className="portal-detail-label text-xs uppercase tracking-wide">{label}</dt>
      <dd className="portal-detail-value mt-0.5">{value}</dd>
    </div>
  );
}

function Signature({ label, name }) {
  return (
    <div>
      <div className="portal-row-divider h-8 border-b" />
      <p className="portal-card-text mt-1 font-semibold">{name || ' '}</p>
      <p className="portal-card-muted text-xs">{label}</p>
    </div>
  );
}
