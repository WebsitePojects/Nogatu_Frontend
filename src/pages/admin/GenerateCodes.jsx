import { useState } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';

const PRODUCT_OPTIONS = [
  { value: 10, label: 'Bronze (₱2,500)' },
  { value: 20, label: 'Silver (₱5,000)' },
  { value: 30, label: 'Gold (₱10,000)' },
  { value: 40, label: 'Platinum (₱25,000)' },
  { value: 50, label: 'Garnet (₱50,000)' },
  { value: 60, label: 'Diamond (₱150,000)' },
  { value: 100, label: 'Barley (Maintenance)' },
  { value: 101, label: 'Glutathione (Maintenance)' },
  { value: 102, label: 'Gluta w/ Collagen (Maintenance)' },
  { value: 103, label: 'Coffee Mix (Maintenance)' },
  { value: 104, label: 'Chocolate Drink (Maintenance)' },
  { value: 105, label: 'Mangosteen (Maintenance)' },
  { value: 106, label: 'Vitamin Zinc (Maintenance)' },
  { value: 107, label: 'Max Coffee (Maintenance)' },
  { value: 108, label: 'Black Coffee (Maintenance)' },
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
    } finally { setGenerating(false); }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Generate Codes</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">New Code Generation</h3>
          <form onSubmit={handleGenerate} className="space-y-5">
            <div>
              <label className="label">Number of Codes</label>
              <input type="number" value={noOfCodes} onChange={(e) => setNoOfCodes(Number(e.target.value))} className="input-field" min="1" max="1000" required />
            </div>
            <div>
              <label className="label">Product Type</label>
              <select value={productType} onChange={(e) => setProductType(Number(e.target.value))} className="input-field">
                {PRODUCT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Code Type</label>
              <div className="flex gap-4 mt-1">
                {[{ value: 1, label: 'Paid (PD)' }, { value: 2, label: 'Free Slot (FS)' }, { value: 3, label: 'CD Slot (CD)' }].map(opt => (
                  <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="codeType" value={opt.value} checked={codeType === opt.value} onChange={() => setCodeType(opt.value)} className="text-emerald-600" />
                    <span className="text-sm">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <button type="submit" disabled={generating} className="btn-success w-full disabled:opacity-50">
              {generating ? 'Generating...' : 'Generate Codes'}
            </button>
          </form>
        </div>

        {generatedCodes.length > 0 && (
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4">Generated Codes ({generatedCodes.length})</h3>
            <div className="bg-gray-50 rounded-lg p-4 max-h-80 overflow-y-auto">
              {generatedCodes.map((code, i) => (
                <div key={i} className="font-mono text-sm py-1 border-b border-gray-200 last:border-0">{code}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
