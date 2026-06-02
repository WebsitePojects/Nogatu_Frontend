import { Link } from 'react-router-dom';

export default function RouteBlockerCard({ invalidPath }) {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-white/50 bg-white/78 p-8 shadow-[0_25px_80px_rgba(89,34,25,0.12)] backdrop-blur-2xl sm:p-10 lg:p-12">
      <div
        className="absolute inset-x-0 top-0 h-1"
        style={{ background: 'linear-gradient(90deg, transparent, #D4A528 50%, transparent)' }}
      />
      <div className="absolute -right-14 top-8 size-40 rounded-full bg-brand-gold/10 blur-3xl" />
      <div className="absolute -left-10 bottom-0 size-32 rounded-full blur-3xl" style={{ background: 'rgba(89,34,25,0.08)' }} />

      <div className="relative z-10">
        <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-brand-gold/20 bg-white/80 px-4 py-2 shadow-sm">
          <span className="flex size-10 items-center justify-center rounded-full text-brand-gold-dark" style={{ background: 'rgba(212,165,40,0.12)' }}>
            <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v4m0 4h.01M10.29 3.86l-7.46 12.92A2 2 0 004.56 20h14.88a2 2 0 001.73-3.22L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </span>
          <div>
            <p className="text-[0.68rem] font-black uppercase tracking-[0.28em] text-brand-gold-dark">Unavailable Route</p>
            <p className="text-xs text-gray-500">This public page does not exist in the landing site.</p>
          </div>
        </div>

        <h1 className="max-w-2xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-[3.5rem]" style={{ color: '#3A1000' }}>
          We blocked this page to keep visitors out of invalid URLs.
        </h1>

        <p className="mt-5 max-w-2xl text-base leading-8 sm:text-lg" style={{ color: '#6d3028' }}>
          The address you opened is not part of the published landing routes. Use one of the valid public pages below to continue browsing.
        </p>

        <div className="mt-7 rounded-2xl border border-brand-gold/20 bg-white/70 p-4 sm:p-5">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand-gold-dark">Requested Path</p>
          <p className="mt-2 break-all text-sm font-semibold sm:text-base" style={{ color: '#592219' }}>
            {invalidPath}
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link to="/" className="btn-landing-primary">
            Return Home
          </Link>
          <Link to="/products" className="btn-landing-secondary">
            Browse Products
          </Link>
        </div>

      </div>
    </div>
  );
}
