const LEADERS = [
  {
    name: 'Harold M. Tugano',
    role: 'Chairman',
    message:
      'Guiding the company with steady leadership, product discipline, and a long-term vision for every distributor community we build.',
  },
  {
    name: 'Sherwin Catera',
    role: 'Chief Executive Officer',
    message:
      'Focused on field support, operations, and a cleaner member experience that helps every branch and distributor move with confidence.',
  },
  {
    name: 'Yoren Abihay',
    role: 'President',
    message:
      'Helping steer the organization with clear direction, people-first leadership, and a strong commitment to sustainable company growth.',
  },
  {
    name: 'Cecilia Haspe',
    role: 'Vice President',
    message:
      'Supporting company leadership through dependable coordination, practical decision-making, and steady guidance for the wider network.',
  },
  {
    name: 'Dino S. Erfe',
    role: 'Manager',
    message:
      'Focused on day-to-day execution, branch support, and keeping distributor operations organized, responsive, and efficient.',
  },
];

export default function Organizations() {
  return (
    <div className="pt-28 sm:pt-32 pb-14 sm:pb-20 min-h-screen bg-[#FFFDF5] relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none bg-geo-pattern" />

      <div className="section-container relative z-10">
        <div className="text-center mb-10 sm:mb-16 max-w-3xl mx-auto">
          <span className="inline-block px-4 py-1.5 rounded-full bg-brand-gold/10 text-brand-gold-dark font-medium text-sm mb-4 border border-brand-gold/20">
            Leadership
          </span>
          <h1 className="text-3xl md:text-5xl font-bold text-brand-brown mb-4 sm:mb-6">
            People Behind the Company
          </h1>
          <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
            Meet the leaders keeping NOGATU Alliance grounded in service, community, and practical growth.
          </p>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {LEADERS.map((leader) => (
            <article
              key={leader.name}
              className="group rounded-[2rem] border border-brand-gold/25 bg-white/90 p-5 sm:p-6 shadow-[0_24px_60px_rgba(89,34,25,0.10)] transition-transform duration-300 hover:-translate-y-1"
            >
              <div className="rounded-[1.6rem] border border-brand-gold/20 bg-gradient-to-br from-[#FFF9E8] via-white to-[#F4E5BF] p-4 sm:p-5">
                <div className="relative min-h-[280px] sm:min-h-[360px] overflow-hidden rounded-[1.35rem] border border-brand-gold/25 bg-[radial-gradient(circle_at_top,rgba(212,165,40,0.20),transparent_52%),linear-gradient(160deg,#fffdf4_0%,#f8ecd0_100%)] flex items-center justify-center">
                  <div className="absolute inset-x-6 top-6 h-px bg-gradient-to-r from-transparent via-brand-gold/45 to-transparent" />
                  <div className="absolute bottom-6 inset-x-10 h-24 rounded-full bg-brand-gold/10 blur-2xl" />
                  <div className="text-center px-6 relative z-10">
                    <span className="inline-flex rounded-full border border-brand-gold/20 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-gold-dark">
                      Leadership
                    </span>
                    <div className="mx-auto mt-6 flex h-24 w-24 items-center justify-center rounded-full border border-brand-gold/25 bg-brand-gold/15 text-4xl font-black text-brand-brown shadow-[0_10px_30px_rgba(184,134,11,0.18)]">
                    {leader.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}
                  </div>
                    <p className="mt-6 text-xs font-bold uppercase tracking-[0.32em] text-brand-gold-dark">Official Portrait</p>
                    <p className="mt-2 text-sm text-gray-600">Reserved for the final company photo.</p>
                  </div>
                </div>
              </div>

              <div className="px-2 pt-6 pb-3 text-center">
                <h2 className="text-2xl sm:text-[1.9rem] font-black tracking-tight text-brand-brown">{leader.name}</h2>
                <p className="mt-3 text-xs font-bold uppercase tracking-[0.3em] text-brand-gold-dark">{leader.role}</p>
                <div className="mt-5 h-px w-16 mx-auto bg-gradient-to-r from-transparent via-brand-gold/40 to-transparent" />
                <p className="mt-5 text-sm sm:text-base text-[#5B4A3A] leading-7">{leader.message}</p>
              </div>
            </article>
          ))}
        </div>

        <section className="mt-14 sm:mt-20">
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
