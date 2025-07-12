import express from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { validateRequest, schemas } from '../middleware/validation.middleware.js';
import { cacheMiddleware, clearCache } from '../middleware/cache.middleware.js';
import { CACHE_KEYS } from '../config/redis.js';
import { paginationMiddleware } from '../middleware/pagination.middleware.js';
import Brand from '../models/brand.model.js';
import csvWriter from 'csv-writer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Get all brands
const getBrands = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, search, isActive, featured } = req.query;
  
  let query = {};
  
  // Apply search filter
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { country: { $regex: search, $options: 'i' } }
    ];
  }
  
  // Apply active filter
  if (isActive !== undefined) {
    query.isActive = isActive === 'true';
  }
  
  // Apply featured filter
  if (featured !== undefined) {
    query.featured = featured === 'true';
  }
  
  const skip = (page - 1) * limit;
  
  const [brands, total] = await Promise.all([
    Brand.find(query)
      .sort({ name: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Brand.countDocuments(query)
  ]);
  
  res.json({
    success: true,
    data: {
      brands,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// Get single brand by ID
const getBrandById = asyncHandler(async (req, res) => {
  const brand = await Brand.findById(req.params.id).lean();
  
  if (!brand) {
    return res.status(404).json({
      success: false,
      message: 'Brand not found'
    });
  }
  
  res.json({
    success: true,
    data: brand
  });
});

// Create new brand (admin only)
const createBrand = asyncHandler(async (req, res) => {
  const brand = new Brand(req.body);
  await brand.save();
  
  res.status(201).json({
    success: true,
    data: brand,
    message: 'Brand created successfully'
  });
});

// Update brand (admin only)
const updateBrand = asyncHandler(async (req, res) => {
  const brand = await Brand.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );
  
  if (!brand) {
    return res.status(404).json({
      success: false,
      message: 'Brand not found'
    });
  }
  
  res.json({
    success: true,
    data: brand,
    message: 'Brand updated successfully'
  });
});

// Delete brand (admin only)
const deleteBrand = asyncHandler(async (req, res) => {
  const brand = await Brand.findByIdAndDelete(req.params.id);
  
  if (!brand) {
    return res.status(404).json({
      success: false,
      message: 'Brand not found'
    });
  }
  
  res.json({
    success: true,
    message: 'Brand deleted successfully'
  });
});

// Get featured brands
const getFeaturedBrands = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;
  
  const brands = await Brand.find({ featured: true, isActive: true })
    .sort({ name: 1 })
    .limit(parseInt(limit))
    .lean();
  
  res.json({
    success: true,
    data: { brands }
  });
});

// Bulk import brands from CSV/JSON
const bulkImportBrands = asyncHandler(async (req, res) => {
  const { data, format = 'csv', validateOnly = false } = req.body;
  
  if (!data || !Array.isArray(data)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid data format. Expected array of brands.'
    });
  }

  const results = {
    total: data.length,
    successful: 0,
    failed: 0,
    errors: [],
    created: [],
    skipped: []
  };

  // Validate and process each brand
  for (let i = 0; i < data.length; i++) {
    const brandData = data[i];
    
    try {
      // Basic validation
      if (!brandData.name || !brandData.description) {
        results.errors.push({
          row: i + 1,
          data: brandData,
          error: 'Name and description are required'
        });
        results.failed++;
        continue;
      }

      // Generate slug if not provided
      if (!brandData.slug) {
        brandData.slug = brandData.name
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');
      }

      // Check for existing brand with same name or slug
      const existingBrand = await Brand.findOne({
        $or: [
          { name: brandData.name },
          { slug: brandData.slug }
        ]
      });

      if (existingBrand) {
        results.errors.push({
          row: i + 1,
          data: brandData,
          error: `Brand with name "${brandData.name}" or slug "${brandData.slug}" already exists`
        });
        results.skipped.push(brandData);
        continue;
      }

      // If validation only, skip actual creation
      if (validateOnly) {
        results.successful++;
        continue;
      }

      // Create the brand
      const newBrand = await Brand.create({
        name: brandData.name,
        slug: brandData.slug,
        description: brandData.description,
        featured: brandData.featured === true || brandData.featured === 'true',
        country: brandData.country || '',
        website: brandData.website || '',
        order: parseInt(brandData.order) || 0,
        logo: brandData.logo || { url: '', alt: '' }
      });

      results.created.push(newBrand);
      results.successful++;

    } catch (error) {
      results.errors.push({
        row: i + 1,
        data: brandData,
        error: error.message
      });
      results.failed++;
    }
  }

  res.json({
    success: true,
    message: validateOnly ? 'Validation completed' : 'Bulk import completed',
    data: results
  });
});

