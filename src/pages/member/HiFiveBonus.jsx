import { useEffect, useState } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';
import {
  HiOutlineCash,
  HiOutlineCheckCircle,
  HiOutlineChevronRight,
  HiOutlineEye,
  HiOutlineGift,
  HiOutlineSparkles,
  HiOutlineUsers,
  HiOutlineX,
} from 'react-icons/hi';

const fmtMoney = (n) => Number(n || 0).toLocaleString('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const fmtInt = (n) => Number(n || 0).toLocaleString('en-US', {
  maximumFractionDigits: 0,
});

const PRODUCT_IMAGES = {
  bl: '/legacy-img/Barley-Mix.png',
  gl: '/legacy-img/Glow-Pill.png',
  glc: '/legacy-img/Vitamin-C-Collagen.png',
  cm: '/legacy-img/Coffee-Mix.png',
  cd: '/legacy-img/Chox-Mix.png',
  mgt: '/legacy-img/Mangoosteen_1.png',
  vz: '/legacy-img/vitamin-zinc.png',
  cmm: '/legacy-img/Max-Fuel.png',
  bkc: '/legacy-img/blck-coffee.png',
  bnad: '/legacy-img/Berry-Nad.png',
};

const PACKAGE_ACCENTS = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#D4AF37',
  platinum: '#6DD5ED',
  garnet: '#9B2335',
  diamond: '#7FDBFF',
};

function Spinner() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <div
        className="w-10 h-10 rounded-full border-[3px] animate-spin"
        style={{ borderColor: 'rgba(212,175,55,0.12)', borderTopColor: '#D4AF37' }}
      />
      <p className="portal-card-muted text-sm">Loading Hi-Five bonuses...</p>
    </div>
  );
}

function SummaryStat({ label, value, subtitle, icon: Icon }) {
  return (
    <div className="portal-soft-panel rounded-2xl p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="portal-card-muted text-xs">{label}</p>
          <p className="portal-card-title text-xl font-bold mt-1">{value}</p>
          {subtitle && <p className="portal-warning-text text-[11px] mt-2">{subtitle}</p>}
        </div>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.18)' }}
        >
          <Icon className="w-5 h-5" style={{ color: '#D4AF37' }} />
        </div>
      </div>
    </div>
  );
}

