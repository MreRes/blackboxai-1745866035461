const financialEducationService = require('../services/financialEducation');
const logger = require('../utils/logger');

exports.getDailyTip = async (req, res) => {
  try {
    const tip = await financialEducationService.getDailyTip(req.query);
    res.json({
      success: true,
      data: tip
    });
  } catch (error) {
    logger.error('Error getting daily tip:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting daily tip',
      error: error.message
    });
  }
};

exports.getMarketUpdates = async (req, res) => {
  try {
    await financialEducationService.updateMarketData();
    const updates = financialEducationService.getMarketUpdates();
    res.json({
      success: true,
      data: updates
    });
  } catch (error) {
    logger.error('Error getting market updates:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting market updates',
      error: error.message
    });
  }
};

exports.getInvestmentEducation = async (req, res) => {
  try {
    const { topic } = req.params;
    const content = await financialEducationService.getInvestmentEducation(topic);
    res.json({
      success: true,
      data: content
    });
  } catch (error) {
    logger.error('Error getting investment education:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting investment education',
      error: error.message
    });
  }
};

exports.getDebtManagementAdvice = async (req, res) => {
  try {
    const { debtType } = req.params;
    const advice = await financialEducationService.getDebtManagementAdvice(debtType);
    res.json({
      success: true,
      data: advice
    });
  } catch (error) {
    logger.error('Error getting debt management advice:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting debt management advice',
      error: error.message
    });
  }
};

exports.getUserLevel = async (req, res) => {
  try {
    const { userId } = req.params;
    // Get user points from user model (implementation needed)
    const points = 100; // Example points
    const level = financialEducationService.calculateUserLevel(points);
    res.json({
      success: true,
      data: level
    });
  } catch (error) {
    logger.error('Error getting user level:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting user level',
      error: error.message
    });
  }
};

exports.awardAchievement = async (req, res) => {
  try {
    const { userId } = req.params;
    const { achievementKey } = req.body;
    const achievement = await financialEducationService.awardAchievement(userId, achievementKey);
    res.json({
      success: true,
      data: achievement
    });
  } catch (error) {
    logger.error('Error awarding achievement:', error);
    res.status(500).json({
      success: false,
      message: 'Error awarding achievement',
      error: error.message
    });
  }
};

exports.getPersonalizedTips = async (req, res) => {
  try {
    const { userId } = req.params;
    // Get user profile from database (implementation needed)
    const userProfile = {
      income: 5000000,
      savings: 1000000,
      expenses: {
        food: 1500000,
        transport: 500000,
        entertainment: 500000
      },
      debts: {
        creditCard: 2000000,
        loan: 5000000
      }
    };
    
    const tips = financialEducationService.generatePersonalizedTips(userProfile);
    res.json({
      success: true,
      data: tips
    });
  } catch (error) {
    logger.error('Error getting personalized tips:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting personalized tips',
      error: error.message
    });
  }
};

exports.getAchievements = async (req, res) => {
  try {
    const achievements = financialEducationService.gamificationRules.achievements;
    res.json({
      success: true,
      data: achievements
    });
  } catch (error) {
    logger.error('Error getting achievements:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting achievements',
      error: error.message
    });
  }
};

exports.getLevels = async (req, res) => {
  try {
    const levels = financialEducationService.gamificationRules.levels;
    res.json({
      success: true,
      data: levels
    });
  } catch (error) {
    logger.error('Error getting levels:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting levels',
      error: error.message
    });
  }
};
