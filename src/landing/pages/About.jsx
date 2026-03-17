import { useState, useEffect } from 'react';
import { useScrollReveal, useCountUp } from '../hooks/useScrollReveal';
import Lightbox, { useLightbox } from '../components/Lightbox';

function PageHero({ title, subtitle }) {
  return (
    <section className="relative pt-40 pb-40 lg:pt-52 lg:pb-52 overflow-hidden" style={{ backgroundColor: '#592219' }}>
      <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)', backgroundSize: '40px 40px' }} />
      <div className="absolute top-20 left-[15%] w-64 h-64 rounded-full bg-white/5 blur-3xl animate-pulse-glow" />
      <div className="section-container relative z-10 text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight animate-fade-up">{title}</h1>
        {subtitle && <p className="mt-4 text-lg text-white/50 max-w-xl mx-auto animate-fade-up" style={{ animationDelay: '0.15s' }}>{subtitle}</p>}
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-36 bg-gradient-to-t from-white to-transparent" />
    </section>
  );
}

function StatBlock({ value, suffix, label }) {
  const ref = useCountUp(value);
  return (
    <div className="text-center">
      <p className="text-4xl lg:text-5xl font-extrabold" style={{ color: '#37942E' }}><span ref={ref}>0</span>{suffix}</p>
      <p className="text-sm text-gray-500 mt-2 font-medium">{label}</p>
    </div>
  );
}

function LiveStatBlock({ label }) {
  const [stats, setStats] = useState({ activeMembers: 0, networksBuilt: 0 });
  useEffect(() => { fetch('/api/stats').then(r => r.json()).then(setStats).catch(() => {}); }, []);
  const val = label === 'Active Members' ? stats.activeMembers : stats.networksBuilt;
  const ref = useCountUp(val, 2000);
  return (
    <div className="text-center">
      <p className="text-4xl lg:text-5xl font-extrabold" style={{ color: '#37942E' }}><span ref={ref}>0</span>+</p>
      <p className="text-sm text-gray-500 mt-2 font-medium">{label}</p>
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
      <section className="section-padding bg-white">
        <div className="section-container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div ref={ref1} className="reveal-left">
              <div className="relative">
                <img src="/landing/assets/img/about.jpg" alt="About NOGATU Alliance" className="rounded-2xl shadow-2xl shadow-gray-200/50 w-full object-cover cursor-pointer" loading="lazy" onClick={() => lightbox.open('/landing/assets/img/about.jpg')} />
                <div className="absolute -bottom-6 -right-6 w-40 h-40 rounded-2xl border-4 border-white shadow-xl overflow-hidden hidden lg:block cursor-pointer" onClick={() => lightbox.open('/landing/img/about-2.jpg')}>
                  <img src="/landing/img/about-2.jpg" alt="NOGATU Products" className="w-full h-full object-cover" loading="lazy" />
                </div>
              </div>
            </div>
            <div ref={ref2} className="reveal-right">
              <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase mb-4" style={{ backgroundColor: 'rgba(55,148,46,0.08)', color: '#37942E' }}>Our Story</span>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-6" style={{ color: '#37373f' }}>Empowering Lives Through Health &amp; Opportunity</h2>
              <p className="text-gray-500 leading-relaxed mb-6">Nogatu Alliance is a supplier and distributor of exclusively manufactured health food supplements as well as skin care products. We are committed to helping empower people in building a sustainable livelihood through marketing and selling of high-quality products that promote improved health and wellness.</p>
              <p className="text-gray-500 leading-relaxed mb-8">It also provides its members with competitive marketing incentives. When you choose us, you become our valued partner, working alongside us to achieve your success.</p>
              <div className="flex gap-6">
                {['FDA Approved', 'Member-First'].map((t) => (
                  <div key={t} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(55,148,46,0.08)', color: '#37942E' }}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <span className="text-sm font-medium text-gray-700">{t}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-gray-50">
        <div className="section-container">
          <div ref={ref3} className="reveal grid grid-cols-2 lg:grid-cols-4 gap-8">
            <LiveStatBlock label="Active Members" />
            <LiveStatBlock label="Networks Built" />
            <StatBlock value={6} suffix="" label="Product Lines" />
            <StatBlock value={5} suffix="+" label="Years of Trust" />
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="section-padding bg-white">
        <div className="section-container">
          <div ref={ref4} className="reveal grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="group p-8 lg:p-10 rounded-2xl border border-gray-100 hover:shadow-xl transition-all duration-300">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-colors duration-300" style={{ backgroundColor: 'rgba(55,148,46,0.08)', color: '#37942E' }}>
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Our Mission</h3>
              <p className="text-gray-500 leading-relaxed">Nogatu Alliance aims to become one of the Philippines' leading network marketing company that spans locally and abroad, delivering exceptional health products and empowering communities through entrepreneurship.</p>
            </div>
            <div className="group p-8 lg:p-10 rounded-2xl border border-gray-100 hover:shadow-xl transition-all duration-300">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-colors duration-300" style={{ backgroundColor: 'rgba(89,34,25,0.06)', color: '#592219' }}>
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Our Vision</h3>
              <p className="text-gray-500 leading-relaxed">Nogatu Alliance empowers people by giving them access to high quality health and wellness products and enables them to earn significant income from marketing these products to their network of friends, family and society at large.</p>
            </div>
          </div>
        </div>
      </section>

      <Lightbox src={lightbox.src} type={lightbox.type} onClose={lightbox.close} />
    </>
  );
}