function ContributorModal({ open, title, contributors, accent, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4" onMouseDown={onClose}>
      <div
        className="w-full max-w-2xl rounded-3xl p-5 sm:p-6 max-h-[85vh] overflow-hidden glass-card"
        style={{ border: '1px solid rgba(212,175,55,0.16)' }}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: accent }}>{title}</p>
            <h3 className="font-display text-xl font-semibold text-white mt-2">All matching contributors</h3>
            <p className="text-sm mt-2" style={{ color: 'rgba(255,255,255,0.42)' }}>
              Full contributor list for this Hi-Five requirement.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(212,175,55,0.16)' }}
          >
            <HiOutlineX className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="mt-5 max-h-[58vh] overflow-y-auto pr-1 space-y-3">
          {contributors.map((contributor) => (
            <div
              key={`${contributor.uid}-${contributor.username}-${contributor.count ?? contributor.packageName}`}
              className="rounded-2xl p-4 flex items-center justify-between gap-4"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(212,175,55,0.08)' }}
            >
              <div className="min-w-0">
                <p className="text-sm sm:text-base font-semibold text-white truncate">{contributor.fullName}</p>
                <p className="text-xs mt-1 truncate" style={{ color: 'rgba(255,255,255,0.42)' }}>{contributor.username}</p>
              </div>
              <div className="text-right flex-shrink-0">
                {typeof contributor.count === 'number' ? (
                  <span
                    className="text-xs font-semibold px-2.5 py-1.5 rounded-lg inline-flex items-center"
                    style={{ color: accent, background: `${accent}18`, border: `1px solid ${accent}25` }}
                  >
                    {contributor.count} buys
                  </span>
                ) : (
                  <span
                    className="text-xs font-semibold px-2.5 py-1.5 rounded-lg inline-flex items-center"
                    style={{ color: accent, background: `${accent}18`, border: `1px solid ${accent}25` }}
                  >
                    {contributor.packageName}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ContributorList({ title, contributors, accent, onViewAll }) {
  if (!contributors?.length) {
    return (
      <div className="rounded-xl p-3 mt-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{title}</p>
        <p className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.28)' }}>No qualifying direct referrals yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl p-3 mt-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{title}</p>
        {contributors.length > 3 && (
          <button
            type="button"
            onClick={onViewAll}
            className="text-[11px] font-semibold inline-flex items-center gap-1"
            style={{ color: '#D4AF37' }}
          >
            View all
            <HiOutlineChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <div className="space-y-2 mt-2">
        {contributors.slice(0, 3).map((contributor) => (
          <div key={`${contributor.uid}-${contributor.username}`} className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{contributor.fullName}</p>
              <p className="text-[11px] truncate" style={{ color: 'rgba(255,255,255,0.42)' }}>
                {contributor.username}
              </p>
            </div>
            <div className="text-right">
              {typeof contributor.count === 'number' ? (
                <span
                  className="text-[11px] font-semibold px-2 py-1 rounded-lg"
                  style={{ color: accent, background: `${accent}18`, border: `1px solid ${accent}25` }}
                >
                  {contributor.count} buys
                </span>
              ) : (
                <span
                  className="text-[11px] font-semibold px-2 py-1 rounded-lg"
                  style={{ color: accent, background: `${accent}18`, border: `1px solid ${accent}25` }}
                >
                  {contributor.packageName}
                </span>
              )}
            </div>
          </div>
        ))}
        {contributors.length > 3 && (
          <button
            type="button"
            onClick={onViewAll}
            className="text-[11px] font-semibold inline-flex items-center gap-1"
            style={{ color: 'rgba(212,175,55,0.8)' }}
          >
            + {contributors.length - 3} more contributor{contributors.length - 3 === 1 ? '' : 's'}
            <HiOutlineEye className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

function PackageCard({ item, onClaim, onViewContributors, busy }) {
  const accent = PACKAGE_ACCENTS[item.key] || '#D4AF37';
  const hasClaim = item.availableClaims > 0;

  return (
    <div
      className="glass-card rounded-2xl p-5 relative overflow-hidden"
      style={{ borderTop: `2px solid ${accent}` }}
    >
      <div className="absolute top-0 right-0 w-24 h-24 rounded-bl-full pointer-events-none" style={{ background: `radial-gradient(circle at top right, ${accent}18 0%, transparent 70%)` }} />

      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium" style={{ color: accent }}>{item.name} Package</p>
          <h3 className="font-semibold text-white text-lg mt-1">PHP {fmtMoney(item.rewardAmount)}</h3>
          <p className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Every 5 direct referrals with the same package unlock 1 cash claim.
          </p>
        </div>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${accent}18`, border: `1px solid ${accent}35` }}>
          <HiOutlineCash className="w-5 h-5" style={{ color: accent }} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-5">
        <SummaryStat label="Direct Referrals" value={fmtInt(item.directReferralCount)} subtitle="same-package referrals" icon={HiOutlineUsers} />
        <SummaryStat label="Available Claims" value={fmtInt(item.availableClaims)} subtitle={`PHP ${fmtMoney(item.availableCashAmount)} claimable`} icon={HiOutlineCheckCircle} />
      </div>

      <div className="grid grid-cols-3 gap-2 mt-4 text-center">
        <div className="rounded-xl py-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>Qualified Sets</p>
          <p className="text-white font-bold mt-1">{fmtInt(item.qualifiedSets)}</p>
        </div>
        <div className="rounded-xl py-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>Claimed</p>
          <p className="text-white font-bold mt-1">{fmtInt(item.claimedSets)}</p>
        </div>
        <div className="rounded-xl py-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>Need More</p>
          <p className="text-white font-bold mt-1">{fmtInt(item.remainingToNextSet)}</p>
        </div>
      </div>

      <ContributorList
        title="Top matching direct referrals"
        contributors={item.contributors}
        accent={accent}
        onViewAll={() => onViewContributors(item)}
      />

      {hasClaim ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => onClaim(item.key, item.availableClaims)}
          className="w-full mt-4 rounded-xl py-3 text-sm font-semibold"
          style={{ background: accent, color: '#120c02' }}
        >
          {busy ? 'Submitting...' : `Submit ${item.availableClaims} cash claim${item.availableClaims > 1 ? 's' : ''}`}
        </button>
      ) : (
        <div className="mt-4 rounded-xl py-3 px-4 text-sm" style={{ background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.38)' }}>
          {item.remainingToNextSet > 0
            ? `Need ${item.remainingToNextSet} more ${item.name.toLowerCase()} direct referral${item.remainingToNextSet === 1 ? '' : 's'} for the next cash claim.`
            : 'No available cash claim right now.'}
        </div>
      )}
    </div>
  );
}

function ProductCard({ item, productEligible, pointsNeeded, onRedeem, onViewContributors, busy }) {
  const accent = productEligible ? '#4ADE80' : '#D4AF37';
  const canRedeem = productEligible && item.availableClaims > 0;

  return (
    <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: canRedeem ? '#4ADE80' : '#D4AF37' }} />

      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium" style={{ color: accent }}>Product Hi-Five</p>
          <h3 className="font-semibold text-white text-lg mt-1">{item.name}</h3>
          <p className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.45)' }}>
            You qualify once 5 different direct referrals have each bought this same product at least once. You also need at least 200 maintenance points.
          </p>
        </div>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${accent}18`, border: `1px solid ${accent}25` }}>
          <HiOutlineGift className="w-5 h-5" style={{ color: accent }} />
        </div>
      </div>

      {PRODUCT_IMAGES[item.key] && (
        <div
          className="mt-4 rounded-xl flex items-center justify-center p-4 sm:p-5"
          style={{ minHeight: '12rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(212,175,55,0.08)' }}
        >
          <img
            src={PRODUCT_IMAGES[item.key]}
            alt={item.name}
            className="w-auto max-w-full h-28 sm:h-32 object-contain"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mt-4">
        <SummaryStat
          label="Qualifying Direct Referrals"
          value={fmtInt(item.qualifyingDirectReferrals)}
          subtitle="direct referrals with this product"
          icon={HiOutlineUsers}
        />
        <SummaryStat label="Redeemable" value={fmtInt(item.availableClaims)} subtitle={productEligible ? 'ready to redeem' : `${fmtInt(item.blockedClaims)} blocked by maintenance`} icon={HiOutlineCheckCircle} />
      </div>

      <div className="mt-3 rounded-xl px-4 py-3 text-xs flex items-center justify-between gap-3" style={{ background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.5)' }}>
        <span>Total same-product purchases from direct referrals</span>
        <span className="font-semibold text-white">{fmtInt(item.directReferralPurchases)}</span>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-4 text-center">
        <div className="rounded-xl py-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>Qualified Sets</p>
          <p className="text-white font-bold mt-1">{fmtInt(item.qualifiedSets)}</p>
        </div>
        <div className="rounded-xl py-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>Claimed</p>
          <p className="text-white font-bold mt-1">{fmtInt(item.claimedSets)}</p>
        </div>
        <div className="rounded-xl py-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>Need More</p>
          <p className="text-white font-bold mt-1">{fmtInt(item.remainingToNextSet)}</p>
        </div>
      </div>

      <ContributorList
        title="Qualifying direct referrals"
        contributors={item.contributors}
        accent="#D4AF37"
        onViewAll={() => onViewContributors(item)}
      />

      {canRedeem ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => onRedeem(item.key, item.availableClaims)}
          className="w-full mt-4 rounded-xl py-3 text-sm font-semibold"
          style={{ background: '#4ADE80', color: '#0d1b10' }}
        >
          {busy ? 'Redeeming...' : `Redeem ${item.availableClaims} free ${item.name.toLowerCase()}${item.availableClaims > 1 ? ' items' : ''}`}
        </button>
      ) : (
        <div className="mt-4 rounded-xl py-3 px-4 text-sm" style={{ background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.38)' }}>
          {productEligible
            ? `Need ${item.remainingToNextSet} more qualifying direct referral${item.remainingToNextSet === 1 ? '' : 's'} on this product.`
            : `Redeeming is locked until you reach the 200-point maintenance target. Need ${fmtInt(pointsNeeded)} more point${pointsNeeded === 1 ? '' : 's'}.`}
        </div>
      )}
    </div>
  );
}

export default function HiFiveBonus() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState('');
  const [contributorModal, setContributorModal] = useState(null);
  const [activeSection, setActiveSection] = useState('package');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const res = await api.get('/hifive');
      setData(res.data);
    } catch {
      toast.error('Unable to load Hi-Five bonus details.');
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleRedeemProduct(bonusType, quantity) {
    try {
      setBusyKey(`product-${bonusType}`);
      const res = await api.post('/hifive/redeem', { claimType: 'product', bonusType, quantity });
      toast.success(res.data?.message || 'Product Hi-Five redeemed successfully.');
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Product redemption failed.');
    } finally {
      setBusyKey('');
    }
  }

  async function handleClaimPackage(bonusType, quantity) {
    try {
      setBusyKey(`package-${bonusType}`);
      const res = await api.post('/hifive/redeem', { claimType: 'package', bonusType, quantity });
      toast.success(res.data?.message || 'Package Hi-Five claim submitted.');
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Package claim failed.');
    } finally {
      setBusyKey('');
    }
  }

  if (loading) return <Spinner />;

  if (!data) {
    return (
      <div className="glass-card rounded-2xl p-16 text-center">
        <HiOutlineGift className="w-10 h-10 mx-auto mb-3" style={{ color: 'rgba(212,175,55,0.2)' }} />
        <p style={{ color: 'rgba(255,255,255,0.3)' }}>Hi-Five bonus details are unavailable right now.</p>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <ContributorModal
        open={Boolean(contributorModal)}
        title={contributorModal?.title}
        contributors={contributorModal?.contributors || []}
        accent={contributorModal?.accent || '#D4AF37'}
        onClose={() => setContributorModal(null)}
      />

      <div>
        <h1 className="portal-page-title font-display text-2xl font-bold">Hi-Five Bonus Center</h1>
        <div className="w-10 h-0.5 mt-2 rounded-full" style={{ background: 'linear-gradient(90deg,#D4AF37,transparent)' }} />
        <p className="portal-card-muted text-sm mt-2">
          Track both package-based cash Hi-Five rewards and product-based free-item redemptions in one place.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <SummaryStat label="Direct Referrals" value={fmtInt(data.summary?.directReferralCount)} subtitle="team members directly referred by you" icon={HiOutlineUsers} />
        <SummaryStat label="Maintenance Points" value={fmtInt(data.summary?.maintenancePoints)} subtitle="previous-month repurchase points" icon={HiOutlineSparkles} />
        <SummaryStat label="Package Cash Claimable" value={`PHP ${fmtMoney(data.packageBonus?.totalAvailableCashAmount)}`} subtitle={`${fmtInt(data.packageBonus?.totalAvailableClaims)} package claim(s) ready`} icon={HiOutlineCash} />
        <SummaryStat
          label="Product Hi-Five Status"
          value={data.productBonus?.eligible ? 'Eligible' : `${fmtInt(data.productBonus?.pointsNeeded)} pts needed`}
          subtitle={data.productBonus?.eligible ? `${fmtInt(data.productBonus?.totalAvailableClaims)} redeemable product claim(s)` : 'reach 200 points to unlock product redemptions'}
          icon={HiOutlineGift}
        />
      </div>

      <div className="lg:hidden">
        <div className="glass-card rounded-2xl p-3 flex items-center gap-2">
          {[
            { key: 'package', label: 'Package Claims' },
            { key: 'product', label: 'Product Claims' },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setActiveSection(item.key)}
              className="flex-1 rounded-xl px-3 py-2.5 text-sm font-semibold"
              style={activeSection === item.key
                ? { background: 'rgba(212,175,55,0.18)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.32)' }
                : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className={`${activeSection === 'package' ? 'block' : 'hidden lg:block'} glass-card rounded-3xl p-4 sm:p-6`}>
        <div className="flex items-start justify-between gap-4 flex-col lg:flex-row">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: '#D4AF37' }}>Hi-Five Bonus - Package</p>
            <h2 className="font-display text-xl font-semibold text-white mt-2">Cash bonus for every 5 same-package direct referrals</h2>
            <p className="text-sm mt-2 max-w-3xl" style={{ color: 'rgba(255,255,255,0.42)' }}>
              If you directly refer 5 members with the same package, you can submit one cash claim equal to that package amount.
              Example: 5 Silver direct referrals unlock a PHP 5,000 cash Hi-Five claim.
            </p>
          </div>
          <div className="portal-soft-panel rounded-2xl px-4 py-3">
            <p className="portal-card-muted text-xs">Guardrail</p>
            <p className="portal-card-title text-sm font-semibold mt-1">Claims are submitted for review before payout release.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-6">
          {(data.packageBonus?.packages || []).map((item) => (
            <PackageCard
              key={item.key}
              item={item}
              onViewContributors={(card) => setContributorModal({
                title: `${card.name} Package Direct Referrals`,
                contributors: card.contributors,
                accent: PACKAGE_ACCENTS[card.key] || '#D4AF37',
              })}
              busy={busyKey === `package-${item.key}`}
              onClaim={handleClaimPackage}
            />
          ))}
        </div>
      </div>

      <div className={`${activeSection === 'product' ? 'block' : 'hidden lg:block'} glass-card rounded-3xl p-4 sm:p-6`}>
        <div className="flex items-start justify-between gap-4 flex-col lg:flex-row">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: '#D4AF37' }}>Hi-Five Bonus - Products</p>
            <h2 className="font-display text-xl font-semibold text-white mt-2">Free products when 5 direct referrals buy the same item</h2>
            <p className="text-sm mt-2 max-w-3xl" style={{ color: 'rgba(255,255,255,0.42)' }}>
              Product Hi-Five is unlocked only when you maintain at least 200 repurchase points. Once eligible, every 5 different direct referrals who each bought the same product unlock one free-item redemption for that product.
            </p>
          </div>
          <div
            className="rounded-2xl px-4 py-3"
            style={{
              background: data.productBonus?.eligible ? 'rgba(34,197,94,0.12)' : 'rgba(212,175,55,0.08)',
              border: data.productBonus?.eligible ? '1px solid rgba(34,197,94,0.25)' : '1px solid rgba(212,175,55,0.15)',
            }}
          >
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.42)' }}>Maintenance Gate</p>
            <p className="text-sm font-semibold text-white mt-1">
              {data.productBonus?.eligible
                ? `Eligible to redeem now with ${fmtInt(data.productBonus?.maintenancePoints)} points`
                : `Need ${fmtInt(data.productBonus?.pointsNeeded)} more points to unlock product redemption`}
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(212,175,55,0.08)' }}>
          <div className="flex items-center justify-between gap-4 flex-col sm:flex-row">
            <div>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.42)' }}>Current maintenance points</p>
              <p className="text-2xl font-bold text-white mt-1">{fmtInt(data.productBonus?.maintenancePoints)} / {fmtInt(data.productBonus?.threshold)}</p>
            </div>
            <div className="w-full sm:w-72">
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <div
                  className="h-full"
                  style={{
                    width: `${Math.min(100, Math.max(0, ((data.productBonus?.maintenancePoints || 0) / (data.productBonus?.threshold || 200)) * 100))}%`,
                    background: data.productBonus?.eligible ? '#4ADE80' : '#D4AF37',
                  }}
                />
              </div>
              <p className="text-[11px] mt-2 text-right" style={{ color: 'rgba(255,255,255,0.42)' }}>
                {data.productBonus?.eligible ? 'Maintenance target reached' : `${fmtInt(data.productBonus?.pointsNeeded)} more points needed`}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-6">
          {(data.productBonus?.products || []).map((item) => (
            <ProductCard
              key={item.key}
              item={item}
              productEligible={data.productBonus?.eligible}
              pointsNeeded={data.productBonus?.pointsNeeded}
              onViewContributors={(card) => setContributorModal({
                title: `${card.name} Qualifying Direct Referrals`,
                contributors: card.contributors,
                accent: '#D4AF37',
              })}
              busy={busyKey === `product-${item.key}`}
              onRedeem={handleRedeemProduct}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
