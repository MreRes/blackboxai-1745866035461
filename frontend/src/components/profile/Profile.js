import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateProfile } from '../../store/slices/authSlice';
import { authAPI, whatsAppAPI } from '../../utils/api';

const Profile = () => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  const [whatsAppStatus, setWhatsAppStatus] = useState(null);
  const [showQR, setShowQR] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    checkWhatsAppStatus();
  }, []);

  const checkWhatsAppStatus = async () => {
    try {
      const response = await whatsAppAPI.getStatus();
      setWhatsAppStatus(response.data.data);
    } catch (err) {
      console.error('Error checking WhatsApp status:', err);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await authAPI.changePassword(passwordForm);
      setSuccess('Password changed successfully');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Error changing password');
    } finally {
      setLoading(false);
    }
  };

  const handleGetQRCode = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await whatsAppAPI.getQRCode();
      setQrCode(response.data.data.qr);
      setShowQR(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Error getting QR code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Profile Settings</h1>
          <p className="text-gray-600 mt-1">
            Manage your account settings and WhatsApp integration
          </p>
        </div>

        {/* User Info */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Account Information
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Username</p>
                <p className="font-medium">{user.username}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Account Status</p>
                <p className="font-medium">
                  {new Date(user.expiryDate) > new Date() ? 'Active' : 'Expired'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Expiry Date</p>
                <p className="font-medium">
                  {new Date(user.expiryDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Last Login</p>
                <p className="font-medium">
                  {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* WhatsApp Integration */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              WhatsApp Integration
            </h2>

            {whatsAppStatus && (
              <div className="mb-4">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${
                    whatsAppStatus.connected ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <span className="font-medium">
                    {whatsAppStatus.connected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
                {whatsAppStatus.phoneNumber && (
                  <p className="text-sm text-gray-600 mt-1">
                    Connected number: {whatsAppStatus.phoneNumber}
                  </p>
                )}
              </div>
            )}

            <button
              onClick={handleGetQRCode}
              disabled={loading}
              className={`px-4 py-2 bg-green-600 text-white rounded-md ${
                loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-700'
              }`}
            >
              {loading ? 'Loading...' : 'Connect WhatsApp'}
            </button>

            {showQR && qrCode && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-2">
                  Scan this QR code with WhatsApp to connect
                </p>
                <img
                  src={`data:image/png;base64,${qrCode}`}
                  alt="WhatsApp QR Code"
                  className="max-w-xs"
                />
              </div>
            )}
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Change Password
            </h2>

            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-600 rounded-md text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-green-100 text-green-600 rounded-md text-sm">
                {success}
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm(prev => ({
                    ...prev,
                    currentPassword: e.target.value
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm(prev => ({
                    ...prev,
                    newPassword: e.target.value
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                  minLength={8}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Must be at least 8 characters long
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm(prev => ({
                    ...prev,
                    confirmPassword: e.target.value
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full px-4 py-2 bg-indigo-600 text-white rounded-md ${
                  loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-700'
                }`}
              >
                {loading ? 'Changing Password...' : 'Change Password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
