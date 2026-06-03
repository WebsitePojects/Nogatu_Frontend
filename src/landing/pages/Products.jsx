import { useScrollReveal } from '../hooks/useScrollReveal';
import Lightbox, { useLightbox } from '../components/Lightbox';
import { LANDING_PRODUCT_GROUPS } from '../data/productCatalog';

function PageHero({ title, subtitle }) {
  return (
    <section className="landing-page-hero relative pt-28 pb-10 sm:pt-36 sm:pb-16 lg:pt-40 lg:pb-20 overflow-hidden bg-dot-grid" style={{ backgroundColor: '#FFFDF5' }}>
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle at 80% 20%, rgba(212,165,40,0.08), transparent 70%)' }} />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle at 20% 80%, rgba(89,34,25,0.05), transparent 70%)' }} />
      <div className="absolute top-0 left-0 right-0 h-1" style={{ background: 'linear-gradient(90deg, transparent, #D4A528 50%, transparent)' }} />
      <div className="section-container relative z-10">
        <div className="max-w-3xl">
          <div className="flex items-center gap-3 mb-5 motion-safe:animate-fade-up">
            <div className="h-0.5 w-8 rounded-full" style={{ background: 'linear-gradient(90deg, #B8860B, #D4A528)' }} />
            <span className="text-xs font-bold tracking-widest uppercase" style={{ color: '#B8860B' }}>NOGATU Alliance</span>
          </div>
          <h1 className="text-3xl md:text-5xl lg:text-[3.5rem] font-extrabold tracking-tight leading-tight mb-3 sm:mb-4 motion-safe:animate-fade-up" style={{ color: '#3A1000', animationDelay: '0.05s' }}>{title}</h1>
          {subtitle && <p className="text-base sm:text-lg leading-relaxed max-w-xl motion-safe:animate-fade-up" style={{ color: '#6d3028', animationDelay: '0.15s' }}>{subtitle}</p>}
          <div className="mt-6 w-16 h-1 rounded-full motion-safe:animate-fade-up" style={{ background: 'linear-gradient(90deg, #B8860B, #D4A528)', animationDelay: '0.2s' }} />
        </div>
      </div>
    </section>
  );
}

const WAYS_OF_WEALTH = [
  { num: '1', name: 'Direct Selling', desc: 'Sell NOGATU Alliance products directly to customers and earn profit from every sale you make.', outside: true },
  { num: '2', name: 'Direct Referral Bonus', desc: 'Earn immediately for every member you personally refer to the NOGATU Alliance network.' },
  { num: '3', name: 'Sales Matched Bonus', desc: 'Binary pairing bonus from balanced growth on your left and right networks through sales matching.' },
  { num: '4', name: 'Leadership Bonus', desc: 'Bonus rewards for reaching leadership milestones and maintaining consistent network growth.' },
  { num: '5', name: 'Hi-Five Bonus', desc: 'Special rewards through the Hi-Five program for qualified and active members.' },
  { num: '6', name: 'Unilevel Bonus', desc: 'Multi-level income from your entire downline across multiple depths of your network.' },
  { num: '7', name: 'Ranking Bonus', desc: 'Additional income based on your approved rank achievements and released ranking incentives.' },
  { num: '8', name: 'Global Bonus', desc: 'Share in the company\'s global pool bonus reserved for top-performing leaders in the network.' },
];

const TIERS = [
  { name: 'Diamond', price: '150,000', color: 'from-cyan-500 to-blue-500', badge: 'bg-cyan-50 text-cyan-700', features: ['Diamond package products', 'Maximum earning potential', 'All income streams', 'Exclusive events access', 'Elite leadership ranking'] },
  { name: 'Garnet', price: '50,000', color: 'from-rose-600 to-red-500', badge: 'bg-rose-50 text-rose-600', features: ['Garnet package products', 'Premium earning potential', 'All income streams', 'VIP support', 'Top leadership ranking'] },
  { name: 'Platinum', price: '25,000', color: 'from-[#355C7D] to-[#4F6D91]', badge: 'bg-sky-50 text-sky-700', features: ['Platinum package products', 'Highest earning potential', 'All income streams', 'Priority support', 'Leadership ranking'] },
  { name: 'Gold', price: '10,000', color: 'from-yellow-500 to-amber-500', badge: 'bg-yellow-50 text-yellow-700', popular: true, features: ['Gold package products', 'Maximum pairing bonus', 'Leadership bonus eligible', 'Hi-Five bonus eligible', 'Full income streams'] },
  { name: 'Silver', price: '5,000', color: 'from-gray-400 to-gray-500', badge: 'bg-gray-100 text-gray-600', features: ['Silver package products', 'Higher pairing bonus', 'Direct referral bonus', 'Unilevel income'] },
  { name: 'Bronze', price: '2,500', color: 'from-amber-700 to-amber-600', badge: 'bg-amber-100 text-amber-700', features: ['Entry package products', 'Binary genealogy placement', 'Direct referral bonus', 'Basic member portal'] },
];

