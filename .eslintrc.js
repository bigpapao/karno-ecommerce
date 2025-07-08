module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
    jest: true,
  },
  extends: [
    'eslint:recommended',
  ],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: [
    'react',
    'import',
  ],
  rules: {
    // Relaxed rules to reduce errors
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    'react/jsx-filename-extension': 'off',
    'import/extensions': 'off',
    'import/prefer-default-export': 'off',
    'import/no-unresolved': 'off',
    'import/no-extraneous-dependencies': 'off',
    'no-underscore-dangle': 'off',
    'no-console': 'warn',
    'no-unused-vars': 'warn',
    'max-len': 'off',
    'no-param-reassign': 'off',
    'consistent-return': 'off',
    'no-await-in-loop': 'off',
    'no-plusplus': 'off',
    'no-prototype-builtins': 'off',
    'no-use-before-define': 'off',
    'no-case-declarations': 'off',
    'no-undef': 'warn',
    'no-useless-escape': 'off',
    'no-restricted-syntax': 'off',
    'no-shadow': 'off',
    // Additional common issues
    'prefer-const': 'warn',
    'no-var': 'warn',
    'no-duplicate-imports': 'warn',
    'no-unreachable': 'warn',
  },
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx']
      }
    },
    react: {
      version: 'detect',
    },
  },
  // Ignore common directories that cause issues
  ignorePatterns: [
    'node_modules/',
    'build/',
    'dist/',
    'coverage/',
    '*.min.js',
    'public/',
    'browser-tools-mcp/',
    'chrome-extension/',
  ],
  overrides: [
    {
      // Frontend specific rules
      files: ['karno/frontend/**/*.{js,jsx,ts,tsx}'],
      extends: [
        'react-app',
        'react-app/jest'
      ],
      rules: {
        'react/react-in-jsx-scope': 'off',
        'react/prop-types': 'off',
      }
    },
    {
      // Backend specific rules
      files: ['karno/backend/**/*.js'],
      env: {
        node: true,
        es2021: true,
      },
      rules: {
        'no-console': 'off',
        'import/extensions': 'off',
      }
    }
  ]
}; 