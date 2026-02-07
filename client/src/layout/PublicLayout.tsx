import { Outlet } from 'react-router-dom';

import Navbar from '../components/global/Navbar';

export default function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950 transition-colors">
      <Navbar />

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="py-6 text-center text-xs text-gray-400 dark:text-gray-500 border-t border-gray-100 dark:border-gray-800/50">
        © {new Date().getFullYear()} UNS Simulator by Shiva
      </footer>
    </div>
  );
}
