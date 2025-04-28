const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const logger = require('../utils/logger');

// Regular user authentication middleware
exports.auth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No authentication token, access denied'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
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

    // Add user to request
    req.user = user;
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error authenticating user',
      error: error.message
    });
  }
};

// Admin authentication middleware
exports.adminAuth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No authentication token, access denied'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find admin user
    const admin = await User.findById(decoded.id).select('-password');

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is admin
    if (admin.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required'
      });
    }

    // Add admin user to request
    req.user = admin;
    next();
  } catch (error) {
    logger.error('Admin authentication error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error authenticating admin',
      error: error.message
    });
  }
};

// Rate limiting middleware
exports.rateLimiter = (maxRequests, timeWindow) => {
  const requests = new Map();

  return (req, res, next) => {
    const ip = req.ip;
    const now = Date.now();

    // Clean up old requests
    if (requests.has(ip)) {
      const userRequests = requests.get(ip);
      const validRequests = userRequests.filter(
        timestamp => now - timestamp < timeWindow
      );
      requests.set(ip, validRequests);

      if (validRequests.length >= maxRequests) {
        return res.status(429).json({
          success: false,
          message: 'Too many requests, please try again later'
        });
      }

      userRequests.push(now);
    } else {
      requests.set(ip, [now]);
    }

    next();
  };
};

// WhatsApp authentication middleware
exports.whatsappAuth = async (phoneNumber) => {
  try {
    // Format phone number
    const formattedNumber = phoneNumber.replace(/[^\d]/g, '');

    // Find user by WhatsApp number
    const user = await User.findOne({
      'whatsappNumbers.number': formattedNumber,
      'whatsappNumbers.isActive': true,
      isActive: true,
      expiryDate: { $gt: new Date() }
    });

    if (!user) {
      return {
        success: false,
        message: 'Unauthorized WhatsApp number'
      };
    }

    return {
      success: true,
      user
    };
  } catch (error) {
    logger.error('WhatsApp authentication error:', error);
    return {
      success: false,
      message: 'Error authenticating WhatsApp number',
      error: error.message
    };
  }
};

// Error handling middleware
exports.errorHandler = (err, req, res, next) => {
  logger.error('Error:', err);

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: Object.values(err.errors).map(e => e.message)
    });
  }

  if (err.code === 11000) {
    return res.status(400).json({
      success: false,
      message: 'Duplicate key error',
      error: err.message
    });
  }

  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: err.message
  });
};