function ProductCard({ product, delay, onLightbox }) {
  const ref = useScrollReveal({ delay });
  return (
    <div ref={ref} className="reveal group min-w-0 text-center">
      <div className="relative overflow-hidden rounded-2xl p-3 sm:p-8 flex items-center justify-center h-36 sm:h-56 mb-3 sm:mb-4 cursor-pointer" style={{ background: 'linear-gradient(135deg, #FFF8E1, #FFFDF5)' }} onClick={() => product.img && onLightbox(product.img)}>
        {product.placeholder ? (
          <div className="size-full rounded-xl border-2 border-dashed border-brand-gold/35 bg-white/45 flex flex-col items-center justify-center text-brand-brown">
            <svg className="size-10 text-brand-gold-dark mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <span className="text-sm font-semibold">Image Slot</span>
          </div>
        ) : (
          <img src={product.img} alt={product.name} className="max-h-32 sm:max-h-44 object-contain motion-safe:group-hover:scale-110 motion-safe:transition-transform motion-safe:duration-500" loading="lazy" />
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 motion-safe:transition-colors motion-safe:duration-300 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 motion-safe:transition-opacity motion-safe:duration-300 size-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(255,253,245,0.9)' }}>
            <svg className="size-5" style={{ color: '#B8860B' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
          </div>
        </div>
      </div>
      <div className="mx-auto flex max-w-[13rem] flex-col items-center">
        <h4 className="min-h-[2.6rem] font-semibold mb-1 text-[0.92rem] sm:text-base leading-tight" style={{ color: '#3A1000' }}>{product.name}</h4>
        <p className="min-h-[2.2rem] text-[0.76rem] sm:text-sm mb-1 leading-snug" style={{ color: '#6d3028' }}>{product.desc}</p>
        <p className="text-lg sm:text-lg font-bold" style={{ color: '#B8860B' }}>{product.price === 'TBA' ? product.price : `Php ${product.price}`}</p>
      </div>
    </div>
  );
}

function WealthCard({ item, delay }) {
  const ref = useScrollReveal({ delay });
  return (
    <div ref={ref} className={`reveal group rounded-[1.4rem] border p-4 motion-safe:transition-all motion-safe:duration-300 motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-xl sm:p-5`} style={{ backgroundColor: '#FFFDF5', borderColor: item.outside ? 'rgba(251,191,36,0.28)' : 'rgba(184,134,11,0.15)' }}>
      <div className="flex items-start justify-between gap-3">
        <div
          className="flex h-11 w-11 items-center justify-center rounded-2xl text-base font-bold text-white shadow-lg motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:scale-110"
          style={item.outside
            ? { background: 'linear-gradient(135deg, #b45309, #f59e0b)', boxShadow: '0 8px 20px rgba(245,158,11,0.2)' }
            : { background: 'linear-gradient(135deg, #B8860B, #D4A528)', boxShadow: '0 8px 20px rgba(184,134,11,0.25)' }}
        >
          {item.num}
        </div>
        {item.outside && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(245,158,11,0.1)', color: '#b45309' }}>
            Outside System
          </span>
        )}
      </div>
      <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: item.outside ? '#b45309' : '#8A6300' }}>Way {item.num}</p>
      <h3 className="mt-2 font-semibold leading-snug" style={{ color: '#3A1000' }}>{item.name}</h3>
      <p className="mt-2 text-sm leading-6" style={{ color: '#6d3028' }}>{item.desc}</p>
    </div>
  );
}

function WealthPairCard({ items, delay }) {
  const ref = useScrollReveal({ delay });
  return (
    <div ref={ref} className="reveal rounded-[1.7rem] border border-[#B8860B]/15 bg-white/70 p-4 shadow-[0_18px_42px_rgba(89,34,25,0.08)] sm:p-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {items.map((item, index) => (
          <WealthCard key={item.name} item={item} delay={index * 40} />
        ))}
      </div>
    </div>
  );
}

