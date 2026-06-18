import { useState, useEffect, useCallback } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import api from '../api';
import useSupportStream from '../hooks/useSupportStream';
import {
  HiOutlineHome, HiOutlineCreditCard, HiOutlineUser, HiOutlineKey,
  HiOutlineUsers, HiOutlineChartBar, HiOutlineGift, HiOutlineDocumentText,
  HiOutlineArrowUp, HiOutlineUserAdd, HiOutlineLogout, HiOutlineMenu,
  HiOutlineX, HiOutlineBell, HiOutlineSun, HiOutlineMoon,
  HiOutlineSupport, HiOutlineShieldCheck, HiOutlineTrendingUp, HiOutlineStar,
  HiOutlineViewGrid,
} from 'react-icons/hi';
import { FaSitemap } from 'react-icons/fa';
import CodeUseConfirmModal from '../components/CodeUseConfirmModal';
import { getViewAs, clearViewAs } from '../lib/viewAs';

/* ─── Nav data ──────────────────────────────────────────────── */

const NAV_GROUPS = [
  {
    label: 'Main',
    items: [
      { to: '/dashboard',    label: 'Dashboard',         icon: HiOutlineHome },
      { to: '/ewallet',      label: 'E-Wallet',          icon: HiOutlineCreditCard },
    ],
  },
  {
    label: 'Network',
    items: [
      { to: '/referrals',                        label: 'Direct Referrals',       icon: HiOutlineUsers },
      { to: '/genealogy',                        label: 'Genealogy Tree',         icon: FaSitemap },
      { to: '/unilevel',                         label: 'Unilevel Tree',          icon: FaSitemap },
      { to: '/pairing',                          label: 'Pairing Reports',        icon: HiOutlineChartBar },
      { to: '/dashboard/details/uni-level',      label: 'Uni-Level',             icon: HiOutlineTrendingUp },
      { to: '/dashboard/details/leadership-bonus', label: 'Leadership',          icon: HiOutlineStar },
      { to: '/dashboard/details/ranking-bonus',  label: 'Ranking Bonus',         icon: HiOutlineShieldCheck },
      { to: '/hifive',                           label: 'Hi-Five Bonus',          icon: HiOutlineGift },
      { to: '/ranking',                          label: 'Rank Progress',         icon: HiOutlineShieldCheck },
      { to: '/leaderboard',                      label: 'Leaderboard',           icon: HiOutlineChartBar },
    ],
  },
  {
    label: 'Account',
    items: [
      { to: '/codes',         label: 'Activation Codes', icon: HiOutlineKey },
      { to: '/upgrade',       label: 'Upgrade',          icon: HiOutlineArrowUp },
      { to: '/register',      label: 'Register',         icon: HiOutlineUserAdd },
      { to: '/referral-invite', label: 'Referral ID',    icon: HiOutlineUserAdd },
      { to: '/transactions',  label: 'Transactions',     icon: HiOutlineDocumentText },
      { to: '/vouchers',      label: 'Vouchers',         icon: HiOutlineGift },
      { to: '/account',       label: 'Account',          icon: HiOutlineUser },
      { to: '/support',       label: 'Support',          icon: HiOutlineSupport },
    ],
  },
];

const NETWORK_PREFIXES = [
  '/referrals', '/genealogy', '/unilevel', '/pairing', '/hifive', '/ranking', '/leaderboard',
  '/dashboard/details',
];
const ACCOUNT_PATHS = [
  '/upgrade', '/register', '/referral-invite', '/transactions', '/vouchers', '/account', '/support',
];

const BOTTOM_NAV = [
  { id: 'home',    label: 'Home',    icon: HiOutlineHome,        to: '/dashboard' },
  { id: 'wallet',  label: 'Wallet',  icon: HiOutlineCreditCard,  to: '/ewallet' },
  { id: 'network', label: 'Network', icon: HiOutlineUsers,       drawer: 'network' },
  { id: 'codes',   label: 'Codes',   icon: HiOutlineKey,         to: '/codes' },
  { id: 'menu',    label: 'Menu',    icon: HiOutlineViewGrid,    drawer: 'menu' },
];

/* ─── Helpers ──────────────────────────────────────────────── */

