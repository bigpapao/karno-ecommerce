/**
 * Address and Shipping Form Fields Schema and Validation Rules
 *
 * This file defines all form fields, data types, and validation rules for
 * collecting address and shipping information during checkout.
 */

import Joi from 'joi';

/**
 * Address form fields definition with validation rules
 */
export const addressFormFields = [
  {
    name: 'fullName',
    label: 'Full Name',
    type: 'text',
    required: true,
    minLength: 3,
    maxLength: 100,
    placeholder: 'Enter your full name',
    errorMessages: {
      required: 'Full name is required',
      minLength: 'Full name must be at least 3 characters',
      maxLength: 'Full name cannot exceed 100 characters',
      pattern: 'Full name can only contain letters, spaces, and hyphens',
    },
    pattern: /^[A-Za-z\s\-]+$/,
    sanitizer: (value) => value.trim(),
  },
  {
    name: 'phoneNumber',
    label: 'Phone Number',
    type: 'tel',
    required: true,
    placeholder: 'Enter your phone number',
    errorMessages: {
      required: 'Phone number is required',
      pattern: 'Invalid phone number format. Please enter an Iranian phone number',
    },
    pattern: /^(0?9\d{9})$/,
    sanitizer: (value) => {
      if (!value) return value;
      // Remove any non-digit characters
      let phone = value.toString().replace(/\D/g, '');
      // Remove leading zero or country code if present
      if (phone.startsWith('98')) {
        phone = phone.substring(2);
      } else if (phone.startsWith('0')) {
        phone = phone.substring(1);
      }
      return phone;
    },
  },
  {
    name: 'address',
    label: 'Street Address',
    type: 'text',
    required: true,
    minLength: 5,
    maxLength: 200,
    placeholder: 'Enter your street address',
    errorMessages: {
      required: 'Street address is required',
      minLength: 'Street address must be at least 5 characters',
      maxLength: 'Street address cannot exceed 200 characters',
    },
    sanitizer: (value) => value.trim(),
  },
  {
    name: 'city',
    label: 'City',
    type: 'text',
    required: true,
    minLength: 2,
    maxLength: 100,
    placeholder: 'Enter your city',
    errorMessages: {
      required: 'City is required',
      minLength: 'City must be at least 2 characters',
      maxLength: 'City cannot exceed 100 characters',
      pattern: 'City can only contain letters, spaces, and hyphens',
    },
    pattern: /^[A-Za-z\s\-]+$/,
    sanitizer: (value) => value.trim(),
  },
  {
    name: 'state',
    label: 'State/Province',
    type: 'text',
    required: true,
    minLength: 2,
    maxLength: 100,
    placeholder: 'Enter your state or province',
    errorMessages: {
      required: 'State/Province is required',
      minLength: 'State/Province must be at least 2 characters',
      maxLength: 'State/Province cannot exceed 100 characters',
      pattern: 'State/Province can only contain letters, spaces, and hyphens',
    },
    pattern: /^[A-Za-z\s\-]+$/,
    sanitizer: (value) => value.trim(),
  },
  {
    name: 'zipCode',
    label: 'Postal/ZIP Code',
    type: 'text',
    required: true,
    minLength: 5,
    maxLength: 10,
    placeholder: 'Enter your postal code',
    errorMessages: {
      required: 'Postal/ZIP code is required',
      minLength: 'Postal/ZIP code must be at least 5 characters',
      maxLength: 'Postal/ZIP code cannot exceed 10 characters',
      pattern: 'Postal/ZIP code can only contain numbers and hyphens',
    },
    pattern: /^[\d\-]+$/,
    sanitizer: (value) => value.trim(),
  },
  {
    name: 'country',
    label: 'Country',
    type: 'select',
    required: true,
    placeholder: 'Select your country',
    errorMessages: {
      required: 'Country is required',
    },
    options: [
      { value: 'IR', label: 'Iran' },
      { value: 'AE', label: 'United Arab Emirates' },
      { value: 'TR', label: 'Turkey' },
      { value: 'IQ', label: 'Iraq' },
      { value: 'QA', label: 'Qatar' },
      { value: 'OM', label: 'Oman' },
      { value: 'KW', label: 'Kuwait' },
      { value: 'SA', label: 'Saudi Arabia' },
      { value: 'AF', label: 'Afghanistan' },
    ],
    sanitizer: (value) => value.trim(),
  },
  {
    name: 'addressType',
    label: 'Address Type',
    type: 'radio',
    required: true,
    errorMessages: {
      required: 'Address type is required',
    },
    options: [
      { value: 'home', label: 'Home' },
      { value: 'work', label: 'Work' },
      { value: 'other', label: 'Other' },
    ],
    defaultValue: 'home',
  },
  {
    name: 'isDefaultAddress',
    label: 'Set as default address',
    type: 'checkbox',
    required: false,
    defaultValue: false,
  },
  {
    name: 'additionalInfo',
    label: 'Additional Information',
    type: 'textarea',
    required: false,
    maxLength: 500,
    placeholder: 'Additional delivery instructions or notes',
    errorMessages: {
      maxLength: 'Additional information cannot exceed 500 characters',
    },
    sanitizer: (value) => (value ? value.trim() : ''),
  },
];

