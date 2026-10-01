import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { HiOutlineMinus, HiOutlinePlus, HiOutlineTrash, HiOutlineSearch, HiOutlineX, HiOutlineChevronDown } from 'react-icons/hi';
import { useAuth } from '../../../contexts/AuthContext';
import {
  arApi, MODE_LABELS, PAYMENT_LABELS, STOCKIST_LABELS, PageHeader, ErrorState, Kbd, peso, errorText, useIntentKey, moveSelection,
  FOCUS_RING, MONEY, AR_NO, BTN_PRIMARY, BTN_SECONDARY, MAX_CODES_PER_AR, MAX_SPLIT_PARTS, planSplit, parseQuickAdd,
  formatArNo, StatusChip, PartChip,
} from './arShared';

// Mirrors services/ar/arPricing.js for the on-screen preview only. The server re-prices every AR
// from its own price list; nothing typed here can change what is charged.
const MODE_RULES = {
  package: { kind: 'package', priceField: 'member_price', codes: true, member: true, discount: true },
  cash_member: { kind: 'product', priceField: 'member_price', codes: true, member: true },
  cash_stockist: { kind: 'product', priceField: 'stockist_price', codes: true, member: true, stockist: true },
  cash_srp: { kind: 'product', priceField: 'srp', codes: false, member: false },
  voucher: { kind: 'product', priceField: 'member_price', codes: false, member: true, voucher: true },
};
const MODE_KEYS = Object.keys(MODE_RULES);
const isPackage = (pt) => pt >= 10 && pt <= 60;
const MAX_QTY = 500;
// A code-generating order may exceed one AR: it is saved as up to 10 consecutive ARs of 500 codes.
const MAX_ORDER_CODES = MAX_CODES_PER_AR * MAX_SPLIT_PARTS;

const matchingItems = (items, raw) => {
  const term = raw.trim().toLowerCase();
  return items.filter((p) => !term || p.item_name.toLowerCase().includes(term) || String(p.producttype).includes(term));
};
const MOD_KEY = typeof navigator !== 'undefined' && /mac/i.test(navigator.platform || '') ? 'Cmd' : 'Ctrl';

// Plain Enter only: Ctrl/Cmd+Enter is the save shortcut and IME composition must never trigger anything.
const isPlainEnter = (e) => e.key === 'Enter' && !e.ctrlKey && !e.metaKey && !e.nativeEvent?.isComposing;

function useMemberLookup() {
  const [state, setState] = useState({ status: 'idle', member: null, error: '' });
  const seq = useRef(0);
  const lastName = useRef('');
  // Returns the member (or null) so callers can move focus on success. A repeat lookup of the
  // name already found or in flight is skipped, so Enter followed by blur costs one request.
  async function lookup(username) {
    const name = username.trim();
    if (!name) { lastName.current = ''; setState({ status: 'idle', member: null, error: '' }); return null; }
    if (name === lastName.current) return null;
    lastName.current = name;
    const mine = ++seq.current;
    setState((s) => ({ ...s, status: 'loading', error: '' }));
    try {
      const member = await arApi.member(name);
      if (mine === seq.current) setState({ status: 'found', member, error: '' });
      return member;
    } catch (err) {
      if (mine === seq.current) {
        lastName.current = '';
        setState({ status: 'error', member: null, error: errorText(err, 'Member not found') });
      }
      return null;
    }
  }
  function clear() {
    lastName.current = '';
    seq.current += 1;
    setState({ status: 'idle', member: null, error: '' });
  }
  return { ...state, lookup, clear };
}

