import { useState } from 'react';
import { useScrollReveal } from '../hooks/useScrollReveal';

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

const INFO_ITEMS = [
  { iconD: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z', iconD2: 'M15 11a3 3 0 11-6 0 3 3 0 016 0z', label: 'Address', value: '94 Navarro Street, Maligaya Park, Brgy 177, Caloocan City' },
  { iconD: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z', label: 'Phone', value: '+632 0908 888 888' },
  { iconD: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', label: 'Email', value: 'info@nogatualliance.com' },
  { iconD: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', label: 'Hours', value: 'Mon-Sat: 11AM - 11PM | Sunday: Closed' },
];

export default function Contact() {
  const ref1 = useScrollReveal();
  const ref2 = useScrollReveal({ delay: 100 });
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSending(true);
    setTimeout(() => { setSending(false); setSent(true); setForm({ name: '', email: '', subject: '', message: '' }); setTimeout(() => setSent(false), 5000); }, 1500);
  };

  return (
    <>
      <PageHero title="Contact Us" subtitle="We'd love to hear from you. Reach out with any questions." />

      <section className="section-padding bg-dot-grid" style={{ backgroundColor: '#FFFDF5' }}>
        <div className="section-container">
          <div ref={ref1} className="reveal mb-16 rounded-2xl overflow-hidden shadow-xl" style={{ border: '2px solid rgba(184,134,11,0.2)' }}>
            <iframe title="NOGATU Alliance Location" className="w-full h-80 lg:h-96" src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15434.165296844101!2d121.04096931858975!3d14.738505023977073!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3397b1188e0f3527%3A0xc254c53128e33cca!2sMaligaya%20park!5e0!3m2!1sfil!2sph!4v1753781291095!5m2!1sfil!2sph" loading="lazy" referrerPolicy="no-referrer-when-downgrade" style={{ border: 0 }} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16">
            <div ref={ref2} className="reveal-left lg:col-span-2 space-y-6">
              <div>
                <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase mb-4" style={{ backgroundColor: 'rgba(184,134,11,0.1)', color: '#B8860B' }}>Get in Touch</span>
                <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-2" style={{ color: '#3A1000' }}>Contact Information</h2>
                <div className="w-16 h-1 rounded-full mb-4" style={{ background: 'linear-gradient(90deg, #B8860B, #D4A528)' }} />
                <p className="text-sm" style={{ color: '#6d3028' }}>Feel free to reach out through any of the channels below.</p>
              </div>
              <div className="space-y-5">
                {INFO_ITEMS.map(item => (
                  <div key={item.label} className="flex gap-4 group">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 motion-safe:transition-colors motion-safe:duration-300" style={{ backgroundColor: 'rgba(184,134,11,0.1)', color: '#B8860B' }}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.iconD} />
                        {item.iconD2 && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.iconD2} />}
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: '#3A1000' }}>{item.label}</p>
                      <p className="text-sm" style={{ color: '#6d3028' }}>{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-3">
              <form onSubmit={handleSubmit} className="rounded-2xl p-8 lg:p-10" style={{ backgroundColor: '#FFF8E1', border: '1px solid rgba(184,134,11,0.15)' }}>
                <h3 className="text-xl font-bold mb-2" style={{ color: '#3A1000' }}>Send us a message</h3>
                <div className="w-10 h-0.5 rounded-full mb-6" style={{ background: 'linear-gradient(90deg, #B8860B, #D4A528)' }} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium mb-1.5" style={{ color: '#592219' }}>Your Name</label>
                    <input id="name" type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="w-full px-4 py-3 rounded-xl border text-sm outline-none focus:ring-2 motion-safe:transition" style={{ borderColor: 'rgba(184,134,11,0.2)', backgroundColor: '#FFFDF5', color: '#3A1000', '--tw-ring-color': '#D4A528' }} placeholder="John Doe" />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-1.5" style={{ color: '#592219' }}>Your Email</label>
                    <input id="email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required className="w-full px-4 py-3 rounded-xl border text-sm outline-none focus:ring-2 motion-safe:transition" style={{ borderColor: 'rgba(184,134,11,0.2)', backgroundColor: '#FFFDF5', color: '#3A1000', '--tw-ring-color': '#D4A528' }} placeholder="john@example.com" />
                  </div>
                </div>
                <div className="mb-5">
                  <label htmlFor="subject" className="block text-sm font-medium mb-1.5" style={{ color: '#592219' }}>Subject</label>
                  <input id="subject" type="text" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} required className="w-full px-4 py-3 rounded-xl border text-sm outline-none focus:ring-2 motion-safe:transition" style={{ borderColor: 'rgba(184,134,11,0.2)', backgroundColor: '#FFFDF5', color: '#3A1000', '--tw-ring-color': '#D4A528' }} placeholder="How can we help?" />
                </div>
                <div className="mb-6">
                  <label htmlFor="message" className="block text-sm font-medium mb-1.5" style={{ color: '#592219' }}>Message</label>
                  <textarea id="message" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} required rows={5} className="w-full px-4 py-3 rounded-xl border text-sm outline-none focus:ring-2 resize-none motion-safe:transition" style={{ borderColor: 'rgba(184,134,11,0.2)', backgroundColor: '#FFFDF5', color: '#3A1000', '--tw-ring-color': '#D4A528' }} placeholder="Your message..." />
                </div>
                <button
                  type="submit"
                  disabled={sending}
                  className="w-full sm:w-auto px-8 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-60 disabled:cursor-not-allowed motion-safe:transition-all motion-safe:duration-200 cursor-pointer flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #B8860B, #D4A528)', boxShadow: '0 4px 14px rgba(184,134,11,0.3)' }}
                >
                  {sending ? (
                    <><svg className="motion-safe:animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Sending...</>
                  ) : sent ? (
                    <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Message Sent!</>
                  ) : 'Send Message'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
