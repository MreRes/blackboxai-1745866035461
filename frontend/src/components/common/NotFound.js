import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-indigo-600">404</h1>
          <p className="text-2xl font-semibold text-gray-800 mt-4">Page Not Found</p>
          <p className="text-gray-600 mt-2">
            Sorry, we couldn't find the page you're looking for.
          </p>
        </div>

        <div className="space-y-4">
          <p className="text-gray-600">
            Here are some helpful links:
          </p>
          <div className="space-x-4">
            <Link
              to="/dashboard"
              className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Go to Dashboard
            </Link>
            <Link
              to="/"
              className="inline-block px-6 py-3 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Go Home
            </Link>
          </div>
        </div>

        <div className="mt-8">
          <p className="text-sm text-gray-500">
            If you believe this is a mistake, please{' '}
            <a
              href="mailto:support@example.com"
              className="text-indigo-600 hover:text-indigo-800"
            >
              contact support
            </a>
          </p>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
        <div className="absolute bottom-0 left-0 w-full h-4 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500"></div>
      </div>
    </div>
  );
};

export default NotFound;
