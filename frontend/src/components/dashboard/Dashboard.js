import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import axios from 'axios';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const { user } = useSelector(state => state.auth);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    summary: {},
    recentTransactions: [],
    budgets: [],
    goals: []
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [summaryRes, transactionsRes, budgetsRes, goalsRes] = await Promise.all([
        axios.get('/api/transactions/summary'),
        axios.get('/api/transactions?limit=5'),
        axios.get('/api/budgets?status=active'),
        axios.get('/api/goals?status=active')
      ]);

      setDashboardData({
        summary: summaryRes.data.data,
        recentTransactions: transactionsRes.data.data.transactions,
        budgets: budgetsRes.data.data.budgets,
        goals: goalsRes.data.data.goals
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching dashboard data');
    } finally {
      setLoading(false);
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
      <div className="p-4 text-red-600 bg-red-100 rounded-md">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="p-6 bg-white rounded-lg shadow">
        <h1 className="text-2xl font-bold text-gray-800">
          Welcome back, {user.username}!
        </h1>
        <p className="mt-2 text-gray-600">
          Here's your financial overview for today.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          title="Total Balance"
          amount={dashboardData.summary.balance}
          icon="wallet"
          color="indigo"
        />
        <SummaryCard
          title="Monthly Income"
          amount={dashboardData.summary.monthlyIncome}
          icon="arrow-up"
          color="green"
        />
        <SummaryCard
          title="Monthly Expenses"
          amount={dashboardData.summary.monthlyExpenses}
          icon="arrow-down"
          color="red"
        />
        <SummaryCard
          title="Savings Rate"
          amount={dashboardData.summary.savingsRate}
          icon="piggy-bank"
          color="blue"
          isPercentage
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Income vs Expenses Chart */}
        <div className="p-6 bg-white rounded-lg shadow">
          <h2 className="mb-4 text-lg font-semibold text-gray-800">
            Income vs Expenses
          </h2>
          <Line
            data={getIncomeExpensesChartData(dashboardData.summary)}
            options={chartOptions}
          />
        </div>

        {/* Expense Categories Chart */}
        <div className="p-6 bg-white rounded-lg shadow">
          <h2 className="mb-4 text-lg font-semibold text-gray-800">
            Expense Categories
          </h2>
          <Doughnut
            data={getExpenseCategoriesChartData(dashboardData.summary)}
            options={doughnutOptions}
          />
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="p-6 bg-white rounded-lg shadow">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Recent Transactions
          </h2>
          <Link
            to="/transactions"
            className="text-sm text-indigo-600 hover:text-indigo-800"
          >
            View All
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-3">Date</th>
                <th className="pb-3">Description</th>
                <th className="pb-3">Category</th>
                <th className="pb-3">Amount</th>
              </tr>
            </thead>
            <tbody>
              {dashboardData.recentTransactions.map(transaction => (
                <tr key={transaction._id} className="border-b">
                  <td className="py-3">
                    {new Date(transaction.date).toLocaleDateString()}
                  </td>
                  <td className="py-3">{transaction.description}</td>
                  <td className="py-3">
                    <span className="px-2 py-1 text-sm text-gray-600 bg-gray-100 rounded-full">
                      {transaction.category}
                    </span>
                  </td>
                  <td className={`py-3 ${transaction.type === 'expense' ? 'text-red-600' : 'text-green-600'}`}>
                    {transaction.type === 'expense' ? '-' : '+'}
                    {new Intl.NumberFormat('id-ID', {
                      style: 'currency',
                      currency: 'IDR'
                    }).format(transaction.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Budget Overview */}
      <div className="p-6 bg-white rounded-lg shadow">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Budget Overview
          </h2>
          <Link
            to="/budgets"
            className="text-sm text-indigo-600 hover:text-indigo-800"
          >
            View All
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {dashboardData.budgets.map(budget => (
            <BudgetCard key={budget._id} budget={budget} />
          ))}
        </div>
      </div>

      {/* Goals Progress */}
      <div className="p-6 bg-white rounded-lg shadow">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Goals Progress
          </h2>
          <Link
            to="/goals"
            className="text-sm text-indigo-600 hover:text-indigo-800"
          >
            View All
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {dashboardData.goals.map(goal => (
            <GoalCard key={goal._id} goal={goal} />
          ))}
        </div>
      </div>
    </div>
  );
};

// Helper Components
const SummaryCard = ({ title, amount, icon, color, isPercentage }) => (
  <div className="p-6 bg-white rounded-lg shadow">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className={`mt-2 text-2xl font-semibold text-${color}-600`}>
          {isPercentage ? (
            `${amount}%`
          ) : (
            new Intl.NumberFormat('id-ID', {
              style: 'currency',
              currency: 'IDR'
            }).format(amount)
          )}
        </p>
      </div>
      <div className={`p-3 bg-${color}-100 rounded-full`}>
        <i className={`fas fa-${icon} text-${color}-600`}></i>
      </div>
    </div>
  </div>
);

const BudgetCard = ({ budget }) => {
  const percentage = (budget.currentSpending / budget.amount) * 100;
  const isOverBudget = percentage > 100;

  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium text-gray-800">{budget.category}</h3>
        <span className={`text-sm ${isOverBudget ? 'text-red-600' : 'text-gray-500'}`}>
          {percentage.toFixed(1)}%
        </span>
      </div>
      <div className="w-full h-2 mb-2 bg-gray-200 rounded-full">
        <div
          className={`h-full rounded-full ${
            isOverBudget ? 'bg-red-600' : 'bg-green-600'
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        ></div>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">
          {new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR'
          }).format(budget.currentSpending)}
        </span>
        <span className="text-gray-500">
          {new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR'
          }).format(budget.amount)}
        </span>
      </div>
    </div>
  );
};

const GoalCard = ({ goal }) => {
  const percentage = (goal.currentAmount / goal.targetAmount) * 100;
  
  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium text-gray-800">{goal.name}</h3>
        <span className="text-sm text-gray-500">
          {percentage.toFixed(1)}%
        </span>
      </div>
      <div className="w-full h-2 mb-2 bg-gray-200 rounded-full">
        <div
          className="h-full bg-blue-600 rounded-full"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">
          {new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR'
          }).format(goal.currentAmount)}
        </span>
        <span className="text-gray-500">
          {new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR'
          }).format(goal.targetAmount)}
        </span>
      </div>
      <p className="mt-2 text-xs text-gray-500">
        Target: {new Date(goal.deadline).toLocaleDateString()}
      </p>
    </div>
  );
};

// Chart Configurations
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom'
    }
  },
  scales: {
    y: {
      beginAtZero: true
    }
  }
};

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom'
    }
  }
};

const getIncomeExpensesChartData = (summary) => ({
  labels: summary.months || [],
  datasets: [
    {
      label: 'Income',
      data: summary.monthlyIncomes || [],
      borderColor: 'rgb(34, 197, 94)',
      backgroundColor: 'rgba(34, 197, 94, 0.5)'
    },
    {
      label: 'Expenses',
      data: summary.monthlyExpenses || [],
      borderColor: 'rgb(239, 68, 68)',
      backgroundColor: 'rgba(239, 68, 68, 0.5)'
    }
  ]
});

const getExpenseCategoriesChartData = (summary) => ({
  labels: summary.expenseCategories?.map(c => c.category) || [],
  datasets: [
    {
      data: summary.expenseCategories?.map(c => c.amount) || [],
      backgroundColor: [
        'rgba(99, 102, 241, 0.8)',
        'rgba(34, 197, 94, 0.8)',
        'rgba(239, 68, 68, 0.8)',
        'rgba(234, 179, 8, 0.8)',
        'rgba(168, 85, 247, 0.8)',
        'rgba(14, 165, 233, 0.8)'
      ]
    }
  ]
});

export default Dashboard;
