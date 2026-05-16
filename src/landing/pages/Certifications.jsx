import { useScrollReveal } from '../hooks/useScrollReveal';

const PDF_PATH = '/docs/NOGATU-PRODUCTS-CPR-AND-HALAL-CERTS.-POWDERED-CAPSULES.pdf';

export default function Certifications() {
  const ref = useScrollReveal();

  return (
    <div className="pt-32 pb-20 min-h-screen bg-[#FFFDF5] relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none bg-geo-pattern" />
      <div className="section-container relative z-10">
        <div className="max-w-3xl mb-10 sm:mb-14">
          <span className="inline-block px-4 py-1.5 rounded-full bg-brand-gold/10 text-brand-gold-dark font-medium text-sm mb-4 border border-brand-gold/20">
            Compliance
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-brand-brown mb-6">Certifications</h1>
          <p className="text-lg text-gray-600 leading-relaxed">
            View the uploaded NOGATU product CPR and Halal certification document directly on this page.
          </p>
        </div>

        <section
          ref={ref}
          className="reveal rounded-[1.75rem] border border-brand-gold/20 bg-white/90 shadow-[0_24px_60px_rgba(89,34,25,0.08)] p-3 sm:p-5 lg:p-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-5">
            <div>
              <h2 className="text-lg sm:text-2xl font-bold text-brand-brown">
                NOGATU Products CPR and Halal Certificates
              </h2>
              <p className="text-sm sm:text-base text-gray-600 mt-1">
                Scroll, zoom, and view the PDF below.
              </p>
            </div>
            <a
              href={PDF_PATH}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center px-5 py-3 rounded-full bg-brand-gold text-white font-semibold shadow-sm hover:bg-brand-gold-dark transition-colors"
            >
              Open PDF
            </a>
          </div>

          <div className="rounded-[1.35rem] overflow-hidden border border-brand-gold/15 bg-[#FFFDF7] min-h-[70vh]">
            <iframe
              src={PDF_PATH}
              title="NOGATU Certifications PDF"
              className="w-full h-[70vh] sm:h-[78vh]"
            />
          </div>
        </section>
      </div>
    </div>
  );
}
