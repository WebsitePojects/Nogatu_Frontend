const LEADERS = [
  {
    name: 'Harold M. Tugano',
    role: 'Chairman',
    message: 'Reserved space for Harold Tugano\'s company message, personal note, or leadership statement.',
  },
  {
    name: 'Sherwin Catera',
    role: 'CEO',
    message: 'Reserved space for Sherwin\'s message, welcome note, or inspirational statement for the NOGATU community.',
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
            Meet the core leaders helping guide NOGATU Alliance and its growing community.
          </p>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {LEADERS.map((leader) => (
            <article
              key={leader.name}
              className="rounded-[1.75rem] border border-brand-gold/20 bg-white/90 shadow-[0_24px_60px_rgba(89,34,25,0.08)] p-4 sm:p-5"
            >
              <div className="rounded-[1.4rem] border border-brand-gold/20 bg-[#FFFDF7] p-4 sm:p-5 h-full flex flex-col">
                <div className="aspect-[4/5] rounded-[1.15rem] border-[3px] border-brand-brown/90 bg-[#FFF8E1] flex items-center justify-center overflow-hidden">
                  <div className="text-center text-brand-gold-dark/80">
                    <svg className="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm font-semibold uppercase tracking-[0.24em]">Image</p>
                  </div>
                </div>

                <div className="pt-5 sm:pt-6 text-center">
                  <h2 className="text-xl sm:text-2xl font-extrabold uppercase tracking-[0.08em] text-brand-brown">
                    {leader.name}
                  </h2>
                  <p className="mt-2 text-sm font-bold uppercase tracking-[0.24em] text-brand-gold-dark">
                    {leader.role}
                  </p>
                  <p className="mt-5 text-sm sm:text-base text-gray-600 leading-relaxed">
                    {leader.message}
                  </p>
                </div>
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
                  <svg className="w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-3 text-brand-gold-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.868v4.264a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
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
