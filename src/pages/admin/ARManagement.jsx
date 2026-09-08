import { useEffect, useState, useSyncExternalStore } from 'react';
import toast from 'react-hot-toast';
import { HiOutlineExclamation, HiOutlinePlus, HiOutlineTrash, HiOutlineX } from 'react-icons/hi';
import {
  AR_MODES,
  CASHIERS,
  CURRENT_CASHIER,
  MEMBERS,
  getArMode,
  getCatalogForMode,
  getUnitPrice,
  getNextArNumberPreview,
  getAcknowledgementReceipts,
  saveAcknowledgementReceipt,
  subscribeToDemoStore,
} from '../../data/proposal0023Demo';

const ALL_FILTER = 'all';

function PrototypeBanner() {
  return (
    <div
      className="glass-card rounded-2xl p-4 mb-6 flex items-start gap-3"
      style={{ border: '1px solid rgba(212,175,55,0.4)', background: 'rgba(212,175,55,0.06)' }}
    >
      <HiOutlineExclamation className="size-5 flex-shrink-0 mt-0.5" style={{ color: '#D4AF37' }} />
      <div>
        <p className="text-sm font-semibold" style={{ color: '#D4AF37' }}>
          Prototype for Proposal 0023 — not a live feature
        </p>
        <p className="text-xs mt-1 leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
          Every cashier, member, AR number and total on this screen is sample data held only in this
          browser tab for the discussion meeting. Nothing here is saved to a server, no API is called,
          and no code shown or referenced anywhere in this prototype is a real activation code.
        </p>
      </div>
    </div>
  );
}

