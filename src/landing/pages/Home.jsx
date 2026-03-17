import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useScrollReveal, useCountUp } from '../hooks/useScrollReveal';
import Lightbox, { useLightbox } from '../components/Lightbox';

/* ────────────────────────── Hero ────────────────────────── */
function Hero() {
  return (
    <section className="relative pt-28 pb-16 lg:pt-32 lg:pb-24 overflow-hidden bg-white">

      {/* ── Dot-grid geometric background ── */}
      {/* Primary dot grid — dark dots */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(circle, #1a1a1a 1.2px, transparent 1.2px)',
          backgroundSize: '28px 28px',
          opacity: 0.055,
        }}
      />
      {/* Soft color wash over the grid — gives a subtle warm tint */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(55,148,46,0.06) 0%, transparent 70%)',
        }}
      />

      {/* ── Corner accent shapes ── */}
      {/* Top-left geometric square outline */}
      <div
        className="absolute -top-8 -left-8 w-48 h-48 rounded-2xl rotate-12 pointer-events-none"
        style={{ border: '1.5px solid rgba(55,148,46,0.12)' }}
      />
      <div
        className="absolute top-4 left-4 w-48 h-48 rounded-2xl rotate-12 pointer-events-none"
        style={{ border: '1.5px solid rgba(55,148,46,0.07)' }}
      />
      {/* Bottom-right geometric square outline */}
      <div
        className="absolute -bottom-10 -right-10 w-64 h-64 rounded-2xl -rotate-6 pointer-events-none"
        style={{ border: '1.5px solid rgba(89,34,25,0.08)' }}
      />
      <div
        className="absolute bottom-0 right-6 w-64 h-64 rounded-2xl -rotate-6 pointer-events-none"
        style={{ border: '1.5px solid rgba(89,34,25,0.05)' }}
      />
      {/* Floating accent dot clusters */}
      <div className="absolute top-24 right-[18%] w-3 h-3 rounded-full pointer-events-none" style={{ background: '#37942E', opacity: 0.18 }} />
      <div className="absolute top-36 right-[16%] w-2 h-2 rounded-full pointer-events-none" style={{ background: '#37942E', opacity: 0.12 }} />
      <div className="absolute top-20 right-[21%] w-1.5 h-1.5 rounded-full pointer-events-none" style={{ background: '#592219', opacity: 0.15 }} />
      <div className="absolute bottom-24 left-[12%] w-3 h-3 rounded-full pointer-events-none" style={{ background: '#592219', opacity: 0.14 }} />
      <div className="absolute bottom-16 left-[10%] w-2 h-2 rounded-full pointer-events-none" style={{ background: '#37942E', opacity: 0.1 }} />

      {/* ── Content ── */}
      <div className="section-container relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">

          {/* Left – Text */}
          <div className="order-2 lg:order-1 animate-fade-up">

            <h1 className="text-4xl sm:text-5xl lg:text-[3.4rem] font-extrabold leading-[1.1] tracking-tight mb-6" style={{ color: '#1a1a1a' }}>
              Enjoy Our Healthy<br />
              <span
                className="relative inline-block"
                style={{ color: '#592219' }}
              >
                &amp; Wealthy Lifestyle
                {/* Underline accent */}
                <span
                  className="absolute -bottom-1 left-0 right-0 h-[3px] rounded-full"
                  style={{ background: 'linear-gradient(90deg, #592219, rgba(89,34,25,0.2))' }}
                />
              </span>
            </h1>

            <p className="text-gray-500 text-lg leading-relaxed mb-8 max-w-lg">
              Our success isn't in finding the best person but in turning into the right person.
            </p>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <a href="/portal/login" className="btn-landing-primary text-base px-9 py-4">
                Be the One. Register Now!
              </a>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <svg className="w-4 h-4" style={{ color: '#37942E' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                FDA Approved products
              </div>
            </div>
          </div>

          {/* Right – Hero Image */}
          <div className="order-1 lg:order-2 flex justify-center lg:justify-end animate-fade-up" style={{ animationDelay: '0.2s' }}>
            {/* Decorative ring behind image */}
            <div className="relative">
              <div
                className="absolute inset-0 -m-6 rounded-full"
                style={{
                  background: 'radial-gradient(circle, rgba(55,148,46,0.07) 0%, transparent 70%)',
                }}
              />
              <div
                className="absolute -inset-3 rounded-[40%] rotate-6"
                style={{ border: '1.5px dashed rgba(55,148,46,0.15)' }}
              />
              <img
                src="/landing/assets/img/hero-img.png"
                alt="NOGATU Alliance Products"
                className="relative max-w-full w-auto max-h-[420px] lg:max-h-[500px] object-contain animate-float-slow drop-shadow-2xl"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom fade to next section */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent pointer-events-none" />
    </section>
  );
}

