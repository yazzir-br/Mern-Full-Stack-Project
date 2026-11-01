

import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Tags,
  UserRound,
  ShieldCheck,
  LogOut,
  Menu,
  Wallet,
  X,
} from 'lucide-react';

import { Button } from '../ui/button';
import useAuthStore from '../../lib/store/authStore.js';

const navigation = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Transactions', path: '/transactions', icon: ArrowLeftRight },
  { label: 'Categories', path: '/categories', icon: Tags },
  { label: 'Profile', path: '/profile', icon: UserRound },
];

export default function AuthenticatedLayout() {
  const [menuOpen, setMenuOpen] = useState(false);

  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const isAdminVerified = user?.role === 'admin';

  const links = isAdminVerified
    ? [
        ...navigation,
        {
          label: 'Admin Dashboard',
          path: '/admin',
          icon: ShieldCheck,
        },
      ]
    : navigation;

  const closeMenu = () => setMenuOpen(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    clearAuth();
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {menuOpen && (
        <button
          type="button"
          aria-label="Close navigation overlay"
          onClick={closeMenu}
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-sidebar text-sidebar-foreground transition-transform duration-200 md:translate-x-0 ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <nav
          aria-label="Authenticated navigation"
          className="flex-1 space-y-1 overflow-y-auto p-3"
        >
          <p className="px-3 pb-2 pt-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Navigation
          </p>

          {links.map(({ label, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              end
              onClick={closeMenu}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                }`
              }
            >
              <Icon className="size-5 shrink-0" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="border-t p-3">
          <NavLink
            to="/login"
            onClick={handleLogout}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="size-5" />
            <span>Log out</span>
          </NavLink>
        </div>
      </aside>

      <div className="min-h-screen md:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur sm:px-6">
          <Button
            variant="outline"
            size="icon"
            className="md:hidden"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            <Menu className="size-5" />
          </Button>

          <span className="font-semibold">Personal Finance Tacker</span>
        </header>

        <main className="mx-auto w-full max-w-screen-2xl p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}