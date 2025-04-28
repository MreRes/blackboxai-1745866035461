const winston = require('winston');
const path = require('path');

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

// Define level based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'warn';
};

// Create logger instance
const logger = winston.createLogger({
  level: level(),
  levels,
  format: logFormat,
  transports: [
    // Write all logs to console
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    // Write all logs with level 'error' and below to error.log
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // Write all logs with level 'info' and below to combined.log
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ],
  exceptionHandlers: [
    // Write all uncaught exceptions to exceptions.log
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/exceptions.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ],
  rejectionHandlers: [
    // Write all unhandled promise rejections to rejections.log
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/rejections.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// Create a stream object for Morgan HTTP logger
logger.stream = {
  write: (message) => logger.http(message.trim())
};

// Add request logging middleware
logger.requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log when response finishes
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.http({
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('user-agent') || '',
      ip: req.ip
    });
  });

  next();
};

// Add error logging middleware
logger.errorLogger = (err, req, res, next) => {
  logger.error({
    message: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url,
    body: req.body,
    user: req.user ? req.user._id : null
  });

  next(err);
};

// Add WhatsApp message logging
logger.logWhatsAppMessage = (message, response, error = null) => {
  const logData = {
    type: 'whatsapp_message',
    from: message.from,
    body: message.body,
    response: response
  };

  if (error) {
    logData.error = {
      message: error.message,
      stack: error.stack
    };
    logger.error(logData);
  } else {
    logger.info(logData);
  }
};

// Add transaction logging
logger.logTransaction = (userId, transaction, error = null) => {
  const logData = {
    type: 'transaction',
    userId,
    transactionId: transaction._id,
    amount: transaction.amount,
    category: transaction.category,
    type: transaction.type
  };

  if (error) {
    logData.error = {
      message: error.message,
      stack: error.stack
    };
    logger.error(logData);
  } else {
    logger.info(logData);
  }
};

// Add user activity logging
logger.logUserActivity = (userId, action, details, error = null) => {
  const logData = {
    type: 'user_activity',
    userId,
    action,
    details,
    timestamp: new Date()
  };

  if (error) {
    logData.error = {
      message: error.message,
      stack: error.stack
    };
    logger.error(logData);
  } else {
    logger.info(logData);
  }
};

// Add system monitoring
logger.monitorSystem = (metrics) => {
  logger.info({
    type: 'system_metrics',
    ...metrics,
    timestamp: new Date()
  });
};

// Add security logging
logger.logSecurityEvent = (event, details, error = null) => {
  const logData = {
    type: 'security_event',
    event,
    details,
    timestamp: new Date()
  };

  if (error) {
    logData.error = {
      message: error.message,
      stack: error.stack
    };
    logger.error(logData);
  } else {
    logger.warn(logData);
  }
};

module.exports = logger;
