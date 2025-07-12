module.exports = {
  extends: [
    'react-app',
    'react-app/jest'
  ],
  rules: {
    // Relaxed rules for development
    'no-unused-vars': 'warn',
    'no-console': 'warn',
    'react/prop-types': 'off',
    'react/react-in-jsx-scope': 'off',
    'import/no-anonymous-default-export': 'off',
    'jsx-a11y/anchor-is-valid': 'off',
    'no-undef': 'warn',
  },
  ignorePatterns: [
    'build/',
    'public/',
    'node_modules/',
    '*.config.js',
    'craco.config.js',
    'config-overrides.js'
  ]
}; 