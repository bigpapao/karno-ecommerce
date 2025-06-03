import mongoose from 'mongoose';
import { connectDB } from '../config/database.js';
import Product from '../models/product.model.js';
import Brand from '../models/brand.model.js';
import Category from '../models/category.model.js';

const fixCorruptedProducts = async () => {
  try {
    // Connect to database
    await connectDB();
    console.log('Connected to database');

    // Get all products
    const products = await Product.find({}).lean();
    console.log(`Found ${products.length} products`);

    let fixedCount = 0;
    let deletedCount = 0;

    for (const product of products) {
      let needsUpdate = false;
      const updates = {};

      // Check if brand is valid ObjectId
      if (product.brand) {
        if (typeof product.brand === 'string' && !mongoose.Types.ObjectId.isValid(product.brand)) {
          console.log(`Product ${product.name} has invalid brand: ${product.brand}`);
          // Try to find brand by name
          const brand = await Brand.findOne({ name: product.brand });
          if (brand) {
            updates.brand = brand._id;
            needsUpdate = true;
            console.log(`Fixed brand for ${product.name}: ${product.brand} -> ${brand._id}`);
          } else {
            // Remove invalid brand reference
            updates.brand = null;
            needsUpdate = true;
            console.log(`Removed invalid brand for ${product.name}: ${product.brand}`);
          }
        }
      }

      // Check if category is valid ObjectId
      if (product.category) {
        if (typeof product.category === 'string' && !mongoose.Types.ObjectId.isValid(product.category)) {
          console.log(`Product ${product.name} has invalid category: ${product.category}`);
          // Try to find category by name
          const category = await Category.findOne({ name: product.category });
          if (category) {
            updates.category = category._id;
            needsUpdate = true;
            console.log(`Fixed category for ${product.name}: ${product.category} -> ${category._id}`);
          } else {
            // Remove invalid category reference
            updates.category = null;
            needsUpdate = true;
            console.log(`Removed invalid category for ${product.name}: ${product.category}`);
          }
        }
      }

      // Update product if needed
      if (needsUpdate) {
        try {
          await Product.findByIdAndUpdate(product._id, updates);
          fixedCount++;
          console.log(`Updated product: ${product.name}`);
        } catch (error) {
          console.error(`Failed to update product ${product.name}:`, error.message);
          // If update fails, consider deleting the corrupted product
          if (error.name === 'CastError') {
            await Product.findByIdAndDelete(product._id);
            deletedCount++;
            console.log(`Deleted corrupted product: ${product.name}`);
          }
        }
      }
    }

    console.log(`\nFixing completed:`);
    console.log(`- Fixed products: ${fixedCount}`);
    console.log(`- Deleted corrupted products: ${deletedCount}`);

    // Close database connection
    await mongoose.connection.close();
    console.log('Database connection closed');

  } catch (error) {
    console.error('Error fixing corrupted products:', error);
    process.exit(1);
  }
};

// Run the script
fixCorruptedProducts(); 