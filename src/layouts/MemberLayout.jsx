import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  HiOutlineHome, HiOutlineCreditCard, HiOutlineUser, HiOutlineKey,
  HiOutlineUsers, HiOutlineChartBar, HiOutlineGift, HiOutlineDocumentText,
  HiOutlineArrowUp, HiOutlineUserAdd, HiOutlineLogout, HiOutlineMenu,
  HiOutlineX, HiOutlineBell, HiOutlineSun, HiOutlineMoon,
  HiOutlineSupport, HiOutlineShieldCheck, HiOutlineTrendingUp, HiOutlineStar,
} from 'react-icons/hi';
import { FaSitemap } from 'react-icons/fa';
import CodeUseConfirmModal from '../components/CodeUseConfirmModal';

const NAV_GROUPS = [
  {
    label: 'Main',
    items: [
      { to: '/dashboard',    label: 'Dashboard',       icon: HiOutlineHome },
      { to: '/ewallet',      label: 'E-Wallet',        icon: HiOutlineCreditCard },
    ],
  },
  {
    label: 'Network',
    items: [
      { to: '/referrals',    label: 'Direct Referrals', icon: HiOutlineUsers },
      { to: '/genealogy',    label: 'Genealogy Tree',   icon: FaSitemap },
      { to: '/pairing',      label: 'Pairing Reports',  icon: HiOutlineChartBar },
      { to: '/dashboard/details/uni-level', label: 'Uni-Level Breakdown', icon: HiOutlineTrendingUp },
      { to: '/dashboard/details/leadership-bonus', label: 'Leadership Breakdown', icon: HiOutlineStar },
      { to: '/dashboard/details/ranking-bonus', label: 'Ranking Bonus Breakdown', icon: HiOutlineShieldCheck },
      { to: '/hifive',       label: 'Hi-Five Bonus',    icon: HiOutlineGift },
      { to: '/ranking',      label: 'Ranking Progress', icon: HiOutlineShieldCheck },
      { to: '/leaderboard',  label: 'Leaderboard',      icon: HiOutlineChartBar },
    ],
  },
  {
    label: 'Account',
    items: [
      { to: '/codes',        label: 'Activation Codes', icon: HiOutlineKey },
      { to: '/upgrade',      label: 'Upgrade Account',  icon: HiOutlineArrowUp },
      { to: '/register',     label: 'Register Account', icon: HiOutlineUserAdd },
      { to: '/referral-invite', label: 'Referral ID',    icon: HiOutlineUserAdd },
      { to: '/transactions', label: 'Transactions',     icon: HiOutlineDocumentText },
      { to: '/vouchers',     label: 'Vouchers',         icon: HiOutlineGift },
      { to: '/account',      label: 'Account Details',  icon: HiOutlineUser },
      { to: '/support',      label: 'Issue or Concern', icon: HiOutlineSupport },
    ],
  },
];

/* Gold orb decoration for sidebar */
const GoldOrb = ({ size, top, left, opacity }) => (
  <div
    className="absolute rounded-full pointer-events-none"
    style={{
      width: size, height: size,
      top, left,
      background: 'radial-gradient(circle, rgba(212,175,55,0.18) 0%, transparent 70%)',
      opacity,
      filter: 'blur(24px)',
    }}
  />
);

