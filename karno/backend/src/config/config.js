/**
 * Application Configuration
 *
 * Central configuration file for the application.
 * Values can be overridden using environment variables.
 */

// Server configuration
const serverConfig = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  host: process.env.HOST || 'localhost',
};

// Database configuration
const dbConfig = {
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/karno',
  mongoOptions: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 10,
  },
};

// JWT configuration
const jwtConfig = {
  secret: process.env.JWT_SECRET || 'your-super-secure-jwt-secret',
  expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  cookieExpires: process.env.JWT_COOKIE_EXPIRES_IN || 7,
};

// Cors configuration
const corsConfig = {
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
};

// API keys
const googleApiKey = process.env.GOOGLE_API_KEY || '';
const zarinpalMerchantId = process.env.ZARINPAL_MERCHANT_ID || '';
const smartyStreetsKey = process.env.SMARTY_STREETS_KEY || '';

// Address validation configuration
const addressValidation = {
  useFallback: process.env.USE_ADDRESS_FALLBACK === 'true' || false,
  cacheDuration: parseInt(process.env.ADDRESS_CACHE_DURATION || '3600000', 10),
};

// Email configuration
const emailConfig = {
  host: process.env.EMAIL_HOST || '',
  port: parseInt(process.env.EMAIL_PORT || '587', 10),
  user: process.env.EMAIL_USER || '',
  pass: process.env.EMAIL_PASS || '',
  from: process.env.EMAIL_FROM || 'noreply@karno.ir',
};

// SMS configuration
const smsConfig = {
  apiKey: process.env.SMS_API_KEY || 'your-api-key',
  lineNumber: process.env.SMS_LINE_NUMBER || '30007732',
  mock: process.env.NODE_ENV !== 'production',
};

// Redis Configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  password: process.env.REDIS_PASSWORD || '',
};

// Export all configs
export {
  serverConfig,
  dbConfig,
  jwtConfig,
  corsConfig,
  googleApiKey,
  zarinpalMerchantId,
  smartyStreetsKey,
  addressValidation,
  emailConfig,
  smsConfig,
  redisConfig,
};

// Default export for backward compatibility
export default {
  serverConfig,
  dbConfig,
  jwtConfig,
  corsConfig,
  googleApiKey,
  zarinpalMerchantId,
  smartyStreetsKey,
  addressValidation,
  emailConfig,
  smsConfig,
  redisConfig,
};
