import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, LogOut, CheckSquare } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { clsx } from 'clsx';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/projects', icon: FolderKanban, label: 'Projects' },
];

export function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col min-h-screen">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-5 border-b border-gray-700">
        <CheckSquare className="text-indigo-400" size={24} />
        <span className="text-lg font-bold tracking-tight">TaskFlow</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              )
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-gray-700">
        <div className="px-3 py-2 mb-1">
          <p className="text-sm font-medium text-white truncate">{user?.name}</p>
          <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          <span className="mt-1 inline-block text-xs bg-indigo-900 text-indigo-300 px-2 py-0.5 rounded-full">
            {user?.role}
          </span>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
