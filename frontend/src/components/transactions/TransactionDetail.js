import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { transactionAPI } from '../../utils/api';
import TransactionForm from './TransactionForm';

const TransactionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchTransaction();
  }, [id]);

  const fetchTransaction = async () => {
    try {
      setLoading(true);
      const response = await transactionAPI.getById(id);
      setTransaction(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching transaction');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (updatedData) => {
    try {
      await transactionAPI.update(id, updatedData);
      setIsEditing(false);
      fetchTransaction();
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating transaction');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) {
      return;
    }

    try {
      await transactionAPI.delete(id);
      navigate('/transactions');
    } catch (err) {
      setError(err.response?.data?.message || 'Error deleting transaction');
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

  if (!transaction) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="p-4 bg-yellow-100 text-yellow-600 rounded-md">
          Transaction not found
        </div>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
          <TransactionForm
            transaction={transaction}
            onSubmit={handleUpdate}
            onCancel={() => setIsEditing(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">
              Transaction Details
            </h1>
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
        </div>

        {/* Transaction Details */}
        <div className="p-6 space-y-6">
          {/* Amount and Type */}
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Amount</p>
              <p className={`text-2xl font-bold ${
                transaction.type === 'expense' ? 'text-red-600' : 'text-green-600'
              }`}>
                {transaction.type === 'expense' ? '-' : '+'}
                {new Intl.NumberFormat('id-ID', {
                  style: 'currency',
                  currency: 'IDR'
                }).format(transaction.amount)}
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm ${
              transaction.type === 'expense'
                ? 'bg-red-100 text-red-800'
                : 'bg-green-100 text-green-800'
            }`}>
              {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
            </span>
          </div>

          {/* Description */}
          <div>
            <p className="text-sm text-gray-500">Description</p>
            <p className="text-gray-800">{transaction.description}</p>
          </div>

          {/* Category */}
          <div>
            <p className="text-sm text-gray-500">Category</p>
            <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full">
              {transaction.category}
            </span>
          </div>

          {/* Date */}
          <div>
            <p className="text-sm text-gray-500">Date</p>
            <p className="text-gray-800">
              {new Date(transaction.date).toLocaleDateString('id-ID', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>

          {/* Tags */}
          {transaction.tags && transaction.tags.length > 0 && (
            <div>
              <p className="text-sm text-gray-500 mb-2">Tags</p>
              <div className="flex flex-wrap gap-2">
                {transaction.tags.map(tag => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Additional Information */}
          <div className="border-t pt-6 mt-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Created At</p>
                <p className="text-gray-800">
                  {new Date(transaction.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Last Updated</p>
                <p className="text-gray-800">
                  {new Date(transaction.updatedAt).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Source</p>
                <p className="text-gray-800">{transaction.source}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="p-6 border-t bg-gray-50">
          <button
            onClick={() => navigate('/transactions')}
            className="text-indigo-600 hover:text-indigo-800"
          >
            ← Back to Transactions
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionDetail;
