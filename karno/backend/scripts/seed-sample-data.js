import mongoose from 'mongoose';
import Product from '../src/models/product.model.js';
import Category from '../src/models/category.model.js';
import Brand from '../src/models/brand.model.js';
import { config } from 'dotenv';
config();

// Sample data for testing search functionality
const sampleCategories = [
  {
    name: 'لنت ترمز',
    slug: 'brake-pads',
    description: 'انواع لنت ترمز برای خودروهای مختلف'
  },
  {
    name: 'فیلتر روغن',
    slug: 'oil-filter',
    description: 'فیلترهای روغن موتور'
  },
  {
    name: 'شمع خودرو',
    slug: 'spark-plugs',
    description: 'شمع‌های احتراق برای موتورهای مختلف'
  },
  {
    name: 'باطری',
    slug: 'battery',
    description: 'باطری‌های خودرو'
  },
  {
    name: 'کمک فنر',
    slug: 'shock-absorber',
    description: 'کمک فنرهای جلو و عقب'
  }
];

const sampleBrands = [
  {
    name: 'ایرانی',
    slug: 'iranian',
    description: 'برند ایرانی',
    country: 'ایران'
  },
  {
    name: 'بوش',
    slug: 'bosch',
    description: 'برند آلمانی بوش',
    country: 'آلمان'
  },
  {
    name: 'وارتا',
    slug: 'varta',
    description: 'برند آلمانی وارتا',
    country: 'آلمان'
  },
  {
    name: 'NGK',
    slug: 'ngk',
    description: 'برند ژاپنی NGK',
    country: 'ژاپن'
  },
  {
    name: 'کایابا',
    slug: 'kayaba',
    description: 'برند ژاپنی کایابا',
    country: 'ژاپن'
  }
];

const sampleProducts = [
  // Brake Pads
  {
    name: 'لنت ترمز جلو پراید',
    description: 'لنت ترمز جلو مناسب برای خودرو پراید، ساخت ایران',
    price: 180000,
    stock: 50,
    categorySlug: 'brake-pads',
    brandSlug: 'iranian',
    sku: 'BP-PRIDE-001',
    featured: true,
    compatibleVehicles: [
      { make: 'سایپا', model: 'پراید', year: '1990-2020' }
    ]
  },
  {
    name: 'لنت ترمز جلو پژو 206',
    description: 'لنت ترمز جلو بوش مناسب برای پژو 206',
    price: 320000,
    stock: 30,
    categorySlug: 'brake-pads',
    brandSlug: 'bosch',
    sku: 'BP-P206-001',
    featured: false,
    compatibleVehicles: [
      { make: 'ایران خودرو', model: 'پژو 206', year: '2001-2015' }
    ]
  },
  // Oil Filters
  {
    name: 'فیلتر روغن پراید',
    description: 'فیلتر روغن موتور مناسب برای پراید',
    price: 45000,
    stock: 100,
    categorySlug: 'oil-filter',
    brandSlug: 'iranian',
    sku: 'OF-PRIDE-001',
    featured: false,
    compatibleVehicles: [
      { make: 'سایپا', model: 'پراید', year: '1990-2020' }
    ]
  },
  {
    name: 'فیلتر روغن پژو 405',
    description: 'فیلتر روغن بوش برای پژو 405',
    price: 85000,
    stock: 60,
    categorySlug: 'oil-filter',
    brandSlug: 'bosch',
    sku: 'OF-P405-001',
    featured: true,
    compatibleVehicles: [
      { make: 'ایران خودرو', model: 'پژو 405', year: '1995-2016' }
    ]
  },
  // Spark Plugs
  {
    name: 'شمع پراید NGK',
    description: 'شمع احتراق NGK برای موتور پراید',
    price: 120000,
    stock: 80,
    categorySlug: 'spark-plugs',
    brandSlug: 'ngk',
    sku: 'SP-PRIDE-NGK',
    featured: true,
    compatibleVehicles: [
      { make: 'سایپا', model: 'پراید', year: '1990-2020' }
    ]
  },
  {
    name: 'شمع پژو 206 بوش',
    description: 'شمع احتراق بوش مناسب برای پژو 206',
    price: 160000,
    stock: 40,
    categorySlug: 'spark-plugs',
    brandSlug: 'bosch',
    sku: 'SP-P206-BOSCH',
    featured: false,
    compatibleVehicles: [
      { make: 'ایران خودرو', model: 'پژو 206', year: '2001-2015' }
    ]
  },
  // Batteries
  {
    name: 'باطری 45 آمپر وارتا',
    description: 'باطری 45 آمپر ساعت وارتا مناسب برای خودروهای کوچک',
    price: 1200000,
    stock: 25,
    categorySlug: 'battery',
    brandSlug: 'varta',
    sku: 'BAT-45-VARTA',
    featured: true,
    compatibleVehicles: [
      { make: 'سایپا', model: 'پراید', year: '1990-2020' },
      { make: 'سایپا', model: 'تیبا', year: '2005-2018' }
    ]
  },
  {
    name: 'باطری 60 آمپر وارتا',
    description: 'باطری 60 آمپر ساعت وارتا برای خودروهای متوسط',
    price: 1500000,
    stock: 20,
    categorySlug: 'battery',
    brandSlug: 'varta',
    sku: 'BAT-60-VARTA',
    featured: false,
    compatibleVehicles: [
      { make: 'ایران خودرو', model: 'پژو 206', year: '2001-2015' },
      { make: 'ایران خودرو', model: 'پژو 405', year: '1995-2016' }
    ]
  },
  // Shock Absorbers
  {
    name: 'کمک فنر جلو پراید کایابا',
    description: 'کمک فنر جلو کایابا برای پراید',
    price: 850000,
    stock: 15,
    categorySlug: 'shock-absorber',
    brandSlug: 'kayaba',
    sku: 'SA-PRIDE-KAYABA',
    featured: true,
    compatibleVehicles: [
      { make: 'سایپا', model: 'پراید', year: '1990-2020' }
    ]
  },
  {
    name: 'کمک فنر عقب پژو 405',
    description: 'کمک فنر عقب مناسب برای پژو 405',
    price: 950000,
    stock: 12,
    categorySlug: 'shock-absorber',
    brandSlug: 'kayaba',
    sku: 'SA-P405-KAYABA',
    featured: false,
    compatibleVehicles: [
      { make: 'ایران خودرو', model: 'پژو 405', year: '1995-2016' }
    ]
  }
];

