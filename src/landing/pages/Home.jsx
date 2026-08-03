import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useScrollReveal, useCountUp } from '../hooks/useScrollReveal';
import Lightbox, { useLightbox } from '../components/Lightbox';
import ImageCarousel from '../components/ImageCarousel';
import {
  COMPANY_LEADERS,
  MAIN_OFFICE_IMAGES,
  OFFICE_LOCATIONS,
  SATELLITE_BRANCH_IMAGES,
} from '../data/companyMedia';
import { apiUrl } from '../../utils/apiBase';
import { LANDING_PRODUCT_GROUPS } from '../data/productCatalog';

const CERTIFICATIONS_PDF_PATH = '/docs/NOGATU-PRODUCTS-CPR-AND-HALAL-CERTS.-POWDERED-CAPSULES.pdf';
const HERO_CERTIFICATIONS = [
  { label: 'ISO', image: '/landing/img/ISO_LOGO_transparent.png' },
  { label: 'GMP', image: '/landing/img/GMP_LOGO_transparent.png' },
  { label: 'FDA', image: '/landing/img/FDA_LOGO_transparent.png' },
  { label: 'HALAL', image: '/landing/img/HALAL_LOGO_transparent.png' },
];

function formatProductPrice(price) {
  if (price === 'TBA') return price;
  const formatted = Number(price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `₱${formatted}`;
}

function WhyFeatureCard({ feature, delay }) {
  const cardRef = useScrollReveal({ delay });

  return (
    <div ref={cardRef} className="reveal group feature-story-card bg-white rounded-2xl p-7 text-center hover:shadow-xl hover:-translate-y-1 motion-safe:transition-all motion-safe:duration-300 border border-primary-200/30">
      <div className="feature-story-shine" />
      <div className="feature-story-aura" />
      <div
        className="size-14 rounded-2xl mx-auto mb-5 flex items-center justify-center motion-safe:transition-colors motion-safe:duration-300 group-hover:scale-110 feature-story-icon"
        style={{ color: '#B8860B', backgroundColor: 'rgba(212,165,40,0.08)' }}
      >
        <svg className="size-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={feature.icon} />
        </svg>
      </div>
      <h4 className="font-bold text-brand-brown mb-3 text-lg">{feature.title}</h4>
      <p className="text-sm leading-7 text-[#6d3028] font-medium max-w-[15rem] mx-auto">{feature.desc}</p>
    </div>
  );
}

function ProductGroupSection({ group, groupIndex, onOpenLightbox }) {
  const sectionRef = useScrollReveal({ delay: groupIndex * 80 });

  return (
    <div ref={sectionRef} className="reveal">
      <div className="mb-5 sm:mb-6 text-center">
        <p className="inline-flex items-center rounded-full border border-brand-gold/20 bg-white/70 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-brand-gold-dark shadow-sm">
          {group.title}
        </p>
      </div>
      <div className={`grid grid-cols-1 min-[560px]:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-7 ${group.centered ? 'product-grid-centered' : ''}`}>
        {group.items.map((p) => (
          <article key={p.name} className="product-lineup-card group mx-auto flex size-full max-w-[24rem] flex-col rounded-[1.9rem] border border-brand-gold/20 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(255,248,225,0.98)_100%)] p-4 text-center shadow-[0_18px_42px_rgba(89,34,25,0.08)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_24px_52px_rgba(184,134,11,0.16)] sm:p-5">
            <div
              className="relative mb-4 flex h-44 cursor-pointer items-center justify-center overflow-hidden rounded-[1.65rem] border border-brand-gold/15 bg-[linear-gradient(135deg,#FFFDF5,#FFF8E1)] px-4 sm:h-52 md:h-56"
              onClick={() => p.imgLg && onOpenLightbox(p.imgLg)}
            >
              <div className="product-card-ambient product-card-ambient-left" />
              <div className="product-card-ambient product-card-ambient-right" />
              <div className="product-card-sheen" />
              <div className="product-card-grid" />
              <div className="product-card-badge">{p.badge}</div>
              <img
                src={p.imgLg}
                alt={p.name}
                className="product-card-image relative z-10 max-h-36 object-contain transition-transform duration-500 group-hover:scale-110 sm:max-h-40 md:max-h-44"
                loading="lazy"
              />
            </div>
            <div className="flex flex-1 flex-col justify-between">
              <div>
                <h4 className="text-base font-bold text-gray-900 sm:text-lg">{p.name}</h4>
                <p className="mt-2 text-sm leading-6 text-gray-500">{p.desc}</p>
              </div>
              <p className="mt-4 text-xl font-bold text-brand-gold-dark">{formatProductPrice(p.price)}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

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
      className="landing-home-hero relative overflow-hidden"
      style={{
        backgroundImage: 'url(/img/landing-bg-clean.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Warm gold overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-transparent pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-24 sm:pt-24 pb-6 sm:pb-10">
        <div className="landing-home-hero-inner flex flex-col md:flex-row gap-5 md:gap-8 items-center justify-between">
          <div className="order-1 w-full md:w-[38%] pb-1 md:pb-0 md:mt-auto motion-safe:animate-fade-up text-left z-20 flex flex-col items-start">
            <h1 className="landing-home-title font-extrabold leading-[1.08] tracking-tight text-white mb-3 sm:mb-5 drop-shadow-2xl">
              Enjoy Our Healthy<br />
              <span className="text-brand-gold-light drop-shadow-lg">&amp; Wealthy Lifestyle</span>
            </h1>
            <p className="mb-4 sm:mb-6 text-white/90 text-sm sm:text-lg font-medium max-w-md drop-shadow-md">
              Wellness You Can Taste, Quality You Can Trust.
            </p>
            <div className="landing-hero-actions flex w-full max-w-sm flex-row gap-2.5 sm:w-auto sm:max-w-none sm:flex-row sm:flex-wrap sm:gap-3">
              <a
                href="/portal/login"
                className="inline-flex min-h-[44px] sm:min-h-[54px] flex-1 sm:flex-none items-center justify-center px-3 sm:px-7 py-2 sm:py-3 text-center text-white text-xs sm:text-[15px] font-extrabold rounded-full motion-safe:transition-all motion-safe:duration-300 border border-[#b37f08] shadow-[0_10px_28px_rgba(184,134,11,0.4)] leading-none hover:-translate-y-0.5 hover:shadow-[0_14px_36px_rgba(184,134,11,0.52)]"
                style={{ background: 'linear-gradient(135deg, #B8860B 0%, #D4A528 50%, #E7C679 100%)' }}
              >
                Register Now
              </a>
              <a
                href="#stockist-apply"
                className="inline-flex min-h-[44px] sm:min-h-[54px] flex-1 sm:flex-none items-center justify-center gap-1.5 sm:gap-3 rounded-full px-3 sm:px-6 py-2 sm:py-3 text-center text-xs sm:text-[15px] font-bold text-white backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5"
                style={{
                  border: '1px solid rgba(255,255,255,0.5)',
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.16), rgba(212,165,40,0.16))',
                  boxShadow: '0 10px 24px rgba(89,34,25,0.16), inset 0 1px 0 rgba(255,255,255,0.34)',
                }}
              >
                <span className="hidden min-[400px]:inline-flex h-5 w-5 sm:h-7 sm:w-7 items-center justify-center rounded-full border border-white/25 bg-white/15">
                  <svg className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" />
                  </svg>
                </span>
                Become a Distributor
              </a>
            </div>
            <div className="mt-5 hidden sm:flex items-center justify-start gap-3 text-white/90">
              <svg className="size-6 text-brand-gold-light drop-shadow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-[clamp(0.95rem,1.4vw,1.15rem)] font-semibold leading-none drop-shadow">FDA Approved Products</span>
            </div>
          </div>

          <div className="order-2 w-full md:w-[62%] flex justify-center md:justify-end motion-safe:animate-fade-up z-10 mt-0 sm:mt-8 md:mt-0 flex-1 md:flex-none items-center">
            <div className="hero-carousel-shell relative w-full max-w-[600px] sm:max-w-[760px] md:max-w-[1080px] xl:max-w-[1240px] mx-auto md:mx-0">
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
        <div className="hero-certifications-bar" aria-label="Trusted standards">
          <span className="hero-certifications-title">Trusted Standards</span>
          <div className="hero-certifications-line" />
          <div className="hero-certifications-list">
            {HERO_CERTIFICATIONS.map((cert, index) => (
              <div
                key={cert.label}
                className="hero-certification-item"
                style={{ '--cert-delay': `${index * 140}ms` }}
              >
                <img src={cert.image} alt={`${cert.label} certification`} />
                <span>{cert.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────── Stats Bar ───────────────────── */
function StatsBar() {
  const ref = useScrollReveal();
  return (
    <section className="py-8 sm:py-14 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #592219 0%, #6d3028 50%, #592219 100%)' }}>
      {/* Diagonal line pattern */}
      <div className="absolute inset-0 pointer-events-none bg-diagonal-lines" />
      <div ref={ref} className="reveal section-container max-w-4xl grid grid-cols-2 gap-5 sm:gap-8 text-center relative z-10">
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-20 items-center">
          <div ref={ref1} className="reveal-left">
            <div className="relative about-photo-frame">
              <div className="about-photo-glow" />
              <div className="about-photo-orb about-photo-orb-left" />
              <div className="about-photo-orb about-photo-orb-right" />
              <ImageCarousel
                images={MAIN_OFFICE_IMAGES}
                alt="NOGATU main office"
                className="relative z-10"
                stageClassName="branch-carousel-stage"
                imageClassName="rounded-2xl shadow-xl w-full object-cover cursor-pointer hover:shadow-2xl motion-safe:transition-shadow motion-safe:duration-300 border border-primary-200/30 about-photo-main"
                onImageClick={(src) => lightbox.open(src)}
              />
              {/* Accent badge */}
              <div className="absolute -bottom-4 -right-4 rounded-2xl px-5 py-3 shadow-xl about-photo-badge" style={{ background: 'linear-gradient(135deg, #B8860B, #D4A528)' }}>
                <div className="text-white font-black text-xl">10+</div>
                <div className="text-white/80 text-xs font-semibold uppercase tracking-wide">Products</div>
              </div>
            </div>
          </div>
          <div ref={ref2} className="reveal-right">
            <p className="mb-4 text-gray-700 leading-relaxed">
              Nogatu Alliance delivers health supplements, skin care, and a member-first business model built around wellness and practical income opportunities.
            </p>
            <p className="mb-6 text-sm leading-relaxed text-gray-600 sm:mb-8 sm:text-base">
              Members get product access, branch support, and a clearer path to growing a sustainable livelihood.
            </p>
            <div className="mb-6 grid grid-cols-2 gap-3 sm:mb-8">
              {OFFICE_LOCATIONS.map((office) => (
                <div key={office.label} className="about-info-card h-full p-4 sm:p-5">
                  <div className="about-info-icon mb-3">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {office.icon === 'pin' ? (
                        <>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </>
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 21h18M5 21V7l8-4 6 3v15M9 9h.01M9 12h.01M9 15h.01M13 9h.01M13 12h.01M13 15h.01" />
                      )}
                    </svg>
                  </div>
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-brand-gold-dark sm:text-xs">{office.label}</p>
                  <p className="text-[11px] leading-5 text-gray-700 sm:text-sm sm:leading-6">{office.address}</p>
                </div>
              ))}
            </div>
            <div className="relative hidden sm:inline-block product-mini-frame">
              <div className="product-mini-glow" />
              <ImageCarousel
                images={SATELLITE_BRANCH_IMAGES}
                alt="NOGATU satellite branch"
                className="relative z-10 w-full max-w-sm"
                stageClassName="branch-carousel-stage"
                imageClassName="rounded-xl shadow-lg w-full object-cover cursor-pointer border border-primary-200/30 product-mini-image"
                onImageClick={(src) => lightbox.open(src)}
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
  const featureCards = [
    {
      eyebrow: 'Mission',
      icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
      title: 'Our Mission',
      desc: 'Nogatu Alliance aims to become one of the Philippines\' leading network marketing company that spans locally and abroad.',
    },
    {
      eyebrow: 'Vision',
      icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
      title: 'Our Vision',
      desc: 'Nogatu Alliance empowers people by giving them access to high quality health and wellness products and enables them to earn significant income from marketing these products to their network of friends, family and society at large',
    },
    {
      eyebrow: 'Products',
      icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
      title: 'Our Products',
      desc: 'We pride ourselves on always offering our customers high-quality products. This is a core value of our business. We are always looking for ways to improve and extend the life cycle of each item we produce.',
    },
  ];

  return (
    <section className="section-padding relative overflow-hidden" style={{ background: '#FFF8E1' }}>
      {/* Dot grid bg */}
      <div className="absolute inset-0 pointer-events-none bg-dot-grid" style={{ opacity: 0.06 }} />
      <div className="section-container relative z-10">
        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2 xl:grid-cols-4">
          <div ref={ref} className="reveal">
            <div className="relative h-full overflow-hidden rounded-[1.6rem] border border-[#7a4a22]/10 p-5 text-white shadow-[0_18px_42px_rgba(89,34,25,0.18)] sm:p-7" style={{ background: 'linear-gradient(145deg, #592219 0%, #6d3028 60%, #7c3a30 100%)' }}>
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(212,165,40,0.05) 10px, rgba(212,165,40,0.05) 11px)' }}
              />
              <div className="relative z-10 flex h-full flex-col">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#E7C679]">Why Choose NOGATU?</p>
                <h3 className="mt-3 text-2xl font-black leading-tight sm:text-[1.9rem]">Why Choose NOGATU?</h3>
                <p className="mt-4 text-sm leading-6 text-white/78 sm:text-base">
                  At Nogau Alliance, we don&apos;t just sell products, we build partnerships. When you choose us, you become our valued partner, working alongside us to achieve your success.
                </p>
                <p className="mt-4 text-sm leading-6 text-white/82 sm:text-base">
                  You are not alone in this journey. Our exceptional customer support team is dedicated to your success. We provide practical, expert support whenever you need it, and make sure you get the most out of your membership experience.
                </p>
                <NavLink to="/about" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#F5D881] transition-colors hover:text-white">
                  Learn More
                  <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </NavLink>
              </div>
            </div>
          </div>

          {featureCards.map((card, i) => {
            const cardRef = useScrollReveal({ delay: i * 100 });
            return (
              <div key={card.title} ref={cardRef} className="reveal">
                <article className="feature-story-card group h-full rounded-[1.6rem] border border-primary-200/30 bg-white p-5 shadow-[0_18px_38px_rgba(89,34,25,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_46px_rgba(184,134,11,0.14)] sm:p-6">
                  <div className="feature-story-shine" />
                  <div className="feature-story-aura" />
                  <div
                    className="feature-story-icon flex h-12 w-12 items-center justify-center rounded-2xl"
                    style={{ color: '#8A6300', backgroundColor: 'rgba(212,165,40,0.12)' }}
                  >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={card.icon} />
                    </svg>
                  </div>
                  <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.22em] text-[#8A6300]">{card.eyebrow}</p>
                  <h4 className="mt-2 text-lg font-black leading-snug text-[#421100]">{card.title}</h4>
                  <p className="mt-3 text-sm leading-6 text-[#5f4334]">{card.desc}</p>
                </article>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────── Products ─────────────────────── */
function Products() {
  const lightbox = useLightbox();

  return (
    <section className="section-padding relative overflow-hidden" style={{ background: '#FFFDF5' }}>
      {/* Geo pattern */}
      <div className="absolute inset-0 pointer-events-none bg-geo-pattern" />
      <div className="absolute inset-0 pointer-events-none product-lineup-wash" />
      <div className="section-container relative z-10">
        <SectionHeader badge="Products" title="Our Product Line-up" />
        <div className="mx-auto mb-10 max-w-3xl text-center sm:mb-12">
          <p className="text-base leading-relaxed text-[#6d3028] sm:text-lg">
            Explore our healthy and wealthy options in a cleaner, mobile-friendly showcase built to keep every product card easy to browse on any screen.
          </p>
        </div>
        <div className="space-y-10 sm:space-y-12">
          {LANDING_PRODUCT_GROUPS.map((group, groupIndex) => {
            const sectionRef = useScrollReveal({ delay: groupIndex * 80 });
            return (
              <div key={group.title} ref={sectionRef} className="reveal">
                <div className="mb-5 sm:mb-6 text-center">
                  <p className="inline-flex items-center rounded-full border border-brand-gold/20 bg-white/70 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-brand-gold-dark shadow-sm">
                    {group.title}
                  </p>
                </div>
                <div className={`product-lineup-grid ${group.layout === 'featured' ? 'product-grid-featured' : 'product-grid-standard'}`}>
                  {group.items.map((p) => (
                    <article key={p.name} className="product-lineup-card group mx-auto flex h-full w-full flex-col rounded-[1.9rem] border border-brand-gold/20 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(255,248,225,0.98)_100%)] p-4 text-center shadow-[0_18px_42px_rgba(89,34,25,0.08)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_24px_52px_rgba(184,134,11,0.16)] sm:p-5">
                      <div
                        className="product-card-media relative mb-4 flex cursor-pointer items-center justify-center overflow-hidden rounded-[1.65rem] border border-brand-gold/15 bg-[linear-gradient(135deg,#FFFDF5,#FFF8E1)] px-4"
                        onClick={() => p.imgLg && lightbox.open(p.imgLg)}
                      >
                        <div className="product-card-ambient product-card-ambient-left" />
                        <div className="product-card-ambient product-card-ambient-right" />
                        <div className="product-card-sheen" />
                        <div className="product-card-grid" />
                        <div className="product-card-badge">{p.badge}</div>
                        <img
                          src={p.imgLg}
                          alt={p.name}
                          className="product-card-image relative z-10 object-contain transition-transform duration-500 group-hover:scale-110"
                          loading="lazy"
                        />
                      </div>
                      <div className="flex flex-1 flex-col justify-between gap-4">
                        <div>
                          <h4 className="text-lg font-bold leading-snug text-gray-900">{p.name}</h4>
                          <p className="mt-2 text-sm leading-6 text-gray-500 sm:text-[0.95rem]">{p.desc}</p>
                        </div>
                        <p className="text-[1.35rem] font-bold text-brand-gold-dark sm:text-2xl">{formatProductPrice(p.price)}</p>
                      </div>
                    </article>
                  ))}
                </div>
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
  const testimonialVideoSrc = '/landing/img/nogatu-testimonials.mp4';

  return (
    <section className="section-padding relative overflow-hidden bg-white">
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,1)_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      <div className="section-container relative z-10">
        <SectionHeader badge="People" title="People Behind the Company" />

        <div ref={ref} className="reveal max-w-5xl mx-auto text-center">
          <p className="mx-auto mb-8 max-w-2xl text-base leading-relaxed text-gray-600 sm:mb-10 sm:text-lg">
            Meet the leaders guiding NOGATU Alliance with vision, service, and steady purpose.
          </p>

          <div className="rounded-[1.5rem] border border-gray-100 bg-gray-50 p-4 shadow-sm sm:p-7 lg:p-8">
            <div className="organization-preview-grid mx-auto max-w-5xl text-left">
              {COMPANY_LEADERS.map((leader) => (
                <article
                  key={leader.name}
                  className="leader-portrait-card leader-portrait-card-home group overflow-hidden rounded-[1.5rem] border border-brand-gold/25 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(255,248,225,0.99)_100%)] shadow-[0_18px_45px_rgba(89,34,25,0.10)] transition-transform duration-300 hover:-translate-y-1"
                >
                  <div className="leader-portrait-media">
                    <img
                      src={leader.image}
                      alt={leader.name}
                      className={`h-full w-full object-cover ${leader.name.includes('Sherwin') ? 'leader-photo-sherwin leader-photo-home-sherwin' : 'leader-photo-harold leader-photo-home-harold'}`}
                      loading="lazy"
                    />
                  </div>
                  <div className="leader-portrait-body leader-portrait-body-home">
                    <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#8A6300]">{leader.role}</p>
                    <h3 className="mt-2 text-2xl font-black leading-tight tracking-tight text-[#421100]">{leader.name}</h3>
                    <div className="leader-portrait-divider my-4 h-px w-16 bg-gradient-to-r from-brand-gold/60 to-transparent" />
                    <p className="text-base font-extrabold uppercase leading-6 text-[#2B0A00]">{leader.motto}</p>
                    <p className="mt-3 text-sm leading-6 text-[#3F3125]">{leader.message}</p>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-8 rounded-[1.5rem] border border-brand-gold/15 bg-white p-4 shadow-sm sm:p-6">
              <div className="mb-4 text-left sm:mb-5">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-brand-gold-dark">Video Testimonials</p>
                <h3 className="mt-2 text-xl font-black tracking-tight text-[#421100] sm:text-2xl">Now Playing</h3>
              </div>
              <div className="overflow-hidden rounded-[1.25rem] border border-brand-gold/15 bg-black shadow-[0_16px_40px_rgba(89,34,25,0.14)]">
                <video
                  className="w-full aspect-video object-cover"
                  src={testimonialVideoSrc}
                  controls
                  autoPlay
                  muted
                  playsInline
                  preload="metadata"
                />
              </div>
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
      <div className="absolute top-10 left-10 size-32 border-[3px] border-[#D4A528]/20 rounded-full border-dashed rotate-12 motion-safe:animate-spin-slow pointer-events-none" />
      <div className="absolute bottom-10 right-10 size-24 border-[3px] border-[#B8860B]/20 rounded-full border-dashed -rotate-6 motion-safe:animate-spin-slow pointer-events-none" />
      
      <div ref={ref} className="reveal section-container text-center relative z-10 max-w-[1000px] mx-auto">
        <div className="bg-white rounded-[1.75rem] sm:rounded-[2.5rem] p-6 sm:p-10 md:p-16 shadow-[0_20px_50px_rgba(184,134,11,0.15)] border border-[#D4A528]/20 relative overflow-hidden group">
          {/* Inner card gradient highlight */}
          <div className="absolute top-0 right-0 size-72 bg-gradient-to-br from-[#D4A528] to-transparent opacity-10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none transition-opacity duration-700 group-hover:opacity-20" />
          <div className="absolute bottom-0 left-0 size-72 bg-gradient-to-tr from-[#B8860B] to-transparent opacity-5 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none transition-opacity duration-700 group-hover:opacity-15" />
          
          <div className="relative z-10">
            <span className="inline-block px-4 sm:px-5 py-2 rounded-full bg-[#FFF8E1] text-[#B8860B] border border-[#B8860B]/20 text-xs md:text-sm font-bold tracking-widest uppercase mb-4 sm:mb-6 shadow-sm">
              Business Opportunities
            </span>
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-[#3A1000] tracking-tight mb-4 sm:mb-6 leading-tight">
              Ready to Start Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#B8860B] to-[#D4A528] drop-shadow-sm">Journey?</span>
            </h2>
            <p className="text-[#6d3028] text-base md:text-xl max-w-2xl mx-auto mb-7 sm:mb-10 leading-relaxed font-medium">
              Join thousands of members building healthier lives and sustainable income with NOGATU Alliance.
            </p>
            <div className="flex flex-row w-full max-w-md mx-auto items-center justify-center gap-2.5 sm:gap-5">
              <a href="/portal/login" className="flex-1 sm:flex-initial inline-flex min-h-[44px] sm:min-h-12 items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-10 py-2 sm:py-4 rounded-xl text-white font-bold text-xs sm:text-lg hover:-translate-y-1 transition-all duration-300 shadow-[0_8px_20px_rgba(184,134,11,0.4)] hover:shadow-[0_12px_25px_rgba(184,134,11,0.6)]" style={{ background: 'linear-gradient(135deg, #B8860B, #D4A528)' }}>
                Join Now
                <svg className="size-4 sm:size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              </a>
              <NavLink to="/products#packages" className="flex-1 sm:flex-initial inline-flex min-h-[44px] sm:min-h-12 items-center justify-center px-4 sm:px-8 py-2 sm:py-4 rounded-xl text-[#B8860B] font-bold text-xs sm:text-lg border-2 border-[#D4A528]/30 hover:border-[#D4A528] hover:bg-[#FFF8E1] transition-all duration-300">
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
    { title: 'PDF Product Presentation', desc: 'Presentation deck placeholder for product education and distributor orientation.' },
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
              <div className="size-10 sm:size-12 rounded-xl bg-brand-gold/10 text-brand-gold-dark flex items-center justify-center mb-4 sm:mb-5">
                <svg className="size-5 sm:size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0119 9.414V19a2 2 0 01-2 2z" /></svg>
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
  const [fieldErrors, setFieldErrors] = useState({});
  const [status, setStatus] = useState({ type: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [showApplicationPrompt, setShowApplicationPrompt] = useState(false);
  const ref = useScrollReveal();
  const requiredFields = [
    { key: 'name', label: 'Full Name', type: 'text' },
    { key: 'phone', label: 'Contact No.', type: 'tel' },
    { key: 'email', label: 'Email Address', type: 'email' },
  ];

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: '' }));
  };

  async function submitApplication(e) {
    e.preventDefault();
    const cleanedForm = Object.fromEntries(
      Object.entries(form).map(([key, value]) => [key, String(value || '').trim()])
    );
    const nextErrors = requiredFields.reduce((errors, field) => {
      if (!cleanedForm[field.key]) {
        errors[field.key] = `${field.label} is required.`;
      }
      return errors;
    }, {});

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setStatus({ type: 'error', message: 'Please fill up all required fields before submitting.' });
      return;
    }

    setSubmitting(true);
    setFieldErrors({});
    setStatus({ type: '', message: '' });
    try {
      const res = await fetch(apiUrl('/applications'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanedForm),
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
              <div className="flex gap-3"><span className="text-brand-gold-light font-bold">04</span><span>This is not a new membership registration. This downloadable form is provided for auditing purposes only.</span></div>
            </div>
          </div>
          <form onSubmit={submitApplication} noValidate className="rounded-2xl border border-primary-200/40 bg-white p-6 shadow-lg space-y-4 sm:p-8">
            {requiredFields.map((field) => (
              <label key={field.key} className="block">
                <span className="block text-sm font-semibold text-brand-brown mb-2">{field.label}</span>
                <input
                  type={field.type}
                  value={form[field.key]}
                  onChange={(e) => updateField(field.key, e.target.value)}
                  required
                  aria-invalid={fieldErrors[field.key] ? 'true' : 'false'}
                  className={`w-full rounded-xl border bg-[#FFFDF5] px-4 py-3 text-sm text-gray-800 outline-none focus:border-brand-gold-dark focus:ring-2 focus:ring-brand-gold/20 ${fieldErrors[field.key] ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : 'border-primary-200/70'}`}
                />
                {fieldErrors[field.key] && (
                  <p className="mt-2 text-sm text-red-600">{fieldErrors[field.key]}</p>
                )}
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
            <div className="size-14 rounded-2xl bg-brand-gold/10 text-brand-gold-dark flex items-center justify-center mb-5">
              <svg className="size-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0119 9.414V19a2 2 0 01-2 2z" /></svg>
            </div>
            <h3 className="text-2xl font-bold text-brand-brown mb-3">Distributor Inquiry Received</h3>
            <p className="text-gray-600 leading-relaxed">
              Your details have been recorded. Download the printable application form below, print it, and bring it to the nearest NOGATU branch office if you want to continue your distributor application.
            </p>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <a href="/docs/nogatu-distributor-application-form.pdf" target="_blank" rel="noreferrer" className="btn-landing-primary w-full text-center">
                Download PDF Form
              </a>
              <button onClick={() => setShowApplicationPrompt(false)} className="btn-landing-secondary w-full" type="button">
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
    <div ref={ref} className="reveal text-center mb-8 sm:mb-12 lg:mb-16">
      {badge && (
        <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase mb-4" style={{ backgroundColor: 'rgba(212,165,40,0.1)', color: '#B8860B' }}>
          {badge}
        </span>
      )}
      <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-balance text-gray-900">
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
