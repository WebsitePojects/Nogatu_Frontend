import { useMemo } from 'react';

// Senior-friendly date-of-birth entry: Month / Day / Year dropdowns instead of a
// native calendar. Keyboard-typeable (type to jump in any select), instant year jump,
// no calendar paging. Emits a YYYY-MM-DD string (same value the form/back-end expects).

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const pad = (n) => String(n).padStart(2, '0');
const daysInMonth = (year, month1) => (year && month1 ? new Date(Number(year), Number(month1), 0).getDate() : 31);

export default function DobPicker({ value, onChange, selectClassName = '', id = 'dob', required = false, minYear = 1915 }) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value || ''));
  const y = match ? match[1] : '';
  const m = match ? match[2] : '';
  const d = match ? match[3] : '';

  const maxYear = new Date().getFullYear();
  const years = useMemo(() => {
    const out = [];
    for (let yr = maxYear; yr >= minYear; yr -= 1) out.push(yr);
    return out;
  }, [maxYear, minYear]);
  const days = useMemo(() => Array.from({ length: daysInMonth(y, m) }, (_, i) => i + 1), [y, m]);

  function emit(ny, nm, nd) {
    if (ny && nm && nd) {
      const dd = Math.min(Number(nd), daysInMonth(ny, nm)); // clamp e.g. Feb 31 -> Feb 28/29
      onChange(`${ny}-${pad(nm)}-${pad(dd)}`);
    } else {
      onChange(''); // incomplete selection -> empty so validation can flag it
    }
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      <select aria-label="Birth month" id={`${id}-month`} required={required}
        value={m ? String(Number(m)) : ''} onChange={(e) => emit(y, e.target.value, d)} className={selectClassName}>
        <option value="">Month</option>
        {MONTHS.map((name, i) => <option key={name} value={i + 1}>{name}</option>)}
      </select>
      <select aria-label="Birth day" id={`${id}-day`} required={required}
        value={d ? String(Number(d)) : ''} onChange={(e) => emit(y, m, e.target.value)} className={selectClassName}>
        <option value="">Day</option>
        {days.map((dd) => <option key={dd} value={dd}>{dd}</option>)}
      </select>
      <select aria-label="Birth year" id={`${id}-year`} required={required}
        value={y || ''} onChange={(e) => emit(e.target.value, m, d)} className={selectClassName}>
        <option value="">Year</option>
        {years.map((yr) => <option key={yr} value={yr}>{yr}</option>)}
      </select>
    </div>
  );
}