async function seedData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/karno');
    console.log('Connected to MongoDB');

    // Clear existing data
    await Product.deleteMany({});
    await Category.deleteMany({});
    await Brand.deleteMany({});
    console.log('Cleared existing data');

    // Create categories
    const createdCategories = await Category.insertMany(sampleCategories);
    console.log(`Created ${createdCategories.length} categories`);

    // Create brands
    const createdBrands = await Brand.insertMany(sampleBrands);
    console.log(`Created ${createdBrands.length} brands`);

    // Create a map for category and brand IDs
    const categoryMap = {};
    const brandMap = {};
    
    createdCategories.forEach(cat => {
      categoryMap[cat.slug] = cat._id;
    });
    
    createdBrands.forEach(brand => {
      brandMap[brand.slug] = brand._id;
    });

    // Create products with proper references
    const productsWithRefs = sampleProducts.map(product => ({
      ...product,
      category: categoryMap[product.categorySlug],
      brand: brandMap[product.brandSlug],
      images: [{
        url: '/images/products/placeholder.jpg',
        alt: product.name,
        isPrimary: true
      }],
      slug: product.sku.toLowerCase(), // Use SKU as slug for simplicity
      rating: Math.random() * 2 + 3, // Random rating between 3-5
      numReviews: Math.floor(Math.random() * 50) + 5,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    // Remove temporary slug fields
    productsWithRefs.forEach(product => {
      delete product.categorySlug;
      delete product.brandSlug;
    });

    const createdProducts = await Product.insertMany(productsWithRefs);
    console.log(`Created ${createdProducts.length} products`);

    // Create text indexes for search
    await Product.collection.createIndex({ 
      name: 'text', 
      description: 'text' 
    });
    
    await Brand.collection.createIndex({ 
      name: 'text' 
    });
    
    await Category.collection.createIndex({ 
      name: 'text' 
    });

    console.log('Created text indexes for search');
    console.log('Sample data seeded successfully!');

  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the seeding script
seedData(); 