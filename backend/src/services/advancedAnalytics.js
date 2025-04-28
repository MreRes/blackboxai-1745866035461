const mongoose = require('mongoose');
const logger = require('../utils/logger');
const Transaction = require('../models/transaction.model');
const Budget = require('../models/budget.model');
const Goal = require('../models/goal.model');

class AdvancedAnalyticsService {
  constructor() {
    this.healthScoreFactors = {
      savingsRate: 0.25,
      debtToIncome: 0.25,
      budgetAdherence: 0.20,
      emergencyFund: 0.15,
      goalProgress: 0.15
    };
  }

  async generateFinancialReport(userId, period) {
    try {
      const startDate = this.getStartDate(period);
      const endDate = new Date();

      const [
        transactions,
        budgets,
        goals,
        spendingTrends,
        categoryAnalysis
      ] = await Promise.all([
        this.getTransactionSummary(userId, startDate, endDate),
        this.getBudgetAnalysis(userId, startDate, endDate),
        this.getGoalProgress(userId),
        this.analyzeSpendingTrends(userId, startDate, endDate),
        this.analyzeCategoryDistribution(userId, startDate, endDate)
      ]);

      const healthScore = await this.calculateFinancialHealthScore(userId);
      const recommendations = this.generateRecommendations({
        transactions,
        budgets,
        goals,
        spendingTrends,
        healthScore
      });

      return {
        summary: {
          totalIncome: transactions.totalIncome,
          totalExpenses: transactions.totalExpenses,
          netSavings: transactions.totalIncome - transactions.totalExpenses,
          healthScore
        },
        transactions,
        budgets,
        goals,
        analysis: {
          spendingTrends,
          categoryAnalysis,
          recommendations
        }
      };
    } catch (error) {
      logger.error('Error generating financial report:', error);
      throw error;
    }
  }

  getStartDate(period) {
    const now = new Date();
    switch (period) {
      case 'week':
        return new Date(now.setDate(now.getDate() - 7));
      case 'month':
        return new Date(now.setMonth(now.getMonth() - 1));
      case 'quarter':
        return new Date(now.setMonth(now.getMonth() - 3));
      case 'year':
        return new Date(now.setFullYear(now.getFullYear() - 1));
      default:
        return new Date(now.setMonth(now.getMonth() - 1)); // Default to 1 month
    }
  }

  async getTransactionSummary(userId, startDate, endDate) {
    try {
      const summary = await Transaction.aggregate([
        {
          $match: {
            userId: mongoose.Types.ObjectId(userId),
            date: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: '$type',
            total: { $sum: '$amount' },
            count: { $sum: 1 },
            categories: {
              $push: {
                category: '$category',
                amount: '$amount'
              }
            }
          }
        }
      ]);

      const income = summary.find(s => s._id === 'income') || { total: 0, count: 0 };
      const expenses = summary.find(s => s._id === 'expense') || { total: 0, count: 0 };

      return {
        totalIncome: income.total,
        totalExpenses: expenses.total,
        transactionCount: income.count + expenses.count,
        categories: this.aggregateCategories([...income.categories || [], ...expenses.categories || []])
      };
    } catch (error) {
      logger.error('Error getting transaction summary:', error);
      throw error;
    }
  }

