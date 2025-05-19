import winston from 'winston';
import 'winston-daily-rotate-file';
import fs from 'fs';
import path from 'path';

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss',
  }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Create file transport for error logs
const errorFileTransport = new winston.transports.DailyRotateFile({
  filename: path.join(logsDir, 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  level: 'error',
  maxSize: '20m',
  maxFiles: '14d',
  format: logFormat,
});

// Create file transport for all logs
const combinedFileTransport = new winston.transports.DailyRotateFile({
  filename: path.join(logsDir, 'combined-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d',
  format: logFormat,
});

// Create console transport for development
const consoleTransport = new winston.transports.Console({
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.printf(({ level, message, timestamp, ...meta }) => {
      // Pretty print for objects
      let metaStr = '';
      if (Object.keys(meta).length > 0 && meta.stack) {
        metaStr = `\n${meta.stack}`;
      } else if (Object.keys(meta).length > 0) {
        metaStr = `\n${JSON.stringify(meta, null, 2)}`;
      }
      
      return `${timestamp} ${level}: ${message}${metaStr}`;
    })
  ),
});

// Initialize logger with transports
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: logFormat,
  defaultMeta: { service: 'karno-backend' },
  transports: [
    errorFileTransport,
    combinedFileTransport
  ],
  // Handle uncaught exceptions and rejections
  exceptionHandlers: [
    new winston.transports.File({ filename: path.join(logsDir, 'exceptions.log') }),
    consoleTransport
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: path.join(logsDir, 'rejections.log') }),
    consoleTransport
  ],
  exitOnError: false // Don't exit on handled exceptions
});

// If we're not in production, log to the console as well
if (process.env.NODE_ENV !== 'production') {
  logger.add(consoleTransport);
}

// Create a stream object with a write function that will be used by morgan
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  },
};

// Add custom log functions
logger.logAPIRequest = (req, res, next) => {
  logger.info({
    message: `API Request: ${req.method} ${req.originalUrl}`,
    requestInfo: {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userId: req.user ? req.user.id : 'unauthenticated',
      userAgent: req.headers['user-agent']
    }
  });
  next();
};

export { logger };

export default logger;
