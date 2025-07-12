import mongoose from 'mongoose';

// Products that the API is returning but don't exist in database
const apiProducts = [
  {
    _id: new mongoose.Types.ObjectId('683dfb576fbad9a693c7cc1c'),
    name: 'لنت ترمز جلو پراید',
    slug: 'bp-pride-001',
    description: 'لنت ترمز جلو مناسب برای خودرو پراید، ساخت ایران',
    price: 180000,
    category: new mongoose.Types.ObjectId('683dfb566fbad9a693c7cc0d'),
    brand: new mongoose.Types.ObjectId('683dfb566fbad9a693c7cc14'),
    stock: 50,
    images: [{ url: '/images/products/placeholder.jpg', alt: 'لنت ترمز جلو پراید' }],
    featured: true,
    compatibleVehicles: [{ model: 'پراید', year: '1990-2020', make: 'سایپا' }],
    rating: 4.716603607026078,
    numReviews: 25,
    sku: 'BP-PRIDE-001',
    weight: 0,
    specifications: [],
    reviews: [],
  },
  {
    _id: new mongoose.Types.ObjectId('683dfb576fbad9a693c7cc28'),
    name: 'شمع پراید NGK',
    slug: 'sp-pride-ngk',
    description: 'شمع احتراق NGK برای موتور پراید',
    price: 120000,
    category: new mongoose.Types.ObjectId('683dfb566fbad9a693c7cc0f'),
    brand: new mongoose.Types.ObjectId('683dfb566fbad9a693c7cc17'),
    stock: 80,
    images: [{ url: '/images/products/placeholder.jpg', alt: 'شمع پراید NGK' }],
    featured: true,
    compatibleVehicles: [{ model: 'پراید', year: '1990-2020', make: 'سایپا' }],
    rating: 4.386041488638279,
    numReviews: 14,
    sku: 'SP-PRIDE-NGK',
    weight: 0,
    specifications: [],
    reviews: [],
  },
  {
    _id: new mongoose.Types.ObjectId('683dfb576fbad9a693c7cc2e'),
    name: 'باطری 45 آمپر وارتا',
    slug: 'bat-45-varta',
    description: 'باطری 45 آمپر ساعت وارتا مناسب برای خودروهای کوچک',
    price: 1200000,
    category: new mongoose.Types.ObjectId('683dfb566fbad9a693c7cc10'),
    brand: new mongoose.Types.ObjectId('683dfb566fbad9a693c7cc16'),
    stock: 25,
    images: [{ url: '/images/products/placeholder.jpg', alt: 'باطری 45 آمپر وارتا' }],
    featured: true,
    compatibleVehicles: [
      { model: 'پراید', year: '1990-2020', make: 'سایپا' },
      { model: 'تیبا', year: '2005-2018', make: 'سایپا' }
    ],
    rating: 4.379520772056313,
    numReviews: 39,
    sku: 'BAT-45-VARTA',
    weight: 0,
    specifications: [],
    reviews: [],
  }
];

async function fixProductsDatabase() {
  try {
    await mongoose.connect('mongodb://localhost:27017/karno');
    const db = mongoose.connection.db;
    
    console.log('Adding missing products to database...');
    
    for (const product of apiProducts) {
      // Check if product already exists
      const existing = await db.collection('products').findOne({ _id: product._id });
      if (existing) {
        console.log(`Product ${product._id} already exists: ${product.name}`);
      } else {
        await db.collection('products').insertOne(product);
        console.log(`Added product ${product._id}: ${product.name}`);
      }
    }
    
    // Check total products now
    const total = await db.collection('products').countDocuments();
    console.log(`\nTotal products in database: ${total}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixProductsDatabase(); 