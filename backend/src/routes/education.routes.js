const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const educationController = require('../controllers/education.controller');

// Public routes (no authentication required)
router.get('/tips/daily', educationController.getDailyTip);
router.get('/market/updates', educationController.getMarketUpdates);

// Protected routes (require authentication)
router.use(auth);

// Financial education routes
router.get('/investment/:topic', educationController.getInvestmentEducation);
router.get('/debt-management/:debtType', educationController.getDebtManagementAdvice);

// Gamification routes
router.get('/users/:userId/level', educationController.getUserLevel);
router.post('/users/:userId/achievements', educationController.awardAchievement);
router.get('/users/:userId/tips', educationController.getPersonalizedTips);

// Game mechanics routes
router.get('/achievements', educationController.getAchievements);
router.get('/levels', educationController.getLevels);

module.exports = router;
