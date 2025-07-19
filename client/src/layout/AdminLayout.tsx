// src/layout/AdminLayout.tsx
import { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Menu, X, Home, Users, Server, Settings } from 'lucide-react';
import clsx from 'clsx';

export default function AdminLayout() {
  const [open, setOpen] = useState(true); // side-nav expanded?

  return (
    <div className="flex h-screen w-screen overflow-hidden text-gray-800 dark:text-gray-100">
      {/* ─────────────── SIDE NAV ─────────────── */}
      <aside
        className={clsx(
          'bg-gray-100 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-200',
          open ? 'w-56' : 'w-16'
        )}
      >
        <button
          onClick={() => setOpen(!open)}
          className="p-3 text-gray-600 dark:text-gray-300 focus:outline-none"
          aria-label="Toggle sidebar"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>

        <nav className="mt-6 flex flex-col gap-2">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                clsx(
                  'mx-2 flex items-center gap-3 rounded px-3 py-2 hover:bg-blue-500/10 transition-colors',
                  isActive && 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                )
              }
            >
              <Icon size={20} />
              {open && <span className="truncate">{label}</span>}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* ─────────────── MAIN AREA ─────────────── */}
      <div className="flex flex-1 flex-col overflow-y-auto bg-gray-50 dark:bg-gray-900">
        {/* Top Bar */}
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between bg-white/80 dark:bg-gray-900/80 backdrop-blur px-4 shadow-sm">
          <h1 className="text-lg font-semibold">UNS Admin</h1>

          <div className="flex items-center gap-4">
            {/* TODO: Dark-mode toggle */}
            {/* TODO: Profile dropdown */}
          </div>
        </header>

        {/* Routed page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

/* ---------- helper nav config ---------- */
const NAV = [
  { to: '/', label: 'Dashboard', icon: Home },
  { to: '/users', label: 'Users', icon: Users },
  { to: '/brokers', label: 'Brokers', icon: Server },
  { to: '/settings', label: 'Settings', icon: Settings },
] as const;
