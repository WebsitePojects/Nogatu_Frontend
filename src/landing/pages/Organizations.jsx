import React from 'react';

export default function Organizations() {
  return (
    <div className="pt-32 pb-20 min-h-screen bg-[#FFFDF5] relative overflow-hidden">
      {/* Minimalist Background Pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <div className="absolute top-0 right-[-10%] w-[50%] h-[50%] rounded-full bg-primary-100 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-brand-gold/10 blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header Section */}
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <span className="inline-block px-4 py-1.5 rounded-full bg-brand-gold/10 text-brand-gold-dark font-medium text-sm mb-4 border border-brand-gold/20">
            Our Structure
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-brand-brown mb-6">
            Organizations
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed">
            Discover the network of leaders and organizations driving success within the NOGATU Alliance.
          </p>
        </div>

        {/* Minimalist Organizational Structure Template */}
        <div className="relative mt-20">
          <div className="bg-white/80 backdrop-blur-md border border-gray-100 shadow-2xl rounded-3xl p-8 md:p-12">
            
            {/* Tier 1: CEO / Founder */}
            <div className="flex justify-center mb-12">
              <div className="text-center relative group">
                <div className="w-24 h-24 mx-auto bg-gradient-to-br from-brand-gold to-amber-600 rounded-full p-1 shadow-lg group-hover:scale-105 transition-transform duration-300">
                  <div className="w-full h-full bg-white rounded-full flex items-center justify-center overflow-hidden border-2 border-white">
                    <img src="/img/nogatu_logo.png" alt="Founder" className="w-16 h-16 object-cover" />
                  </div>
                </div>
                <h3 className="mt-4 font-bold text-lg text-brand-brown">Leadership</h3>
                <p className="text-sm text-gray-500">Board of Directors</p>
                {/* Connecting Line Down */}
                <div className="hidden md:block absolute w-px h-12 bg-gradient-to-b from-brand-gold/50 to-gray-200 left-1/2 -ml-[0.5px] -bottom-12" />
              </div>
            </div>

            {/* Horizontal Connecting Line */}
            <div className="hidden md:block relative max-w-4xl mx-auto mb-12">
               <div className="h-px bg-gray-200 w-full" />
               <div className="absolute w-px h-12 bg-gray-200 left-[16.66%] top-0" />
               <div className="absolute w-px h-12 bg-gray-200 left-1/2 top-0" />
               <div className="absolute w-px h-12 bg-gray-200 left-[83.33%] top-0" />
            </div>

            {/* Tier 2: Departments / Teams */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4 max-w-5xl mx-auto">
              {/* Branch 1 */}
              <div className="text-center flex flex-col items-center">
                <div className="w-20 h-20 bg-white rounded-2xl shadow-md border border-gray-100 flex items-center justify-center mb-4 relative z-10 hover:shadow-xl hover:border-primary-300 transition-all duration-300 group">
                   <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center group-hover:bg-primary-100 transition-colors">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                   </div>
                </div>
                <h4 className="font-semibold text-brand-brown">Network Leaders</h4>
                <p className="text-xs text-gray-500 mt-1 px-4">Top earning distributors and diamond executives</p>
              </div>

              {/* Branch 2 */}
              <div className="text-center flex flex-col items-center relative">
                <div className="w-20 h-20 bg-white rounded-2xl shadow-md border border-gray-100 flex items-center justify-center mb-4 relative z-10 hover:shadow-xl hover:border-brand-gold/50 transition-all duration-300 group">
                   <div className="w-12 h-12 rounded-xl bg-amber-50 text-brand-gold-dark flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                   </div>
                </div>
                <h4 className="font-semibold text-brand-brown">Regional Centers</h4>
                <p className="text-xs text-gray-500 mt-1 px-4">Distribution hubs and product centers</p>
              </div>

              {/* Branch 3 */}
              <div className="text-center flex flex-col items-center relative">
                <div className="w-20 h-20 bg-white rounded-2xl shadow-md border border-gray-100 flex items-center justify-center mb-4 relative z-10 hover:shadow-xl hover:border-emerald-300 transition-all duration-300 group">
                   <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                   </div>
                </div>
                <h4 className="font-semibold text-brand-brown">Product Suppliers</h4>
                <p className="text-xs text-gray-500 mt-1 px-4">Health, wellness, and beauty partners</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}