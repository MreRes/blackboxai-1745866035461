const express = require('express');
const router = express.Router();
const { auth, adminAuth } = require('../middleware/auth');
const {
  register,
  login,
  adminLogin,
  activateWhatsApp,
  getCurrentUser,
  changePassword
} = require('../controllers/auth.controller');
const { validateRequest } = require('../middleware/validator');
const {
  registerSchema,
  loginSchema,
  activateWhatsAppSchema,
  changePasswordSchema
} = require('../validators/auth.validator');

// Public routes
router.post('/register', validateRequest(registerSchema), register);
router.post('/login', validateRequest(loginSchema), login);
router.post('/admin/login', validateRequest(loginSchema), adminLogin);
router.post('/activate-whatsapp', validateRequest(activateWhatsAppSchema), activateWhatsApp);

// Protected routes
router.get('/me', auth, getCurrentUser);
router.post('/change-password', auth, validateRequest(changePasswordSchema), changePassword);

// Admin routes
router.get('/admin/users', adminAuth, async (req, res) => {
  try {
    const User = require('../models/user.model');
    const users = await User.find({ role: 'user' })
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
});

// Update user status (activate/deactivate)
router.patch('/admin/users/:userId/status', adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;

    const User = require('../models/user.model');
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isActive = isActive;
    await user.save();

    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating user status',
      error: error.message
    });
  }
});

// Update user expiry date
router.patch('/admin/users/:userId/expiry', adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { expiryDate } = req.body;

    const User = require('../models/user.model');
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.expiryDate = new Date(expiryDate);
    await user.save();

    res.json({
      success: true,
      message: 'User expiry date updated successfully',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating user expiry date',
      error: error.message
    });
  }
});

// Get user details with WhatsApp numbers
router.get('/admin/users/:userId', adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;

    const User = require('../models/user.model');
    const user = await User.findById(userId)
      .select('-password')
      .populate('whatsappNumbers');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user details',
      error: error.message
    });
  }
});

// Remove WhatsApp number from user
router.delete('/admin/users/:userId/whatsapp/:number', adminAuth, async (req, res) => {
  try {
    const { userId, number } = req.params;

    const User = require('../models/user.model');
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Remove WhatsApp number
    user.whatsappNumbers = user.whatsappNumbers.filter(wn => wn.number !== number);
    await user.save();

    res.json({
      success: true,
      message: 'WhatsApp number removed successfully',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error removing WhatsApp number',
      error: error.message
    });
  }
});

module.exports = router;