export default function MemberLayout() {
  const { user, logoutMember } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    const el = document.querySelector('.main-scroll');
    if (!el) return;
    const handler = () => setScrolled(el.scrollTop > 8);
    el.addEventListener('scroll', handler, { passive: true });
    return () => el.removeEventListener('scroll', handler);
  }, []);

  const handleLogout = async () => {
    await logoutMember();
    navigate('/login');
  };

  const currentPage = NAV_GROUPS.flatMap(g => g.items).find(
    i => location.pathname === i.to || location.pathname === `/portal${i.to}`
  );
  const isItemActive = (path) => location.pathname === path || location.pathname === `/portal${path}`;

  const acctInitial = user?.shortname?.charAt(0)?.toUpperCase() || 'M';

  return (
    <>
      <CodeUseConfirmModal
        open={showLogoutConfirm}
        tone="gold"
        title="Sign out now?"
        message="You will be signed out of the member portal and returned to the login screen."
        confirmLabel="Sign Out"
        cancelLabel="Stay Signed In"
        onConfirm={async () => {
          setShowLogoutConfirm(false);
          await handleLogout();
        }}
        onClose={() => setShowLogoutConfirm(false)}
      />
      <div className="flex h-screen overflow-hidden portal-bg">

      {/* ── SIDEBAR ─────────────────────────────────────────── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[268px] glass-sidebar flex flex-col motion-safe:transition-transform motion-safe:duration-300 ease-out lg:translate-x-0 lg:static lg:flex-shrink-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Decorative orbs */}
        <GoldOrb size="200px" top="-60px"  left="-60px"  opacity={0.6} />
        <GoldOrb size="160px" top="60%"    left="60%"    opacity={0.4} />

        {/* Logo area */}
        <div className="relative flex items-center gap-3.5 p-5 border-b" style={{ borderColor: 'rgba(212,175,55,0.08)' }}>
          <div className="relative flex-shrink-0">
              <img
                src="/img/nogatu_logo.png"
                alt="NOGATU Alliance"
                className="size-11 rounded-xl object-contain"
                style={{
                  border: '1px solid rgba(212,175,55,0.25)',
                  background: 'rgba(212,175,55,0.06)',
                  boxShadow: '0 4px 16px rgba(212,175,55,0.15)',
                }}
              />
            {/* Online indicator */}
            <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-obsidian-900" style={{ background: '#22c55e', boxShadow: '0 0 6px rgba(34,197,94,0.6)' }} />
          </div>
          <div>
            <h1 className="font-brand text-[13px] font-semibold tracking-wide" style={{ color: 'var(--brand-gold)' }}>
              NOGATU
            </h1>
            <p className="sidebar-brand-subtitle text-[10px] font-medium tracking-wider uppercase">
              Member Portal
            </p>
          </div>
          {/* Close on mobile */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden ml-auto p-1.5 rounded-lg portal-card-muted hover:text-[var(--portal-title)] hover:bg-white/[0.05] transition-colors"
           type="button">
            <HiOutlineX className="size-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5 scrollbar-thin">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="text-[9.5px] font-bold uppercase tracking-[0.14em] px-3 mb-1.5" style={{ color: 'var(--portal-gold-text)' }}>
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <button
                    key={item.to}
                    type="button"
                    onClick={() => {
                      setSidebarOpen(false);
                      navigate(item.to);
                    }}
                    className={`nav-item w-full text-left${isItemActive(item.to) ? ' active' : ''}`}
                  >
                    <item.icon className="size-[17px] flex-shrink-0" />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* User info + sign out */}
        <div className="border-t p-3.5" style={{ borderColor: 'rgba(212,175,55,0.08)' }}>
          {/* User row */}
          <div className="flex items-center gap-3 p-2 mb-1">
            <div
              className="size-9 rounded-xl flex items-center justify-center text-always-white font-bold text-sm flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, #9A7B0A 0%, #D4AF37 50%, #F2D06B 100%)',
                boxShadow: '0 4px 12px rgba(212,175,55,0.3)',
              }}
            >
              {acctInitial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="sidebar-user-name text-sm font-semibold truncate">{user?.shortname || 'Member'}</p>
              <p className="sidebar-user-type text-[10.5px] truncate">
                {user?.caccttype} Account
              </p>
            </div>
          </div>

          {/* Sign out */}
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="nav-item w-full cursor-pointer"
            style={{ color: 'var(--portal-card-muted)' }}
           type="button">
            <HiOutlineLogout className="size-[17px]" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── MOBILE OVERLAY ──────────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── MAIN CONTENT ────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Topbar */}
        <header
          className={`gglass-topbar px-4 lg:px-7 h-15 flex items-center justify-between flex-shrink-0 transition-shadow duration-300 ${scrolled ? 'shadow-obsidian' : ''}`}
          style={{ height: '60px' }}
        >
          {/* Left: menu + page title */}
          <div className="flex items-center gap-3.5">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-1.5 rounded-xl portal-card-muted hover:text-[var(--portal-title)] hover:bg-white/[0.05] transition-colors"
              aria-label="Open menu"
             type="button">
              <HiOutlineMenu className="size-5" />
            </button>
            <div>
              <p className="portal-page-title text-sm font-semibold leading-none">{currentPage?.label || 'Dashboard'}</p>
              <p className="hero-welcome-subtitle text-[11px] mt-0.5 hidden sm:block">
                Welcome back, {user?.shortname}
              </p>
            </div>
          </div>

          {/* Right: bell + user */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl portal-card-muted hover:text-[var(--portal-gold-text)] transition-colors"
              title="Toggle Theme"
             type="button">
              {isDarkMode ? <HiOutlineSun className="size-[18px]" /> : <HiOutlineMoon className="size-[18px]" />}
            </button>
            
            {/* Notification bell */}
            <button
              className="relative p-2 rounded-xl portal-card-muted hover:text-[var(--portal-gold-text)] transition-colors"
              style={{ '--tw-ring-color': 'rgba(212,175,55,0.2)' }}
              aria-label="Notifications"
             type="button">
              <HiOutlineBell className="size-[18px]" />
              <span
                className="absolute top-2 right-2 size-1.5 rounded-full"
                style={{ background: '#D4AF37', boxShadow: '0 0 6px rgba(212,175,55,0.8)' }}
              />
            </button>

            {/* User chip */}
            <div className="hidden sm:flex items-center gap-2.5 pl-3 ml-1 border-l" style={{ borderColor: 'rgba(212,175,55,0.1)' }}>
              <div className="text-right">
                <p className="text-[13px] font-semibold portal-page-title leading-none">{user?.accountname}</p>
                <p className="topbar-account-tier text-[10.5px] mt-0.5">{user?.caccttype}</p>
              </div>
              <div
                className="size-8 rounded-xl flex items-center justify-center text-sm font-bold text-always-white"
                style={{
                  background: 'linear-gradient(135deg, #9A7B0A, #D4AF37)',
                  boxShadow: '0 2px 8px rgba(212,175,55,0.25)',
                }}
              >
                {acctInitial}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="main-scroll flex-1 overflow-y-auto p-4 lg:p-7">
          <Outlet />
        </main>
      </div>
      </div>
    </>
  );
}
