import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useScrollReveal, useCountUp } from '../hooks/useScrollReveal';
import Lightbox, { useLightbox } from '../components/Lightbox';

/* ────────────────────────── Hero (NogatuDrop-style with BG image) ────────────────────────── */
function Hero() {
  return (
    <section
      className="relative min-h-screen flex items-center overflow-hidden"
      style={{
        backgroundImage: 'url(/img/hero-landing-bg.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Warm gold overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-transparent pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-28 pb-16">
        <div className="min-h-[68vh] flex items-end">
          <div className="pb-6 sm:pb-10 motion-safe:animate-fade-up">
            <h1 className="text-[clamp(2rem,4.5vw,3.6rem)] font-extrabold leading-[1.1] tracking-tight text-white mb-4 drop-shadow-lg">
              Enjoy Our Healthy<br />
              <span className="text-brand-gold-light">&amp; Wealthy Lifestyle</span>
            </h1>
            <p className="mb-6 text-white/80 text-base sm:text-lg font-medium max-w-md">
              Wellness You Can Taste, Quality You Can Trust.
            </p>
            <a
              href="/portal/login"
              className="inline-block px-7 sm:px-10 py-2.5 sm:py-3 text-white text-[clamp(1.1rem,1.8vw,1.6rem)] font-semibold rounded-full motion-safe:transition-all motion-safe:duration-300 border border-brand-gold-dark shadow-lg shadow-amber-900/30 leading-none hover:scale-105 hover:shadow-xl"
              style={{ background: 'linear-gradient(135deg, #B8860B 0%, #D4A528 50%, #E7C679 100%)' }}
            >
              Be the One. Register Now!
            </a>
            <div className="mt-5 flex items-center gap-2 text-white/70">
              <svg className="w-5 h-5 text-brand-gold-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-[clamp(1rem,1.5vw,1.25rem)] font-medium leading-none">FDA Approved Products</span>
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
          <p className="text-3xl lg:text-4xl font-extrabold text-brand-yellow-light">6</p>
          <p className="text-sm text-white/60 mt-1 font-medium">Product Lines</p>
        </div>
        <div>
          <p className="text-3xl lg:text-4xl font-extrabold text-brand-yellow-light">99%</p>
          <p className="text-sm text-white/60 mt-1 font-medium">Member Satisfaction</p>
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
            <div className="relative">
              <img
                src="/landing/assets/img/about.jpg"
                alt="About NOGATU Alliance"
                className="rounded-2xl shadow-xl w-full object-cover cursor-pointer hover:shadow-2xl motion-safe:transition-shadow motion-safe:duration-300 border border-primary-200/30"
                onClick={() => lightbox.open('/landing/assets/img/about.jpg')}
                loading="lazy"
              />
              {/* Accent badge */}
              <div className="absolute -bottom-4 -right-4 rounded-2xl px-5 py-3 shadow-xl" style={{ background: 'linear-gradient(135deg, #B8860B, #D4A528)' }}>
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
            <div className="relative inline-block">
              <img
                src="/landing/img/about-2.jpg"
                alt="NOGATU Products"
                className="rounded-xl shadow-lg w-full max-w-sm object-cover cursor-pointer border border-primary-200/30"
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
                <div key={f.title} ref={cardRef} className="reveal group bg-white rounded-2xl p-7 text-center hover:shadow-xl hover:-translate-y-1 motion-safe:transition-all motion-safe:duration-300 border border-primary-200/30">
                  <div
                    className="w-14 h-14 rounded-2xl mx-auto mb-5 flex items-center justify-center motion-safe:transition-colors motion-safe:duration-300 group-hover:scale-110"
                    style={{ color: '#B8860B', backgroundColor: 'rgba(212,165,40,0.08)' }}
                  >
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={f.icon} />
                    </svg>
                  </div>
                  <h4 className="font-bold text-gray-900 mb-2">{f.title}</h4>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
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
    { name: 'Nogatu Barley Juice', desc: 'Pure Energy & Naturally Refreshing', price: '850.00', img: '/landing/img/menu-item-1.png', imgLg: '/landing/img/menu-item-1.png' },
    { name: 'Nogatu Glow', desc: 'L-Reduced Glutathione', price: '550.00', img: '/landing/img/menu-item-2.png', imgLg: '/landing/img/menu-item-2.png' },
    { name: 'Nogatu Collagen Vitamin C', desc: 'Vitamin C with Collagen & Clu', price: '500.00', img: '/landing/img/menu-item-3.png', imgLg: '/landing/img/menu-item-3.png' },
    { name: 'Chocolate Drink Mix', desc: 'Healthy Chocolate with Herbal & Vegetable Mix', price: '710.00', img: '/landing/img/menu-item-4.png', imgLg: '/landing/img/menu-item-4.png' },
    { name: 'Nogatu Coffee Mix', desc: 'Herbal Coffee Mix for Immunity & Energy', price: '495.00', img: '/landing/img/menu-item-5.png', imgLg: '/landing/img/menu-item-5.png' },
    { name: 'Mangosteen Coffee Mix', desc: 'Coffee Drink Mix', price: '375.00', img: '/landing/img/menu-item-6.png', imgLg: '/landing/img/menu-item-6.png' },
  ];

  return (
    <section className="section-padding relative overflow-hidden" style={{ background: '#FFFDF5' }}>
      {/* Geo pattern */}
      <div className="absolute inset-0 pointer-events-none bg-geo-pattern" />
      <div className="section-container relative z-10">
        <SectionHeader badge="Our Products" title="Healthy & Wealthy Options" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((p, i) => {
            const ref = useScrollReveal({ delay: i * 80 });
            return (
              <div key={p.name} ref={ref} className="reveal group text-center">
                <div
                  className="relative overflow-hidden rounded-2xl p-8 flex items-center justify-center h-56 mb-4 cursor-pointer border border-primary-200/30 motion-safe:transition-all motion-safe:duration-300 group-hover:shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #FFFDF5, #FFF8E1)' }}
                  onClick={() => lightbox.open(p.imgLg)}
                >
                  <img
                    src={p.imgLg}
                    alt={p.name}
                    className="max-h-44 object-contain group-hover:scale-110 motion-safe:transition-transform motion-safe:duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 motion-safe:transition-colors motion-safe:duration-300 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 motion-safe:transition-opacity motion-safe:duration-300 w-10 h-10 rounded-full bg-white/80 flex items-center justify-center shadow-md">
                      <svg className="w-5 h-5 text-brand-gold-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                    </div>
                  </div>
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">{p.name}</h4>
                <p className="text-sm text-gray-500 mb-1">{p.desc}</p>
                <p className="text-lg font-bold text-brand-gold-dark">Php {p.price}</p>
              </div>
            );
          })}
        </div>
      </div>
      <Lightbox src={lightbox.src} type={lightbox.type} onClose={lightbox.close} />
    </section>
  );
}

/* ────────────────────── Business Opps Preview ────────────── */
function BusinessPreview() {
  const ref = useScrollReveal();
  return (
    <section className="section-padding relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #3A1000 0%, #592219 50%, #3A1000 100%)' }}>
      {/* Floating shapes */}
      <div className="absolute top-10 left-10 w-32 h-32 border border-brand-gold/10 rounded-2xl rotate-12 motion-safe:animate-float-slow pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-24 h-24 border border-brand-gold/10 rounded-xl -rotate-6 motion-safe:animate-float-reverse pointer-events-none" />
      <div className="absolute top-1/2 left-1/4 w-16 h-16 border border-brand-gold/5 rounded-full motion-safe:animate-float pointer-events-none" />
      {/* Dot pattern */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'radial-gradient(circle, rgba(212,165,40,0.06) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
      }} />

      <div ref={ref} className="reveal section-container text-center relative z-10">
        <span className="inline-block px-4 py-1.5 rounded-full bg-brand-gold/15 text-brand-gold-light text-xs font-semibold tracking-wider uppercase mb-4 border border-brand-gold/20">Business Opportunities</span>
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-4">
          Ready to Start Your <span className="text-brand-gold-light">Journey?</span>
        </h2>
        <p className="text-white/50 text-lg max-w-xl mx-auto mb-10">
          Join thousands of members building healthier lives and sustainable income with NOGATU Alliance.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a href="/portal/login" className="btn-landing-primary text-base px-9 py-4">
            Join Now
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
          </a>
          <NavLink to="/opportunities" className="text-white/50 hover:text-brand-gold-light text-sm font-medium motion-safe:transition-colors">
            View Business Plans &rarr;
          </NavLink>
        </div>
      </div>
    </section>
  );
}

/* ────────────────────── Section Header ───────────────────── */
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
      <BusinessPreview />
    </>
  );
}
