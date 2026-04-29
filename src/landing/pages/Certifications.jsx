import { useScrollReveal } from '../hooks/useScrollReveal';

export default function Certifications() {
  const ref = useScrollReveal();
  const items = ['Product Standards', 'FDA / Regulatory', 'Quality Assurance', 'Laboratory Results', 'Manufacturing Compliance', 'Distributor Materials'];

  return (
    <div className="pt-32 pb-20 min-h-screen bg-[#FFFDF5] relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none bg-geo-pattern" />
      <div className="section-container relative z-10">
        <div className="max-w-3xl mb-14">
          <span className="inline-block px-4 py-1.5 rounded-full bg-brand-gold/10 text-brand-gold-dark font-medium text-sm mb-4 border border-brand-gold/20">
            Compliance
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-brand-brown mb-6">Certifications</h1>
          <p className="text-lg text-gray-600 leading-relaxed">
            Placeholder view for product certificates, regulatory documents, and standards verification uploads.
          </p>
        </div>

        <div ref={ref} className="reveal grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <div key={item} className="rounded-2xl border border-brand-gold/20 bg-white/80 p-8 text-center shadow-sm">
              <div className="w-16 h-16 rounded-2xl mx-auto mb-5 bg-brand-gold/10 text-brand-gold-dark flex items-center justify-center">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              </div>
              <h2 className="font-bold text-brand-brown mb-2">{item}</h2>
              <p className="text-sm text-gray-600">Upload slot reserved.</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
