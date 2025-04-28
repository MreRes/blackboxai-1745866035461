const Transaction = require('../models/transaction.model');
const Budget = require('../models/budget.model');
const Goal = require('../models/goal.model');
const logger = require('../utils/logger');

// Create transaction
exports.createTransaction = async (req, res) => {
  try {
    const { type, amount, category, description, date, source, tags } = req.body;
    const userId = req.user._id;

    // Create transaction
    const transaction = new Transaction({
      userId,
      type,
      amount,
      category,
      description,
      date: date || new Date(),
      source: source || 'web',
      tags
    });

    await transaction.save();

    // Update budget if exists
    if (type === 'expense') {
      const budget = await Budget.findOne({
        userId,
        category,
        status: 'active',
        startDate: { $lte: transaction.date },
        endDate: { $gte: transaction.date }
      });

      if (budget) {
        await budget.updateSpending(amount);
      }
    }

    // Update goal if transaction is tagged with a goal
    if (tags && tags.includes('goal')) {
      const goalId = req.body.goalId;
      if (goalId) {
        const goal = await Goal.findOne({ _id: goalId, userId });
        if (goal) {
          await goal.addTransaction(
            amount,
            type === 'income' ? 'deposit' : 'withdrawal',
            description
          );
        }
      }
    }

    // Log transaction
    logger.logTransaction(userId, transaction);

    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      data: transaction
    });
  } catch (error) {
    logger.error('Create transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating transaction',
      error: error.message
    });
  }
};

// Get all transactions
exports.getTransactions = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      type,
      category,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      source,
      tags,
      page = 1,
      limit = 10,
      sortBy = 'date',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = { userId };

    if (type) query.type = type;
    if (category) query.category = category;
    if (source) query.source = source;
    if (tags) query.tags = { $in: tags.split(',') };
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    if (minAmount || maxAmount) {
      query.amount = {};
      if (minAmount) query.amount.$gte = Number(minAmount);
      if (maxAmount) query.amount.$lte = Number(maxAmount);
    }

    // Execute query with pagination and sorting
    const transactions = await Transaction.find(query)
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    // Get total count
    const total = await Transaction.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        transactions,
        pagination: {
          total,
          page: Number(page),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching transactions',
      error: error.message
    });
  }
};

// Get transaction by ID
exports.getTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    res.status(200).json({
      success: true,
      data: transaction
    });
  } catch (error) {
    logger.error('Get transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching transaction',
      error: error.message
    });
  }
};

// Update transaction
exports.updateTransaction = async (req, res) => {
  try {
    const { amount, category, description, date, tags } = req.body;
    const userId = req.user._id;

    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Update budget if category changed or amount changed
    if (transaction.type === 'expense' && 
        (category !== transaction.category || amount !== transaction.amount)) {
      // Revert old budget
      const oldBudget = await Budget.findOne({
        userId,
        category: transaction.category,
        status: 'active',
        startDate: { $lte: transaction.date },
        endDate: { $gte: transaction.date }
      });

      if (oldBudget) {
        await oldBudget.updateSpending(-transaction.amount);
      }

      // Update new budget
      const newBudget = await Budget.findOne({
        userId,
        category: category || transaction.category,
        status: 'active',
        startDate: { $lte: date || transaction.date },
        endDate: { $gte: date || transaction.date }
      });

      if (newBudget) {
        await newBudget.updateSpending(amount || transaction.amount);
      }
    }

    // Update transaction
    Object.assign(transaction, {
      amount: amount || transaction.amount,
      category: category || transaction.category,
      description: description || transaction.description,
      date: date || transaction.date,
      tags: tags || transaction.tags
    });

    await transaction.save();

    // Log update
    logger.logTransaction(userId, transaction);

    res.status(200).json({
      success: true,
      message: 'Transaction updated successfully',
      data: transaction
    });
  } catch (error) {
    logger.error('Update transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating transaction',
      error: error.message
    });
  }
};

// Delete transaction
exports.deleteTransaction = async (req, res) => {
  try {
    const userId = req.user._id;
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Update budget if expense
    if (transaction.type === 'expense') {
      const budget = await Budget.findOne({
        userId,
        category: transaction.category,
        status: 'active',
        startDate: { $lte: transaction.date },
        endDate: { $gte: transaction.date }
      });

      if (budget) {
        await budget.updateSpending(-transaction.amount);
      }
    }

    await transaction.remove();

    // Log deletion
    logger.logUserActivity(userId, 'delete_transaction', {
      transactionId: transaction._id,
      amount: transaction.amount,
      category: transaction.category
    });

    res.status(200).json({
      success: true,
      message: 'Transaction deleted successfully'
    });
  } catch (error) {
    logger.error('Delete transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting transaction',
      error: error.message
    });
  }
};

// Get transaction summary
exports.getTransactionSummary = async (req, res) => {
  try {
    const userId = req.user._id;
    const { startDate, endDate } = req.query;

    const summary = await Transaction.aggregate([
      {
        $match: {
          userId: mongoose.Types.ObjectId(userId),
          date: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          }
        }
      },
      {
        $group: {
          _id: {
            type: '$type',
            category: '$category'
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.type',
          categories: {
            $push: {
              category: '$_id.category',
              total: '$total',
              count: '$count'
            }
          },
          totalAmount: { $sum: '$total' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    logger.error('Get transaction summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting transaction summary',
      error: error.message
    });
  }
};
