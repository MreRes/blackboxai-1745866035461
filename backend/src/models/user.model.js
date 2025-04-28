const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  activationCode: {
    type: String,
    required: true,
    unique: true
  },
  expiryDate: {
    type: Date,
    required: true
  },
  whatsappNumbers: [{
    number: String,
    isActive: Boolean,
    activatedAt: Date
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// Method to check if WhatsApp number is registered
userSchema.methods.isWhatsAppNumberRegistered = function(number) {
  return this.whatsappNumbers.some(wn => wn.number === number && wn.isActive);
};

// Method to add WhatsApp number
userSchema.methods.addWhatsAppNumber = function(number) {
  if (!this.isWhatsAppNumberRegistered(number)) {
    this.whatsappNumbers.push({
      number,
      isActive: true,
      activatedAt: new Date()
    });
  }
};

const User = mongoose.model('User', userSchema);

module.exports = User;
