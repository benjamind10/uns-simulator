import { NavLink } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 px-4">
      <h1 className="text-6xl font-bold mb-4 text-blue-600 dark:text-blue-400">
        404
      </h1>
      <h2 className="text-2xl font-semibold mb-2">Page Not Found</h2>
      <p className="mb-6 text-center text-gray-500 dark:text-gray-400">
        Sorry, the page you are looking for does not exist.
      </p>
      <NavLink
        to="/"
        className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 transition"
      >
        Go Home
      </NavLink>
    </div>
  );
}
