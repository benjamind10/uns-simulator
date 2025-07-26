export default function SimulationPage() {
  return (
    <div className="w-full min-h-screen bg-gray-100 dark:bg-gray-900 py-12 px-4 flex justify-center items-start">
      <div className="w-full max-w-6xl grid grid-cols-3 gap-8">
        {/* Profiles Section */}
        <div className="col-span-1 flex flex-col gap-6">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow border border-gray-200 dark:border-gray-800 p-6">
            <h2 className="text-xl font-bold mb-4 dark:text-white text-gray-900">
              Profiles
            </h2>
            <div className="mb-4">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded mb-2 w-full font-semibold">
                + Create Profile
              </button>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 mb-2 shadow-sm">
                <div className="font-semibold dark:text-white text-gray-900">
                  Test Profile A
                </div>
                <div className="text-gray-500 dark:text-gray-400 text-sm">
                  Lorem ipsum dolor sit amet
                </div>
                <div className="flex justify-between text-xs mt-2">
                  <span className="dark:text-gray-300 text-gray-600">
                    Schema 1
                  </span>
                  <span className="dark:text-gray-300 text-gray-600">
                    2 days ago
                  </span>
                </div>
              </div>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                <div className="font-semibold dark:text-white text-gray-900">
                  Another Test
                </div>
                <div className="text-gray-500 dark:text-gray-400 text-sm">
                  Schema 2
                </div>
                <div className="flex justify-between text-xs mt-2">
                  <span className="dark:text-gray-300 text-gray-600">
                    Schema 2
                  </span>
                  <span className="dark:text-gray-300 text-gray-600">
                    2 days ago
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow border border-gray-200 dark:border-gray-800 p-6">
            <h2 className="text-xl font-bold mb-4 dark:text-white text-gray-900">
              Run Log
            </h2>
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 text-xs shadow-sm">
              <div className="dark:text-gray-300 text-gray-600">
                09:14:08 INFO Topic A ...
              </div>
              <div className="dark:text-gray-300 text-gray-600">
                09:14:06 INFO ...
              </div>
              <div className="dark:text-gray-300 text-gray-600">
                09:14:04 INFO ...
              </div>
            </div>
          </div>
        </div>

        {/* Simulator Section */}
        <div className="col-span-2 flex flex-col gap-6">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow border border-gray-200 dark:border-gray-800 p-6">
            <h2 className="text-xl font-bold mb-4 dark:text-white text-gray-900">
              Simulator
            </h2>
            {/* Tabs */}
            <div className="flex gap-8 border-b border-gray-300 dark:border-gray-700 mb-4">
              <button className="pb-2 border-b-2 border-blue-600 text-blue-600 font-semibold">
                Details
              </button>
              <button className="pb-2 text-gray-500 dark:text-gray-400">
                Scenarios
              </button>
              <button className="pb-2 text-gray-500 dark:text-gray-400">
                Behavior
              </button>
            </div>
            {/* Status & Controls */}
            <div className="mb-6">
              <div className="text-lg font-semibold mb-2 dark:text-white text-gray-900">
                Status
              </div>
              <div className="text-3xl font-bold text-green-500 mb-4">
                Running
              </div>
              <div className="flex gap-4">
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold">
                  Start
                </button>
                <button className="bg-gray-400 dark:bg-gray-700 text-white px-4 py-2 rounded font-semibold">
                  Pause
                </button>
                <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-semibold">
                  Stop
                </button>
              </div>
            </div>
            {/* Placeholder for chart */}
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 mb-6 h-40 flex items-center justify-center shadow-sm">
              <span className="text-gray-500 dark:text-gray-400">
                [Chart Placeholder]
              </span>
            </div>
            {/* Rec Log */}
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 text-xs shadow-sm">
              <div className="dark:text-gray-300 text-gray-600">
                09:14:08 INFO Topic A ...
              </div>
              <div className="dark:text-gray-300 text-gray-600">
                09:14:06 INFO ...
              </div>
              <div className="dark:text-gray-300 text-gray-600">
                09:14:04 INFO ...
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
