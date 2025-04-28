const mongoose = require('mongoose');
const logger = require('../utils/logger');

// Schema for financial tips
const financialTipSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: ['basic', 'investment', 'debt', 'savings', 'tax', 'insurance']
  },
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  tags: [String],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const FinancialTip = mongoose.model('FinancialTip', financialTipSchema);

class FinancialEducationService {
  constructor() {
    this.tips = this.initializeTips();
    this.gamificationRules = this.initializeGamificationRules();
    this.marketUpdates = new Map();
  }

  async initializeTips() {
    try {
      const basicTips = [
        {
          category: 'basic',
          title: 'Aturan 50/30/20',
          content: 'Bagi pengeluaran Anda: 50% kebutuhan, 30% keinginan, dan 20% tabungan.',
          difficulty: 'beginner',
          tags: ['budgeting', 'saving']
        },
        {
          category: 'savings',
          title: 'Dana Darurat',
          content: 'Siapkan dana darurat minimal 3-6 kali pengeluaran bulanan.',
          difficulty: 'beginner',
          tags: ['emergency fund', 'saving']
        },
        {
          category: 'investment',
          title: 'Diversifikasi Investasi',
          content: 'Jangan menaruh semua telur dalam satu keranjang. Diversifikasi portofolio Anda.',
          difficulty: 'intermediate',
          tags: ['investment', 'risk management']
        },
        {
          category: 'debt',
          title: 'Manajemen Utang',
          content: 'Prioritaskan melunasi utang dengan bunga tertinggi terlebih dahulu.',
          difficulty: 'intermediate',
          tags: ['debt', 'management']
        }
      ];

      // Insert tips if they don't exist
      for (const tip of basicTips) {
        await FinancialTip.findOneAndUpdate(
          { title: tip.title },
          tip,
          { upsert: true, new: true }
        );
      }

      logger.info('Financial tips initialized');
    } catch (error) {
      logger.error('Error initializing financial tips:', error);
    }
  }

  initializeGamificationRules() {
    return {
      achievements: {
        firstTransaction: {
          name: 'Transaksi Pertama',
          points: 10,
          description: 'Mencatat transaksi pertama Anda'
        },
        consistentSaving: {
          name: 'Penabung Konsisten',
          points: 50,
          description: 'Menabung selama 7 hari berturut-turut'
        },
        budgetMaster: {
          name: 'Master Anggaran',
          points: 100,
          description: 'Berhasil mengikuti anggaran selama sebulan penuh'
        },
        goalAchiever: {
          name: 'Pencapai Tujuan',
          points: 200,
          description: 'Mencapai target tabungan pertama'
        }
      },
      levels: [
        { name: 'Pemula', minPoints: 0 },
        { name: 'Terampil', minPoints: 100 },
        { name: 'Mahir', minPoints: 500 },
        { name: 'Ahli', minPoints: 1000 },
        { name: 'Master', minPoints: 5000 }
      ],
      rewards: {
        customBadges: true,
        progressTracking: true,
        specialFeatures: true
      }
    };
  }

  async getDailyTip(userPreferences = {}) {
    try {
      let query = {};
      
      if (userPreferences.difficulty) {
        query.difficulty = userPreferences.difficulty;
      }
      
      if (userPreferences.categories && userPreferences.categories.length > 0) {
        query.category = { $in: userPreferences.categories };
      }

      const tips = await FinancialTip.find(query);
      const randomIndex = Math.floor(Math.random() * tips.length);
      return tips[randomIndex];
    } catch (error) {
      logger.error('Error getting daily tip:', error);
      return null;
    }
  }

  async updateMarketData() {
    try {
      // Simulate market data updates
      // In production, this would fetch from a financial API
      this.marketUpdates.set('last_update', new Date());
      this.marketUpdates.set('market_summary', {
        idx_composite: {
          value: 7123.45,
          change: '+1.2%'
        },
        usd_idr: {
          value: 15234,
          change: '-0.3%'
        }
      });
    } catch (error) {
      logger.error('Error updating market data:', error);
    }
  }

  getMarketUpdates() {
    return this.marketUpdates.get('market_summary') || null;
  }

  async getInvestmentEducation(topic) {
    try {
      return await FinancialTip.find({
        category: 'investment',
        tags: topic
      });
    } catch (error) {
      logger.error('Error getting investment education:', error);
      return [];
    }
  }

  async getDebtManagementAdvice(debtType) {
    try {
      return await FinancialTip.find({
        category: 'debt',
        tags: debtType
      });
    } catch (error) {
      logger.error('Error getting debt management advice:', error);
      return [];
    }
  }

  calculateUserLevel(points) {
    const level = this.gamificationRules.levels.find(
      (level, index, array) => 
        points >= level.minPoints && 
        (index === array.length - 1 || points < array[index + 1].minPoints)
    );
    return level || this.gamificationRules.levels[0];
  }

  async awardAchievement(userId, achievementKey) {
    try {
      const achievement = this.gamificationRules.achievements[achievementKey];
      if (!achievement) {
        throw new Error('Achievement not found');
      }

      // Update user points and achievements
      // This would typically interact with a user model
      logger.info(`Awarded achievement ${achievementKey} to user ${userId}`);
      return achievement;
    } catch (error) {
      logger.error('Error awarding achievement:', error);
      return null;
    }
  }

  generatePersonalizedTips(userProfile) {
    const tips = [];

    // Analyze spending patterns
    if (userProfile.expenses) {
      const highestCategory = this.findHighestSpendingCategory(userProfile.expenses);
      tips.push({
        category: 'spending',
        content: `Anda paling banyak menghabiskan uang untuk ${highestCategory}. Coba pertimbangkan untuk membuat anggaran khusus.`
      });
    }

    // Check savings ratio
    if (userProfile.income && userProfile.savings) {
      const savingsRatio = (userProfile.savings / userProfile.income) * 100;
      if (savingsRatio < 20) {
        tips.push({
          category: 'savings',
          content: 'Cobalah untuk meningkatkan rasio tabungan Anda hingga minimal 20% dari pendapatan.'
        });
      }
    }

    // Check debt levels
    if (userProfile.debts) {
      const debtToIncome = this.calculateDebtToIncomeRatio(userProfile);
      if (debtToIncome > 0.3) {
        tips.push({
          category: 'debt',
          content: 'Rasio utang Anda cukup tinggi. Pertimbangkan untuk fokus melunasi utang terlebih dahulu.'
        });
      }
    }

    return tips;
  }

  findHighestSpendingCategory(expenses) {
    return Object.entries(expenses)
      .sort(([,a], [,b]) => b - a)[0][0];
  }

  calculateDebtToIncomeRatio(userProfile) {
    const totalDebt = Object.values(userProfile.debts).reduce((a, b) => a + b, 0);
    return totalDebt / userProfile.income;
  }
}

module.exports = new FinancialEducationService();
