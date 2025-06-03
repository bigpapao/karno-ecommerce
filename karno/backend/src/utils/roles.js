/**
 * Role and Permission Management System
 *
 * This module defines the roles and permissions used in the application.
 * It also provides utility functions for checking role permissions.
 */

// Available roles in the system
export const ROLES = {
  USER: 'user', // Regular user with limited access
  ADMIN: 'admin', // Administrator with full access
};

// Available permissions in the system, categorized by resource
export const PERMISSIONS = {
  // User resource permissions
  USERS: {
    READ_ALL: 'read:users', // Can view all users
    READ_OWN: 'read:own-profile', // Can view own profile
    CREATE: 'create:users', // Can create users
    UPDATE_ALL: 'update:users', // Can update any user
    UPDATE_OWN: 'update:own-profile', // Can update own profile
    DELETE: 'delete:users', // Can delete users
  },

  // Product resource permissions
  PRODUCTS: {
    READ: 'read:products', // Can view products
    CREATE: 'create:products', // Can create products
    UPDATE: 'update:products', // Can update products
    DELETE: 'delete:products', // Can delete products
  },

  // Order resource permissions
  ORDERS: {
    READ_ALL: 'read:orders', // Can view all orders
    READ_OWN: 'read:own-orders', // Can view own orders
    CREATE: 'create:orders', // Can create orders
    UPDATE_ALL: 'update:orders', // Can update any order
    UPDATE_OWN: 'update:own-orders', // Can update own orders
    DELETE: 'delete:orders', // Can delete orders
  },

  // Category resource permissions
  CATEGORIES: {
    READ: 'read:categories', // Can view categories
    CREATE: 'create:categories', // Can create categories
    UPDATE: 'update:categories', // Can update categories
    DELETE: 'delete:categories', // Can delete categories
  },

  // Analytics permissions
  ANALYTICS: {
    DASHBOARD: 'read:dashboard', // Can view dashboard data
    REPORTS: 'read:analytics', // Can view analytical reports
  },
};

// Define permissions for each role
export const ROLE_PERMISSIONS = {
  // Regular user permissions
  [ROLES.USER]: [
    // User permissions
    PERMISSIONS.USERS.READ_OWN,
    PERMISSIONS.USERS.UPDATE_OWN,

    // Product permissions
    PERMISSIONS.PRODUCTS.READ,

    // Order permissions
    PERMISSIONS.ORDERS.READ_OWN,
    PERMISSIONS.ORDERS.CREATE,
    PERMISSIONS.ORDERS.UPDATE_OWN,

    // Category permissions
    PERMISSIONS.CATEGORIES.READ,
  ],

  // Admin permissions (has all permissions)
  [ROLES.ADMIN]: [
    // User permissions
    PERMISSIONS.USERS.READ_ALL,
    PERMISSIONS.USERS.READ_OWN,
    PERMISSIONS.USERS.CREATE,
    PERMISSIONS.USERS.UPDATE_ALL,
    PERMISSIONS.USERS.UPDATE_OWN,
    PERMISSIONS.USERS.DELETE,

    // Product permissions
    PERMISSIONS.PRODUCTS.READ,
    PERMISSIONS.PRODUCTS.CREATE,
    PERMISSIONS.PRODUCTS.UPDATE,
    PERMISSIONS.PRODUCTS.DELETE,

    // Order permissions
    PERMISSIONS.ORDERS.READ_ALL,
    PERMISSIONS.ORDERS.READ_OWN,
    PERMISSIONS.ORDERS.CREATE,
    PERMISSIONS.ORDERS.UPDATE_ALL,
    PERMISSIONS.ORDERS.UPDATE_OWN,
    PERMISSIONS.ORDERS.DELETE,

    // Category permissions
    PERMISSIONS.CATEGORIES.READ,
    PERMISSIONS.CATEGORIES.CREATE,
    PERMISSIONS.CATEGORIES.UPDATE,
    PERMISSIONS.CATEGORIES.DELETE,

    // Analytics permissions
    PERMISSIONS.ANALYTICS.DASHBOARD,
    PERMISSIONS.ANALYTICS.REPORTS,
  ],
};

/**
 * Check if a role has specific permissions
 *
 * @param {string} role - The role to check
 * @param {Array<string>} permissions - Array of permission codes to check
 * @returns {boolean} True if the role has all the specified permissions
 */
export const hasPermissions = (role, permissions) => {
  if (!ROLE_PERMISSIONS[role]) {
    return false;
  }

  return permissions.every((permission) => ROLE_PERMISSIONS[role].includes(permission));
};

/**
 * Get all permissions for a role
 *
 * @param {string} role - The role to get permissions for
 * @returns {Array<string>} Array of permission codes for the role
 */
export const getPermissionsForRole = (role) => ROLE_PERMISSIONS[role] || [];

/**
 * Check if a role has access to a specific resource and action
 *
 * @param {string} role - The role to check
 * @param {string} resource - The resource category (e.g., 'USERS', 'PRODUCTS')
 * @param {string} action - The action on the resource (e.g., 'READ', 'CREATE')
 * @returns {boolean} True if the role has permission for the action on the resource
 */
export const canAccess = (role, resource, action) => {
  if (!PERMISSIONS[resource] || !PERMISSIONS[resource][action]) {
    return false;
  }

  const permission = PERMISSIONS[resource][action];
  return hasPermissions(role, [permission]);
};
