const Goal = require('../models/goal.model');
const Transaction = require('../models/transaction.model');
const logger = require('../utils/logger');
const mongoose = require('mongoose');

// Create goal
exports.createGoal = async (req, res) => {
  try {
    const {
      name,
      description,
      targetAmount,
      deadline,
      category,
      priority,
      strategy,
      notifications
    } = req.body;
    const userId = req.user._id;

    // Create goal
    const goal = new Goal({
      userId,
      name,
      description,
      targetAmount,
      deadline,
      category,
      priority,
      strategy: {
        ...strategy,
        recommendedAmount: calculateRecommendedAmount(targetAmount, deadline)
      },
      notifications
    });

    await goal.save();

    // Log goal creation
    logger.logUserActivity(userId, 'create_goal', {
      goalId: goal._id,
      name,
      targetAmount
    });

    res.status(201).json({
      success: true,
      message: 'Goal created successfully',
      data: goal
    });
  } catch (error) {
    logger.error('Create goal error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating goal',
      error: error.message
    });
  }
};

// Get all goals
exports.getGoals = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      status,
      category,
      priority,
      page = 1,
      limit = 10,
      sortBy = 'deadline',
      sortOrder = 'asc'
    } = req.query;

    // Build query
    const query = { userId };

    if (status) query.status = status;
    if (category) query.category = category;
    if (priority) query.priority = priority;

    // Execute query with pagination and sorting
    const goals = await Goal.find(query)
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    // Get total count
    const total = await Goal.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        goals,
        pagination: {
          total,
          page: Number(page),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get goals error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching goals',
      error: error.message
    });
  }
};

// Get goal by ID
exports.getGoal = async (req, res) => {
  try {
    const goal = await Goal.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found'
      });
    }

    res.status(200).json({
      success: true,
      data: goal
    });
  } catch (error) {
    logger.error('Get goal error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching goal',
      error: error.message
    });
  }
};

// Update goal
exports.updateGoal = async (req, res) => {
  try {
    const {
      name,
      description,
      targetAmount,
      deadline,
      priority,
      strategy,
      notifications,
      status
    } = req.body;
    const userId = req.user._id;

    const goal = await Goal.findOne({
      _id: req.params.id,
      userId
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found'
      });
    }

    // Update fields
    if (name) goal.name = name;
    if (description) goal.description = description;
    if (targetAmount) {
      goal.targetAmount = targetAmount;
      // Recalculate recommended amount if deadline hasn't changed
      if (!deadline) {
        goal.strategy.recommendedAmount = calculateRecommendedAmount(targetAmount, goal.deadline);
      }
    }
    if (deadline) {
      goal.deadline = deadline;
      goal.strategy.recommendedAmount = calculateRecommendedAmount(goal.targetAmount, deadline);
    }
    if (priority) goal.priority = priority;
    if (strategy) goal.strategy = { ...goal.strategy, ...strategy };
    if (notifications) goal.notifications = { ...goal.notifications, ...notifications };
    if (status) goal.status = status;

    await goal.save();

    // Log goal update
    logger.logUserActivity(userId, 'update_goal', {
      goalId: goal._id,
      updates: req.body
    });

    res.status(200).json({
      success: true,
      message: 'Goal updated successfully',
      data: goal
    });
  } catch (error) {
    logger.error('Update goal error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating goal',
      error: error.message
    });
  }
};

// Delete goal
exports.deleteGoal = async (req, res) => {
  try {
    const userId = req.user._id;
    const goal = await Goal.findOne({
      _id: req.params.id,
      userId
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found'
      });
    }

    await goal.remove();

    // Log goal deletion
    logger.logUserActivity(userId, 'delete_goal', {
      goalId: goal._id,
      name: goal.name
    });

    res.status(200).json({
      success: true,
      message: 'Goal deleted successfully'
    });
  } catch (error) {
    logger.error('Delete goal error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting goal',
      error: error.message
    });
  }
};

// Get goal progress
exports.getGoalProgress = async (req, res) => {
  try {
    const userId = req.user._id;
    const goal = await Goal.findOne({
      _id: req.params.id,
      userId
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found'
      });
    }

    // Get transactions related to this goal
    const transactions = await Transaction.find({
      userId,
      tags: 'goal',
      'metadata.goalId': goal._id
    }).sort({ date: 1 });

    // Calculate progress metrics
    const progress = {
      currentAmount: goal.currentAmount,
      targetAmount: goal.targetAmount,
      percentageComplete: (goal.currentAmount / goal.targetAmount) * 100,
      remainingAmount: goal.targetAmount - goal.currentAmount,
      daysRemaining: Math.ceil((goal.deadline - new Date()) / (1000 * 60 * 60 * 24)),
      transactions: transactions,
      projectedCompletion: calculateProjectedCompletion(goal, transactions),
      recommendedAdjustments: calculateRecommendedAdjustments(goal)
    };

    res.status(200).json({
      success: true,
      data: progress
    });
  } catch (error) {
    logger.error('Get goal progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching goal progress',
      error: error.message
    });
  }
};

// Helper functions

const calculateRecommendedAmount = (targetAmount, deadline) => {
  const today = new Date();
  const daysRemaining = Math.ceil((new Date(deadline) - today) / (1000 * 60 * 60 * 24));
  return targetAmount / daysRemaining;
};

const calculateProjectedCompletion = (goal, transactions) => {
  if (transactions.length < 2) return null;

  // Calculate average daily savings
  const daysBetween = (transactions[transactions.length - 1].date - transactions[0].date) / (1000 * 60 * 60 * 24);
  const averageDailySavings = goal.currentAmount / daysBetween;

  // Project completion date
  const remainingAmount = goal.targetAmount - goal.currentAmount;
  const daysNeeded = remainingAmount / averageDailySavings;
  const projectedDate = new Date();
  projectedDate.setDate(projectedDate.getDate() + daysNeeded);

  return {
    projectedDate,
    onTrack: projectedDate <= goal.deadline,
    averageDailySavings
  };
};

const calculateRecommendedAdjustments = (goal) => {
  const today = new Date();
  const daysRemaining = Math.ceil((goal.deadline - today) / (1000 * 60 * 60 * 24));
  const remainingAmount = goal.targetAmount - goal.currentAmount;
  const requiredDailySavings = remainingAmount / daysRemaining;

  return {
    requiredDailySavings,
    requiredWeeklySavings: requiredDailySavings * 7,
    requiredMonthlySavings: requiredDailySavings * 30,
    adjustmentNeeded: requiredDailySavings > goal.strategy.recommendedAmount
  };
};

module.exports = exports;
