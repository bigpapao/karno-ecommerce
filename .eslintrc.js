module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
    jest: true,
  },
  extends: [
    'airbnb',
    'airbnb/hooks',
    'plugin:react/recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
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
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    'react/jsx-filename-extension': [1, { extensions: ['.js', '.jsx'] }],
    'import/extensions': 'off',
    'import/prefer-default-export': 'off',
    'no-underscore-dangle': ['error', { allow: ['_id'] }],
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'max-len': ['error', { code: 120, ignoreComments: true, ignoreStrings: true }],
    'no-param-reassign': ['error', { props: false }],
    'consistent-return': 'off',
    'no-await-in-loop': 'off',
    'no-plusplus': 'off',
    'no-prototype-builtins': 'off',
    'no-use-before-define': ['error', { functions: false }],
    'no-case-declarations': 'off',
    'no-undef': process.env.NODE_ENV === 'test' ? 'off' : 'error',
  },
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.jsx']
      }
    },
    react: {
      version: 'detect',
    },
  },
}; 