export default function ArNew() {
  const navigate = useNavigate();
  const { admin } = useAuth();
  const isSuper = Number(admin?.rights) === 1;
  const intent = useIntentKey();
  const submittingRef = useRef(false);
  const searchRef = useRef(null);
  const buyerRef = useRef(null);
  const centerRef = useRef(null);
  const recipientRef = useRef(null);

  const [prices, setPrices] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [loadTick, setLoadTick] = useState(0);

  const [mode, setMode] = useState('package');
  const [centerId, setCenterId] = useState('');
  const [buyerUsername, setBuyerUsername] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [recipientUsername, setRecipientUsername] = useState('');
  const [recipientOpen, setRecipientOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [lines, setLines] = useState([]); // { producttype, qty }
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentRef, setPaymentRef] = useState('');
  const [releasedBy, setReleasedBy] = useState('');
  const [notes, setNotes] = useState('');
  const [moreOpen, setMoreOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [savedSplit, setSavedSplit] = useState(null); // create response of a multi-part order

  const buyer = useMemberLookup();
  const recipient = useMemberLookup();
  const rule = MODE_RULES[mode];

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setLoadError('');
    Promise.all([arApi.prices(), arApi.discounts(), arApi.centers()])
      .then(([p, d, c]) => {
        if (!alive) return;
        setPrices(p.filter((row) => Number(row.active)));
        setDiscounts(d);
        setCenters(c.filter((row) => Number(row.active)));
      })
      .catch((err) => {
        if (!alive) return;
        // Without prices the form would say "No packages match" and invite a blind retry; say what failed instead.
        setLoadError(errorText(err, 'Could not load the price list'));
        toast.error(errorText(err, 'Could not load the price list'));
      })
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [loadTick]);

  // Start where the cashier types first: the buyer (or the center, for a Super Admin who must pick one).
  useEffect(() => {
    (isSuper ? centerRef : buyerRef).current?.focus();
  }, [isSuper]);

  // "/" jumps to the item search from anywhere that is not a text field.
  useEffect(() => {
    function onKey(e) {
      if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey || e.isComposing) return;
      const t = e.target;
      const tag = t?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || t?.isContentEditable) return;
      if (!searchRef.current || searchRef.current.disabled) return;
      e.preventDefault();
      searchRef.current.focus();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => { if (recipientOpen) recipientRef.current?.focus(); }, [recipientOpen]);

  // Changing mode changes which items are allowed and how they are priced; start the cart clean.
  function changeMode(next) {
    if (next === mode) return;
    setMode(next);
    setLines([]);
    setSearch('');
    setPaymentMethod(MODE_RULES[next].voucher ? 'voucher' : 'cash');
  }

  const priceByType = useMemo(() => new Map(prices.map((p) => [Number(p.producttype), p])), [prices]);
  const qtyByType = useMemo(() => new Map(lines.map((l) => [l.producttype, l.qty])), [lines]);
  const stockistType = buyer.member?.stockistType || null;

  const sellable = useMemo(() => prices
    .filter((p) => (rule.kind === 'package' ? isPackage(Number(p.producttype)) : !isPackage(Number(p.producttype))))
    .filter((p) => Number(p[rule.priceField]) > 0), [prices, rule]);
  // "300 gold": the reading whose name matches a product wins; otherwise the text is a plain search.
  const quick = useMemo(() => {
    for (const reading of parseQuickAdd(search)) {
      const hits = matchingItems(sellable, reading.term);
      if (hits.length) return { ...reading, hits };
    }
    return null;
  }, [search, sellable]);
  const options = useMemo(() => quick?.hits || matchingItems(sellable, search), [quick, search, sellable]);

  const priced = useMemo(() => {
    let subtotal = 0; let discount = 0;
    const rows = lines.map((line) => {
      const p = priceByType.get(line.producttype);
      const unit = Math.round(Number(p?.[rule.priceField] || 0) * 100);
      let each = 0;
      if (rule.discount && stockistType) {
        const d = discounts.find((x) => Number(x.stockist_type) === stockistType && Number(x.producttype) === line.producttype);
        each = Math.min(Math.round(Number(d?.peso_discount || 0) * 100), unit);
      }
      subtotal += unit * line.qty;
      discount += each * line.qty;
      return { ...line, name: p?.item_name || line.producttype, unit: unit / 100, each: each / 100, total: ((unit - each) * line.qty) / 100 };
    });
    return { rows, subtotal: subtotal / 100, discount: discount / 100, total: (subtotal - discount) / 100 };
  }, [lines, priceByType, rule, stockistType, discounts]);

  const itemCount = lines.reduce((sum, l) => sum + l.qty, 0);
  // Code orders can be split across ARs, so one line may exceed a single AR; other modes keep the per-AR cap.
  const maxQty = rule.codes ? MAX_ORDER_CODES : MAX_QTY;
  const splitParts = rule.codes && itemCount > MAX_CODES_PER_AR ? planSplit(lines) : null;

  function addItem(producttype, qty = 1) {
    setLines((prev) => {
      const found = prev.find((l) => l.producttype === producttype);
      if (found) return prev.map((l) => (l.producttype === producttype ? { ...l, qty: Math.min(l.qty + qty, maxQty) } : l));
      return [...prev, { producttype, qty: Math.min(qty, maxQty) }];
    });
    setSearch('');
    searchRef.current?.focus();
  }

  function setQty(producttype, value) {
    const qty = Math.max(1, Math.min(maxQty, Math.trunc(Number(value) || 1)));
    setLines((prev) => prev.map((l) => (l.producttype === producttype ? { ...l, qty } : l)));
  }

  const buyerRequiredMissing = rule.member && !buyer.member;
  const recipientProblem = rule.codes && recipientUsername.trim() && !recipient.member;
  const stockistMissing = rule.stockist && buyer.member && !stockistType;
  // An optional buyer that was typed but never resolved would be dropped from the body and the AR saved as a walk-in.
  const buyerProblem = !rule.member && buyerUsername.trim() !== '' && !buyer.member;
  const tooManyCodes = rule.codes && itemCount > MAX_ORDER_CODES;
  const canSubmit = !submitting && !loading && !loadError && lines.length > 0 && !buyerRequiredMissing && !buyerProblem
    && !recipientProblem && !stockistMissing && !tooManyCodes && (!isSuper || centerId);

  // A typed recipient must stay visible: collapsing it would hide the reason a save is blocked.
  const showRecipient = recipientOpen || recipientUsername.trim() !== '';
  // Same for filled-in optional details: never submit something the cashier cannot see.
  const showMore = moreOpen || Boolean(releasedBy.trim() || notes.trim());

  async function lookupBuyerThenFocusItems() {
    const found = await buyer.lookup(buyerUsername);
    // Stay on the field when the lookup failed so the error is next to where it is fixed.
    if (found || (!buyerUsername.trim() && !rule.member)) searchRef.current?.focus();
  }

  function clearBuyer() {
    setBuyerUsername('');
    buyer.clear();
    buyerRef.current?.focus();
  }

  function resetRecipient() {
    setRecipientUsername('');
    recipient.clear();
    setRecipientOpen(false);
  }

  function onFormKeyDown(e) {
    if (e.key !== 'Enter' || e.nativeEvent?.isComposing) return;
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      if (canSubmit && !submittingRef.current) e.currentTarget.requestSubmit();
      return;
    }
    // Enter inside a field must not save the AR by accident; saving is a deliberate click or Ctrl+Enter.
    if (e.target instanceof HTMLInputElement) e.preventDefault();
  }

  async function submit(e) {
    e.preventDefault();
    if (!canSubmit || submittingRef.current) return;
    const body = {
      mode,
      centerId: isSuper ? Number(centerId) : undefined,
      buyerUsername: buyer.member?.username || undefined,
      buyerName: buyerName.trim() || undefined,
      recipientUsername: rule.codes ? (recipient.member?.username || buyer.member?.username) : undefined,
      items: lines.map(({ producttype, qty }) => ({ producttype, qty })),
      paymentMethod,
      paymentRef: paymentRef.trim() || undefined,
      releasedBy: releasedBy.trim() || undefined,
      notes: notes.trim() || undefined,
      // Lets the server save an order above 500 codes as consecutive ARs; ignored when it fits one AR.
      split: rule.codes ? true : undefined,
    };
    submittingRef.current = true;
    setSubmitting(true);
    try {
      const out = await arApi.create(body, intent.keyFor(body));
      intent.reset();
      if (out.parts?.length > 1) {
        toast.success(`Order saved as ${out.parts.length} ARs. Each part waits for its own approval.`);
        setSavedSplit(out);
        return;
      }
      toast.success(out.status === 'pending_approval'
        ? `AR created. Codes will be released once a Super Admin approves it.`
        : `AR created and completed.`);
      navigate(`/admin/ar/${out.id}`);
    } catch (err) {
      toast.error(errorText(err, 'Could not create the AR'));
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  const saveLabel = submitting ? 'Saving...'
    : splitParts ? `Save as ${splitParts.length} ARs and send for approval`
      : rule.codes ? 'Save AR and send for approval' : 'Save AR';
  const saveBarLabel = submitting ? 'Saving...' : splitParts ? `Save ${splitParts.length} ARs` : 'Save AR';
  const showBar = lines.length > 0 || submitting;

  function startNew() {
    setSavedSplit(null);
    setLines([]);
    setSearch('');
    setBuyerUsername('');
    setBuyerName('');
    buyer.clear();
    resetRecipient();
    setPaymentRef('');
    setReleasedBy('');
    setNotes('');
  }

  if (savedSplit) return <SplitSaved result={savedSplit} onNew={startNew} />;

  return (
    <form onSubmit={submit} onKeyDown={onFormKeyDown}>
      <PageHeader
        title="New Acknowledgement Receipt"
        subtitle="The AR number is assigned automatically when you save. Prices and discounts come from the price list set by the Super Admin."
      />

      {loadError && (
        <div className="mb-5">
          <ErrorState message={`${loadError}. Prices and centers are needed to build an AR.`} onRetry={() => setLoadTick((t) => t + 1)} busy={loading} />
        </div>
      )}

      {/* Mode */}
      <div className="glass-card mb-5 rounded-2xl p-5">
        <span className="label" id="ar-mode-label">What is being sold</span>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5" role="radiogroup" aria-labelledby="ar-mode-label">
          {MODE_KEYS.map((key) => {
            const selected = key === mode;
            return (
              <button
                key={key}
                type="button"
                role="radio"
                data-key={key}
                aria-checked={selected}
                tabIndex={selected ? 0 : -1}
                onClick={() => changeMode(key)}
                onKeyDown={(e) => moveSelection(e, MODE_KEYS, mode, changeMode)}
                disabled={submitting}
                className={`${selected ? 'gold-btn' : 'portal-muted-button'} min-h-[44px] rounded-xl px-3 text-left text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${FOCUS_RING}`}
              >
                {MODE_LABELS[key]}
                <span className="block text-xs font-normal opacity-80">{MODE_RULES[key].codes ? 'Releases codes after approval' : 'No codes'}</span>
              </button>
            );
          })}
        </div>
        {lines.length > 0 && <p className="portal-field-hint">Changing what is being sold clears the item list.</p>}
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        {/* Left: people + items */}
        <div className="space-y-5 xl:col-span-2">
          <div className="glass-card rounded-2xl p-5">
            <h2 className="portal-card-title mb-4 font-semibold">Buyer{rule.codes ? ' and code recipient' : ''}</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {isSuper && (
                <div className="md:col-span-2">
                  <label className="label" htmlFor="ar-center">Center <span className="portal-required">*</span></label>
                  <select ref={centerRef} id="ar-center" className="glass-input mt-1.5 w-full rounded-xl px-4 py-2.5 text-sm" value={centerId} onChange={(e) => setCenterId(e.target.value)} disabled={submitting}>
                    <option value="">Choose center</option>
                    {centers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="label" htmlFor="ar-buyer">Buyer username {rule.member ? <span className="portal-required">*</span> : '(optional)'}</label>
                <input
                  ref={buyerRef}
                  id="ar-buyer" className="glass-input mt-1.5 min-h-[44px] w-full rounded-xl px-4 text-sm" value={buyerUsername}
                  onChange={(e) => { setBuyerUsername(e.target.value); buyer.clear(); }}
                  onBlur={() => buyer.lookup(buyerUsername)}
                  onKeyDown={(e) => { if (isPlainEnter(e)) { e.preventDefault(); lookupBuyerThenFocusItems(); } }}
                  placeholder="Member username - Enter to look up" autoComplete="off" disabled={submitting}
                />
                <MemberCard lookup={buyer} onClear={clearBuyer} clearLabel="Clear buyer" showStockist />
                {stockistMissing && <p className="portal-danger-text mt-1 text-xs">This member is not registered as a stockist, so stockist prices do not apply.</p>}
              </div>
              <div>
                <label className="label" htmlFor="ar-buyer-name">Name on the receipt (optional)</label>
                <input id="ar-buyer-name" className="glass-input mt-1.5 min-h-[44px] w-full rounded-xl px-4 text-sm" value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)} maxLength={160} placeholder={buyer.member?.full_name || 'Walk-in'} disabled={submitting} />
                <p className="portal-field-hint mt-1 text-xs">Defaults to the member's name.</p>
              </div>
              {rule.codes && (
                <div className="md:col-span-2">
                  {!showRecipient ? (
                    <p className="portal-card-text flex flex-wrap items-center gap-x-2 text-sm">
                      <span>Codes go to {buyer.member ? <strong>{buyer.member.username}</strong> : 'the buyer'}</span>
                      <span aria-hidden="true" className="portal-card-muted">&middot;</span>
                      <button type="button" onClick={() => setRecipientOpen(true)} disabled={submitting}
                        className={`portal-gold-text min-h-[44px] rounded-lg px-1 font-semibold underline underline-offset-2 disabled:opacity-50 ${FOCUS_RING}`}>
                        Change
                      </button>
                    </p>
                  ) : (
                    <>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <label className="label !mb-0" htmlFor="ar-recipient">Send codes to (username)</label>
                        <button type="button" onClick={resetRecipient} disabled={submitting}
                          className={`portal-gold-text min-h-[44px] rounded-lg px-1 text-sm font-semibold underline underline-offset-2 disabled:opacity-50 ${FOCUS_RING}`}>
                          Use the buyer
                        </button>
                      </div>
                      <input
                        ref={recipientRef}
                        id="ar-recipient" className="glass-input mt-1.5 min-h-[44px] w-full rounded-xl px-4 text-sm" value={recipientUsername}
                        onChange={(e) => { setRecipientUsername(e.target.value); recipient.clear(); }}
                        onBlur={() => recipient.lookup(recipientUsername)}
                        onKeyDown={(e) => { if (isPlainEnter(e)) { e.preventDefault(); recipient.lookup(recipientUsername); } }}
                        placeholder={buyer.member ? `${buyer.member.username} (the buyer)` : 'Leave blank to send to the buyer'} autoComplete="off" disabled={submitting}
                      />
                      <MemberCard
                        lookup={recipient}
                        onClear={() => { setRecipientUsername(''); recipient.clear(); recipientRef.current?.focus(); }}
                        clearLabel="Clear recipient"
                      />
                      <p className="portal-field-hint mt-1 text-xs">Must be the buyer or someone in the buyer's binary downline. Codes go straight into this account after approval; nobody handles them.</p>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5">
            <h2 className="portal-card-title mb-3 font-semibold">Items</h2>
            <div className="relative">
              <HiOutlineSearch className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2" style={{ color: 'var(--portal-card-muted)' }} aria-hidden="true" />
              <input
                ref={searchRef}
                className="glass-input min-h-[44px] w-full rounded-xl pl-9 pr-14 text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (!isPlainEnter(e)) return;
                  e.preventDefault();
                  if (quick) addItem(Number(quick.hits[0].producttype), quick.qty);
                  else if (options[0]) addItem(Number(options[0].producttype));
                }}
                placeholder={loading ? 'Loading price list...' : `Search ${rule.kind === 'package' ? 'packages' : 'products'} - Enter adds the first match`}
                aria-label="Search items"
                aria-keyshortcuts="/"
                disabled={loading || submitting}
              />
              <span className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 sm:inline"><Kbd>/</Kbd></span>
            </div>
            <p className="portal-field-hint mt-1.5 text-xs" aria-live="polite">
              {quick
                ? <>Enter adds <strong className={MONEY}>{Math.min(quick.qty, maxQty)} &times; {quick.hits[0].item_name}</strong>.</>
                : <>Tip: type a quantity with the name, like <strong>300 gold</strong>, and press Enter to add them all at once.</>}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {options.map((p) => {
                const type = Number(p.producttype);
                const inCart = qtyByType.get(type) || 0;
                return (
                  <button key={p.producttype} type="button" onClick={() => addItem(type)} disabled={submitting}
                    aria-label={`${p.item_name}, ${peso(p[rule.priceField])}${inCart ? `, ${inCart} in the list` : ''}`}
                    className={`portal-muted-button relative min-h-[44px] rounded-xl px-3 text-left text-sm disabled:cursor-not-allowed disabled:opacity-60 ${FOCUS_RING} ${inCart ? 'ring-1 ring-gold-700 dark:ring-gold-500' : ''}`}>
                    <span className="portal-card-title block font-semibold">{p.item_name}</span>
                    <span className={`portal-gold-text block text-xs font-semibold ${MONEY}`}>{peso(p[rule.priceField])}</span>
                    {inCart > 0 && (
                      <span aria-hidden="true" className={`absolute -right-2 -top-2 min-w-[24px] rounded-full px-1.5 text-center text-xs font-bold leading-6 ${MONEY}`}
                        style={{ background: '#D4AF37', color: '#18120a' }}>
                        &times;{inCart}
                      </span>
                    )}
                  </button>
                );
              })}
              {!loading && !loadError && options.length === 0 && (
                <p className="portal-card-muted text-sm">No {rule.kind === 'package' ? 'packages' : 'products'} match, or none have a price set for this mode.</p>
              )}
            </div>

            {priced.rows.length > 0 && (
              <div className="mt-5 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="table-header">
                      <th className="px-3 py-2 text-left">Item</th>
                      <th className="px-3 py-2 text-right">Unit</th>
                      {rule.discount && <th className="px-3 py-2 text-right">Discount</th>}
                      <th className="px-3 py-2 text-center">Qty</th>
                      <th className="px-3 py-2 text-right">Total</th>
                      <th className="px-3 py-2"><span className="sr-only">Remove</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {priced.rows.map((row) => (
                      <tr key={row.producttype} className="portal-row-divider">
                        <td className="portal-card-text px-3 py-2">{row.name}</td>
                        <td className={`portal-card-text px-3 py-2 text-right ${MONEY}`}>{peso(row.unit)}</td>
                        {rule.discount && <td className={`portal-success-text px-3 py-2 text-right ${MONEY}`}>{row.each ? `- ${peso(row.each)}` : '-'}</td>}
                        <td className="px-3 py-2">
                          <div className="flex items-center justify-center gap-1">
                            <button type="button" aria-label={`One fewer ${row.name}`} className={`portal-table-icon-button flex size-11 items-center justify-center rounded-lg ${FOCUS_RING}`}
                              onClick={() => setQty(row.producttype, row.qty - 1)} disabled={submitting || row.qty <= 1}>
                              <HiOutlineMinus aria-hidden="true" />
                            </button>
                            <input type="number" inputMode="numeric" min="1" max={maxQty} aria-label={`Quantity of ${row.name}`}
                              className="glass-input min-h-[44px] w-20 rounded-lg px-2 text-center text-sm tabular-nums" value={row.qty}
                              onChange={(e) => setQty(row.producttype, e.target.value)} disabled={submitting} />
                            <button type="button" aria-label={`One more ${row.name}`} className={`portal-table-icon-button flex size-11 items-center justify-center rounded-lg ${FOCUS_RING}`}
                              onClick={() => setQty(row.producttype, row.qty + 1)} disabled={submitting || row.qty >= maxQty}>
                              <HiOutlinePlus aria-hidden="true" />
                            </button>
                          </div>
                        </td>
                        <td className={`portal-card-title px-3 py-2 text-right font-semibold ${MONEY}`}>{peso(row.total)}</td>
                        <td className="px-3 py-2 text-right">
                          <button type="button" aria-label={`Remove ${row.name}`} className={`portal-table-icon-button flex size-11 items-center justify-center rounded-lg ${FOCUS_RING}`}
                            onClick={() => setLines((prev) => prev.filter((l) => l.producttype !== row.producttype))} disabled={submitting}>
                            <HiOutlineTrash aria-hidden="true" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right: summary, payment, save. Sticky on xl; on smaller screens Save lives in the bottom bar. */}
        <div className="space-y-5">
          <div className="glass-card rounded-2xl p-5 xl:sticky xl:top-4">
            <h2 className="portal-card-title mb-3 font-semibold">Summary</h2>
            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="portal-card-muted">Lines</dt>
                <dd className={`portal-card-text ${MONEY}`}>{priced.rows.length} ({itemCount} item{itemCount === 1 ? '' : 's'})</dd>
              </div>
              <div className="flex justify-between gap-3"><dt className="portal-card-muted">Subtotal</dt><dd className={`portal-card-text ${MONEY}`}>{peso(priced.subtotal)}</dd></div>
              {rule.discount && (
                <div className="flex justify-between gap-3">
                  <dt className="portal-card-muted">Stockist discount{stockistType ? ` (${STOCKIST_LABELS[stockistType]})` : ''}</dt>
                  <dd className={`portal-success-text ${MONEY}`}>- {peso(priced.discount)}</dd>
                </div>
              )}
              <div className="portal-row-divider flex items-baseline justify-between gap-3 border-t pt-3">
                <dt className="portal-card-title text-base font-bold">Estimated total</dt>
                <dd className={`portal-gold-text text-3xl font-bold ${MONEY}`}>{peso(priced.total)}</dd>
              </div>
            </dl>
            <p className="portal-field-hint mt-2 text-xs">Estimate only. The final amount is set by the server from the price list when you save.</p>
            {splitParts && !tooManyCodes && (
              <div className="portal-soft-panel mt-4 rounded-xl p-3 text-sm" role="status">
                <p className="portal-card-title font-semibold">This order will be saved as {splitParts.length} ARs</p>
                <p className="portal-card-muted mt-1 text-xs">One AR holds at most {MAX_CODES_PER_AR} codes. Each part gets its own AR number and is approved separately.</p>
                <ul className="mt-2 space-y-0.5">
                  {splitParts.map((part, i) => (
                    <li key={i} className="portal-card-text flex justify-between gap-3 text-xs">
                      <span>Part {i + 1}</span>
                      <span className={MONEY}>{part.reduce((s, l) => s + l.qty, 0)} codes</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="portal-row-divider mt-5 space-y-4 border-t pt-5">
              <div>
                <label className="label" htmlFor="ar-pay">Paid by</label>
                <select id="ar-pay" className="glass-input mt-1.5 min-h-[44px] w-full rounded-xl px-4 text-sm" value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)} disabled={submitting || rule.voucher}>
                  {Object.entries(PAYMENT_LABELS)
                    .filter(([key]) => (rule.voucher ? key === 'voucher' : key !== 'voucher'))
                    .map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="ar-ref">Reference no. (optional)</label>
                <input id="ar-ref" className="glass-input mt-1.5 min-h-[44px] w-full rounded-xl px-4 text-sm" value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)} maxLength={120} placeholder="GCash / bank reference" disabled={submitting} />
              </div>

              <button type="button" onClick={() => setMoreOpen((open) => !open)} aria-expanded={showMore} aria-controls="ar-more-details"
                className={`portal-gold-text flex min-h-[44px] w-full items-center justify-between rounded-lg text-sm font-semibold ${FOCUS_RING}`}>
                <span>More details <span className="portal-card-muted font-normal">(released by, notes)</span></span>
                <HiOutlineChevronDown aria-hidden="true" className={`size-4 transition-transform ${showMore ? 'rotate-180' : ''}`} />
              </button>
              {showMore && (
                <div id="ar-more-details" className="space-y-4">
                  <div>
                    <label className="label" htmlFor="ar-released">Released by (optional)</label>
                    <input id="ar-released" className="glass-input mt-1.5 min-h-[44px] w-full rounded-xl px-4 text-sm" value={releasedBy}
                      onChange={(e) => setReleasedBy(e.target.value)} maxLength={120} placeholder="For bulk orders" disabled={submitting} />
                  </div>
                  <div>
                    <label className="label" htmlFor="ar-notes">Notes (optional)</label>
                    <textarea id="ar-notes" className="glass-input mt-1.5 w-full rounded-xl px-4 py-2.5 text-sm" rows={2} value={notes}
                      onChange={(e) => setNotes(e.target.value)} maxLength={500} disabled={submitting} />
                  </div>
                </div>
              )}
            </div>

            <button type="submit" disabled={!canSubmit} aria-busy={submitting} aria-keyshortcuts={`${MOD_KEY}+Enter`}
              className={`gold-btn mt-5 hidden min-h-[44px] w-full items-center justify-center rounded-xl px-4 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50 xl:flex ${FOCUS_RING}`}>
              {saveLabel}
            </button>
            <p className="portal-card-muted mt-2 hidden items-center justify-center gap-1 text-xs xl:flex">
              <Kbd>{MOD_KEY}</Kbd><Kbd>Enter</Kbd> to save
            </p>
            {buyerRequiredMissing && lines.length > 0 && <p className="portal-danger-text mt-2 text-xs">Look up the buyer's username first.</p>}
            {buyerProblem && <p className="portal-danger-text mt-2 text-xs">Look up the buyer's username, or clear it to save without a buyer.</p>}
            {recipientProblem && <p className="portal-danger-text mt-2 text-xs">Look up the code recipient, or choose "Use the buyer".</p>}
            {tooManyCodes && <p className="portal-danger-text mt-2 text-xs" role="alert">This order would generate {itemCount} codes. One order can hold at most {MAX_ORDER_CODES} ({MAX_SPLIT_PARTS} ARs of {MAX_CODES_PER_AR}); save the rest as another order.</p>}
            {isSuper && !centerId && <p className="portal-danger-text mt-2 text-xs">Choose a center.</p>}
          </div>
        </div>
      </div>

      {showBar && (
        <>
          <div className="h-20 xl:hidden" aria-hidden="true" />
          <div className="fixed inset-x-0 bottom-[calc(64px+env(safe-area-inset-bottom,0px))] z-20 border-t px-4 py-3 shadow-2xl lg:bottom-0 lg:left-[272px] xl:hidden"
            style={{ background: 'var(--portal-modal-bg)', borderColor: 'var(--portal-soft-border)' }}>
            <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
              <div>
                <p className="portal-card-muted text-xs">Estimated total</p>
                <p className={`portal-gold-text text-xl font-bold ${MONEY}`}>{peso(priced.total)}</p>
              </div>
              <button type="submit" disabled={!canSubmit} aria-busy={submitting}
                className={`gold-btn inline-flex min-h-[44px] items-center justify-center rounded-xl px-6 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS_RING}`}>
                {saveBarLabel}
              </button>
            </div>
          </div>
        </>
      )}
    </form>
  );
}

/** Shown after a split order is saved: every part, so the cashier can open or print each one. */
function SplitSaved({ result, onNew }) {
  return (
    <div>
      <PageHeader
        title={`Order saved as ${result.parts.length} ARs`}
        subtitle="Each part has its own AR number and waits for its own Super Admin approval. Open a part to print it."
      />
      <div className="glass-card rounded-2xl p-5">
        <ul className="space-y-2">
          {result.parts.map((part, i) => (
            <li key={part.id} className="portal-row-divider flex flex-wrap items-center justify-between gap-3 border-b pb-2 last:border-b-0">
              <span className="flex flex-wrap items-center gap-2">
                <Link to={`/admin/ar/${part.id}`} className={`portal-gold-text font-semibold hover:underline ${AR_NO} ${FOCUS_RING}`}>{formatArNo(part.arNo)}</Link>
                <PartChip part={i + 1} count={result.parts.length} />
                <StatusChip status={part.status} />
              </span>
              <span className={`portal-card-title font-semibold ${MONEY}`}>{peso(part.total)}</span>
            </li>
          ))}
        </ul>
        <div className="portal-row-divider mt-4 flex items-baseline justify-between gap-3 border-t pt-3">
          <span className="portal-card-title font-bold">Order total</span>
          <span className={`portal-gold-text text-2xl font-bold ${MONEY}`}>{peso(result.groupTotal)}</span>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <button type="button" className={BTN_PRIMARY} onClick={onNew}>New AR</button>
          <Link to="/admin/ar" className={BTN_SECONDARY}>All ARs</Link>
        </div>
      </div>
    </div>
  );
}

/** Compact result of a username lookup: name, username, stockist badge, and a clear button. */
function MemberCard({ lookup, onClear, clearLabel, showStockist = false }) {
  if (lookup.status === 'loading') return <p className="portal-card-muted mt-1 text-xs" role="status">Looking up...</p>;
  if (lookup.status === 'error') return <p className="portal-danger-text mt-1 text-xs" role="alert">{lookup.error}</p>;
  if (lookup.status !== 'found') return null;
  const { member } = lookup;
  return (
    <div className="portal-soft-panel mt-2 flex items-center justify-between gap-2 rounded-xl py-1.5 pl-3 pr-1.5" role="status">
      <div className="min-w-0">
        <p className="portal-card-title truncate text-sm font-semibold">{member.full_name || member.username}</p>
        <p className="portal-card-muted flex flex-wrap items-center gap-x-2 text-xs">
          <span>{member.username}</span>
          {showStockist && member.stockistType ? (
            <span className="portal-accent-chip rounded-full px-2 text-xs font-semibold whitespace-nowrap">{STOCKIST_LABELS[member.stockistType]} stockist</span>
          ) : null}
        </p>
      </div>
      <button type="button" onClick={onClear} aria-label={clearLabel}
        className={`portal-table-icon-button flex size-11 shrink-0 items-center justify-center rounded-lg ${FOCUS_RING}`}>
        <HiOutlineX aria-hidden="true" />
      </button>
    </div>
  );
}
