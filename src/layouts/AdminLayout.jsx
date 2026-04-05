import { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { HiOutlineHome, HiOutlineUsers, HiOutlineKey, HiOutlineCog, HiOutlineCash, HiOutlineGift, HiOutlineLogout, HiOutlineMenu, HiOutlineLockClosed, HiOutlineNewspaper, HiOutlineBell } from 'react-icons/hi';
import { FaSitemap } from 'react-icons/fa';

const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { to: '/admin/dashboard', label: 'Dashboard', icon: HiOutlineHome },
    ],
  },
  {
    label: 'Management',
    items: [
      { to: '/admin/accounts', label: 'Account Masterlist', icon: HiOutlineUsers },
      { to: '/admin/genealogy', label: 'Account Genealogy', icon: FaSitemap },
      { to: '/admin/generate-codes', label: 'Generate Codes', icon: HiOutlineKey },
      { to: '/admin/manage-codes', label: 'Manage Codes', icon: HiOutlineCog },
    ],
  },
  {
    label: 'Finance',
    items: [
      { to: '/admin/encashment', label: 'Encashment', icon: HiOutlineCash },
      { to: '/admin/redeem', label: 'Hi-Five Redeem', icon: HiOutlineGift },
    ],
  },
  {
    label: 'Content',
    items: [
      { to: '/admin/messages', label: 'Contact Messages', icon: HiOutlineBell },
      { to: '/admin/news', label: 'News & Posts', icon: HiOutlineNewspaper },
    ],
  },
  {
    label: 'Settings',
    items: [
      { to: '/admin/change-password', label: 'Change Password', icon: HiOutlineLockClosed },
    ],
  },
];

export default function AdminLayout() {
  const { admin, logoutAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logoutAdmin();
    navigate('/admin/login');
  };

  const currentPage = NAV_GROUPS.flatMap(g => g.items).find(
    i => location.pathname.startsWith(i.to)
  );

  const roleLabel = admin?.rights === 1 ? 'Administrator' : admin?.rights === 2 ? 'Cashier' : 'BOD';

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
            <h1 className="font-brand text-sm font-semibold tracking-wide" style={{ color: '#F2D06B' }}>NOGATU Alliance</h1>
            <p className="text-[11px] font-medium" style={{ color: 'rgba(212,175,55,0.5)' }}>Admin Panel</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-6 scrollbar-thin">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p
                className="text-[10px] font-bold uppercase tracking-[0.12em] px-3 mb-2"
                style={{ color: 'rgba(212,175,55,0.35)' }}
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
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-md"
              style={{ background: 'linear-gradient(135deg, #7f1d1d, #991b1b)' }}
            >
              {admin?.name?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{admin?.name || 'Admin'}</p>
              <span
                className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mt-0.5"
                style={{ background: 'rgba(212,175,55,0.15)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.25)' }}
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
                <p className="text-sm font-medium text-white">{admin?.name}</p>
                <p className="text-[11px]" style={{ color: 'rgba(212,175,55,0.6)' }}>{roleLabel}</p>
              </div>
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm text-white"
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
