import { useState } from 'react';
import { useScrollReveal } from '../hooks/useScrollReveal';

function PageHero({ title, subtitle }) {
  return (
    <section className="relative pt-40 pb-40 lg:pt-52 lg:pb-52 overflow-hidden" style={{ backgroundColor: '#592219' }}>
      <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)', backgroundSize: '40px 40px' }} />
      <div className="section-container relative z-10 text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight animate-fade-up">{title}</h1>
        {subtitle && <p className="mt-4 text-lg text-white/50 max-w-xl mx-auto animate-fade-up" style={{ animationDelay: '0.15s' }}>{subtitle}</p>}
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-36 bg-gradient-to-t from-white to-transparent" />
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

      <section className="section-padding bg-white">
        <div className="section-container">
          <div ref={ref1} className="reveal mb-16 rounded-2xl overflow-hidden shadow-xl border border-gray-100">
            <iframe title="NOGATU Alliance Location" className="w-full h-80 lg:h-96" src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15434.165296844101!2d121.04096931858975!3d14.738505023977073!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3397b1188e0f3527%3A0xc254c53128e33cca!2sMaligaya%20park!5e0!3m2!1sfil!2sph!4v1753781291095!5m2!1sfil!2sph" loading="lazy" referrerPolicy="no-referrer-when-downgrade" style={{ border: 0 }} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16">
            <div ref={ref2} className="reveal-left lg:col-span-2 space-y-6">
              <div>
                <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase mb-4" style={{ backgroundColor: 'rgba(55,148,46,0.08)', color: '#37942E' }}>Get in Touch</span>
                <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-2" style={{ color: '#37373f' }}>Contact Information</h2>
                <p className="text-gray-500 text-sm">Feel free to reach out through any of the channels below.</p>
              </div>
              <div className="space-y-5">
                {INFO_ITEMS.map(item => (
                  <div key={item.label} className="flex gap-4 group">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors duration-300" style={{ backgroundColor: 'rgba(55,148,46,0.08)', color: '#37942E' }}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.iconD} />
                        {item.iconD2 && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.iconD2} />}
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{item.label}</p>
                      <p className="text-sm text-gray-500">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-3">
              <form onSubmit={handleSubmit} className="bg-gray-50 rounded-2xl p-8 lg:p-10 border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Send us a message</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">Your Name</label>
                    <input id="name" type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:border-transparent transition" style={{ '--tw-ring-color': '#37942E' }} placeholder="John Doe" />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">Your Email</label>
                    <input id="email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:border-transparent transition" style={{ '--tw-ring-color': '#37942E' }} placeholder="john@example.com" />
                  </div>
                </div>
                <div className="mb-5">
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1.5">Subject</label>
                  <input id="subject" type="text" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} required className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:border-transparent transition" placeholder="How can we help?" />
                </div>
                <div className="mb-6">
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1.5">Message</label>
                  <textarea id="message" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} required rows={5} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:border-transparent transition resize-none" placeholder="Your message..." />
                </div>
                <button type="submit" disabled={sending} className="btn-landing-primary w-full sm:w-auto disabled:opacity-60 disabled:cursor-not-allowed">
                  {sending ? (
                    <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Sending...</>
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
