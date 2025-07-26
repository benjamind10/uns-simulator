import React from 'react';

const RunLogCardContent: React.FC = () => (
  <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 text-xs shadow-sm">
    <div className="dark:text-gray-300 text-gray-600">
      09:14:08 INFO Topic A ...
    </div>
    <div className="dark:text-gray-300 text-gray-600">09:14:06 INFO ...</div>
    <div className="dark:text-gray-300 text-gray-600">09:14:04 INFO ...</div>
  </div>
);

export default RunLogCardContent;
