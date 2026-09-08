// Demo-only data + in-memory store for Proposal 0023 (AR Management + Code
// Request automation). Everything here is SAMPLE DATA for a management
// discussion prototype — nothing is persisted, nothing calls the real API,
// and no code string produced here is a real activation code.
//
// Both ARManagement.jsx and CodeRequests.jsx import this module so the two
// screens stay in sync during a single demo session (e.g. an AR saved on
// page 1 appears as a pending request on page 2) without a router reload
// and without a state library — a tiny subscribe/notify pattern is enough
// for a two-page prototype.

// ---------------------------------------------------------------------------
// Static reference data
// ---------------------------------------------------------------------------

// Proposal 0023 Part II restrictions table — which AR modes are allowed to
// trigger a code generation/transfer request. Kept as data, not scattered
// if/else in the pages, so the restrictions table in the written proposal
// maps 1:1 to one place in code.
export const AR_MODES = [
  {
    id: 'packages',
    label: 'Packages',
    canGenerateCodes: true,
    catalog: 'packages',
    noCodeReason: null,
  },
  {
    id: 'cash_member_stockist',
    label: 'CASH — Member / Stockist Price',
    canGenerateCodes: true,
    catalog: 'products',
    noCodeReason: null,
  },
  {
    id: 'cash_srp',
    label: 'CASH — SRP',
    canGenerateCodes: false,
    catalog: 'products',
    noCodeReason: 'Retail (SRP) cash sales do not issue member codes for this AR.',
  },
  {
    id: 'voucher',
    label: 'Voucher',
    canGenerateCodes: false,
    catalog: 'packages',
    noCodeReason: 'Voucher redemptions are handled by the existing voucher system — this AR is a record only; no code request is issued here.',
  },
];

export function getArMode(modeId) {
  return AR_MODES.find((mode) => mode.id === modeId) || AR_MODES[0];
}

export const CASHIERS = [
  { id: 'csh-01', name: 'Marife Ocampo', username: 'MarifeO' },
  { id: 'csh-02', name: 'Renato Buenaventura', username: 'RenatoB' },
  { id: 'csh-03', name: 'Angelica Dizon', username: 'AngelicaD' },
];

// The cashier the demo session is "logged in" as. Fixed on purpose — the
// proposal's condition I.5 is that an AR is tied to a specific cashier, so
// the New AR form must show this as a value, never a dropdown to pick from.
export const CURRENT_CASHIER = CASHIERS[0];

export const MEMBERS = [
  { id: 'mem-01', name: 'Rosalie Mallari', username: 'RosalieM' },
  { id: 'mem-02', name: 'Jervy Latumbo', username: 'JervyL' },
  { id: 'mem-03', name: 'Rowell Mahinay', username: 'RowellM' },
  { id: 'mem-04', name: 'Armando Palma', username: 'ArmandoP' },
  { id: 'mem-05', name: 'Rendell Jimenez', username: 'RendellJ' },
  { id: 'mem-06', name: 'Delia Santillan', username: 'DeliaS' },
  { id: 'mem-07', name: 'Vernie Suarez', username: 'VernieS01' },
  { id: 'mem-08', name: 'Ronald Lagnason', username: 'RonaldL01' },
  { id: 'mem-09', name: 'Eunice Topacio', username: 'Eunicetop01' },
  { id: 'mem-10', name: 'Denmark Lagnason', username: 'DenmarkL01' },
  { id: 'mem-11', name: 'Redheart Suarez', username: 'redheart' },
  { id: 'mem-12', name: 'Nestor Balagtas', username: 'Nestor56' },
];

// Packages catalog — condition-locked amounts from the comp plan.
export const PACKAGE_CATALOG = [
  { id: 'pkg-bronze', name: 'Bronze Package', packagePrice: 2500 },
  { id: 'pkg-silver', name: 'Silver Package', packagePrice: 5000 },
  { id: 'pkg-gold', name: 'Gold Package', packagePrice: 10000 },
  { id: 'pkg-platinum', name: 'Platinum Package', packagePrice: 25000 },
  { id: 'pkg-garnet', name: 'Garnet Package', packagePrice: 50000 },
  { id: 'pkg-diamond', name: 'Diamond Package', packagePrice: 150000 },
];

// Repurchase/maintenance products — three price tiers so the CASH modes can
// demonstrate the member/stockist vs SRP distinction from the proposal.
export const PRODUCT_CATALOG = [
  { id: 'prd-coffee', name: 'Nogatu Wellness Coffee (25s)', memberPrice: 450, stockistPrice: 500, srpPrice: 650 },
  { id: 'prd-soap', name: 'Nogatu Herbal Soap', memberPrice: 120, stockistPrice: 150, srpPrice: 199 },
  { id: 'prd-multivit', name: 'Nogatu Multivitamins', memberPrice: 380, stockistPrice: 420, srpPrice: 550 },
  { id: 'prd-lotion', name: 'Nogatu Whitening Lotion', memberPrice: 280, stockistPrice: 320, srpPrice: 420 },
];

