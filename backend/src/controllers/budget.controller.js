const Budget = require('../models/budget.model');
const Transaction = require('../models/transaction.model');
const logger = require('../utils/logger');
const mongoose = require('mongoose');

// Create budget
exports.createBudget = async (req, res) => {
  try {
    const {
      name,
      category,
      amount,
      period,
      startDate,
      endDate,
      notifications,
      isRecurring,
      tags
    } = req.body;
    const userId = req.user._id;

    // Check for existing active budget in same category and period
    const existingBudget = await Budget.findOne({
      userId,
      category,
      status: 'active',
      $or: [
        {
          startDate: { $lte: startDate },
          endDate: { $gte: startDate }
        },
        {
          startDate: { $lte: endDate },
          endDate: { $gte: endDate }
        }
      ]
    });

    if (existingBudget) {
      return res.status(400).json({
        success: false,
        message: 'An active budget already exists for this category and period'
      });
    }

    // Create budget
    const budget = new Budget({
      userId,
      name,
      category,
      amount,
      period,
      startDate,
      endDate,
      notifications,
      isRecurring,
      tags
    });

    // Calculate current spending
    const currentSpending = await Transaction.aggregate([
      {
        $match: {
          userId: mongoose.Types.ObjectId(userId),
          category,
          type: 'expense',
          date: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    if (currentSpending.length > 0) {
      budget.currentSpending = currentSpending[0].total;
    }

    await budget.save();

    // Log budget creation
    logger.logUserActivity(userId, 'create_budget', {
      budgetId: budget._id,
      category,
      amount
    });

    res.status(201).json({
      success: true,
      message: 'Budget created successfully',
      data: budget
    });
  } catch (error) {
    logger.error('Create budget error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating budget',
      error: error.message
    });
  }
};

// Get all budgets
exports.getBudgets = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      status,
      category,
      period,
      startDate,
      endDate,
      page = 1,
      limit = 10,
      sortBy = 'startDate',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = { userId };

    if (status) query.status = status;
    if (category) query.category = category;
    if (period) query.period = period;
    if (startDate || endDate) {
      query.$or = [];
      if (startDate) {
        query.$or.push({ startDate: { $gte: new Date(startDate) } });
      }
      if (endDate) {
        query.$or.push({ endDate: { $lte: new Date(endDate) } });
      }
    }

    // Execute query with pagination and sorting
    const budgets = await Budget.find(query)
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    // Get total count
    const total = await Budget.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        budgets,
        pagination: {
          total,
          page: Number(page),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get budgets error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching budgets',
      error: error.message
    });
  }
};

// Get budget by ID
exports.getBudget = async (req, res) => {
  try {
    const budget = await Budget.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found'
      });
    }

    res.status(200).json({
      success: true,
      data: budget
    });
  } catch (error) {
    logger.error('Get budget error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching budget',
      error: error.message
    });
  }
};

// Update budget
exports.updateBudget = async (req, res) => {
  try {
    const {
      name,
      amount,
      notifications,
      status,
      tags
    } = req.body;
    const userId = req.user._id;

    const budget = await Budget.findOne({
      _id: req.params.id,
      userId
    });

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found'
      });
    }

    // Update fields
    if (name) budget.name = name;
    if (amount) budget.amount = amount;
    if (notifications) budget.notifications = { ...budget.notifications, ...notifications };
    if (status) budget.status = status;
    if (tags) budget.tags = tags;

    await budget.save();

    // Log budget update
    logger.logUserActivity(userId, 'update_budget', {
      budgetId: budget._id,
      updates: req.body
    });

    res.status(200).json({
      success: true,
      message: 'Budget updated successfully',
      data: budget
    });
  } catch (error) {
    logger.error('Update budget error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating budget',
      error: error.message
    });
  }
};

// Delete budget
exports.deleteBudget = async (req, res) => {
  try {
    const userId = req.user._id;
    const budget = await Budget.findOne({
      _id: req.params.id,
      userId
    });

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found'
      });
    }

    await budget.remove();

    // Log budget deletion
    logger.logUserActivity(userId, 'delete_budget', {
      budgetId: budget._id,
      category: budget.category
    });

    res.status(200).json({
      success: true,
      message: 'Budget deleted successfully'
    });
  } catch (error) {
    logger.error('Delete budget error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting budget',
      error: error.message
    });
  }
};

// Get budget summary
exports.getBudgetSummary = async (req, res) => {
  try {
    const userId = req.user._id;
    const { month, year } = req.query;

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const summary = await Budget.aggregate([
      {
        $match: {
          userId: mongoose.Types.ObjectId(userId),
          status: 'active',
          startDate: { $lte: endDate },
          endDate: { $gte: startDate }
        }
      },
      {
        $lookup: {
          from: 'transactions',
          let: { 
            category: '$category',
            startDate: '$startDate',
            endDate: '$endDate'
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$userId', mongoose.Types.ObjectId(userId)] },
                    { $eq: ['$category', '$$category'] },
                    { $eq: ['$type', 'expense'] },
                    { $gte: ['$date', '$$startDate'] },
                    { $lte: ['$date', '$$endDate'] }
                  ]
                }
              }
            }
          ],
          as: 'transactions'
        }
      },
      {
        $project: {
          category: 1,
          amount: 1,
          currentSpending: 1,
          period: 1,
          transactions: {
            $sum: '$transactions.amount'
          },
          remaining: {
            $subtract: ['$amount', { $sum: '$transactions.amount' }]
          },
          percentageUsed: {
            $multiply: [
              {
                $divide: [
                  { $sum: '$transactions.amount' },
                  '$amount'
                ]
              },
              100
            ]
          }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    logger.error('Get budget summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting budget summary',
      error: error.message
    });
  }
};
