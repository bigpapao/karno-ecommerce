import mongoose from 'mongoose';
import User from './user.model.js';
import Product from './product.model.js';
import Cart from './cart.model.js';
import Category from './category.model.js';
import Brand from './brand.model.js';
import Order from './order.model.js';
import PhoneVerification from './phoneVerification.model.js';
import VehicleModel from './VehicleModel.js';
import Manufacturer from './Manufacturer.js';
import CompatibilityRule from './CompatibilityRule.js';
import Event from './recommendation/event.model.js';
import Recommendation from './recommendation/recommendation.model.js';

// Analytics Models
import AnalyticsEvent from './analytics/analytics-event.model.js';
import UsageStats from './analytics/usage-stats.model.js';

export {
  mongoose,
  User,
  Product,
  Cart,
  Category,
  Brand,
  Order,
  PhoneVerification,
  VehicleModel,
  Manufacturer,
  CompatibilityRule,
  Event,
  Recommendation,
  AnalyticsEvent,
  UsageStats
};