// Bulk export brands to CSV/JSON
const bulkExportBrands = asyncHandler(async (req, res) => {
  const { format = 'csv', includeIds = false } = req.query;

  const brands = await Brand.find({})
    .sort({ order: 1, name: 1 })
    .lean();

  // Transform data for export
  const exportData = brands.map(brand => {
    const exportBrand = {
      name: brand.name,
      slug: brand.slug,
      description: brand.description,
      featured: brand.featured,
      country: brand.country || '',
      website: brand.website || '',
      order: brand.order,
      logoUrl: brand.logo?.url || '',
      logoAlt: brand.logo?.alt || '',
      createdAt: brand.createdAt,
      updatedAt: brand.updatedAt
    };

    if (includeIds === 'true') {
      exportBrand.id = brand._id;
    }

    return exportBrand;
  });

  if (format === 'json') {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="brands.json"');
    return res.json({
      success: true,
      data: exportData,
      exportInfo: {
        totalRecords: exportData.length,
        exportedAt: new Date().toISOString(),
        format: 'json'
      }
    });
  } else {
    // CSV format
    const csvHeaders = [
      { id: 'name', title: 'Name' },
      { id: 'slug', title: 'Slug' },
      { id: 'description', title: 'Description' },
      { id: 'featured', title: 'Featured' },
      { id: 'country', title: 'Country' },
      { id: 'website', title: 'Website' },
      { id: 'order', title: 'Order' },
      { id: 'logoUrl', title: 'Logo URL' },
      { id: 'logoAlt', title: 'Logo Alt Text' },
      { id: 'createdAt', title: 'Created At' },
      { id: 'updatedAt', title: 'Updated At' }
    ];

    if (includeIds === 'true') {
      csvHeaders.unshift({ id: 'id', title: 'ID' });
    }

    const fileName = `brands_${Date.now()}.csv`;
    const filePath = path.join(__dirname, '../temp', fileName);

    // Ensure temp directory exists
    const tempDir = path.dirname(filePath);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const csvWriterInstance = csvWriter.createObjectCsvWriter({
      path: filePath,
      header: csvHeaders
    });

    await csvWriterInstance.writeRecords(exportData);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    // Clean up temp file after sending
    fileStream.on('end', () => {
      fs.unlink(filePath, (err) => {
        if (err) console.error('Error deleting temp file:', err);
      });
    });
  }
});

// Download bulk import template for brands
const downloadBrandImportTemplate = asyncHandler(async (req, res) => {
  const { format = 'csv' } = req.query;

  const templateData = [
    {
      name: 'Toyota',
      slug: 'toyota',
      description: 'Japanese automotive manufacturer',
      featured: true,
      country: 'Japan',
      website: 'https://toyota.com',
      order: 1,
      logoUrl: 'https://example.com/toyota-logo.jpg',
      logoAlt: 'Toyota logo'
    },
    {
      name: 'BMW',
      slug: 'bmw',
      description: 'German luxury automotive brand',
      featured: false,
      country: 'Germany',
      website: 'https://bmw.com',
      order: 2,
      logoUrl: 'https://example.com/bmw-logo.jpg',
      logoAlt: 'BMW logo'
    }
  ];

  if (format === 'json') {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="brands_template.json"');
    return res.json({
      template: templateData,
      instructions: {
        requiredFields: ['name', 'description'],
        optionalFields: ['slug', 'featured', 'country', 'website', 'order', 'logoUrl', 'logoAlt'],
        notes: [
          'If slug is not provided, it will be generated from the name',
          'Featured should be true/false',
          'Order should be a number (default: 0)',
          'Country and website are optional',
          'Logo URL and alt text are optional'
        ]
      }
    });
  } else {
    // CSV template
    const csvHeaders = [
      { id: 'name', title: 'Name' },
      { id: 'slug', title: 'Slug' },
      { id: 'description', title: 'Description' },
      { id: 'featured', title: 'Featured' },
      { id: 'country', title: 'Country' },
      { id: 'website', title: 'Website' },
      { id: 'order', title: 'Order' },
      { id: 'logoUrl', title: 'Logo URL' },
      { id: 'logoAlt', title: 'Logo Alt Text' }
    ];

    const fileName = `brands_template_${Date.now()}.csv`;
    const filePath = path.join(__dirname, '../temp', fileName);

    // Ensure temp directory exists
    const tempDir = path.dirname(filePath);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const csvWriterInstance = csvWriter.createObjectCsvWriter({
      path: filePath,
      header: csvHeaders
    });

    await csvWriterInstance.writeRecords(templateData);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    // Clean up temp file after sending
    fileStream.on('end', () => {
      fs.unlink(filePath, (err) => {
        if (err) console.error('Error deleting temp file:', err);
      });
    });
  }
});

// Public routes
router.get('/', paginationMiddleware, cacheMiddleware(CACHE_KEYS.BRANDS || 'brands'), getBrands);
router.get('/featured', getFeaturedBrands);
router.get('/:id', getBrandById);

// Protected routes (admin only)
router.use(authenticate, authorize('admin'));

router.post('/', createBrand);
router.put('/:id', updateBrand);
router.delete('/:id', deleteBrand);

// Bulk operations
router.post('/bulk-import', bulkImportBrands);
router.get('/bulk-export', bulkExportBrands);
router.get('/import-template', downloadBrandImportTemplate);

export default router; 