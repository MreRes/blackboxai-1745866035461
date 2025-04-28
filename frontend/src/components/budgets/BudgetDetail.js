import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { budgetAPI } from '../../utils/api';
import BudgetForm from './BudgetForm';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const BudgetDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [budget, setBudget] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchBudget();
    fetchAnalytics();
  }, [id]);

  const fetchBudget = async () => {
    try {
      const response = await budgetAPI.getById(id);
      setBudget(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching budget');
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await budgetAPI.getAnalytics(id);
      setAnalytics(response.data.data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (updatedData) => {
    try {
      await budgetAPI.update(id, updatedData);
      setIsEditing(false);
      fetchBudget();
      fetchAnalytics();
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating budget');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this budget?')) {
      return;
    }

    try {
      await budgetAPI.delete(id);
      navigate('/budgets');
    } catch (err) {
      setError(err.response?.data?.message || 'Error deleting budget');
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

  if (!budget) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="p-4 bg-yellow-100 text-yellow-600 rounded-md">
          Budget not found
        </div>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
          <BudgetForm
            budget={budget}
            onSubmit={handleUpdate}
            onCancel={() => setIsEditing(false)}
          />
        </div>
      </div>
    );
  }

  const spendingChartData = {
    labels: analytics?.dailySpending.map(d => d._id) || [],
    datasets: [
      {
        label: 'Daily Spending',
        data: analytics?.dailySpending.map(d => d.total) || [],
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      },
      {
        label: 'Budget Limit',
        data: analytics?.dailySpending.map(() => budget.amount / 30) || [],
        borderColor: 'rgb(255, 99, 132)',
        borderDash: [5, 5]
      }
    ]
  };

  const categoryChartData = {
    labels: analytics?.categoryBreakdown.map(c => c.category) || [],
    datasets: [
      {
        label: 'Spending by Category',
        data: analytics?.categoryBreakdown.map(c => c.total) || [],
        backgroundColor: [
          'rgba(255, 99, 132, 0.5)',
          'rgba(54, 162, 235, 0.5)',
          'rgba(255, 206, 86, 0.5)',
          'rgba(75, 192, 192, 0.5)',
          'rgba(153, 102, 255, 0.5)'
        ]
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
              <h1 className="text-2xl font-bold text-gray-800">{budget.name}</h1>
              <p className="text-gray-600 mt-1">{budget.category}</p>
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

          {/* Budget Progress */}
          <div className="mt-6">
            <div className="flex justify-between items-end mb-2">
              <div>
                <p className="text-sm text-gray-500">Total Budget</p>
                <p className="text-2xl font-bold text-gray-800">
                  {new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: 'IDR'
                  }).format(budget.amount)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Spent</p>
                <p className="text-2xl font-bold text-red-600">
                  {new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: 'IDR'
                  }).format(budget.currentSpending)}
                </p>
              </div>
            </div>

            <div className="w-full h-4 bg-gray-200 rounded-full">
              <div
                className={`h-full rounded-full ${
                  budget.currentSpending > budget.amount
                    ? 'bg-red-600'
                    : budget.currentSpending / budget.amount > 0.8
                    ? 'bg-yellow-600'
                    : 'bg-green-600'
                }`}
                style={{
                  width: `${Math.min((budget.currentSpending / budget.amount) * 100, 100)}%`
                }}
              ></div>
            </div>

            <div className="mt-2 text-sm text-gray-600">
              {Math.round((budget.currentSpending / budget.amount) * 100)}% of budget used
            </div>
          </div>
        </div>

        {/* Budget Details */}
        <div className="px-6 py-4 bg-gray-50 border-t rounded-b-lg">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500">Period</p>
              <p className="font-medium">{budget.period}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Start Date</p>
              <p className="font-medium">
                {new Date(budget.startDate).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">End Date</p>
              <p className="font-medium">
                {new Date(budget.endDate).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <p className={`font-medium ${
                budget.status === 'active'
                  ? 'text-green-600'
                  : budget.status === 'paused'
                  ? 'text-yellow-600'
                  : 'text-gray-600'
              }`}>
                {budget.status}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Spending Trend */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Spending Trend
            </h2>
            <Line
              data={spendingChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true
                  }
                }
              }}
              height={300}
            />
          </div>

          {/* Category Breakdown */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Category Breakdown
            </h2>
            <Bar
              data={categoryChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true
                  }
                }
              }}
              height={300}
            />
          </div>
        </div>
      )}

      {/* Back Button */}
      <div className="mt-6">
        <button
          onClick={() => navigate('/budgets')}
          className="text-indigo-600 hover:text-indigo-800"
        >
          ← Back to Budgets
        </button>
      </div>
    </div>
  );
};

export default BudgetDetail;
