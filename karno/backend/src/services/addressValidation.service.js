/**
 * Address Validation Service
 *
 * This service handles the integration with third-party address validation APIs
 * to validate Iranian addresses and suggest corrections.
 *
 * Supported APIs:
 * - Google Address Validation API (for Iran)
 * - SmartyStreets API (optional fallback)
 *
 * Features:
 * - Iran address validation and verification
 * - Suggestions for auto-completion
 * - Geocoding (coordinates) for delivery routing
 * - Error handling and fallback mechanisms
 */

import axios from 'axios';
import config from '../config/config.js';
import { logger } from '../utils/logger.js';

// API configuration constants
const GOOGLE_API_KEY = config.googleApiKey;
const API_TIMEOUT = 5000; // 5 seconds timeout
const USE_FALLBACK = config.addressValidation?.useFallback || false;
const CACHE_DURATION = config.addressValidation?.cacheDuration || 3600000; // Default: 1 hour
const API_REGION = 'ir'; // Restrict to Iran region

// Simple in-memory cache
const addressCache = new Map();

/**
 * Validate an address using Google Address Validation API
 * Focused on Iranian addresses only
 *
 * @param {Object} addressData - The address data to validate
 * @returns {Promise<Object>} - Validation result
 */
export const validateAddress = async (addressData) => {
  try {
    // Always ensure country is Iran
    addressData.country = 'IR';

    // Format the address for cache key
    const cacheKey = formatAddressForCache(addressData);

    // Check cache first
    const cachedResult = checkCache(cacheKey);
    if (cachedResult) {
      logger.info('Address validation cache hit');
      return cachedResult;
    }

    // Prepare the address for Google API
    const formattedAddress = formatAddressForGoogle(addressData);

    // Call Google Address Validation API
    const result = await callGoogleValidationAPI(formattedAddress);

    // Process the validation result
    const validationResult = processValidationResult(result, addressData);

    // Cache the result
    cacheResult(cacheKey, validationResult);

    return validationResult;
  } catch (error) {
    logger.error('Address validation error:', error);

    // Try fallback service if enabled
    if (USE_FALLBACK) {
      try {
        return await fallbackValidation(addressData);
      } catch (fallbackError) {
        logger.error('Fallback validation error:', fallbackError);
        throw fallbackError;
      }
    }

    throw error;
  }
};

/**
 * Format the address data for cache key
 *
 * @param {Object} addressData - The address data
 * @returns {string} - Formatted cache key
 */
const formatAddressForCache = (addressData) => {
  const {
    address, city, state, zipCode,
  } = addressData;
  return `${address?.trim().toLowerCase()}_${city?.trim().toLowerCase()}_${state?.trim().toLowerCase()}_${zipCode?.trim()}`;
};

/**
 * Check if the address is in cache
 *
 * @param {string} cacheKey - The cache key
 * @returns {Object|null} - Cached result or null
 */
const checkCache = (cacheKey) => {
  if (!addressCache.has(cacheKey)) return null;

  const { timestamp, data } = addressCache.get(cacheKey);

  // Check if cache is still valid
  if (Date.now() - timestamp > CACHE_DURATION) {
    addressCache.delete(cacheKey);
    return null;
  }

  return data;
};

/**
 * Cache the validation result
 *
 * @param {string} cacheKey - The cache key
 * @param {Object} result - The validation result
 */
const cacheResult = (cacheKey, result) => {
  addressCache.set(cacheKey, {
    timestamp: Date.now(),
    data: result,
  });

  // Cleanup old cache entries periodically
  if (addressCache.size > 100) {
    cleanupCache();
  }
};

/**
 * Clean up expired cache entries
 */
const cleanupCache = () => {
  const now = Date.now();
  for (const [key, { timestamp }] of addressCache.entries()) {
    if (now - timestamp > CACHE_DURATION) {
      addressCache.delete(key);
    }
  }
};

/**
 * Format address data for Google API
 *
 * @param {Object} addressData - The address data
 * @returns {string} - Formatted address string
 */
const formatAddressForGoogle = (addressData) => {
  const {
    address, city, state, zipCode,
  } = addressData;

  // Format: street address, city, state/province, postal code, Iran
  let formattedAddress = '';

  if (address) formattedAddress += address;
  if (city) formattedAddress += formattedAddress ? `, ${city}` : city;
  if (state) formattedAddress += formattedAddress ? `, ${state}` : state;
  if (zipCode) formattedAddress += formattedAddress ? ` ${zipCode}` : zipCode;

  // Always add Iran as the country
  formattedAddress += formattedAddress ? ', ایران' : 'ایران';

  return formattedAddress;
};

/**
 * Call Google Address Validation API
 *
 * @param {string} formattedAddress - The formatted address string
 * @returns {Promise<Object>} - API response
 */
const callGoogleValidationAPI = async (formattedAddress) => {
  try {
    // Google Address Validation API endpoint
    const endpoint = 'https://addressvalidation.googleapis.com/v1:validateAddress';

    // Prepare request data
    const requestData = {
      address: {
        addressLines: [formattedAddress],
      },
      enableUspsCass: false,
      regionCode: 'IR', // Restrict to Iran
    };

    // Call the API
    const response = await axios.post(
      `${endpoint}?key=${GOOGLE_API_KEY}`,
      requestData,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: API_TIMEOUT,
      },
    );

    return response.data;
  } catch (error) {
    logger.error('Google API error:', error.message);
    throw new Error('Error validating address with Google API');
  }
};

/**
 * Process the validation result from Google API
 *
 * @param {Object} result - The API result
 * @param {Object} originalAddress - The original address data
 * @returns {Object} - Processed validation result
 */
