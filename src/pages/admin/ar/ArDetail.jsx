import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { HiOutlineArrowLeft, HiOutlinePrinter, HiOutlinePlus, HiOutlineFlag } from 'react-icons/hi';
import { useAuth } from '../../../contexts/AuthContext';
import {
  arApi, MODE_LABELS, PAYMENT_LABELS, STOCKIST_LABELS, PageHeader, StatusChip, PartChip, ConfirmDialog, ErrorState,
  peso, formatArNo, formatDate, errorText, useIntentKey,
  BTN_PRIMARY, BTN_SECONDARY, BTN_DANGER, FOCUS_RING, MONEY, AR_NO,
} from './arShared';

/*
 * The four write actions on this page share one dialog. `field` is what the dialog asks for, and the
 * text is required for every one of them: a void, a flag and a decision all need a reason on record.
 */
const ACTIONS = {
  void: { title: 'Void AR', confirm: 'Void AR', field: 'Reason', max: 255, danger: true, done: 'AR voided' },
  flag: { title: 'Flag a mistake on AR', confirm: 'Flag for review', field: 'What is wrong?', max: 500, danger: false, done: 'Flagged. A Super Admin will review it.' },
  keep: { title: 'Keep AR as is', confirm: 'Keep and close flag', field: 'Note', max: 500, danger: false, done: 'Flag closed. The AR stays as it is.' },
  resolveVoid: { title: 'Void flagged AR', confirm: 'Void AR', field: 'Reason', max: 255, danger: true, done: 'AR voided and flag closed' },
};

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
  const [dialog, setDialog] = useState(null); // a key of ACTIONS while a dialog is open
  const [dialogText, setDialogText] = useState('');
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

  function openDialog(kind) {
    setDialogText('');
    setDialog(kind);
  }

  async function runAction() {
    const text = dialogText.trim();
    if (busyRef.current || !dialog || !text) return;
    busyRef.current = true;
    setBusy(true);
    const key = intent.keyFor({ id, dialog, text });
    try {
      if (dialog === 'void') await arApi.void(id, text, key);
      else if (dialog === 'flag') await arApi.flag(id, text, key);
      else await arApi.resolveFlag(id, { resolution: dialog === 'keep' ? 'kept' : 'voided', note: text }, key);
      intent.reset();
      toast.success(ACTIONS[dialog].done);
      setDialog(null);
      await load();
    } catch (err) {
      toast.error(errorText(err, 'That did not go through'));
      // Someone else changed the AR (already flagged, already resolved, already void): show what is true now.
      if (err?.response?.status === 409) { setDialog(null); await load(); }
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  if (loading) return <p className="portal-card-muted p-6 text-sm" role="status">Loading AR...</p>;
  if (loadError && !ar) return <div className="p-6"><ErrorState message={loadError} onRetry={load} /></div>;
  if (!ar) return <p className="portal-danger-text p-6 text-sm">AR not found.</p>;

  // The admin session exposes username (not the numeric id); the server re-checks ownership by id.
  // Super Admin may void any AR that is not already void; a cashier only a pending AR they prepared.
  const canVoid = ar.status !== 'void'
    && (rights === 1 || (rights === 2 && ar.status === 'pending_approval' && ar.prepared_by === admin?.username));
  const openFlag = ar.open_flag;
  const pastFlags = (ar.flags || []).filter((f) => !f.is_open);
  const codesReleased = Number(ar.codes_released || 0);
  const isReprint = Number(ar.print_count) > 1;
  const canSell = rights === 1 || rights === 2;
  // BOD (rights 3) is read-only, and printing writes the print counter.
  const canPrint = canSell;
  // A finished sale cannot be edited; flagging puts the mistake in front of a Super Admin instead.
  const canFlag = canSell && ar.status === 'completed' && !openFlag;
  const action = dialog ? ACTIONS[dialog] : null;

  return (
    <div>
      <style>{PRINT_CSS}</style>
      <Link to="/admin/ar" className={`portal-gold-text -ml-1 mb-2 inline-flex min-h-[44px] items-center gap-1.5 rounded-lg px-1 text-sm font-semibold hover:underline ${FOCUS_RING}`}>
        <HiOutlineArrowLeft aria-hidden="true" /> All ARs
      </Link>
      <PageHeader
        title={<span className="inline-flex flex-wrap items-center gap-2">AR <span className={AR_NO}>{formatArNo(ar.ar_no)}</span><PartChip part={ar.split_part} count={ar.split_count} /></span>}
        subtitle={`${ar.center_name} - ${MODE_LABELS[ar.mode]}`}
      >
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
        {canFlag && (
          <button type="button" onClick={() => openDialog('flag')} className={BTN_SECONDARY}>
            <HiOutlineFlag aria-hidden="true" /> Flag a mistake
          </button>
        )}
        {canVoid && (
          <button type="button" onClick={() => openDialog('void')} className={BTN_DANGER}>Void</button>
        )}
        {canSell && (
          <Link to="/admin/ar/new" className={BTN_PRIMARY}>
            <HiOutlinePlus aria-hidden="true" /> New AR
          </Link>
        )}
      </PageHeader>

      {ar.parts?.length > 1 && (
        <nav aria-label="Parts of this order" className="mb-5 flex flex-wrap items-center gap-2 text-sm">
          <span className="portal-card-muted">This order was saved as {ar.parts.length} ARs:</span>
          {ar.parts.map((p) => (Number(p.id) === Number(ar.id)
            ? <span key={p.id} aria-current="page" className={`portal-accent-chip rounded-full px-3 py-1 font-semibold ${AR_NO}`}>{formatArNo(p.ar_no)}</span>
            : (
              <Link key={p.id} to={`/admin/ar/${p.id}`} className={`portal-muted-button rounded-full px-3 py-1 font-semibold hover:underline ${AR_NO} ${FOCUS_RING}`}>
                {formatArNo(p.ar_no)}
              </Link>
            )))}
        </nav>
      )}

      {openFlag && (
        <div className="portal-warning-chip mb-5 rounded-xl p-4 text-sm" role="status">
          <p className="flex items-center gap-2 font-semibold"><HiOutlineFlag aria-hidden="true" /> Flagged for review</p>
          <p className="mt-1">{openFlag.reason}</p>
          <p className="mt-1 text-xs opacity-80">Flagged by {openFlag.raised_by} on {formatDate(openFlag.raised_at)}. Nothing on this AR has been changed.</p>
          {rights === 1 && (
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={() => openDialog('keep')} className={BTN_SECONDARY}>Keep as is</button>
              <button type="button" onClick={() => openDialog('resolveVoid')} className={BTN_DANGER}>Void AR</button>
            </div>
          )}
        </div>
      )}

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

      {pastFlags.length > 0 && (
        <section className="glass-card mt-5 rounded-2xl p-5" aria-labelledby="ar-flag-history">
          <h2 id="ar-flag-history" className="portal-card-title mb-3 font-semibold">Flag history</h2>
          <ul className="space-y-3 text-sm">
            {pastFlags.map((f) => (
              <li key={f.id} className="portal-row-divider border-b pb-3 last:border-b-0 last:pb-0">
                <p className="portal-card-text">{f.reason}</p>
                <p className="portal-card-muted mt-0.5 text-xs">Flagged by {f.raised_by} on {formatDate(f.raised_at)}</p>
                <p className="portal-card-muted mt-0.5 text-xs">
                  <span className={f.resolution === 'voided' ? 'portal-danger-text font-semibold' : 'portal-success-text font-semibold'}>
                    {f.resolution === 'voided' ? 'Voided' : 'Kept as is'}
                  </span>
                  {' '}by {f.resolved_by} on {formatDate(f.resolved_at)}{f.resolution_note ? `: ${f.resolution_note}` : ''}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <ConfirmDialog
        open={Boolean(action)}
        title={action ? `${action.title} ${formatArNo(ar.ar_no)}?` : ''}
        confirmLabel={action?.confirm}
        confirmClass={action?.danger ? BTN_DANGER : BTN_PRIMARY}
        busy={busy}
        confirmDisabled={!dialogText.trim()}
        onCancel={() => setDialog(null)}
        onConfirm={runAction}
      >
        {(dialog === 'void' || dialog === 'resolveVoid') && (
          ar.status === 'pending_approval'
            ? <p>No codes have been released for this AR. Voiding it cancels the receipt; the number stays used and is shown as void in reports.</p>
            : codesReleased > 0
              ? (
                <p className="portal-danger-text font-semibold">
                  {codesReleased} code{codesReleased === 1 ? '' : 's'} already released stay with {ar.recipient_username}. Voiding only removes this AR from
                  reports; it does not take the codes back.
                </p>
              )
              : <p>This AR is complete. Voiding removes it from reports; the number stays used and is shown as void.</p>
        )}
        {dialog === 'flag' && <p>This changes nothing on the AR. It puts the AR in front of a Super Admin, who decides whether to void it or keep it.</p>}
        {dialog === 'keep' && <p>The AR stays exactly as it is and the flag is closed. The note is kept with the flag.</p>}
        {action && (
          <>
            <label className="label mt-3 block" htmlFor="ar-action-text">{action.field} <span className="portal-required">*</span></label>
            <textarea id="ar-action-text" rows={3} className="glass-input mt-1.5 w-full rounded-xl px-4 py-2.5 text-sm" value={dialogText}
              onChange={(e) => setDialogText(e.target.value)} maxLength={action.max} disabled={busy}
              placeholder={dialog === 'flag' ? 'e.g. quantity should have been 2, not 3' : ''} />
          </>
        )}
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
