import { useScrollReveal } from '../hooks/useScrollReveal';
import Lightbox, { useLightbox } from '../components/Lightbox';

function PageHero({ title, subtitle }) {
  return (
    <section className="relative pt-40 pb-40 lg:pt-52 lg:pb-52 overflow-hidden" style={{ backgroundColor: '#592219' }}>
      <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)', backgroundSize: '40px 40px' }} />
      <div className="absolute bottom-20 right-[10%] w-80 h-80 rounded-full bg-white/5 blur-3xl animate-pulse-glow" />
      <div className="section-container relative z-10 text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight animate-fade-up">{title}</h1>
        {subtitle && <p className="mt-4 text-lg text-white/50 max-w-xl mx-auto animate-fade-up" style={{ animationDelay: '0.15s' }}>{subtitle}</p>}
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-36 bg-gradient-to-t from-white to-transparent" />
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
  { num: '7', name: 'Ranking Bonus', desc: 'Additional income based on your rank in the Leadership Point Count (LPC) system.' },
  { num: '8', name: 'Global Bonus', desc: 'Share in the company\'s global pool bonus reserved for top-performing leaders in the network.' },
];

const TIERS = [
  { name: 'Bronze', price: '1,500', color: 'from-amber-700 to-amber-600', badge: 'bg-amber-100 text-amber-700', features: ['Entry package products', 'Binary genealogy placement', 'Direct referral bonus', 'Basic member portal'] },
  { name: 'Silver', price: '3,000', color: 'from-gray-400 to-gray-500', badge: 'bg-gray-100 text-gray-600', features: ['Silver package products', 'Higher pairing bonus', 'Direct referral bonus', 'Unilevel income'] },
  { name: 'Gold', price: '6,000', color: 'from-yellow-500 to-amber-500', badge: 'bg-yellow-50 text-yellow-700', popular: true, features: ['Gold package products', 'Maximum pairing bonus', 'Leadership bonus eligible', 'Hi-Five bonus eligible', 'Full income streams'] },
  { name: 'Platinum', price: '12,000', color: 'from-slate-500 to-slate-600', badge: 'bg-slate-100 text-slate-600', features: ['Platinum package products', 'Highest earning potential', 'All income streams', 'Priority support', 'Leadership ranking'] },
  { name: 'Garnet', price: '18,000', color: 'from-rose-600 to-red-500', badge: 'bg-rose-50 text-rose-600', features: ['Garnet package products', 'Premium earning potential', 'All income streams', 'VIP support', 'Top leadership ranking'] },
  { name: 'Diamond', price: '24,000', color: 'from-cyan-500 to-blue-500', badge: 'bg-cyan-50 text-cyan-700', features: ['Diamond package products', 'Maximum earning potential', 'All income streams', 'Exclusive events access', 'Elite leadership ranking'] },
];

