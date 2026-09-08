import { useEffect, useState, useSyncExternalStore } from 'react';
import toast from 'react-hot-toast';
import {
  HiOutlineCheckCircle,
  HiOutlineKey,
  HiOutlinePlus,
  HiOutlinePrinter,
  HiOutlineTrash,
  HiOutlineX,
} from 'react-icons/hi';
import {
  TRANSACTION_MODES,
  CASHIERS,
  CURRENT_CASHIER,
  MEMBERS,
  getTransactionMode,
  getCatalogForMode,
  getUnitPrice,
  getNextArNumberPreview,
  getAcknowledgementReceipts,
  saveAcknowledgementReceipt,
  requestCodeGeneration,
  releaseCodes,
  subscribeToTransactionUpdates,
} from '../../data/cashieringData';

const ALL_FILTER = 'all';

const CODE_STATUS_STYLES = {
  no_codes: { label: 'No codes', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.1)' },
  not_requested: { label: 'Not requested', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.14)' },
  pending: { label: 'Pending approval', background: 'rgba(234,179,8,0.12)', color: '#fbbf24', border: '1px solid rgba(234,179,8,0.25)' },
  approved: { label: 'Approved — ready to release', background: 'rgba(59,130,246,0.12)', color: '#93c5fd', border: '1px solid rgba(59,130,246,0.25)' },
  rejected: { label: 'Rejected', background: 'rgba(248,113,113,0.12)', color: '#f87171', border: '1px solid rgba(248,113,113,0.25)' },
  released: { label: 'Released', background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.22)' },
};

function CodeStatusBadge({ receipt }) {
  const key = !receipt.canGenerateCodes ? 'no_codes' : receipt.codeStatus || 'not_requested';
  const style = CODE_STATUS_STYLES[key];
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap"
      style={{ background: style.background, color: style.color, border: style.border }}
    >
      {style.label}
    </span>
  );
}

function LegacyBadge() {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ml-2"
      style={{ background: 'rgba(99,102,241,0.12)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.22)' }}
    >
      LEGACY
    </span>
  );
}

function RemarksList({ remarks }) {
  if (!remarks || remarks.length === 0) {
    return <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>No remarks yet</span>;
  }
  return (
    <div className="space-y-0.5">
      {remarks.map((remark) => (
        <div key={`${remark.text}-${remark.at}`} className="text-xs leading-snug" style={{ color: 'rgba(255,255,255,0.6)' }}>
          {remark.text} <span style={{ color: 'rgba(255,255,255,0.35)' }}>· {remark.at}</span>
        </div>
      ))}
    </div>
  );
}

