import mongoose from 'mongoose';
import Product from './src/models/product.model.js';
import Category from './src/models/category.model.js';
import Brand from './src/models/brand.model.js';

// Simplified automotive products data
const simpleProducts = [
  {
    name: 'لنت ترمز جلو پراید - اصلی',
    description: 'لنت ترمز جلو پراید با کیفیت بالا و مقاوم در برابر حرارت. مناسب برای شرایط رانندگی شهری و جاده‌ای.',
    price: 180000,
    discountPrice: 165000,
    stock: 25,
    sku: 'BRK-PRIDE-FRONT-001',
    images: [{ url: '/uploads/products/brake-pride-front.jpg', alt: 'لنت ترمز جلو پراید' }],
    specifications: [
      { name: 'مواد', value: 'سرامیک' },
      { name: 'ضخامت', value: '12mm' },
      { name: 'عرض', value: '45mm' },
      { name: 'طول', value: '105mm' }
    ],
    compatibleVehicles: [
      { manufacturer: 'Saipa', model: 'Pride', year: '2010-2020', make: 'Pride 111' }
    ],
    weight: 0.8,
    dimensions: { length: 10.5, width: 4.5, height: 1.2 },
    featured: true
  },
  
  {
    name: 'فیلتر روغن پراید - اصلی سایپا',
    description: 'فیلتر روغن موتور پراید با کیفیت اصلی سایپا. تضمین عملکرد بهینه موتور و افزایش عمر روغن.',
    price: 45000,
    discountPrice: 40000,
    stock: 45,
    sku: 'ENG-PRIDE-FILTER-001',
    images: [{ url: '/uploads/products/oil-filter-pride.jpg', alt: 'فیلتر روغن پراید' }],
    specifications: [
      { name: 'نوع فیلتر', value: 'Full Flow' },
      { name: 'اندازه رزوه', value: '3/4-16 UNF' },
      { name: 'قطر واشر', value: '71mm' },
      { name: 'ارتفاع', value: '85mm' }
    ],
    compatibleVehicles: [
      { manufacturer: 'Saipa', model: 'Pride', year: '2010-2020', make: 'Pride 111' }
    ],
    weight: 0.3,
    dimensions: { length: 8.5, width: 8.5, height: 8.5 },
    featured: false
  },

  {
    name: 'باتری 60 آمپر وارتا - اصلی',
    description: 'باتری 60 آمپر وارتا آلمان مناسب برای خودروهای سواری. دارای 24 ماه گارانتی.',
    price: 1500000,
    discountPrice: 1400000,
    stock: 8,
    sku: 'ELEC-BATTERY-60A-001',
    images: [{ url: '/uploads/products/battery-60a-varta.jpg', alt: 'باتری 60 آمپر وارتا' }],
    specifications: [
      { name: 'ولتاژ', value: '12V' },
      { name: 'ظرفیت', value: '60Ah' },
      { name: 'آمپر استارت سرد', value: '540A' },
      { name: 'ابعاد', value: '242×175×190mm' }
    ],
    compatibleVehicles: [
      { manufacturer: 'Saipa', model: 'Pride', year: '2010-2020', make: 'Pride 111' },
      { manufacturer: 'Iran Khodro', model: 'Peugeot 405', year: '2005-2015', make: 'Peugeot 405' }
    ],
    weight: 15.2,
    dimensions: { length: 24.2, width: 17.5, height: 19.0 },
    featured: true
  },

  {
    name: 'تایر 185/65R14 میشلن',
    description: 'تایر میشلن فرانسه سایز 185/65R14 مناسب برای خودروهای سواری. دوام بالا و عملکرد ایمن.',
    price: 2200000,
    discountPrice: 2100000,
    stock: 20,
    sku: 'TIRE-185-65R14-001',
    images: [{ url: '/uploads/products/tire-michelin-185-65r14.jpg', alt: 'تایر میشلن 185/65R14' }],
    specifications: [
      { name: 'سایز', value: '185/65R14' },
      { name: 'شاخص بار', value: '86' },
      { name: 'رتبه سرعت', value: 'H' },
      { name: 'الگوی آج', value: 'Asymmetric' }
    ],
    compatibleVehicles: [
      { manufacturer: 'Iran Khodro', model: 'Peugeot 405', year: '2005-2015', make: 'Peugeot 405' }
    ],
    weight: 8.5,
    dimensions: { length: 60.0, width: 18.5, height: 60.0 },
    featured: false
  },

  {
    name: 'رادیاتور پراید - اصلی',
    description: 'رادیاتور پراید اصلی با کیفیت بالا. تضمین خنک‌کاری بهینه موتور.',
    price: 950000,
    discountPrice: 900000,
    stock: 6,
    sku: 'COOL-PRIDE-RAD-001',
    images: [{ url: '/uploads/products/radiator-pride.jpg', alt: 'رادیاتور پراید' }],
    specifications: [
      { name: 'مواد', value: 'آلومینیوم' },
      { name: 'نوع هسته', value: 'Tube & Fin' },
      { name: 'مواد مخزن', value: 'پلاستیک' },
      { name: 'ظرفیت', value: '4.5L' }
    ],
    compatibleVehicles: [
      { manufacturer: 'Saipa', model: 'Pride', year: '2010-2020', make: 'Pride 111' }
    ],
    weight: 5.2,
    dimensions: { length: 45.0, width: 35.0, height: 5.0 },
    featured: false
  }
];

async function populateSimpleProducts() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/karno');
    console.log('✅ Connected to MongoDB');

    console.log('\n📂 Getting existing categories and brands...');
    const categories = await Category.find({});
    const brands = await Brand.find({});
    
    console.log(`Found ${categories.length} categories and ${brands.length} brands`);

    // Use first available category and brand, or create default ones
    let defaultCategory = categories[0];
    let defaultBrand = brands[0];

    if (!defaultCategory) {
      console.log('⚠️ No categories found, creating default...');
      defaultCategory = await Category.create({
        name: 'قطعات خودرو',
        slug: 'auto-parts',
        description: 'قطعات خودرو',
        isActive: true
      });
    }

    if (!defaultBrand) {
      console.log('⚠️ No brands found, creating default...');
      defaultBrand = await Brand.create({
        name: 'اصلی',
        slug: 'original',
        description: 'قطعات اصلی',
        isActive: true
      });
    }

    console.log('\n🗑️ Clearing existing products...');
    await Product.deleteMany({});
    console.log('✅ Existing products cleared');

    console.log('\n📦 Adding automotive products...');
    
    for (const productData of simpleProducts) {
      try {
        // Create product with slug
        const slug = productData.name
          .toLowerCase()
          .replace(/[^\w\s-]/g, '') // Remove special characters
          .replace(/\s+/g, '-') // Replace spaces with hyphens
          .replace(/--+/g, '-') // Replace multiple hyphens with single
          .trim();

        const product = new Product({
          ...productData,
          slug,
          category: defaultCategory._id,
          brand: defaultBrand._id
        });

        await product.save();
        console.log(`✅ Added: ${productData.name}`);
      } catch (error) {
        console.log(`❌ Error adding ${productData.name}:`, error.message);
      }
    }

    console.log('\n🎉 Automotive products added successfully!');
    console.log(`📊 Total products: ${simpleProducts.length}`);
    
    // Display summary
    const productCount = await Product.countDocuments();
    console.log(`\n📋 Database Summary:`);
    console.log(`   Products in database: ${productCount}`);
    console.log(`   Categories: ${categories.length}`);
    console.log(`   Brands: ${brands.length}`);

  } catch (error) {
    console.error('❌ Error populating products:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the population
populateSimpleProducts(); 