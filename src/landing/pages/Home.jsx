import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useScrollReveal, useCountUp } from '../hooks/useScrollReveal';
import Lightbox, { useLightbox } from '../components/Lightbox';

/* ────────────────────────── Hero (NogatuDrop-style with BG image) ────────────────────────── */
function Hero() {
  return (
    <section
      className="relative min-h-[100svh] overflow-hidden"
      style={{
        backgroundImage: 'url(/img/landing-bg-clean.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Warm gold overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-transparent pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-24 sm:pt-24 pb-6 sm:pb-10">
        <div className="min-h-[calc(100svh-120px)] lg:min-h-[74vh] flex flex-col lg:flex-row gap-4 lg:gap-0 items-center justify-between">
          <div className="order-2 lg:order-1 w-full lg:w-5/12 pb-4 lg:pb-0 mt-auto motion-safe:animate-fade-up text-left z-20 flex flex-col items-start">
            <h1 className="text-[clamp(1.9rem,4.2vw,3.8rem)] font-extrabold leading-[1.08] tracking-tight text-white mb-4 sm:mb-5 drop-shadow-2xl">
              Enjoy Our Healthy<br />
              <span className="text-brand-gold-light drop-shadow-lg">&amp; Wealthy Lifestyle</span>
            </h1>
            <p className="mb-5 sm:mb-6 text-white/90 text-sm sm:text-lg font-medium max-w-md drop-shadow-md">
              Wellness You Can Taste, Quality You Can Trust.
            </p>
            <a
              href="/portal/login"
              className="inline-block px-6 sm:px-10 py-3 sm:py-3.5 text-white text-sm sm:text-[clamp(1rem,1.6vw,1.25rem)] font-bold rounded-full motion-safe:transition-all motion-safe:duration-300 border-2 border-brand-gold-dark shadow-[0_10px_40px_rgba(184,134,11,0.5)] leading-none hover:scale-105 hover:shadow-[0_15px_50px_rgba(184,134,11,0.7)]"
              style={{ background: 'linear-gradient(135deg, #B8860B 0%, #D4A528 50%, #E7C679 100%)' }}
            >
              Be the One. Register Now!
            </a>
            <a
              href="#stockist-apply"
              className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/35 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/18"
            >
              Apply as Stockist
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </a>
            <div className="mt-5 hidden sm:flex items-center justify-start gap-3 text-white/90">
              <svg className="w-6 h-6 text-brand-gold-light drop-shadow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-[clamp(0.95rem,1.4vw,1.15rem)] font-semibold leading-none drop-shadow">FDA Approved Products</span>
            </div>
          </div>

          <div className="order-1 lg:order-2 w-full lg:w-6/12 flex justify-center lg:justify-end motion-safe:animate-fade-up z-10 mt-0 sm:mt-8 lg:mt-0 flex-1 lg:flex-none items-center">
            <div className="relative w-[120vw] max-w-[460px] sm:w-full sm:max-w-[430px] lg:max-w-[620px] xl:max-w-[700px] mx-auto lg:mx-0 -ml-2 sm:ml-0">
              <div className="absolute left-1/2 -translate-x-1/2 bottom-8 w-3/4 h-1/3 rounded-full blur-[60px] bg-brand-gold/55 motion-safe:animate-pulse-glow" />
              <div className="absolute inset-x-10 bottom-4 h-10 rounded-full bg-black/35 blur-[32px]" />
              <img
                src="/img/landing-product.png"
                alt="Nogatu Alliance Products"
                className="relative z-10 w-full h-auto object-contain motion-safe:animate-float-slow drop-shadow-[0_28px_60px_rgba(0,0,0,0.55)] origin-bottom lg:origin-center"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────── Stats Bar ───────────────────── */
function StatsBar() {
  const membersRef = useCountUp(5900, 2000);
  const networksRef = useCountUp(5900, 2000);

  const ref = useScrollReveal();
  return (
    <section className="py-14 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #592219 0%, #6d3028 50%, #592219 100%)' }}>
      {/* Diagonal line pattern */}
      <div className="absolute inset-0 pointer-events-none bg-diagonal-lines" />
      <div ref={ref} className="reveal section-container grid grid-cols-2 lg:grid-cols-4 gap-8 text-center relative z-10">
        <div>
          <p className="text-3xl lg:text-4xl font-extrabold text-brand-gold-light"><span ref={membersRef}>0</span>+</p>
          <p className="text-sm text-white/60 mt-1 font-medium">Active Members</p>
        </div>
        <div>
          <p className="text-3xl lg:text-4xl font-extrabold text-brand-gold-light"><span ref={networksRef}>0</span>+</p>
          <p className="text-sm text-white/60 mt-1 font-medium">Networks Built</p>
        </div>
        <div>
          <p className="text-3xl lg:text-4xl font-extrabold" style={{ color: '#FDE68A' }}>10</p>
          <p className="text-sm mt-1 font-semibold" style={{ color: '#FDE68A' }}>Product Lines</p>
        </div>
        <div>
          <p className="text-3xl lg:text-4xl font-extrabold" style={{ color: '#FDE68A' }}>99%</p>
          <p className="text-sm mt-1 font-semibold" style={{ color: '#FDE68A' }}>Member Satisfaction</p>
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────── About Preview ────────────────── */
function AboutPreview() {
  const ref1 = useScrollReveal();
  const ref2 = useScrollReveal({ delay: 100 });
  const lightbox = useLightbox();

  return (
    <section className="section-padding relative overflow-hidden" style={{ background: '#FFFDF5' }}>
      {/* Geo pattern bg */}
      <div className="absolute inset-0 pointer-events-none bg-geo-pattern" />
      <div className="section-container relative z-10">
        <SectionHeader badge="About Us" title="Learn More About Us" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div ref={ref1} className="reveal-left">
            <div className="relative about-photo-frame">
              <div className="about-photo-glow" />
              <div className="about-photo-orb about-photo-orb-left" />
              <div className="about-photo-orb about-photo-orb-right" />
              <img
                src="/landing/assets/img/about.jpg"
                alt="About NOGATU Alliance"
                className="relative z-10 rounded-2xl shadow-xl w-full object-cover cursor-pointer hover:shadow-2xl motion-safe:transition-shadow motion-safe:duration-300 border border-primary-200/30 about-photo-main"
                onClick={() => lightbox.open('/landing/assets/img/about.jpg')}
                loading="lazy"
              />
              {/* Accent badge */}
              <div className="absolute -bottom-4 -right-4 rounded-2xl px-5 py-3 shadow-xl about-photo-badge" style={{ background: 'linear-gradient(135deg, #B8860B, #D4A528)' }}>
                <div className="text-white font-black text-xl">10+</div>
                <div className="text-white/80 text-xs font-semibold uppercase tracking-wide">Products</div>
              </div>
            </div>
          </div>
          <div ref={ref2} className="reveal-right">
            <p className="text-gray-600 leading-relaxed mb-6">
              Nogatu Alliance is a supplier and distributor of exclusively manufactured health food supplements as well as skin care products. It is committed to helping empower people in building a sustainable livelihood through marketing and selling of high-quality products that promote improved health and wellness.
            </p>
            <p className="text-gray-500 leading-relaxed mb-8">
              It also provides its members with competitive marketing incentives.
            </p>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-8">
              <div className="about-info-card">
                <div className="about-info-icon">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-gold-dark mb-2">Main Office</p>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">94 Navarro Street, Maligaya Park, Brgy 177, Caloocan City</p>
              </div>
              <div className="about-info-card">
                <div className="about-info-icon">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 21h18M5 21V7l8-4 6 3v15M9 9h.01M9 12h.01M9 15h.01M13 9h.01M13 12h.01M13 15h.01" />
                  </svg>
                </div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-gold-dark mb-2">Satellite Branch</p>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">Reserved space for your satellite branch address and contact details.</p>
              </div>
            </div>
            <div className="relative inline-block product-mini-frame">
              <div className="product-mini-glow" />
              <img
                src="/landing/img/about-2.jpg"
                alt="NOGATU Products"
                className="relative z-10 rounded-xl shadow-lg w-full max-w-sm object-cover cursor-pointer border border-primary-200/30 product-mini-image"
                onClick={() => lightbox.open('/landing/img/about-2.jpg')}
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </div>
      <Lightbox src={lightbox.src} type={lightbox.type} onClose={lightbox.close} />
    </section>
  );
}

/* ────────────────────── Why Choose Us ────────────────────── */
function WhyUs() {
  const ref = useScrollReveal();
  const features = [
    { icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01', title: 'Our Mission', desc: 'Nogatu Alliance aims to become one of the Philippines\' leading network marketing company that spans locally and abroad.' },
    { icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z', title: 'Our Vision', desc: 'Empowers people by giving them access to high quality health and wellness products and enables them to earn significant income.' },
    { icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4', title: 'Our Products', desc: 'We pride ourselves on always offering our customers high-quality products. This is a core value of our business.' },
  ];

  return (
    <section className="section-padding relative overflow-hidden" style={{ background: '#FFF8E1' }}>
      {/* Dot grid bg */}
      <div className="absolute inset-0 pointer-events-none bg-dot-grid" style={{ opacity: 0.06 }} />
      <div className="section-container relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Why box */}
          <div ref={ref} className="reveal lg:col-span-4">
            <div className="h-full rounded-2xl p-8 lg:p-10 text-white relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #592219 0%, #6d3028 100%)' }}>
              {/* Subtle diagonal overlay */}
              <div className="absolute inset-0 pointer-events-none" style={{
                backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(212,165,40,0.04) 10px, rgba(212,165,40,0.04) 11px)',
              }} />
              <div className="relative z-10">
                <h3 className="text-2xl font-bold mb-4">Why Choose <span className="text-brand-gold-light">NOGATU?</span></h3>
                <p className="text-white/70 leading-relaxed mb-6">
                  At Nogatu Alliance, we don't just sell products, we build partnerships. When you choose us, you become our valued partner, working alongside us to achieve your success.
                </p>
                <p className="text-white/70 leading-relaxed mb-6">
                  You are not alone in this journey. Our exceptional customer support team is dedicated to your success.
                </p>
                <NavLink to="/about" className="inline-flex items-center gap-2 text-brand-gold-light hover:text-brand-yellow-light font-medium text-sm motion-safe:transition-colors">
                  Learn More
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </NavLink>
              </div>
            </div>
          </div>

          {/* Feature boxes */}
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((f, i) => {
              const cardRef = useScrollReveal({ delay: i * 100 });
              return (
                <div key={f.title} ref={cardRef} className="reveal group feature-story-card bg-white rounded-2xl p-7 text-center hover:shadow-xl hover:-translate-y-1 motion-safe:transition-all motion-safe:duration-300 border border-primary-200/30">
                  <div className="feature-story-shine" />
                  <div className="feature-story-aura" />
                  <div
                    className="w-14 h-14 rounded-2xl mx-auto mb-5 flex items-center justify-center motion-safe:transition-colors motion-safe:duration-300 group-hover:scale-110 feature-story-icon"
                    style={{ color: '#B8860B', backgroundColor: 'rgba(212,165,40,0.08)' }}
                  >
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={f.icon} />
                    </svg>
                  </div>
                  <h4 className="font-bold text-brand-brown mb-3 text-lg">{f.title}</h4>
                  <p className="text-sm leading-7 text-[#6d3028] font-medium max-w-[15rem] mx-auto">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────── Products ─────────────────────── */
function Products() {
  const lightbox = useLightbox();
  const products = [
    { name: 'Nogatu Barley Juice', desc: 'Pure Energy & Naturally Refreshing', price: '850.00', img: '/legacy-img/Barley-Mix.png', imgLg: '/legacy-img/Barley-Mix.png' },
    { name: 'Nogatu Glow', desc: 'L-Reduced Glutathione', price: '550.00', img: '/legacy-img/Glow-Pill.png', imgLg: '/legacy-img/Glow-Pill.png' },
    { name: 'Nogatu Collagen Vitamin C', desc: 'Vitamin C with Collagen', price: '500.00', img: '/legacy-img/Vitamin-C-Collagen.png', imgLg: '/legacy-img/Vitamin-C-Collagen.png' },
    { name: 'Chocolate Drink Mix', desc: 'Healthy Chocolate with Herbal & Vegetable Mix', price: '710.00', img: '/legacy-img/Chox-Mix.png', imgLg: '/legacy-img/Chox-Mix.png' },
    { name: 'Nogatu Coffee Mix', desc: 'Herbal Coffee Mix for Immunity & Energy', price: '495.00', img: '/legacy-img/Coffee-Mix.png', imgLg: '/legacy-img/Coffee-Mix.png' },
    { name: 'Mangosteen Coffee Mix', desc: 'Coffee Drink Mix', price: '375.00', img: '/legacy-img/Mangoosteen_1.png', imgLg: '/legacy-img/Mangoosteen_1.png' },
    { name: 'Vitamin C', desc: 'Vitamin supplement', price: 'TBA', img: '/legacy-img/Vitamin-C.png', imgLg: '/legacy-img/Vitamin-C.png' },
    { name: 'Black Coffee', desc: 'Premium black coffee drink mix', price: 'TBA', img: '/legacy-img/blck-coffee.png', imgLg: '/legacy-img/blck-coffee.png' },
    { name: 'Max Fuel Coffee Drink Mix', desc: 'Max fuel coffee blend', price: 'TBA', img: '/legacy-img/Max-Fuel.png', imgLg: '/legacy-img/Max-Fuel.png' },
    { name: 'Berry NAD+', desc: 'Berry NAD+ wellness supplement', price: 'TBA', img: '/legacy-img/Berry-Nad.png', imgLg: '/legacy-img/Berry-Nad.png' },
  ];

  return (
    <section className="section-padding relative overflow-hidden" style={{ background: '#FFFDF5' }}>
      {/* Geo pattern */}
      <div className="absolute inset-0 pointer-events-none bg-geo-pattern" />
      <div className="absolute inset-0 pointer-events-none product-lineup-wash" />
      <div className="section-container relative z-10">
        <SectionHeader badge="Products" title="Our Line-up" />
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
          {products.map((p, i) => {
            const ref = useScrollReveal({ delay: i * 80 });
            return (
              <div key={p.name} ref={ref} className="reveal group text-center product-lineup-card">
                <div
                  className="relative overflow-hidden rounded-[1.75rem] p-4 sm:p-8 flex items-center justify-center h-44 sm:h-56 mb-4 cursor-pointer border border-primary-200/30 motion-safe:transition-all motion-safe:duration-500 group-hover:shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #FFFDF5, #FFF8E1)' }}
                  onClick={() => p.imgLg && lightbox.open(p.imgLg)}
                >
                  <div className="product-card-ambient product-card-ambient-left" />
                  <div className="product-card-ambient product-card-ambient-right" />
                  <div className="product-card-sheen" />
                  <div className="product-card-grid" />
                  {p.placeholder ? (
                    <div className="w-full h-full rounded-xl border-2 border-dashed border-brand-gold/35 bg-white/45 flex flex-col items-center justify-center text-brand-brown">
                      <svg className="w-10 h-10 text-brand-gold-dark mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      <span className="text-sm font-semibold">Image Slot</span>
                    </div>
                  ) : (
                    <img
                      src={p.imgLg}
                      alt={p.name}
                      className="relative z-10 max-h-44 object-contain group-hover:scale-110 motion-safe:transition-transform motion-safe:duration-500 product-card-image"
                      loading="lazy"
                    />
                  )}
                  <div className="product-card-badge">Wellness Pick</div>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 motion-safe:transition-colors motion-safe:duration-300 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 motion-safe:transition-opacity motion-safe:duration-300 w-10 h-10 rounded-full bg-white/80 flex items-center justify-center shadow-md">
                      <svg className="w-5 h-5 text-brand-gold-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                    </div>
                  </div>
                </div>
                <h4 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">{p.name}</h4>
                <p className="text-xs sm:text-sm text-gray-500 mb-1">{p.desc}</p>
                <p className="text-lg font-bold text-brand-gold-dark">{p.price === 'TBA' ? p.price : `Php ${p.price}`}</p>
              </div>
            );
          })}
        </div>
      </div>
      <Lightbox src={lightbox.src} type={lightbox.type} onClose={lightbox.close} />
    </section>
  );
}

/* ────────────────────── Organizations Preview ───────────── */
function OrganizationsPreview() {
  const ref = useScrollReveal();

  const OrgNode = ({ top, left, hc, bc }) => (
    <div className="absolute flex flex-col items-center -translate-x-1/2 z-10" style={{ top: `${top}px`, left: `${left}%` }}>
      <div className={`w-[18px] h-[18px] sm:w-[22px] sm:h-[22px] rounded-full shadow-[inset_0_-2px_4px_rgba(0,0,0,0.3)] mb-1 border border-white/40 bg-gradient-to-b ${hc}`} />
      <div className={`w-10 h-7 sm:w-12 sm:h-8 rounded-t-xl rounded-b shadow-[0_4px_6px_rgba(0,0,0,0.2),inset_0_-3px_5px_rgba(0,0,0,0.2)] border border-black/10 bg-gradient-to-b ${bc}`} />
    </div>
  );

  return (
    <section className="section-padding relative overflow-hidden bg-white">
      {/* Minimalist Backgound Pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]">
         <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,1)_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      <div className="section-container relative z-10">
        <SectionHeader badge="People" title="People Behind the Company" />
        
        <div ref={ref} className="reveal max-w-4xl mx-auto text-center">
            <p className="text-gray-600 leading-relaxed mb-12">
            Meet the key leaders and important people behind NOGATU Alliance who guide the company, support the network, and help move the community forward.
          </p>

          <div className="relative p-6 sm:p-10 rounded-[2rem] bg-gray-50 border border-gray-100 shadow-sm overflow-hidden group hover:shadow-md transition-shadow duration-500">
            <div className="flex flex-col items-center justify-center opacity-90 group-hover:opacity-100 transition-opacity duration-500 overflow-x-auto pb-6 w-full">
               
               {/* Fixed-dimension container allows perfect positional scaling */}
               <div className="min-w-[400px] w-full max-w-[650px] mx-auto h-[350px] relative mt-2">
                 
                 {/* ─── LINES ────────── */}
                 {/* L1 to L2 */}
                 <div className="absolute w-[2px] bg-brand-brown" style={{ top: '50px', left: '50%', height: '20px' }} />
                 <div className="absolute h-[2px] bg-brand-brown" style={{ top: '70px', left: '20%', width: '60%' }} />
                 <div className="absolute w-[2px] bg-brand-brown" style={{ top: '70px', left: '20%', height: '25px' }} />
                 <div className="absolute w-[2px] bg-brand-brown" style={{ top: '70px', left: '50%', height: '25px' }} />
                 <div className="absolute w-[2px] bg-brand-brown" style={{ top: '70px', left: '80%', height: '25px' }} />

                 {/* L2 to L3 */}
                 <div className="absolute w-[2px] bg-brand-brown" style={{ top: '145px', left: '50%', height: '20px' }} />
                 <div className="absolute h-[2px] bg-brand-brown" style={{ top: '165px', left: '10%', width: '80%' }} />
                 <div className="absolute w-[2px] bg-brand-brown" style={{ top: '165px', left: '10%', height: '25px' }} />
                 <div className="absolute w-[2px] bg-brand-brown" style={{ top: '165px', left: '30%', height: '25px' }} />
                 <div className="absolute w-[2px] bg-brand-brown" style={{ top: '165px', left: '50%', height: '25px' }} />
                 <div className="absolute w-[2px] bg-brand-brown" style={{ top: '165px', left: '70%', height: '25px' }} />
                 <div className="absolute w-[2px] bg-brand-brown" style={{ top: '165px', left: '90%', height: '25px' }} />

                 {/* L3 to L4 */}
                 <div className="absolute w-[2px] bg-brand-brown" style={{ top: '240px', left: '10%', height: '20px' }} />
                 <div className="absolute w-[2px] bg-brand-brown" style={{ top: '240px', left: '30%', height: '20px' }} />
                 <div className="absolute w-[2px] bg-brand-brown" style={{ top: '240px', left: '50%', height: '20px' }} />
                 <div className="absolute w-[2px] bg-brand-brown" style={{ top: '240px', left: '70%', height: '20px' }} />
                 <div className="absolute w-[2px] bg-brand-brown" style={{ top: '240px', left: '90%', height: '20px' }} />

                 <div className="absolute h-[2px] bg-brand-brown" style={{ top: '260px', left: '10%', width: '80%' }} />

                 <div className="absolute w-[2px] bg-brand-brown" style={{ top: '260px', left: '10%', height: '25px' }} />
                 <div className="absolute w-[2px] bg-brand-brown" style={{ top: '260px', left: '30%', height: '25px' }} />
                 <div className="absolute w-[2px] bg-brand-brown" style={{ top: '260px', left: '50%', height: '25px' }} />
                 <div className="absolute w-[2px] bg-brand-brown" style={{ top: '260px', left: '70%', height: '25px' }} />
                 <div className="absolute w-[2px] bg-brand-brown" style={{ top: '260px', left: '90%', height: '25px' }} />

                 {/* ─── NODES ────────── */}
                 {/* L1 */}
                 <OrgNode top={0} left={50} hc="from-brand-gold to-brand-gold-dark" bc="from-gold-300 to-brand-gold" />
                 
                 {/* L2 */}
                 <OrgNode top={95} left={20} hc="from-brand-brown-light to-brand-brown-dark" bc="from-brand-brown to-brand-brown-dark" />
                 <OrgNode top={95} left={50} hc="from-brand-gold to-brand-gold-dark" bc="from-gold-300 to-brand-gold" />
                 <OrgNode top={95} left={80} hc="from-brand-brown-light to-brand-brown-dark" bc="from-brand-brown to-brand-brown-dark" />

                 {/* L3 */}
                 <OrgNode top={190} left={10} hc="from-brand-gold to-brand-gold-dark" bc="from-gold-300 to-brand-gold" />
                 <OrgNode top={190} left={30} hc="from-brand-brown-light to-brand-brown-dark" bc="from-brand-brown to-brand-brown-dark" />
                 <OrgNode top={190} left={50} hc="from-brand-gold to-brand-gold-dark" bc="from-gold-300 to-brand-gold" />
                 <OrgNode top={190} left={70} hc="from-brand-brown-light to-brand-brown-dark" bc="from-brand-brown to-brand-brown-dark" />
                 <OrgNode top={190} left={90} hc="from-brand-gold to-brand-gold-dark" bc="from-gold-300 to-brand-gold" />

                 {/* L4 */}
                 <OrgNode top={285} left={10} hc="from-brand-brown-light to-brand-brown-dark" bc="from-brand-brown to-brand-brown-dark" />
                 <OrgNode top={285} left={30} hc="from-brand-gold to-brand-gold-dark" bc="from-gold-300 to-brand-gold" />
                 <OrgNode top={285} left={50} hc="from-brand-brown-light to-brand-brown-dark" bc="from-brand-brown to-brand-brown-dark" />
                 <OrgNode top={285} left={70} hc="from-brand-gold to-brand-gold-dark" bc="from-gold-300 to-brand-gold" />
                 <OrgNode top={285} left={90} hc="from-brand-brown-light to-brand-brown-dark" bc="from-brand-brown to-brand-brown-dark" />
               </div>
               
               <div className="mt-8 relative z-20">
                 <NavLink to="/organizations" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-white border border-gray-200 text-brand-brown font-semibold shadow-sm hover:shadow-md hover:border-brand-gold/40 transition-all duration-300">
                   View People Behind the Company
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                 </NavLink>
               </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ────────────────────── Business Opps Preview ────────────── */
function BusinessPreview() {
  const ref = useScrollReveal();
  return (
    <section className="section-padding relative overflow-hidden bg-center bg-cover" style={{ backgroundImage: 'linear-gradient(rgba(255, 253, 245, 0.95), rgba(255, 253, 245, 0.95)), url(/img/landing-bg-clean.png)' }}>
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-[#D4A528] to-transparent opacity-50" />
      <div className="absolute top-10 left-10 w-32 h-32 border-[3px] border-[#D4A528]/20 rounded-full border-dashed rotate-12 motion-safe:animate-spin-slow pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-24 h-24 border-[3px] border-[#B8860B]/20 rounded-full border-dashed -rotate-6 motion-safe:animate-spin-slow pointer-events-none" />
      
      <div ref={ref} className="reveal section-container text-center relative z-10 max-w-[1000px] mx-auto">
        <div className="bg-white rounded-[2.5rem] p-10 md:p-16 shadow-[0_20px_50px_rgba(184,134,11,0.15)] border border-[#D4A528]/20 relative overflow-hidden group">
          {/* Inner card gradient highlight */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-[#D4A528] to-transparent opacity-10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none transition-opacity duration-700 group-hover:opacity-20" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-gradient-to-tr from-[#B8860B] to-transparent opacity-5 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none transition-opacity duration-700 group-hover:opacity-15" />
          
          <div className="relative z-10">
            <span className="inline-block px-5 py-2 rounded-full bg-[#FFF8E1] text-[#B8860B] border border-[#B8860B]/20 text-xs md:text-sm font-bold tracking-widest uppercase mb-6 shadow-sm">
              Business Opportunities
            </span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-[#3A1000] tracking-tight mb-6 leading-tight">
              Ready to Start Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#B8860B] to-[#D4A528] drop-shadow-sm">Journey?</span>
            </h2>
            <p className="text-[#6d3028] text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
              Join thousands of members building healthier lives and sustainable income with NOGATU Alliance.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
              <a href="/portal/login" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-10 py-4 rounded-xl text-white font-bold text-lg hover:-translate-y-1 transition-all duration-300 shadow-[0_8px_20px_rgba(184,134,11,0.4)] hover:shadow-[0_12px_25px_rgba(184,134,11,0.6)]" style={{ background: 'linear-gradient(135deg, #B8860B, #D4A528)' }}>
                Join Now
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              </a>
              <NavLink to="/products#packages" className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 rounded-xl text-[#B8860B] font-bold text-lg border-2 border-[#D4A528]/30 hover:border-[#D4A528] hover:bg-[#FFF8E1] transition-all duration-300">
                View Business Plans &rarr;
              </NavLink>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ────────────────────── Section Header ───────────────────── */
function DownloadableMaterials() {
  const ref = useScrollReveal();
  const materials = [
    { title: 'ODF Product Presentation', desc: 'Presentation deck placeholder for product education and distributor orientation.' },
    { title: 'PDF Brochures', desc: 'Brochure upload space for product details, benefits, and customer-facing information.' },
    { title: 'Marketing Collateral', desc: 'Flyers, social posts, and campaign materials for field marketing support.' },
  ];

  return (
    <section id="downloadable-materials" className="section-padding relative overflow-hidden bg-white scroll-mt-28">
      <div className="section-container">
        <SectionHeader badge="Resources" title="Downloadable Materials" />
        <div ref={ref} className="reveal grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {materials.map((item) => (
            <div key={item.title} className="rounded-2xl border border-primary-200/40 bg-[#FFFDF5] p-4 sm:p-7">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-brand-gold/10 text-brand-gold-dark flex items-center justify-center mb-4 sm:mb-5">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0119 9.414V19a2 2 0 01-2 2z" /></svg>
              </div>
              <h3 className="font-bold text-brand-brown mb-2 text-sm sm:text-base">{item.title}</h3>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-4 sm:mb-5">{item.desc}</p>
              <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-brand-gold/10 text-brand-gold-dark border border-brand-gold/20">Upload pending</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ApplicationForm() {
  const [form, setForm] = useState({ name: '', phone: '', email: '', letterOfIntent: null });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [showApplicationPrompt, setShowApplicationPrompt] = useState(false);
  const ref = useScrollReveal();
  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  async function submitApplication(e) {
    e.preventDefault();
    setSubmitting(true);
    setStatus({ type: '', message: '' });
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        body: (() => {
          const payload = new FormData();
          payload.append('name', form.name);
          payload.append('phone', form.phone);
          payload.append('email', form.email);
          if (form.letterOfIntent) {
            payload.append('letter_of_intent', form.letterOfIntent);
          }
          return payload;
        })(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unable to submit application.');
      setForm({ name: '', phone: '', email: '', letterOfIntent: null });
      setShowApplicationPrompt(true);
      setStatus({ type: 'success', message: data.message || 'Distributor application interest submitted.' });
    } catch (err) {
      setStatus({ type: 'error', message: err.message || 'Unable to submit application.' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section id="stockist-apply" className="section-padding relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #fff8e8 0%, #fffdf5 38%, #f6ecdc 100%)' }}>
      <div className="absolute inset-0 pointer-events-none bg-diagonal-lines opacity-40" />
      <div className="absolute -left-20 top-10 h-64 w-64 rounded-full bg-[#D4A528]/15 blur-3xl pointer-events-none" />
      <div className="absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-[#592219]/12 blur-3xl pointer-events-none" />
      <div className="section-container">
        <SectionHeader badge="Stockist Application" title="Apply as a Nogatu Stockist" />
        <div ref={ref} className="reveal grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          <div className="relative overflow-hidden rounded-[2rem] border border-[#D4A528]/20 bg-[linear-gradient(145deg,#2f1408_0%,#592219_45%,#6d3028_100%)] p-8 text-white shadow-[0_30px_70px_rgba(89,34,25,0.28)]">
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_left,rgba(255,223,136,0.18),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.08),transparent_26%)]" />
            <div className="relative z-10">
              <p className="inline-flex rounded-full border border-[#D4A528]/25 bg-white/10 px-4 py-1 text-[11px] font-bold uppercase tracking-[0.28em] text-[#FDE68A]">
                First Step
              </p>
              <h3 className="mt-5 text-3xl font-black leading-tight">Stockists now apply here before accessing the Dropshipping portal.</h3>
              <p className="mt-4 max-w-lg text-sm leading-7 text-white/75">
                Submit your contact details first. The Nogatu team will review your interest, follow up on your stockist onboarding, and guide you through the next approval steps.
              </p>
              <div className="mt-7 grid gap-3 text-sm text-white/78">
                <div className="flex gap-3 rounded-2xl border border-white/10 bg-black/10 px-4 py-3">
                  <span className="text-[#FDE68A] font-bold">01</span>
                  <span>Send your full name, active mobile number, email address, and signed letter of intent.</span>
                </div>
                <div className="flex gap-3 rounded-2xl border border-white/10 bg-black/10 px-4 py-3">
                  <span className="text-[#FDE68A] font-bold">02</span>
                  <span>Our team checks the application queue and contacts qualified applicants.</span>
                </div>
                <div className="flex gap-3 rounded-2xl border border-white/10 bg-black/10 px-4 py-3">
                  <span className="text-[#FDE68A] font-bold">03</span>
                  <span>After approval, you can proceed with the stockist setup and portal access.</span>
                </div>
              </div>
              <div className="mt-7 rounded-2xl border border-[#D4A528]/20 bg-black/15 px-5 py-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#FDE68A]/85">Important</p>
                <p className="mt-2 text-sm leading-6 text-white/70">
                  Re-application is limited for 30 days from the latest submission so the queue stays clean and the team can follow up properly.
                </p>
              </div>
            </div>
          </div>
          <form onSubmit={submitApplication} className="rounded-[2rem] border border-[#D4A528]/20 bg-[linear-gradient(180deg,rgba(255,255,255,0.88)_0%,rgba(255,250,239,0.96)_100%)] p-6 sm:p-8 shadow-[0_24px_60px_rgba(184,134,11,0.12)] space-y-5">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#B8860B]">Nogatu Alliance</p>
              <h3 className="mt-2 text-2xl font-black text-[#3A1000]">Stockist Application Intake</h3>
              <p className="mt-2 text-sm leading-6 text-[#6d3028]">
                Use the same brown-and-gold Nogatu member experience to start your stockist application.
              </p>
            </div>
            {[
              { key: 'name', label: 'Full Name', type: 'text', placeholder: 'Enter your full legal name' },
              { key: 'phone', label: 'Contact Number', type: 'tel', placeholder: '09XX XXX XXXX' },
              { key: 'email', label: 'Email Address', type: 'email', placeholder: 'you@example.com' },
            ].map((field) => (
              <label key={field.key} className="block">
                <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.22em] text-[#8C6A19]">{field.label}</span>
                <input
                  type={field.type}
                  value={form[field.key]}
                  onChange={(e) => updateField(field.key, e.target.value)}
                  required
                  placeholder={field.placeholder}
                  className="w-full rounded-2xl border border-[#D4A528]/18 bg-white/80 px-4 py-3.5 text-sm text-[#2f1408] outline-none transition-all duration-300 placeholder:text-[#8c715b]/70 focus:border-[#B8860B] focus:ring-4 focus:ring-[#D4A528]/15"
                />
              </label>
            ))}
            <label className="block">
              <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.22em] text-[#8C6A19]">Letter of Intent</span>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
                required
                onChange={(e) => updateField('letterOfIntent', e.target.files?.[0] || null)}
                className="w-full rounded-2xl border border-[#D4A528]/18 bg-white/80 px-4 py-3.5 text-sm text-[#2f1408] outline-none transition-all duration-300 file:mr-4 file:rounded-xl file:border-0 file:bg-[#D4A528]/12 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#7a5608] focus:border-[#B8860B] focus:ring-4 focus:ring-[#D4A528]/15"
              />
              <p className="mt-2 text-xs leading-5 text-[#7d6553]">
                Required. Accepted formats: PDF, DOC, DOCX, JPG, PNG, or WEBP. Maximum file size: 5MB.
              </p>
            </label>
            {status.message && (
              <div className={`rounded-2xl px-4 py-3 text-sm ${status.type === 'success' ? 'border border-emerald-200 bg-emerald-50 text-emerald-700' : 'border border-red-200 bg-red-50 text-red-700'}`}>
                {status.message}
              </div>
            )}
            <button type="submit" disabled={submitting} className="w-full inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-bold text-white transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-60" style={{ background: 'linear-gradient(135deg, #B8860B 0%, #D4A528 55%, #E7C679 100%)', boxShadow: '0 14px 32px rgba(184,134,11,0.28)' }}>
              {submitting ? 'Submitting application...' : 'Submit Stockist Application'}
            </button>
            <p className="text-center text-xs leading-5 text-[#7d6553]">
              This form records your interest together with your required letter of intent. A Nogatu representative will guide you through the next stockist requirements.
            </p>
          </form>
        </div>
      </div>
      {showApplicationPrompt && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="max-w-lg w-full overflow-hidden rounded-[2rem] border border-[#D4A528]/25 bg-[linear-gradient(180deg,#fffdf7_0%,#fff5df_100%)] p-7 shadow-[0_30px_80px_rgba(58,16,0,0.28)]">
            <div className="w-14 h-14 rounded-2xl bg-[#D4A528]/12 text-[#B8860B] flex items-center justify-center mb-5">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0119 9.414V19a2 2 0 01-2 2z" /></svg>
            </div>
            <h3 className="text-2xl font-black text-[#3A1000] mb-3">Stockist Application Received</h3>
            <p className="text-[#6d3028] leading-relaxed">
              Your details have been recorded in the Nogatu stockist queue. Please wait for the team to contact you for the next onboarding steps and approval checks.
            </p>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <a href="/portal/login" className="btn-landing-primary w-full">
                Open Members Area
              </a>
              <button onClick={() => setShowApplicationPrompt(false)} className="btn-landing-secondary w-full">
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function CertificationsPreview() {
  const ref = useScrollReveal();
  return (
    <section className="section-padding bg-diagonal-lines" style={{ backgroundColor: '#FFF8E1' }}>
      <div className="section-container">
        <SectionHeader badge="Compliance" title="Certifications" />
        <div ref={ref} className="reveal grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {['Product Standards', 'Quality Certification', 'Regulatory Documents'].map((title) => (
            <div key={title} className="rounded-2xl border border-brand-gold/20 bg-white/75 p-5 sm:p-8 text-center">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl mx-auto mb-4 sm:mb-5 bg-brand-gold/10 text-brand-gold-dark flex items-center justify-center">
                <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              </div>
              <h3 className="font-bold text-brand-brown mb-2 text-sm sm:text-base">{title}</h3>
              <p className="text-xs sm:text-sm text-gray-600">Placeholder for certification uploads and product standard verification.</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SectionHeader({ badge, title }) {
  const ref = useScrollReveal();
  return (
    <div ref={ref} className="reveal text-center mb-14 lg:mb-16">
      {badge && (
        <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase mb-4" style={{ backgroundColor: 'rgba(212,165,40,0.1)', color: '#B8860B' }}>
          {badge}
        </span>
      )}
      <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-balance text-gray-900">
        {title}
      </h2>
      <div className="mt-4 w-16 h-1 rounded-full mx-auto" style={{ background: 'linear-gradient(90deg, #B8860B, #D4A528)' }} />
    </div>
  );
}

/* ────────────────────────── Page ─────────────────────────── */
export default function Home() {
  return (
    <>
      <Hero />
      <StatsBar />
      <AboutPreview />
      <WhyUs />
      <Products />
      <OrganizationsPreview />
      <DownloadableMaterials />
      <ApplicationForm />
      <CertificationsPreview />
      <BusinessPreview />
    </>
  );
}
