import multer from 'multer';
import path, { dirname } from 'path'; // Node.js path module
import fs from 'fs'; // Node.js file system module
import { fileURLToPath } from 'url';
import { AppError } from '../middleware/errorHandler.js'; // Assuming you have this

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Function to ensure directory exists
const ensureDirExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Define the storage destination for product images
// Corrected path using __dirname safely
const productImagesDir = path.resolve(__dirname, '..', 'public', 'uploads', 'products');

// Ensure the directory exists when the module loads
ensureDirExists(productImagesDir);

// Multer disk storage configuration for product images
const productStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, productImagesDir);
  },
  filename: (req, file, cb) => {
    // Create a unique filename: fieldname-timestamp-originalfilename
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const extension = path.extname(file.originalname);
    // Using file.fieldname might be 'images[0]', 'images[1]' if using array,
    // or just 'image' if single. Using a generic 'product' prefix might be better.
    cb(null, `product-${uniqueSuffix}${extension}`);
  },
});

// File filter to accept only images
const imageFileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

// Multer upload instance for product images
// Assuming you want to upload multiple images, max 10, under the field name 'images'
export const uploadProductImages = multer({
  storage: productStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 1024 * 1024 * 5, // 5 MB limit per image
  },
}).array('images', 10); // 'images' is the field name in the form, 10 is max count

// If you need to upload a single image (e.g., for a main product image)
// export const uploadSingleProductImage = multer({
//   storage: productStorage,
//   fileFilter: imageFileFilter,
//   limits: {
//     fileSize: 1024 * 1024 * 5
//   }
// }).single('image'); // 'image' is the field name for single image upload
