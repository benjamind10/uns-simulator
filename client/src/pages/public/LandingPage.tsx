import { useState } from 'react';
import { useSelector } from 'react-redux';

import slide1 from '../../assets/carousel/dashboard.png';
import slide2 from '../../assets/carousel/simulator.png';
import slide3 from '../../assets/carousel/schema.png';
import { selectIsAuthenticated } from '../../store/auth';

const carouselImages = [slide1, slide2, slide3];

function Carousel() {
  const [current, setCurrent] = useState(0);

  const nextSlide = () => setCurrent((current + 1) % carouselImages.length);
  const prevSlide = () =>
    setCurrent((current - 1 + carouselImages.length) % carouselImages.length);

  return (
    <div className="w-full max-w-4xl mx-auto mb-12 relative">
      <div className="overflow-hidden rounded-2xl shadow-2xl bg-gray-200 dark:bg-gray-800 transition-all duration-300">
        <img
          src={carouselImages[current]}
          alt={`Slide ${current + 1}`}
          className="w-full h-[32rem] object-cover transition-all duration-300"
        />
      </div>
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-gray-800 bg-opacity-70 text-white rounded-full p-3 hover:bg-opacity-90 shadow-lg"
        aria-label="Previous"
      >
        &#8592;
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-gray-800 bg-opacity-70 text-white rounded-full p-3 hover:bg-opacity-90 shadow-lg"
        aria-label="Next"
      >
        &#8594;
      </button>
      <div className="flex justify-center mt-4 gap-3">
        {carouselImages.map((_, idx) => (
          <button
            key={idx}
            className={`w-4 h-4 rounded-full border-2 ${
              idx === current
                ? 'bg-blue-500 border-blue-500'
                : 'bg-gray-400 border-gray-400'
            }`}
            onClick={() => setCurrent(idx)}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

export default function LandingPage() {
  const isAuthenticated = useSelector(selectIsAuthenticated);

  return (
    <div
      className="min-h-[80vh] flex flex-col items-center justify-start pt-16
                 bg-white dark:bg-gray-900 
                 text-gray-800 dark:text-gray-100 
                 transition-colors duration-300 px-4"
    >
      <Carousel />
      <div className="w-full max-w-4xl mx-auto mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 flex flex-col items-center">
          <h2 className="text-2xl font-bold mb-2 text-blue-600 dark:text-blue-400">
            Welcome!
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-300 mb-2">
            UNS Simulator helps you design, test, and simulate IoT device
            networks using MQTT brokers.
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 flex flex-col items-center">
          <h2 className="text-xl font-semibold mb-2 text-green-600 dark:text-green-400">
            Features
          </h2>
          <ul className="list-disc list-inside text-left text-gray-700 dark:text-gray-200 space-y-2">
            <li>Create and manage MQTT brokers and simulation profiles</li>
            <li>Design custom device schemas and message payloads</li>
            <li>Run, pause, and stop simulations in real time</li>
            <li>Explore live MQTT traffic and topic trees</li>
            <li>Monitor device activity and broker connections</li>
          </ul>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 flex flex-col items-center">
          <h2 className="text-xl font-semibold mb-2 text-purple-600 dark:text-purple-400">
            Get Started
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-300 mb-2">
            Add a broker, build a schema, and launch your first simulation from
            the dashboard!
          </p>
          <a
            href={isAuthenticated ? '/dashboard' : '/login'}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-full shadow hover:bg-blue-700 transition"
          >
            {isAuthenticated ? 'Go to Dashboard' : 'Login to Get Started'}
          </a>
        </div>
      </div>
    </div>
  );
}
