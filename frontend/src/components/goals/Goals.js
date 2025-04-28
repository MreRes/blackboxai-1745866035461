import React, { useState, useEffect } from 'react';
import { goalAPI } from '../../utils/api';
import GoalForm from './GoalForm';

const Goals = () => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const response = await goalAPI.getAll({ status: 'active' });
      setGoals(response.data.data.goals);
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching goals');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Financial Goals</h1>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Create Goal
        </button>
      </div>

      {error && <div className="text-red-600 mb-4">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.map(goal => {
          const progressPercentage = (goal.currentAmount / goal.targetAmount) * 100;
          const daysRemaining = Math.ceil((new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24));

          return (
            <div key={goal._id} className="bg-white rounded-lg shadow">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      {goal.name}
                    </h3>
                    <p className="text-sm text-gray-500">{goal.category}</p>
                  </div>
                  <span className={`px-2 py-1 text-sm rounded-full ${
                    goal.priority === 'high'
                      ? 'bg-red-100 text-red-800'
                      : goal.priority === 'medium'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {goal.priority}
                  </span>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Progress</span>
                    <span>{Math.round(progressPercentage)}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full">
                    <div
                      className={`h-full rounded-full ${progressPercentage >= 75 ? 'bg-blue-600' : progressPercentage >= 50 ? 'bg-yellow-600' : 'bg-red-600'}`}
                      style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Target</span>
                    <span className="font-medium">
                      {new Intl.NumberFormat('id-ID', {
                        style: 'currency',
                        currency: 'IDR'
                      }).format(goal.targetAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Current</span>
                    <span className="font-medium text-green-600">
                      {new Intl.NumberFormat('id-ID', {
                        style: 'currency',
                        currency: 'IDR'
                      }).format(goal.currentAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Remaining</span>
                    <span className="font-medium text-indigo-600">
                      {new Intl.NumberFormat('id-ID', {
                        style: 'currency',
                        currency: 'IDR'
                      }).format(goal.targetAmount - goal.currentAmount)}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">
                      {daysRemaining > 0
                        ? `${daysRemaining} days remaining`
                        : 'Deadline passed'}
                    </span>
                    <span className="text-gray-500">
                      {new Date(goal.deadline).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-50 border-t rounded-b-lg">
                <div className="flex justify-between">
                  <Link
                    to={`/goals/${goal._id}`}
                    className="text-indigo-600 hover:text-indigo-800"
                  >
                    View Details
                  </Link>
                  <button
                    onClick={() => alert('Delete feature under development')}
                    className="text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <GoalForm
              onSubmit={async (data) => {
                try {
                  await goalAPI.create(data);
                  setShowForm(false);
                  fetchGoals();
                } catch (err) {
                  setError(err.response?.data?.message || 'Error creating goal');
                }
              }}
              onCancel={() => setShowForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Goals;
