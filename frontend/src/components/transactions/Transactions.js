import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { transactionAPI } from '../../utils/api';
import TransactionForm from './TransactionForm';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

const ItemTypes = {
  TRANSACTION: 'transaction',
};

const DraggableTransaction = ({ transaction, index, moveTransaction, onEdit, onDelete }) => {
  const ref = React.useRef(null);
  const [, drop] = useDrop({
    accept: ItemTypes.TRANSACTION,
    hover(item, monitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) {
        return;
      }
      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }
      moveTransaction(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.TRANSACTION,
    item: { type: ItemTypes.TRANSACTION, id: transaction._id, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drag(drop(ref));

  return (
    <tr
      ref={ref}
      style={{ opacity: isDragging ? 0.5 : 1, cursor: 'move' }}
      className="border-b"
    >
      <td className="py-3">{new Date(transaction.date).toLocaleDateString()}</td>
      <td className="py-3">{transaction.description}</td>
      <td className="py-3">{transaction.category}</td>
      <td className={`py-3 ${transaction.type === 'expense' ? 'text-red-600' : 'text-green-600'}`}>
        {transaction.type === 'expense' ? '-' : '+'}
        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(transaction.amount)}
      </td>
      <td className="py-3">
        <button
          onClick={() => onEdit(transaction)}
          className="text-indigo-600 hover:text-indigo-900 mr-4"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(transaction._id)}
          className="text-red-600 hover:text-red-900"
        >
          Delete
        </button>
      </td>
    </tr>
  );
};

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await transactionAPI.getAll({ limit: 50 });
      setTransactions(response.data.data.transactions);
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching transactions');
    } finally {
      setLoading(false);
    }
  };

  const moveTransaction = useCallback((fromIndex, toIndex) => {
    setTransactions((prevTransactions) => {
      const updated = [...prevTransactions];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return updated;
    });
  }, []);

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) return;
    try {
      await transactionAPI.delete(id);
      fetchTransactions();
    } catch (err) {
      setError(err.response?.data?.message || 'Error deleting transaction');
    }
  };

  const handleFormSubmit = async (data) => {
    try {
      if (editingTransaction) {
        await transactionAPI.update(editingTransaction._id, data);
      } else {
        await transactionAPI.create(data);
      }
      setShowForm(false);
      setEditingTransaction(null);
      fetchTransactions();
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving transaction');
    }
  };

  const handleBatchDelete = async () => {
    // Implement batch delete logic here
    // For now, placeholder
    alert('Batch delete feature is under development.');
  };

  if (loading) {
    return <div>Loading transactions...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Transactions</h1>
        <div>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Add Transaction
          </button>
          <button
            onClick={handleBatchDelete}
            className="ml-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Batch Delete
          </button>
        </div>
      </div>
      {error && <div className="text-red-600 mb-4">{error}</div>}
      <DndProvider backend={HTML5Backend}>
        <table className="min-w-full border-collapse border border-gray-200">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-2">Date</th>
              <th className="border border-gray-300 px-4 py-2">Description</th>
              <th className="border border-gray-300 px-4 py-2">Category</th>
              <th className="border border-gray-300 px-4 py-2">Amount</th>
              <th className="border border-gray-300 px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction, index) => (
              <DraggableTransaction
                key={transaction._id}
                transaction={transaction}
                index={index}
                moveTransaction={moveTransaction}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </tbody>
        </table>
      </DndProvider>
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <TransactionForm
              transaction={editingTransaction}
              onSubmit={handleFormSubmit}
              onCancel={() => {
                setShowForm(false);
                setEditingTransaction(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;
