import { useState } from 'react';
import { useScrollReveal } from '../hooks/useScrollReveal';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

function PageHero({ title, subtitle }) {
  return (
    <section className="relative pt-36 pb-14 sm:pt-36 sm:pb-16 lg:pt-40 lg:pb-20 overflow-hidden bg-dot-grid" style={{ backgroundColor: '#FFFDF5' }}>
      <div className="absolute top-0 right-0 size-[500px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle at 80% 20%, rgba(212,165,40,0.08), transparent 70%)' }} />
      <div className="absolute bottom-0 left-0 size-[300px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle at 20% 80%, rgba(89,34,25,0.05), transparent 70%)' }} />
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
  const ref3 = useScrollReveal({ delay: 200 });
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSending(true);

    try {
      const response = await fetch(`${API_BASE}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || 'Unable to send your message right now');
      }

      setSent(true);
      setForm({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => setSent(false), 5000);
    } catch (err) {
      setError(String(err.message || 'Unable to send your message right now'));
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <PageHero title="Contact Us" subtitle="We'd love to hear from you. Reach out with any questions." />

      <section className="section-padding bg-dot-grid" style={{ backgroundColor: '#FFFDF5' }}>
        <div className="section-container">
          <div ref={ref1} className="reveal mb-20 rounded-3xl overflow-hidden shadow-2xl relative" style={{ border: '1px solid rgba(184,134,11,0.15)' }}>
            <iframe title="NOGATU Alliance Location" className="w-full h-80 lg:h-[450px]" src="https://www.google.com/maps?q=Nogatu%20Alliance%20Worldwide%20Inc.%2C%2094%20Navarro%20Street%2C%20Barangay%20177%2C%20Caloocan%20City%2C%20Metro%20Manila&output=embed" loading="lazy" referrerPolicy="no-referrer-when-downgrade" style={{ border: 0 }} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-24 items-start">
            <div ref={ref2} className="reveal-left space-y-8 mb-12 lg:mb-0">
              <div>
                <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase mb-4 shadow-sm" style={{ backgroundColor: '#FFF8E1', color: '#B8860B', border: '1px solid rgba(184,134,11,0.2)' }}>Get in Touch</span>
                <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4" style={{ color: '#3A1000' }}>Contact Information</h2>
                <div className="w-20 h-1.5 rounded-full mb-6" style={{ background: 'linear-gradient(90deg, #B8860B, #D4A528)' }} />
                <p className="text-base leading-relaxed" style={{ color: '#6d3028' }}>Feel free to reach out through any of the channels below. We are here to answer your queries and provide support.</p>
              </div>
              <div className="space-y-8">
                {INFO_ITEMS.map(item => (
                  <div key={item.label} className="flex gap-5 group items-start">
                    <div className="size-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm motion-safe:transition-all motion-safe:duration-300 group-hover:-translate-y-1" style={{ backgroundColor: '#FFF8E1', color: '#B8860B', border: '1px solid rgba(184,134,11,0.15)' }}>
                      <svg className="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.iconD} />
                        {item.iconD2 && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.iconD2} />}
                      </svg>
                    </div>
                    <div className="pt-1">
                      <p className="text-base font-bold mb-1" style={{ color: '#3A1000' }}>{item.label}</p>
                      <p className="text-sm leading-relaxed" style={{ color: '#6d3028' }}>{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div ref={ref3} className="reveal-right">
              <form onSubmit={handleSubmit} className="relative bg-white rounded-3xl p-8 sm:p-10 shadow-2xl overflow-hidden group" style={{ border: '1px solid rgba(184,134,11,0.15)' }}>
                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 size-64 bg-gradient-to-br from-[#D4A528] to-transparent opacity-5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none transition-opacity group-hover:opacity-10" />
                
                <div className="relative z-10">
                  <h3 className="text-2xl font-extrabold mb-3" style={{ color: '#3A1000' }}>Send us a message</h3>
                  <p className="text-sm mb-8" style={{ color: '#6d3028' }}>Fill out the form below and we'll get back to you shortly.</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-semibold mb-2" style={{ color: '#592219' }}>Your Name</label>
                      <input id="name" type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="w-full px-5 py-3.5 rounded-xl border text-sm outline-none focus:ring-2 focus:border-transparent motion-safe:transition-all shadow-sm bg-gray-50/50 hover:bg-gray-50 focus:bg-white" style={{ borderColor: 'rgba(184,134,11,0.2)', color: '#3A1000', '--tw-ring-color': '#D4A528', '--tw-ring-offset-width': '2px' }} placeholder="John Doe" />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-semibold mb-2" style={{ color: '#592219' }}>Your Email</label>
                      <input id="email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required className="w-full px-5 py-3.5 rounded-xl border text-sm outline-none focus:ring-2 focus:border-transparent motion-safe:transition-all shadow-sm bg-gray-50/50 hover:bg-gray-50 focus:bg-white" style={{ borderColor: 'rgba(184,134,11,0.2)', color: '#3A1000', '--tw-ring-color': '#D4A528', '--tw-ring-offset-width': '2px' }} placeholder="john@example.com" />
                    </div>
                  </div>
                  <div className="mb-6">
                    <label htmlFor="subject" className="block text-sm font-semibold mb-2" style={{ color: '#592219' }}>Subject</label>
                    <input id="subject" type="text" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} required className="w-full px-5 py-3.5 rounded-xl border text-sm outline-none focus:ring-2 focus:border-transparent motion-safe:transition-all shadow-sm bg-gray-50/50 hover:bg-gray-50 focus:bg-white" style={{ borderColor: 'rgba(184,134,11,0.2)', color: '#3A1000', '--tw-ring-color': '#D4A528', '--tw-ring-offset-width': '2px' }} placeholder="How can we help?" />
                    <p className="mt-1.5 text-xs" style={{ color: '#8B6914' }}>
                      We will reply using the email you fill out in this form.
                    </p>
                  </div>
                  <div className="mb-8">
                    <label htmlFor="message" className="block text-sm font-semibold mb-2" style={{ color: '#592219' }}>Message</label>
                    <textarea id="message" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} required rows={5} className="w-full px-5 py-3.5 rounded-xl border text-sm outline-none focus:ring-2 focus:border-transparent resize-none motion-safe:transition-all shadow-sm bg-gray-50/50 hover:bg-gray-50 focus:bg-white" style={{ borderColor: 'rgba(184,134,11,0.2)', color: '#3A1000', '--tw-ring-color': '#D4A528', '--tw-ring-offset-width': '2px' }} placeholder="Write your context here..." />
                  </div>
                  <button
                    type="submit"
                    disabled={sending}
                    className="w-full py-4 rounded-xl text-base font-bold text-white disabled:opacity-70 disabled:cursor-not-allowed motion-safe:transition-all motion-safe:duration-300 cursor-pointer flex items-center justify-center gap-3 hover:shadow-lg hover:-translate-y-0.5"
                    style={{ background: 'linear-gradient(135deg, #B8860B, #D4A528)', boxShadow: '0 8px 20px -6px rgba(184,134,11,0.5)' }}
                  >
                    {sending ? (
                      <><svg className="motion-safe:animate-spin size-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Sending Message...</>
                    ) : sent ? (
                      <><svg className="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Message Sent Successfully!</>
                    ) : (
                      <>Send Message <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg></>
                    )}
                  </button>
                </div>
                {error && (
                  <p className="mt-3 text-sm" style={{ color: '#B91C1C' }}>
                    {error}
                  </p>
                )}
              </form>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
