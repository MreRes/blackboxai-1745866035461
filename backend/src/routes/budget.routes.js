const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validator');
const {
  createBudget,
  getBudgets,
  getBudget,
  updateBudget,
  deleteBudget,
  getBudgetSummary
} = require('../controllers/budget.controller');

// Validation schemas
const Joi = require('joi');

const budgetSchema = Joi.object({
  name: Joi.string()
    .required()
    .trim(),
  category: Joi.string()
    .required()
    .trim(),
  amount: Joi.number()
    .positive()
    .required(),
  period: Joi.string()
    .valid('daily', 'weekly', 'monthly', 'yearly')
    .required(),
  startDate: Joi.date()
    .required(),
  endDate: Joi.date()
    .greater(Joi.ref('startDate'))
    .required(),
  notifications: Joi.object({
    enabled: Joi.boolean().default(true),
    threshold: Joi.number().min(1).max(100).default(80),
    frequency: Joi.string()
      .valid('never', 'daily', 'weekly', 'monthly')
      .default('weekly')
  }).default(),
  isRecurring: Joi.boolean()
    .default(false),
  tags: Joi.array()
    .items(Joi.string())
    .default([])
});

const updateBudgetSchema = Joi.object({
  name: Joi.string()
    .trim(),
  amount: Joi.number()
    .positive(),
  notifications: Joi.object({
    enabled: Joi.boolean(),
    threshold: Joi.number().min(1).max(100),
    frequency: Joi.string().valid('never', 'daily', 'weekly', 'monthly')
  }),
  status: Joi.string()
    .valid('active', 'paused', 'completed'),
  tags: Joi.array()
    .items(Joi.string())
}).min(1);

// Routes
router.use(auth); // Protect all budget routes

// Create budget
router.post(
  '/',
  validateRequest(budgetSchema),
  createBudget
);

// Get all budgets with filtering, pagination, and sorting
router.get('/', getBudgets);

// Get budget by ID
router.get('/:id', getBudget);

// Update budget
router.put(
  '/:id',
  validateRequest(updateBudgetSchema),
  updateBudget
);

// Delete budget
router.delete('/:id', deleteBudget);

// Get budget summary
router.get('/summary/monthly', getBudgetSummary);

// Bulk create recurring budgets
router.post('/bulk/recurring', async (req, res) => {
  try {
    const { budgets } = req.body;
    const userId = req.user._id;

    // Validate each budget
    const validatedBudgets = budgets.map(budget => {
      const { error } = budgetSchema.validate(budget);
      if (error) throw new Error(`Invalid budget: ${error.message}`);
      return { ...budget, userId, isRecurring: true };
    });

    // Create budgets in bulk
    const result = await Budget.insertMany(validatedBudgets);

    res.status(201).json({
      success: true,
      message: 'Recurring budgets created successfully',
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error creating recurring budgets',
      error: error.message
    });
  }
});

// Copy budget to next period
router.post('/:id/copy', async (req, res) => {
  try {
    const userId = req.user._id;
    const sourceBudget = await Budget.findOne({
      _id: req.params.id,
      userId
    });

    if (!sourceBudget) {
      return res.status(404).json({
        success: false,
        message: 'Source budget not found'
      });
    }

    // Calculate new dates based on period
    let newStartDate = new Date(sourceBudget.endDate);
    newStartDate.setDate(newStartDate.getDate() + 1);
    
    let newEndDate = new Date(newStartDate);
    switch (sourceBudget.period) {
      case 'daily':
        newEndDate.setDate(newStartDate.getDate() + 1);
        break;
      case 'weekly':
        newEndDate.setDate(newStartDate.getDate() + 7);
        break;
      case 'monthly':
        newEndDate.setMonth(newStartDate.getMonth() + 1);
        break;
      case 'yearly':
        newEndDate.setFullYear(newStartDate.getFullYear() + 1);
        break;
    }

    // Create new budget
    const newBudget = new Budget({
      ...sourceBudget.toObject(),
      _id: undefined,
      startDate: newStartDate,
      endDate: newEndDate,
      currentSpending: 0,
      status: 'active',
      lastUpdated: new Date()
    });

    await newBudget.save();

    res.status(201).json({
      success: true,
      message: 'Budget copied successfully',
      data: newBudget
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error copying budget',
      error: error.message
    });
  }
});

// Get budget analytics
router.get('/:id/analytics', async (req, res) => {
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

    // Get daily spending pattern
    const dailySpending = await Transaction.aggregate([
      {
        $match: {
          userId: mongoose.Types.ObjectId(userId),
          category: budget.category,
          type: 'expense',
          date: {
            $gte: budget.startDate,
            $lte: budget.endDate
          }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$date' }
          },
          total: { $sum: '$amount' }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Calculate trends and predictions
    const analytics = {
      dailySpending,
      averageDaily: dailySpending.reduce((acc, day) => acc + day.total, 0) / dailySpending.length,
      projectedTotal: calculateProjectedTotal(dailySpending, budget),
      daysRemaining: Math.ceil((budget.endDate - new Date()) / (1000 * 60 * 60 * 24)),
      recommendedDailyLimit: (budget.amount - budget.currentSpending) / Math.ceil((budget.endDate - new Date()) / (1000 * 60 * 60 * 24))
    };

    res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error getting budget analytics',
      error: error.message
    });
  }
});

// Helper function to calculate projected total
const calculateProjectedTotal = (dailySpending, budget) => {
  if (dailySpending.length === 0) return 0;

  const averageDaily = dailySpending.reduce((acc, day) => acc + day.total, 0) / dailySpending.length;
  const daysRemaining = Math.ceil((budget.endDate - new Date()) / (1000 * 60 * 60 * 24));
  
  return budget.currentSpending + (averageDaily * daysRemaining);
};

module.exports = router;
