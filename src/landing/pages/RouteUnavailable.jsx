import { useLocation } from 'react-router-dom';
import RouteBlockerCard from '../components/RouteBlockerCard';

export default function RouteUnavailable() {
  const location = useLocation();
  const invalidPath = `${location.pathname}${location.search}${location.hash}` || '/';

  return (
    <section className="relative overflow-hidden bg-dot-grid pb-16 pt-36 sm:pb-20 sm:pt-40 lg:pb-24" style={{ backgroundColor: '#FFFDF5' }}>
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 15% 20%, rgba(212,165,40,0.14), transparent 28%), radial-gradient(circle at 85% 18%, rgba(89,34,25,0.08), transparent 24%), linear-gradient(135deg, rgba(255,255,255,0.66) 0%, rgba(255,248,225,0.2) 100%)',
        }}
      />
      <div className="pointer-events-none absolute right-[-8%] top-16 size-[26rem] rounded-full blur-3xl" style={{ background: 'rgba(212,165,40,0.12)' }} />
      <div className="pointer-events-none absolute bottom-[-6rem] left-[-4rem] size-[20rem] rounded-full blur-3xl" style={{ background: 'rgba(89,34,25,0.08)' }} />

      <div className="section-container relative z-10">
        <div className="mb-8 max-w-3xl">
          <div className="mb-5 flex items-center gap-3">
            <div className="h-0.5 w-8 rounded-full" style={{ background: 'linear-gradient(90deg, #B8860B, #D4A528)' }} />
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#B8860B' }}>
              NOGATU Alliance
            </span>
          </div>
          <p className="max-w-xl text-sm leading-7 sm:text-base" style={{ color: '#6d3028' }}>
            This URL is outside the published landing experience. The page below is intentionally shown as a blocker instead of silently redirecting to the homepage.
          </p>
        </div>

        <RouteBlockerCard invalidPath={invalidPath} />
      </div>
    </section>
  );
}
