const MANILA_TIME_ZONE = 'Asia/Manila';

function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const raw = String(value).trim();
  if (!raw) return null;
  const normalized = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(raw)
    ? `${raw.replace(' ', 'T')}Z`
    : /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(raw)
      ? `${raw.replace(' ', 'T')}:00Z`
      : raw;
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Date-only Manila rendering ("March 15, 2026") for values where the time of
 * day carries no meaning to the reader — e.g. a registration date.
 *
 * Shares toDate() with formatDateTimeManila so both agree on how a naive
 * 'YYYY-MM-DD HH:MM:SS' (no offset) is interpreted, and both reject the MySQL
 * zero-date. Pinning timeZone means the calendar day shown is the Manila day,
 * not the viewing browser's local day.
 */
export function formatDateManila(value, fallback = '-') {
  const date = toDate(value);
  if (!date) return fallback;

  return new Intl.DateTimeFormat('en-US', {
    timeZone: MANILA_TIME_ZONE,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export function formatDateTimeManila(value) {
  const date = toDate(value);
  if (!date) return '-';

  const parts = new Intl.DateTimeFormat('en-PH', {
    timeZone: MANILA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).formatToParts(date);

  const getPart = (type) => parts.find((part) => part.type === type)?.value || '';
  return `${getPart('year')}-${getPart('month')}-${getPart('day')}, ${getPart('hour')}:${getPart('minute')}:${getPart('second')} ${getPart('dayPeriod')}`;
}
