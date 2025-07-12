module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true,
  },
  extends: [
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    // Backend-specific relaxed rules
    'no-console': 'off', // Console is fine in backend
    'no-unused-vars': 'warn',
    'no-undef': 'warn',
    'no-underscore-dangle': 'off', // MongoDB _id is common
    'import/extensions': 'off',
    'import/prefer-default-export': 'off',
    'consistent-return': 'off',
    'no-await-in-loop': 'off',
    'no-param-reassign': 'off',
    'no-use-before-define': 'off',
    'no-shadow': 'off',
    'prefer-const': 'warn',
    'no-var': 'warn',
  },
  ignorePatterns: [
    'node_modules/',
    'tests/',
    'coverage/',
    '*.config.js',
    'public/uploads/'
  ]
}; 