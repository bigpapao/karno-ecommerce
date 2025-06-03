import Redis from 'ioredis';
import { redisConfig } from './config.js';

const redisClient = new Redis({
  host: redisConfig.host,
  port: redisConfig.port,
  password: redisConfig.password,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

// Cache TTLs in seconds
const CACHE_TTL = {
  PRODUCTS: 3600, // 1 hour
  CATEGORIES: 86400, // 24 hours
  BRANDS: 86400, // 24 hours
  USER_PROFILE: 1800, // 30 minutes
  RECOMMENDATIONS: 1800, // 30 minutes
};

// Cache key prefixes
const CACHE_KEYS = {
  PRODUCT: 'product:',
  PRODUCTS: 'products:',
  CATEGORY: 'category:',
  CATEGORIES: 'categories',
  BRAND: 'brand:',
  BRANDS: 'brands',
  USER: 'user:',
  RECOMMENDATIONS: 'recommendations:',
};

// Error handling
redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
  console.log('Redis Client Connected');
});

export { redisClient, CACHE_TTL, CACHE_KEYS };
export default { redisClient, CACHE_TTL, CACHE_KEYS };
