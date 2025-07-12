// Simplified config-overrides.js to avoid build conflicts
const { override } = require('customize-cra');

module.exports = override(
  // Minimal configuration to avoid conflicts
  (config) => {
    // Only essential webpack modifications
    
    // Exclude source maps from node_modules to prevent warnings
    const sourceMapRule = config.module.rules.find(
      rule => rule.enforce === 'pre' && rule.use && rule.use.some &&
        rule.use.some(use => use.loader && use.loader.includes('source-map-loader'))
    );

    if (sourceMapRule) {
      sourceMapRule.exclude = [
        /node_modules/,
        /\.worker\.js$/,
      ];
    }

    // Add ignore warnings configuration
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      /Failed to parse source map/,
      /Critical dependency: the request of a dependency is an expression/,
      /Module not found: Error: Can't resolve/,
    ];

    return config;
  }
);