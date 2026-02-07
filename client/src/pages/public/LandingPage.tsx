import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Zap, PenTool, Radio, Plug } from 'lucide-react';

import { selectIsAuthenticated } from '../../store/auth';

const features = [
  {
    icon: Zap,
    title: 'Simulate',
    description:
      'Run, pause, and stop MQTT simulations in real time with configurable payloads and publish frequencies.',
  },
  {
    icon: PenTool,
    title: 'Design Schemas',
    description:
      'Build hierarchical namespace trees with drag-and-drop, defining groups, metrics, and objects.',
  },
  {
    icon: Radio,
    title: 'MQTT Explorer',
    description:
      'Explore live MQTT traffic, inspect topic trees, and monitor messages as they flow through your broker.',
  },
  {
    icon: Plug,
    title: 'Broker Management',
    description:
      'Create and manage MQTT broker connections with support for authentication and WebSocket transports.',
  },
];

export default function LandingPage() {
  const isAuthenticated = useSelector(selectIsAuthenticated);

  return (
    <div className="min-h-[80vh] flex flex-col text-gray-800 dark:text-gray-100">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
        <div className="max-w-4xl mx-auto px-6 py-24 sm:py-32 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900 dark:text-white">
            Simulate your{' '}
            <span className="text-blue-600 dark:text-blue-400">
              Unified Namespace
            </span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Design schemas, configure MQTT brokers, and simulate IoT data flows
            — all in one platform.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to={isAuthenticated ? '/app' : '/login'}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-6 py-3 font-medium active:scale-[0.98] transition-all text-base"
            >
              {isAuthenticated ? 'Go to Dashboard' : 'Get Started'}
            </Link>
            <a
              href="#features"
              className="rounded-lg px-6 py-3 font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all text-base"
            >
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="max-w-4xl mx-auto px-6 py-20">
        <h2 className="text-2xl font-semibold text-center text-gray-900 dark:text-white mb-12">
          Everything you need to test your UNS
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
          {features.map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex gap-4">
              <div className="flex-shrink-0 mt-1">
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                  {title}
                </h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
