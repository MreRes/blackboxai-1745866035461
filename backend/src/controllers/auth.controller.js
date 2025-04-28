const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/user.model');
const logger = require('../utils/logger');

// Generate activation code
const generateActivationCode = () => {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
};

// Generate expiry date based on duration
const generateExpiryDate = (duration) => {
  const durationMap = {
    '7d': 7,
    '1m': 30,
    '1y': 365,
    'custom': null
  };

  const days = durationMap[duration];
  const date = new Date();
  
  if (days) {
    date.setDate(date.getDate() + days);
  }
  
  return date;
};

// Register new user
exports.register = async (req, res) => {
  try {
    const { username, password, role, duration, customDuration } = req.body;

    // Check if username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Username already exists'
      });
    }

    // Generate activation code
    const activationCode = generateActivationCode();

    // Calculate expiry date
    let expiryDate;
    if (duration === 'custom' && customDuration) {
      const days = parseInt(customDuration);
      if (isNaN(days) || days <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid custom duration'
        });
      }
      const date = new Date();
      date.setDate(date.getDate() + days);
      expiryDate = date;
    } else {
      expiryDate = generateExpiryDate(duration);
    }

    // Create new user
    const user = new User({
      username,
      password, // Will be hashed by pre-save middleware
      role: role || 'user',
      activationCode,
      expiryDate
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        username: user.username,
        activationCode: user.activationCode,
        expiryDate: user.expiryDate
      }
    });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering user',
      error: error.message
    });
  }
};

// User login
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is inactive'
      });
    }

    // Check if account has expired
    if (user.expiryDate < new Date()) {
      return res.status(401).json({
        success: false,
        message: 'Account has expired'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user._id,
        username: user.username,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          role: user.role,
          expiryDate: user.expiryDate
        }
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during login',
      error: error.message
    });
  }
};

// Activate WhatsApp number
exports.activateWhatsApp = async (req, res) => {
  try {
    const { activationCode, phoneNumber } = req.body;

    // Find user by activation code
    const user = await User.findOne({ activationCode });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Invalid activation code'
      });
    }

    // Check if account has expired
    if (user.expiryDate < new Date()) {
      return res.status(404).json({
        success: false,
        message: 'Activation code has expired'
      });
    }

    // Format phone number
    const formattedNumber = phoneNumber.replace(/[^\d]/g, '');

    // Check if number is already registered
    const existingUser = await User.findOne({
      'whatsappNumbers.number': formattedNumber
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is already registered'
      });
    }

    // Add WhatsApp number to user
    user.addWhatsAppNumber(formattedNumber);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'WhatsApp number activated successfully',
      data: {
        username: user.username,
        phoneNumber: formattedNumber,
        expiryDate: user.expiryDate
      }
    });
  } catch (error) {
    logger.error('WhatsApp activation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error activating WhatsApp number',
      error: error.message
    });
  }
};

// Admin login
exports.adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find admin user
    const admin = await User.findOne({ username, role: 'admin' });
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isValidPassword = await admin.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: admin._id,
        username: admin.username,
        role: admin.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    res.status(200).json({
      success: true,
      message: 'Admin login successful',
      data: {
        token,
        user: {
          id: admin._id,
          username: admin.username,
          role: admin.role
        }
      }
    });
  } catch (error) {
    logger.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during admin login',
      error: error.message
    });
  }
};

// Get current user
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    logger.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting current user',
      error: error.message
    });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id);
    
    // Verify current password
    const isValidPassword = await user.comparePassword(currentPassword);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    logger.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error changing password',
      error: error.message
    });
  }
};
