/**
 * Pricing Service for cart calculations
 * Handles cart price calculations, discounts, promotions, etc.
 */

/**
 * Calculate cart totals including possible discounts
 * @param {Array} items - Cart items
 * @param {Object} options - Calculation options
 * @returns {Object} - Calculation results
 */
export const calculateCartPricing = (items, options = {}) => {
  const {
    applyDiscounts = true,
    bulkDiscount = true,
    promoCode = null,
  } = options;

  // Initialize calculation result
  const result = {
    subtotal: 0,
    discount: 0,
    tax: 0,
    shipping: 0,
    total: 0,
    totalItems: 0,
    discountDetails: [],
  };

  // Sum the base prices (without discounts)
  items.forEach((item) => {
    result.subtotal += item.price * item.quantity;
    result.totalItems += item.quantity;
  });

  // Apply bulk discounts (e.g., 10% off when buying 5+ of the same item)
  if (applyDiscounts && bulkDiscount) {
    items.forEach((item) => {
      if (item.quantity >= 5) {
        const itemDiscount = (item.price * item.quantity) * 0.1; // 10% discount
        result.discount += itemDiscount;
        result.discountDetails.push({
          type: 'BULK_DISCOUNT',
          itemId: item._id,
          amount: itemDiscount,
          description: `10% off for buying 5+ of ${item.name}`,
        });
      }
    });
  }

  // Apply promo code discount
  if (applyDiscounts && promoCode) {
    // Here we'd check the promo code against a database and apply the appropriate discount
    // For this example, we'll just add a 15% discount if promo code is "WELCOME15"
    if (promoCode === 'WELCOME15') {
      const promoDiscount = result.subtotal * 0.15;
      result.discount += promoDiscount;
      result.discountDetails.push({
        type: 'PROMO_CODE',
        code: promoCode,
        amount: promoDiscount,
        description: '15% off with WELCOME15 promo code',
      });
    }
  }

  // Calculate shipping (simplified example)
  // Free shipping over 1,000,000 IRR, otherwise 200,000 IRR
  result.shipping = result.subtotal > 1000000 ? 0 : 200000;

  // Calculate tax (simplified example - 9% VAT)
  const taxRate = 0.09;
  result.tax = (result.subtotal - result.discount) * taxRate;

  // Calculate final total
  result.total = (result.subtotal - result.discount) + result.tax + result.shipping;

  return result;
};

/**
 * Apply promotion to cart
 * @param {string} promoCode - Promotion code
 * @returns {Object|null} - Promotion details if valid, null otherwise
 */
export const validatePromoCode = async (promoCode) => {
  // In a real app, we would validate against a database
  // For this example, we'll hardcode some valid promo codes
  const validPromoCodes = {
    WELCOME15: {
      code: 'WELCOME15',
      type: 'PERCENTAGE',
      value: 15,
      description: '15% off your order',
      minOrderValue: 500000, // 500,000 IRR minimum
      expiryDate: new Date('2023-12-31'),
    },
    FREESHIPPING: {
      code: 'FREESHIPPING',
      type: 'FREE_SHIPPING',
      description: 'Free shipping on your order',
      minOrderValue: 800000, // 800,000 IRR minimum
      expiryDate: new Date('2023-12-31'),
    },
    BUNDLE25: {
      code: 'BUNDLE25',
      type: 'PERCENTAGE',
      value: 25,
      description: '25% off when ordering car parts bundle',
      minOrderValue: 1500000, // 1,500,000 IRR minimum
      expiryDate: new Date('2023-12-31'),
      requiredCategories: ['Brakes', 'Oil', 'Filters'], // Must have items from these categories
      requiredCategoryCount: 3, // Must have items from all 3 categories
    },
  };

  const promo = validPromoCodes[promoCode];

  if (!promo) {
    return null;
  }

  // Check if promo is expired
  if (promo.expiryDate && promo.expiryDate < new Date()) {
    return {
      valid: false,
      code: promoCode,
      error: 'Promotion has expired',
    };
  }

  return {
    valid: true,
    ...promo,
  };
};

/**
 * Apply promo code to cart
 * @param {Object} cart - Cart object with items
 * @param {string} promoCode - Promotion code to apply
 * @returns {Object} - Updated cart pricing with promo applied
 */
export const applyPromoCodeToCart = async (cart, promoCode) => {
  const promo = await validatePromoCode(promoCode);

  if (!promo || !promo.valid) {
    return {
      success: false,
      message: promo ? promo.error : 'Invalid promotion code',
      pricing: calculateCartPricing(cart.items),
    };
  }

  // Calculate subtotal to check minimum order value
  const subtotal = cart.items.reduce((total, item) => total + item.price * item.quantity, 0);

  if (promo.minOrderValue && subtotal < promo.minOrderValue) {
    return {
      success: false,
      message: `Order must be at least ${promo.minOrderValue.toLocaleString()} IRR to use this code`,
      pricing: calculateCartPricing(cart.items),
    };
  }

  // Check for required categories if applicable
  if (promo.requiredCategories && promo.requiredCategories.length > 0) {
    // In a real app, we would check item categories from the database
    // For this example, we'll assume category data is included with items
    // This would require populating product data when returning the cart

    // This is simplified logic - in a real app, you would fetch category data
    const uniqueCategories = new Set();
    cart.items.forEach((item) => {
      if (item.category && promo.requiredCategories.includes(item.category)) {
        uniqueCategories.add(item.category);
      }
    });

    if (uniqueCategories.size < promo.requiredCategoryCount) {
      return {
        success: false,
        message: `This promotion requires items from ${promo.requiredCategoryCount} different categories: ${promo.requiredCategories.join(', ')}`,
        pricing: calculateCartPricing(cart.items),
      };
    }
  }

  // Calculate cart pricing with promo code
  const pricing = calculateCartPricing(cart.items, {
    applyDiscounts: true,
    bulkDiscount: true,
    promoCode,
  });

  return {
    success: true,
    message: `Promotion code '${promoCode}' applied successfully`,
    pricing,
    promoDetails: promo,
  };
};