export function getCatalogForMode(modeId) {
  const mode = getArMode(modeId);
  return mode.catalog === 'packages' ? PACKAGE_CATALOG : PRODUCT_CATALOG;
}

// Resolves the per-unit price for a catalog line depending on the AR mode
// (and, for the member/stockist mode, which of the two tiers was picked).
export function getUnitPrice(modeId, catalogItem, priceTier = 'member') {
  if (!catalogItem) return 0;
  if (modeId === 'packages' || modeId === 'voucher') return catalogItem.packagePrice ?? 0;
  if (modeId === 'cash_srp') return catalogItem.srpPrice ?? 0;
  if (modeId === 'cash_member_stockist') {
    return priceTier === 'stockist' ? catalogItem.stockistPrice ?? 0 : catalogItem.memberPrice ?? 0;
  }
  return 0;
}

// ---------------------------------------------------------------------------
// In-memory mutable store (demo session only — resets on page reload)
// ---------------------------------------------------------------------------

let nextArSequence = 1009; // next fresh (non-legacy) AR number to assign
let nextRequestId = 6; // seed data below occupies request ids 1-5

const listeners = new Set();
function notify() {
  listeners.forEach((callback) => callback());
}

// Subscribe to any change in the shared demo store. Returns an unsubscribe
// function. Pairs with React's useSyncExternalStore in both pages so the
// two screens re-render whenever either one mutates the shared arrays.
export function subscribeToDemoStore(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function formatArNumber(sequence) {
  return `AR-2026-${String(sequence).padStart(5, '0')}`;
}

export function getNextArNumberPreview() {
  return formatArNumber(nextArSequence);
}

// Seed ARs — mostly Node-era sequential numbers, one legacy encode.
const acknowledgementReceipts = [
  {
    id: 'ar-1001',
    number: 'AR-2026-01001',
    date: '2026-09-01',
    cashier: 'MarifeO',
    memberName: 'Rosalie Mallari',
    memberUsername: 'RosalieM',
    mode: 'packages',
    lineItems: [{ name: 'Diamond Package', quantity: 1, unitPrice: 150000, lineTotal: 150000 }],
    total: 150000,
    codesIssued: true,
    isLegacy: false,
  },
  {
    id: 'ar-1002',
    number: 'AR-2026-01002',
    date: '2026-09-01',
    cashier: 'RenatoB',
    memberName: 'Jervy Latumbo',
    memberUsername: 'JervyL',
    mode: 'cash_member_stockist',
    lineItems: [{ name: 'Nogatu Wellness Coffee (25s)', quantity: 4, unitPrice: 450, lineTotal: 1800 }],
    total: 1800,
    codesIssued: true,
    isLegacy: false,
  },
  {
    id: 'ar-1003',
    number: 'AR-2026-01003',
    date: '2026-09-02',
    cashier: 'AngelicaD',
    memberName: 'Rowell Mahinay',
    memberUsername: 'RowellM',
    mode: 'cash_srp',
    lineItems: [{ name: 'Nogatu Herbal Soap', quantity: 10, unitPrice: 199, lineTotal: 1990 }],
    total: 1990,
    codesIssued: false,
    isLegacy: false,
  },
  {
    id: 'ar-1004',
    number: 'AR-2026-01004',
    date: '2026-09-02',
    cashier: 'MarifeO',
    memberName: 'Armando Palma',
    memberUsername: 'ArmandoP',
    mode: 'voucher',
    lineItems: [{ name: 'Silver Package', quantity: 1, unitPrice: 5000, lineTotal: 5000 }],
    total: 5000,
    codesIssued: false,
    isLegacy: false,
  },
  {
    id: 'ar-1005',
    number: 'AR-2026-01005',
    date: '2026-09-03',
    cashier: 'RenatoB',
    memberName: 'Rendell Jimenez',
    memberUsername: 'RendellJ',
    mode: 'packages',
    lineItems: [{ name: 'Gold Package', quantity: 1, unitPrice: 10000, lineTotal: 10000 }],
    total: 10000,
    codesIssued: true,
    isLegacy: false,
  },
  {
    id: 'ar-legacy-0042',
    number: 'LEGACY-0042',
    date: '2026-03-14',
    cashier: 'AngelicaD',
    memberName: 'Delia Santillan',
    memberUsername: 'DeliaS',
    mode: 'packages',
    lineItems: [{ name: 'Bronze Package', quantity: 1, unitPrice: 2500, lineTotal: 2500 }],
    total: 2500,
    codesIssued: true,
    isLegacy: true,
  },
  {
    id: 'ar-1006',
    number: 'AR-2026-01006',
    date: '2026-09-04',
    cashier: 'MarifeO',
    memberName: 'Vernie Suarez',
    memberUsername: 'VernieS01',
    mode: 'cash_member_stockist',
    lineItems: [{ name: 'Nogatu Multivitamins', quantity: 6, unitPrice: 420, lineTotal: 2520 }],
    total: 2520,
    codesIssued: true,
    isLegacy: false,
  },
  {
    id: 'ar-1007',
    number: 'AR-2026-01007',
    date: '2026-09-05',
    cashier: 'RenatoB',
    memberName: 'Ronald Lagnason',
    memberUsername: 'RonaldL01',
    mode: 'packages',
    lineItems: [{ name: 'Platinum Package', quantity: 1, unitPrice: 25000, lineTotal: 25000 }],
    total: 25000,
    codesIssued: true,
    isLegacy: false,
  },
];

// Seed pending/approved code requests — each tied to an AR above.
const codeRequests = [
  {
    id: 1,
    arNumber: 'AR-2026-01001',
    cashier: 'MarifeO',
    memberName: 'Rosalie Mallari',
    memberUsername: 'RosalieM',
    requestedItems: [{ name: 'Diamond Package', quantity: 1 }],
    sameNetworkTree: true,
    status: 'pending',
    rejectionReason: null,
  },
  {
    id: 2,
    arNumber: 'AR-2026-01002',
    cashier: 'RenatoB',
    memberName: 'Jervy Latumbo',
    memberUsername: 'JervyL',
    requestedItems: [{ name: 'Nogatu Wellness Coffee (25s)', quantity: 4 }],
    sameNetworkTree: true,
    status: 'pending',
    rejectionReason: null,
  },
  {
    id: 3,
    arNumber: 'AR-2026-01005',
    cashier: 'RenatoB',
    memberName: 'Rendell Jimenez',
    memberUsername: 'RendellJ',
    requestedItems: [{ name: 'Gold Package', quantity: 1 }],
    sameNetworkTree: false,
    status: 'pending',
    rejectionReason: null,
  },
  {
    id: 4,
    arNumber: 'AR-2026-01006',
    cashier: 'MarifeO',
    memberName: 'Vernie Suarez',
    memberUsername: 'VernieS01',
    requestedItems: [{ name: 'Nogatu Multivitamins', quantity: 6 }],
    sameNetworkTree: true,
    status: 'approved',
    rejectionReason: null,
  },
  {
    id: 5,
    arNumber: 'AR-2026-01007',
    cashier: 'RenatoB',
    memberName: 'Ronald Lagnason',
    memberUsername: 'RonaldL01',
    requestedItems: [{ name: 'Platinum Package', quantity: 1 }],
    sameNetworkTree: true,
    status: 'rejected',
    rejectionReason: 'Duplicate of AR-2026-01007A, cancelled by cashier.',
  },
];

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export function getAcknowledgementReceipts() {
  return acknowledgementReceipts;
}

export function getCodeRequests() {
  return codeRequests;
}

// ---------------------------------------------------------------------------
// Mutations — demo-session only, never touches a server
// ---------------------------------------------------------------------------

// Saves a new AR. For a fresh (non-legacy) AR the number is auto-assigned
// from the running sequence; for a legacy encode the caller supplies the
// free-text number and date. When the mode allows codes, a matching pending
// request is pushed so it shows up immediately on the Code Requests screen.
export function saveAcknowledgementReceipt({
  isLegacy,
  legacyNumber,
  legacyDate,
  cashier,
  memberName,
  memberUsername,
  mode,
  lineItems,
  total,
}) {
  const modeConfig = getArMode(mode);
  const number = isLegacy ? legacyNumber.trim() : formatArNumber(nextArSequence);
  const date = isLegacy ? legacyDate : new Date().toISOString().slice(0, 10);

  const record = {
    id: `ar-${Date.now()}`,
    number,
    date,
    cashier,
    memberName,
    memberUsername,
    mode,
    lineItems,
    total,
    codesIssued: modeConfig.canGenerateCodes,
    isLegacy: Boolean(isLegacy),
  };

  acknowledgementReceipts.unshift(record);
  if (!isLegacy) nextArSequence += 1;

  if (modeConfig.canGenerateCodes) {
    codeRequests.unshift({
      id: nextRequestId++,
      arNumber: number,
      cashier,
      memberName,
      memberUsername,
      requestedItems: lineItems.map((line) => ({ name: line.name, quantity: line.quantity })),
      // Demo heuristic only: flags roughly a third of new requests as a
      // different-tree placement so the reviewer always has something to
      // exercise the blocked-approval path with. A real build would resolve
      // this from the actual sponsor/binary tree data.
      sameNetworkTree: codeRequests.length % 3 !== 0,
      status: 'pending',
      rejectionReason: null,
    });
  }

  notify();
  return record;
}

export function approveCodeRequest(requestId) {
  const request = codeRequests.find((row) => row.id === requestId);
  if (!request || request.status !== 'pending' || !request.sameNetworkTree) return;
  request.status = 'approved';
  request.rejectionReason = null;
  notify();
}

export function rejectCodeRequest(requestId, reason) {
  const request = codeRequests.find((row) => row.id === requestId);
  if (!request || request.status !== 'pending') return;
  request.status = 'rejected';
  request.rejectionReason = reason;
  notify();
}
