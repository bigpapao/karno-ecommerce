import { createClient } from 'redis';
import { logger } from './logger.js';

class RedisClient {
  constructor() {
    this.client = null;
    this.ready = false;
    this.enabled = process.env.REDIS_ENABLED === 'true';
  }

  async connect() {
    if (!this.enabled) {
      logger.info('Redis is disabled by configuration');
      return;
    }

    try {
      // Create Redis client with connection details from environment variables
      // or fallback to default values
      this.client = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        password: process.env.REDIS_PASSWORD,
        socket: {
          reconnectStrategy: (retries) =>
            // Exponential backoff with a maximum of 10 seconds
            Math.min(2 ** retries * 100, 10000),

        },
      });

      // Register event handlers
      this.client.on('error', (error) => {
        this.ready = false;
        logger.error({
          message: 'Redis client error',
          error: error.message,
        });
      });

      this.client.on('connect', () => {
        logger.info('Connected to Redis server');
      });

      this.client.on('ready', () => {
        this.ready = true;
        logger.info('Redis client is ready');
      });

      this.client.on('reconnecting', () => {
        logger.info('Redis client reconnecting');
      });

      this.client.on('end', () => {
        this.ready = false;
        logger.info('Redis client connection closed');
      });

      // Connect to Redis server
      await this.client.connect();
    } catch (error) {
      this.ready = false;
      logger.error({
        message: 'Failed to connect to Redis',
        error: error.message,
        stack: error.stack,
      });
    }
  }

  /**
   * Set a value in Redis
   * @param {string} key - The key to set
   * @param {string} value - The value to set
   * @param {string} [flag='EX'] - Flag for the set operation (e.g., 'EX', 'PX')
   * @param {number} [expiry=3600] - Expiry time in seconds (or ms if flag is 'PX')
   * @returns {Promise<string>} - 'OK' if successful
   */
  async set(key, value, flag = 'EX', expiry = 3600) {
    if (!this.ready || !this.enabled) {
      return 'OK'; // Fake success when Redis is not available or disabled
    }

    try {
      return await this.client.set(key, value, {
        [flag.toLowerCase()]: expiry,
      });
    } catch (error) {
      logger.error({
        message: 'Redis set error',
        error: error.message,
        key,
      });
      return 'ERROR';
    }
  }

  /**
   * Get a value from Redis
   * @param {string} key - The key to get
   * @returns {Promise<string|null>} - The value if found, null otherwise
   */
  async get(key) {
    if (!this.ready || !this.enabled) {
      return null; // Simulate cache miss when Redis is not available or disabled
    }

    try {
      return await this.client.get(key);
    } catch (error) {
      logger.error({
        message: 'Redis get error',
        error: error.message,
        key,
      });
      return null;
    }
  }

  /**
   * Delete one or more keys from Redis
   * @param {string|string[]} keys - The key(s) to delete
   * @returns {Promise<number>} - Number of keys deleted
   */
  async del(keys) {
    if (!this.ready || !this.enabled) {
      return 0; // Simulate no deletion when Redis is not available or disabled
    }

    try {
      if (Array.isArray(keys)) {
        if (keys.length === 0) return 0;
        return await this.client.del(keys);
      }
      return await this.client.del(keys);
    } catch (error) {
      logger.error({
        message: 'Redis del error',
        error: error.message,
        keys: Array.isArray(keys) ? keys.length : keys,
      });
      return 0;
    }
  }

  /**
   * Find keys matching a pattern
   * @param {string} pattern - Pattern to match
   * @returns {Promise<string[]>} - Array of matching keys
   */
  async keys(pattern) {
    if (!this.ready || !this.enabled) {
      return []; // Return empty array when Redis is not available or disabled
    }

    try {
      return await this.client.keys(pattern);
    } catch (error) {
      logger.error({
        message: 'Redis keys error',
        error: error.message,
        pattern,
      });
      return [];
    }
  }

  /**
   * Check if a key exists
   * @param {string} key - The key to check
   * @returns {Promise<boolean>} - True if the key exists, false otherwise
   */
  async exists(key) {
    if (!this.ready || !this.enabled) {
      return false; // Simulate key does not exist when Redis is not available or disabled
    }

    try {
      return (await this.client.exists(key)) === 1;
    } catch (error) {
      logger.error({
        message: 'Redis exists error',
        error: error.message,
        key,
      });
      return false;
    }
  }

  /**
   * Set expiry time on a key
   * @param {string} key - The key to set expiry on
   * @param {number} seconds - Expiry time in seconds
   * @returns {Promise<number>} - 1 if successful, 0 if key does not exist
   */
  async expire(key, seconds) {
    if (!this.ready || !this.enabled) {
      return 1; // Simulate success when Redis is not available or disabled
    }

    try {
      return await this.client.expire(key, seconds);
    } catch (error) {
      logger.error({
        message: 'Redis expire error',
        error: error.message,
        key,
        seconds,
      });
      return 0;
    }
  }

  /**
   * Flush all data from the Redis database
   * @returns {Promise<string>} - 'OK' if successful
   */
  async flushAll() {
    if (!this.ready || !this.enabled) {
      return 'OK'; // Simulate success when Redis is not available or disabled
    }

    try {
      return await this.client.flushAll();
    } catch (error) {
      logger.error({
        message: 'Redis flushAll error',
        error: error.message,
      });
      return 'ERROR';
    }
  }

  /**
   * Close Redis connection
   */
  async close() {
    if (this.client && this.ready) {
      try {
        await this.client.quit();
        this.ready = false;
        logger.info('Redis connection closed');
      } catch (error) {
        logger.error({
          message: 'Error closing Redis connection',
          error: error.message,
        });
      }
    }
  }
}

// Create and export a singleton instance
const redisClient = new RedisClient();

// Connect when module is imported
(async () => {
  await redisClient.connect();
})();

export default redisClient;
