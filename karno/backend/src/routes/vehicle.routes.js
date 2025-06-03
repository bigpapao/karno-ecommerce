import express from 'express';
import Manufacturer from '../models/Manufacturer.js';
import VehicleModel from '../models/VehicleModel.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import mongoose from 'mongoose';

const router = express.Router();

// Get all manufacturers
router.get('/manufacturers', asyncHandler(async (req, res) => {
  const manufacturers = await Manufacturer.find({ isActive: true })
    .populate('modelsCount')
    .sort({ name: 1 });
  
  res.json({ manufacturers });
}));

// Get models for a specific manufacturer
router.get('/manufacturers/:manufacturerId/models', asyncHandler(async (req, res) => {
  const { manufacturerId } = req.params;
  
  // Find by ID or slug
  const manufacturer = await Manufacturer.findOne({
    $or: [
      { _id: manufacturerId },
      { slug: manufacturerId }
    ],
    isActive: true
  });
  
  if (!manufacturer) {
    return res.status(404).json({ error: 'Manufacturer not found' });
  }
  
  const models = await VehicleModel.find({ 
    manufacturer: manufacturer._id,
    isActive: true 
  }).sort({ name: 1 });
  
  res.json({ models });
}));

// Get all models
router.get('/models', asyncHandler(async (req, res) => {
  const models = await VehicleModel.find({ isActive: true })
    .populate('productsCount')
    .sort({ name: 1 });
  
  res.json({ models });
}));

// Get single model by ID or slug
router.get('/models/:modelId', asyncHandler(async (req, res) => {
  const { modelId } = req.params;
  
  // Create query that checks both _id and slug
  let vehicleModelQuery = { isActive: true };
  
  // Check if modelId is a valid ObjectId
  if (mongoose.Types.ObjectId.isValid(modelId)) {
    vehicleModelQuery.$or = [
      { _id: modelId },
      { slug: modelId }
    ];
  } else {
    // If not a valid ObjectId, only search by slug
    vehicleModelQuery.slug = modelId;
  }
  
  const model = await VehicleModel.findOne(vehicleModelQuery);
  
  if (!model) {
    return res.status(404).json({ error: 'Model not found' });
  }
  
  res.json(model);
}));

// Get vehicle statistics for dashboard
router.get('/stats', asyncHandler(async (req, res) => {
  const [manufacturers, models] = await Promise.all([
    Manufacturer.find({ isActive: true }),
    VehicleModel.find({ isActive: true })
  ]);
  
  const stats = {
    totalManufacturers: manufacturers.length,
    totalModels: models.length,
    popularModels: models.filter(model => model.popular).length,
    stats: manufacturers.map(manufacturer => ({
      manufacturer: manufacturer.name,
      modelsCount: models.filter(model => 
        model.manufacturer._id.toString() === manufacturer._id.toString()
      ).length,
      popularModelsCount: models.filter(model => 
        model.manufacturer._id.toString() === manufacturer._id.toString() && model.popular
      ).length
    }))
  };
  
  res.json(stats);
}));

// Create new manufacturer (Admin only)
router.post('/manufacturers', asyncHandler(async (req, res) => {
  const newManufacturer = await Manufacturer.create(req.body);
  res.status(201).json(newManufacturer);
}));

// Create new model (Admin only)
router.post('/models', asyncHandler(async (req, res) => {
  const newModel = await VehicleModel.create(req.body);
  res.status(201).json(newModel);
}));

// Update manufacturer (Admin only)
router.put('/manufacturers/:id', asyncHandler(async (req, res) => {
  const updatedManufacturer = await Manufacturer.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );
  
  if (!updatedManufacturer) {
    return res.status(404).json({ error: 'Manufacturer not found' });
  }
  
  res.json(updatedManufacturer);
}));

// Update model (Admin only)
router.put('/models/:id', asyncHandler(async (req, res) => {
  const updatedModel = await VehicleModel.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );
  
  if (!updatedModel) {
    return res.status(404).json({ error: 'Model not found' });
  }
  
  res.json(updatedModel);
}));

// Delete manufacturer (Admin only)
router.delete('/manufacturers/:id', asyncHandler(async (req, res) => {
  const manufacturer = await Manufacturer.findByIdAndDelete(req.params.id);
  
  if (!manufacturer) {
    return res.status(404).json({ error: 'Manufacturer not found' });
  }
  
  res.json({ message: 'Manufacturer deleted successfully' });
}));

// Delete model (Admin only)
router.delete('/models/:id', asyncHandler(async (req, res) => {
  const model = await VehicleModel.findByIdAndDelete(req.params.id);
  
  if (!model) {
    return res.status(404).json({ error: 'Model not found' });
  }
  
  res.json({ message: 'Model deleted successfully' });
}));

export default router; 