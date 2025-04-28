const express = require('express');
const router = express.Router();
const { adminAuth } = require('../middleware/auth');
const {
  getAllUsers,
  getUserDetails,
  updateUserSettings,
  getSystemStatus,
  createBackup,
  restoreBackup,
  updateAdminPassword,
  getWhatsAppQR
} = require('../controllers/admin.controller');

// Protect all admin routes
router.use(adminAuth);

// User management
router.get('/users', getAllUsers);
router.get('/users/:userId', getUserDetails);
router.patch('/users/:userId/settings', updateUserSettings);

// System management
router.get('/system/status', getSystemStatus);

// Backup and restore
router.post('/backup', createBackup);
router.post('/restore', restoreBackup);

// Admin password management
router.post('/password/change', updateAdminPassword);

// WhatsApp QR code
router.get('/whatsapp/qr', getWhatsAppQR);

module.exports = router;
