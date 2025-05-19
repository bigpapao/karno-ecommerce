import { handleError } from '../utils/errorHandler.js';

export const validateProduct = (req, res, next) => {
  const {
    name, description, price, category, brand, sku,
  } = req.body;

  if (!name) {
    return next(handleError(400, 'Product name is required'));
  }

  if (!description) {
    return next(handleError(400, 'Product description is required'));
  }

  if (!price || price < 0) {
    return next(handleError(400, 'Valid product price is required'));
  }

  if (!category) {
    return next(handleError(400, 'Product category is required'));
  }

  if (!brand) {
    return next(handleError(400, 'Product brand is required'));
  }

  if (!sku) {
    return next(handleError(400, 'Product SKU is required'));
  }

  next();
};

export const validateOrder = (req, res, next) => {
  const { shippingAddress, paymentMethod } = req.body;

  if (!shippingAddress) {
    return next(handleError(400, 'Shipping address is required'));
  }

  const {
    fullName, address, city, state, zipCode, country, phone,
  } = shippingAddress;

  if (!fullName) {
    return next(handleError(400, 'Full name is required'));
  }

  if (!address) {
    return next(handleError(400, 'Address is required'));
  }

  if (!city) {
    return next(handleError(400, 'City is required'));
  }

  if (!state) {
    return next(handleError(400, 'State is required'));
  }

  if (!zipCode) {
    return next(handleError(400, 'ZIP code is required'));
  }

  if (!country) {
    return next(handleError(400, 'Country is required'));
  }

  if (!phone) {
    return next(handleError(400, 'Phone number is required'));
  }

  if (!paymentMethod) {
    return next(handleError(400, 'Payment method is required'));
  }

  const validPaymentMethods = ['stripe', 'paypal', 'credit_card'];
  if (!validPaymentMethods.includes(paymentMethod)) {
    return next(handleError(400, 'Invalid payment method. Must be one of: stripe, paypal, credit_card'));
  }

  next();
};
