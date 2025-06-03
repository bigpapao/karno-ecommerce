import VehicleModel from '../models/VehicleModel.js';
import Product from '../models/product.model.js';
import '../models/Manufacturer.js'; // Ensure Manufacturer model is registered
import { logger } from './logger.js';
import mongoose from 'mongoose';

/**
 * Update product count for a specific vehicle model
 * @param {string|ObjectId} modelId - Vehicle model ID
 * @returns {Promise<number>} Updated count
 */
export const updateModelProductCount = async (modelId) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(modelId)) {
      logger.error(`Invalid modelId: ${modelId}`);
      return 0;
    }

    // Count products that have this model in their compatible vehicles
    const count = await Product.countDocuments({
      'compatibleVehicles.modelId': modelId,
      $or: [
        { status: { $exists: false } },
        { status: 'active' }
      ]
    });

    // Update the vehicle model with the new count
    await VehicleModel.findByIdAndUpdate(
      modelId,
      { productsCount: count },
      { new: true }
    );

    logger.debug(`Updated product count for model ${modelId}: ${count}`);
    return count;
  } catch (error) {
    logger.error(`Error updating product count for model ${modelId}:`, error);
    return 0;
  }
};

/**
 * Update product counts for multiple vehicle models
 * @param {Array<string|ObjectId>} modelIds - Array of vehicle model IDs
 * @returns {Promise<Object>} Object with modelId as key and count as value
 */
export const updateMultipleModelProductCounts = async (modelIds) => {
  const results = {};
  
  try {
    const validModelIds = modelIds.filter(id => mongoose.Types.ObjectId.isValid(id));
    
    await Promise.all(
      validModelIds.map(async (modelId) => {
        const count = await updateModelProductCount(modelId);
        results[modelId] = count;
      })
    );
    
    logger.debug(`Updated product counts for ${validModelIds.length} models`);
  } catch (error) {
    logger.error('Error updating multiple model product counts:', error);
  }
  
  return results;
};

/**
 * Update product counts for all vehicle models in the database
 * @returns {Promise<void>}
 */
export const updateAllModelProductCounts = async () => {
  try {
    logger.info('Starting bulk update of all vehicle model product counts...');
    
    // Get models without population to avoid dependency issues
    const models = await VehicleModel.find({ isActive: true }).select('_id name').lean();
    const modelIds = models.map(model => model._id);
    
    logger.info(`Found ${models.length} active vehicle models to update`);
    
    await updateMultipleModelProductCounts(modelIds);
    
    logger.info(`Completed bulk update for ${models.length} vehicle models`);
  } catch (error) {
    logger.error('Error updating all model product counts:', error);
    throw error;
  }
};

/**
 * Handle product creation - update counts for all related models
 * @param {Object} product - Product document
 * @returns {Promise<void>}
 */
export const handleProductCreated = async (product) => {
  try {
    if (product.compatibleVehicles && product.compatibleVehicles.length > 0) {
      const modelIds = product.compatibleVehicles
        .map(vehicle => vehicle.modelId)
        .filter(id => id && mongoose.Types.ObjectId.isValid(id));
      
      if (modelIds.length > 0) {
        await updateMultipleModelProductCounts(modelIds);
        logger.debug(`Updated counts for ${modelIds.length} models after product creation`);
      }
    }
  } catch (error) {
    logger.error('Error handling product creation for model counts:', error);
  }
};

/**
 * Handle product update - update counts for old and new models
 * @param {Object} oldProduct - Previous product state
 * @param {Object} newProduct - Updated product state
 * @returns {Promise<void>}
 */
export const handleProductUpdated = async (oldProduct, newProduct) => {
  try {
    const oldModelIds = (oldProduct.compatibleVehicles || [])
      .map(vehicle => vehicle.modelId?.toString())
      .filter(id => id && mongoose.Types.ObjectId.isValid(id));
    
    const newModelIds = (newProduct.compatibleVehicles || [])
      .map(vehicle => vehicle.modelId?.toString())
      .filter(id => id && mongoose.Types.ObjectId.isValid(id));
    
    // Get all unique model IDs that need updating
    const allModelIds = [...new Set([...oldModelIds, ...newModelIds])];
    
    if (allModelIds.length > 0) {
      await updateMultipleModelProductCounts(allModelIds);
      logger.debug(`Updated counts for ${allModelIds.length} models after product update`);
    }
  } catch (error) {
    logger.error('Error handling product update for model counts:', error);
  }
};

/**
 * Handle product deletion - update counts for related models
 * @param {Object} product - Deleted product document
 * @returns {Promise<void>}
 */
export const handleProductDeleted = async (product) => {
  try {
    if (product.compatibleVehicles && product.compatibleVehicles.length > 0) {
      const modelIds = product.compatibleVehicles
        .map(vehicle => vehicle.modelId)
        .filter(id => id && mongoose.Types.ObjectId.isValid(id));
      
      if (modelIds.length > 0) {
        await updateMultipleModelProductCounts(modelIds);
        logger.debug(`Updated counts for ${modelIds.length} models after product deletion`);
      }
    }
  } catch (error) {
    logger.error('Error handling product deletion for model counts:', error);
  }
};

export default {
  updateModelProductCount,
  updateMultipleModelProductCounts,
  updateAllModelProductCounts,
  handleProductCreated,
  handleProductUpdated,
  handleProductDeleted,
}; 