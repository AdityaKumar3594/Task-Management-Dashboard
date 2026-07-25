import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `block rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
    isActive
      ? 'bg-gold text-navy'
      : 'text-white/80 hover:bg-white/10 hover:text-white'
  }`;

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-64 flex-col bg-navy text-white">
        <div className="border-b border-white/10 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold text-sm font-bold text-navy">
              IN
            </div>
            <div>
              <h1 className="text-sm font-bold leading-tight">Indian Navy</h1>
              <p className="text-xs text-white/60">Task Dashboard</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-4 py-6">
          <NavLink to="/" end className={navLinkClass}>
            Dashboard
          </NavLink>
          <NavLink to="/tasks" className={navLinkClass}>
            Tasks
          </NavLink>
          {isAdmin && (
            <>
              <NavLink to="/departments" className={navLinkClass}>
                Departments
              </NavLink>
              <NavLink to="/users" className={navLinkClass}>
                Users
              </NavLink>
            </>
          )}
        </nav>

        <div className="border-t border-white/10 px-4 py-4">
          <div className="mb-3 px-2">
            <p className="text-sm font-medium">{user?.name}</p>
            <p className="text-xs text-white/60">{user?.email}</p>
            {user?.department && (
              <p className="mt-1 text-xs text-gold">{user.department.name}</p>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="w-full rounded-lg border border-white/20 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10"
          >
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto p-8">{children}</main>
    </div>
  );
}
