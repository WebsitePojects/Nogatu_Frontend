const LEADERS = [
  { name: 'Harold M. Tugano', role: 'Chairman' },
  { name: 'Sherwin Catera', role: 'CEO' },
  { name: 'Yoren Abihay', role: 'President' },
  { name: 'Cecilia Haspe', role: 'Vice President' },
  { name: 'Dino S. Erfe', role: 'Manager' },
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
            Meet the important people of NOGATU Alliance, the leaders guiding the company, supporting the network, and inspiring the community forward.
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="space-y-5 sm:space-y-6">
            {LEADERS.map((leader, index) => (
              <div key={leader.name} className="relative">
                {index > 0 && (
                  <div className="hidden sm:block absolute left-1/2 -top-6 h-6 w-px bg-brand-gold/40" />
                )}
                <div className="grid grid-cols-1 sm:grid-cols-[220px_1fr] gap-4 sm:gap-6 items-stretch">
                  <div className="rounded-2xl border border-brand-gold/30 bg-white shadow-sm p-4 flex items-center gap-4">
                    <div className="w-20 h-20 rounded-xl bg-[#FFF8E1] border-2 border-dashed border-brand-gold/40 flex items-center justify-center flex-shrink-0">
                      <svg className="w-9 h-9 text-brand-gold-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </div>
                    <div>
                      <p className="font-extrabold uppercase tracking-wide text-brand-brown leading-tight">{leader.name}</p>
                      <p className="text-sm font-semibold uppercase text-brand-gold-dark mt-2">{leader.role}</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-primary-200/40 bg-white/85 shadow-sm p-5 sm:p-6">
                    <p className="text-xs font-bold uppercase tracking-wider text-brand-gold-dark mb-2">Message for NOGATU</p>
                    <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                      Reserved space for {leader.name}'s company message, personal note, or motivational quote.
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
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