const processValidationResult = (result, originalAddress) => {
  // Check if result has validation info
  if (!result || !result.result) {
    return {
      isValid: false,
      error: 'Invalid API response',
      originalAddress,
    };
  }

  const { address, verdict } = result.result;

  // Extract address components
  const components = address?.addressComponents || [];

  // Extract geocode
  const geocode = address?.postalAddress?.latitude && address?.postalAddress?.longitude
    ? {
      lat: address.postalAddress.latitude,
      lng: address.postalAddress.longitude,
    }
    : null;

  // Check if address is valid
  const isValid = verdict?.addressComplete || false;

  // Extract address suggestions
  let suggestion = null;

  if (!isValid && result.result?.address?.postalAddress) {
    const postal = result.result.address.postalAddress;

    // Extract relevant components for Iranian addresses
    suggestion = {
      streetNumber: postal.addressLines[0]?.split(' ')[0] || '',
      streetName: postal.addressLines[0]?.split(' ').slice(1).join(' ') || '',
      city: postal.locality || originalAddress.city,
      state: postal.administrativeArea || originalAddress.state,
      zipCode: postal.postalCode || originalAddress.zipCode,
    };
  }

  // Construct formatted address
  const formattedAddress = address?.formattedAddress || formatAddressForGoogle(originalAddress);

  return {
    isValid,
    originalAddress,
    formattedAddress,
    geocode,
    suggestion,
    missingComponentTypes: verdict?.missingComponentTypes || [],
    unresolvedTokens: verdict?.unresolvedTokens || [],
  };
};

/**
 * Fallback validation using a different service
 *
 * @param {Object} addressData - The address data
 * @returns {Promise<Object>} - Validation result
 */
const fallbackValidation = async (addressData) => {
  // Simple validation check for Iran addresses
  const {
    address, city, state, zipCode,
  } = addressData;

  // Check required fields
  const missingFields = [];

  if (!address || address.trim().length < 5) missingFields.push('address');
  if (!city || city.trim().length < 2) missingFields.push('city');
  if (!state) missingFields.push('state');

  // Validate Iran postal code (10 digits)
  const hasValidZipCode = zipCode && /^\d{10}$/.test(zipCode.replace(/\s/g, ''));
  if (!hasValidZipCode) missingFields.push('zipCode');

  // Consider valid if no missing fields
  const isValid = missingFields.length === 0;

  return {
    isValid,
    originalAddress: addressData,
    formattedAddress: formatAddressForGoogle(addressData),
    missingComponentTypes: missingFields,
    suggestion: null,
  };
};

/**
 * Validate if a city exists in Iran
 *
 * @param {string} city - City name
 * @param {string} state - State/province name
 * @returns {Promise<boolean>} - Whether the city exists
 */
export const validateCity = async (city, state) => {
  try {
    // Hard-coded list of major cities in Iran by province
    const iranCities = {
      تهران: ['تهران', 'شهریار', 'اسلامشهر', 'ری', 'پردیس', 'دماوند', 'ورامین', 'پاکدشت', 'رودهن'],
      اصفهان: ['اصفهان', 'کاشان', 'نجف‌آباد', 'خمینی‌شهر', 'شاهین‌شهر', 'آران و بیدگل', 'شهرضا'],
      فارس: ['شیراز', 'مرودشت', 'جهرم', 'فسا', 'کازرون', 'لار', 'آباده'],
      'خراسان رضوی': ['مشهد', 'نیشابور', 'سبزوار', 'تربت حیدریه', 'کاشمر', 'قوچان', 'تربت جام'],
      'آذربایجان شرقی': ['تبریز', 'مراغه', 'مرند', 'اهر', 'سراب', 'میانه', 'بناب'],
      'آذربایجان غربی': ['ارومیه', 'خوی', 'میاندوآب', 'مهاباد', 'بوکان', 'سلماس', 'پیرانشهر'],
      گیلان: ['رشت', 'انزلی', 'لاهیجان', 'آستارا', 'تالش', 'رودسر', 'لنگرود'],
      مازندران: ['ساری', 'بابل', 'آمل', 'چالوس', 'بهشهر', 'نوشهر', 'تنکابن', 'رامسر'],
      کرمان: ['کرمان', 'سیرجان', 'رفسنجان', 'جیرفت', 'بم', 'زرند', 'کهنوج'],
      خوزستان: ['اهواز', 'آبادان', 'دزفول', 'خرمشهر', 'اندیمشک', 'بندر ماهشهر', 'بهبهان'],
      البرز: ['کرج', 'نظرآباد', 'محمد شهر', 'فردیس', 'هشتگرد', 'اشتهارد'],
    };

    // Check if state exists
    if (!state || !iranCities[state]) {
      return false;
    }

    // Check if city exists in state
    return iranCities[state].includes(city);
  } catch (error) {
    logger.error('City validation error:', error);
    return true; // Default to true on error
  }
};

/**
 * Check if same-day delivery is available for the address
 *
 * @param {Object} addressData - The address data
 * @returns {boolean} - Whether same-day delivery is available
 */
export const checkSameDayDelivery = (addressData) => {
  const { city, state } = addressData;

  // List of cities with same-day delivery
  const sameDayCities = [
    { city: 'تهران', state: 'تهران' },
    { city: 'کرج', state: 'البرز' },
    { city: 'اصفهان', state: 'اصفهان' },
    { city: 'شیراز', state: 'فارس' },
    { city: 'مشهد', state: 'خراسان رضوی' },
    { city: 'تبریز', state: 'آذربایجان شرقی' },
  ];

  return sameDayCities.some((c) => c.city.toLowerCase() === city?.toLowerCase()
    && c.state.toLowerCase() === state?.toLowerCase());
};

export default {
  validateAddress,
  validateCity,
  checkSameDayDelivery,
};
