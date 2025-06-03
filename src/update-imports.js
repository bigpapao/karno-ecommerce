/**
 * Script to update import paths in all files
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory path
// eslint-disable-next-line no-underscore-dangle
const __filename = fileURLToPath(import.meta.url);
// eslint-disable-next-line no-underscore-dangle
const __dirname = path.dirname(__filename);

// Define the replacements to make
const replacements = [
  {
    from: /from ['"]\.\.\/middleware\/errorHandler\.js['"]/g,
    to: 'from \'../middleware/error-handler.middleware.js\'',
  },
  {
    from: /from ['"]\.\/errorHandler\.js['"]/g,
    to: 'from \'./error-handler.middleware.js\'',
  },
  {
    from: /from ['"]\.\.\/middleware\/rateLimit\.middleware\.js['"]/g,
    to: 'from \'../middleware/rate-limit.middleware.js\'',
  },
  {
    from: /from ['"]\.\/rateLimit\.middleware\.js['"]/g,
    to: 'from \'./rate-limit.middleware.js\'',
  },
  {
    from: /from ['"]\.\.\/middleware\/queryMonitor\.js['"]/g,
    to: 'from \'../middleware/query-monitor.middleware.js\'',
  },
  {
    from: /from ['"]\.\/queryMonitor\.js['"]/g,
    to: 'from \'./query-monitor.middleware.js\'',
  },
  {
    from: /from ['"]\.\.\/middleware\/checkoutMiddleware\.js['"]/g,
    to: 'from \'../middleware/checkout.middleware.js\'',
  },
  {
    from: /from ['"]\.\/checkoutMiddleware\.js['"]/g,
    to: 'from \'./checkout.middleware.js\'',
  },
  {
    from: /import \{([^}]*)\bprotect\b([^}]*)\} from ['"]\.\.\/middleware\/auth\.middleware\.js['"]/g,
    to: 'import {$1authenticate$2} from \'../middleware/auth.middleware.js\'',
  },
  {
    from: /import \{([^}]*)\bprotect\b([^}]*)\} from ['"]\.\.\/\.\.\/middleware\/auth\.middleware\.js['"]/g,
    to: 'import {$1authenticate$2} from \'../../middleware/auth.middleware.js\'',
  },
  {
    from: /router\.(get|post|put|delete|patch)\([^,]+, \bprotect\b/g,
    to: 'router.$1($&'.replace('protect', 'authenticate'),
  },
];

/**
 * Recursively find all JavaScript files in a directory
 * @param {string} dir - Directory to search
 * @param {Array} fileList - Accumulator for found files
 * @returns {Array} List of JavaScript file paths
 */
function findJsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      findJsFiles(filePath, fileList);
    } else if (file.endsWith('.js')) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

/**
 * Update import paths in a file
 * @param {string} filePath - Path to the file
 */
function updateFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;

    replacements.forEach(({ from, to }) => {
      if (from.test(content)) {
        content = content.replace(from, to);
        updated = true;
      }
    });

    if (updated) {
      fs.writeFileSync(filePath, content, 'utf8');
      // eslint-disable-next-line no-console
      console.log(`✅ Updated: ${filePath}`);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`❌ Error processing ${filePath}:`, error);
  }
}

// Find all JS files in the src directory
const srcDir = path.join(__dirname);
const jsFiles = findJsFiles(srcDir);

// Update each file
// eslint-disable-next-line no-console
console.log(`Found ${jsFiles.length} JavaScript files. Updating imports...`);
jsFiles.forEach(updateFile);
// eslint-disable-next-line no-console
console.log('Done!');
