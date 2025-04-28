import React, { useState } from 'react';
import PropTypes from 'prop-types';

const GoalForm = ({ goal, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    targetAmount: '',
    deadline: '',
    category: '',
    priority: 'medium',
    strategy: {
      savingFrequency: 'monthly',
      autoSave: {
        enabled: false,
        amount: '',
        frequency: 'monthly'
      }
    },
    notifications: {
      enabled: true,
      frequency: 'weekly',
      milestones: [
        { percentage: 25, reached: false },
        { percentage: 50, reached: false },
        { percentage: 75, reached: false },
        { percentage: 100, reached: false }
      ]
    },
    ...goal
  });

  const [error, setError] = useState('');

  const categories = [
    'Emergency Fund',
    'Retirement',
    'Home Purchase',
    'Car Purchase',
    'Education',
    'Travel',
    'Wedding',
    'Business',
    'Investment',
    'Debt Payoff',
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

  const handleStrategyChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      strategy: {
        ...prev.strategy,
        [name]: type === 'checkbox' ? checked : value
      }
    }));
  };

  const handleAutoSaveChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      strategy: {
        ...prev.strategy,
        autoSave: {
          ...prev.strategy.autoSave,
          [name]: type === 'checkbox' ? checked : value
        }
      }
    }));
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

  const calculateRecommendedAmount = () => {
    if (!formData.targetAmount || !formData.deadline) return 0;
    
    const today = new Date();
    const deadline = new Date(formData.deadline);
    const monthsDiff = (deadline.getFullYear() - today.getFullYear()) * 12 + 
                      (deadline.getMonth() - today.getMonth());
    
    return formData.targetAmount / monthsDiff;
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Please enter a goal name');
      return false;
    }
    if (!formData.targetAmount || formData.targetAmount <= 0) {
      setError('Please enter a valid target amount');
      return false;
    }
    if (!formData.deadline) {
      setError('Please set a deadline');
      return false;
    }
    if (new Date(formData.deadline) <= new Date()) {
      setError('Deadline must be in the future');
      return false;
    }
    if (!formData.category) {
      setError('Please select a category');
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
        {goal ? 'Edit Goal' : 'Create Goal'}
      </h2>

      {error && (
        <div className="p-3 bg-red-100 text-red-600 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Basic Information */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Goal Name
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          ></textarea>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Target Amount
          </label>
          <input
            type="number"
            name="targetAmount"
            value={formData.targetAmount}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            min="0"
            step="1000"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Deadline
          </label>
          <input
            type="date"
            name="deadline"
            value={formData.deadline}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
        </div>

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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Priority
          </label>
          <select
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>

      {/* Saving Strategy */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-medium text-gray-800 mb-4">
          Saving Strategy
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Saving Frequency
            </label>
            <select
              name="savingFrequency"
              value={formData.strategy.savingFrequency}
              onChange={handleStrategyChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <div>
            <p className="text-sm text-gray-600 mb-2">
              Recommended monthly saving: {' '}
              {new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR'
              }).format(calculateRecommendedAmount())}
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                name="enabled"
                checked={formData.strategy.autoSave.enabled}
                onChange={handleAutoSaveChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label className="ml-2 text-sm text-gray-700">
                Enable automatic savings
              </label>
            </div>

            {formData.strategy.autoSave.enabled && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Auto-save Amount
                  </label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.strategy.autoSave.amount}
                    onChange={handleAutoSaveChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    min="0"
                    step="1000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Auto-save Frequency
                  </label>
                  <select
                    name="frequency"
                    value={formData.strategy.autoSave.frequency}
                    onChange={handleAutoSaveChange}
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
        </div>
      </div>

      {/* Notifications */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-medium text-gray-800 mb-4">
          Notifications
        </h3>

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
          )}
        </div>
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
          {goal ? 'Update' : 'Create'} Goal
        </button>
      </div>
    </form>
  );
};

GoalForm.propTypes = {
  goal: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired
};

export default GoalForm;