export default function Opportunities() {
  const ref1 = useScrollReveal();
  const ref2 = useScrollReveal();
  const ref3 = useScrollReveal();
  const lightbox = useLightbox();

  return (
    <>
      <PageHero title="Business Opportunities" subtitle="8 Ways of Wealth and flexible entry packages to match your goals." />

      {/* Products Gallery */}
      <section className="section-padding bg-white">
        <div className="section-container">
          <div ref={ref1} className="reveal text-center mb-14">
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase mb-4" style={{ backgroundColor: 'rgba(55,148,46,0.08)', color: '#37942E' }}>Our Products</span>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight" style={{ color: '#37373f' }}>Healthy &amp; Wealthy Options</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { name: 'Nogatu Barley Juice', desc: 'Pure Energy & Naturally Refreshing', price: '850.00', img: '/landing/img/menu-item-1.png' },
              { name: 'Nogatu Glow', desc: 'L-Reduced Glutathione', price: '550.00', img: '/landing/img/menu-item-2.png' },
              { name: 'Collagen Vitamin C', desc: 'Vitamin C with Collagen & Clu', price: '500.00', img: '/landing/img/menu-item-3.png' },
              { name: 'Chocolate Drink Mix', desc: 'Healthy Chocolate with Herbal & Vegetable Mix', price: '710.00', img: '/landing/img/menu-item-4.png' },
              { name: 'Nogatu Coffee Mix', desc: 'Herbal Coffee Mix for Immunity & Energy', price: '495.00', img: '/landing/img/menu-item-5.png' },
              { name: 'Mangosteen Coffee Mix', desc: 'Coffee Drink Mix', price: '375.00', img: '/landing/img/menu-item-6.png' },
            ].map((p, i) => {
              const ref = useScrollReveal({ delay: i * 80 });
              return (
                <div key={p.name} ref={ref} className="reveal group text-center">
                  <div className="relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 flex items-center justify-center h-56 mb-4 cursor-pointer" onClick={() => lightbox.open(p.img)}>
                    <img src={p.img} alt={p.name} className="max-h-44 object-contain group-hover:scale-110 transition-transform duration-500" loading="lazy" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 w-10 h-10 rounded-full bg-white/80 flex items-center justify-center">
                        <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                      </div>
                    </div>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1">{p.name}</h4>
                  <p className="text-sm text-gray-500 mb-1">{p.desc}</p>
                  <p className="text-lg font-bold" style={{ color: '#592219' }}>Php {p.price}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 8 Ways of Wealth */}
      <section className="section-padding" style={{ backgroundColor: '#f2f2f2' }}>
        <div className="section-container">
          <div ref={ref2} className="reveal text-center mb-14">
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase mb-4" style={{ backgroundColor: 'rgba(89,34,25,0.06)', color: '#592219' }}>8 Ways of Wealth</span>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight" style={{ color: '#37373f' }}>Multiple Income Streams</h2>
            <p className="mt-4 text-gray-500 text-lg max-w-2xl mx-auto">Our compensation plan rewards you through multiple income channels.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {WAYS_OF_WEALTH.map((w, i) => {
              const ref = useScrollReveal({ delay: i * 60 });
              return (
                <div key={w.name} ref={ref} className={`reveal group bg-white p-6 rounded-2xl border hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${w.outside ? 'border-amber-100' : 'border-gray-100'}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className="w-12 h-12 rounded-2xl text-white flex items-center justify-center font-bold text-lg shadow-lg group-hover:scale-110 transition-transform duration-300"
                      style={w.outside
                        ? { background: 'linear-gradient(135deg, #b45309, #f59e0b)', boxShadow: '0 8px 20px rgba(245,158,11,0.2)' }
                        : { background: 'linear-gradient(135deg, #0A760E, #37942E)', boxShadow: '0 8px 20px rgba(55,148,46,0.2)' }}
                    >
                      {w.num}
                    </div>
                    {w.outside && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(245,158,11,0.1)', color: '#b45309' }}>
                        Outside System
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{w.name}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{w.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Account Tiers */}
      <section className="section-padding bg-white">
        <div className="section-container">
          <div ref={ref3} className="reveal text-center mb-14">
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase mb-4" style={{ backgroundColor: 'rgba(55,148,46,0.08)', color: '#37942E' }}>Packages</span>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight" style={{ color: '#37373f' }}>Choose Your Entry Package</h2>
            <p className="mt-4 text-gray-500 text-lg max-w-2xl mx-auto">Start at any level and upgrade anytime as your business grows.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {TIERS.map((tier, i) => {
              const ref = useScrollReveal({ delay: i * 80 });
              return (
                <div
                  key={tier.name}
                  ref={ref}
                  className={`reveal relative bg-white rounded-2xl border overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                    tier.popular ? 'border-green-200 shadow-lg ring-1 ring-green-100' : 'border-gray-100'
                  }`}
                >
                  {tier.popular && (
                    <div className="absolute top-0 right-0 px-4 py-1 text-white text-xs font-bold rounded-bl-xl" style={{ background: '#37942E' }}>Popular</div>
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
                        <li key={f} className="flex items-start gap-3 text-sm text-gray-600">
                          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#37942E' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          {f}
                        </li>
                      ))}
                    </ul>
                    <a
                      href="/portal/login"
                      className={`mt-6 block text-center py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                        tier.popular ? 'text-white shadow-md' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                      style={tier.popular ? { background: '#37942E' } : undefined}
                    >
                      Get Started
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="section-padding" style={{ backgroundColor: '#f2f2f2' }}>
        <div className="section-container">
          <div className="text-center mb-14">
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase mb-4" style={{ backgroundColor: 'rgba(89,34,25,0.06)', color: '#592219' }}>Process</span>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight" style={{ color: '#37373f' }}>How It Works</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: '01', title: 'Choose a Package', desc: 'Select an entry package from Bronze to Diamond that matches your goals and budget.' },
              { step: '02', title: 'Get Activated', desc: 'Receive your activation code, products, and access to the full member dashboard.' },
              { step: '03', title: 'Build & Earn', desc: 'Refer members, build your binary network, and earn through 8 ways of wealth.' },
            ].map((item, i) => {
              const ref = useScrollReveal({ delay: i * 150 });
              return (
                <div key={item.step} ref={ref} className="reveal text-center">
                  <div className="w-16 h-16 rounded-2xl text-white flex items-center justify-center font-extrabold text-xl mx-auto mb-5 shadow-lg" style={{ background: 'linear-gradient(135deg, #592219, #6d3028)', boxShadow: '0 8px 20px rgba(89,34,25,0.2)' }}>
                    {item.step}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <Lightbox src={lightbox.src} type={lightbox.type} onClose={lightbox.close} />
    </>
  );
}
