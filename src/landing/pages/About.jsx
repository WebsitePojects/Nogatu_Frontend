import { useState } from 'react';
import { useScrollReveal, useCountUp } from '../hooks/useScrollReveal';
import Lightbox, { useLightbox } from '../components/Lightbox';

function PageHero({ title, subtitle }) {
  return (
    <section className="relative pt-32 pb-16 lg:pt-40 lg:pb-20 overflow-hidden bg-dot-grid" style={{ backgroundColor: '#FFFDF5' }}>
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle at 80% 20%, rgba(212,165,40,0.08), transparent 70%)' }} />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle at 20% 80%, rgba(89,34,25,0.05), transparent 70%)' }} />
      <div className="absolute top-0 left-0 right-0 h-1" style={{ background: 'linear-gradient(90deg, transparent, #D4A528 50%, transparent)' }} />
      <div className="section-container relative z-10">
        <div className="max-w-3xl">
          <div className="flex items-center gap-3 mb-5 motion-safe:animate-fade-up">
            <div className="h-0.5 w-8 rounded-full" style={{ background: 'linear-gradient(90deg, #B8860B, #D4A528)' }} />
            <span className="text-xs font-bold tracking-widest uppercase" style={{ color: '#B8860B' }}>NOGATU Alliance</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-extrabold tracking-tight leading-tight mb-4 motion-safe:animate-fade-up" style={{ color: '#3A1000', animationDelay: '0.05s' }}>{title}</h1>
          {subtitle && <p className="text-lg leading-relaxed max-w-xl motion-safe:animate-fade-up" style={{ color: '#6d3028', animationDelay: '0.15s' }}>{subtitle}</p>}
          <div className="mt-6 w-16 h-1 rounded-full motion-safe:animate-fade-up" style={{ background: 'linear-gradient(90deg, #B8860B, #D4A528)', animationDelay: '0.2s' }} />
        </div>
      </div>
    </section>
  );
}

function StatBlock({ value, suffix, label }) {
  const ref = useCountUp(value);
  return (
    <div className="text-center">
      <p className="text-4xl lg:text-5xl font-extrabold text-brand-gold-dark"><span ref={ref}>0</span>{suffix}</p>
      <p className="text-sm mt-2 font-medium" style={{ color: '#6d3028' }}>{label}</p>
    </div>
  );
}


export default function About() {
  const ref1 = useScrollReveal();
  const ref2 = useScrollReveal({ delay: 100 });
  const ref3 = useScrollReveal({ delay: 150 });
  const ref4 = useScrollReveal();
  const lightbox = useLightbox();

  return (
    <>
      <PageHero title="About NOGATU Alliance" subtitle="Learn about our mission, vision, and the values that drive us forward." />

      {/* Story */}
      <section className="section-padding bg-dot-grid" style={{ backgroundColor: '#FFFDF5' }}>
        <div className="section-container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div ref={ref1} className="reveal-left">
              <div className="relative">
                <img src="/landing/assets/img/about.jpg" alt="About NOGATU Alliance" className="rounded-2xl shadow-2xl w-full object-cover cursor-pointer" style={{ boxShadow: '0 25px 50px rgba(89,34,25,0.15)' }} loading="lazy" onClick={() => lightbox.open('/landing/assets/img/about.jpg')} />
                <div className="absolute -bottom-6 -right-6 w-40 h-40 rounded-2xl shadow-xl overflow-hidden hidden lg:block cursor-pointer" style={{ border: '4px solid #E7C679' }} onClick={() => lightbox.open('/landing/img/about-2.jpg')}>
                  <img src="/landing/img/about-2.jpg" alt="NOGATU Products" className="w-full h-full object-cover" loading="lazy" />
                </div>
              </div>
            </div>
            <div ref={ref2} className="reveal-right">
              <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase mb-4" style={{ backgroundColor: 'rgba(184,134,11,0.1)', color: '#B8860B' }}>Our Story</span>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2" style={{ color: '#3A1000' }}>Empowering Lives Through Health &amp; Opportunity</h2>
              <div className="w-16 h-1 rounded-full mb-6" style={{ background: 'linear-gradient(90deg, #B8860B, #D4A528)' }} />
              <p className="leading-relaxed mb-6" style={{ color: '#6d3028' }}>Nogatu Alliance is a supplier and distributor of exclusively manufactured health food supplements as well as skin care products. We are committed to helping empower people in building a sustainable livelihood through marketing and selling of high-quality products that promote improved health and wellness.</p>
              <p className="leading-relaxed mb-8" style={{ color: '#6d3028' }}>It also provides its members with competitive marketing incentives. When you choose us, you become our valued partner, working alongside us to achieve your success.</p>
              <div className="flex gap-6">
                {['FDA Approved', 'Member-First'].map((t) => (
                  <div key={t} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(184,134,11,0.1)', color: '#B8860B' }}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <span className="text-sm font-medium" style={{ color: '#3A1000' }}>{t}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-diagonal-lines" style={{ backgroundColor: '#FFF8E1' }}>
        <div className="section-container">
          <div ref={ref3} className="reveal grid grid-cols-2 lg:grid-cols-4 gap-8">
            <StatBlock value={5900} suffix="+" label="Active Members" />
            <StatBlock value={5900} suffix="+" label="Networks Built" />
            <StatBlock value={6} suffix="" label="Product Lines" />
            <StatBlock value={5} suffix="+" label="Years of Trust" />
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="section-padding bg-geo-pattern" style={{ backgroundColor: '#FFFDF5' }}>
        <div className="section-container">
          <div ref={ref4} className="reveal grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="group p-8 lg:p-10 rounded-2xl border motion-safe:hover:shadow-xl motion-safe:transition-all motion-safe:duration-300" style={{ borderColor: 'rgba(184,134,11,0.2)', backgroundColor: 'rgba(255,253,245,0.8)' }}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 motion-safe:transition-colors motion-safe:duration-300" style={{ backgroundColor: 'rgba(184,134,11,0.1)', color: '#B8860B' }}>
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: '#3A1000' }}>Our Mission</h3>
              <div className="w-10 h-0.5 rounded-full mb-3" style={{ background: 'linear-gradient(90deg, #B8860B, #D4A528)' }} />
              <p className="leading-relaxed" style={{ color: '#6d3028' }}>Nogatu Alliance aims to become one of the Philippines' leading network marketing company that spans locally and abroad, delivering exceptional health products and empowering communities through entrepreneurship.</p>
            </div>
            <div className="group p-8 lg:p-10 rounded-2xl border motion-safe:hover:shadow-xl motion-safe:transition-all motion-safe:duration-300" style={{ borderColor: 'rgba(89,34,25,0.15)', backgroundColor: 'rgba(255,253,245,0.8)' }}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 motion-safe:transition-colors motion-safe:duration-300" style={{ backgroundColor: 'rgba(89,34,25,0.08)', color: '#592219' }}>
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: '#3A1000' }}>Our Vision</h3>
              <div className="w-10 h-0.5 rounded-full mb-3" style={{ background: 'linear-gradient(90deg, #592219, #6d3028)' }} />
              <p className="leading-relaxed" style={{ color: '#6d3028' }}>Nogatu Alliance empowers people by giving them access to high quality health and wellness products and enables them to earn significant income from marketing these products to their network of friends, family and society at large.</p>
            </div>
          </div>
        </div>
      </section>

      <Lightbox src={lightbox.src} type={lightbox.type} onClose={lightbox.close} />
    </>
  );
}
