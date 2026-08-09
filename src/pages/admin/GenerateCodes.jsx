import { useState } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';
import { MAINTENANCE_PRODUCT_OPTIONS } from '../../constants/maintenanceProducts';

const PRODUCT_OPTIONS = [
  { value: 10, label: 'Bronze (PHP 2,500)', color: '#CD7F32' },
  { value: 20, label: 'Silver (PHP 5,000)', color: '#C0C0C0' },
  { value: 30, label: 'Gold (PHP 10,000)', color: '#FFD700' },
  { value: 40, label: 'Platinum (PHP 25,000)', color: '#E5E4E2' },
  { value: 50, label: 'Garnet (PHP 50,000)', color: '#733635' },
  { value: 60, label: 'Diamond (PHP 150,000)', color: '#B9F2FF' },
  ...MAINTENANCE_PRODUCT_OPTIONS,
];

const CODE_TYPE_CD = 3;
const CODE_TYPE_PAID = 1;

const CODE_TYPES = [
  { value: CODE_TYPE_PAID, label: 'Paid (PD)', desc: 'Full income eligibility including SMB and sponsor BP', color: '#D4AF37' },
  { value: 2, label: 'Free Slot (FS)', desc: 'Can earn non-pairing incomes, but no SMB or sponsor BP', color: '#94a3b8' },
  { value: CODE_TYPE_CD, label: 'CD Slot (CD)', desc: '25% encashment deduction until fully paid; no SMB or sponsor BP while unpaid', color: '#f87171' },
];

// CD Slot is restricted to Gold and Platinum (management, 2026-08-08). Mirrored
// from CD_ELIGIBLE_PRODUCT_TYPES in services/codeGeneration.js — the server rejects
// a disallowed combination with 400 regardless of what this form shows, so this is
// an affordance, not the rule.
const CD_ELIGIBLE_PRODUCT_TYPES = [30, 40];
const isCdEligible = (productType) => CD_ELIGIBLE_PRODUCT_TYPES.includes(Number(productType));

