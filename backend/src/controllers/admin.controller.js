const User = require('../models/user.model');
const Transaction = require('../models/transaction.model');
const Budget = require('../models/budget.model');
const Goal = require('../models/goal.model');
const logger = require('../utils/logger');
const bcrypt = require('bcryptjs');
const { getClient } = require('../whatsapp/setup');
const fs = require('fs').promises;
const path = require('path');

// User Management
exports.getAllUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      status,
      search
    } = req.query;

    // Build query
    const query = {};
    if (status) query.isActive = status === 'active';
    if (search) {
      query.$or = [
        { username: new RegExp(search, 'i') },
        { 'whatsappNumbers.number': new RegExp(search, 'i') }
      ];
    }

    // Execute query with pagination and sorting
    const users = await User.find(query)
      .select('-password')
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    // Get total count
    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          total,
          page: Number(page),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
};

// Get user details with all related data
exports.getUserDetails = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's transactions
    const transactions = await Transaction.find({ userId })
      .sort({ date: -1 })
      .limit(10);

    // Get user's budgets
    const budgets = await Budget.find({ userId, status: 'active' });

    // Get user's goals
    const goals = await Goal.find({ userId, status: 'active' });

    res.status(200).json({
      success: true,
      data: {
        user,
        transactions,
        budgets,
        goals
      }
    });
  } catch (error) {
    logger.error('Get user details error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user details',
      error: error.message
    });
  }
};

// Update user settings
exports.updateUserSettings = async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      isActive,
      expiryDate,
      maxWhatsAppNumbers
    } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update settings
    if (typeof isActive === 'boolean') user.isActive = isActive;
    if (expiryDate) user.expiryDate = new Date(expiryDate);
    if (maxWhatsAppNumbers) user.maxWhatsAppNumbers = maxWhatsAppNumbers;

    await user.save();

    // Log admin action
    logger.logUserActivity(req.user._id, 'update_user_settings', {
      targetUserId: userId,
      updates: req.body
    });

    res.status(200).json({
      success: true,
      message: 'User settings updated successfully',
      data: user
    });
  } catch (error) {
    logger.error('Update user settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user settings',
      error: error.message
    });
  }
};

// System Management
exports.getSystemStatus = async (req, res) => {
  try {
    // Get WhatsApp client status
    const whatsappClient = getClient();
    const whatsappStatus = whatsappClient ? 'connected' : 'disconnected';

    // Get system metrics
    const metrics = {
      users: await User.countDocuments(),
      activeUsers: await User.countDocuments({ isActive: true }),
      transactions: await Transaction.countDocuments(),
      budgets: await Budget.countDocuments(),
      goals: await Goal.countDocuments()
    };

    // Get recent activity
    const recentActivity = await logger.getRecentActivity();

    res.status(200).json({
      success: true,
      data: {
        whatsappStatus,
        metrics,
        recentActivity
      }
    });
  } catch (error) {
    logger.error('Get system status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting system status',
      error: error.message
    });
  }
};

// Backup Management
exports.createBackup = async (req, res) => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(__dirname, '../../backups');
    
    // Create backup directory if it doesn't exist
    await fs.mkdir(backupDir, { recursive: true });

    // Backup collections
    const collections = {
      users: await User.find().select('-password'),
      transactions: await Transaction.find(),
      budgets: await Budget.find(),
      goals: await Goal.find()
    };

    // Write backup file
    const backupPath = path.join(backupDir, `backup-${timestamp}.json`);
    await fs.writeFile(backupPath, JSON.stringify(collections, null, 2));

    // Log backup creation
    logger.logUserActivity(req.user._id, 'create_backup', {
      timestamp,
      path: backupPath
    });

    res.status(200).json({
      success: true,
      message: 'Backup created successfully',
      data: {
        timestamp,
        path: backupPath
      }
    });
  } catch (error) {
    logger.error('Create backup error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating backup',
      error: error.message
    });
  }
};

// Restore from backup
exports.restoreBackup = async (req, res) => {
  try {
    const { backupPath } = req.body;

    // Read backup file
    const backupData = JSON.parse(await fs.readFile(backupPath, 'utf8'));

    // Start transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Clear existing data
      await User.deleteMany({}, { session });
      await Transaction.deleteMany({}, { session });
      await Budget.deleteMany({}, { session });
      await Goal.deleteMany({}, { session });

      // Restore data
      await User.insertMany(backupData.users, { session });
      await Transaction.insertMany(backupData.transactions, { session });
      await Budget.insertMany(backupData.budgets, { session });
      await Goal.insertMany(backupData.goals, { session });

      await session.commitTransaction();

      // Log restore operation
      logger.logUserActivity(req.user._id, 'restore_backup', {
        backupPath,
        timestamp: new Date()
      });

      res.status(200).json({
        success: true,
        message: 'Backup restored successfully'
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    logger.error('Restore backup error:', error);
    res.status(500).json({
      success: false,
      message: 'Error restoring backup',
      error: error.message
    });
  }
};

// Update admin password
exports.updateAdminPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const adminId = req.user._id;

    const admin = await User.findById(adminId);
    
    // Verify current password
    const isValidPassword = await admin.comparePassword(currentPassword);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    admin.password = newPassword;
    await admin.save();

    // Log password update
    logger.logSecurityEvent('admin_password_change', {
      adminId,
      timestamp: new Date()
    });

    res.status(200).json({
      success: true,
      message: 'Admin password updated successfully'
    });
  } catch (error) {
    logger.error('Update admin password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating admin password',
      error: error.message
    });
  }
};

// Get WhatsApp QR Code
exports.getWhatsAppQR = async (req, res) => {
  try {
    const client = getClient();
    if (!client) {
      return res.status(400).json({
        success: false,
        message: 'WhatsApp client not initialized'
      });
    }

    // Get QR code
    const qr = await new Promise((resolve, reject) => {
      client.once('qr', (qr) => resolve(qr));
      setTimeout(() => reject(new Error('QR code timeout')), 30000);
    });

    res.status(200).json({
      success: true,
      data: {
        qr
      }
    });
  } catch (error) {
    logger.error('Get WhatsApp QR error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting WhatsApp QR code',
      error: error.message
    });
  }
};
