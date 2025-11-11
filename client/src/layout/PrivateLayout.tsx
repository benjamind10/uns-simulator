import { Outlet } from 'react-router-dom';

import Navbar from '../components/global/Navbar';
import Toast from '../components/global/Toast';

export default function PrivateLayout() {
  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
      <Toast />
      <Navbar />
      <main className="flex-1 container mx-auto px-6 py-8 overflow-hidden flex flex-col">
        <Outlet />
      </main>
    </div>
  );
}
