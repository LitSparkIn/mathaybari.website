import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';

export const Sidebar = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/users', icon: Users, label: 'Users' },
  ];

  return (
    <aside className="sidebar flex flex-col" data-testid="sidebar">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <h1 className="font-heading text-2xl font-bold tracking-tight" data-testid="app-logo">
          DICER
        </h1>
        <p className="text-xs text-muted-foreground mt-1 uppercase tracking-widest">
          Admin Panel
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? 'active' : ''}`
                }
                data-testid={`nav-${item.label.toLowerCase()}`}
              >
                <item.icon size={20} strokeWidth={1.5} />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User & Logout */}
      <div className="p-4 border-t border-border">
        <div className="mb-3 px-2">
          <p className="text-xs text-muted-foreground uppercase tracking-widest">
            Logged in as
          </p>
          <p className="font-mono text-sm truncate mt-1" data-testid="user-email">
            {user?.email}
          </p>
        </div>
        <Button
          variant="outline"
          className="w-full justify-start gap-2 rounded-sm"
          onClick={handleLogout}
          data-testid="logout-button"
        >
          <LogOut size={16} strokeWidth={1.5} />
          <span>Logout</span>
        </Button>
      </div>
    </aside>
  );
};
