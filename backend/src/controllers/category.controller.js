import Category from '../models/category.model.js';
import { AppError } from '../middleware/error-handler.middleware.js';
import multer from 'multer';
import csv from 'csv-parser';
import csvWriter from 'csv-writer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// @desc    Get all categories with automotive filtering
// @route   GET /api/categories
// @access  Public
export const getCategories = async (req, res, next) => {
  try {
    const { 
      parentOnly, 
      partType, 
      vehicleCategory, 
      compatibilityLevel, 
      criticalityLevel,
      installationDifficulty,
      featured,
      withBreadcrumbs 
    } = req.query;
    
    const query = {};

    // Basic filtering
    if (parentOnly === 'true') {
      query.parent = null;
    }

    // Automotive-specific filtering
    if (partType) {
      query.partType = partType;
    }
    
    if (vehicleCategory) {
      query.vehicleCategory = { $in: vehicleCategory.split(',') };
    }
    
    if (compatibilityLevel) {
      query.compatibilityLevel = compatibilityLevel;
    }
    
    if (criticalityLevel) {
      query.criticalityLevel = criticalityLevel;
    }
    
    if (installationDifficulty) {
      query.installationDifficulty = installationDifficulty;
    }
    
    if (featured === 'true') {
      query.featured = true;
    }

    const categories = await Category.find(query)
      .sort({ order: 1, name: 1 })
      .populate({
        path: 'children',
        select: 'name slug image partType compatibilityLevel criticalityLevel',
        options: { sort: { order: 1, name: 1 } },
      })
      .populate('productsCount');

    // Add breadcrumbs if requested
    if (withBreadcrumbs === 'true') {
      for (let category of categories) {
        category.breadcrumbs = await generateBreadcrumbs(category);
      }
    }

    res.status(200).json({
      status: 'success',
      results: categories.length,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get category tree with hierarchy depth
// @route   GET /api/categories/tree
// @access  Public
export const getCategoryTree = async (req, res, next) => {
  try {
    const { maxDepth = 3, partType, vehicleCategory } = req.query;
    
    const query = { parent: null };
    
    // Apply automotive filtering
    if (partType) {
      query.partType = partType;
    }
    
    if (vehicleCategory) {
      query.vehicleCategory = { $in: vehicleCategory.split(',') };
    }

    const rootCategories = await Category.find(query)
      .sort({ order: 1, name: 1 });

    const categoryTree = [];
    
    for (const rootCategory of rootCategories) {
      const treeNode = await buildCategoryTree(rootCategory, 0, parseInt(maxDepth));
      categoryTree.push(treeNode);
    }

    res.status(200).json({
      status: 'success',
      data: categoryTree,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get categories by vehicle type
// @route   GET /api/categories/vehicle/:vehicleType
// @access  Public
export const getCategoriesByVehicleType = async (req, res, next) => {
  try {
    const { vehicleType } = req.params;
    const { partType, criticalityLevel } = req.query;
    
    const query = {
      vehicleCategory: { $in: [vehicleType] },
      isAutomotiveSpecific: true
    };
    
    if (partType) {
      query.partType = partType;
    }
    
    if (criticalityLevel) {
      query.criticalityLevel = criticalityLevel;
    }

    const categories = await Category.find(query)
      .sort({ order: 1, criticalityLevel: 1, name: 1 })
      .populate('productsCount');

    // Group by part type for better organization
    const groupedCategories = {};
    categories.forEach(category => {
      if (!groupedCategories[category.partType]) {
        groupedCategories[category.partType] = [];
      }
      groupedCategories[category.partType].push(category);
    });

    res.status(200).json({
      status: 'success',
      vehicleType,
      results: categories.length,
      data: {
        categories,
        groupedByPartType: groupedCategories
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get automotive category statistics
// @route   GET /api/categories/automotive/stats
// @access  Public
export const getAutomotiveCategoryStats = async (req, res, next) => {
  try {
    const stats = await Category.aggregate([
      { $match: { isAutomotiveSpecific: true } },
      {
        $group: {
          _id: null,
          totalCategories: { $sum: 1 },
          byPartType: {
            $push: {
              partType: '$partType',
              compatibilityLevel: '$compatibilityLevel',
              criticalityLevel: '$criticalityLevel'
            }
          }
        }
      },
      {
        $addFields: {
          partTypeDistribution: {
            $reduce: {
              input: '$byPartType',
              initialValue: {},
              in: {
                $mergeObjects: [
                  '$$value',
                  {
                    $arrayToObject: [[{
                      k: '$$this.partType',
                      v: { $add: [{ $ifNull: [{ $getField: { field: '$$this.partType', input: '$$value' } }, 0] }, 1] }
                    }]]
                  }
                ]
              }
            }
          }
        }
      }
    ]);

    // Additional stats by criticality and compatibility
    const criticalityStats = await Category.aggregate([
      { $match: { isAutomotiveSpecific: true } },
      { $group: { _id: '$criticalityLevel', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const compatibilityStats = await Category.aggregate([
      { $match: { isAutomotiveSpecific: true } },
      { $group: { _id: '$compatibilityLevel', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        overview: stats[0] || { totalCategories: 0 },
        criticalityDistribution: criticalityStats,
        compatibilityDistribution: compatibilityStats
      }
    });
  } catch (error) {
    next(error);
  }
};

// Helper function to generate breadcrumbs
const generateBreadcrumbs = async (category) => {
  const breadcrumbs = [];
  let current = category;
  
  while (current) {
    breadcrumbs.unshift({
      _id: current._id,
      name: current.name,
      slug: current.slug,
      partType: current.partType
    });
    
    if (current.parent) {
      current = await Category.findById(current.parent);
    } else {
      current = null;
    }
  }
  
  return breadcrumbs;
};

// Helper function to build category tree with depth control
const buildCategoryTree = async (category, currentDepth, maxDepth) => {
  const node = {
    _id: category._id,
    name: category.name,
    slug: category.slug,
    partType: category.partType,
    vehicleCategory: category.vehicleCategory,
    compatibilityLevel: category.compatibilityLevel,
    criticalityLevel: category.criticalityLevel,
    installationDifficulty: category.installationDifficulty,
    depth: currentDepth,
    children: []
  };
  
  if (currentDepth < maxDepth) {
    const children = await Category.find({ parent: category._id })
      .sort({ order: 1, name: 1 });
    
    for (const child of children) {
      const childNode = await buildCategoryTree(child, currentDepth + 1, maxDepth);
      node.children.push(childNode);
    }
  }
  
  return node;
};

// @desc    Get single category with full details
// @route   GET /api/categories/:id
// @access  Public
export const getCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id)
      .populate({
        path: 'children',
        select: 'name slug image partType compatibilityLevel criticalityLevel',
        options: { sort: { order: 1, name: 1 } },
      })
      .populate('productsCount');

    if (!category) {
      return next(new AppError('Category not found', 404));
    }

    // Add breadcrumbs
    category.breadcrumbs = await generateBreadcrumbs(category);

    res.status(200).json({
      status: 'success',
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new category
// @route   POST /api/categories
// @access  Private (Admin)
export const createCategory = async (req, res, next) => {
  try {
    const category = await Category.create(req.body);

    res.status(201).json({
      status: 'success',
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private (Admin)
export const updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      },
    );

    if (!category) {
      return next(new AppError('Category not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private (Admin)
export const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);

    if (!category) {
      return next(new AppError('Category not found', 404));
    }

    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload categories from CSV
// @route   POST /api/categories/upload
// @access  Private (Admin)
const upload = multer({ dest: 'uploads/' });

export const uploadCategoriesCSV = [
  upload.single('file'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return next(new AppError('Please upload a CSV file', 400));
      }

      const results = [];
      const errors = [];

      fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
          try {
            for (const row of results) {
              try {
                await Category.create({
                  name: row.name,
                  slug: row.slug,
                  description: row.description,
                  partType: row.partType,
                  vehicleCategory: row.vehicleCategory ? row.vehicleCategory.split(',') : [],
                  compatibilityLevel: row.compatibilityLevel || 'universal',
                  isAutomotiveSpecific: row.isAutomotiveSpecific === 'true',
                  featured: row.featured === 'true',
                });
              } catch (error) {
                errors.push({ row, error: error.message });
              }
            }

            // Clean up uploaded file
            fs.unlinkSync(req.file.path);

            res.status(200).json({
              status: 'success',
              message: `Processed ${results.length} categories`,
              errors: errors.length > 0 ? errors : undefined,
            });
          } catch (error) {
            next(error);
          }
        });
    } catch (error) {
      next(error);
    }
  },
];

// @desc    Export categories to CSV
// @route   GET /api/categories/export
// @access  Private (Admin)
export const exportCategoriesCSV = async (req, res, next) => {
  try {
    const categories = await Category.find({}).sort({ order: 1, name: 1 });

    const csvFilename = `categories-${Date.now()}.csv`;
    const csvPath = path.join(__dirname, '../public/exports', csvFilename);

    // Ensure export directory exists
    const exportDir = path.dirname(csvPath);
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    const createCsvWriter = csvWriter.createObjectCsvWriter({
      path: csvPath,
      header: [
        { id: 'name', title: 'Name' },
        { id: 'slug', title: 'Slug' },
        { id: 'description', title: 'Description' },
        { id: 'partType', title: 'Part Type' },
        { id: 'vehicleCategory', title: 'Vehicle Category' },
        { id: 'compatibilityLevel', title: 'Compatibility Level' },
        { id: 'criticalityLevel', title: 'Criticality Level' },
        { id: 'installationDifficulty', title: 'Installation Difficulty' },
        { id: 'isAutomotiveSpecific', title: 'Automotive Specific' },
        { id: 'featured', title: 'Featured' },
      ],
    });

    const records = categories.map(category => ({
      name: category.name,
      slug: category.slug,
      description: category.description,
      partType: category.partType,
      vehicleCategory: category.vehicleCategory ? category.vehicleCategory.join(',') : '',
      compatibilityLevel: category.compatibilityLevel,
      criticalityLevel: category.criticalityLevel,
      installationDifficulty: category.installationDifficulty,
      isAutomotiveSpecific: category.isAutomotiveSpecific,
      featured: category.featured,
    }));

    await createCsvWriter.writeRecords(records);

    res.download(csvPath, csvFilename, (err) => {
      if (err) {
        next(err);
      } else {
        // Clean up file after download
        setTimeout(() => {
          if (fs.existsSync(csvPath)) {
            fs.unlinkSync(csvPath);
          }
        }, 5000);
      }
    });
  } catch (error) {
    next(error);
  }
};
