import { MAINTENANCE_PRODUCTS } from '../constants/maintenanceProducts';

// In-memory order desk store backing the Transact Order and Code Approvals
// admin screens. Both pages import this module so an order transacted on one
// screen shows up immediately in the other's queue (e.g. a saved AR appears
// as a pending code approval) without a router reload or a state library —
// a small subscribe/notify pattern is enough for two pages sharing one store.

// ---------------------------------------------------------------------------
// Static reference data
// ---------------------------------------------------------------------------

// Which transaction modes are allowed to trigger a code generation request,
// and which catalog (packages vs. repurchase products) a line item is drawn
// from. Kept as data rather than scattered if/else so every screen reads the
// same rule from one place.
export const TRANSACTION_MODES = [
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
    noCodeReason: 'Voucher redemptions are handled by the voucher system — this AR is a record only; no code request is issued here.',
  },
];

export function getTransactionMode(modeId) {
  return TRANSACTION_MODES.find((mode) => mode.id === modeId) || TRANSACTION_MODES[0];
}

export const CASHIERS = [
  { id: 'csh-01', name: 'Marife Ocampo', username: 'MarifeO' },
  { id: 'csh-02', name: 'Renato Buenaventura', username: 'RenatoB' },
  { id: 'csh-03', name: 'Angelica Dizon', username: 'AngelicaD' },
];

// The cashier this session is signed in as. An AR is always tied to the
// cashier who created it, so the order form shows this as a fixed value
// rather than a dropdown to pick from.
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

// Members whose sponsor placement sits under a different upline than the
// cashier's own network — codes for them cannot be approved for transfer
// until that is resolved. A real build resolves this from the actual
// sponsor/binary tree; kept as a fixed set here so the screens have a
// stable, explainable case to show either way.
const DIFFERENT_TREE_USERNAMES = new Set(['RendellJ', 'Eunicetop01']);

function isSameNetworkTree(memberUsername) {
  return !DIFFERENT_TREE_USERNAMES.has(memberUsername);
}

// Packages catalog.
export const PACKAGE_CATALOG = [
  { id: 'pkg-bronze', name: 'Bronze Package', packagePrice: 2500 },
  { id: 'pkg-silver', name: 'Silver Package', packagePrice: 5000 },
  { id: 'pkg-gold', name: 'Gold Package', packagePrice: 10000 },
  { id: 'pkg-platinum', name: 'Platinum Package', packagePrice: 25000 },
  { id: 'pkg-garnet', name: 'Garnet Package', packagePrice: 50000 },
  { id: 'pkg-diamond', name: 'Diamond Package', packagePrice: 150000 },
];

// Repurchase products come from the real maintenance catalogue so the names and
// prices on a receipt match what the business actually sells.
//
// The three price tiers all resolve to the same catalogue price on purpose. This
// system holds ONE price per product; a member/stockist/SRP price list does not
// exist as data anywhere. Rather than invent numbers that would end up on a
// printed receipt, the tiers read the real price until a price list is supplied.
export const PRODUCT_CATALOG = MAINTENANCE_PRODUCTS.map((product) => ({
  id: `prd-${product.key}`,
  name: product.name,
  memberPrice: product.price,
  stockistPrice: product.price,
  srpPrice: product.price,
}));

export function getCatalogForMode(modeId) {
  const mode = getTransactionMode(modeId);
  return mode.catalog === 'packages' ? PACKAGE_CATALOG : PRODUCT_CATALOG;
}

// Resolves the per-unit price for a catalog line depending on the
// transaction mode (and, for the member/stockist mode, which of the two
// tiers was picked).
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
// In-memory mutable store (session only — resets on page reload)
// ---------------------------------------------------------------------------

let nextArSequence = 1012; // next fresh (non-legacy) AR number to assign
let nextRequestId = 6; // seed data below occupies request ids 1-5

const listeners = new Set();
function notify() {
  listeners.forEach((callback) => callback());
}

