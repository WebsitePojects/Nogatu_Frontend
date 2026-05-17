import { useState } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';

const PRODUCT_OPTIONS = [
  { value: 10, label: 'Bronze (PHP 2,500)', color: '#CD7F32' },
  { value: 20, label: 'Silver (PHP 5,000)', color: '#C0C0C0' },
  { value: 30, label: 'Gold (PHP 10,000)', color: '#FFD700' },
  { value: 40, label: 'Platinum (PHP 25,000)', color: '#E5E4E2' },
  { value: 50, label: 'Garnet (PHP 50,000)', color: '#733635' },
  { value: 60, label: 'Diamond (PHP 150,000)', color: '#B9F2FF' },
  { value: 100, label: 'Nogatu Barley Juice (Maintenance)', color: '#6b7280' },
  { value: 101, label: 'Nogatu Glow (Maintenance)', color: '#6b7280' },
  { value: 102, label: 'Nogatu Collagen Vitamin C (Maintenance)', color: '#6b7280' },
  { value: 103, label: 'Nogatu Coffee Mix (Maintenance)', color: '#6b7280' },
  { value: 104, label: 'Chocolate Drink Mix (Maintenance)', color: '#6b7280' },
  { value: 105, label: 'Mangosteen Coffee Mix (Maintenance)', color: '#6b7280' },
  { value: 106, label: 'Vitamin C (Maintenance)', color: '#6b7280' },
  { value: 107, label: 'Max Fuel Coffee Drink Mix (Maintenance)', color: '#6b7280' },
  { value: 108, label: 'Black Coffee (Maintenance)', color: '#6b7280' },
  { value: 109, label: 'Berry NAD+ (Maintenance)', color: '#6b7280' },
];

const CODE_TYPES = [
  { value: 1, label: 'Paid (PD)', desc: 'Full income eligibility including SMB and sponsor BP', color: '#D4AF37' },
  { value: 2, label: 'Free Slot (FS)', desc: 'Can earn non-pairing incomes, but no SMB or sponsor BP', color: '#94a3b8' },
  { value: 3, label: 'CD Slot (CD)', desc: '25% encashment deduction until fully paid; no SMB or sponsor BP while unpaid', color: '#f87171' },
];

export default function GenerateCodes() {
  const [noOfCodes, setNoOfCodes] = useState(1);
  const [productType, setProductType] = useState(10);
  const [codeType, setCodeType] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [generatedCodes, setGeneratedCodes] = useState([]);

  async function handleGenerate(e) {
    e.preventDefault();
    setGenerating(true);
    try {
      const res = await api.post('/admin/codes/generate', { noOfCodes, productType, codeType });
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
                onChange={(e) => setNoOfCodes(Number(e.target.value))}
                className="glass-input w-full rounded-xl px-4 py-2.5 text-sm mt-1.5"
                min="1"
                max="1000"
                required
              />
            </div>

            <div>
              <label className="label">Product Type</label>
              <select
                value={productType}
                onChange={(e) => setProductType(Number(e.target.value))}
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
                {CODE_TYPES.map((opt) => (
                  <label
                    key={opt.value}
                    className="flex-1 min-w-[90px] flex flex-col items-center gap-1 p-3 rounded-xl cursor-pointer motion-safe:transition-all"
                    style={{
                      background: codeType === opt.value ? 'rgba(212,175,55,0.12)' : 'rgba(255,255,255,0.03)',
                      border: codeType === opt.value ? '1.5px solid rgba(212,175,55,0.35)' : '1.5px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <input
                      type="radio"
                      name="codeType"
                      value={opt.value}
                      checked={codeType === opt.value}
                      onChange={() => setCodeType(opt.value)}
                      className="sr-only"
                    />
                    <span className="text-[11px] font-bold tracking-wide" style={{ color: opt.color }}>
                      {opt.label}
                    </span>
                    <span className="text-[10px] text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>{opt.desc}</span>
                  </label>
                ))}
              </div>
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
              >
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
                  >
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