function nextItemKey() {
  return `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export default function ARManagement() {
  const acknowledgementReceipts = useSyncExternalStore(subscribeToTransactionUpdates, getAcknowledgementReceipts);

  const [isLegacy, setIsLegacy] = useState(false);
  const [legacyNumber, setLegacyNumber] = useState('');
  const [legacyDate, setLegacyDate] = useState('');
  const [memberQuery, setMemberQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);
  const [mode, setMode] = useState(TRANSACTION_MODES[0].id);
  const [priceTier, setPriceTier] = useState('member');
  const [items, setItems] = useState([]);
  const [discountInput, setDiscountInput] = useState('0');
  const [note, setNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('wallet');
  const [saving, setSaving] = useState(false);

  const [cashierFilter, setCashierFilter] = useState(ALL_FILTER);
  const [modeFilter, setModeFilter] = useState(ALL_FILTER);
  const [searchText, setSearchText] = useState('');

  const [printingReceipt, setPrintingReceipt] = useState(null);
  const [releasingReceipt, setReleasingReceipt] = useState(null);
  const [releaseUsernameInput, setReleaseUsernameInput] = useState('');

  const modeConfig = getTransactionMode(mode);
  const catalogItems = getCatalogForMode(mode);
  const todayDate = new Date().toISOString().slice(0, 10);

  // A Bronze package line has no meaning once the mode switches to a
  // product catalog, so clear the builder whenever the mode changes.
  useEffect(() => {
    setItems([]);
    setPriceTier('member');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const resolvedLines = items.map((row) => {
    const catalogItem = catalogItems.find((entry) => entry.id === row.catalogId);
    return {
      key: row.key,
      catalogId: row.catalogId,
      name: catalogItem?.name || '',
      quantity: row.quantity,
      unitPrice: row.unitPrice,
      lineTotal: row.quantity * row.unitPrice,
    };
  });
  const subTotal = resolvedLines.reduce((sum, line) => sum + line.lineTotal, 0);
  const discountValue = Math.max(0, Number(discountInput) || 0);
  const total = Math.max(0, subTotal - discountValue);

  const matchingMembers = memberQuery.trim()
    ? MEMBERS.filter((member) => {
        const q = memberQuery.trim().toLowerCase();
        return member.name.toLowerCase().includes(q) || member.username.toLowerCase().includes(q);
      }).slice(0, 6)
    : [];

  function addItemRow() {
    const defaultCatalogItem = catalogItems[0];
    setItems((prev) => [
      ...prev,
      {
        key: nextItemKey(),
        catalogId: defaultCatalogItem?.id || '',
        unitPrice: getUnitPrice(mode, defaultCatalogItem, priceTier),
        quantity: 1,
      },
    ]);
  }

  function updateItemRow(key, field, value) {
    setItems((prev) => prev.map((row) => {
      if (row.key !== key) return row;
      if (field === 'catalogId') {
        const catalogItem = catalogItems.find((entry) => entry.id === value);
        return { ...row, catalogId: value, unitPrice: getUnitPrice(mode, catalogItem, priceTier) };
      }
      if (field === 'unitPrice') return { ...row, unitPrice: Math.max(0, Number(value) || 0) };
      if (field === 'quantity') return { ...row, quantity: Math.max(1, Number(value) || 1) };
      return row;
    }));
  }

  function removeItemRow(key) {
    setItems((prev) => prev.filter((row) => row.key !== key));
  }

  function handlePriceTierChange(nextTier) {
    setPriceTier(nextTier);
    setItems((prev) => prev.map((row) => {
      const catalogItem = catalogItems.find((entry) => entry.id === row.catalogId);
      return { ...row, unitPrice: getUnitPrice(mode, catalogItem, nextTier) };
    }));
  }

  function resetForm() {
    setIsLegacy(false);
    setLegacyNumber('');
    setLegacyDate('');
    setSelectedMember(null);
    setMemberQuery('');
    setMode(TRANSACTION_MODES[0].id);
    setPriceTier('member');
    setItems([]);
    setDiscountInput('0');
    setNote('');
    setPaymentMethod('wallet');
  }

  function handleSave(e) {
    e.preventDefault();
    if (saving) return;
    if (!selectedMember) { toast.error('Search and select a member first'); return; }
    if (items.length === 0) { toast.error('Add at least one transacted item'); return; }
    if (resolvedLines.some((line) => !line.catalogId)) { toast.error('Choose a product for every line'); return; }
    if (isLegacy && !legacyNumber.trim()) { toast.error('Enter the legacy AR number'); return; }
    if (isLegacy && !legacyDate) { toast.error('Enter the legacy AR date'); return; }

    setSaving(true);
    try {
      const record = saveAcknowledgementReceipt({
        isLegacy,
        legacyNumber,
        legacyDate,
        cashier: CURRENT_CASHIER.username,
        memberName: selectedMember.name,
        memberUsername: selectedMember.username,
        mode,
        lineItems: resolvedLines.map(({ name, quantity, unitPrice, lineTotal }) => ({ name, quantity, unitPrice, lineTotal })),
        discount: discountValue,
        note,
        paymentMethod,
      });
      toast.success(
        modeConfig.canGenerateCodes
          ? `${record.number} saved. Generate codes from the AR list when you're ready.`
          : `${record.number} saved — this transaction mode does not issue codes.`
      );
      resetForm();
    } finally {
      setSaving(false);
    }
  }

  function handleGenerateCodes(receipt) {
    const result = requestCodeGeneration(receipt.id);
    if (result.success) {
      toast.success(`${receipt.number} sent to Code Approvals for manager review.`);
    } else {
      toast.error(result.error);
    }
  }

  function openReleaseDialog(receipt) {
    setReleasingReceipt(receipt);
    setReleaseUsernameInput('');
  }

  function handleConfirmRelease() {
    if (!releasingReceipt) return;
    const result = releaseCodes(releasingReceipt.id, releaseUsernameInput);
    if (result.success) {
      toast.success(`Codes released to @${releasingReceipt.memberUsername}.`);
      setReleasingReceipt(null);
    } else {
      toast.error(result.error);
    }
  }

  const filteredReceipts = acknowledgementReceipts.filter((ar) => {
    if (cashierFilter !== ALL_FILTER && ar.cashier !== cashierFilter) return false;
    if (modeFilter !== ALL_FILTER && ar.mode !== modeFilter) return false;
    const q = searchText.trim().toLowerCase();
    if (!q) return true;
    return (
      ar.number.toLowerCase().includes(q) ||
      ar.memberName.toLowerCase().includes(q) ||
      ar.memberUsername.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <div className="mb-7">
        <h1 className="font-display text-2xl font-bold text-white">Transact Order</h1>
        <div className="w-12 h-0.5 mt-2" style={{ background: 'linear-gradient(90deg,#D4AF37,transparent)' }} />
        <p className="mt-3 text-sm max-w-2xl" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Take a member&apos;s order, confirm payment, and print the Acknowledgement Receipt (AR). Once
          released, codes for that order are generated and delivered in the background — never
          handed over by hand.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Order form */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between gap-3 mb-1">
            <h3 className="font-semibold text-white">New Order</h3>
            <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid rgba(212,175,55,0.2)' }}>
              <button
                type="button"
                onClick={() => setIsLegacy(false)}
                className="text-xs px-3 py-2 font-medium cursor-pointer"
                style={{ background: !isLegacy ? 'rgba(212,175,55,0.16)' : 'transparent', color: !isLegacy ? '#D4AF37' : 'rgba(255,255,255,0.5)' }}
              >
                New AR
              </button>
              <button
                type="button"
                onClick={() => setIsLegacy(true)}
                className="text-xs px-3 py-2 font-medium cursor-pointer"
                style={{ background: isLegacy ? 'rgba(212,175,55,0.16)' : 'transparent', color: isLegacy ? '#D4AF37' : 'rgba(255,255,255,0.5)' }}
              >
                Encode Legacy AR
              </button>
            </div>
          </div>
          <p className="text-xs mb-5" style={{ color: 'rgba(255,255,255,0.35)' }}>
            {isLegacy
              ? 'Back-record an AR that was issued on paper before this system existed.'
              : 'AR numbers are assigned sequentially by the system on save.'}
          </p>

          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">{isLegacy ? 'Legacy AR Date' : 'Transaction Date'}</label>
                {isLegacy ? (
                  <input
                    type="date"
                    value={legacyDate}
                    onChange={(e) => setLegacyDate(e.target.value)}
                    className="glass-input w-full rounded-xl px-4 py-2.5 text-sm mt-1.5"
                  />
                ) : (
                  <input
                    type="date"
                    value={todayDate}
                    readOnly
                    className="glass-input w-full rounded-xl px-4 py-2.5 text-sm mt-1.5 opacity-70 cursor-not-allowed"
                  />
                )}
              </div>
              <div>
                <label className="label">AR Number</label>
                {isLegacy ? (
                  <input
                    type="text"
                    value={legacyNumber}
                    onChange={(e) => setLegacyNumber(e.target.value)}
                    className="glass-input w-full rounded-xl px-4 py-2.5 text-sm mt-1.5"
                    placeholder="e.g. LEGACY-0099"
                  />
                ) : (
                  <input
                    type="text"
                    value={getNextArNumberPreview()}
                    readOnly
                    className="glass-input w-full rounded-xl px-4 py-2.5 text-sm mt-1.5 opacity-70 cursor-not-allowed"
                  />
                )}
              </div>
            </div>

            <div>
              <label className="label">Cashier</label>
              <input
                type="text"
                value={`${CURRENT_CASHIER.name} (@${CURRENT_CASHIER.username})`}
                readOnly
                title="An AR is tied to the cashier who created it."
                className="glass-input w-full rounded-xl px-4 py-2.5 text-sm mt-1.5 opacity-70 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="label">Member</label>
              {selectedMember ? (
                <div
                  className="flex items-center justify-between rounded-xl px-4 py-2.5 mt-1.5"
                  style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.25)' }}
                >
                  <span className="text-sm" style={{ color: '#F2D06B' }}>
                    {selectedMember.name} <span style={{ color: 'rgba(255,255,255,0.4)' }}>(@{selectedMember.username})</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => { setSelectedMember(null); setMemberQuery(''); }}
                    className="cursor-pointer"
                    style={{ color: 'rgba(255,255,255,0.5)' }}
                    aria-label="Change member"
                  >
                    <HiOutlineX className="size-4" />
                  </button>
                </div>
              ) : (
                <div className="relative mt-1.5">
                  <input
                    type="text"
                    value={memberQuery}
                    onChange={(e) => setMemberQuery(e.target.value)}
                    className="glass-input w-full rounded-xl px-4 py-2.5 text-sm"
                    placeholder="Search member by name or username"
                  />
                  {memberQuery.trim() && (
                    <div
                      className="absolute z-10 w-full mt-1 rounded-xl overflow-hidden max-h-56 overflow-y-auto"
                      style={{ background: '#15161a', border: '1px solid rgba(212,175,55,0.2)' }}
                    >
                      {matchingMembers.length === 0 ? (
                        <div className="px-4 py-3 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                          No members match &quot;{memberQuery}&quot;
                        </div>
                      ) : (
                        matchingMembers.map((member) => (
                          <button
                            key={member.id}
                            type="button"
                            onClick={() => { setSelectedMember(member); setMemberQuery(''); }}
                            className="w-full text-left px-4 py-2.5 text-sm cursor-pointer motion-safe:transition-colors hover:bg-[rgba(212,175,55,0.08)]"
                            style={{ color: 'rgba(255,255,255,0.8)' }}
                          >
                            {member.name} <span style={{ color: 'rgba(255,255,255,0.35)' }}>(@{member.username})</span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="label mb-2">Transaction Mode</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1.5">
                {TRANSACTION_MODES.map((modeOption) => {
                  const selected = mode === modeOption.id;
                  return (
                    <button
                      key={modeOption.id}
                      type="button"
                      onClick={() => setMode(modeOption.id)}
                      className="text-left p-3 rounded-xl cursor-pointer motion-safe:transition-all"
                      style={{
                        background: selected ? 'rgba(212,175,55,0.12)' : 'rgba(255,255,255,0.03)',
                        border: selected ? '1.5px solid rgba(212,175,55,0.35)' : '1.5px solid rgba(255,255,255,0.06)',
                      }}
                    >
                      <div className="text-xs font-bold" style={{ color: selected ? '#D4AF37' : 'rgba(255,255,255,0.75)' }}>
                        {modeOption.label}
                      </div>
                      <div className="text-[10px] mt-1 font-semibold" style={{ color: modeOption.canGenerateCodes ? '#34d399' : '#fbbf24' }}>
                        {modeOption.canGenerateCodes ? 'Generates codes' : 'No codes issued'}
                      </div>
                    </button>
                  );
                })}
              </div>
              {!modeConfig.canGenerateCodes && (
                <p className="text-[11px] mt-2 leading-relaxed" style={{ color: '#fbbf24' }}>
                  {modeConfig.noCodeReason} The AR is still saved and remains valid — it simply issues no
                  code request.
                </p>
              )}
            </div>

            {mode === 'cash_member_stockist' && (
              <div>
                <label className="label mb-2">Price Tier</label>
                <div className="flex gap-2 mt-1.5">
                  {['member', 'stockist'].map((tier) => (
                    <button
                      key={tier}
                      type="button"
                      onClick={() => handlePriceTierChange(tier)}
                      className="flex-1 py-2.5 rounded-lg text-xs font-semibold cursor-pointer capitalize"
                      style={{
                        background: priceTier === tier ? 'rgba(212,175,55,0.16)' : 'rgba(255,255,255,0.03)',
                        color: priceTier === tier ? '#D4AF37' : 'rgba(255,255,255,0.5)',
                        border: '1px solid rgba(212,175,55,0.15)',
                      }}
                    >
                      {tier} price
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-semibold text-white">Transacted Items</h4>
                  <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    Pick a product to prefill its price, then adjust if needed.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addItemRow}
                  className="rounded-lg px-3 py-2 text-xs font-medium cursor-pointer inline-flex items-center gap-1.5 flex-shrink-0"
                  style={{ background: 'rgba(212,175,55,0.14)', border: '1px solid rgba(212,175,55,0.3)', color: '#D4AF37', minHeight: 36 }}
                >
                  <HiOutlinePlus className="size-4" />
                  Add Line
                </button>
              </div>

              <div className="mt-4 space-y-3">
                {items.length === 0 ? (
                  <div className="p-4 text-xs text-center rounded-xl" style={{ color: 'rgba(255,255,255,0.35)', border: '1px dashed rgba(255,255,255,0.1)' }}>
                    No items yet — click Add Line to start the order.
                  </div>
                ) : (
                  items.map((row) => {
                    const lineTotal = row.quantity * row.unitPrice;
                    return (
                      <div key={row.key} className="rounded-xl p-3 space-y-2" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="grid grid-cols-1 md:grid-cols-[1.4fr_0.7fr_0.55fr_auto] gap-2 items-end">
                          <div>
                            <label className="text-[11px] block mb-1" style={{ color: 'rgba(255,255,255,0.45)' }}>Product</label>
                            <select
                              value={row.catalogId}
                              onChange={(e) => updateItemRow(row.key, 'catalogId', e.target.value)}
                              className="glass-input w-full rounded-lg px-3 py-2 text-sm"
                            >
                              <option value="">Select product...</option>
                              {catalogItems.map((catalogItem) => (
                                <option key={catalogItem.id} value={catalogItem.id}>
                                  {catalogItem.name} — ₱{getUnitPrice(mode, catalogItem, priceTier).toLocaleString()}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-[11px] block mb-1" style={{ color: 'rgba(255,255,255,0.45)' }}>Unit Price</label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={row.unitPrice}
                              onChange={(e) => updateItemRow(row.key, 'unitPrice', e.target.value)}
                              className="glass-input w-full rounded-lg px-3 py-2 text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] block mb-1" style={{ color: 'rgba(255,255,255,0.45)' }}>Qty</label>
                            <input
                              type="number"
                              min="1"
                              value={row.quantity}
                              onChange={(e) => updateItemRow(row.key, 'quantity', e.target.value)}
                              className="glass-input w-full rounded-lg px-3 py-2 text-sm text-center"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeItemRow(row.key)}
                            className="rounded-lg flex items-center justify-center cursor-pointer flex-shrink-0"
                            style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', color: '#f87171', width: 40, minHeight: 40 }}
                            aria-label="Remove line"
                          >
                            <HiOutlineTrash className="size-4" />
                          </button>
                        </div>
                        <p className="text-[11px] text-right" style={{ color: 'rgba(255,255,255,0.4)' }}>
                          Line total: <span className="font-semibold tabular-nums" style={{ color: '#F2D06B' }}>₱{lineTotal.toLocaleString()}</span>
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div>
              <label className="label">Note <span className="font-normal" style={{ color: 'rgba(255,255,255,0.35)' }}>(optional)</span></label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                maxLength={500}
                placeholder="Add a note for this order (e.g. cashier remarks)…"
                className="glass-input w-full rounded-xl px-4 py-2.5 text-sm mt-1.5 resize-none"
              />
            </div>

            <div>
              <label className="label mb-2">Payment Method</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1.5">
                {[
                  { value: 'wallet', title: 'From e-wallet', sub: "Deducts the member's e-wallet balance" },
                  { value: 'cash', title: 'Cash at office', sub: 'No e-wallet deduction — paid in person' },
                ].map((option) => {
                  const active = paymentMethod === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setPaymentMethod(option.value)}
                      className="text-left rounded-xl px-3.5 py-3 cursor-pointer motion-safe:transition-colors"
                      style={{
                        background: active ? 'rgba(212,175,55,0.12)' : 'rgba(255,255,255,0.03)',
                        border: active ? '1px solid rgba(212,175,55,0.5)' : '1px solid rgba(255,255,255,0.08)',
                      }}
                      aria-pressed={active}
                    >
                      <div className="flex items-center gap-2">
                        <span className="size-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ border: active ? '5px solid #D4AF37' : '2px solid rgba(255,255,255,0.3)' }} />
                        <span className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>{option.title}</span>
                      </div>
                      <p className="text-[11px] mt-1 ml-6" style={{ color: 'rgba(255,255,255,0.4)' }}>{option.sub}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.5)' }}>Sub Total</p>
                <p className="mt-1 text-base font-semibold tabular-nums" style={{ color: 'rgba(255,255,255,0.85)' }}>₱{subTotal.toLocaleString()}</p>
              </div>
              <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <label className="text-[11px] block" style={{ color: 'rgba(255,255,255,0.5)' }}>Discount</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={discountInput}
                  onChange={(e) => setDiscountInput(e.target.value)}
                  className="glass-input w-full rounded-lg px-2 py-1.5 text-sm mt-1 tabular-nums"
                />
              </div>
              <div className="rounded-xl p-3" style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)' }}>
                <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.5)' }}>Total</p>
                <p className="mt-1 text-lg font-bold tabular-nums" style={{ color: '#D4AF37' }}>₱{total.toLocaleString()}</p>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="gold-btn w-full rounded-xl py-3 px-5 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ minHeight: 44 }}
            >
              {saving ? 'Transacting...' : 'Transact'}
            </button>
          </form>
        </div>

        {/* AR List */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-semibold text-white mb-1">AR List</h3>
          <p className="text-xs mb-5" style={{ color: 'rgba(255,255,255,0.35)' }}>
            {filteredReceipts.length} of {acknowledgementReceipts.length} record(s)
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <select
              value={cashierFilter}
              onChange={(e) => setCashierFilter(e.target.value)}
              className="glass-input rounded-xl px-3 py-2.5 text-sm"
            >
              <option value={ALL_FILTER}>All Cashiers</option>
              {CASHIERS.map((cashier) => (
                <option key={cashier.id} value={cashier.username}>{cashier.name}</option>
              ))}
            </select>
            <select
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value)}
              className="glass-input rounded-xl px-3 py-2.5 text-sm"
            >
              <option value={ALL_FILTER}>All Modes</option>
              {TRANSACTION_MODES.map((modeOption) => (
                <option key={modeOption.id} value={modeOption.id}>{modeOption.label}</option>
              ))}
            </select>
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="glass-input rounded-xl px-3 py-2.5 text-sm"
              placeholder="Search number or member"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  {['Number', 'Date', 'Cashier', 'Member', 'Mode', 'Total', 'Codes', 'Remarks', 'Actions'].map((heading) => (
                    <th key={heading} className="table-header py-3 px-4 text-left font-semibold text-xs uppercase tracking-wide whitespace-nowrap">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredReceipts.map((ar, idx) => {
                  const canRequest = ar.canGenerateCodes && !ar.codeStatus;
                  const canRelease = ar.codeStatus === 'approved';
                  return (
                    <tr key={ar.id} style={{ background: idx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                      <td className="py-3 px-4 font-mono text-xs whitespace-nowrap" style={{ color: '#D4AF37' }}>
                        {ar.number}
                        {ar.isLegacy && <LegacyBadge />}
                      </td>
                      <td className="py-3 px-4 text-xs whitespace-nowrap" style={{ color: 'rgba(255,255,255,0.4)' }}>{ar.date}</td>
                      <td className="py-3 px-4 text-xs whitespace-nowrap" style={{ color: 'rgba(255,255,255,0.65)' }}>{ar.cashier}</td>
                      <td className="py-3 px-4 text-xs">
                        <div style={{ color: 'rgba(255,255,255,0.8)' }}>{ar.memberName}</div>
                        <div style={{ color: 'rgba(255,255,255,0.4)' }}>@{ar.memberUsername}</div>
                      </td>
                      <td className="py-3 px-4 text-xs whitespace-nowrap" style={{ color: 'rgba(255,255,255,0.65)' }}>{getTransactionMode(ar.mode).label}</td>
                      <td className="py-3 px-4 text-xs text-right tabular-nums whitespace-nowrap" style={{ color: '#F2D06B' }}>₱{ar.total.toLocaleString()}</td>
                      <td className="py-3 px-4"><CodeStatusBadge receipt={ar} /></td>
                      <td className="py-3 px-4 min-w-[180px]"><RemarksList remarks={ar.remarks} /></td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1.5 min-w-[150px]">
                          <button
                            type="button"
                            onClick={() => setPrintingReceipt(ar)}
                            className="rounded-lg py-2 px-3 text-xs font-medium border cursor-pointer inline-flex items-center justify-center gap-1.5"
                            style={{ borderColor: 'rgba(255,255,255,0.14)', color: 'rgba(255,255,255,0.75)', background: 'rgba(255,255,255,0.04)', minHeight: 36 }}
                          >
                            <HiOutlinePrinter className="size-3.5" />
                            Print AR
                          </button>
                          <button
                            type="button"
                            onClick={() => handleGenerateCodes(ar)}
                            disabled={!canRequest}
                            title={!ar.canGenerateCodes ? modeConfigNoCodeTitle(ar) : ar.codeStatus ? 'Codes have already been requested for this AR.' : undefined}
                            className="rounded-lg py-2 px-3 text-xs font-medium border cursor-pointer disabled:cursor-not-allowed disabled:opacity-35 inline-flex items-center justify-center gap-1.5"
                            style={{ borderColor: 'rgba(59,130,246,0.35)', color: '#93c5fd', background: 'rgba(59,130,246,0.1)', minHeight: 36 }}
                          >
                            <HiOutlineKey className="size-3.5" />
                            Generate Codes
                          </button>
                          <button
                            type="button"
                            onClick={() => openReleaseDialog(ar)}
                            disabled={!canRelease}
                            title={canRelease ? undefined : 'Codes must be approved before they can be released.'}
                            className="rounded-lg py-2 px-3 text-xs font-semibold cursor-pointer disabled:cursor-not-allowed disabled:opacity-35 inline-flex items-center justify-center gap-1.5"
                            style={{ background: 'linear-gradient(135deg,#16a34a,#15803d)', color: '#fff', minHeight: 36 }}
                          >
                            <HiOutlineCheckCircle className="size-3.5" />
                            Release Codes
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredReceipts.length === 0 && (
                  <tr>
                    <td colSpan="9" className="py-12 text-center text-sm" style={{ color: 'rgba(255,255,255,0.25)' }}>
                      No ARs match the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Print AR — a printable receipt view. The inline style block scopes
          window.print() to just this receipt so the rest of the admin panel
          never ends up on paper. */}
      {printingReceipt && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onMouseDown={() => setPrintingReceipt(null)}
        >
          <style>{`
            @media print {
              body * { visibility: hidden !important; }
              #ar-print-receipt, #ar-print-receipt * { visibility: visible !important; }
              #ar-print-receipt { position: fixed; inset: 0; width: 100%; padding: 32px; }
            }
          `}</style>
          <div
            onMouseDown={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl overflow-hidden max-h-[88vh] flex flex-col"
            style={{ background: '#15161a', border: '1px solid rgba(255,255,255,0.12)' }}
          >
            <div id="ar-print-receipt" className="p-6 overflow-y-auto" style={{ background: '#ffffff', color: '#111827' }}>
              <div className="flex items-start justify-between gap-3 pb-4" style={{ borderBottom: '1px solid #e5e7eb' }}>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em]" style={{ color: '#9ca3af' }}>NOGATU Alliance</p>
                  <h2 className="text-lg font-bold mt-1">Acknowledgement Receipt</h2>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm font-semibold">{printingReceipt.number}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#6b7280' }}>{printingReceipt.date}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 py-4 text-sm" style={{ borderBottom: '1px solid #e5e7eb' }}>
                <div>
                  <p className="text-[11px] uppercase tracking-wide" style={{ color: '#9ca3af' }}>Cashier</p>
                  <p className="mt-0.5">{printingReceipt.cashier}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide" style={{ color: '#9ca3af' }}>Member</p>
                  <p className="mt-0.5">{printingReceipt.memberName} (@{printingReceipt.memberUsername})</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide" style={{ color: '#9ca3af' }}>Transaction Mode</p>
                  <p className="mt-0.5">{getTransactionMode(printingReceipt.mode).label}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide" style={{ color: '#9ca3af' }}>Payment Method</p>
                  <p className="mt-0.5">{printingReceipt.paymentMethod === 'cash' ? 'Cash at office' : 'E-wallet'}</p>
                </div>
              </div>

              <table className="w-full text-sm mt-4">
                <thead>
                  <tr style={{ color: '#6b7280' }}>
                    <th className="text-left font-medium pb-2">Item</th>
                    <th className="text-center font-medium pb-2">Qty</th>
                    <th className="text-right font-medium pb-2">Unit Price</th>
                    <th className="text-right font-medium pb-2">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {printingReceipt.lineItems.map((line) => (
                    <tr key={line.name} style={{ borderTop: '1px solid #f3f4f6' }}>
                      <td className="py-2">{line.name}</td>
                      <td className="py-2 text-center">{line.quantity}</td>
                      <td className="py-2 text-right tabular-nums">₱{line.unitPrice.toLocaleString()}</td>
                      <td className="py-2 text-right tabular-nums">₱{line.lineTotal.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {printingReceipt.note && (
                <p className="text-xs mt-4" style={{ color: '#6b7280' }}>Note: {printingReceipt.note}</p>
              )}

              <div className="mt-4 pt-4 space-y-1 text-sm" style={{ borderTop: '1px solid #e5e7eb' }}>
                <div className="flex justify-between"><span style={{ color: '#6b7280' }}>Sub Total</span><span className="tabular-nums">₱{printingReceipt.subTotal.toLocaleString()}</span></div>
                <div className="flex justify-between"><span style={{ color: '#6b7280' }}>Discount</span><span className="tabular-nums">₱{printingReceipt.discount.toLocaleString()}</span></div>
                <div className="flex justify-between text-base font-bold"><span>Total</span><span className="tabular-nums">₱{printingReceipt.total.toLocaleString()}</span></div>
              </div>
            </div>

            <div className="flex justify-end gap-2 p-4" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <button
                type="button"
                onClick={() => setPrintingReceipt(null)}
                className="rounded-xl py-2.5 px-4 text-sm font-medium border cursor-pointer"
                style={{ borderColor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.05)', minHeight: 44 }}
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="gold-btn rounded-xl py-2.5 px-4 text-sm font-semibold inline-flex items-center gap-2"
                style={{ minHeight: 44 }}
              >
                <HiOutlinePrinter className="size-4" />
                Print
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Release Codes — requires the member's own username as a final check */}
      {releasingReceipt && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onMouseDown={() => setReleasingReceipt(null)}
        >
          <div
            onMouseDown={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl p-6"
            style={{ background: '#15161a', border: '1px solid rgba(255,255,255,0.12)' }}
          >
            <div className="flex items-start gap-3">
              <div
                className="size-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(16,185,129,0.14)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399' }}
              >
                <HiOutlineCheckCircle className="size-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-display text-lg font-bold text-white">Release Codes</h3>
                <p className="text-sm mt-1.5" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  Releasing codes for <strong style={{ color: '#D4AF37' }}>{releasingReceipt.number}</strong> to{' '}
                  <strong style={{ color: '#D4AF37' }}>{releasingReceipt.memberName}</strong>. Enter the member&apos;s
                  username to confirm.
                </p>
              </div>
            </div>

            <div className="mt-4">
              <label className="label">Member Username</label>
              <input
                type="text"
                value={releaseUsernameInput}
                onChange={(e) => setReleaseUsernameInput(e.target.value)}
                className="glass-input w-full rounded-xl px-4 py-2.5 text-sm mt-1.5"
                placeholder={`@${releasingReceipt.memberUsername}`}
              />
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button
                type="button"
                onClick={() => setReleasingReceipt(null)}
                className="rounded-xl py-2.5 px-4 text-sm font-medium border cursor-pointer"
                style={{ borderColor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.05)', minHeight: 44 }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRelease}
                className="rounded-xl py-2.5 px-4 text-sm font-semibold text-white cursor-pointer"
                style={{ background: 'linear-gradient(135deg,#16a34a,#15803d)', minHeight: 44 }}
              >
                Confirm Release
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function modeConfigNoCodeTitle(ar) {
  return getTransactionMode(ar.mode).noCodeReason || 'This transaction mode does not issue codes.';
}
