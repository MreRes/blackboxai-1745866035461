const mongoose = require('mongoose');
const User = require('../models/user.model');
const bcrypt = require('bcryptjs');

const createDefaultAdmin = async () => {
  try {
    const existingAdmin = await User.findOne({ username: 'admin' });
    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
    }

    const password = 'Admin@123'; // Default password
    const hashedPassword = await bcrypt.hash(password, 10);

    const adminUser = new User({
      username: 'admin',
      password: hashedPassword,
      role: 'admin',
      activationCode: 'ADMIN0001',
      expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 10)),
      isActive: true
    });

    await adminUser.save();
    console.log('Default admin user created with username: admin and password: Admin@123');
  } catch (error) {
    console.error('Error creating default admin user:', error);
  }
};

module.exports = createDefaultAdmin;