/* ────────────────────────── Stats Bar (live from DB) ───── */
function StatsBar() {
  const [stats, setStats] = useState({ activeMembers: 5000, networksBuilt: 5000 });
  useEffect(() => {
    fetch('/api/stats').then(r => r.json()).then(setStats).catch(() => {});
  }, []);
  const membersRef = useCountUp(stats.activeMembers, 2000);
  const networksRef = useCountUp(stats.networksBuilt, 2000);

  const ref = useScrollReveal();
  return (
    <section className="py-14 bg-white border-y border-gray-100">
      <div ref={ref} className="reveal section-container grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
        <div>
          <p className="text-3xl lg:text-4xl font-extrabold" style={{ color: '#37942E' }}><span ref={membersRef}>0</span>+</p>
          <p className="text-sm text-gray-500 mt-1 font-medium">Active Members</p>
        </div>
        <div>
          <p className="text-3xl lg:text-4xl font-extrabold" style={{ color: '#37942E' }}><span ref={networksRef}>0</span>+</p>
          <p className="text-sm text-gray-500 mt-1 font-medium">Networks Built</p>
        </div>
        <div>
          <p className="text-3xl lg:text-4xl font-extrabold" style={{ color: '#592219' }}>6</p>
          <p className="text-sm text-gray-500 mt-1 font-medium">Product Lines</p>
        </div>
        <div>
          <p className="text-3xl lg:text-4xl font-extrabold" style={{ color: '#592219' }}>99%</p>
          <p className="text-sm text-gray-500 mt-1 font-medium">Member Satisfaction</p>
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
    <section className="section-padding bg-white">
      <div className="section-container">
        <SectionHeader badge="About Us" title="Learn More About Us" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div ref={ref1} className="reveal-left">
            <img
              src="/landing/assets/img/about.jpg"
              alt="About NOGATU Alliance"
              className="rounded-2xl shadow-xl w-full object-cover cursor-pointer hover:shadow-2xl transition-shadow duration-300"
              onClick={() => lightbox.open('/landing/assets/img/about.jpg')}
              loading="lazy"
            />
          </div>
          <div ref={ref2} className="reveal-right">
            <p className="text-gray-500 leading-relaxed mb-6">
              Nogatu Alliance is a supplier and distributor of exclusively manufactured health food supplements as well as skin care products. It is committed to helping empower people in building a sustainable livelihood through marketing and selling of high-quality products that promote improved health and wellness.
            </p>
            <p className="text-gray-500 leading-relaxed mb-8">
              It also provides its members with competitive marketing incentives.
            </p>
            {/* Video play button over secondary image */}
            <div className="relative inline-block">
              <img
                src="/landing/img/about-2.jpg"
                alt="NOGATU Products"
                className="rounded-xl shadow-lg w-full max-w-sm object-cover cursor-pointer"
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
    <section className="section-padding" style={{ backgroundColor: '#f2f2f2' }}>
      <div className="section-container">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Why box */}
          <div ref={ref} className="reveal lg:col-span-4">
            <div className="h-full rounded-2xl p-8 lg:p-10 text-white" style={{ backgroundColor: '#592219' }}>
              <h3 className="text-2xl font-bold mb-4">Why Choose NOGATU?</h3>
              <p className="text-white/70 leading-relaxed mb-6">
                At Nogatu Alliance, we don't just sell products, we build partnerships. When you choose us, you become our valued partner, working alongside us to achieve your success.
              </p>
              <p className="text-white/70 leading-relaxed mb-6">
                You are not alone in this journey. Our exceptional customer support team is dedicated to your success.
              </p>
              <NavLink to="/about" className="inline-flex items-center gap-2 text-white/90 hover:text-white font-medium text-sm transition-colors">
                Learn More
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </NavLink>
            </div>
          </div>

          {/* Feature boxes */}
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((f, i) => {
              const cardRef = useScrollReveal({ delay: i * 100 });
              return (
                <div key={f.title} ref={cardRef} className="reveal group bg-white rounded-2xl p-7 text-center hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <div className="w-14 h-14 rounded-2xl mx-auto mb-5 flex items-center justify-center transition-colors duration-300" style={{ color: '#592219', backgroundColor: 'rgba(89,34,25,0.06)' }}>
                    <svg className="w-7 h-7 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ stroke: 'currentColor' }}>
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
    <section className="section-padding bg-white">
      <div className="section-container">
        <SectionHeader badge="Our Products" title="Healthy & Wealthy Options" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((p, i) => {
            const ref = useScrollReveal({ delay: i * 80 });
            return (
              <div key={p.name} ref={ref} className="reveal group text-center">
                <div
                  className="relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 flex items-center justify-center h-56 mb-4 cursor-pointer"
                  onClick={() => lightbox.open(p.imgLg)}
                >
                  <img
                    src={p.imgLg}
                    alt={p.name}
                    className="max-h-44 object-contain group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                  />
                  {/* Zoom icon overlay */}
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
      <Lightbox src={lightbox.src} type={lightbox.type} onClose={lightbox.close} />
    </section>
  );
}

/* ────────────────────── Business Opps Preview ────────────── */
function BusinessPreview() {
  const ref = useScrollReveal();
  return (
    <section className="section-padding relative overflow-hidden" style={{ backgroundColor: '#592219' }}>
      <div className="absolute top-10 left-10 w-32 h-32 border border-white/5 rounded-2xl rotate-12 animate-float-slow" />
      <div className="absolute bottom-10 right-10 w-24 h-24 border border-white/5 rounded-xl -rotate-6 animate-float-reverse" />

      <div ref={ref} className="reveal section-container text-center relative z-10">
        <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 text-white/70 text-xs font-semibold tracking-wider uppercase mb-4">Business Opportunities</span>
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-4">
          Ready to Start Your Journey?
        </h2>
        <p className="text-white/60 text-lg max-w-xl mx-auto mb-10">
          Join thousands of members building healthier lives and sustainable income with NOGATU Alliance.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a href="/portal/login" className="btn-landing-primary text-base px-9 py-4">
            Join Now
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
          </a>
          <NavLink to="/opportunities" className="text-white/60 hover:text-white text-sm font-medium transition-colors">
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
        <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase mb-4" style={{ backgroundColor: 'rgba(55,148,46,0.08)', color: '#37942E' }}>
          {badge}
        </span>
      )}
      <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-balance" style={{ color: '#37373f' }}>
        {title}
      </h2>
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
