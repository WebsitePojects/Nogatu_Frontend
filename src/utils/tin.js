const MAX_TIN_DIGITS = 12;
const ZERO_TIN_DIGITS = '000000000000';

export function extractTinDigits(value) {
  return String(value || '').replace(/\D/g, '').slice(0, MAX_TIN_DIGITS);
}

export function formatTin(value) {
  const digits = extractTinDigits(value);
  if (!digits) return '';
  return digits.match(/.{1,3}/g)?.join('-') || '';
}

export function isValidTin(value) {
  const digits = extractTinDigits(value);
  return digits.length >= 9 && digits.length <= MAX_TIN_DIGITS;
}

/** Returns true when TIN is the placeholder 000-000-000-000 (all zeros).
 *  This combination is exempt from duplicate-account detection. */
export function isZeroTin(value) {
  const digits = extractTinDigits(value);
  return digits.length === MAX_TIN_DIGITS && digits === ZERO_TIN_DIGITS;
}
