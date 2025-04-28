const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validator');
const {
  createGoal,
  getGoals,
  getGoal,
  updateGoal,
  deleteGoal,
  getGoalProgress
} = require('../controllers/goal.controller');

// Validation schemas
const Joi = require('joi');

const goalSchema = Joi.object({
  name: Joi.string()
    .required()
    .trim(),
  description: Joi.string()
    .trim(),
  targetAmount: Joi.number()
    .positive()
    .required(),
  deadline: Joi.date()
    .greater('now')
    .required(),
  category: Joi.string()
    .required()
    .trim(),
  priority: Joi.string()
    .valid('low', 'medium', 'high')
    .default('medium'),
  strategy: Joi.object({
    savingFrequency: Joi.string()
      .valid('daily', 'weekly', 'monthly')
      .required(),
    autoSave: Joi.object({
      enabled: Joi.boolean().default(false),
      amount: Joi.number().positive(),
      frequency: Joi.string().valid('daily', 'weekly', 'monthly')
    }).default({
      enabled: false
    })
  }).required(),
  notifications: Joi.object({
    enabled: Joi.boolean().default(true),
    frequency: Joi.string()
      .valid('daily', 'weekly', 'monthly', 'never')
      .default('weekly'),
    milestones: Joi.array().items(
      Joi.object({
        percentage: Joi.number().min(1).max(100),
        reached: Joi.boolean().default(false)
      })
    ).default([
      { percentage: 25 },
      { percentage: 50 },
      { percentage: 75 },
      { percentage: 100 }
    ])
  }).default()
});

const updateGoalSchema = Joi.object({
  name: Joi.string()
    .trim(),
  description: Joi.string()
    .trim(),
  targetAmount: Joi.number()
    .positive(),
  deadline: Joi.date()
    .greater('now'),
  priority: Joi.string()
    .valid('low', 'medium', 'high'),
  strategy: Joi.object({
    savingFrequency: Joi.string()
      .valid('daily', 'weekly', 'monthly'),
    autoSave: Joi.object({
      enabled: Joi.boolean(),
      amount: Joi.number().positive(),
      frequency: Joi.string().valid('daily', 'weekly', 'monthly')
    })
  }),
  notifications: Joi.object({
    enabled: Joi.boolean(),
    frequency: Joi.string()
      .valid('daily', 'weekly', 'monthly', 'never'),
    milestones: Joi.array().items(
      Joi.object({
        percentage: Joi.number().min(1).max(100),
        reached: Joi.boolean()
      })
    )
  }),
  status: Joi.string()
    .valid('active', 'completed', 'cancelled', 'paused')
}).min(1);

// Routes
router.use(auth); // Protect all goal routes

// Create goal
router.post(
  '/',
  validateRequest(goalSchema),
  createGoal
);

// Get all goals with filtering, pagination, and sorting
router.get('/', getGoals);

// Get goal by ID
router.get('/:id', getGoal);

// Update goal
router.put(
  '/:id',
  validateRequest(updateGoalSchema),
  updateGoal
);

// Delete goal
router.delete('/:id', deleteGoal);

// Get goal progress
router.get('/:id/progress', getGoalProgress);

// Add transaction to goal
router.post('/:id/transactions', async (req, res) => {
  try {
    const { amount, type, description } = req.body;
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

    // Create transaction
    const transaction = new Transaction({
      userId,
      type,
      amount,
      category: goal.category,
      description,
      tags: ['goal'],
      metadata: {
        goalId: goal._id
      }
    });

    await transaction.save();

    // Update goal progress
    await goal.addTransaction(
      amount,
      type === 'income' ? 'deposit' : 'withdrawal',
      description
    );

    res.status(201).json({
      success: true,
      message: 'Transaction added to goal successfully',
      data: {
        transaction,
        goalProgress: {
          currentAmount: goal.currentAmount,
          targetAmount: goal.targetAmount,
          percentageComplete: (goal.currentAmount / goal.targetAmount) * 100
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding transaction to goal',
      error: error.message
    });
  }
});

// Get goal analytics
router.get('/:id/analytics', async (req, res) => {
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

    // Get transactions history
    const transactions = await Transaction.find({
      userId,
      tags: 'goal',
      'metadata.goalId': goal._id
    }).sort({ date: 1 });

    // Calculate analytics
    const analytics = {
      savingRate: calculateSavingRate(transactions),
      projectedCompletion: calculateProjectedCompletion(goal, transactions),
      monthlyProgress: calculateMonthlyProgress(transactions),
      recommendations: generateRecommendations(goal, transactions)
    };

    res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error getting goal analytics',
      error: error.message
    });
  }
});

// Helper functions

const calculateSavingRate = (transactions) => {
  if (transactions.length < 2) return null;

  const deposits = transactions.filter(t => t.type === 'income');
  const totalSaved = deposits.reduce((sum, t) => sum + t.amount, 0);
  const daysBetween = (transactions[transactions.length - 1].date - transactions[0].date) / (1000 * 60 * 60 * 24);

  return {
    daily: totalSaved / daysBetween,
    weekly: (totalSaved / daysBetween) * 7,
    monthly: (totalSaved / daysBetween) * 30
  };
};

const calculateMonthlyProgress = (transactions) => {
  const monthlyData = transactions.reduce((acc, t) => {
    const monthYear = t.date.toISOString().substring(0, 7);
    if (!acc[monthYear]) {
      acc[monthYear] = { deposits: 0, withdrawals: 0 };
    }
    if (t.type === 'income') {
      acc[monthYear].deposits += t.amount;
    } else {
      acc[monthYear].withdrawals += t.amount;
    }
    return acc;
  }, {});

  return Object.entries(monthlyData).map(([month, data]) => ({
    month,
    ...data,
    net: data.deposits - data.withdrawals
  }));
};

const generateRecommendations = (goal, transactions) => {
  const savingRate = calculateSavingRate(transactions);
  if (!savingRate) return [];

  const recommendations = [];
  const daysRemaining = Math.ceil((goal.deadline - new Date()) / (1000 * 60 * 60 * 24));
  const requiredDailyRate = (goal.targetAmount - goal.currentAmount) / daysRemaining;

  if (savingRate.daily < requiredDailyRate) {
    recommendations.push({
      type: 'increase_savings',
      message: `To reach your goal, increase daily savings by ${(requiredDailyRate - savingRate.daily).toFixed(2)}`
    });
  }

  if (transactions.some(t => t.type === 'expense')) {
    recommendations.push({
      type: 'reduce_withdrawals',
      message: 'Consider reducing withdrawals to reach your goal faster'
    });
  }

  return recommendations;
};

module.exports = router;
