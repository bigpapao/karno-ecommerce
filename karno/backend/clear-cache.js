import { clearCache } from './src/utils/cache.js';
import { CACHE_KEYS } from './src/config/redis.js';

const clearBrandsCache = async () => {
  try {
    console.log('🔄 Clearing brands cache...');
    
    // Clear all cache
    await clearCache();
    
    console.log('✅ Cache cleared successfully!');
    console.log('📝 The API should now return updated brands data.');
    
  } catch (error) {
    console.error('❌ Error clearing cache:', error);
  }
};

clearBrandsCache(); 