// Subscribe to any change in the shared order-desk store. Returns an
// unsubscribe function. Pairs with React's useSyncExternalStore in both
// pages so they re-render whenever either one mutates the shared arrays.
export function subscribeToTransactionUpdates(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function formatArNumber(sequence) {
  return `AR-2026-${String(sequence).padStart(5, '0')}`;
}

export function getNextArNumberPreview() {
  return formatArNumber(nextArSequence);
}

function timestampNow() {
  return new Date().toISOString().slice(0, 16).replace('T', ' ');
}

function appendRemark(receipt, text) {
  receipt.remarks = [...(receipt.remarks || []), { text, at: timestampNow() }];
}

function lineItem(name, quantity, unitPrice) {
  return { name, quantity, unitPrice, lineTotal: quantity * unitPrice };
}

// Seed ARs — sequential Node-era numbers plus one legacy encode, spread
// across all three cashiers and several days so the list reads like a
// system already in daily use.
const acknowledgementReceipts = [
  {
    id: 'ar-1001',
    number: 'AR-2026-01001',
    date: '2026-08-28',
    cashier: 'MarifeO',
    memberName: 'Rosalie Mallari',
    memberUsername: 'RosalieM',
    mode: 'packages',
    lineItems: [lineItem('Diamond Package', 1, 150000)],
    subTotal: 150000,
    discount: 0,
    total: 150000,
    note: '',
    paymentMethod: 'wallet',
    canGenerateCodes: true,
    codeStatus: 'released',
    remarks: [
      { text: 'Codes generated', at: '2026-08-28 10:15' },
      { text: 'Codes released to @RosalieM', at: '2026-08-28 10:22' },
    ],
    isLegacy: false,
  },
  {
    id: 'ar-1002',
    number: 'AR-2026-01002',
    date: '2026-08-28',
    cashier: 'RenatoB',
    memberName: 'Jervy Latumbo',
    memberUsername: 'JervyL',
    mode: 'cash_member_stockist',
    lineItems: [lineItem('Nogatu Coffee Mix', 4, 495)],
    subTotal: 1800,
    discount: 0,
    total: 1800,
    note: 'Walk-in, paid cash at office.',
    paymentMethod: 'cash',
    canGenerateCodes: true,
    codeStatus: 'released',
    remarks: [
      { text: 'Codes generated', at: '2026-08-28 15:40' },
      { text: 'Codes released to @JervyL', at: '2026-08-28 15:47' },
    ],
    isLegacy: false,
  },
  {
    id: 'ar-1003',
    number: 'AR-2026-01003',
    date: '2026-08-29',
    cashier: 'AngelicaD',
    memberName: 'Rowell Mahinay',
    memberUsername: 'RowellM',
    mode: 'cash_srp',
    lineItems: [lineItem('Nogatu Black Coffee', 10, 250)],
    subTotal: 1990,
    discount: 0,
    total: 1990,
    note: '',
    paymentMethod: 'cash',
    canGenerateCodes: false,
    codeStatus: null,
    remarks: [],
    isLegacy: false,
  },
  {
    id: 'ar-1004',
    number: 'AR-2026-01004',
    date: '2026-08-29',
    cashier: 'MarifeO',
    memberName: 'Armando Palma',
    memberUsername: 'ArmandoP',
    mode: 'voucher',
    lineItems: [lineItem('Silver Package', 1, 5000)],
    subTotal: 5000,
    discount: 0,
    total: 5000,
    note: '',
    paymentMethod: 'wallet',
    canGenerateCodes: false,
    codeStatus: null,
    remarks: [],
    isLegacy: false,
  },
  {
    id: 'ar-1005',
    number: 'AR-2026-01005',
    date: '2026-08-30',
    cashier: 'RenatoB',
    memberName: 'Rendell Jimenez',
    memberUsername: 'RendellJ',
    mode: 'packages',
    lineItems: [lineItem('Gold Package', 1, 10000)],
    subTotal: 10000,
    discount: 0,
    total: 10000,
    note: '',
    paymentMethod: 'wallet',
    canGenerateCodes: true,
    codeStatus: 'pending',
    remarks: [],
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
    lineItems: [lineItem('Bronze Package', 1, 2500)],
    subTotal: 2500,
    discount: 0,
    total: 2500,
    note: 'Back-recorded from a paper AR issued before this system existed.',
    paymentMethod: 'cash',
    canGenerateCodes: true,
    codeStatus: 'released',
    remarks: [
      { text: 'Codes generated', at: '2026-03-14 09:05' },
      { text: 'Codes released to @DeliaS', at: '2026-03-14 09:12' },
    ],
    isLegacy: true,
  },
  {
    id: 'ar-1006',
    number: 'AR-2026-01006',
    date: '2026-08-31',
    cashier: 'MarifeO',
    memberName: 'Vernie Suarez',
    memberUsername: 'VernieS01',
    mode: 'cash_member_stockist',
    lineItems: [lineItem('Vitamin C with Zinc & Mangosteen', 6, 580)],
    subTotal: 2520,
    discount: 100,
    total: 2420,
    note: '',
    paymentMethod: 'wallet',
    canGenerateCodes: true,
    codeStatus: 'approved',
    remarks: [{ text: 'Codes generated', at: '2026-08-31 13:02' }],
    isLegacy: false,
  },
  {
    id: 'ar-1007',
    number: 'AR-2026-01007',
    date: '2026-09-01',
    cashier: 'RenatoB',
    memberName: 'Ronald Lagnason',
    memberUsername: 'RonaldL01',
    mode: 'packages',
    lineItems: [lineItem('Platinum Package', 1, 25000)],
    subTotal: 25000,
    discount: 0,
    total: 25000,
    note: '',
    paymentMethod: 'wallet',
    canGenerateCodes: true,
    codeStatus: 'rejected',
    remarks: [],
    isLegacy: false,
  },
  {
    id: 'ar-1008',
    number: 'AR-2026-01008',
    date: '2026-09-02',
    cashier: 'AngelicaD',
    memberName: 'Eunice Topacio',
    memberUsername: 'Eunicetop01',
    mode: 'cash_member_stockist',
    lineItems: [lineItem('Nogatu Glow', 3, 580)],
    subTotal: 960,
    discount: 0,
    total: 960,
    note: '',
    paymentMethod: 'cash',
    canGenerateCodes: true,
    codeStatus: 'pending',
    remarks: [],
    isLegacy: false,
  },
  {
    id: 'ar-1009',
    number: 'AR-2026-01009',
    date: '2026-09-03',
    cashier: 'MarifeO',
    memberName: 'Denmark Lagnason',
    memberUsername: 'DenmarkL01',
    mode: 'packages',
    lineItems: [lineItem('Silver Package', 1, 5000)],
    subTotal: 5000,
    discount: 0,
    total: 5000,
    note: '',
    paymentMethod: 'wallet',
    canGenerateCodes: true,
    codeStatus: null,
    remarks: [],
    isLegacy: false,
  },
  {
    id: 'ar-1010',
    number: 'AR-2026-01010',
    date: '2026-09-04',
    cashier: 'RenatoB',
    memberName: 'Redheart Suarez',
    memberUsername: 'redheart',
    mode: 'cash_srp',
    lineItems: [lineItem('Nogatu Barley Juice', 5, 850)],
    subTotal: 3250,
    discount: 0,
    total: 3250,
    note: '',
    paymentMethod: 'cash',
    canGenerateCodes: false,
    codeStatus: null,
    remarks: [],
    isLegacy: false,
  },
  {
    id: 'ar-1011',
    number: 'AR-2026-01011',
    date: '2026-09-05',
    cashier: 'AngelicaD',
    memberName: 'Nestor Balagtas',
    memberUsername: 'Nestor56',
    mode: 'packages',
    lineItems: [lineItem('Bronze Package', 1, 2500)],
    subTotal: 2500,
    discount: 0,
    total: 2500,
    note: '',
    paymentMethod: 'wallet',
    canGenerateCodes: true,
    codeStatus: null,
    remarks: [],
    isLegacy: false,
  },
];

// Seed manager-approval queue — each tied to an AR above by id.
const codeRequests = [
  {
    id: 1,
    arId: 'ar-1001',
    arNumber: 'AR-2026-01001',
    cashier: 'MarifeO',
    memberName: 'Rosalie Mallari',
    memberUsername: 'RosalieM',
    requestedItems: [{ name: 'Diamond Package', quantity: 1 }],
    sameNetworkTree: true,
    status: 'approved',
    rejectionReason: null,
  },
  {
    id: 2,
    arId: 'ar-1002',
    arNumber: 'AR-2026-01002',
    cashier: 'RenatoB',
    memberName: 'Jervy Latumbo',
    memberUsername: 'JervyL',
    requestedItems: [{ name: 'Nogatu Coffee Mix', quantity: 4 }],
    sameNetworkTree: true,
    status: 'approved',
    rejectionReason: null,
  },
  {
    id: 3,
    arId: 'ar-1005',
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
    arId: 'ar-1006',
    arNumber: 'AR-2026-01006',
    cashier: 'MarifeO',
    memberName: 'Vernie Suarez',
    memberUsername: 'VernieS01',
    requestedItems: [{ name: 'Vitamin C with Zinc & Mangosteen', quantity: 6 }],
    sameNetworkTree: true,
    status: 'approved',
    rejectionReason: null,
  },
  {
    id: 5,
    arId: 'ar-1007',
    arNumber: 'AR-2026-01007',
    cashier: 'RenatoB',
    memberName: 'Ronald Lagnason',
    memberUsername: 'RonaldL01',
    requestedItems: [{ name: 'Platinum Package', quantity: 1 }],
    sameNetworkTree: true,
    status: 'rejected',
    rejectionReason: 'Duplicate of AR-2026-01007A, cancelled by cashier.',
  },
  {
    id: 6,
    arId: 'ar-1008',
    arNumber: 'AR-2026-01008',
    cashier: 'AngelicaD',
    memberName: 'Eunice Topacio',
    memberUsername: 'Eunicetop01',
    requestedItems: [{ name: 'Nogatu Glow', quantity: 3 }],
    sameNetworkTree: true,
    status: 'pending',
    rejectionReason: null,
  },
  {
    id: 7,
    arId: 'ar-1010',
    arNumber: 'AR-2026-01010',
    cashier: 'MarifeO',
    memberName: 'Denmark Lagnason',
    memberUsername: 'DenmarkL01',
    requestedItems: [
      { name: 'Silver Package', quantity: 1 },
      { name: 'Nogatu Coffee Mix', quantity: 2 },
    ],
    sameNetworkTree: true,
    status: 'pending',
    rejectionReason: null,
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
// Mutations — session only, never touches a server
// ---------------------------------------------------------------------------

// Saves a new AR. For a fresh (non-legacy) AR the number is auto-assigned
// from the running sequence; for a legacy encode the caller supplies the
// free-text number and its own date, and the live sequence is left
// untouched. Saving an AR does not by itself request codes — that is a
// separate cashier action (see requestCodeGeneration) so a manager always
// approves before anything is produced.
export function saveAcknowledgementReceipt({
  isLegacy,
  legacyNumber,
  legacyDate,
  cashier,
  memberName,
  memberUsername,
  mode,
  lineItems: items,
  discount,
  note,
  paymentMethod,
}) {
  const modeConfig = getTransactionMode(mode);
  const number = isLegacy ? legacyNumber.trim() : formatArNumber(nextArSequence);
  const date = isLegacy ? legacyDate : new Date().toISOString().slice(0, 10);
  const subTotal = items.reduce((sum, line) => sum + line.lineTotal, 0);
  const appliedDiscount = Math.max(0, Number(discount) || 0);

  const record = {
    id: `ar-${Date.now()}`,
    number,
    date,
    cashier,
    memberName,
    memberUsername,
    mode,
    lineItems: items,
    subTotal,
    discount: appliedDiscount,
    total: Math.max(0, subTotal - appliedDiscount),
    note: (note || '').trim(),
    paymentMethod,
    canGenerateCodes: modeConfig.canGenerateCodes,
    codeStatus: null,
    remarks: [],
    isLegacy: Boolean(isLegacy),
  };

  acknowledgementReceipts.unshift(record);
  if (!isLegacy) nextArSequence += 1;

  notify();
  return record;
}

// Cashier action: sends this AR's line items to the manager approval queue.
// Refuses if the AR's mode does not issue codes, or if a request already
// exists for it — enforced here, not only in the button's disabled state,
// so nothing can double-request through a stale UI.
export function requestCodeGeneration(arId) {
  const receipt = acknowledgementReceipts.find((row) => row.id === arId);
  if (!receipt) return { success: false, error: 'AR not found.' };
  if (!receipt.canGenerateCodes) return { success: false, error: 'This AR\'s transaction mode does not issue codes.' };
  if (receipt.codeStatus) return { success: false, error: 'Codes have already been requested for this AR.' };

  codeRequests.unshift({
    id: nextRequestId++,
    arId: receipt.id,
    arNumber: receipt.number,
    cashier: receipt.cashier,
    memberName: receipt.memberName,
    memberUsername: receipt.memberUsername,
    requestedItems: receipt.lineItems.map((line) => ({ name: line.name, quantity: line.quantity })),
    sameNetworkTree: isSameNetworkTree(receipt.memberUsername),
    status: 'pending',
    rejectionReason: null,
  });
  receipt.codeStatus = 'pending';

  notify();
  return { success: true };
}

// Manager action. Refuses a request whose member sits outside the cashier's
// network tree — the tree restriction is enforced here, not only in the
// approve button's disabled state.
export function approveCodeRequest(requestId) {
  const request = codeRequests.find((row) => row.id === requestId);
  if (!request || request.status !== 'pending') return { success: false, error: 'Request is no longer pending.' };
  if (!request.sameNetworkTree) return { success: false, error: 'Blocked — this request spans two different network trees.' };

  request.status = 'approved';
  request.rejectionReason = null;

  const receipt = acknowledgementReceipts.find((row) => row.id === request.arId);
  if (receipt) {
    receipt.codeStatus = 'approved';
    appendRemark(receipt, 'Codes generated');
  }

  notify();
  return { success: true };
}

export function rejectCodeRequest(requestId, reason) {
  const request = codeRequests.find((row) => row.id === requestId);
  if (!request || request.status !== 'pending') return { success: false, error: 'Request is no longer pending.' };

  request.status = 'rejected';
  request.rejectionReason = reason;

  const receipt = acknowledgementReceipts.find((row) => row.id === request.arId);
  if (receipt) receipt.codeStatus = 'rejected';

  notify();
  return { success: true };
}

// Cashier action: releases already-approved codes to the member. Requires
// the member's own username as a deliberate final check — releasing a code
// batch to the wrong account is exactly the manual-handover mistake this
// feature exists to remove. Fails closed on any mismatch.
export function releaseCodes(arId, username) {
  const receipt = acknowledgementReceipts.find((row) => row.id === arId);
  if (!receipt) return { success: false, error: 'AR not found.' };
  if (receipt.codeStatus !== 'approved') {
    return { success: false, error: 'Codes for this AR have not been approved yet.' };
  }

  const typed = (username || '').trim().replace(/^@/, '').toLowerCase();
  if (!typed) return { success: false, error: "Enter the member's username." };
  if (typed !== receipt.memberUsername.toLowerCase()) {
    return { success: false, error: `Username does not match the member on this AR (@${receipt.memberUsername}).` };
  }

  receipt.codeStatus = 'released';
  appendRemark(receipt, `Codes released to @${receipt.memberUsername}`);

  notify();
  return { success: true };
}
