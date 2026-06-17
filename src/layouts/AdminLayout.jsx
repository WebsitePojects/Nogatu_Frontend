import { useState, useMemo, useEffect, useCallback } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import api from '../api';
import useSupportStream from '../hooks/useSupportStream';
import {
  HiOutlineHome, HiOutlineUsers, HiOutlineKey, HiOutlineCog,
  HiOutlineCash, HiOutlineGift, HiOutlineLogout, HiOutlineMenu,
  HiOutlineLockClosed, HiOutlineNewspaper, HiOutlineBell,
  HiOutlineSun, HiOutlineMoon, HiOutlineShieldCheck,
  HiOutlineSparkles, HiOutlineBadgeCheck, HiOutlineTicket,
  HiOutlineChat, HiOutlineClipboardList, HiOutlineX, HiOutlineViewBoards,
  HiOutlineDotsHorizontal,
} from 'react-icons/hi';
import { FaSitemap, FaProjectDiagram } from 'react-icons/fa';

/* ─── Nav data ──────────────────────────────────────────────── */

const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { to: '/admin/dashboard',        label: 'Dashboard',              icon: HiOutlineHome,          roles: [1, 3] },
    ],
  },
  {
    label: 'Management',
    items: [
      { to: '/admin/accounts',         label: 'Account Masterlist',     icon: HiOutlineUsers,         roles: [1, 3] },
      { to: '/admin/genealogy',        label: 'Account Genealogy',      icon: FaSitemap,              roles: [1, 3] },
      { to: '/admin/unilevel-tree',    label: 'Unilevel Tree',          icon: FaProjectDiagram,       roles: [1, 3] },
      { to: '/admin/generate-codes',   label: 'Generate Codes',         icon: HiOutlineKey,           roles: [1, 2, 3] },
      { to: '/admin/manage-codes',     label: 'Manage Codes',           icon: HiOutlineCog },
    ],
  },
  {
    label: 'Finance',
    items: [
      { to: '/admin/encashment',           label: 'Encashment',             icon: HiOutlineCash,          roles: [1, 3] },
      { to: '/admin/finance',              label: 'Finance Accounting',     icon: HiOutlineCash,          roles: [1, 3] },
      { to: '/admin/redeem',               label: 'Hi-Five Redeem',         icon: HiOutlineGift,          roles: [1, 3] },
      { to: '/admin/hifive-package-claims',label: 'Hi-Five Package Claims', icon: HiOutlineGift,          roles: [1, 3] },
      { to: '/admin/rankings',             label: 'Rankings',               icon: HiOutlineShieldCheck,   roles: [1, 3] },
      { to: '/admin/global-bonus',         label: 'Global Bonus',           icon: HiOutlineSparkles,      roles: [1, 3] },
      { to: '/admin/cd-accounts',          label: 'CD Accounts',            icon: HiOutlineBadgeCheck,    roles: [1, 3] },
    ],
  },
  {
    label: 'Vouchers',
    items: [
      { to: '/admin/voucher-management', label: 'Voucher Management', icon: HiOutlineTicket },
    ],
  },
  {
    label: 'Content',
    items: [
      { to: '/admin/messages',     label: 'Contact Messages', icon: HiOutlineBell,          roles: [1, 3] },
      { to: '/admin/support',      label: 'Support Tickets',  icon: HiOutlineChat,          roles: [1, 3] },
      { to: '/admin/applications', label: 'Applications',     icon: HiOutlineClipboardList, roles: [1, 3] },
      { to: '/admin/news',         label: 'News & Posts',     icon: HiOutlineNewspaper,     roles: [1, 3] },
    ],
  },
  {
    label: 'Settings',
    items: [
      { to: '/admin/change-password', label: 'Change Password', icon: HiOutlineLockClosed, roles: [1, 3] },
    ],
  },
];

/* ─── Bottom-nav tab definitions ──────────────────────────── */

