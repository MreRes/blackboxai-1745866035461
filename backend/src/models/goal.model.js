const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: String,
  targetAmount: {
    type: Number,
    required: true
  },
  currentAmount: {
    type: Number,
    default: 0
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  deadline: {
    type: Date,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled', 'paused'],
    default: 'active'
  },
  notifications: {
    enabled: {
      type: Boolean,
      default: true
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'never'],
      default: 'weekly'
    },
    milestones: [{
      percentage: Number,
      reached: Boolean,
      reachedAt: Date
    }]
  },
  strategy: {
    savingFrequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      required: true
    },
    recommendedAmount: {
      type: Number,
      required: true
    },
    autoSave: {
      enabled: {
        type: Boolean,
        default: false
      },
      amount: Number,
      frequency: String
    }
  },
  history: [{
    date: Date,
    amount: Number,
    type: {
      type: String,
      enum: ['deposit', 'withdrawal']
    },
    description: String
  }],
  tags: [{
    type: String
  }]
}, {
  timestamps: true
});

// Indexes
goalSchema.index({ userId: 1, status: 1 });
goalSchema.index({ userId: 1, deadline: 1 });
goalSchema.index({ userId: 1, category: 1 });

// Virtual for progress percentage
goalSchema.virtual('progressPercentage').get(function() {
  return (this.currentAmount / this.targetAmount) * 100;
});

// Virtual for remaining amount
goalSchema.virtual('remainingAmount').get(function() {
  return this.targetAmount - this.currentAmount;
});

// Virtual for days remaining
goalSchema.virtual('daysRemaining').get(function() {
  const today = new Date();
  const timeDiff = this.deadline.getTime() - today.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
});

// Virtual for formatted amounts
goalSchema.virtual('formattedTargetAmount').get(function() {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR'
  }).format(this.targetAmount);
});

goalSchema.virtual('formattedCurrentAmount').get(function() {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR'
  }).format(this.currentAmount);
});

// Method to add transaction to goal
goalSchema.methods.addTransaction = async function(amount, type, description) {
  if (type === 'deposit') {
    this.currentAmount += amount;
  } else if (type === 'withdrawal') {
    this.currentAmount = Math.max(0, this.currentAmount - amount);
  }

  this.history.push({
    date: new Date(),
    amount,
    type,
    description
  });

  // Check and update milestones
  const currentProgress = this.progressPercentage;
  this.notifications.milestones.forEach(milestone => {
    if (!milestone.reached && currentProgress >= milestone.percentage) {
      milestone.reached = true;
      milestone.reachedAt = new Date();
    }
  });

  if (this.currentAmount >= this.targetAmount) {
    this.status = 'completed';
  }

  await this.save();
  return this;
};

// Static method to get active goals
goalSchema.statics.getActiveGoals = function(userId) {
  return this.find({
    userId,
    status: 'active'
  }).sort({ deadline: 1 });
};

// Static method to get goals summary
goalSchema.statics.getGoalsSummary = async function(userId) {
  return this.aggregate([
    {
      $match: {
        userId: mongoose.Types.ObjectId(userId)
      }
    },
    {
      $group: {
        _id: '$status',
        totalTargetAmount: { $sum: '$targetAmount' },
        totalCurrentAmount: { $sum: '$currentAmount' },
        count: { $sum: 1 }
      }
    }
  ]);
};

// Pre-save middleware
goalSchema.pre('save', function(next) {
  if (this.deadline <= this.startDate) {
    next(new Error('Deadline must be after start date'));
  }
  next();
});

const Goal = mongoose.model('Goal', goalSchema);

module.exports = Goal;
