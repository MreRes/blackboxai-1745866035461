const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validator');
const {
  createTransaction,
  getTransactions,
  getTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactionSummary
} = require('../controllers/transaction.controller');

// Validation schemas
const Joi = require('joi');

const transactionSchema = Joi.object({
  type: Joi.string()
    .valid('income', 'expense', 'transfer')
    .required(),
  amount: Joi.number()
    .positive()
    .required(),
  category: Joi.string()
    .required(),
  description: Joi.string()
    .required(),
  date: Joi.date()
    .max('now')
    .default(Date.now),
  source: Joi.string()
    .valid('web', 'whatsapp', 'mobile')
    .default('web'),
  tags: Joi.array()
    .items(Joi.string())
    .default([]),
  goalId: Joi.string()
    .when('tags', {
      is: Joi.array().items(Joi.string().valid('goal')),
      then: Joi.required(),
      otherwise: Joi.forbidden()
    }),
  attachments: Joi.array()
    .items(
      Joi.object({
        type: Joi.string(),
        url: Joi.string(),
        description: Joi.string()
      })
    )
    .default([]),
  location: Joi.object({
    type: Joi.string().valid('Point'),
    coordinates: Joi.array().items(Joi.number()).length(2)
  })
});

const updateTransactionSchema = Joi.object({
  amount: Joi.number()
    .positive(),
  category: Joi.string(),
  description: Joi.string(),
  date: Joi.date()
    .max('now'),
  tags: Joi.array()
    .items(Joi.string()),
  attachments: Joi.array()
    .items(
      Joi.object({
        type: Joi.string(),
        url: Joi.string(),
        description: Joi.string()
      })
    ),
  location: Joi.object({
    type: Joi.string().valid('Point'),
    coordinates: Joi.array().items(Joi.number()).length(2)
  })
}).min(1);

// Routes
router.use(auth); // Protect all transaction routes

// Create transaction
router.post(
  '/',
  validateRequest(transactionSchema),
  createTransaction
);

// Get all transactions with filtering, pagination, and sorting
router.get('/', getTransactions);

// Get transaction by ID
router.get('/:id', getTransaction);

// Update transaction
router.put(
  '/:id',
  validateRequest(updateTransactionSchema),
  updateTransaction
);

// Delete transaction
router.delete('/:id', deleteTransaction);

// Get transaction summary
router.get('/summary/period', getTransactionSummary);

// Bulk operations
router.post('/bulk', async (req, res) => {
  try {
    const { transactions } = req.body;
    const userId = req.user._id;

    // Validate each transaction
    const validatedTransactions = transactions.map(transaction => {
      const { error } = transactionSchema.validate(transaction);
      if (error) throw new Error(`Invalid transaction: ${error.message}`);
      return { ...transaction, userId };
    });

    // Create transactions in bulk
    const result = await Transaction.insertMany(validatedTransactions);

    // Update budgets and goals as needed
    for (const transaction of result) {
      if (transaction.type === 'expense') {
        const budget = await Budget.findOne({
          userId,
          category: transaction.category,
          status: 'active',
          startDate: { $lte: transaction.date },
          endDate: { $gte: transaction.date }
        });

        if (budget) {
          await budget.updateSpending(transaction.amount);
        }
      }

      if (transaction.tags?.includes('goal') && transaction.goalId) {
        const goal = await Goal.findOne({ _id: transaction.goalId, userId });
        if (goal) {
          await goal.addTransaction(
            transaction.amount,
            transaction.type === 'income' ? 'deposit' : 'withdrawal',
            transaction.description
          );
        }
      }
    }

    res.status(201).json({
      success: true,
      message: 'Transactions created successfully',
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error creating transactions',
      error: error.message
    });
  }
});

// Export transactions
router.get('/export/:format', async (req, res) => {
  try {
    const { format } = req.params;
    const { startDate, endDate } = req.query;
    const userId = req.user._id;

    // Build query
    const query = { userId };
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    // Get transactions
    const transactions = await Transaction.find(query)
      .sort({ date: -1 });

    // Format data based on requested format
    let data;
    switch (format.toLowerCase()) {
      case 'csv':
        data = formatTransactionsToCSV(transactions);
        res.header('Content-Type', 'text/csv');
        res.attachment('transactions.csv');
        break;
      case 'excel':
        data = await formatTransactionsToExcel(transactions);
        res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.attachment('transactions.xlsx');
        break;
      case 'pdf':
        data = await formatTransactionsToPDF(transactions);
        res.header('Content-Type', 'application/pdf');
        res.attachment('transactions.pdf');
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Unsupported export format'
        });
    }

    res.send(data);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error exporting transactions',
      error: error.message
    });
  }
});

// Helper functions for formatting exports
const formatTransactionsToCSV = (transactions) => {
  const headers = ['Date', 'Type', 'Amount', 'Category', 'Description', 'Tags'];
  const rows = transactions.map(t => [
    new Date(t.date).toISOString(),
    t.type,
    t.amount,
    t.category,
    t.description,
    t.tags.join(', ')
  ]);
  
  return [headers, ...rows]
    .map(row => row.join(','))
    .join('\n');
};

const formatTransactionsToExcel = async (transactions) => {
  // Implementation would use a library like 'excel4node'
  // to create Excel file
  throw new Error('Excel export not implemented');
};

const formatTransactionsToPDF = async (transactions) => {
  // Implementation would use a library like 'pdfkit'
  // to create PDF file
  throw new Error('PDF export not implemented');
};

module.exports = router;
