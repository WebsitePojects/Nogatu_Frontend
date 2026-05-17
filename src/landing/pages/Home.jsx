import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useScrollReveal, useCountUp } from '../hooks/useScrollReveal';
import Lightbox, { useLightbox } from '../components/Lightbox';

const CERTIFICATIONS_PDF_PATH = '/docs/NOGATU-PRODUCTS-CPR-AND-HALAL-CERTS.-POWDERED-CAPSULES.pdf';

/* ────────────────────────── Hero (NogatuDrop-style with BG image) ────────────────────────── */
function Hero() {
  const heroSlides = [
    {
      image: '/img/landing-product.png',
      alt: 'Nogatu Alliance full product lineup',
      eyebrow: 'Featured Collection',
      title: 'Healthy essentials in one complete line-up',
      description: 'A premium showcase of the NOGATU wellness collection for first-time visitors.',
    },
    {
      image: '/img/BerryNad_Market.png',
      alt: 'Berry NAD+ product feature',
      eyebrow: 'New Product',
      title: 'Berry NAD+ now in the spotlight',
      description: 'A dedicated hero slide that highlights Berry NAD+ before the carousel loops back to the full catalog.',
    },
  ];
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % heroSlides.length);
    }, 5000);

    return () => window.clearInterval(interval);
  }, [heroSlides.length]);

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
        <div className="min-h-[calc(100svh-120px)] lg:min-h-[78vh] flex flex-col lg:flex-row gap-6 lg:gap-8 items-center justify-between">
          <div className="order-2 lg:order-1 w-full lg:w-[38%] pb-4 lg:pb-0 mt-auto motion-safe:animate-fade-up text-left z-20 flex flex-col items-start">
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
              className="mt-3 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5"
              style={{
                border: '1px solid rgba(255,255,255,0.42)',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.18), rgba(212,165,40,0.16))',
                boxShadow: '0 10px 28px rgba(89,34,25,0.18), inset 0 1px 0 rgba(255,255,255,0.32)',
              }}
            >
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/25 bg-white/15">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" />
                </svg>
              </span>
              Become a Distributor
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

          <div className="order-1 lg:order-2 w-full lg:w-[62%] flex justify-center lg:justify-end motion-safe:animate-fade-up z-10 mt-0 sm:mt-8 lg:mt-0 flex-1 lg:flex-none items-center">
            <div className="hero-carousel-shell relative w-full max-w-[600px] sm:max-w-[760px] lg:max-w-[1080px] xl:max-w-[1240px] mx-auto lg:mx-0">
              <div className="hero-carousel-card">
                <div className="hero-carousel-stage">
                  <span className={`hero-carousel-eyebrow ${activeSlide === 1 ? 'is-lower' : 'is-upper'}`}>
                    {heroSlides[activeSlide].eyebrow}
                  </span>
                  <div className="hero-carousel-glow" />
                  <div className="hero-carousel-floor" />

                  {heroSlides.map((slide, index) => (
                    <img
                      key={slide.image}
                      src={slide.image}
                      alt={slide.alt}
                      className={`hero-carousel-image ${index === activeSlide ? 'is-active' : 'is-hidden'} ${index === 0 ? 'is-collection' : 'is-single-product'}`}
                    />
                  ))}

                  <div className="hero-carousel-indicators" aria-hidden="true">
                    {heroSlides.map((slide, index) => (
                      <span
                        key={slide.image}
                        className={`hero-carousel-dot ${index === activeSlide ? 'is-active' : ''}`}
                      />
                    ))}
                  </div>

                </div>
              </div>
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
    { name: 'Vitamin C with Collagen & Glutathione', desc: 'Radiance and antioxidant support formula', price: '500.00', img: '/legacy-img/Vitamin-C-Collagen.png', imgLg: '/legacy-img/Vitamin-C-Collagen.png' },
    { name: 'Chocolate Drink Mix', desc: 'Healthy Chocolate with Herbal & Vegetable Mix', price: '710.00', img: '/legacy-img/Chox-Mix.png', imgLg: '/legacy-img/Chox-Mix.png' },
    { name: 'Nogatu Coffee Mix', desc: 'Herbal Coffee Mix for Immunity & Energy', price: '495.00', img: '/legacy-img/Coffee-Mix.png', imgLg: '/legacy-img/Coffee-Mix.png' },
    { name: 'Mangosteen Coffee Mix', desc: 'Coffee Drink Mix', price: '375.00', img: '/legacy-img/Mangoosteen_1.png', imgLg: '/legacy-img/Mangoosteen_1.png' },
    { name: 'Vitamin C with Zinc & Mangosteen', desc: 'Vitamin support blend with mangosteen extract', price: '580.00', img: '/legacy-img/Vitamin-C.png', imgLg: '/legacy-img/Vitamin-C.png' },
    { name: 'Nogatu Black Coffee', desc: 'Premium black coffee drink mix', price: '250.00', img: '/legacy-img/blck-coffee.png', imgLg: '/legacy-img/blck-coffee.png' },
    { name: 'Nogatu Max Fuel Coffee Drink Mix', desc: 'Max fuel coffee blend', price: '2500.00', img: '/legacy-img/Max-Fuel.png', imgLg: '/legacy-img/Max-Fuel.png' },
    { name: 'Berry NAD+', desc: 'Berry NAD+ wellness supplement', price: '7998.00', img: '/legacy-img/Berry-Nad.png', imgLg: '/legacy-img/Berry-Nad.png' },
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
  const leaders = [
    {
      name: 'Harold M. Tugano',
      role: 'Chairman',
      message: 'Guiding the company with steady leadership, product discipline, and a long-term vision for every distributor community we build.',
    },
    {
      name: 'Sherwin Catera',
      role: 'Chief Executive Officer',
      message: 'Focused on field support, operations, and a cleaner member experience that helps every branch and distributor move with confidence.',
    },
  ];

  return (
    <section className="section-padding relative overflow-hidden bg-white">
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,1)_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      <div className="section-container relative z-10">
        <SectionHeader badge="People" title="People Behind the Company" />

        <div ref={ref} className="reveal max-w-5xl mx-auto text-center">
          <p className="text-gray-600 leading-relaxed mb-12">
            Meet the key leaders behind NOGATU Alliance who guide the company, support the network, and help move the community forward.
          </p>

          <div className="rounded-[2rem] bg-gray-50 border border-gray-100 shadow-sm p-6 sm:p-8 lg:p-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              {leaders.map((leader) => (
                <article
                  key={leader.name}
                  className="group rounded-[1.75rem] border border-brand-gold/25 bg-white/90 p-4 sm:p-5 shadow-[0_18px_45px_rgba(89,34,25,0.10)] transition-transform duration-300 hover:-translate-y-1"
                >
                  <div className="rounded-[1.4rem] border border-brand-gold/20 bg-gradient-to-br from-[#FFF9E8] via-white to-[#F4E5BF] p-4">
                    <div className="relative min-h-[240px] sm:min-h-[300px] overflow-hidden rounded-[1.1rem] border border-brand-gold/25 bg-[radial-gradient(circle_at_top,rgba(212,165,40,0.18),transparent_50%),linear-gradient(160deg,#fffdf4_0%,#f8ecd0_100%)] flex items-center justify-center">
                      <div className="absolute inset-x-6 top-5 h-px bg-gradient-to-r from-transparent via-brand-gold/45 to-transparent" />
                      <div className="absolute bottom-5 inset-x-8 h-20 rounded-full bg-brand-gold/10 blur-2xl" />
                      <div className="text-center px-6 relative z-10">
                        <span className="inline-flex rounded-full border border-brand-gold/20 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-gold-dark">
                          Leadership
                        </span>
                        <div className="mx-auto mt-5 flex h-20 w-20 items-center justify-center rounded-full border border-brand-gold/25 bg-brand-gold/15 text-3xl font-black text-brand-brown shadow-[0_10px_30px_rgba(184,134,11,0.18)]">
                        {leader.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}
                      </div>
                        <p className="mt-5 text-xs font-bold uppercase tracking-[0.32em] text-brand-gold-dark">Official Portrait</p>
                        <p className="mt-2 text-sm text-gray-600">Ready for the final company photo.</p>
                      </div>
                    </div>
                  </div>
                  <div className="px-2 pt-5 pb-2 text-center">
                    <h3 className="text-xl font-black tracking-tight text-brand-brown">{leader.name}</h3>
                    <p className="mt-2 text-xs font-bold uppercase tracking-[0.28em] text-brand-gold-dark">{leader.role}</p>
                    <div className="mt-4 h-px w-14 mx-auto bg-gradient-to-r from-transparent via-brand-gold/40 to-transparent" />
                    <p className="mt-5 text-sm leading-7 text-[#5B4A3A]">{leader.message}</p>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-8 relative z-20 text-center">
              <NavLink to="/organizations" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-white border border-gray-200 text-brand-brown font-semibold shadow-sm hover:shadow-md hover:border-brand-gold/40 transition-all duration-300">
                View People Behind the Company
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </NavLink>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

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
  const [form, setForm] = useState({ name: '', phone: '', email: '' });
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unable to submit application.');
      setForm({ name: '', phone: '', email: '' });
      setShowApplicationPrompt(true);
      setStatus({ type: 'success', message: data.message || 'Distributor application interest submitted.' });
    } catch (err) {
      setStatus({ type: 'error', message: err.message || 'Unable to submit application.' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section id="stockist-apply" className="section-padding relative overflow-hidden bg-geo-pattern" style={{ backgroundColor: '#FFFDF5' }}>
      <div className="section-container">
        <SectionHeader badge="Distributor Application" title="Distributor Application Form" />
        <div ref={ref} className="reveal grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          <div className="rounded-2xl p-8 text-white" style={{ background: 'linear-gradient(135deg, #592219 0%, #6d3028 100%)' }}>
            <h3 className="text-2xl font-bold mb-4">Become a Distributor Today</h3>
            <p className="text-white/75 leading-relaxed mb-6">
              Start with your full name, contact number, and email address. Once submitted, we will give you the ready-to-print distributor form you can download, print, and personally submit at the nearest branch office.
            </p>
            <div className="space-y-4 text-sm text-white/70">
              <div className="flex gap-3"><span className="text-brand-gold-light font-bold">01</span><span>Submit your full name, contact number, and email address.</span></div>
              <div className="flex gap-3"><span className="text-brand-gold-light font-bold">02</span><span>Download the printable distributor application form from the confirmation popup.</span></div>
              <div className="flex gap-3"><span className="text-brand-gold-light font-bold">03</span><span>Print the form and submit it to the nearest NOGATU branch office if you want to proceed.</span></div>
            </div>
          </div>
          <form onSubmit={submitApplication} className="rounded-2xl border border-primary-200/40 bg-white p-6 sm:p-8 shadow-lg space-y-4">
            {[
              { key: 'name', label: 'Full Name', type: 'text' },
              { key: 'phone', label: 'Contact No.', type: 'tel' },
              { key: 'email', label: 'Email Address', type: 'email' },
            ].map((field) => (
              <label key={field.key} className="block">
                <span className="block text-sm font-semibold text-brand-brown mb-2">{field.label}</span>
                <input
                  type={field.type}
                  value={form[field.key]}
                  onChange={(e) => updateField(field.key, e.target.value)}
                  required
                  className="w-full rounded-xl border border-primary-200/70 bg-[#FFFDF5] px-4 py-3 text-sm text-gray-800 outline-none focus:border-brand-gold-dark focus:ring-2 focus:ring-brand-gold/20"
                />
              </label>
            ))}
            {status.message && (
              <div className={`rounded-xl px-4 py-3 text-sm ${status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                {status.message}
              </div>
            )}
            <button type="submit" disabled={submitting} className="w-full btn-landing-primary disabled:opacity-60 disabled:cursor-not-allowed">
              {submitting ? 'Submitting...' : 'Submit Distributor Inquiry'}
            </button>
          </form>
        </div>
      </div>
      {showApplicationPrompt && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="max-w-lg w-full rounded-2xl bg-white p-7 shadow-2xl border border-brand-gold/30">
            <div className="w-14 h-14 rounded-2xl bg-brand-gold/10 text-brand-gold-dark flex items-center justify-center mb-5">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0119 9.414V19a2 2 0 01-2 2z" /></svg>
            </div>
            <h3 className="text-2xl font-bold text-brand-brown mb-3">Distributor Inquiry Received</h3>
            <p className="text-gray-600 leading-relaxed">
              Your details have been recorded. Download the printable application form below, print it, and bring it to the nearest NOGATU branch office if you want to continue your distributor application.
            </p>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <a href="/docs/nogatu-distributor-application-form.pdf" target="_blank" rel="noreferrer" className="btn-landing-primary w-full text-center">
                Download PDF Form
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
        <section
          ref={ref}
          className="reveal rounded-[1.75rem] border border-brand-gold/20 bg-white/90 shadow-[0_24px_60px_rgba(89,34,25,0.08)] p-3 sm:p-5 lg:p-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-5">
            <div>
              <h3 className="text-lg sm:text-2xl font-bold text-brand-brown">
                NOGATU Products CPR and Halal Certificates
              </h3>
              <p className="text-sm sm:text-base text-gray-600 mt-1">
                View the same certification PDF featured on the Certifications page.
              </p>
            </div>
            <NavLink
              to="/certifications"
              className="inline-flex items-center justify-center px-5 py-3 rounded-full bg-brand-gold text-white font-semibold shadow-sm hover:bg-brand-gold-dark transition-colors"
            >
              View Full Page
            </NavLink>
          </div>

          <div className="rounded-[1.35rem] overflow-hidden border border-brand-gold/15 bg-[#FFFDF7] min-h-[60vh]">
            <iframe
              src={CERTIFICATIONS_PDF_PATH}
              title="NOGATU Certifications PDF Preview"
              className="w-full h-[60vh] sm:h-[68vh]"
            />
          </div>
        </section>
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
