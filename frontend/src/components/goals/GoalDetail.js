import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { goalAPI } from '../../utils/api';
import GoalForm from './GoalForm';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const GoalDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [goal, setGoal] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [transactionForm, setTransactionForm] = useState({
    amount: '',
    type: 'deposit',
    description: ''
  });

  useEffect(() => {
    fetchGoal();
    fetchProgress();
  }, [id]);

  const fetchGoal = async () => {
    try {
      const response = await goalAPI.getById(id);
      setGoal(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching goal');
    }
  };

  const fetchProgress = async () => {
    try {
      const response = await goalAPI.getProgress(id);
      setProgress(response.data.data);
    } catch (err) {
      console.error('Error fetching progress:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (updatedData) => {
    try {
      await goalAPI.update(id, updatedData);
      setIsEditing(false);
      fetchGoal();
      fetchProgress();
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating goal');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this goal?')) {
      return;
    }

    try {
      await goalAPI.delete(id);
      navigate('/goals');
    } catch (err) {
      setError(err.response?.data?.message || 'Error deleting goal');
    }
  };

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    try {
      await goalAPI.addTransaction(id, transactionForm);
      setShowAddTransaction(false);
      setTransactionForm({ amount: '', type: 'deposit', description: '' });
      fetchGoal();
      fetchProgress();
    } catch (err) {
      setError(err.response?.data?.message || 'Error adding transaction');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="p-4 bg-red-100 text-red-600 rounded-md">
          {error}
        </div>
      </div>
    );
  }

  if (!goal) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="p-4 bg-yellow-100 text-yellow-600 rounded-md">
          Goal not found
        </div>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
          <GoalForm
            goal={goal}
            onSubmit={handleUpdate}
            onCancel={() => setIsEditing(false)}
          />
        </div>
      </div>
    );
  }

  const progressPercentage = (goal.currentAmount / goal.targetAmount) * 100;
  const daysRemaining = Math.ceil((new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24));

  const progressChartData = {
    labels: progress?.history.map(h => new Date(h.date).toLocaleDateString()) || [],
    datasets: [
      {
        label: 'Progress',
        data: progress?.history.map(h => h.amount) || [],
        borderColor: 'rgb(99, 102, 241)',
        tension: 0.1
      },
      {
        label: 'Target',
        data: progress?.history.map(() => goal.targetAmount) || [],
        borderColor: 'rgb(239, 68, 68)',
        borderDash: [5, 5]
      }
    ]
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{goal.name}</h1>
              <p className="text-gray-600 mt-1">{goal.description}</p>
            </div>
            <div className="space-x-4">
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex justify-between items-end mb-2">
              <div>
                <p className="text-sm text-gray-500">Progress</p>
                <p className="text-2xl font-bold text-gray-800">
                  {Math.round(progressPercentage)}%
                </p>
              </div>
              <button
                onClick={() => setShowAddTransaction(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Add Transaction
              </button>
            </div>

            <div className="w-full h-4 bg-gray-200 rounded-full">
              <div
                className={`h-full rounded-full ${
                  progressPercentage >= 100
                    ? 'bg-green-600'
                    : progressPercentage >= 75
                    ? 'bg-blue-600'
                    : progressPercentage >= 50
                    ? 'bg-yellow-600'
                    : 'bg-red-600'
                }`}
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Goal Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div>
              <p className="text-sm text-gray-500">Target Amount</p>
              <p className="text-xl font-bold text-gray-800">
                {new Intl.NumberFormat('id-ID', {
                  style: 'currency',
                  currency: 'IDR'
                }).format(goal.targetAmount)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Current Amount</p>
              <p className="text-xl font-bold text-green-600">
                {new Intl.NumberFormat('id-ID', {
                  style: 'currency',
                  currency: 'IDR'
                }).format(goal.currentAmount)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Remaining Amount</p>
              <p className="text-xl font-bold text-indigo-600">
                {new Intl.NumberFormat('id-ID', {
                  style: 'currency',
                  currency: 'IDR'
                }).format(goal.targetAmount - goal.currentAmount)}
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Category</p>
              <p className="font-medium">{goal.category}</p>
            </div>
            <div>
              <p className="text-gray-500">Priority</p>
              <p className="font-medium capitalize">{goal.priority}</p>
            </div>
            <div>
              <p className="text-gray-500">Deadline</p>
              <p className="font-medium">
                {new Date(goal.deadline).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Days Remaining</p>
              <p className="font-medium">{daysRemaining}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Chart */}
      {progress && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Progress History
          </h2>
          <div className="h-80">
            <Line
              data={progressChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true
                  }
                }
              }}
            />
          </div>
        </div>
      )}

      {/* Transaction History */}
      {progress?.transactions.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-800">
              Transaction History
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {progress.transactions.map((transaction, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(transaction.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap capitalize">
                      {transaction.type}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap ${
                      transaction.type === 'deposit'
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}>
                      {transaction.type === 'withdrawal' ? '-' : '+'}
                      {new Intl.NumberFormat('id-ID', {
                        style: 'currency',
                        currency: 'IDR'
                      }).format(transaction.amount)}
                    </td>
                    <td className="px-6 py-4">
                      {transaction.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Transaction Modal */}
      {showAddTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Add Transaction
            </h2>
            <form onSubmit={handleAddTransaction} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount
                </label>
                <input
                  type="number"
                  value={transactionForm.amount}
                  onChange={(e) => setTransactionForm(prev => ({
                    ...prev,
                    amount: e.target.value
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  value={transactionForm.type}
                  onChange={(e) => setTransactionForm(prev => ({
                    ...prev,
                    type: e.target.value
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="deposit">Deposit</option>
                  <option value="withdrawal">Withdrawal</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={transactionForm.description}
                  onChange={(e) => setTransactionForm(prev => ({
                    ...prev,
                    description: e.target.value
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowAddTransaction(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md"
                >
                  Add Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Back Button */}
      <div className="mt-6">
        <button
          onClick={() => navigate('/goals')}
          className="text-indigo-600 hover:text-indigo-800"
        >
          ← Back to Goals
        </button>
      </div>
    </div>
  );
};

export default GoalDetail;
