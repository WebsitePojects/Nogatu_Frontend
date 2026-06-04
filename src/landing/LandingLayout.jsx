import { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { HiOutlineMenu, HiOutlineX } from 'react-icons/hi';

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About Us' },
  { to: '/products', label: 'Our Products' },
  { to: '/news', label: 'News & Updates' },
  { to: '/organizations', label: 'People Behind the Company' },
  { to: '/certifications', label: 'Certifications' },
  { to: '/contact', label: 'Contact Us' },
];

function scrollToCurrentRouteTarget(location) {
  if (location.hash) {
    window.requestAnimationFrame(() => {
      const target = document.getElementById(location.hash.slice(1));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
    return;
  }

  window.scrollTo(0, 0);
}

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const routeLocation = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    scrollToCurrentRouteTarget(routeLocation);
  }, [routeLocation]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-500 pt-3">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={`relative rounded-3xl overflow-hidden flex items-center justify-between h-[72px] px-4 sm:px-6 transition-all duration-500 border ${
            scrolled
              ? 'bg-white/70 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.08)] border-white/50'
              : 'bg-white/40 backdrop-blur-lg border-white/30 shadow-[0_4px_24px_rgba(0,0,0,0.04)] hover:bg-white/60'
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-brand-gold/10 via-transparent to-primary-400/10 opacity-50 pointer-events-none mix-blend-overlay" />

          <a href="/portal/admin/login" className="relative flex items-center gap-3 group z-10 min-w-0 sm:w-[220px]">
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 bg-brand-gold blur-md opacity-0 group-hover:opacity-40 transition-opacity duration-500 rounded-full" />
              <img
                src="/img/nogatu_logo.png"
                alt="NOGATU Alliance"
                className="relative size-11 rounded-full object-contain border border-white/60 shadow-sm motion-safe:transition-transform motion-safe:duration-500 group-hover:scale-105 group-hover:rotate-3"
              />
            </div>
            <span className="truncate font-extrabold text-sm sm:text-base tracking-tight text-brand-brown bg-clip-text">
              NOGATU <span className="text-brand-gold-dark font-medium">Alliance</span>
            </span>
          </a>

          <div className="hidden lg:flex items-center justify-center gap-1 z-10 flex-1 min-w-0 px-4">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  `relative px-2.5 xl:px-3 py-2 rounded-xl text-[11px] xl:text-[12px] font-semibold whitespace-nowrap motion-safe:transition-all motion-safe:duration-300 group overflow-hidden ${
                    isActive ? 'text-brand-gold-dark' : 'text-gray-600 hover:text-brand-brown'
                  }`
                }
                title={link.label}
              >
                {({ isActive }) => (
                  <>
                    <span className="relative z-10">{link.label}</span>
                    {isActive && <div className="absolute inset-0 bg-brand-gold/10 rounded-xl" />}
                    <div className="absolute inset-0 bg-white/40 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out rounded-xl" />
                  </>
                )}
              </NavLink>
            ))}
          </div>

          <div className="flex items-center justify-end gap-3 z-10 sm:w-[220px]">
            <a
              href="/portal/login"
              className="relative hidden sm:inline-flex items-center justify-center gap-2 px-7 py-2.5 rounded-full text-white text-sm font-bold motion-safe:transition-all motion-safe:duration-300 shadow-lg hover:shadow-brand-gold/40 border border-white/20 group overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #B8860B 0%, #D4A528 50%, #E7C679 100%)' }}
            >
              <div className="absolute inset-0 size-full bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-[200%] transition-transform duration-1000 ease-in-out" />
              <span className="relative z-10 drop-shadow-sm">Members Area</span>
            </a>
            <button
              onClick={() => setMobileOpen((current) => !current)}
              className="lg:hidden relative p-2.5 rounded-xl text-brand-brown bg-white/50 hover:bg-white border border-white/50 motion-safe:transition-all shadow-sm cursor-pointer z-10"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
             type="button">
              {mobileOpen ? <HiOutlineX className="size-5" /> : <HiOutlineMenu className="size-5" />}
            </button>
          </div>
        </div>
      </div>

      <div className={`lg:hidden transition-all duration-300 overflow-hidden ${mobileOpen ? 'max-h-[420px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="mx-4 sm:mx-6 lg:mx-8 mt-1 bg-white/95 backdrop-blur-xl border border-primary-200/40 rounded-2xl p-4 space-y-1 shadow-xl">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                `block px-4 py-3 rounded-xl text-sm font-medium motion-safe:transition-colors ${
                  isActive ? 'text-brand-gold-dark bg-primary-100/60' : 'text-gray-700 hover:bg-primary-50'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
          <a
            href="/portal/login"
            className="block px-4 py-3 rounded-full text-sm font-semibold text-white text-center mt-1 cursor-pointer border border-brand-gold-dark"
            style={{ background: 'linear-gradient(135deg, #B8860B 0%, #D4A528 100%)' }}
          >
            Members Login
          </a>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="text-white/70 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #3A1000 0%, #592219 50%, #3A1000 100%)' }}>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(212,165,40,0.08) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="section-container py-16 lg:py-20 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-5">
              <img src="/img/nogatu_logo.png" alt="NOGATU Alliance" className="size-12 rounded-lg border border-brand-gold/30" />
              <span className="text-white font-bold text-lg">NOGATU Alliance</span>
            </div>
            <p className="text-sm leading-relaxed mb-6 text-white/50">
              Empowering people through high-quality health and wellness products with competitive marketing incentives.
            </p>
            <div className="flex gap-3">
              {[
                { icon: 'M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z', label: 'Twitter' },
                { icon: 'M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z', label: 'Facebook' },
                { icon: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z', label: 'Instagram' },
              ].map(({ icon, label }) => (
                <a key={label} href="#" aria-label={label} className="size-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-brand-gold motion-safe:transition-all motion-safe:duration-300 group cursor-pointer">
                  <svg className="size-4 fill-current text-white/50 group-hover:text-white motion-safe:transition-colors" viewBox="0 0 24 24"><path d={icon} /></svg>
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-brand-gold-light font-semibold text-sm mb-4">Quick Links</h4>
            <ul className="space-y-3">
              {NAV_LINKS.map((link) => (
                <li key={link.to}><NavLink to={link.to} className="text-sm text-white/50 hover:text-brand-gold-light motion-safe:transition-colors">{link.label}</NavLink></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-brand-gold-light font-semibold text-sm mb-4">Our Products</h4>
            <ul className="space-y-3 text-sm text-white/50">
              <li>Nogatu Barley Juice</li><li>Nogatu Glow</li><li>Vitamin C with Collagen &amp; Glutathione</li><li>Chocolate Drink Mix</li><li>Nogatu Coffee Mix</li><li>Mangosteen Coffee Mix</li><li>Vitamin C with Zinc &amp; Mangosteen</li><li>Nogatu Black Coffee</li><li>Nogatu Max Fuel Coffee Drink Mix</li><li>Berry NAD+</li>
            </ul>
          </div>

          <div>
            <h4 className="text-brand-gold-light font-semibold text-sm mb-4">Contact Info</h4>
            <ul className="space-y-4 text-sm text-white/50">
              <li className="flex gap-3">
                <svg className="size-5 flex-shrink-0 mt-0.5 text-brand-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <span>94 Navarro Street, Maligaya Park, Brgy 177, Caloocan City</span>
              </li>
              <li className="flex gap-3">
                <svg className="size-5 flex-shrink-0 text-brand-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                <span>+632 0908 888 888</span>
              </li>
              <li className="flex gap-3">
                <svg className="size-5 flex-shrink-0 text-brand-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                <span>info@nogatualliance.com</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 relative z-10">
        <div className="section-container py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/40">&copy; {new Date().getFullYear()} NOGATU Alliance. All rights reserved.</p>
          <p className="text-xs text-white/30">Mon-Sat: 11AM - 8PM | Sunday: Closed</p>
        </div>
      </div>
    </footer>
  );
}

export default function LandingLayout() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main><Outlet /></main>
      <Footer />
    </div>
  );
}
