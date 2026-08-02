import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ChangePasswordModal from './ChangePasswordModal';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `block rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
    isActive
      ? 'bg-gold text-navy'
      : 'text-white/80 hover:bg-white/10 hover:text-white'
  }`;

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="flex min-h-screen">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/50 lg:hidden" onClick={closeSidebar} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-navy text-white transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:static lg:translate-x-0`}
      >
        <div className="border-b border-white/10 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white p-1">
                <img src="/navy-logo.svg" alt="Indian Navy" className="h-full w-full object-contain" />
              </div>
              <div>
                <h1 className="text-sm font-bold leading-tight">Indian Navy</h1>
                <p className="text-xs text-white/60">Task Dashboard</p>
              </div>
            </div>
            <button
              onClick={closeSidebar}
              className="rounded-lg p-1 text-white/60 hover:text-white lg:hidden"
              aria-label="Close menu"
            >
              ✕
            </button>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-4 py-6">
          <NavLink to="/" end className={navLinkClass} onClick={closeSidebar}>
            Dashboard
          </NavLink>
          <NavLink to="/tasks" className={navLinkClass} onClick={closeSidebar}>
            Tasks
          </NavLink>
          {isAdmin && (
            <>
              <NavLink to="/departments" className={navLinkClass} onClick={closeSidebar}>
                Departments
              </NavLink>
              <NavLink to="/users" className={navLinkClass} onClick={closeSidebar}>
                Users
              </NavLink>
            </>
          )}
        </nav>

        {/* User footer */}
        <div className="border-t border-white/10 px-4 py-4 space-y-2">
          <div className="px-2">
            <p className="text-sm font-medium">{user?.name}</p>
            <p className="text-xs text-white/60">{user?.email}</p>
            {user?.department && (
              <p className="mt-1 text-xs text-gold">{user.department.name}</p>
            )}
          </div>
          <button
            onClick={() => { setShowChangePassword(true); closeSidebar(); }}
            className="w-full rounded-lg border border-white/20 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10 text-left"
          >
            🔑 Change Password
          </button>
          <button
            onClick={handleLogout}
            className="w-full rounded-lg border border-white/20 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 text-navy hover:bg-gray-100"
            aria-label="Open menu"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white p-0.5 border border-gray-200">
              <img src="/navy-logo.svg" alt="Indian Navy" className="h-full w-full object-contain" />
            </div>
            <span className="text-sm font-semibold text-navy">Indian Navy</span>
          </div>
          <div className="w-9" />
        </header>

        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">{children}</main>
      </div>

      {/* Change Password Modal */}
      {showChangePassword && (
        <ChangePasswordModal onClose={() => setShowChangePassword(false)} />
      )}
    </div>
  );
}
