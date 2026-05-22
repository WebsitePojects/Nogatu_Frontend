const LEADERS = [
  {
    name: 'Harold M. Tugano',
    image: '/landing/img/chairman%20Harold%20M.%20Tugano.png',
    role: 'Chairman',
    motto: 'I lead with vision, stand with integrity and build with courage.',
    message:
      'So every member, leader, every family and every dream can rise with NOGATU Alliance Worldwide, Inc. (NAWI).',
  },
  {
    name: 'Sherwin A. Catera',
    image: '/landing/img/CEO%20Sherwin%20A.%20Catera.jpg',
    role: 'CEO',
    motto: 'Fear no limit.',
    message:
      'One should not be constrained by fear. Overcoming it allows greater freedom and the realization of one\'s full potential.',
  },
];

export default function Organizations() {
  return (
    <div className="pt-24 sm:pt-32 pb-12 sm:pb-20 min-h-screen bg-[#FFFDF5] relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none bg-geo-pattern" />

      <div className="section-container relative z-10">
        <div className="text-center mb-8 sm:mb-14 max-w-3xl mx-auto">
          <span className="inline-block px-4 py-1.5 rounded-full bg-brand-gold/10 text-brand-gold-dark font-medium text-sm mb-4 border border-brand-gold/20">
            Leadership
          </span>
          <h1 className="text-3xl md:text-5xl font-bold text-brand-brown mb-3 sm:mb-6">
            People Behind the Company
          </h1>
          <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
            Meet the leaders keeping NOGATU Alliance grounded in service, community, and practical growth.
          </p>
        </div>

        <div className="organization-page-grid mx-auto max-w-5xl">
          {LEADERS.map((leader) => (
            <article
              key={leader.name}
              className="leader-portrait-card leader-portrait-card-page group overflow-hidden rounded-[1.5rem] border border-brand-gold/25 bg-white/90 shadow-[0_24px_60px_rgba(89,34,25,0.10)] transition-transform duration-300 hover:-translate-y-1"
            >
              <div className="leader-portrait-media leader-portrait-media-page">
                <img
                  src={leader.image}
                  alt={leader.name}
                  className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${leader.name.includes('Sherwin') ? 'leader-photo-sherwin' : 'leader-photo-harold'}`}
                  loading="lazy"
                />
              </div>
              <div className="leader-portrait-body leader-portrait-body-page">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-brand-gold-dark">{leader.role}</p>
                <h2 className="mt-2 text-2xl sm:text-[1.9rem] font-black leading-tight tracking-tight text-brand-brown">{leader.name}</h2>
                <div className="my-4 h-px w-16 bg-gradient-to-r from-brand-gold/60 to-transparent" />
                <p className="text-base font-extrabold uppercase leading-6 text-[#3A1000] sm:text-lg">{leader.motto}</p>
                <p className="mt-3 text-sm sm:text-base text-[#5B4A3A] leading-7">{leader.message}</p>
              </div>
            </article>
          ))}
        </div>

        <section className="mt-12 sm:mt-20">
          <div className="text-center mb-8 sm:mb-10">
            <span className="inline-block px-4 py-1.5 rounded-full bg-brand-gold/10 text-brand-gold-dark font-medium text-sm mb-4 border border-brand-gold/20">
              Testimonials
            </span>
            <h2 className="text-2xl md:text-4xl font-bold text-brand-brown">Stories from the Community</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            <div className="rounded-2xl bg-white/85 border border-gray-100 shadow-xl p-4 sm:p-5">
              <div className="aspect-video rounded-xl bg-[#3A1000] flex items-center justify-center text-white/70">
                <div className="text-center">
                  <svg className="w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-3 text-brand-gold-light" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.868v4.264a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <p className="text-sm font-semibold">Testimonial video placeholder</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl bg-white/85 border border-gray-100 shadow-xl p-6 sm:p-8 flex flex-col justify-center">
              <p className="text-base sm:text-lg text-gray-700 leading-relaxed">
                "NOGATU Alliance gave us a practical way to introduce wellness products while building a disciplined distributor community."
              </p>
              <div className="mt-6">
                <p className="font-bold text-brand-brown">Distributor Testimonial</p>
                <p className="text-sm text-gray-500">Video and full text can be uploaded here.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
