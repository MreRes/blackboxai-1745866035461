const Joi = require('joi');
const logger = require('../utils/logger');

// Validation middleware
exports.validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,
      allowUnknown: true,
      stripUnknown: true
    });

    if (error) {
      logger.error('Validation error:', error);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(err => ({
          field: err.path[0],
          message: err.message
        }))
      });
    }

    next();
  };
};

// Custom validation helpers
exports.customValidators = {
  // Password validation
  password: Joi.string()
    .min(8)
    .max(30)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    .messages({
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character',
      'string.min': 'Password must be at least 8 characters long',
      'string.max': 'Password must not exceed 30 characters'
    }),

  // Phone number validation
  phoneNumber: Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .messages({
      'string.pattern.base': 'Please provide a valid phone number'
    }),

  // Username validation
  username: Joi.string()
    .min(3)
    .max(30)
    .pattern(/^[a-zA-Z0-9_]+$/)
    .messages({
      'string.pattern.base': 'Username can only contain letters, numbers and underscores',
      'string.min': 'Username must be at least 3 characters long',
      'string.max': 'Username must not exceed 30 characters'
    }),

  // Role validation
  role: Joi.string()
    .valid('user', 'admin')
    .messages({
      'any.only': 'Role must be either user or admin'
    }),

  // Duration validation
  duration: Joi.string()
    .valid('7d', '1m', '1y', 'custom')
    .messages({
      'any.only': 'Duration must be 7d, 1m, 1y, or custom'
    }),

  // Custom duration validation (in days)
  customDuration: Joi.when('duration', {
    is: 'custom',
    then: Joi.number()
      .integer()
      .min(1)
      .max(365)
      .required()
      .messages({
        'number.base': 'Custom duration must be a number',
        'number.integer': 'Custom duration must be an integer',
        'number.min': 'Custom duration must be at least 1 day',
        'number.max': 'Custom duration cannot exceed 365 days'
      }),
    otherwise: Joi.forbidden()
  })
};

// Validation schemas
exports.validationSchemas = {
  // Registration validation schema
  registerSchema: Joi.object({
    username: exports.customValidators.username.required(),
    password: exports.customValidators.password.required(),
    role: exports.customValidators.role.default('user'),
    duration: exports.customValidators.duration.required(),
    customDuration: exports.customValidators.customDuration
  }),

  // Login validation schema
  loginSchema: Joi.object({
    username: exports.customValidators.username.required(),
    password: Joi.string().required()
  }),

  // WhatsApp activation validation schema
  activateWhatsAppSchema: Joi.object({
    activationCode: Joi.string()
      .length(8)
      .pattern(/^[A-F0-9]+$/)
      .required()
      .messages({
        'string.length': 'Activation code must be 8 characters long',
        'string.pattern.base': 'Invalid activation code format'
      }),
    phoneNumber: exports.customValidators.phoneNumber.required()
  }),

  // Change password validation schema
  changePasswordSchema: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: exports.customValidators.password.required(),
    confirmPassword: Joi.string()
      .valid(Joi.ref('newPassword'))
      .required()
      .messages({
        'any.only': 'Passwords do not match'
      })
  }),

  // Update user status validation schema
  updateUserStatusSchema: Joi.object({
    isActive: Joi.boolean().required()
  }),

  // Update user expiry validation schema
  updateUserExpirySchema: Joi.object({
    expiryDate: Joi.date()
      .min('now')
      .required()
      .messages({
        'date.min': 'Expiry date must be in the future'
      })
  })
};
