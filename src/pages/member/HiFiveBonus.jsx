import { useState, useEffect } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';
import { HiOutlineGift } from 'react-icons/hi';

function Spinner() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <div className="w-10 h-10 rounded-full border-[3px] animate-spin" style={{ borderColor: 'rgba(212,175,55,0.12)', borderTopColor: '#D4AF37' }} />
    </div>
  );
}

/* Rotating gold colors per card */
const CARD_ACCENTS = [
  '#D4AF37', '#F2D06B', '#B87333', '#D4AF37', '#9A7B0A',
  '#F2D06B', '#D4AF37', '#B87333', '#F2D06B',
];

const PRODUCT_IMAGES = {
  bl: '/legacy-img/barley_01.png',
  gl: '/legacy-img/gluta.png',
  glc: '/legacy-img/collagen.png',
  cm: '/legacy-img/coffeemix.png',
  cd: '/legacy-img/choco.png',
  mgt: '/legacy-img/mangosteen.png',
  vz: '/legacy-img/vitamin-zinc.png',
  cmm: '/legacy-img/max-fuel-coffee.png',
  bkc: '/legacy-img/black-coffee.png',
};

export default function HiFiveBonus() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const res = await api.get('/hifive');
      setProducts(res.data.products);
    } catch { } finally { setLoading(false); }
  }

  async function handleRedeem(bonusType, quantity) {
    try {
      await api.post('/hifive/redeem', { bonusType, quantity });
      toast.success('Bonus redeemed successfully!');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Redemption failed');
    }
  }

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Hi-Five Bonus</h1>
        <div className="w-10 h-0.5 mt-2 rounded-full" style={{ background: 'linear-gradient(90deg,#D4AF37,transparent)' }} />
        <p className="text-sm mt-2" style={{ color: 'rgba(255,255,255,0.35)' }}>
          Earn product rewards for every 5 direct referrals per product tier.
        </p>
      </div>

      {/* Product grid */}
      {products.length === 0 ? (
        <div className="glass-card rounded-2xl p-16 text-center">
          <HiOutlineGift className="w-10 h-10 mx-auto mb-3" style={{ color: 'rgba(212,175,55,0.2)' }} />
          <p style={{ color: 'rgba(255,255,255,0.3)' }}>No products found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((p, idx) => {
            const accent = CARD_ACCENTS[idx % CARD_ACCENTS.length];
            const hasRedeemable = p.redeemable >= 1;
            return (
              <div
                key={p.key}
                className="glass-card rounded-2xl p-5 relative overflow-hidden"
                style={{
                  borderTop: `2px solid ${accent}40`,
                }}
              >
                {/* Corner decoration */}
                <div
                  className="absolute top-0 right-0 w-20 h-20 rounded-bl-full pointer-events-none"
                  style={{ background: `radial-gradient(circle at top right, ${accent}10 0%, transparent 70%)` }}
                />

                {/* Icon */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: `${accent}18`, border: `1px solid ${accent}30` }}
                >
                  <HiOutlineGift className="w-5 h-5" style={{ color: accent }} />
                </div>

                {/* Product name */}
                <h3 className="font-semibold text-white text-sm mb-4 leading-tight">{p.name}</h3>

                {/* Legacy product visual */}
                {PRODUCT_IMAGES[p.key] && (
                  <img
                    src={PRODUCT_IMAGES[p.key]}
                    alt={p.name}
                    className="w-full h-32 object-contain rounded-xl mb-4"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(212,175,55,0.08)' }}
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                )}

                {/* Stats */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Current Bonus</span>
                    <span className="text-sm font-semibold text-white">{p.bonus}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Purchases</span>
                    <span className="text-sm text-white/70">{p.purchases}</span>
                  </div>
                  <div
                    className="flex items-center justify-between pt-2.5 border-t"
                    style={{ borderColor: 'rgba(212,175,55,0.1)' }}
                  >
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Redeemable</span>
                    <span
                      className="text-sm font-bold px-2 py-0.5 rounded-lg"
                      style={{
                        color: hasRedeemable ? '#4ade80' : 'rgba(255,255,255,0.3)',
                        background: hasRedeemable ? 'rgba(34,197,94,0.1)' : 'transparent',
                        border: hasRedeemable ? '1px solid rgba(34,197,94,0.2)' : 'none',
                      }}
                    >
                      {p.redeemable}
                    </span>
                  </div>
                </div>

                {hasRedeemable && (
                  <button
                    onClick={() => handleRedeem(p.key, p.redeemable)}
                    className="btn-success w-full mt-4 text-sm py-2"
                  >
                    Redeem Bonus ({p.redeemable})
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
