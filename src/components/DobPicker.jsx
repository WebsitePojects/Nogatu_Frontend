import { useEffect, useMemo, useState } from 'react';

// Senior-friendly date-of-birth entry: Month / Day / Year dropdowns instead of a
// native calendar. Keyboard-typeable (type to jump in any select), instant year jump,
// no calendar paging. Emits a YYYY-MM-DD string (same value the form/back-end expects).
//
// Each dropdown keeps its own state so a partial selection (e.g. Month only) STAYS
// visible — the combined value is emitted to the parent only once all three are set.

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const pad = (n) => String(n).padStart(2, '0');
const daysInMonth = (year, month1) => (year && month1 ? new Date(Number(year), Number(month1), 0).getDate() : 31);

function parseValue(value) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value || ''));
  return m ? { y: m[1], m: String(Number(m[2])), d: String(Number(m[3])) } : { y: '', m: '', d: '' };
}

export default function DobPicker({ value, onChange, selectClassName = '', id = 'dob', required = false, minYear = 1915 }) {
  const init = parseValue(value);
  const [y, setY] = useState(init.y);
  const [m, setM] = useState(init.m);
  const [d, setD] = useState(init.d);

  // Adopt an externally-set COMPLETE date (prefill/edit/reset). Ignore '' so our own
  // partial-selection emits (which send '') never wipe the in-progress dropdowns.
  useEffect(() => {
    const p = parseValue(value);
    if (p.y && p.m && p.d && (p.y !== y || p.m !== m || p.d !== d)) {
      setY(p.y); setM(p.m); setD(p.d);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const maxYear = new Date().getFullYear();
  const years = useMemo(() => {
    const out = [];
    for (let yr = maxYear; yr >= minYear; yr -= 1) out.push(yr);
    return out;
  }, [maxYear, minYear]);
  const days = useMemo(() => Array.from({ length: daysInMonth(y, m) }, (_, i) => i + 1), [y, m]);

  function update(ny, nm, nd) {
    setY(ny); setM(nm); setD(nd);
    if (ny && nm && nd) {
      const dd = Math.min(Number(nd), daysInMonth(ny, nm)); // clamp e.g. Feb 31 -> Feb 28/29
      onChange(`${ny}-${pad(nm)}-${pad(dd)}`);
    } else {
      onChange(''); // incomplete -> empty so validation can flag a missing DOB
    }
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      <select aria-label="Birth month" id={`${id}-month`} required={required}
        value={m} onChange={(e) => update(y, e.target.value, d)} className={selectClassName}>
        <option value="">Month</option>
        {MONTHS.map((name, i) => <option key={name} value={i + 1}>{name}</option>)}
      </select>
      <select aria-label="Birth day" id={`${id}-day`} required={required}
        value={d} onChange={(e) => update(y, m, e.target.value)} className={selectClassName}>
        <option value="">Day</option>
        {days.map((dd) => <option key={dd} value={dd}>{dd}</option>)}
      </select>
      <select aria-label="Birth year" id={`${id}-year`} required={required}
        value={y} onChange={(e) => update(e.target.value, m, d)} className={selectClassName}>
        <option value="">Year</option>
        {years.map((yr) => <option key={yr} value={yr}>{yr}</option>)}
      </select>
    </div>
  );
}