export default function GenerateCodes() {
  const [noOfCodes, setNoOfCodes] = useState('');
  const [productType, setProductType] = useState(10);
  const [codeType, setCodeType] = useState(CODE_TYPE_PAID);
  const [generating, setGenerating] = useState(false);
  const [generatedCodes, setGeneratedCodes] = useState([]);

  const cdAllowed = isCdEligible(productType);

  // Switching to a product that cannot take CD must also clear a CD selection.
  // Leaving codeType at CD would submit a combination the server rejects with a
  // 400, so the admin would see a failure for a choice the form still showed as
  // selected.
  function handleProductTypeChange(nextProductType) {
    setProductType(nextProductType);
    if (codeType === CODE_TYPE_CD && !isCdEligible(nextProductType)) {
      setCodeType(CODE_TYPE_PAID);
    }
  }

  async function handleGenerate(e) {
    e.preventDefault();
    const n = Number(noOfCodes);
    if (!Number.isFinite(n) || n < 1) { toast.error('Enter how many codes to generate'); return; }
    // Last line of defence in the form; the server is the authority.
    if (codeType === CODE_TYPE_CD && !cdAllowed) {
      toast.error('CD Slot is only available for Gold and Platinum');
      return;
    }
    setGenerating(true);
    try {
      const res = await api.post('/admin/codes/generate', { noOfCodes: n, productType, codeType });
      setGeneratedCodes(res.data.codes);
      toast.success(`${res.data.count} code(s) generated!`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Generation failed');
    } finally {
      setGenerating(false);
    }
  }

  async function handleCopyAll() {
    try {
      await navigator.clipboard.writeText(generatedCodes.join('\n'));
      toast.success('All codes copied!');
    } catch {
      toast.error('Copy failed');
    }
  }

  return (
    <div>
      <div className="mb-7">
        <h1 className="font-display text-2xl font-bold text-white">Generate Codes</h1>
        <div className="w-12 h-0.5 mt-2" style={{ background: 'linear-gradient(90deg,#D4AF37,transparent)' }} />
        <p className="mt-3 text-sm max-w-2xl" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Cashier and admin roles can still generate codes here while voucher tracing is handled in the dedicated voucher ledger.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-semibold text-white mb-1">New Code Generation</h3>
          <p className="text-xs mb-5" style={{ color: 'rgba(255,255,255,0.35)' }}>Configure and generate activation codes</p>

          <form onSubmit={handleGenerate} className="space-y-5">
            <div>
              <label className="label">Number of Codes</label>
              <input
                type="number"
                value={noOfCodes}
                onChange={(e) => setNoOfCodes(e.target.value === '' ? '' : Number(e.target.value))}
                className="glass-input w-full rounded-xl px-4 py-2.5 text-sm mt-1.5"
                min="1"
                max="1000"
                placeholder="e.g. 10"
                required
              />
            </div>

            <div>
              <label className="label">Product Type</label>
              <select
                value={productType}
                onChange={(e) => handleProductTypeChange(Number(e.target.value))}
                className="glass-input w-full rounded-xl px-4 py-2.5 text-sm mt-1.5"
              >
                {PRODUCT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label mb-2">Code Type</label>
              <div className="flex gap-3 mt-1.5 flex-wrap">
                {CODE_TYPES.map((opt) => {
                  const disabled = opt.value === CODE_TYPE_CD && !cdAllowed;
                  const selected = codeType === opt.value;
                  return (
                    <label
                      key={opt.value}
                      className={`flex-1 min-w-[90px] flex flex-col items-center gap-1 p-3 rounded-xl motion-safe:transition-all ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                      title={disabled ? 'CD Slot is only available for Gold and Platinum' : undefined}
                      style={{
                        background: selected ? 'rgba(212,175,55,0.12)' : 'rgba(255,255,255,0.03)',
                        border: selected ? '1.5px solid rgba(212,175,55,0.35)' : '1.5px solid rgba(255,255,255,0.06)',
                        opacity: disabled ? 0.4 : 1,
                      }}
                    >
                      <input
                        type="radio"
                        name="codeType"
                        value={opt.value}
                        checked={selected}
                        disabled={disabled}
                        onChange={() => { if (!disabled) setCodeType(opt.value); }}
                        className="sr-only"
                      />
                      <span className="text-[11px] font-bold tracking-wide" style={{ color: opt.color }}>
                        {opt.label}
                      </span>
                      <span className="text-[10px] text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>{opt.desc}</span>
                      {/* Text, not just dimming — the reason must not depend on colour alone. */}
                      {disabled && (
                        <span className="text-[10px] text-center font-semibold" style={{ color: '#fbbf24' }}>
                          Gold / Platinum only
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
              {!cdAllowed && (
                <p className="text-[11px] mt-2 leading-relaxed" style={{ color: '#fbbf24' }}>
                  CD Slot is disabled for this product. It can only be issued for Gold and Platinum packages.
                </p>
              )}
              <p className="text-[11px] mt-2 leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
                FS and unpaid CD accounts can still earn the other published wealth streams. The restriction is on SMB or binary pairing credits and on passing sponsor BP upstream until the slot becomes eligible.
              </p>
            </div>

            <button
              type="submit"
              disabled={generating}
              className="btn-success w-full rounded-xl py-2.5 px-5 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? 'Generating...' : 'Generate Codes'}
            </button>
          </form>
        </div>

        {generatedCodes.length > 0 && (
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-white">Generated Codes</h3>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(212,175,55,0.6)' }}>{generatedCodes.length} code(s) ready</p>
              </div>
              <button
                onClick={handleCopyAll}
                className="gold-btn-outline rounded-lg px-3 py-1.5 text-xs font-medium"
               type="button">
                Copy All
              </button>
            </div>

            <div
              className="rounded-xl p-4 max-h-80 overflow-y-auto space-y-1"
              style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(212,175,55,0.10)' }}
            >
              {generatedCodes.map((code, i) => (
                <div
                  key={i}
                  className="font-mono text-sm py-1.5 px-2 rounded flex items-center justify-between group"
                  style={{
                    color: '#F2D06B',
                    borderBottom: i < generatedCodes.length - 1 ? '1px solid rgba(212,175,55,0.07)' : 'none',
                  }}
                >
                  <span>{code}</span>
                  <button
                    onClick={() => { navigator.clipboard.writeText(code); toast.success('Copied!'); }}
                    className="opacity-0 group-hover:opacity-100 text-xs motion-safe:transition-opacity cursor-pointer"
                    style={{ color: 'rgba(212,175,55,0.6)' }}
                   type="button">
                    Copy
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
