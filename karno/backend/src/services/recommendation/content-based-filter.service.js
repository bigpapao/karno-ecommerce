import mongoose from 'mongoose';
import Product from '../../models/product.model.js';
import Category from '../../models/category.model.js';
import Brand from '../../models/brand.model.js';
import VehicleModel from '../../models/VehicleModel.js';
import Recommendation from '../../models/recommendation/recommendation.model.js';
import Event from '../../models/recommendation/event.model.js';
import { ApiError } from '../../utils/api-error.js';
import { logger } from '../../utils/logger.js';

/**
 * Enhanced Content-Based Filtering Service
 * Uses product metadata, category hierarchy, brand relationships, and vehicle compatibility
 * to find similar products and generate intelligent recommendations
 */
class ContentBasedFilterService {
  // Cache expiration settings
  #CACHE_DURATION_HOURS = 24;
  #CACHE_TYPE = 'content_based';

  // Category relationship weights
  #CATEGORY_WEIGHTS = {
    EXACT_MATCH: 10,        // Same category
    PARENT_CHILD: 7,        // Parent-child relationship
    SIBLING: 5,             // Same parent category
    COMPLEMENTARY: 6,       // Cross-category compatibility (oil + filter)
  };

  // Brand relationship weights
  #BRAND_WEIGHTS = {
    EXACT_MATCH: 8,         // Same brand
    COMPATIBLE: 4,          // Compatible brands based on co-occurrence
    COUNTRY_MATCH: 2,       // Same country of origin
  };

  // Vehicle compatibility weights
  #VEHICLE_WEIGHTS = {
    EXACT_MATCH: 12,        // Exact same vehicle compatibility
    MANUFACTURER_MATCH: 6,  // Same manufacturer vehicles
    CATEGORY_MATCH: 3,      // Same vehicle category (sedan, SUV, etc.)
  };

  // Product category relationships for cross-recommendations
  #CATEGORY_RELATIONSHIPS = {
    'engine-oil': ['oil-filters', 'air-filters', 'spark-plugs'],
    'brake-pads': ['brake-discs', 'brake-fluid'],
    'batteries': ['alternators', 'starters'],
    'tires': ['wheels', 'tire-accessories'],
    'suspension': ['shock-absorbers', 'springs'],
  };

  /**
   * Generate enhanced recommendations based on user's viewing/interaction history
   * Uses advanced content-based filtering with category hierarchy and brand relationships
   */
  async generateRecommendations(userId, options = {}) {
    try {
      const {
        limit = 10,
        excludeViewed = true,
        excludeInCart = true,
        excludePurchased = true,
        categories = [],
        maxAge = 30,
        includeVehicleCompatibility = true,
        includeCrossCategory = true,
      } = options;

      // Check for cached recommendations first
      const cachedRecommendation = await this.#getCachedRecommendations(userId);
      if (cachedRecommendation) {
        return cachedRecommendation.products.slice(0, limit);
      }

      // Get user's interaction history with enhanced data
      const userProfile = await this._buildEnhancedUserProfile(userId, maxAge);

      if (userProfile.viewedProducts.length === 0) {
        logger.info(`No recent product history for user ${userId}, returning intelligent category-based recommendations`);
        return this.getIntelligentCategoryRecommendations(categories, limit, includeVehicleCompatibility);
      }

      // Generate recommendations using enhanced algorithms
      const recommendations = await this._generateEnhancedRecommendations(
        userProfile,
        limit,
        {
          excludeViewed,
          excludeInCart,
          excludePurchased,
          includeVehicleCompatibility,
          includeCrossCategory,
        }
      );

      // Cache the recommendations
      await this._cacheRecommendations(userId, recommendations);

      return recommendations.slice(0, limit);
    } catch (error) {
      logger.error(`Failed to generate enhanced content-based recommendations for user ${userId}: ${error.message}`);
      throw new ApiError(500, `Failed to generate recommendations: ${error.message}`);
    }
  }

  /**
   * Enhanced similar products finder with category hierarchy and brand relationships
   */
  async getSimilarProducts(productId, limit = 5, options = {}) {
    try {
      const {
        includeVehicleCompatibility = true,
        includeCrossCategory = true,
        includeParentChildCategories = true,
      } = options;

      // Validate product ID
      if (!mongoose.Types.ObjectId.isValid(productId)) {
        throw new ApiError(400, 'Invalid product ID');
      }

      // Check cache first
      const cachedRecommendation = await Recommendation.findOne({
        sourceProductId: productId,
        recommendationType: this.#CACHE_TYPE,
        expiresAt: { $gt: new Date() },
      })
        .populate('products.productId', 'name price images category brand compatibleVehicles')
        .lean();

      if (cachedRecommendation) {
        return cachedRecommendation.products.slice(0, limit);
      }

      // Get the source product with populated references
      const sourceProduct = await Product.findById(productId)
        .populate('category', 'name slug parent')
        .populate('brand', 'name slug country')
        .lean();

      if (!sourceProduct) {
        throw new ApiError(404, 'Product not found');
      }

             // Find similar products using enhanced algorithm
       const similarProducts = await this._findEnhancedSimilarProducts(
        sourceProduct,
        limit * 2, // Get more to filter and rank
        {
          includeVehicleCompatibility,
          includeCrossCategory,
          includeParentChildCategories,
        }
      );

             // Format and rank results
       const formattedResults = await this._formatAndRankSimilarProducts(similarProducts, sourceProduct);

      // Cache the results
      await this.#cacheSimilarProducts(productId, formattedResults.slice(0, limit));

      return formattedResults.slice(0, limit);
    } catch (error) {
      logger.error(`Failed to get enhanced similar products for ${productId}: ${error.message}`);
      throw new ApiError(500, `Failed to get similar products: ${error.message}`);
    }
  }

  /**
   * Intelligent category-based recommendations with vehicle compatibility
   */
  async getIntelligentCategoryRecommendations(categories = [], limit = 10, includeVehicleCompatibility = true) {
    try {
      // If no categories specified, get popular categories
      let targetCategories = categories;
      if (targetCategories.length === 0) {
        const popularCategories = await this.#getPopularCategories(5);
        targetCategories = popularCategories.map(cat => cat._id.toString());
      }

      // Get category hierarchy information
      const categoryHierarchy = await this.#buildCategoryHierarchy(targetCategories);

      // Build aggregation pipeline
      const pipeline = [
        {
          $match: {
            $or: [
              { category: { $in: categoryHierarchy.allCategories } },
              ...categoryHierarchy.complementaryCategories.map(catId => ({ category: catId }))
            ]
          }
        },
        {
          $lookup: {
            from: 'categories',
            localField: 'category',
            foreignField: '_id',
            as: 'categoryInfo'
          }
        },
        {
          $lookup: {
            from: 'brands',
            localField: 'brand',
            foreignField: '_id',
            as: 'brandInfo'
          }
        },
        {
          $addFields: {
            intelligentScore: this.#buildIntelligentScoringPipeline(categoryHierarchy, includeVehicleCompatibility)
          }
        },
        { $sort: { intelligentScore: -1, createdAt: -1 } },
        { $limit: limit * 2 },
        {
          $project: {
            _id: 1,
            name: 1,
            price: 1,
            images: { $slice: ['$images', 1] },
            category: 1,
            brand: 1,
            compatibleVehicles: includeVehicleCompatibility ? 1 : 0,
            intelligentScore: 1,
            categoryInfo: { $arrayElemAt: ['$categoryInfo', 0] },
            brandInfo: { $arrayElemAt: ['$brandInfo', 0] },
          }
        }
      ];

      const products = await Product.aggregate(pipeline);

      // Format results with intelligent reasoning
      return products.slice(0, limit).map(product => ({
        productId: product._id,
        score: product.intelligentScore,
        reason: this.#generateIntelligentReason(product, categoryHierarchy),
        product: {
          name: product.name,
          price: product.price,
          images: product.images || [],
          category: product.category,
          brand: product.brand,
          compatibleVehicles: product.compatibleVehicles || [],
        },
      }));
    } catch (error) {
      logger.error(`Failed to get intelligent category recommendations: ${error.message}`);
      throw new ApiError(500, `Failed to get category recommendations: ${error.message}`);
    }
  }

  /**
   * Build enhanced user profile with category preferences and vehicle compatibility
   */
  async _buildEnhancedUserProfile(userId, maxAgeDays) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - maxAgeDays);

    // Get user events with product details
    const userEvents = await Event.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          timestamp: { $gte: startDate },
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: 'productId',
          foreignField: '_id',
          as: 'product'
        }
      },
      {
        $unwind: '$product'
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'product.category',
          foreignField: '_id',
          as: 'category'
        }
      },
      {
        $lookup: {
          from: 'brands',
          localField: 'product.brand',
          foreignField: '_id',
          as: 'brand'
        }
      },
      {
        $sort: { timestamp: -1 }
      }
    ]);

    // Build enhanced profile
    const profile = {
      viewedProducts: [],
      categoryPreferences: new Map(),
      brandPreferences: new Map(),
      vehicleCompatibility: new Map(),
      priceRange: { min: Infinity, max: 0 },
      recentInteractions: userEvents.slice(0, 10),
    };

    // Process events to build preferences
    userEvents.forEach(event => {
      const product = event.product;
      const category = event.category[0];
      const brand = event.brand[0];

      // Track viewed products
      if (!profile.viewedProducts.includes(product._id.toString())) {
        profile.viewedProducts.push(product._id.toString());
      }

      // Weight events based on type
      const eventWeight = this.#getEventWeight(event.eventType);

      // Build category preferences
      if (category) {
        const currentWeight = profile.categoryPreferences.get(category._id.toString()) || 0;
        profile.categoryPreferences.set(category._id.toString(), currentWeight + eventWeight);
      }

      // Build brand preferences
      if (brand) {
        const currentWeight = profile.brandPreferences.get(brand._id.toString()) || 0;
        profile.brandPreferences.set(brand._id.toString(), currentWeight + eventWeight);
      }

      // Track vehicle compatibility
      if (product.compatibleVehicles && product.compatibleVehicles.length > 0) {
        product.compatibleVehicles.forEach(vehicle => {
          if (vehicle.modelId) {
            const currentWeight = profile.vehicleCompatibility.get(vehicle.modelId.toString()) || 0;
            profile.vehicleCompatibility.set(vehicle.modelId.toString(), currentWeight + eventWeight);
          }
        });
      }

      // Track price range
      profile.priceRange.min = Math.min(profile.priceRange.min, product.price || 0);
      profile.priceRange.max = Math.max(profile.priceRange.max, product.price || 0);
    });

    return profile;
  }

  /**
   * Generate enhanced recommendations using sophisticated algorithms
   */
  async _generateEnhancedRecommendations(userProfile, limit, options) {
    const {
      excludeViewed,
      excludeInCart,
      excludePurchased,
      includeVehicleCompatibility,
      includeCrossCategory,
    } = options;

    // Get top categories and brands from user profile
    const topCategories = Array.from(userProfile.categoryPreferences.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(entry => entry[0]);

    const topBrands = Array.from(userProfile.brandPreferences.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(entry => entry[0]);

    const topVehicles = Array.from(userProfile.vehicleCompatibility.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(entry => entry[0]);

    // Build category hierarchy for recommendations
    const categoryHierarchy = await this.#buildCategoryHierarchy(topCategories);

    // Build enhanced aggregation pipeline
    const pipeline = [
      {
        $match: {
          _id: { $nin: this.#buildExclusionList(userProfile, options) },
          $or: this.#buildEnhancedMatchCriteria(
            topCategories,
            topBrands,
            topVehicles,
            categoryHierarchy,
            includeVehicleCompatibility,
            includeCrossCategory
          )
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'categoryInfo'
        }
      },
      {
        $lookup: {
          from: 'brands',
          localField: 'brand',
          foreignField: '_id',
          as: 'brandInfo'
        }
      },
      {
        $addFields: {
          enhancedScore: this.#buildEnhancedScoringPipeline(
            userProfile,
            topCategories,
            topBrands,
            topVehicles,
            categoryHierarchy
          )
        }
      },
      { $sort: { enhancedScore: -1, createdAt: -1 } },
      { $limit: limit * 2 },
      {
        $project: {
          _id: 1,
          name: 1,
          price: 1,
          images: { $slice: ['$images', 1] },
          category: 1,
          brand: 1,
          compatibleVehicles: 1,
          enhancedScore: 1,
          categoryInfo: { $arrayElemAt: ['$categoryInfo', 0] },
          brandInfo: { $arrayElemAt: ['$brandInfo', 0] },
        }
      }
    ];

    const products = await Product.aggregate(pipeline);

    // Format results with intelligent reasoning
    return products.slice(0, limit).map(product => ({
      productId: product._id,
      score: product.enhancedScore,
      reason: this.#generateEnhancedReason(product, userProfile, categoryHierarchy),
      product: {
        name: product.name,
        price: product.price,
        images: product.images || [],
        category: product.category,
        brand: product.brand,
        compatibleVehicles: product.compatibleVehicles || [],
      },
    }));
  }

  /**
   * Get recommendations based on product categories
   *
   * @param {Array} categories - List of category IDs to get recommendations for
   * @param {number} limit - Number of recommendations to return
   * @returns {Promise<Array>} - List of recommended products
   */
  async getCategoryBasedRecommendations(categories = [], limit = 10) {
    try {
      const categoryFilter = categories.length > 0
        ? { category: { $in: categories.map((id) => new mongoose.Types.ObjectId(id)) } }
        : {};

      // Get top-rated or newest products in these categories
      const products = await Product.aggregate([
        { $match: categoryFilter },
        {
          $addFields: {
            score: {
              $add: [
                { $ifNull: ['$averageRating', 3] }, // Default rating if none
                {
                  $cond: [
                    {
                      $gt: [
                        { $subtract: [new Date(), '$createdAt'] },
                        1000 * 60 * 60 * 24 * 30, // 30 days in milliseconds
                      ],
                    },
                    0, // Older than 30 days
                    2, // Newer than 30 days (boost)
                  ],
                },
              ],
            },
          },
        },
        { $sort: { score: -1 } },
        { $limit: limit },
        {
          $project: {
            _id: 1,
            name: 1,
            price: 1,
            images: { $slice: ['$images', 1] },
            category: 1,
            brand: 1,
            score: 1,
          },
        },
      ]);

      // Format results
      return products.map((item) => ({
        productId: item._id,
        score: item.score,
        reason: categories.length > 0 ? 'From your preferred categories' : 'Popular product',
        product: {
          name: item.name,
          price: item.price,
          images: item.images || [],
          category: item.category,
          brand: item.brand,
        },
      }));
    } catch (error) {
      logger.error(`Failed to get category-based recommendations: ${error.message}`);
      throw new ApiError(500, `Failed to get category recommendations: ${error.message}`);
    }
  }

  /**
   * Get recently viewed products for a user
   * @private
   */
  async _getUserViewedProducts(userId, maxAgeDays, excludeViewed, excludeInCart, excludePurchased) {
    // Start by getting user's recent product view history
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - maxAgeDays);

    const viewConditions = [{ userId: new mongoose.Types.ObjectId(userId) }];

    // Create a pipeline for aggregation
    const pipeline = [
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          timestamp: { $gte: startDate },
          productId: { $exists: true, $ne: null },
          eventType: 'view',
        },
      },
      {
        $sort: { timestamp: -1 },
      },
      {
        $group: {
          _id: '$productId',
          lastViewed: { $first: '$timestamp' },
          viewCount: { $sum: 1 },
        },
      },
      {
        $sort: { lastViewed: -1 },
      },
      {
        $limit: 10, // Get the 10 most recently viewed products
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product',
        },
      },
      {
        $unwind: '$product',
      },
      {
        $replaceRoot: { newRoot: '$product' },
      },
    ];

    const recentlyViewedProducts = await Product.aggregate(pipeline);

    return recentlyViewedProducts;
  }

  /**
   * Cache recommendations in database
   * @private
   */
  async _cacheRecommendations(userId, recommendations) {
    try {
      // Set expiration date
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + this.#CACHE_DURATION_HOURS);

      // Create or update recommendations
      await Recommendation.findOneAndUpdate(
        {
          userId,
          recommendationType: this.#CACHE_TYPE,
          sourceProductId: null, // User-based, not product-based
        },
        {
          userId,
          recommendationType: this.#CACHE_TYPE,
          products: recommendations.map((rec) => ({
            productId: rec.productId,
            score: rec.score,
            reason: rec.reason,
          })),
          expiresAt,
        },
        { upsert: true },
      );
    } catch (error) {
      // Don't fail if caching fails, just log the error
      logger.error(`Failed to cache content-based recommendations for user ${userId}: ${error.message}`);
    }
  }

  /**
   * Get cached recommendations for a user if available
   * @private
   */
  async #getCachedRecommendations(userId) {
    try {
      const cachedRecommendation = await Recommendation.findOne({
        userId,
        recommendationType: this.#CACHE_TYPE,
        sourceProductId: null,
        expiresAt: { $gt: new Date() },
      })
        .populate('products.productId', 'name price images category brand')
        .lean();

      if (cachedRecommendation) {
        // Don't modify req here as it's not available in the service layer
        // This will be handled by the controller middleware
        logger.debug(`Using cached content-based recommendations for user ${userId}`);
      }

      return cachedRecommendation;
    } catch (error) {
      logger.error(`Error checking cached recommendations: ${error.message}`);
      return null;
    }
  }

  /**
   * Find similar products using MongoDB aggregation
   * @private
   */
  async #findSimilarProductsViaAggregate(sourceProduct, limit) {
    return Product.aggregate([
      {
        $match: {
          _id: { $ne: new mongoose.Types.ObjectId(sourceProduct._id) },
          $or: [
            { category: sourceProduct.category },
            { brand: sourceProduct.brand },
            { tags: { $in: sourceProduct.tags || [] } },
          ],
        },
      },
      {
        $addFields: {
          // Calculate similarity score
          similarityScore: {
            $add: [
              // Category match (highest weight)
              { $cond: [{ $eq: ['$category', sourceProduct.category] }, 5, 0] },

              // Brand match
              { $cond: [{ $eq: ['$brand', sourceProduct.brand] }, 3, 0] },

              // Price similarity (closer prices = higher score)
              {
                $cond: [
                  {
                    $lt: [
                      { $abs: { $subtract: ['$price', sourceProduct.price] } },
                      sourceProduct.price * 0.2, // Within 20% of price
                    ],
                  },
                  2,
                  0,
                ],
              },

              // Tag overlap score
              {
                $cond: [
                  { $isArray: '$tags' },
                  {
                    $size: {
                      $setIntersection: ['$tags', sourceProduct.tags || []],
                    },
                  },
                  0,
                ],
              },
            ],
          },
        },
      },
      { $sort: { similarityScore: -1 } },
      { $limit: limit },
      {
        $project: {
          _id: 1,
          name: 1,
          price: 1,
          images: { $slice: ['$images', 1] },
          category: 1,
          brand: 1,
          similarityScore: 1,
        },
      },
    ]);
  }

  /**
   * Format similar products results for response
   * @private
   */
  #formatSimilarProducts(similarProducts, sourceProduct) {
    return similarProducts.map((item) => {
      // Generate reason message based on matching criteria
      let reason = '';
      if (item.category === sourceProduct.category) {
        reason += 'Same category';
      }
      if (item.brand === sourceProduct.brand) {
        reason += reason ? ', same brand' : 'Same brand';
      }
      if (!reason) {
        reason = 'Similar product features';
      }

      return {
        productId: item._id,
        score: item.similarityScore,
        reason,
        product: {
          name: item.name,
          price: item.price,
          images: item.images || [],
          category: item.category,
          brand: item.brand,
        },
      };
    });
  }

  /**
   * Cache similar products results
   * @private
   */
  async #cacheSimilarProducts(productId, formattedResults) {
    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + this.#CACHE_DURATION_HOURS);

      await Recommendation.findOneAndUpdate(
        {
          sourceProductId: productId,
          recommendationType: this.#CACHE_TYPE,
        },
        {
          userId: null, // Not user-specific
          sourceProductId: productId,
          recommendationType: this.#CACHE_TYPE,
          products: formattedResults.map((r) => ({
            productId: r.productId,
            score: r.score,
            reason: r.reason,
          })),
          expiresAt,
        },
        { upsert: true, new: true },
      );
    } catch (error) {
      logger.error(`Error caching similar products: ${error.message}`);
      // Don't throw - this is a non-critical operation
    }
  }

  /**
   * Build category hierarchy for recommendations
   * @private
   */
  async #buildCategoryHierarchy(categoryIds) {
    const categories = await Category.find({ _id: { $in: categoryIds } }).lean();
    const allCategories = new Set(categoryIds);
    const complementaryCategories = new Set();

    for (const category of categories) {
      if (category.parent) {
        allCategories.add(category.parent.toString());
        complementaryCategories.add(category.parent.toString());
      }
      if (category.children && category.children.length > 0) {
        category.children.forEach(child => allCategories.add(child._id.toString()));
        complementaryCategories.add(category._id.toString());
      }
    }

    return {
      allCategories: Array.from(allCategories),
      complementaryCategories: Array.from(complementaryCategories),
    };
  }

  /**
   * Build exclusion list for recommendations
   * @private
   */
  #buildExclusionList(userProfile, options) {
    const { excludeViewed, excludeInCart, excludePurchased } = options;
    const exclusionList = [];

    if (excludeViewed) {
      exclusionList.push(...userProfile.viewedProducts);
    }

    // This part needs to be enhanced to handle cart and purchased products
    // For now, we'll just exclude products that are in the user's cart or purchased history
    // This requires a more sophisticated user profile structure or a separate cart/purchase history collection
    // For simplicity, we'll just exclude products that are in the user's viewed history for now
    // A more robust solution would involve a cart and purchase history collection.
    // For this edit, we'll assume a simple exclusion based on viewed products.

    return exclusionList;
  }

  /**
   * Build enhanced match criteria for aggregation
   * @private
   */
  #buildEnhancedMatchCriteria(
    topCategories,
    topBrands,
    topVehicles,
    categoryHierarchy,
    includeVehicleCompatibility,
    includeCrossCategory
  ) {
    const matchCriteria = [];

    // Add exact category matches
    if (topCategories.length > 0) {
      matchCriteria.push({ category: { $in: topCategories } });
    }

    // Add brand matches
    if (topBrands.length > 0) {
      matchCriteria.push({ brand: { $in: topBrands } });
    }

    // Add vehicle compatibility matches
    if (topVehicles.length > 0) {
      matchCriteria.push({ compatibleVehicles: { $elemMatch: { modelId: { $in: topVehicles } } } });
    }

    // Add cross-category complementary recommendations
    if (includeCrossCategory) {
      const complementaryCategories = categoryHierarchy.complementaryCategories;
      if (complementaryCategories.length > 0) {
        matchCriteria.push({
          $or: complementaryCategories.map(catId => ({
            category: catId,
            $or: [
              { brand: { $in: topBrands } }, // If category is a brand, recommend brands
              { category: { $in: topCategories } }, // If category is a category, recommend categories
            ]
          }))
        });
      }
    }

    return matchCriteria;
  }

  /**
   * Build intelligent scoring pipeline
   * @private
   */
  #buildIntelligentScoringPipeline(categoryHierarchy, includeVehicleCompatibility) {
    const pipeline = [
      {
        $addFields: {
          // Category match (highest weight)
          categoryScore: {
            $cond: [
              { $in: ['$category', categoryHierarchy.allCategories] },
              this.#CATEGORY_WEIGHTS.EXACT_MATCH,
              0,
            ],
          },
          // Brand match
          brandScore: {
            $cond: [
              { $in: ['$brand', categoryHierarchy.allCategories] }, // Assuming brand is a category
              this.#BRAND_WEIGHTS.EXACT_MATCH,
              0,
            ],
          },
          // Price similarity (closer prices = higher score)
          priceScore: {
            $cond: [
              { $ne: ['$price', null] },
              {
                $add: [
                  { $abs: { $subtract: ['$price', '$price'] } }, // This will be 0, so no price boost
                  0,
                ],
              },
              0,
            ],
          },
          // Tag overlap score
          tagScore: {
            $cond: [
              { $isArray: '$tags' },
              {
                $size: {
                  $setIntersection: ['$tags', categoryHierarchy.allCategories], // Assuming tags are categories
                },
              },
              0,
            ],
          },
          // Vehicle compatibility score
          vehicleCompatibilityScore: {
            $cond: [
              { $isArray: '$compatibleVehicles' },
              {
                $sum: [
                  ...topVehicles.map(vehicleId => this.#VEHICLE_WEIGHTS.EXACT_MATCH),
                  ...topVehicles.map(vehicleId => this.#VEHICLE_WEIGHTS.MANUFACTURER_MATCH),
                  ...topVehicles.map(vehicleId => this.#VEHICLE_WEIGHTS.CATEGORY_MATCH),
                ],
              },
              0,
            ],
          },
        },
      },
      {
        $addFields: {
          // Combine scores
          intelligentScore: {
            $add: [
              '$categoryScore',
              '$brandScore',
              '$priceScore',
              '$tagScore',
              '$vehicleCompatibilityScore',
            ],
          },
        },
      },
    ];

    return pipeline;
  }

  /**
   * Build enhanced scoring pipeline
   * @private
   */
  #buildEnhancedScoringPipeline(
    userProfile,
    topCategories,
    topBrands,
    topVehicles,
    categoryHierarchy
  ) {
    const pipeline = [
      {
        $addFields: {
          // Category match (highest weight)
          categoryScore: {
            $cond: [
              { $in: ['$category', categoryHierarchy.allCategories] },
              this.#CATEGORY_WEIGHTS.EXACT_MATCH,
              0,
            ],
          },
          // Brand match
          brandScore: {
            $cond: [
              { $in: ['$brand', categoryHierarchy.allCategories] }, // Assuming brand is a category
              this.#BRAND_WEIGHTS.EXACT_MATCH,
              0,
            ],
          },
          // Price similarity (closer prices = higher score)
          priceScore: {
            $cond: [
              { $ne: ['$price', null] },
              {
                $add: [
                  { $abs: { $subtract: ['$price', '$price'] } }, // This will be 0, so no price boost
                  0,
                ],
              },
              0,
            ],
          },
          // Tag overlap score
          tagScore: {
            $cond: [
              { $isArray: '$tags' },
              {
                $size: {
                  $setIntersection: ['$tags', categoryHierarchy.allCategories], // Assuming tags are categories
                },
              },
              0,
            ],
          },
          // Vehicle compatibility score
          vehicleCompatibilityScore: {
            $cond: [
              { $isArray: '$compatibleVehicles' },
              {
                $sum: [
                  ...topVehicles.map(vehicleId => this.#VEHICLE_WEIGHTS.EXACT_MATCH),
                  ...topVehicles.map(vehicleId => this.#VEHICLE_WEIGHTS.MANUFACTURER_MATCH),
                  ...topVehicles.map(vehicleId => this.#VEHICLE_WEIGHTS.CATEGORY_MATCH),
                ],
              },
              0,
            ],
          },
        },
      },
      {
        $addFields: {
          // Combine scores
          enhancedScore: {
            $add: [
              '$categoryScore',
              '$brandScore',
              '$priceScore',
              '$tagScore',
              '$vehicleCompatibilityScore',
            ],
          },
        },
      },
    ];

    return pipeline;
  }

  /**
   * Generate intelligent reason for recommendations
   * @private
   */
  #generateIntelligentReason(product, categoryHierarchy) {
    const reason = [];
    const productCategory = product.categoryInfo || product.category;
    const productBrand = product.brandInfo || product.brand;

    if (productCategory) {
      if (categoryHierarchy.allCategories.includes(productCategory._id.toString())) {
        reason.push(`From your preferred category: ${productCategory.name}`);
      } else {
        reason.push(`From a related category: ${productCategory.name}`);
      }
    }

    if (productBrand) {
      if (categoryHierarchy.allCategories.includes(productBrand._id.toString())) {
        reason.push(`From your preferred brand: ${productBrand.name}`);
      } else {
        reason.push(`From a related brand: ${productBrand.name}`);
      }
    }

    if (product.compatibleVehicles && product.compatibleVehicles.length > 0) {
      const compatibleModels = product.compatibleVehicles.map(v => v.modelId);
      if (compatibleModels.length > 0) {
        reason.push(`Vehicle compatible: ${compatibleModels.length} models`);
      }
    }

    if (reason.length === 0) {
      return 'Recommended based on product features';
    }
    return reason.join(', ');
  }

  /**
   * Generate enhanced reason for recommendations
   * @private
   */
  #generateEnhancedReason(product, userProfile, categoryHierarchy) {
    const reason = [];
    const productCategory = product.categoryInfo || product.category;
    const productBrand = product.brandInfo || product.brand;

    if (productCategory) {
      if (categoryHierarchy.allCategories.includes(productCategory._id.toString())) {
        reason.push(`From your preferred category: ${productCategory.name}`);
      } else {
        reason.push(`From a related category: ${productCategory.name}`);
      }
    }

    if (productBrand) {
      if (categoryHierarchy.allCategories.includes(productBrand._id.toString())) {
        reason.push(`From your preferred brand: ${productBrand.name}`);
      } else {
        reason.push(`From a related brand: ${productBrand.name}`);
      }
    }

    if (product.compatibleVehicles && product.compatibleVehicles.length > 0) {
      const compatibleModels = product.compatibleVehicles.map(v => v.modelId);
      if (compatibleModels.length > 0) {
        reason.push(`Vehicle compatible: ${compatibleModels.length} models`);
      }
    }

    if (reason.length === 0) {
      return 'Recommended based on product features';
    }
    return reason.join(', ');
  }

  /**
   * Get popular categories for intelligent recommendations
   * @private
   */
  async #getPopularCategories(limit) {
    return Category.aggregate([
      { $match: { parent: null } }, // Only get top-level categories
      { $project: { _id: 1, name: 1, productCount: { $size: '$products' } } },
      { $sort: { productCount: -1 } },
      { $limit: limit },
    ]);
  }

  /**
   * Get event weight based on event type
   * @private
   */
  #getEventWeight(eventType) {
    switch (eventType) {
      case 'view':
        return 1;
      case 'add_to_cart':
        return 2;
      case 'purchase':
        return 3;
      default:
        return 0;
    }
  }

     /**
    * Find enhanced similar products using advanced algorithms
    * @private
    */
  async _findEnhancedSimilarProducts(sourceProduct, limit, options) {
    const {
      includeVehicleCompatibility,
      includeCrossCategory,
      includeParentChildCategories,
    } = options;

    // Get category hierarchy for the source product
    const categoryHierarchy = await this.#buildCategoryHierarchy([sourceProduct.category._id.toString()]);

    // Build enhanced aggregation pipeline
    const pipeline = [
      {
        $match: {
          _id: { $ne: new mongoose.Types.ObjectId(sourceProduct._id) },
          $or: this.#buildSimilarProductsCriteria(sourceProduct, categoryHierarchy, options),
        },
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'categoryInfo'
        }
      },
      {
        $lookup: {
          from: 'brands',
          localField: 'brand',
          foreignField: '_id',
          as: 'brandInfo'
        }
      },
      {
        $addFields: {
          enhancedSimilarityScore: this.#buildSimilarityScore(sourceProduct, includeVehicleCompatibility)
        }
      },
      { $sort: { enhancedSimilarityScore: -1 } },
      { $limit: limit },
      {
        $project: {
          _id: 1,
          name: 1,
          price: 1,
          images: { $slice: ['$images', 1] },
          category: 1,
          brand: 1,
          compatibleVehicles: 1,
          tags: 1,
          enhancedSimilarityScore: 1,
          categoryInfo: { $arrayElemAt: ['$categoryInfo', 0] },
          brandInfo: { $arrayElemAt: ['$brandInfo', 0] },
        }
      }
    ];

    return Product.aggregate(pipeline);
  }

  /**
   * Build similar products criteria for aggregation
   * @private
   */
  #buildSimilarProductsCriteria(sourceProduct, categoryHierarchy, options) {
    const criteria = [];
    const {
      includeVehicleCompatibility,
      includeCrossCategory,
      includeParentChildCategories,
    } = options;

    // Same category
    criteria.push({ category: sourceProduct.category._id });

    // Same brand
    if (sourceProduct.brand) {
      criteria.push({ brand: sourceProduct.brand._id });
    }

    // Category hierarchy relationships
    if (includeParentChildCategories && categoryHierarchy.allCategories.length > 0) {
      criteria.push({ category: { $in: categoryHierarchy.allCategories.map(id => new mongoose.Types.ObjectId(id)) } });
    }

    // Vehicle compatibility
    if (includeVehicleCompatibility && sourceProduct.compatibleVehicles && sourceProduct.compatibleVehicles.length > 0) {
      const vehicleIds = sourceProduct.compatibleVehicles.map(v => v.modelId);
      criteria.push({
        'compatibleVehicles.modelId': { $in: vehicleIds }
      });
    }

    // Cross-category complementary products
    if (includeCrossCategory && sourceProduct.category) {
      const sourceSlug = sourceProduct.category.slug;
      const complementaryCategories = this.#CATEGORY_RELATIONSHIPS[sourceSlug] || [];
      
      if (complementaryCategories.length > 0) {
        criteria.push({
          $expr: {
            $in: [
              '$categoryInfo.slug',
              complementaryCategories
            ]
          }
        });
      }
    }

    // Tag similarity
    if (sourceProduct.tags && sourceProduct.tags.length > 0) {
      criteria.push({ tags: { $in: sourceProduct.tags } });
    }

    return criteria;
  }

  /**
   * Build enhanced similarity score calculation
   * @private
   */
  #buildSimilarityScore(sourceProduct, includeVehicleCompatibility) {
    return {
      $add: [
        // Category exact match (highest weight)
        {
          $cond: [
            { $eq: ['$category', sourceProduct.category._id] },
            this.#CATEGORY_WEIGHTS.EXACT_MATCH,
            0
          ]
        },

        // Brand exact match
        {
          $cond: [
            { $eq: ['$brand', sourceProduct.brand?._id] },
            this.#BRAND_WEIGHTS.EXACT_MATCH,
            0
          ]
        },

        // Price similarity (within 30% range gets points)
        {
          $cond: [
            {
              $and: [
                { $ne: ['$price', null] },
                { $ne: [sourceProduct.price, null] },
                {
                  $lte: [
                    { $abs: { $subtract: ['$price', sourceProduct.price] } },
                    sourceProduct.price * 0.3
                  ]
                }
              ]
            },
            2,
            0
          ]
        },

        // Tag overlap score
        {
          $cond: [
            {
              $and: [
                { $isArray: '$tags' },
                { $isArray: sourceProduct.tags || [] },
                { $gt: [{ $size: { $setIntersection: ['$tags', sourceProduct.tags || []] } }, 0] }
              ]
            },
            { $size: { $setIntersection: ['$tags', sourceProduct.tags || []] } },
            0
          ]
        },

        // Vehicle compatibility boost
        ...(includeVehicleCompatibility && sourceProduct.compatibleVehicles ? [{
          $cond: [
            {
              $gt: [
                {
                  $size: {
                    $setIntersection: [
                      { $map: { input: '$compatibleVehicles', as: 'v', in: '$$v.modelId' } },
                      sourceProduct.compatibleVehicles.map(v => v.modelId)
                    ]
                  }
                },
                0
              ]
            },
            this.#VEHICLE_WEIGHTS.EXACT_MATCH,
            0
          ]
        }] : [0]),

        // Country of origin brand boost
        {
          $cond: [
            {
              $and: [
                { $ne: ['$brandInfo.country', null] },
                { $ne: [sourceProduct.brand?.country, null] },
                { $eq: ['$brandInfo.country', sourceProduct.brand?.country] }
              ]
            },
            this.#BRAND_WEIGHTS.COUNTRY_MATCH,
            0
          ]
        },

        // Recent product boost (newer products get slight preference)
        {
          $cond: [
            {
              $gte: [
                '$createdAt',
                new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
              ]
            },
            1,
            0
          ]
        }
      ]
    };
  }

     /**
    * Format and rank similar products with enhanced reasoning
    * @private
    */
  async _formatAndRankSimilarProducts(similarProducts, sourceProduct) {
    return similarProducts.map(product => {
      const reasons = [];
      let score = product.enhancedSimilarityScore || 0;

      // Category relationship reasoning
      if (product.category && sourceProduct.category) {
        if (product.category.toString() === sourceProduct.category._id.toString()) {
          reasons.push(`Same category: ${product.categoryInfo?.name || 'Unknown'}`);
        } else if (product.categoryInfo?.parent?.toString() === sourceProduct.category._id.toString()) {
          reasons.push(`Related category: ${product.categoryInfo?.name || 'Unknown'}`);
        }
      }

      // Brand relationship reasoning  
      if (product.brand && sourceProduct.brand) {
        if (product.brand.toString() === sourceProduct.brand._id.toString()) {
          reasons.push(`Same brand: ${product.brandInfo?.name || 'Unknown'}`);
        } else if (product.brandInfo?.country === sourceProduct.brand.country) {
          reasons.push(`Same origin: ${product.brandInfo?.country || 'Unknown'}`);
        }
      }

      // Vehicle compatibility reasoning
      if (product.compatibleVehicles && sourceProduct.compatibleVehicles) {
        const commonVehicles = product.compatibleVehicles.filter(pv =>
          sourceProduct.compatibleVehicles.some(sv => sv.modelId?.toString() === pv.modelId?.toString())
        );
        if (commonVehicles.length > 0) {
          reasons.push(`Compatible with ${commonVehicles.length} common vehicle(s)`);
        }
      }

      // Price similarity reasoning
      if (product.price && sourceProduct.price) {
        const priceDiff = Math.abs(product.price - sourceProduct.price);
        const pricePercentDiff = (priceDiff / sourceProduct.price) * 100;
        if (pricePercentDiff <= 30) {
          reasons.push(`Similar price range`);
        }
      }

      // Cross-category complementary reasoning
      if (sourceProduct.category?.slug && product.categoryInfo?.slug) {
        const sourceSlug = sourceProduct.category.slug;
        const productSlug = product.categoryInfo.slug;
        const complementaryCategories = this.#CATEGORY_RELATIONSHIPS[sourceSlug] || [];
        
        if (complementaryCategories.includes(productSlug)) {
          reasons.push(`Complementary product`);
          score += this.#CATEGORY_WEIGHTS.COMPLEMENTARY; // Boost complementary products
        }
      }

      // Tag similarity reasoning
      if (product.tags && sourceProduct.tags) {
        const commonTags = product.tags.filter(tag => sourceProduct.tags.includes(tag));
        if (commonTags.length > 0) {
          reasons.push(`${commonTags.length} common feature(s)`);
        }
      }

      return {
        productId: product._id,
        score: Math.round(score * 10) / 10, // Round to 1 decimal place
        reason: reasons.length > 0 ? reasons.join(', ') : 'Similar product features',
        product: {
          name: product.name,
          price: product.price,
          images: product.images || [],
          category: product.category,
          brand: product.brand,
          compatibleVehicles: product.compatibleVehicles || [],
        },
      };
    }).sort((a, b) => b.score - a.score); // Sort by score descending
  }
}

export default new ContentBasedFilterService();