/**
 * Shipping options definition
 */
export const shippingOptions = [
  {
    id: 'standard',
    name: 'Standard Shipping',
    description: 'Delivery in 3-5 business days',
    price: 200000, // 200,000 IRR
    estimatedDelivery: '3-5 business days',
    default: true,
  },
  {
    id: 'express',
    name: 'Express Shipping',
    description: 'Delivery in 1-2 business days',
    price: 400000, // 400,000 IRR
    estimatedDelivery: '1-2 business days',
    default: false,
  },
  {
    id: 'same_day',
    name: 'Same Day Delivery',
    description: 'Order before 12 PM for delivery today (selected cities only)',
    price: 600000, // 600,000 IRR
    estimatedDelivery: 'Same day (if ordered before 12 PM)',
    default: false,
    restrictedTo: ['Tehran', 'Isfahan', 'Shiraz', 'Mashhad', 'Tabriz'],
  },
];

/**
 * Joi validation schema for address form
 */
export const addressValidationSchema = Joi.object({
  fullName: Joi.string()
    .pattern(/^[A-Za-z\s\-]+$/)
    .min(3)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Full name is required',
      'string.min': 'Full name must be at least {#limit} characters',
      'string.max': 'Full name cannot exceed {#limit} characters',
      'string.pattern.base': 'Full name can only contain letters, spaces, and hyphens',
    }),

  phoneNumber: Joi.string()
    .pattern(/^(0?9\d{9})$/)
    .required()
    .messages({
      'string.empty': 'Phone number is required',
      'string.pattern.base': 'Invalid phone number format. Please enter an Iranian phone number',
    }),

  address: Joi.string()
    .min(5)
    .max(200)
    .required()
    .messages({
      'string.empty': 'Street address is required',
      'string.min': 'Street address must be at least {#limit} characters',
      'string.max': 'Street address cannot exceed {#limit} characters',
    }),

  city: Joi.string()
    .pattern(/^[A-Za-z\s\-]+$/)
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.empty': 'City is required',
      'string.min': 'City must be at least {#limit} characters',
      'string.max': 'City cannot exceed {#limit} characters',
      'string.pattern.base': 'City can only contain letters, spaces, and hyphens',
    }),

  state: Joi.string()
    .pattern(/^[A-Za-z\s\-]+$/)
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.empty': 'State/Province is required',
      'string.min': 'State/Province must be at least {#limit} characters',
      'string.max': 'State/Province cannot exceed {#limit} characters',
      'string.pattern.base': 'State/Province can only contain letters, spaces, and hyphens',
    }),

  zipCode: Joi.string()
    .pattern(/^[\d\-]+$/)
    .min(5)
    .max(10)
    .required()
    .messages({
      'string.empty': 'Postal/ZIP code is required',
      'string.min': 'Postal/ZIP code must be at least {#limit} characters',
      'string.max': 'Postal/ZIP code cannot exceed {#limit} characters',
      'string.pattern.base': 'Postal/ZIP code can only contain numbers and hyphens',
    }),

  country: Joi.string()
    .required()
    .messages({
      'string.empty': 'Country is required',
    }),

  addressType: Joi.string()
    .valid('home', 'work', 'other')
    .required()
    .messages({
      'string.empty': 'Address type is required',
      'any.only': 'Address type must be one of: home, work, or other',
    }),

  isDefaultAddress: Joi.boolean()
    .default(false),

  additionalInfo: Joi.string()
    .allow('')
    .max(500)
    .messages({
      'string.max': 'Additional information cannot exceed {#limit} characters',
    }),

  shippingOption: Joi.string()
    .valid('standard', 'express', 'same_day')
    .required()
    .messages({
      'string.empty': 'Shipping option is required',
      'any.only': 'Shipping option must be one of: standard, express, or same_day',
    }),
});

/**
 * Validate address data against schema
 * @param {Object} data - Address form data to validate
 * @returns {Object} - Validation result with error or value
 */
export const validateAddressData = (data) => addressValidationSchema.validate(data, { abortEarly: false });

/**
 * Sanitize address data to prevent XSS and injection attacks
 * @param {Object} data - Address form data to sanitize
 * @returns {Object} - Sanitized data
 */
export const sanitizeAddressData = (data) => {
  const sanitizedData = { ...data };
  const strFields = ['fullName', 'phoneNumber', 'address', 'city', 'state', 'zipCode', 'country', 'additionalInfo'];

  // Sanitize string fields
  strFields.forEach((field) => {
    if (sanitizedData[field]) {
      if (typeof sanitizedData[field] === 'string') {
        // Basic sanitization: trim whitespace and remove script tags
        sanitizedData[field] = sanitizedData[field]
          .trim()
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      }
    }
  });

  // Apply field-specific sanitizers from addressFormFields
  addressFormFields.forEach((field) => {
    if (field.sanitizer && sanitizedData[field.name]) {
      sanitizedData[field.name] = field.sanitizer(sanitizedData[field.name]);
    }
  });

  return sanitizedData;
};