  async getBudgetAnalysis(userId, startDate, endDate) {
    try {
      const budgets = await Budget.find({
        userId,
        startDate: { $lte: endDate },
        endDate: { $gte: startDate }
      });

      const analysis = await Promise.all(budgets.map(async budget => {
        const transactions = await Transaction.find({
          userId,
          category: budget.category,
          date: { $gte: budget.startDate, $lte: budget.endDate },
          type: 'expense'
        });

        const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0);
        const adherenceRate = ((budget.amount - totalSpent) / budget.amount) * 100;

        return {
          category: budget.category,
          budgeted: budget.amount,
          spent: totalSpent,
          remaining: budget.amount - totalSpent,
          adherenceRate: Math.max(0, Math.min(100, adherenceRate)),
          status: this.getBudgetStatus(adherenceRate)
        };
      }));

      return {
        budgets: analysis,
        averageAdherence: this.calculateAverageAdherence(analysis)
      };
    } catch (error) {
      logger.error('Error getting budget analysis:', error);
      throw error;
    }
  }

  async getGoalProgress(userId) {
    try {
      const goals = await Goal.find({ userId });
      return goals.map(goal => ({
        name: goal.name,
        target: goal.targetAmount,
        current: goal.currentAmount,
        progress: (goal.currentAmount / goal.targetAmount) * 100,
        remainingDays: Math.ceil((new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24)),
        status: this.getGoalStatus(goal)
      }));
    } catch (error) {
      logger.error('Error getting goal progress:', error);
      throw error;
    }
  }

  async analyzeSpendingTrends(userId, startDate, endDate) {
    try {
      const transactions = await Transaction.find({
        userId,
        type: 'expense',
        date: { $gte: startDate, $lte: endDate }
      }).sort('date');

      const dailySpending = this.aggregateDailySpending(transactions);
      const trends = this.calculateTrends(dailySpending);

      return {
        dailySpending,
        trends,
        prediction: this.predictFutureSpending(dailySpending)
      };
    } catch (error) {
      logger.error('Error analyzing spending trends:', error);
      throw error;
    }
  }

  async analyzeCategoryDistribution(userId, startDate, endDate) {
    try {
      const distribution = await Transaction.aggregate([
        {
          $match: {
            userId: mongoose.Types.ObjectId(userId),
            type: 'expense',
            date: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: '$category',
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        {
          $project: {
            category: '$_id',
            total: 1,
            count: 1,
            percentage: {
              $multiply: [
                { $divide: ['$total', { $sum: '$total' }] },
                100
              ]
            }
          }
        },
        { $sort: { total: -1 } }
      ]);

      return {
        distribution,
        topCategories: distribution.slice(0, 5),
        insights: this.generateCategoryInsights(distribution)
      };
    } catch (error) {
      logger.error('Error analyzing category distribution:', error);
      throw error;
    }
  }

  async calculateFinancialHealthScore(userId) {
    try {
      const scores = await Promise.all([
        this.calculateSavingsScore(userId),
        this.calculateDebtScore(userId),
        this.calculateBudgetScore(userId),
        this.calculateEmergencyFundScore(userId),
        this.calculateGoalScore(userId)
      ]);

      const weightedScore = scores.reduce((total, score, index) => {
        const weight = Object.values(this.healthScoreFactors)[index];
        return total + (score * weight);
      }, 0);

      return {
        overall: Math.round(weightedScore),
        components: {
          savings: scores[0],
          debt: scores[1],
          budget: scores[2],
          emergencyFund: scores[3],
          goals: scores[4]
        },
        category: this.getHealthScoreCategory(weightedScore)
      };
    } catch (error) {
      logger.error('Error calculating financial health score:', error);
      throw error;
    }
  }

  generateRecommendations(data) {
    const recommendations = [];

    // Savings recommendations
    if (data.transactions.totalIncome > 0) {
      const savingsRate = ((data.transactions.totalIncome - data.transactions.totalExpenses) / data.transactions.totalIncome) * 100;
      if (savingsRate < 20) {
        recommendations.push({
          type: 'savings',
          priority: 'high',
          message: 'Tingkatkan rasio tabungan hingga minimal 20% dari pendapatan'
        });
      }
    }

    // Budget recommendations
    const lowAdherenceBudgets = data.budgets.budgets.filter(b => b.adherenceRate < 80);
    if (lowAdherenceBudgets.length > 0) {
      recommendations.push({
        type: 'budget',
        priority: 'medium',
        message: `Perhatikan pengeluaran untuk kategori: ${lowAdherenceBudgets.map(b => b.category).join(', ')}`
      });
    }

    // Goal recommendations
    const strugglingGoals = data.goals.filter(g => g.progress < 50 && g.remainingDays < 30);
    if (strugglingGoals.length > 0) {
      recommendations.push({
        type: 'goals',
        priority: 'high',
        message: 'Beberapa target keuangan memerlukan perhatian khusus'
      });
    }

    return recommendations;
  }

  // Helper methods
  aggregateCategories(categories) {
    return categories.reduce((acc, curr) => {
      if (!acc[curr.category]) {
        acc[curr.category] = 0;
      }
      acc[curr.category] += curr.amount;
      return acc;
    }, {});
  }

  getBudgetStatus(adherenceRate) {
    if (adherenceRate >= 90) return 'excellent';
    if (adherenceRate >= 70) return 'good';
    if (adherenceRate >= 50) return 'warning';
    return 'danger';
  }

  getGoalStatus(goal) {
    const progress = (goal.currentAmount / goal.targetAmount) * 100;
    const daysRemaining = Math.ceil((new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24));
    const expectedProgress = ((goal.deadline - goal.startDate) / daysRemaining) * 100;

    if (progress >= expectedProgress) return 'on_track';
    if (progress >= expectedProgress * 0.8) return 'at_risk';
    return 'behind';
  }

  calculateAverageAdherence(budgets) {
    if (budgets.length === 0) return 0;
    return budgets.reduce((sum, b) => sum + b.adherenceRate, 0) / budgets.length;
  }

  aggregateDailySpending(transactions) {
    return transactions.reduce((acc, t) => {
      const date = t.date.toISOString().split('T')[0];
      if (!acc[date]) acc[date] = 0;
      acc[date] += t.amount;
      return acc;
    }, {});
  }

  calculateTrends(dailySpending) {
    const values = Object.values(dailySpending);
    if (values.length < 2) return { trend: 'neutral', change: 0 };

    const average = values.reduce((a, b) => a + b, 0) / values.length;
    const recentAvg = values.slice(-7).reduce((a, b) => a + b, 0) / Math.min(7, values.length);
    const change = ((recentAvg - average) / average) * 100;

    return {
      trend: change > 5 ? 'increasing' : change < -5 ? 'decreasing' : 'stable',
      change: Math.round(change)
    };
  }

  predictFutureSpending(dailySpending) {
    const values = Object.values(dailySpending);
    if (values.length < 7) return null;

    const weeklyAverages = [];
    for (let i = 0; i < values.length - 6; i += 7) {
      const weekSum = values.slice(i, i + 7).reduce((a, b) => a + b, 0);
      weeklyAverages.push(weekSum / 7);
    }

    const predictedDaily = weeklyAverages.reduce((a, b) => a + b, 0) / weeklyAverages.length;
    return {
      daily: Math.round(predictedDaily),
      weekly: Math.round(predictedDaily * 7),
      monthly: Math.round(predictedDaily * 30)
    };
  }

  generateCategoryInsights(distribution) {
    const insights = [];
    const total = distribution.reduce((sum, cat) => sum + cat.total, 0);

    distribution.forEach(cat => {
      if (cat.percentage > 30) {
        insights.push({
          category: cat.category,
          message: `Pengeluaran untuk ${cat.category} melebihi 30% dari total pengeluaran`
        });
      }
    });

    return insights;
  }

  getHealthScoreCategory(score) {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Very Good';
    if (score >= 70) return 'Good';
    if (score >= 60) return 'Fair';
    return 'Needs Improvement';
  }
}

module.exports = new AdvancedAnalyticsService();
