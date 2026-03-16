import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { HiOutlineHome, HiOutlineUsers, HiOutlineKey, HiOutlineCog, HiOutlineCash, HiOutlineGift, HiOutlineLogout, HiOutlineMenu, HiOutlineLockClosed } from 'react-icons/hi';
import { FaSitemap } from 'react-icons/fa';

const NAV_ITEMS = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: HiOutlineHome },
  { to: '/admin/accounts', label: 'Account Masterlist', icon: HiOutlineUsers },
  { to: '/admin/genealogy', label: 'Account Genealogy', icon: FaSitemap },
  { to: '/admin/generate-codes', label: 'Generate Codes', icon: HiOutlineKey },
  { to: '/admin/manage-codes', label: 'Manage Codes', icon: HiOutlineCog },
  { to: '/admin/encashment', label: 'Encashment', icon: HiOutlineCash },
  { to: '/admin/redeem', label: 'Hi-Five Redeem', icon: HiOutlineGift },
  { to: '/admin/change-password', label: 'Change Password', icon: HiOutlineLockClosed },
];

export default function AdminLayout() {
  const { admin, logoutAdmin } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logoutAdmin();
    navigate('/admin/login');
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar - TailAdmin style dark sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#1c2434] text-gray-300 transform transition-transform duration-300 lg:translate-x-0 lg:static lg:flex-shrink-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-700">
          <div className="w-9 h-9 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">NA</div>
          <div>
            <h1 className="text-white font-semibold text-sm">NOGATU Alliance</h1>
            <p className="text-xs text-gray-500">Admin Panel</p>
          </div>
        </div>

        <nav className="mt-4 px-3 space-y-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${isActive ? 'bg-[#333a48] text-white' : 'hover:bg-[#333a48] hover:text-white'}`
              }
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-gray-700">
          <button onClick={handleLogout} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:bg-[#333a48] hover:text-white transition-colors">
            <HiOutlineLogout className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-3 flex items-center justify-between flex-shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100">
            <HiOutlineMenu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3 ml-auto">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-800">{admin?.name}</p>
              <p className="text-xs text-gray-500">{admin?.rights === 1 ? 'Administrator' : admin?.rights === 2 ? 'Cashier' : 'BOD'}</p>
            </div>
            <div className="w-9 h-9 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-semibold text-sm">A</div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