const ADMIN_BOTTOM_NAV = [
  { id: 'home',    label: 'Home',    icon: HiOutlineHome,            to: '/admin/dashboard', roles: [1, 3] },
  { id: 'manage',  label: 'Manage',  icon: HiOutlineViewBoards,      drawer: 'manage' },
  { id: 'finance', label: 'Finance', icon: HiOutlineCash,            drawer: 'finance',      roles: [1, 3] },
  { id: 'vouchers',label: 'Vouchers',icon: HiOutlineTicket,          to: '/admin/voucher-management' },
  { id: 'more',    label: 'More',    icon: HiOutlineDotsHorizontal,  drawer: 'more' },
];

/* ─── Layout ────────────────────────────────────────────────── */

export default function AdminLayout() {
  const { admin, logoutAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeDrawer, setActiveDrawer] = useState(null);
  const { isDarkMode, toggleTheme } = useTheme();

  const rights = Number(admin?.rights || 0);
  const roleLabel = rights === 1 ? 'Administrator' : rights === 2 ? 'Cashier' : 'BOD';

  /* Customer-support unread badge. Suppressed while the admin is on the support
     page (they're already triaging tickets there). Refreshes live via SSE. */
  const onSupportPage = location.pathname.startsWith('/admin/support');
  const canSeeSupport = rights === 1 || rights === 3;
  const [supportUnread, setSupportUnread] = useState(0);

  const refreshUnread = useCallback(async () => {
    if (!canSeeSupport) return;
    try {
      const res = await api.get('/admin/support/meta/unread-count');
      setSupportUnread(Number(res.data?.unread || 0));
    } catch { /* ignore */ }
  }, [canSeeSupport]);

  useEffect(() => { refreshUnread(); }, [refreshUnread, location.pathname]);

  useSupportStream(useCallback((event) => {
    // Any inbound support activity may change the unread count; re-fetch the
    // authoritative number rather than guessing from the event.
    if (event === 'support.reply' || event === 'support.read' || event === 'support.status') {
      refreshUnread();
    }
  }, [refreshUnread]), { admin: true, enabled: canSeeSupport });

  const showSupportBadge = canSeeSupport && !onSupportPage && supportUnread > 0;

  /* Role-filter sidebar */
  const filteredGroups = useMemo(() => NAV_GROUPS
    .map(g => ({ ...g, items: g.items.filter(i => !i.roles || i.roles.includes(rights)) }))
    .filter(g => g.items.length > 0),
    [rights]
  );

  /* Role-filter bottom nav */
  const visibleBottomNav = useMemo(() =>
    ADMIN_BOTTOM_NAV.filter(item => !item.roles || item.roles.includes(rights)),
    [rights]
  );

  /* Drawer item pools (filtered) */
  const manageItems  = useMemo(() => NAV_GROUPS.find(g => g.label === 'Management')?.items.filter(i => !i.roles || i.roles.includes(rights)) || [], [rights]);
  const financeItems = useMemo(() => NAV_GROUPS.find(g => g.label === 'Finance')?.items.filter(i => !i.roles || i.roles.includes(rights)) || [], [rights]);
  const moreItems    = useMemo(() => [
    ...( NAV_GROUPS.find(g => g.label === 'Content')?.items.filter(i => !i.roles || i.roles.includes(rights)) || [] ),
    ...( NAV_GROUPS.find(g => g.label === 'Settings')?.items.filter(i => !i.roles || i.roles.includes(rights)) || [] ),
  ], [rights]);

  const handleLogout = async () => {
    await logoutAdmin();
    navigate('/admin/login');
  };

  const currentPage = filteredGroups.flatMap(g => g.items).find(
    i => location.pathname.startsWith(i.to)
  );

  const isItemActive = (path) => location.pathname.startsWith(path);

  /* Active bottom tabs */
  const MANAGE_PATHS  = ['/admin/accounts', '/admin/genealogy', '/admin/unilevel-tree', '/admin/generate-codes', '/admin/manage-codes'];
  const FINANCE_PATHS = ['/admin/encashment', '/admin/finance', '/admin/redeem', '/admin/hifive-package-claims', '/admin/rankings', '/admin/global-bonus', '/admin/cd-accounts'];
  const MORE_PATHS    = ['/admin/messages', '/admin/support', '/admin/applications', '/admin/news', '/admin/change-password'];

  const getBottomTabActive = (item) => {
    if (item.id === 'home')    return location.pathname === '/admin/dashboard';
    if (item.id === 'manage')  return MANAGE_PATHS.some(p => location.pathname.startsWith(p));
    if (item.id === 'finance') return FINANCE_PATHS.some(p => location.pathname.startsWith(p));
    if (item.id === 'vouchers')return location.pathname.startsWith('/admin/voucher-management');
    if (item.id === 'more')    return MORE_PATHS.some(p => location.pathname.startsWith(p));
    return false;
  };

  const handleBottomTap = (item) => {
    if (item.drawer) {
      setActiveDrawer(prev => prev === item.drawer ? null : item.drawer);
    } else {
      navigate(item.to);
      setActiveDrawer(null);
    }
  };

  const acctInitial = admin?.name?.[0]?.toUpperCase() || 'A';
  const topbarGold  = isDarkMode ? '#D4AF37' : '#7a5c08';

  return (
    <div className="flex h-screen overflow-hidden portal-bg">

      {/* ══ SIDEBAR ═══════════════════════════════════════════ */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-[272px] glass-sidebar
          transform motion-safe:transition-transform motion-safe:duration-300 ease-out
          lg:translate-x-0 lg:static lg:flex-shrink-0 flex flex-col
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5"
          style={{ borderBottom: '1px solid rgba(212,175,55,0.12)' }}>
          <img src="/img/nogatu_logo.png" alt="NOGATU Alliance"
            className="size-12 rounded-xl object-contain flex-shrink-0"
            style={{ border: '1px solid rgba(212,175,55,0.3)', background: 'rgba(255,255,255,0.05)' }} />
          <div className="flex-1 min-w-0">
            <h1 className="font-brand text-sm font-semibold tracking-wide" style={{ color: 'var(--brand-gold)' }}>
              NOGATU Alliance
            </h1>
            <p className="sidebar-brand-subtitle text-[11px] font-medium">Admin Panel</p>
          </div>
          <button onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg portal-card-muted hover:text-[var(--portal-title)] hover:bg-white/[0.05] transition-colors"
            type="button">
            <HiOutlineX className="size-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin">
          {filteredGroups.map((group) => (
            <div key={group.label}>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] px-3 mb-2"
                style={{ color: 'var(--brand-gold)' }}>
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavLink key={item.to} to={item.to}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
                    <item.icon className="size-[18px] flex-shrink-0" />
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Admin info + sign-out */}
        <div className="p-4" style={{ borderTop: '1px solid rgba(212,175,55,0.10)' }}>
          <div className="flex items-center gap-3 p-2 mb-2">
            <div className="size-9 rounded-xl flex items-center justify-center text-always-white font-bold text-xs shadow-md flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #7f1d1d, #991b1b)' }}>
              {acctInitial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="admin-profile-name text-sm font-medium truncate">{admin?.name || 'Admin'}</p>
              <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mt-0.5 admin-profile-tier"
                style={{ background: 'rgba(212,175,55,0.15)', color: 'var(--brand-gold)', border: '1px solid rgba(212,175,55,0.25)' }}>
                {roleLabel}
              </span>
            </div>
          </div>
          <button onClick={handleLogout}
            className="nav-item w-full text-left"
            style={{ color: 'var(--portal-card-muted)' }}
            type="button">
            <HiOutlineLogout className="size-[18px]" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={() => setSidebarOpen(false)} />
      )}

      {/* ══ MAIN AREA ══════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Topbar */}
        <header className="glass-topbar px-4 lg:px-8 h-16 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            {/* Mobile: compact logo + page title */}
            <div className="flex lg:hidden items-center gap-2.5">
              <img src="/img/nogatu_logo.png" alt="NOGATU"
                className="size-8 rounded-lg object-contain flex-shrink-0"
                style={{ border: '1px solid rgba(212,175,55,0.22)', background: 'rgba(212,175,55,0.06)' }} />
              <div className="leading-none">
                <p className="font-brand text-[11px] font-semibold" style={{ color: 'var(--brand-gold)' }}>NOGATU</p>
                <p className="text-[8.5px] font-medium tracking-widest" style={{ color: 'rgba(212,175,55,0.5)' }}>ADMIN</p>
              </div>
            </div>
            <div className="lg:hidden h-5 w-px mx-0.5" style={{ background: 'rgba(212,175,55,0.15)' }} />
            <p className="lg:hidden portal-page-title text-[13px] font-semibold leading-none truncate max-w-[140px]">
              {currentPage?.label || 'Admin'}
            </p>

            {/* Desktop: hamburger + page title */}
            <button onClick={() => setSidebarOpen(true)}
              className="portal-card-muted lg:hidden p-2 -ml-2 rounded-xl transition-colors hover:text-[var(--portal-gold-text)] cursor-pointer hidden"
              aria-label="Open menu" type="button">
              <HiOutlineMenu className="size-5" />
            </button>
            <h2 className="hidden lg:block portal-page-title text-sm font-semibold">
              {currentPage?.label || 'Admin Dashboard'}
            </h2>
          </div>

          <div className="flex items-center gap-1.5">
            {canSeeSupport && (
              <button onClick={() => navigate('/admin/support')}
                className="portal-card-muted p-2 rounded-xl transition-colors hover:text-[var(--portal-gold-text)] relative"
                title="Customer Support" aria-label="Customer Support" type="button">
                <HiOutlineChat className="size-5" />
                {showSupportBadge && (
                  <span
                    className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center text-[9px] font-bold text-always-white"
                    style={{ background: '#dc2626', border: '1.5px solid var(--glass-topbar-bg, #1a1a1a)' }}
                    aria-label={`${supportUnread} unread support tickets`}
                  >
                    {supportUnread > 9 ? '9+' : supportUnread}
                  </span>
                )}
              </button>
            )}
            <button onClick={toggleTheme}
              className="portal-card-muted p-2 rounded-xl transition-colors hover:text-[var(--portal-gold-text)]"
              title="Toggle Theme" type="button">
              {isDarkMode ? <HiOutlineSun className="size-5" /> : <HiOutlineMoon className="size-5" />}
            </button>


            {/* Desktop: full admin chip */}
            <div className="hidden sm:flex items-center gap-3 pl-3 ml-1"
              style={{ borderLeft: '1px solid rgba(212,175,55,0.15)' }}>
              <div className="text-right">
                <p className="admin-profile-name text-sm font-medium">{admin?.name}</p>
                <p className="topbar-account-tier text-[11px]">{roleLabel}</p>
              </div>
              <div className="size-9 rounded-xl flex items-center justify-center font-bold text-sm text-always-white"
                style={{ background: 'linear-gradient(135deg, #7f1d1d, #991b1b)' }}>
                {acctInitial}
              </div>
            </div>

            {/* Mobile: avatar only */}
            <div className="sm:hidden size-8 rounded-xl flex items-center justify-center font-bold text-sm text-always-white ml-1"
              style={{ background: 'linear-gradient(135deg, #7f1d1d, #991b1b)' }}>
              {acctInitial}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 member-main-content">
          <Outlet />
        </main>
      </div>

      {/* ══ DRAWER OVERLAY ════════════════════════════════════ */}
      {activeDrawer && (
        <div className="fixed inset-0 z-[38] lg:hidden"
          style={{ background: 'rgba(0,0,0,0.62)', backdropFilter: 'blur(6px)' }}
          onClick={() => setActiveDrawer(null)} />
      )}

      {/* ══ MANAGE DRAWER ═════════════════════════════════════ */}
      <div className={`admin-drawer lg:hidden ${activeDrawer === 'manage' ? 'open' : ''}`}>
        <div className="drawer-handle-bar" />
        <div className="flex items-center justify-between px-5 pb-4">
          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] mb-0.5"
              style={{ color: 'var(--portal-gold-text)' }}>Management</p>
            <h3 className="text-[15px] font-semibold" style={{ color: 'var(--portal-title)' }}>
              Accounts &amp; Codes
            </h3>
          </div>
          <button onClick={() => setActiveDrawer(null)}
            className="p-2 rounded-xl portal-card-muted hover:bg-white/5 transition-colors"
            type="button">
            <HiOutlineX className="size-5" />
          </button>
        </div>
        <div className="px-4 pb-2 grid grid-cols-3 gap-2.5">
          {manageItems.map(item => (
            <button key={item.to} type="button"
              onClick={() => { navigate(item.to); setActiveDrawer(null); }}
              className={`drawer-nav-tile ${isItemActive(item.to) ? 'active' : ''}`}>
              <item.icon className="size-[22px] flex-shrink-0" />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
        <div className="drawer-bottom-padding" />
      </div>

      {/* ══ FINANCE DRAWER ════════════════════════════════════ */}
      <div className={`admin-drawer lg:hidden ${activeDrawer === 'finance' ? 'open' : ''}`}>
        <div className="drawer-handle-bar" />
        <div className="flex items-center justify-between px-5 pb-4">
          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] mb-0.5"
              style={{ color: 'var(--portal-gold-text)' }}>Finance</p>
            <h3 className="text-[15px] font-semibold" style={{ color: 'var(--portal-title)' }}>
              Payments &amp; Encashment
            </h3>
          </div>
          <button onClick={() => setActiveDrawer(null)}
            className="p-2 rounded-xl portal-card-muted hover:bg-white/5 transition-colors"
            type="button">
            <HiOutlineX className="size-5" />
          </button>
        </div>
        <div className="px-4 pb-2 grid grid-cols-3 gap-2.5 overflow-y-auto" style={{ maxHeight: '44vh' }}>
          {financeItems.map(item => (
            <button key={item.to} type="button"
              onClick={() => { navigate(item.to); setActiveDrawer(null); }}
              className={`drawer-nav-tile ${isItemActive(item.to) ? 'active' : ''}`}>
              <item.icon className="size-[22px] flex-shrink-0" />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
        <div className="drawer-bottom-padding" />
      </div>

      {/* ══ MORE DRAWER ═══════════════════════════════════════ */}
      <div className={`admin-drawer lg:hidden ${activeDrawer === 'more' ? 'open' : ''}`}>
        <div className="drawer-handle-bar" />
        <div className="flex items-center justify-between px-5 pb-4">
          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] mb-0.5"
              style={{ color: 'var(--portal-gold-text)' }}>More</p>
            <h3 className="text-[15px] font-semibold" style={{ color: 'var(--portal-title)' }}>
              Content &amp; Settings
            </h3>
          </div>
          <button onClick={() => setActiveDrawer(null)}
            className="p-2 rounded-xl portal-card-muted hover:bg-white/5 transition-colors"
            type="button">
            <HiOutlineX className="size-5" />
          </button>
        </div>
        <div className="px-4 grid grid-cols-3 gap-2.5 pb-3">
          {moreItems.map(item => (
            <button key={item.to} type="button"
              onClick={() => { navigate(item.to); setActiveDrawer(null); }}
              className={`drawer-nav-tile ${isItemActive(item.to) ? 'active' : ''}`}>
              <item.icon className="size-[22px] flex-shrink-0" />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
        <div className="px-4 pt-3 drawer-bottom-padding" style={{ borderTop: '1px solid rgba(212,175,55,0.1)' }}>
          <button onClick={handleLogout}
            type="button"
            className="flex items-center gap-3 w-full px-4 py-3.5 rounded-2xl text-left transition-all active:scale-[0.98]"
            style={{
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.16)',
              color: '#f87171',
            }}>
            <HiOutlineLogout className="size-5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold leading-none">Sign Out</p>
              <p className="text-[10.5px] mt-0.5" style={{ color: 'rgba(248,113,113,0.65)' }}>
                {admin?.name}
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* ══ MOBILE BOTTOM NAV ══════════════════════════════════ */}
      <nav className="mobile-bottom-nav lg:hidden">
        <div className="flex items-stretch justify-around" style={{ height: '64px' }}>
          {visibleBottomNav.map((item) => {
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
  );
}
