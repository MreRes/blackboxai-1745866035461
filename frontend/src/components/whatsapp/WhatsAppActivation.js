import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';

const WhatsAppActivation = () => {
  const [formData, setFormData] = useState({
    activationCode: '',
    phoneNumber: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Form, 2: QR Code
  const [qrCode, setQrCode] = useState('');

  const { isAuthenticated } = useSelector(state => state.auth);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const validatePhoneNumber = (number) => {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(number);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validatePhoneNumber(formData.phoneNumber)) {
      setError('Please enter a valid phone number');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // First, activate the WhatsApp number
      await axios.post('/api/auth/activate-whatsapp', formData);

      // Then, get the QR code
      const qrResponse = await axios.get('/api/whatsapp/qr');
      setQrCode(qrResponse.data.data.qr);
      setStep(2);
      
      setSuccess('Phone number activated successfully. Please scan the QR code to complete WhatsApp integration.');
    } catch (err) {
      setError(err.response?.data?.message || 'Activation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-green-600">
            <i className="fab fa-whatsapp mr-2"></i>
            WhatsApp Activation
          </h1>
          <p className="mt-2 text-gray-600">
            Connect your WhatsApp number to FinanceBot
          </p>
        </div>

        {/* Activation Card */}
        <div className="bg-white p-8 rounded-lg shadow-md">
          {step === 1 ? (
            <>
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                Enter Your Details
              </h2>

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-600 rounded-md text-sm">
                  {error}
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="mb-4 p-3 bg-green-100 text-green-600 rounded-md text-sm">
                  {success}
                </div>
              )}

              {/* Activation Form */}
              <form onSubmit={handleSubmit}>
                {/* Activation Code Field */}
                <div className="mb-4">
                  <label
                    htmlFor="activationCode"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Activation Code
                  </label>
                  <input
                    type="text"
                    id="activationCode"
                    name="activationCode"
                    value={formData.activationCode}
                    onChange={handleChange}
                    placeholder="Enter your activation code"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                    disabled={loading}
                  />
                </div>

                {/* Phone Number Field */}
                <div className="mb-6">
                  <label
                    htmlFor="phoneNumber"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    WhatsApp Number
                  </label>
                  <input
                    type="tel"
                    id="phoneNumber"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    placeholder="+62xxxxxxxxxx"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                    disabled={loading}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Include country code (e.g., +62 for Indonesia)
                  </p>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3 px-4 bg-green-600 text-white rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
                    loading
                      ? 'opacity-75 cursor-not-allowed'
                      : 'hover:bg-green-700'
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Activating...
                    </div>
                  ) : (
                    'Activate WhatsApp'
                  )}
                </button>
              </form>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                Scan QR Code
              </h2>

              {/* QR Code Display */}
              <div className="flex flex-col items-center space-y-4">
                <div className="p-4 bg-white rounded-lg shadow-sm">
                  <img
                    src={`data:image/png;base64,${qrCode}`}
                    alt="WhatsApp QR Code"
                    className="w-64 h-64"
                  />
                </div>
                <p className="text-sm text-gray-600 text-center">
                  Open WhatsApp on your phone and scan this QR code to connect
                </p>
              </div>
            </>
          )}

          {/* Navigation Links */}
          <div className="mt-6 text-center">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="text-green-600 hover:text-green-800 font-medium"
              >
                Return to Dashboard
              </Link>
            ) : (
              <div className="space-x-4">
                <Link
                  to="/login"
                  className="text-green-600 hover:text-green-800 font-medium"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="text-green-600 hover:text-green-800 font-medium"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Need help?{' '}
            <a
              href="#"
              className="text-green-600 hover:text-green-800 font-medium"
            >
              Contact Support
            </a>
          </p>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} FinanceBot. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppActivation;
