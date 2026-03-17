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
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-[272px] bg-sidebar-bg transform transition-transform duration-300 ease-out lg:translate-x-0 lg:static lg:flex-shrink-0 flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Logo area */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-white/[0.06]">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-emerald-500/25">
            NA
          </div>
          <div>
            <h1 className="text-white font-semibold text-sm tracking-tight">NOGATU Alliance</h1>
            <p className="text-[11px] text-emerald-400/60 font-medium">Admin Panel</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-6 scrollbar-thin">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.12em] px-3 mb-2">{group.label}</p>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-white/[0.08] text-white shadow-sm'
                          : 'text-gray-400 hover:bg-white/[0.04] hover:text-gray-200'
                      }`
                    }
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
        <div className="border-t border-white/[0.06] p-4">
          <div className="flex items-center gap-3 px-2 py-2 mb-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-xs shadow-md">
              A
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{admin?.name || 'Admin'}</p>
              <p className="text-[11px] text-gray-500 truncate">{roleLabel}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-[13px] font-medium text-gray-500 hover:bg-white/[0.04] hover:text-gray-300 transition-colors cursor-pointer">
            <HiOutlineLogout className="w-[18px] h-[18px]" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200/60 px-4 lg:px-8 h-16 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 -ml-2 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer" aria-label="Open menu">
              <HiOutlineMenu className="w-5 h-5 text-gray-600" />
            </button>
            <h2 className="text-sm font-semibold text-gray-800">{currentPage?.label || 'Admin Dashboard'}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer" aria-label="Notifications">
              <HiOutlineBell className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center gap-3 pl-3 ml-1 border-l border-gray-100">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-800">{admin?.name}</p>
                <p className="text-[11px] text-gray-400">{roleLabel}</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm">
                A
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
