import './src/config/database.js';
import Product from './src/models/product.model.js';
import Brand from './src/models/brand.model.js';
import Category from './src/models/category.model.js';

async function testSearch() {
  try {
    // Check if products exist
    const productCount = await Product.countDocuments();
    console.log('Products in database:', productCount);

    if (productCount === 0) {
      console.log('No products found in database');
      process.exit(0);
    }

    // Test regex search (fallback method)
    const query = 'لنت';
    console.log('Testing search for:', query);

    const regexQuery = new RegExp(query, 'i');
    const products = await Product.find({
      $or: [
        { name: regexQuery },
        { description: regexQuery },
        { sku: regexQuery }
      ]
    })
      .select('name description sku')
      .limit(5)
      .lean();

    console.log('Found products (regex):', products);

    // Test text search
    try {
      const textProducts = await Product.find({ $text: { $search: query } })
        .select('name description sku')
        .limit(5)
        .lean();
      console.log('Found products (text search):', textProducts);
    } catch (error) {
      console.log('Text search failed:', error.message);
    }

    process.exit(0);
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

testSearch(); 