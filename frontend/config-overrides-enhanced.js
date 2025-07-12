// Enhanced config-overrides.js with advanced optimizations
const { override, addBabelPlugin, addWebpackPlugin, addWebpackModuleRule } = require('customize-cra');
const CompressionPlugin = require('compression-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

module.exports = override(
  // Add babel plugins for optimization
  addBabelPlugin([
    'babel-plugin-transform-react-remove-prop-types',
    {
      removeImport: true,
      ignoreFilenames: ['node_modules'],
    },
  ]),

  // Tree shaking optimization for Material-UI
  addBabelPlugin([
    'babel-plugin-import',
    {
      libraryName: '@mui/material',
      libraryDirectory: '',
      camel2DashComponentName: false,
    },
    'core',
  ]),

  addBabelPlugin([
    'babel-plugin-import',
    {
      libraryName: '@mui/icons-material',
      libraryDirectory: '',
      camel2DashComponentName: false,
    },
    'icons',
  ]),

  // Enhanced compression with multiple algorithms
  addWebpackPlugin(
    new CompressionPlugin({
      algorithm: 'gzip',
      test: /\.(js|css|html|svg)$/,
      threshold: 8192, // 8KB threshold
      minRatio: 0.8,
      deleteOriginalAssets: false,
    })
  ),

  // Brotli compression for modern browsers
  addWebpackPlugin(
    new CompressionPlugin({
      filename: '[path][base].br',
      algorithm: 'brotliCompress',
      test: /\.(js|css|html|svg)$/,
      compressionOptions: {
        level: 11,
      },
      threshold: 10240,
      minRatio: 0.8,
      deleteOriginalAssets: false,
    })
  ),

  // Bundle analyzer
  process.env.GENERATE_BUNDLE_REPORT === 'true' &&
    addWebpackPlugin(
      new BundleAnalyzerPlugin({
        analyzerMode: 'static',
        reportFilename: 'bundle-report.html',
        openAnalyzer: false,
        generateStatsFile: true,
        statsFilename: 'bundle-stats.json',
        logLevel: 'info',
      })
    ),

  // Enhanced image optimization rule
  addWebpackModuleRule({
    test: /\.(jpe?g|png|gif)$/i,
    use: [
      {
        loader: 'file-loader',
        options: {
          name: 'static/media/[name].[hash:8].[ext]',
        },
      },
      {
        loader: 'image-webpack-loader',
        options: {
          mozjpeg: {
            progressive: true,
            quality: 75,
          },
          optipng: {
            enabled: true,
            optimizationLevel: 7,
          },
          pngquant: {
            quality: [0.65, 0.90],
            speed: 4,
          },
          gifsicle: {
            interlaced: false,
            optimizationLevel: 3,
          },
          webp: {
            quality: 75,
          },
          svgo: {
            plugins: [
              {
                name: 'removeViewBox',
                active: false,
              },
              {
                name: 'removeEmptyAttrs',
                active: true,
              },
            ],
          },
        },
      },
    ],
  }),

  // Custom webpack config function with advanced optimizations
  (config) => {
    // Production-only optimizations
    if (process.env.NODE_ENV === 'production') {
      // Enhanced chunk splitting strategy
      config.optimization = {
        ...config.optimization,
        
        // Advanced code splitting
        splitChunks: {
          chunks: 'all',
          maxInitialRequests: 25,
          maxAsyncRequests: 25,
          minSize: 20000,
          maxSize: 244000,
          cacheGroups: {
            // Framework chunk (React, ReactDOM)
            framework: {
              chunks: 'all',
              name: 'framework',
              test: /(?:react|react-dom)/,
              priority: 40,
              enforce: true,
            },
            
            // Material-UI chunk
            mui: {
              name: 'mui',
              test: /[\\/]node_modules[\\/]@mui[\\/]/,
              priority: 30,
              enforce: true,
            },
            
            // Animation libraries
            animations: {
              name: 'animations',
              test: /[\\/]node_modules[\\/](framer-motion|react-spring|lottie-react)[\\/]/,
              priority: 25,
              enforce: true,
            },
            
            // Utilities and helpers
            utils: {
              name: 'utils',
              test: /[\\/]node_modules[\\/](axios|lodash|date-fns|uuid)[\\/]/,
              priority: 20,
              enforce: true,
            },
            
            // Common vendor libraries
            vendor: {
              name: 'vendor',
              test: /[\\/]node_modules[\\/]/,
              priority: 10,
              enforce: true,
            },
            
            // Common components
            common: {
              name: 'common',
              minChunks: 2,
              priority: 5,
              reuseExistingChunk: true,
              enforce: true,
            },
          },
        },
        
        // Optimize module IDs
        moduleIds: 'deterministic',
        
        // Single runtime chunk
        runtimeChunk: {
          name: 'runtime',
        },
      };

      // Enable advanced tree shaking
      config.resolve.mainFields = ['es2015', 'module', 'main'];
      
      // Optimize resolve
      config.resolve.alias = {
        ...config.resolve.alias,
        // React optimizations
        'react-dom$': 'react-dom/profiling',
        'scheduler/tracing': 'scheduler/tracing-profiling',
      };

      // Add performance hints
      config.performance = {
        hints: 'warning',
        maxEntrypointSize: 512000, // 500KB
        maxAssetSize: 512000, // 500KB
        assetFilter: function (assetFilename) {
          return assetFilename.endsWith('.js') || assetFilename.endsWith('.css');
        },
      };
    }

    // Development optimizations
    if (process.env.NODE_ENV === 'development') {
      // Faster source maps
      config.devtool = 'eval-cheap-module-source-map';
      
      // Optimize module resolution for faster rebuilds
      config.resolve.cacheWithContext = false;
      
      // Enable module hot replacement optimization
      config.optimization.moduleIds = 'named';
      config.optimization.chunkIds = 'named';
    }

    // Universal optimizations
    
    // Exclude source maps from node_modules
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

    // Optimize font loading
    config.module.rules.push({
      test: /\.(woff|woff2|eot|ttf|otf)$/,
      use: [
        {
          loader: 'file-loader',
          options: {
            name: 'static/fonts/[name].[hash:8].[ext]',
            publicPath: '/',
          },
        },
      ],
    });

    return config;
  }
); 