function TierCard({ tier, delay }) {
  const ref = useScrollReveal({ delay });
  return (
    <div
      ref={ref}
      className={`reveal relative rounded-2xl border overflow-hidden motion-safe:transition-all motion-safe:duration-300 motion-safe:hover:shadow-xl motion-safe:hover:-translate-y-1 ${tier.popular ? 'shadow-lg' : ''}`}
      style={{ backgroundColor: '#FFFDF5', borderColor: tier.popular ? '#D4A528' : 'rgba(184,134,11,0.15)', ...(tier.popular ? { boxShadow: '0 0 0 1px rgba(212,165,40,0.3)' } : {}) }}
    >
      {tier.popular && (
        <div className="absolute top-0 right-0 rounded-bl-xl px-4 py-1 text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, #047857, #10b981)' }}>Popular</div>
      )}
      <div className={`p-6 bg-gradient-to-br ${tier.color} text-white`}>
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${tier.badge} mb-3`}>{tier.name}</span>
        <div className="flex items-baseline gap-1">
          <span className="text-sm opacity-80">&#8369;</span>
          <span className="text-3xl font-extrabold">{tier.price}</span>
        </div>
      </div>
      <div className="p-6">
        <ul className="space-y-3">
          {tier.features.map((f) => (
            <li key={f} className="flex items-start gap-3 text-sm" style={{ color: '#6d3028' }}>
              <svg className="size-5 flex-shrink-0 mt-0.5" style={{ color: '#B8860B' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              {f}
            </li>
          ))}
        </ul>
        <a
          href="/portal/login"
          className="mt-6 block rounded-xl border px-4 py-3 text-center text-sm font-bold text-white shadow-[0_12px_28px_rgba(89,34,25,0.12)] transition-all duration-200 hover:-translate-y-0.5"
          style={tier.popular
            ? { background: 'linear-gradient(135deg, #B8860B, #D4A528)', borderColor: 'rgba(122,92,8,0.15)' }
            : { background: 'linear-gradient(135deg, #3A1000, #6d3028)', borderColor: 'rgba(184,134,11,0.22)' }}
        >
          Get Started
        </a>
      </div>
    </div>
  );
}

function HowItWorksCard({ item, delay }) {
  const ref = useScrollReveal({ delay });
  return (
    <div ref={ref} className="reveal rounded-[1.5rem] border border-[#B8860B]/15 bg-white/80 p-5 text-left shadow-[0_16px_36px_rgba(89,34,25,0.07)] sm:p-6">
      <div className="flex items-center gap-3">
        <span className="text-xl font-black tracking-[0.12em]" style={{ color: '#8A6300' }}>{item.step}</span>
        <span className="text-lg font-light" style={{ color: '#B8860B' }}>-</span>
        <h3 className="text-lg font-bold" style={{ color: '#3A1000' }}>{item.title}</h3>
      </div>
      <p className="mt-3 text-sm leading-6" style={{ color: '#6d3028' }}>{item.desc}</p>
    </div>
  );
}

export default function Opportunities() {
  const ref1 = useScrollReveal();
  const ref2 = useScrollReveal();
  const ref3 = useScrollReveal();
  const lightbox = useLightbox();
  const wealthPairs = Array.from({ length: WAYS_OF_WEALTH.length / 2 }, (_, index) => WAYS_OF_WEALTH.slice(index * 2, index * 2 + 2));

  return (
    <>
      <PageHero title="Business Opportunities" subtitle="8 Ways of Wealth and flexible entry packages to match your goals." />

      {/* Products Gallery */}
      <section className="section-padding bg-dot-grid" style={{ backgroundColor: '#FFFDF5' }}>
        <div className="section-container">
          <div ref={ref1} className="reveal text-center mb-14">
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase mb-4" style={{ backgroundColor: 'rgba(184,134,11,0.1)', color: '#B8860B' }}>Our Products</span>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight" style={{ color: '#3A1000' }}>Healthy &amp; Wealthy Options</h2>
            <div className="w-16 h-1 rounded-full mx-auto mt-4" style={{ background: 'linear-gradient(90deg, #B8860B, #D4A528)' }} />
          </div>

          <div className="space-y-10 sm:space-y-12">
            {LANDING_PRODUCT_GROUPS.map((group, groupIndex) => (
              <div key={group.title} className="space-y-5 sm:space-y-6">
                <div className="text-center">
                  <p className="inline-flex items-center rounded-full border border-brand-gold/20 bg-white/70 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-brand-gold-dark shadow-sm">
                    {group.title}
                  </p>
                </div>
                <div className={`grid grid-cols-2 gap-x-3 gap-y-5 sm:gap-8 ${group.items.length === 2 ? 'xl:grid-cols-2 xl:max-w-4xl xl:mx-auto' : 'lg:grid-cols-3'}`}>
                  {group.items.map((product, itemIndex) => (
                    <ProductCard
                      key={product.name}
                      product={product}
                      delay={(groupIndex * 3 + itemIndex) * 70}
                      onLightbox={lightbox.open}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8 Ways of Wealth */}
      <section className="section-padding bg-diagonal-lines" style={{ backgroundColor: '#FFF8E1' }}>
        <div className="section-container">
          <div ref={ref2} className="reveal text-center mb-14">
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase mb-4" style={{ backgroundColor: 'rgba(89,34,25,0.08)', color: '#592219' }}>8 Ways of Wealth</span>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight" style={{ color: '#3A1000' }}>Multiple Income Streams</h2>
            <div className="w-16 h-1 rounded-full mx-auto mt-4" style={{ background: 'linear-gradient(90deg, #B8860B, #D4A528)' }} />
            <p className="mt-4 text-lg max-w-2xl mx-auto" style={{ color: '#6d3028' }}>Our compensation plan rewards you through multiple income channels.</p>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {wealthPairs.map((pair, i) => (
              <WealthPairCard key={pair.map((item) => item.num).join('-')} items={pair} delay={i * 70} />
            ))}
          </div>
        </div>
      </section>

      {/* Account Tiers */}
      <section id="packages" className="section-padding bg-geo-pattern scroll-mt-28" style={{ backgroundColor: '#FFFDF5' }}>
        <div className="section-container">
          <div ref={ref3} className="reveal text-center mb-14">
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase mb-4" style={{ backgroundColor: 'rgba(184,134,11,0.1)', color: '#B8860B' }}>Packages</span>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight" style={{ color: '#3A1000' }}>Choose Your Entry Package</h2>
            <div className="w-16 h-1 rounded-full mx-auto mt-4" style={{ background: 'linear-gradient(90deg, #B8860B, #D4A528)' }} />
            <p className="mt-4 text-lg max-w-2xl mx-auto" style={{ color: '#6d3028' }}>Start at any level and upgrade anytime as your business grows.</p>
          </div>

          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2">
            {TIERS.map((tier, i) => (
              <TierCard key={tier.name} tier={tier} delay={i * 80} />
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="section-padding bg-diagonal-lines" style={{ backgroundColor: '#FFF8E1' }}>
        <div className="section-container">
          <div className="text-center mb-14">
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase mb-4" style={{ backgroundColor: 'rgba(89,34,25,0.08)', color: '#592219' }}>Process</span>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight" style={{ color: '#3A1000' }}>How It Works</h2>
            <div className="w-16 h-1 rounded-full mx-auto mt-4" style={{ background: 'linear-gradient(90deg, #B8860B, #D4A528)' }} />
          </div>
          <div className="mx-auto grid max-w-4xl grid-cols-1 gap-5 md:grid-cols-3">
            {[
              { step: '01', title: 'Choose a Package', desc: 'Select an entry package from Bronze to Diamond that matches your goals and budget.' },
              { step: '02', title: 'Get Activated', desc: 'Receive your activation code, products, and access to the full member dashboard.' },
              { step: '03', title: 'Build & Earn', desc: 'Refer members, build your binary network, and earn through 8 ways of wealth.' },
            ].map((item, i) => (
              <HowItWorksCard key={item.step} item={item} delay={i * 150} />
            ))}
          </div>
        </div>
      </section>

      <Lightbox src={lightbox.src} type={lightbox.type} onClose={lightbox.close} />
    </>
  );
}
