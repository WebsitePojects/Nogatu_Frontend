import { useState, useMemo } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { HiOutlineHome, HiOutlineUsers, HiOutlineKey, HiOutlineCog, HiOutlineCash, HiOutlineGift, HiOutlineLogout, HiOutlineMenu, HiOutlineLockClosed, HiOutlineNewspaper, HiOutlineBell, HiOutlineSun, HiOutlineMoon, HiOutlineShieldCheck, HiOutlineSparkles, HiOutlineBadgeCheck, HiOutlineTicket } from 'react-icons/hi';
import { FaSitemap } from 'react-icons/fa';

/**
 * Role-based access:
 *   rights=1 (Admin): all pages
 *   rights=2 (Cashier): manage-codes, voucher-management only (per legacy PHP)
 *   rights=3 (BOD): same as admin
 *
 * Each nav item can have a `roles` array. If omitted, all roles can see it.
 */
const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { to: '/admin/dashboard', label: 'Dashboard', icon: HiOutlineHome, roles: [1, 3] },
    ],
  },
  {
    label: 'Management',
    items: [
      { to: '/admin/accounts', label: 'Account Masterlist', icon: HiOutlineUsers, roles: [1, 3] },
      { to: '/admin/genealogy', label: 'Account Genealogy', icon: FaSitemap, roles: [1, 3] },
      { to: '/admin/generate-codes', label: 'Generate Codes', icon: HiOutlineKey, roles: [1, 3] },
      { to: '/admin/manage-codes', label: 'Manage Codes', icon: HiOutlineCog },
    ],
  },
  {
    label: 'Finance',
    items: [
      { to: '/admin/encashment', label: 'Encashment', icon: HiOutlineCash, roles: [1, 3] },
      { to: '/admin/redeem', label: 'Hi-Five Redeem', icon: HiOutlineGift, roles: [1, 3] },
      { to: '/admin/rankings', label: 'Rankings', icon: HiOutlineShieldCheck, roles: [1, 3] },
      { to: '/admin/global-bonus', label: 'Global Bonus', icon: HiOutlineSparkles, roles: [1, 3] },
      { to: '/admin/cd-accounts', label: 'CD Accounts', icon: HiOutlineBadgeCheck, roles: [1, 3] },
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
      { to: '/admin/messages', label: 'Contact Messages', icon: HiOutlineBell, roles: [1, 3] },
      { to: '/admin/news', label: 'News & Posts', icon: HiOutlineNewspaper, roles: [1, 3] },
    ],
  },
  {
    label: 'Settings',
    items: [
      { to: '/admin/change-password', label: 'Change Password', icon: HiOutlineLockClosed, roles: [1, 3] },
    ],
  },
];

export default function AdminLayout() {
  const { admin, logoutAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isDarkMode, toggleTheme } = useTheme();

  const rights = Number(admin?.rights || 0);

  // Filter nav groups based on role
  const filteredGroups = useMemo(() => {
    return NAV_GROUPS
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => !item.roles || item.roles.includes(rights)),
      }))
      .filter((group) => group.items.length > 0);
  }, [rights]);

  const handleLogout = async () => {
    await logoutAdmin();
    navigate('/admin/login');
  };

  const currentPage = filteredGroups.flatMap(g => g.items).find(
    i => location.pathname.startsWith(i.to)
  );

  const roleLabel = rights === 1 ? 'Administrator' : rights === 2 ? 'Cashier' : 'BOD';

  return (
    <div className="flex h-screen overflow-hidden portal-bg">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[272px] glass-sidebar transform motion-safe:transition-transform motion-safe:duration-300 ease-out lg:translate-x-0 lg:static lg:flex-shrink-0 flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Logo area */}
        <div className="flex items-center gap-3 px-6 py-5" style={{ borderBottom: '1px solid rgba(212,175,55,0.12)' }}>
          <img
            src="/img/nogatu_logo.png"
            alt="NOGATU Alliance"
            className="w-12 h-12 rounded-xl object-contain"
            style={{ border: '1px solid rgba(212,175,55,0.3)', background: 'rgba(255,255,255,0.05)' }}
          />
          <div>
            <h1 className="font-brand text-sm font-semibold tracking-wide" style={{ color: 'var(--brand-gold)' }}>NOGATU Alliance</h1>
            <p className="sidebar-brand-subtitle text-[11px] font-medium">Admin Panel</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-6 scrollbar-thin">
          {filteredGroups.map((group) => (
            <div key={group.label}>
              <p
                className="text-[10px] font-bold uppercase tracking-[0.12em] px-3 mb-2"
                style={{ color: 'var(--brand-gold)' }}
              >
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                  >
                    <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Admin info + Sign out */}
        <div className="p-4" style={{ borderTop: '1px solid rgba(212,175,55,0.10)' }}>
          <div className="flex items-center gap-3 px-2 py-2 mb-2">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-always-white font-bold text-xs shadow-md"
              style={{ background: 'linear-gradient(135deg, #7f1d1d, #991b1b)' }}
            >
              {admin?.name?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="admin-profile-name text-sm font-medium truncate">{admin?.name || 'Admin'}</p>
              <span
                className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mt-0.5 admin-profile-tier"
                style={{ background: 'rgba(212,175,55,0.15)', color: 'var(--brand-gold)', border: '1px solid rgba(212,175,55,0.25)' }}
              >
                {roleLabel}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-[13px] font-medium motion-safe:transition-colors cursor-pointer"
            style={{ color: 'rgba(255,255,255,0.4)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}
          >
            <HiOutlineLogout className="w-[18px] h-[18px]" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header
          className="glass-topbar px-4 lg:px-8 h-16 flex items-center justify-between flex-shrink-0"
        >
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-xl motion-safe:transition-colors cursor-pointer"
              style={{ color: '#D4AF37' }}
              aria-label="Open menu"
            >
              <HiOutlineMenu className="w-5 h-5" />
            </button>
            <h2 className="text-sm font-semibold text-white/80">{currentPage?.label || 'Admin Dashboard'}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl transition-colors text-white/40 hover:text-brand-gold"
              title="Toggle Theme"
            >
              {isDarkMode ? <HiOutlineSun className="w-5 h-5" /> : <HiOutlineMoon className="w-5 h-5" />}
            </button>
            <button
              className="relative p-2 rounded-xl motion-safe:transition-colors cursor-pointer"
              style={{ color: 'rgba(255,255,255,0.4)' }}
              aria-label="Notifications"
              onMouseEnter={e => e.currentTarget.style.color = '#D4AF37'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
            >
              <HiOutlineBell className="w-5 h-5" />
              <span
                className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
                style={{ background: '#D4AF37' }}
              />
            </button>
            <div
              className="hidden sm:flex items-center gap-3 pl-3 ml-1"
              style={{ borderLeft: '1px solid rgba(212,175,55,0.15)' }}
            >
              <div className="text-right">
                <p className="admin-profile-name text-sm font-medium">{admin?.name}</p>
                <p className="topbar-account-tier text-[11px]">{roleLabel}</p>
              </div>
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm text-white text-always-white"
                style={{ background: 'linear-gradient(135deg, #7f1d1d, #991b1b)' }}
              >
                {admin?.name?.[0]?.toUpperCase() || 'A'}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
