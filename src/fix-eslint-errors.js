/**
 * Script to fix common ESLint errors in the codebase:
 * - Convert CRLF to LF line endings
 * - Remove trailing spaces
 * - Add newline at end of file
 * - Add trailing commas in objects and arrays
 */
const fs = require('fs');
const path = require('path');

// Get directory path
const __dirname = process.cwd();

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
 * Fix ESLint errors in a file
 * @param {string} filePath - Path to the file
 */
function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;

    // Fix 1: Convert CRLF to LF
    if (content.includes('\r\n')) {
      content = content.replace(/\r\n/g, '\n');
      updated = true;
    }

    // Fix 2: Remove trailing spaces
    const contentWithoutTrailingSpaces = content.replace(/[ \t]+$/gm, '');
    if (content !== contentWithoutTrailingSpaces) {
      content = contentWithoutTrailingSpaces;
      updated = true;
    }

    // Fix 3: Add newline at end of file if missing
    if (!content.endsWith('\n')) {
      content += '\n';
      updated = true;
    }

    // Fix 4: Add trailing commas in objects and arrays - specifically targeting update-imports.js
    if (filePath.includes('update-imports.js')) {
      // Fix missing trailing commas in the replacements array
      content = content.replace(
        /(from:.+,\s+to:.+?)(\s+}\s*[,]?)(\s+)/g,
        '$1,$2$3',
      );

      // Fix missing trailing comma at the end of the array
      content = content.replace(
        /(\s+}\s*)\n(\s*]\s*;)/g,
        '$1,\n$2',
      );

      updated = true;
    }

    if (updated) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed ESLint issues in: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error);
  }
}

/**
 * Fix specific ESLint errors in update-imports.js
 * This function specifically targets the issues in update-imports.js
 */
function fixUpdateImportsFile() {
  const filePath = path.join(__dirname, 'src', 'update-imports.js');

  try {
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8');

      // Fix arrow function parentheses
      content = content.replace(
        /files\.forEach\(file =>/g,
        'files.forEach((file) =>',
      );

      // Fix replacements.forEach arrow function
      content = content.replace(
        /replacements\.forEach\(\({ from, to }\) =>/g,
        'replacements.forEach(({ from, to }) =>',
      );

      fs.writeFileSync(filePath, content, 'utf8');
      console.log('✅ Fixed specific issues in update-imports.js');
    }
  } catch (error) {
    console.error('❌ Error fixing update-imports.js:', error);
  }
}

// Find all JS files in the src directory
const srcDir = path.join(__dirname, 'src');
const jsFiles = findJsFiles(srcDir);

// Fix each file
console.log(`Found ${jsFiles.length} JavaScript files. Fixing ESLint issues...`);
jsFiles.forEach(fixFile);

// Fix specific issues in update-imports.js
fixUpdateImportsFile();

console.log('Done!');
