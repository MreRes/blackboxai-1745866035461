import React, { useState, useEffect } from 'react';
import { budgetAPI } from '../../utils/api';
import BudgetForm from './BudgetForm';

const Budgets = () => {
  const [budgets, setBudgets] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchBudgets();
    fetchRecommendations();
  }, []);

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const response = await budgetAPI.getAll({ status: 'active' });
      setBudgets(response.data.data.budgets);
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching budgets');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    try {
      // For demonstration, we simulate recommendations
      // In real implementation, fetch from backend analytics service
      const recs = [
        { category: 'Makan', amount: 2000000, reason: 'Pengeluaran bulan lalu tinggi' },
        { category: 'Transportasi', amount: 1000000, reason: 'Pengeluaran meningkat' }
      ];
      setRecommendations(recs);
    } catch (err) {
      console.error('Error fetching recommendations:', err);
    }
  };

  const handleAcceptRecommendation = async (rec) => {
    try {
      await budgetAPI.create({
        name: `Rekomendasi untuk ${rec.category}`,
        category: rec.category,
        amount: rec.amount,
        period: 'monthly',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
        notifications: { enabled: true, threshold: 80, frequency: 'weekly' },
        isRecurring: true
      });
      fetchBudgets();
      setRecommendations(recommendations.filter(r => r !== rec));
    } catch (err) {
      setError(err.response?.data?.message || 'Error accepting recommendation');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Budgets</h1>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Create Budget
        </button>
      </div>

      {error && <div className="text-red-600 mb-4">{error}</div>}

      {recommendations.length > 0 && (
        <div className="mb-6 p-4 bg-yellow-100 rounded-md">
          <h2 className="text-lg font-semibold mb-2">Rekomendasi Anggaran</h2>
          <ul>
            {recommendations.map((rec, idx) => (
              <li key={idx} className="mb-2 flex justify-between items-center">
                <div>
                  <strong>{rec.category}</strong>: Rp {rec.amount.toLocaleString('id-ID')} - {rec.reason}
                </div>
                <button
                  onClick={() => handleAcceptRecommendation(rec)}
                  className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Terima
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {budgets.map(budget => (
          <div key={budget._id} className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold">{budget.name}</h3>
            <p>Kategori: {budget.category}</p>
            <p>Jumlah: Rp {budget.amount.toLocaleString('id-ID')}</p>
            <p>Periode: {budget.period}</p>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <BudgetForm
              onSubmit={async (data) => {
                try {
                  await budgetAPI.create(data);
                  setShowForm(false);
                  fetchBudgets();
                } catch (err) {
                  setError(err.response?.data?.message || 'Error creating budget');
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

export default Budgets;
