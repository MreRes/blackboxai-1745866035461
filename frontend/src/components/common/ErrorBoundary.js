import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Log the error to your error reporting service
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="max-w-md w-full text-center px-4">
            <div className="mb-8">
              <div className="text-6xl font-bold text-red-600 mb-4">
                <i className="fas fa-exclamation-circle"></i>
              </div>
              <h1 className="text-2xl font-semibold text-gray-800 mb-2">
                Oops! Something went wrong
              </h1>
              <p className="text-gray-600">
                We're sorry, but something unexpected happened. Please try again or contact support if the problem persists.
              </p>
            </div>

            {/* Error Details (only in development) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-8">
                <div className="bg-red-50 p-4 rounded-md text-left">
                  <p className="text-red-800 font-medium mb-2">Error Details:</p>
                  <pre className="text-sm text-red-600 overflow-auto">
                    {this.state.error.toString()}
                  </pre>
                  {this.state.errorInfo && (
                    <pre className="text-sm text-red-600 overflow-auto mt-2">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-4">
              {/* Action Buttons */}
              <div className="space-x-4">
                <button
                  onClick={() => window.location.reload()}
                  className="inline-block px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Refresh Page
                </button>
                <Link
                  to="/dashboard"
                  className="inline-block px-6 py-3 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Go to Dashboard
                </Link>
              </div>

              {/* Support Link */}
              <p className="text-sm text-gray-500">
                Need help? {' '}
                <a
                  href="mailto:support@example.com"
                  className="text-red-600 hover:text-red-800"
                >
                  Contact Support
                </a>
              </p>
            </div>

            {/* Reset Error Button (only in development) */}
            {process.env.NODE_ENV === 'development' && (
              <button
                onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                className="mt-8 text-sm text-gray-500 hover:text-gray-700"
              >
                Reset Error Boundary
              </button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired
};

export default ErrorBoundary;
