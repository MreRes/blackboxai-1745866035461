import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const navigation = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: <i className="fas fa-chart-line w-5 h-5"></i>
    },
    {
      name: 'Transactions',
      path: '/transactions',
      icon: <i className="fas fa-exchange-alt w-5 h-5"></i>
    },
    {
      name: 'Budgets',
      path: '/budgets',
      icon: <i className="fas fa-wallet w-5 h-5"></i>
    },
    {
      name: 'Goals',
      path: '/goals',
      icon: <i className="fas fa-bullseye w-5 h-5"></i>
    },
    {
      name: 'Reports',
      path: '/reports',
      icon: <i className="fas fa-chart-bar w-5 h-5"></i>
    }
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out`}>
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-6 bg-indigo-600">
          <Link to="/" className="text-xl font-bold text-white">
            FinanceBot
          </Link>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-2 text-white rounded-md lg:hidden hover:bg-indigo-700"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Navigation */}
        <nav className="px-4 py-6">
          {navigation.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-4 py-3 mb-2 text-gray-700 rounded-md hover:bg-indigo-50 hover:text-indigo-600 ${
                location.pathname === item.path ? 'bg-indigo-50 text-indigo-600' : ''
              }`}
            >
              {item.icon}
              <span className="ml-3">{item.name}</span>
            </Link>
          ))}
        </nav>

        {/* User Profile */}
        <div className="absolute bottom-0 w-full p-4 border-t">
          <Link
            to="/profile"
            className="flex items-center px-4 py-3 text-gray-700 rounded-md hover:bg-indigo-50 hover:text-indigo-600"
          >
            <i className="fas fa-user-circle w-5 h-5"></i>
            <span className="ml-3">{user?.username}</span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-3 text-gray-700 rounded-md hover:bg-red-50 hover:text-red-600"
          >
            <i className="fas fa-sign-out-alt w-5 h-5"></i>
            <span className="ml-3">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className={`${isSidebarOpen ? 'lg:ml-64' : ''} transition-margin duration-300 ease-in-out`}>
        {/* Header */}
        <header className="fixed top-0 right-0 z-40 flex items-center w-full h-16 px-6 bg-white shadow-sm">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 mr-4 text-gray-600 rounded-md hover:bg-gray-100"
          >
            <i className={`fas ${isSidebarOpen ? 'fa-times' : 'fa-bars'}`}></i>
          </button>

          {/* Header Actions */}
          <div className="flex items-center ml-auto space-x-4">
            {/* Notifications */}
            <button className="p-2 text-gray-600 rounded-md hover:bg-gray-100">
              <i className="fas fa-bell"></i>
            </button>

            {/* WhatsApp Status */}
            <Link
              to="/activate-whatsapp"
              className="flex items-center px-4 py-2 text-sm text-green-600 bg-green-50 rounded-md hover:bg-green-100"
            >
              <i className="fab fa-whatsapp mr-2"></i>
              WhatsApp Status
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="px-6 py-8 mt-16">
          <Outlet />
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
};

export default Layout;
