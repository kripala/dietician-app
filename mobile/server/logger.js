const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

// Get port from environment or default
const PORT = process.env.FRONTEND_PORT || 8081;
const LOG_DIR = process.env.LOG_DIR || '/var/log/dietician';

// Create logs directory if it doesn't exist
const fs = require('fs');
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    if (stack) {
      return `${timestamp} [${level.toUpperCase()}] ${stack}`;
    }
    return `${timestamp} [${level.toUpperCase()}] ${message}`;
  })
);

// Daily rotate file transport for application logs
const appLogTransport = new DailyRotateFile({
  dirname: LOG_DIR,
  filename: `dietician-${PORT}.log`,
  datePattern: 'YYYY-MM-DD',
  maxSize: '50m',
  maxFiles: '10d',
  compress: true, // Compress rotated files
  zippedArchive: true,
  format: logFormat
});

// Daily rotate file transport for error logs
const errorLogTransport = new DailyRotateFile({
  dirname: LOG_DIR,
  filename: `dietician-${PORT}-error.log`,
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '30d',
  level: 'error',
  compress: true,
  zippedArchive: true,
  format: logFormat
});

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    appLogTransport,
    errorLogTransport,
    // Console output for development (can be disabled in production)
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ],
  exitOnError: false
});

// Override console methods to redirect to logger
if (process.env.NODE_ENV !== 'development') {
  console.log = (...args) => logger.info(args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' '));
  console.error = (...args) => logger.error(args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' '));
  console.warn = (...args) => logger.warn(args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' '));
}

// Request logger middleware for Express (if needed)
const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
  });
  next();
};

module.exports = {
  logger,
  requestLogger,
  PORT
};
