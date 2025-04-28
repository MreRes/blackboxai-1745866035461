import React, { useState } from 'react';
import PropTypes from 'prop-types';

const BudgetForm = ({ budget, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    amount: '',
    period: 'monthly',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    notifications: {
      enabled: true,
      threshold: 80,
      frequency: 'weekly'
    },
    isRecurring: false,
    ...budget
  });

  const [error, setError] = useState('');

  const categories = [
    'Food & Dining',
    'Transportation',
    'Shopping',
    'Bills & Utilities',
    'Healthcare',
    'Education',
    'Entertainment',
    'Travel',
    'Savings',
    'Investment',
    'Other'
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setError('');
  };

  const handleNotificationChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [name]: type === 'checkbox' ? checked : value
      }
    }));
  };

  const calculateEndDate = (startDate, period) => {
    const date = new Date(startDate);
    switch (period) {
      case 'daily':
        date.setDate(date.getDate() + 1);
        break;
      case 'weekly':
        date.setDate(date.getDate() + 7);
        break;
      case 'monthly':
        date.setMonth(date.getMonth() + 1);
        break;
      case 'yearly':
        date.setFullYear(date.getFullYear() + 1);
        break;
      default:
        return '';
    }
    return date.toISOString().split('T')[0];
  };

  const handlePeriodChange = (e) => {
    const period = e.target.value;
    setFormData(prev => ({
      ...prev,
      period,
      endDate: calculateEndDate(prev.startDate, period)
    }));
  };

  const handleStartDateChange = (e) => {
    const startDate = e.target.value;
    setFormData(prev => ({
      ...prev,
      startDate,
      endDate: calculateEndDate(startDate, prev.period)
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Please enter a budget name');
      return false;
    }
    if (!formData.category) {
      setError('Please select a category');
      return false;
    }
    if (!formData.amount || formData.amount <= 0) {
      setError('Please enter a valid amount');
      return false;
    }
    if (!formData.startDate || !formData.endDate) {
      setError('Please set valid dates');
      return false;
    }
    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      setError('End date must be after start date');
      return false;
    }
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-800">
        {budget ? 'Edit Budget' : 'Create Budget'}
      </h2>

      {error && (
        <div className="p-3 bg-red-100 text-red-600 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Budget Name
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          required
        />
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Category
        </label>
        <select
          name="category"
          value={formData.category}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          required
        >
          <option value="">Select category</option>
          {categories.map(category => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      {/* Amount */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Amount
        </label>
        <input
          type="number"
          name="amount"
          value={formData.amount}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          min="0"
          step="1000"
          required
        />
      </div>

      {/* Period */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Period
        </label>
        <select
          name="period"
          value={formData.period}
          onChange={handlePeriodChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          required
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Start Date
          </label>
          <input
            type="date"
            name="startDate"
            value={formData.startDate}
            onChange={handleStartDateChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            End Date
          </label>
          <input
            type="date"
            name="endDate"
            value={formData.endDate}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
        </div>
      </div>

      {/* Notifications */}
      <div className="space-y-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            name="enabled"
            checked={formData.notifications.enabled}
            onChange={handleNotificationChange}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <label className="ml-2 text-sm text-gray-700">
            Enable notifications
          </label>
        </div>

        {formData.notifications.enabled && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Alert Threshold (%)
              </label>
              <input
                type="number"
                name="threshold"
                value={formData.notifications.threshold}
                onChange={handleNotificationChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                min="1"
                max="100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notification Frequency
              </label>
              <select
                name="frequency"
                value={formData.notifications.frequency}
                onChange={handleNotificationChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </>
        )}
      </div>

      {/* Recurring Option */}
      <div className="flex items-center">
        <input
          type="checkbox"
          name="isRecurring"
          checked={formData.isRecurring}
          onChange={handleChange}
          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
        />
        <label className="ml-2 text-sm text-gray-700">
          Automatically create new budget for next period
        </label>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          {budget ? 'Update' : 'Create'} Budget
        </button>
      </div>
    </form>
  );
};

BudgetForm.propTypes = {
  budget: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired
};

export default BudgetForm;
