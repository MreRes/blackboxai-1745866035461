const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  period: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  notifications: {
    enabled: {
      type: Boolean,
      default: true
    },
    threshold: {
      type: Number,
      default: 80 // percentage
    },
    frequency: {
      type: String,
      enum: ['never', 'daily', 'weekly', 'monthly'],
      default: 'weekly'
    }
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'completed'],
    default: 'active'
  },
  currentSpending: {
    type: Number,
    default: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  notes: String,
  tags: [{
    type: String
  }]
}, {
  timestamps: true
});

// Indexes for better query performance
budgetSchema.index({ userId: 1, category: 1 });
budgetSchema.index({ userId: 1, startDate: -1 });
budgetSchema.index({ userId: 1, status: 1 });

// Virtual for remaining budget
budgetSchema.virtual('remaining').get(function() {
  return this.amount - this.currentSpending;
});

// Virtual for percentage used
budgetSchema.virtual('percentageUsed').get(function() {
  return (this.currentSpending / this.amount) * 100;
});

// Virtual for formatted amount
budgetSchema.virtual('formattedAmount').get(function() {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR'
  }).format(this.amount);
});

// Method to check if budget is exceeded
budgetSchema.methods.isExceeded = function() {
  return this.currentSpending > this.amount;
};

// Method to check if budget is near threshold
budgetSchema.methods.isNearThreshold = function() {
  const percentageUsed = (this.currentSpending / this.amount) * 100;
  return percentageUsed >= this.notifications.threshold;
};

// Method to update current spending
budgetSchema.methods.updateSpending = async function(amount) {
  this.currentSpending += amount;
  this.lastUpdated = new Date();
  await this.save();
};

// Static method to get active budgets
budgetSchema.statics.getActiveBudgets = function(userId) {
  return this.find({
    userId,
    status: 'active',
    endDate: { $gte: new Date() }
  });
};

// Static method to get budget summary
budgetSchema.statics.getBudgetSummary = async function(userId) {
  return this.aggregate([
    {
      $match: {
        userId: mongoose.Types.ObjectId(userId),
        status: 'active'
      }
    },
    {
      $group: {
        _id: '$category',
        totalBudget: { $sum: '$amount' },
        totalSpending: { $sum: '$currentSpending' },
        count: { $sum: 1 }
      }
    }
  ]);
};

// Pre-save middleware to ensure endDate is after startDate
budgetSchema.pre('save', function(next) {
  if (this.endDate <= this.startDate) {
    next(new Error('End date must be after start date'));
  }
  next();
});

const Budget = mongoose.model('Budget', budgetSchema);

module.exports = Budget;
