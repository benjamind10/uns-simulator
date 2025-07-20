import { Outlet } from 'react-router-dom';

import Navbar from '../components/Navbar'; // reuse your existing top nav

/**
 * PublicLayout
 * ─ Renders Navbar at the top
 * ─ Sets a simple page wrapper (optional gray-50 background)
 * ─ Anything inside <Outlet /> is the public page body
 */
export default function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900 transition-colors">
      {/* Public top-nav (logo, links, maybe login) */}
      <Navbar />

      {/* Main page content */}
      <main className="flex-1 px-4 py-8">
        <Outlet />
      </main>

      {/* (Optional) public footer */}
      <footer className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
        © {new Date().getFullYear()} UNS Simulator
      </footer>
    </div>
  );
}