function CodesBadge({ issued }) {
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
      style={issued
        ? { background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.22)' }
        : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.1)' }}
    >
      {issued ? 'Codes issued' : 'No codes'}
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

export default function ARManagement() {
  const acknowledgementReceipts = useSyncExternalStore(subscribeToDemoStore, getAcknowledgementReceipts);

  const [isLegacy, setIsLegacy] = useState(false);
  const [legacyNumber, setLegacyNumber] = useState('');
  const [legacyDate, setLegacyDate] = useState('');
  const [memberQuery, setMemberQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);
  const [mode, setMode] = useState(AR_MODES[0].id);
  const [priceTier, setPriceTier] = useState('member');
  const [lineItems, setLineItems] = useState([]);
  const [draftCatalogId, setDraftCatalogId] = useState('');
  const [draftQuantity, setDraftQuantity] = useState(1);
  const [saving, setSaving] = useState(false);

  const [cashierFilter, setCashierFilter] = useState(ALL_FILTER);
  const [modeFilter, setModeFilter] = useState(ALL_FILTER);
  const [searchText, setSearchText] = useState('');

  const modeConfig = getArMode(mode);
  const catalogItems = getCatalogForMode(mode);

  // Reset the line-item builder whenever the mode changes — a Bronze
  // package line has no meaning once the mode switches to a product catalog.
  useEffect(() => {
    setDraftCatalogId(catalogItems[0]?.id || '');
    setLineItems([]);
    setPriceTier('member');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const total = lineItems.reduce((sum, line) => sum + line.lineTotal, 0);

  const matchingMembers = memberQuery.trim()
    ? MEMBERS.filter((member) => {
        const q = memberQuery.trim().toLowerCase();
        return member.name.toLowerCase().includes(q) || member.username.toLowerCase().includes(q);
      }).slice(0, 6)
    : [];

  function handlePriceTierChange(nextTier) {
    setPriceTier(nextTier);
    setLineItems((prev) => prev.map((line) => {
      const catalogItem = catalogItems.find((item) => item.id === line.catalogId);
      const unitPrice = getUnitPrice(mode, catalogItem, nextTier);
      return { ...line, unitPrice, lineTotal: unitPrice * line.quantity };
    }));
  }

  function handleAddLineItem() {
    const catalogItem = catalogItems.find((item) => item.id === draftCatalogId);
    if (!catalogItem) { toast.error('Choose an item to add'); return; }
    const quantity = Number(draftQuantity);
    if (!Number.isFinite(quantity) || quantity < 1) { toast.error('Enter a valid quantity'); return; }
    const unitPrice = getUnitPrice(mode, catalogItem, priceTier);
    setLineItems((prev) => [
      ...prev,
      { key: `${catalogItem.id}-${Date.now()}`, catalogId: catalogItem.id, name: catalogItem.name, quantity, unitPrice, lineTotal: unitPrice * quantity },
    ]);
    setDraftQuantity(1);
  }

  function handleRemoveLineItem(key) {
    setLineItems((prev) => prev.filter((line) => line.key !== key));
  }

  function resetForm() {
    setIsLegacy(false);
    setLegacyNumber('');
    setLegacyDate('');
    setSelectedMember(null);
    setMemberQuery('');
    setMode(AR_MODES[0].id);
    setPriceTier('member');
    setLineItems([]);
  }

  function handleSave(e) {
    e.preventDefault();
    if (saving) return;
    if (!selectedMember) { toast.error('Search and select a member first'); return; }
    if (lineItems.length === 0) { toast.error('Add at least one line item'); return; }
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
        lineItems: lineItems.map(({ name, quantity, unitPrice, lineTotal }) => ({ name, quantity, unitPrice, lineTotal })),
        total,
      });
      toast.success(
        modeConfig.canGenerateCodes
          ? `${record.number} saved — code request sent to the Manager Approval queue.`
          : `${record.number} saved — no codes will be issued for this AR.`
      );
      resetForm();
    } finally {
      setSaving(false);
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
        <h1 className="font-display text-2xl font-bold text-white">AR Management</h1>
        <div className="w-12 h-0.5 mt-2" style={{ background: 'linear-gradient(90deg,#D4AF37,transparent)' }} />
        <p className="mt-3 text-sm max-w-2xl" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Proposal 0023, Part I — digitizing the Acknowledgement Receipt so accounting can automate
          monthly sales reports per network, reimbursements and payouts, and code transfer.
        </p>
      </div>

      <PrototypeBanner />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* New AR */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between gap-3 mb-1">
            <h3 className="font-semibold text-white">New AR</h3>
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
              ? 'Back-record an AR that was issued before this system existed.'
              : 'AR numbers are assigned sequentially by the system on save.'}
          </p>

          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <div>
                <label className="label">Cashier</label>
                <input
                  type="text"
                  value={`${CURRENT_CASHIER.name} (@${CURRENT_CASHIER.username})`}
                  readOnly
                  title="An AR is tied to the cashier who created it — this is fixed, not a choice."
                  className="glass-input w-full rounded-xl px-4 py-2.5 text-sm mt-1.5 opacity-70 cursor-not-allowed"
                />
              </div>
            </div>

            {isLegacy && (
              <div>
                <label className="label">Legacy AR Date</label>
                <input
                  type="date"
                  value={legacyDate}
                  onChange={(e) => setLegacyDate(e.target.value)}
                  className="glass-input w-full rounded-xl px-4 py-2.5 text-sm mt-1.5"
                />
              </div>
            )}

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
              <label className="label mb-2">Mode</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1.5">
                {AR_MODES.map((modeOption) => {
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

            <div>
              <label className="label mb-2">Line Items</label>
              <div className="flex gap-2 mt-1.5">
                <select
                  value={draftCatalogId}
                  onChange={(e) => setDraftCatalogId(e.target.value)}
                  className="glass-input flex-1 min-w-0 rounded-xl px-3 py-2.5 text-sm"
                >
                  {catalogItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} — ₱{getUnitPrice(mode, item, priceTier).toLocaleString()}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min="1"
                  value={draftQuantity}
                  onChange={(e) => setDraftQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                  className="glass-input w-16 rounded-xl px-2 py-2.5 text-sm text-center"
                  aria-label="Quantity"
                />
                <button
                  type="button"
                  onClick={handleAddLineItem}
                  className="rounded-xl flex items-center justify-center cursor-pointer flex-shrink-0"
                  style={{ background: 'rgba(212,175,55,0.14)', border: '1px solid rgba(212,175,55,0.3)', color: '#D4AF37', width: 44, minHeight: 44 }}
                  aria-label="Add line item"
                >
                  <HiOutlinePlus className="size-4" />
                </button>
              </div>

              <div className="mt-3 rounded-xl overflow-hidden overflow-x-auto" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                {lineItems.length === 0 ? (
                  <div className="p-4 text-xs text-center" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    No line items added yet.
                  </div>
                ) : (
                  <table className="w-full text-xs">
                    <tbody>
                      {lineItems.map((line) => (
                        <tr key={line.key} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td className="px-3 py-2" style={{ color: 'rgba(255,255,255,0.75)' }}>{line.name}</td>
                          <td className="px-3 py-2 text-center whitespace-nowrap" style={{ color: 'rgba(255,255,255,0.5)' }}>&times; {line.quantity}</td>
                          <td className="px-3 py-2 text-right tabular-nums whitespace-nowrap" style={{ color: '#F2D06B' }}>₱{line.lineTotal.toLocaleString()}</td>
                          <td className="p-2">
                            <button
                              type="button"
                              onClick={() => handleRemoveLineItem(line.key)}
                              className="cursor-pointer"
                              style={{ color: 'rgba(248,113,113,0.7)' }}
                              aria-label={`Remove ${line.name}`}
                            >
                              <HiOutlineTrash className="size-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              <div className="flex justify-between items-center mt-3 px-1">
                <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.5)' }}>Total</span>
                <span className="text-lg font-bold tabular-nums" style={{ color: '#D4AF37' }}>₱{total.toLocaleString()}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="btn-success w-full rounded-xl py-3 px-5 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              style={{ minHeight: 44 }}
            >
              {saving ? 'Saving...' : 'Save AR'}
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
              {AR_MODES.map((modeOption) => (
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
                  {['Number', 'Date', 'Cashier', 'Member', 'Mode', 'Total', 'Codes'].map((heading) => (
                    <th key={heading} className="table-header py-3 px-4 text-left font-semibold text-xs uppercase tracking-wide whitespace-nowrap">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredReceipts.map((ar, idx) => (
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
                    <td className="py-3 px-4 text-xs whitespace-nowrap" style={{ color: 'rgba(255,255,255,0.65)' }}>{getArMode(ar.mode).label}</td>
                    <td className="py-3 px-4 text-xs text-right tabular-nums whitespace-nowrap" style={{ color: '#F2D06B' }}>₱{ar.total.toLocaleString()}</td>
                    <td className="py-3 px-4"><CodesBadge issued={ar.codesIssued} /></td>
                  </tr>
                ))}
                {filteredReceipts.length === 0 && (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-sm" style={{ color: 'rgba(255,255,255,0.25)' }}>
                      No ARs match the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