const GoldOrb = ({ size, top, left, opacity }) => (
  <div
    className="absolute rounded-full pointer-events-none"
    style={{
      width: size, height: size, top, left,
      background: 'radial-gradient(circle, rgba(212,175,55,0.18) 0%, transparent 70%)',
      opacity,
      filter: 'blur(24px)',
    }}
  />
);

/* ─── Layout ────────────────────────────────────────────────── */

export default function MemberLayout() {
  const { user, logoutMember } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  // Support unread badge — suppressed while inside the support area (list/thread).
  const onSupportPage = location.pathname.startsWith('/support');
  const [supportUnread, setSupportUnread] = useState(0);
  const refreshSupportUnread = useCallback(async () => {
    try {
      const res = await api.get('/support/meta/unread-count');
      setSupportUnread(Number(res.data?.unread || 0));
    } catch { /* ignore */ }
  }, []);
  useEffect(() => { refreshSupportUnread(); }, [refreshSupportUnread, location.pathname]);
  useSupportStream(useCallback((event) => {
    if (event === 'support.reply' || event === 'support.status') refreshSupportUnread();
  }, [refreshSupportUnread]));
  const showSupportBadge = !onSupportPage && supportUnread > 0;

  const [sidebarOpen,      setSidebarOpen]      = useState(false);
  const [scrolled,         setScrolled]         = useState(false);
  const [showLogoutConfirm,setShowLogoutConfirm] = useState(false);
  const [activeDrawer,     setActiveDrawer]     = useState(null); // null | 'network' | 'menu'

  /* Topbar scroll-shadow */
  useEffect(() => {
    const el = document.querySelector('.main-scroll');
    if (!el) return;
    const handler = () => setScrolled(el.scrollTop > 8);
    el.addEventListener('scroll', handler, { passive: true });
    return () => el.removeEventListener('scroll', handler);
  }, []);

  /* Close drawer on route change */
  useEffect(() => { setActiveDrawer(null); }, [location.pathname]);

  const handleLogout = async () => {
    await logoutMember();
    navigate('/login');
  };

  /* Active checks */
  const isItemActive = (path) =>
    location.pathname === path || location.pathname === `/portal${path}`;

  const isNetworkActive = NETWORK_PREFIXES.some(
    p => location.pathname.startsWith(p) || location.pathname.startsWith(`/portal${p}`)
  );
  const isAccountActive = ACCOUNT_PATHS.some(p => isItemActive(p));

  const getBottomTabActive = (item) => {
    if (item.id === 'home')    return isItemActive('/dashboard');
    if (item.id === 'wallet')  return isItemActive('/ewallet');
    if (item.id === 'network') return isNetworkActive;
    if (item.id === 'codes')   return isItemActive('/codes');
    if (item.id === 'menu')    return isAccountActive;
    return false;
  };

  const handleBottomTap = (item) => {
    if (item.drawer) {
      setActiveDrawer(prev => prev === item.drawer ? null : item.drawer);
    } else {
      navigate(item.to);
    }
  };

  const currentPage = NAV_GROUPS.flatMap(g => g.items).find(
    i => location.pathname === i.to || location.pathname === `/portal${i.to}`
  );

  const viewAs = getViewAs();
  const acctInitial = user?.shortname?.charAt(0)?.toUpperCase() || 'M';
  const networkItems = NAV_GROUPS.find(g => g.label === 'Network')?.items || [];
  const accountItems = NAV_GROUPS.find(g => g.label === 'Account')?.items || [];

  return (
    <>
      {viewAs && (
        <div
          className="fixed top-2 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 rounded-full px-4 py-1.5 text-xs font-semibold shadow-lg"
          style={{ background: 'rgba(180,83,9,0.96)', color: '#fff', border: '1px solid rgba(251,191,36,0.55)' }}
        >
          <HiOutlineShieldCheck className="size-4 flex-shrink-0" />
          <span className="truncate max-w-[60vw]">
            Admin read-only view — {viewAs.fullName || viewAs.username} (@{viewAs.username})
          </span>
          <button
            type="button"
            onClick={() => { clearViewAs(); window.location.href = '/portal/admin/accounts'; }}
            className="rounded-full px-2.5 py-0.5"
            style={{ background: 'rgba(0,0,0,0.28)' }}
          >
            Exit
          </button>
        </div>
      )}

      <CodeUseConfirmModal
        open={showLogoutConfirm}
        tone="gold"
        title="Sign out now?"
        message="You will be signed out of the member portal and returned to the login screen."
        confirmLabel="Sign Out"
        cancelLabel="Stay Signed In"
        onConfirm={async () => { setShowLogoutConfirm(false); await handleLogout(); }}
        onClose={() => setShowLogoutConfirm(false)}
      />

      <div className="flex h-screen overflow-hidden portal-bg">

        {/* ══ DESKTOP SIDEBAR ═══════════════════════════════════ */}
        <aside
          className={`
            fixed inset-y-0 left-0 z-50 w-[268px] glass-sidebar flex flex-col
            motion-safe:transition-transform motion-safe:duration-300 ease-out
            lg:translate-x-0 lg:static lg:flex-shrink-0
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          <GoldOrb size="200px" top="-60px"  left="-60px"  opacity={0.6} />
          <GoldOrb size="160px" top="60%"    left="60%"    opacity={0.4} />

          {/* Logo */}
          <div className="relative flex items-center gap-3.5 p-5 border-b" style={{ borderColor: 'rgba(212,175,55,0.08)' }}>
            <div className="relative flex-shrink-0">
              <img src="/img/nogatu_logo.png" alt="NOGATU Alliance"
                className="size-11 rounded-xl object-contain"
                style={{ border: '1px solid rgba(212,175,55,0.25)', background: 'rgba(212,175,55,0.06)', boxShadow: '0 4px 16px rgba(212,175,55,0.15)' }} />
              <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-obsidian-900"
                style={{ background: '#22c55e', boxShadow: '0 0 6px rgba(34,197,94,0.6)' }} />
            </div>
            <div>
              <h1 className="font-brand text-[13px] font-semibold tracking-wide" style={{ color: 'var(--brand-gold)' }}>NOGATU</h1>
              <p className="sidebar-brand-subtitle text-[10px] font-medium tracking-wider uppercase">Member Portal</p>
            </div>
            <button onClick={() => setSidebarOpen(false)}
              className="lg:hidden ml-auto p-1.5 rounded-lg portal-card-muted hover:text-[var(--portal-title)] hover:bg-white/[0.05] transition-colors"
              type="button">
              <HiOutlineX className="size-4" />
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5 scrollbar-thin">
            {NAV_GROUPS.map((group) => (
              <div key={group.label}>
                <p className="text-[9.5px] font-bold uppercase tracking-[0.14em] px-3 mb-1.5"
                  style={{ color: 'var(--portal-gold-text)' }}>
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {group.items.map((item) => (
                    <button key={item.to} type="button"
                      onClick={() => { setSidebarOpen(false); navigate(item.to); }}
                      className={`nav-item w-full text-left${isItemActive(item.to) ? ' active' : ''}`}>
                      <item.icon className="size-[17px] flex-shrink-0" />
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          {/* User + sign-out */}
          <div className="border-t p-3.5" style={{ borderColor: 'rgba(212,175,55,0.08)' }}>
            <div className="flex items-center gap-3 p-2 mb-1">
              <div className="size-9 rounded-xl flex items-center justify-center text-always-white font-bold text-sm flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #9A7B0A 0%, #D4AF37 50%, #F2D06B 100%)', boxShadow: '0 4px 12px rgba(212,175,55,0.3)' }}>
                {acctInitial}
              </div>
              <div className="flex-1 min-w-0">
                <p className="sidebar-user-name text-sm font-semibold truncate">{user?.shortname || 'Member'}</p>
                <p className="sidebar-user-type text-[10.5px] truncate">{user?.caccttype} Account</p>
              </div>
            </div>
            <button onClick={() => setShowLogoutConfirm(true)}
              className="nav-item w-full cursor-pointer"
              style={{ color: 'var(--portal-card-muted)' }}
              type="button">
              <HiOutlineLogout className="size-[17px]" />
              Sign Out
            </button>
          </div>
        </aside>

        {/* Sidebar overlay (desktop fallback) */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 lg:hidden"
            style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
            onClick={() => setSidebarOpen(false)} />
        )}

        {/* ══ MAIN AREA ══════════════════════════════════════════ */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Topbar */}
          <header
            className={`glass-topbar px-4 lg:px-7 flex items-center justify-between flex-shrink-0 transition-shadow duration-300 ${scrolled ? 'shadow-obsidian' : ''}`}
            style={{ height: '60px' }}
          >
            {/* Left */}
            <div className="flex items-center gap-3">

              {/* Mobile: compact logo + current page */}
              <div className="flex lg:hidden items-center gap-2.5">
                <div className="relative flex-shrink-0">
                  <img src="/img/nogatu_logo.png" alt="NOGATU"
                    className="size-8 rounded-lg object-contain"
                    style={{ border: '1px solid rgba(212,175,55,0.22)', background: 'rgba(212,175,55,0.06)' }} />
                </div>
                <div className="leading-none">
                  <p className="font-brand text-[11px] font-semibold tracking-wide" style={{ color: 'var(--brand-gold)' }}>NOGATU</p>
                  <p className="text-[8.5px] font-medium tracking-widest" style={{ color: 'rgba(212,175,55,0.5)' }}>ALLIANCE</p>
                </div>
              </div>

              {/* Mobile: page title (separator) */}
              <div className="lg:hidden h-5 w-px mx-0.5" style={{ background: 'rgba(212,175,55,0.15)' }} />
              <p className="lg:hidden portal-page-title text-[13px] font-semibold leading-none truncate max-w-[140px]">
                {currentPage?.label || 'Dashboard'}
              </p>

              {/* Desktop: hamburger + page title */}
              <button onClick={() => setSidebarOpen(true)}
                className="hidden p-2 -ml-1.5 rounded-xl portal-card-muted hover:text-[var(--portal-title)] hover:bg-white/[0.05] transition-colors"
                aria-label="Open menu" type="button">
                <HiOutlineMenu className="size-5" />
              </button>
              <div className="hidden lg:block">
                <p className="portal-page-title text-sm font-semibold leading-none">{currentPage?.label || 'Dashboard'}</p>
                <p className="hero-welcome-subtitle text-[11px] mt-0.5">Welcome back, {user?.shortname}</p>
              </div>
            </div>

            {/* Right */}
            <div className="flex items-center gap-1">
              <button onClick={() => navigate('/support')}
                className="p-2 rounded-xl portal-card-muted hover:text-[var(--portal-gold-text)] transition-colors relative"
                title="Customer Support" aria-label="Customer Support" type="button">
                <HiOutlineSupport className="size-[18px]" />
                {showSupportBadge && (
                  <span
                    className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center text-[9px] font-bold text-always-white"
                    style={{ background: '#dc2626', border: '1.5px solid var(--glass-topbar-bg, #1a1a1a)' }}
                    aria-label={`${supportUnread} unread support replies`}
                  >
                    {supportUnread > 9 ? '9+' : supportUnread}
                  </span>
                )}
              </button>
              <button onClick={toggleTheme}
                className="p-2 rounded-xl portal-card-muted hover:text-[var(--portal-gold-text)] transition-colors"
                title="Toggle Theme" type="button">
                {isDarkMode ? <HiOutlineSun className="size-[18px]" /> : <HiOutlineMoon className="size-[18px]" />}
              </button>


              {/* Desktop: full user chip */}
              <div className="hidden sm:flex items-center gap-2.5 pl-3 ml-1 border-l" style={{ borderColor: 'rgba(212,175,55,0.1)' }}>
                <div className="text-right">
                  <p className="text-[13px] font-semibold portal-page-title leading-none">{user?.accountname}</p>
                  <p className="topbar-account-tier text-[10.5px] mt-0.5">{user?.caccttype}</p>
                </div>
                <div className="size-8 rounded-xl flex items-center justify-center text-sm font-bold text-always-white"
                  style={{ background: 'linear-gradient(135deg, #9A7B0A, #D4AF37)', boxShadow: '0 2px 8px rgba(212,175,55,0.25)' }}>
                  {acctInitial}
                </div>
              </div>

              {/* Mobile: avatar only */}
              <div className="sm:hidden size-8 rounded-xl flex items-center justify-center text-sm font-bold text-always-white ml-1"
                style={{ background: 'linear-gradient(135deg, #9A7B0A, #D4AF37)', boxShadow: '0 2px 8px rgba(212,175,55,0.25)' }}>
                {acctInitial}
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="main-scroll flex-1 overflow-y-auto p-4 lg:p-7 member-main-content">
            <Outlet />
          </main>
        </div>

        {/* ══ DRAWER OVERLAY ════════════════════════════════════ */}
        {activeDrawer && (
          <div
            className="fixed inset-0 z-[38] lg:hidden"
            style={{ background: 'rgba(0,0,0,0.62)', backdropFilter: 'blur(6px)' }}
            onClick={() => setActiveDrawer(null)}
          />
        )}

        {/* ══ NETWORK DRAWER ════════════════════════════════════ */}
        <div className={`member-drawer lg:hidden ${activeDrawer === 'network' ? 'open' : ''}`}>
          <div className="drawer-handle-bar" />

          {/* Header */}
          <div className="flex items-center justify-between px-5 pb-4">
            <div>
              <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] mb-0.5"
                style={{ color: 'var(--portal-gold-text)' }}>Network</p>
              <h3 className="text-[15px] font-semibold" style={{ color: 'var(--portal-title)' }}>
                Income &amp; Genealogy
              </h3>
            </div>
            <button onClick={() => setActiveDrawer(null)}
              className="p-2 rounded-xl portal-card-muted hover:bg-white/5 transition-colors"
              type="button">
              <HiOutlineX className="size-5" />
            </button>
          </div>

          {/* Grid */}
          <div className="px-4 pb-2 grid grid-cols-3 gap-2.5">
            {networkItems.map(item => (
              <button key={item.to} type="button"
                onClick={() => navigate(item.to)}
                className={`drawer-nav-tile ${isItemActive(item.to) ? 'active' : ''}`}>
                <item.icon className="size-[22px] flex-shrink-0" />
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          {/* Safe area clearance */}
          <div className="drawer-bottom-padding" />
        </div>

        {/* ══ MENU DRAWER ═══════════════════════════════════════ */}
        <div className={`member-drawer lg:hidden ${activeDrawer === 'menu' ? 'open' : ''}`}>
          <div className="drawer-handle-bar" />

          {/* Header */}
          <div className="flex items-center justify-between px-5 pb-4">
            <div>
              <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] mb-0.5"
                style={{ color: 'var(--portal-gold-text)' }}>Account</p>
              <h3 className="text-[15px] font-semibold" style={{ color: 'var(--portal-title)' }}>
                Your Account
              </h3>
            </div>
            <button onClick={() => setActiveDrawer(null)}
              className="p-2 rounded-xl portal-card-muted hover:bg-white/5 transition-colors"
              type="button">
              <HiOutlineX className="size-5" />
            </button>
          </div>

          {/* Grid */}
          <div className="px-4 grid grid-cols-3 gap-2.5 pb-3 overflow-y-auto" style={{ maxHeight: '44vh' }}>
            {accountItems.map(item => (
              <button key={item.to} type="button"
                onClick={() => navigate(item.to)}
                className={`drawer-nav-tile ${isItemActive(item.to) ? 'active' : ''}`}>
                <item.icon className="size-[22px] flex-shrink-0" />
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          {/* Sign-out row */}
          <div className="px-4 pt-3 drawer-bottom-padding" style={{ borderTop: '1px solid rgba(212,175,55,0.1)' }}>
            <button
              onClick={() => { setActiveDrawer(null); setShowLogoutConfirm(true); }}
              type="button"
              className="flex items-center gap-3 w-full px-4 py-3.5 rounded-2xl text-left transition-all active:scale-[0.98]"
              style={{
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.16)',
                color: '#f87171',
              }}
            >
              <HiOutlineLogout className="size-5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold leading-none">Sign Out</p>
                <p className="text-[10.5px] mt-0.5" style={{ color: 'rgba(248,113,113,0.65)' }}>
                  {user?.shortname}
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* ══ MOBILE BOTTOM NAV ══════════════════════════════════ */}
        <nav className="mobile-bottom-nav lg:hidden">
          <div className="flex items-stretch justify-around" style={{ height: '64px' }}>
            {BOTTOM_NAV.map((item) => {
              const isActive  = getBottomTabActive(item);
              const isOpen    = activeDrawer === item.drawer;
              const lit       = isActive || isOpen;

              return (
                <button key={item.id} type="button"
                  className="bottom-nav-tab"
                  onClick={() => handleBottomTap(item)}>
                  {lit && <span className="bottom-nav-indicator" />}
                  <div className={`bottom-nav-icon-wrap ${lit ? 'active' : ''}`}>
                    <item.icon className="size-[22px]" />
                  </div>
                  <span className={`bottom-nav-label ${lit ? 'active' : ''}`}>{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

      </div>
    </>
  );
}
