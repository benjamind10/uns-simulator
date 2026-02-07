import { useState, useCallback, Fragment } from 'react';
import { Outlet, NavLink, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Home,
  Zap,
  PenTool,
  Radio,
  Plug,
  Sun,
  Moon,
  PanelLeftClose,
  PanelLeft,
  Bell,
  Search,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/react';
import clsx from 'clsx';

import { useDarkMode } from '../hooks/useDarkMode';
import { logoutAsync, selectUser, selectIsAuthenticated } from '../store/auth';
import type { AppDispatch } from '../store/store';
import Toast from '../components/global/Toast';
import { Avatar } from '../components/ui/Avatar';
import { Tooltip } from '../components/ui/Tooltip';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const SIDEBAR_KEY = 'sidebar-collapsed';

const NAV_ITEMS: {
  to: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  end?: boolean;
}[] = [
  { to: '/app', label: 'Home', icon: Home, end: true },
  { to: '/app/simulator', label: 'Simulator', icon: Zap },
  { to: '/app/schemas', label: 'Schema Builder', icon: PenTool },
  { to: '/app/explorer', label: 'MQTT Explorer', icon: Radio },
];

const CONFIG_ITEMS: {
  to: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
}[] = [{ to: '/app/brokers', label: 'Brokers', icon: Plug }];

const BREADCRUMB_MAP: Record<string, string> = {
  app: 'Home',
  simulator: 'Simulator',
  schemas: 'Schema Builder',
  explorer: 'MQTT Explorer',
  brokers: 'Brokers',
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AppShell() {
  const [collapsed, setCollapsed] = useState<boolean>(
    () => localStorage.getItem(SIDEBAR_KEY) === 'true'
  );
  const [darkMode, toggleDarkMode] = useDarkMode();

  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const toggleSidebar = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_KEY, String(next));
      return next;
    });
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await dispatch(logoutAsync()).unwrap();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }, [dispatch, navigate]);

  /* Breadcrumbs from route */
  const breadcrumbs = location.pathname
    .split('/')
    .filter(Boolean)
    .reduce<{ label: string; to: string }[]>((acc, segment, idx, arr) => {
      const path = '/' + arr.slice(0, idx + 1).join('/');
      const label = BREADCRUMB_MAP[segment];
      if (!label) return acc;
      acc.push({ label, to: path });
      return acc;
    }, []);

  return (
    <>
      <Toast />

      <div className="flex h-screen w-screen overflow-hidden bg-gray-50 text-gray-800 dark:bg-gray-950 dark:text-gray-100">
        {/* ────────────────── SIDEBAR ────────────────── */}
        <nav
          className={clsx(
            'fixed inset-y-0 left-0 z-40 flex flex-col',
            'border-r border-gray-200/50 dark:border-gray-800/50',
            'bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl',
            'transition-all duration-200',
            collapsed ? 'w-16' : 'w-56'
          )}
        >
          {/* Logo */}
          <div className="flex h-14 items-center border-b border-gray-200/50 px-4 dark:border-gray-800/50">
            {!collapsed && (
              <span className="truncate text-sm font-semibold tracking-tight text-gray-900 dark:text-white">
                UNS Simulator
              </span>
            )}
          </div>

          {/* Primary nav */}
          <div className="mt-4 flex flex-1 flex-col gap-1 px-2 overflow-y-auto">
            {NAV_ITEMS.map(({ to, label, icon, end }) => (
              <SidebarLink
                key={to}
                to={to}
                label={label}
                icon={icon}
                collapsed={collapsed}
                end={end}
              />
            ))}

            {/* Divider */}
            <div className="my-3 border-t border-gray-200/60 dark:border-gray-800/60" />

            {/* Config label */}
            {!collapsed && (
              <div className="px-3 mb-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  Config
                </span>
              </div>
            )}

            {CONFIG_ITEMS.map(({ to, label, icon }) => (
              <SidebarLink
                key={to}
                to={to}
                label={label}
                icon={icon}
                collapsed={collapsed}
              />
            ))}
          </div>

          {/* Bottom section */}
          <div className="border-t border-gray-200/50 px-2 py-3 dark:border-gray-800/50 space-y-1">
            {/* Dark mode toggle */}
            <Tooltip
              content={darkMode ? 'Light mode' : 'Dark mode'}
              side="right"
              enabled={collapsed}
            >
              <button
                onClick={toggleDarkMode}
                className={clsx(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm',
                  'text-gray-600 dark:text-gray-400',
                  'hover:bg-gray-100 dark:hover:bg-gray-800/60',
                  'transition-colors'
                )}
              >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                {!collapsed && (
                  <span>{darkMode ? 'Light mode' : 'Dark mode'}</span>
                )}
              </button>
            </Tooltip>

            {/* User menu */}
            <Menu as="div" className="relative">
              <Tooltip
                content={user?.username ?? 'Account'}
                side="right"
                enabled={collapsed}
              >
                <MenuButton
                  className={clsx(
                    'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm',
                    'text-gray-600 dark:text-gray-400',
                    'hover:bg-gray-100 dark:hover:bg-gray-800/60',
                    'transition-colors'
                  )}
                >
                  <Avatar name={user?.username} size="sm" />
                  {!collapsed && (
                    <span className="truncate font-medium text-gray-800 dark:text-gray-200">
                      {user?.username ?? 'User'}
                    </span>
                  )}
                </MenuButton>
              </Tooltip>

              <MenuItems
                className={clsx(
                  'absolute bottom-full mb-2 w-56 rounded-xl',
                  'border border-gray-200 dark:border-gray-700',
                  'bg-white dark:bg-gray-900 shadow-lg',
                  'py-1 focus:outline-none',
                  collapsed ? 'left-full ml-2' : 'left-0'
                )}
              >
                <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-800">
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                    {user?.username ?? 'User'}
                  </p>
                  <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                    {user?.email ?? ''}
                  </p>
                </div>

                <MenuItem>
                  {({ focus }) => (
                    <button
                      onClick={handleLogout}
                      className={clsx(
                        'flex w-full items-center gap-2 px-4 py-2 text-sm',
                        focus
                          ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'
                          : 'text-gray-700 dark:text-gray-300'
                      )}
                    >
                      <LogOut size={16} />
                      Logout
                    </button>
                  )}
                </MenuItem>
              </MenuItems>
            </Menu>
          </div>
        </nav>

        {/* ────────────────── MAIN AREA ────────────────── */}
        <div
          className={clsx(
            'flex flex-1 flex-col transition-all duration-200',
            collapsed ? 'ml-16' : 'ml-56'
          )}
        >
          {/* Top bar */}
          <header
            className={clsx(
              'sticky top-0 z-30 flex h-14 items-center justify-between',
              'border-b border-gray-200/50 dark:border-gray-800/50',
              'bg-white/80 dark:bg-gray-950/80 backdrop-blur-lg',
              'px-4 shrink-0'
            )}
          >
            <div className="flex items-center gap-3">
              <button
                onClick={toggleSidebar}
                className={clsx(
                  'rounded-lg p-1.5',
                  'text-gray-500 hover:bg-gray-100 hover:text-gray-700',
                  'dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200',
                  'transition-colors'
                )}
                aria-label={
                  collapsed ? 'Expand sidebar' : 'Collapse sidebar'
                }
              >
                {collapsed ? (
                  <PanelLeft size={20} />
                ) : (
                  <PanelLeftClose size={20} />
                )}
              </button>

              <nav
                aria-label="Breadcrumb"
                className="flex items-center gap-1.5 text-sm"
              >
                {breadcrumbs.map((crumb, idx) => (
                  <Fragment key={crumb.to}>
                    {idx > 0 && (
                      <ChevronRight
                        size={14}
                        className="text-gray-400 dark:text-gray-600"
                      />
                    )}
                    {idx === breadcrumbs.length - 1 ? (
                      <span className="font-medium text-gray-900 dark:text-white">
                        {crumb.label}
                      </span>
                    ) : (
                      <NavLink
                        to={crumb.to}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        {crumb.label}
                      </NavLink>
                    )}
                  </Fragment>
                ))}
              </nav>
            </div>

            <div className="flex items-center gap-2">
              <div
                className={clsx(
                  'hidden items-center gap-2 rounded-lg border px-3 py-1.5 text-sm sm:flex',
                  'border-gray-200 bg-gray-50 text-gray-400',
                  'dark:border-gray-800 dark:bg-gray-900 dark:text-gray-500',
                  'cursor-not-allowed'
                )}
              >
                <Search size={14} />
                <span>Search...</span>
              </div>

              <button
                disabled
                className="rounded-lg p-1.5 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                aria-label="Notifications"
              >
                <Bell size={20} />
              </button>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-hidden flex flex-col">
            <Outlet />
          </main>
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  SidebarLink                                                        */
/* ------------------------------------------------------------------ */

interface SidebarLinkProps {
  to: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  collapsed: boolean;
  end?: boolean;
}

function SidebarLink({
  to,
  label,
  icon: Icon,
  collapsed,
  end,
}: SidebarLinkProps) {
  const link = (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        clsx(
          'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium',
          'transition-colors',
          isActive
            ? 'border-l-[3px] border-blue-500 bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400'
            : 'border-l-[3px] border-transparent text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800/60'
        )
      }
    >
      <Icon size={20} />
      {!collapsed && <span className="truncate">{label}</span>}
    </NavLink>
  );

  if (collapsed) {
    return (
      <Tooltip content={label} side="right">
        {link}
      </Tooltip>
    );
  }

  return link;
}
