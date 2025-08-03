import Login from '../../components/global/Login';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 px-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-center text-blue-600 dark:text-blue-400">
          Login to UNS Simulator
        </h1>
        <Login className="text-gray-800 dark:text-gray-100" />
      </div>
      <footer className="mt-8 text-center text-xs text-gray-400">
        &copy; 2025 UNS Simulator by Shiva
      </footer>
    </div>
  );
}
