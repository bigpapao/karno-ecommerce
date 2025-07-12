import mongoose from 'mongoose';
import Product from './src/models/product.model.js';
import Category from './src/models/category.model.js';
import Brand from './src/models/brand.model.js';
import VehicleModel from './src/models/VehicleModel.js';

// Real automotive parts data
const realAutomotiveProducts = [
  // Brake System
  {
    name: 'لنت ترمز جلو پراید - اصلی',
    description: 'لنت ترمز جلو پراید با کیفیت بالا و مقاوم در برابر حرارت. مناسب برای شرایط رانندگی شهری و جاده‌ای.',
    price: 180000,
    discountPrice: 165000,
    category: 'brake-system',
    brand: 'saipa',
    sku: 'BRK-PRIDE-FRONT-001',
    oem: 'SP-96316684',
    images: [{ url: '/uploads/products/brake-pride-front.jpg', alt: 'لنت ترمز جلو پراید' }],
    specifications: [
      { name: 'material', value: 'سرامیک' },
      { name: 'thickness', value: '12mm' },
      { name: 'width', value: '45mm' },
      { name: 'length', value: '105mm' }
    ],
    compatibleVehicles: [
      { manufacturer: 'Saipa', model: 'Pride', year: '2010-2020', make: 'Pride 111' },
      { manufacturer: 'Saipa', model: 'Pride', year: '2010-2020', make: 'Pride 132' }
    ],
    inStock: true,
    stockQuantity: 25,
    weight: 0.8,
    dimensions: { length: 10.5, width: 4.5, height: 1.2 },
    searchKeywords: ['لنت ترمز', 'پراید', 'جلو', 'brake pad'],
    metaDescription: 'لنت ترمز جلو پراید اصلی با بهترین کیفیت و قیمت مناسب'
  },
  
  {
    name: 'لنت ترمز عقب پژو 405 - اصلی',
    description: 'لنت ترمز عقب پژو 405 با استاندارد اروپایی. مقاوم و بادوام برای استفاده طولانی مدت.',
    price: 220000,
    discountPrice: 200000,
    category: 'brake-system',
    brand: 'peugeot',
    sku: 'BRK-405-REAR-001',
    oem: 'PG-4251A6',
    images: ['/uploads/products/brake-405-rear.jpg'],
    specifications: {
      material: 'سرامیک',
      thickness: '14mm',
      width: '50mm',
      length: '115mm'
    },
    compatibleVehicles: ['peugeot-405'],
    inStock: true,
    stockQuantity: 18,
    weight: 1.2,
    dimensions: { length: 11.5, width: 5.0, height: 1.4 },
    searchKeywords: ['لنت ترمز', 'پژو', '405', 'عقب', 'brake pad'],
    metaDescription: 'لنت ترمز عقب پژو 405 اصلی با کیفیت اروپایی'
  },

  // Engine Parts
  {
    name: 'فیلتر روغن پراید - اصلی سایپا',
    description: 'فیلتر روغن موتور پراید با کیفیت اصلی سایپا. تضمین عملکرد بهینه موتور و افزایش عمر روغن.',
    price: 45000,
    discountPrice: 40000,
    category: 'engine-parts',
    brand: 'saipa',
    sku: 'ENG-PRIDE-FILTER-001',
    oem: 'SP-15208-43G00',
    images: ['/uploads/products/oil-filter-pride.jpg'],
    specifications: {
      filterType: 'Full Flow',
      threadSize: '3/4-16 UNF',
      gasketDiameter: '71mm',
      height: '85mm'
    },
    compatibleVehicles: ['pride-111', 'pride-132', 'pride-151'],
    inStock: true,
    stockQuantity: 45,
    weight: 0.3,
    dimensions: { length: 8.5, width: 8.5, height: 8.5 },
    searchKeywords: ['فیلتر روغن', 'پراید', 'موتور', 'oil filter'],
    metaDescription: 'فیلتر روغن پراید اصلی سایپا با بهترین کیفیت'
  },

  {
    name: 'شمع پژو 405 - NGK اصلی',
    description: 'شمع موتور پژو 405 برند NGK ژاپن. عملکرد بهینه احتراق و کاهش مصرف سوخت.',
    price: 120000,
    discountPrice: 110000,
    category: 'engine-parts',
    brand: 'ngk',
    sku: 'ENG-405-SPARK-001',
    oem: 'NGK-BPR6ES',
    images: ['/uploads/products/spark-plug-405.jpg'],
    specifications: {
      threadSize: '14mm',
      reach: '19mm',
      hexSize: '20.8mm',
      gap: '0.8mm'
    },
    compatibleVehicles: ['peugeot-405'],
    inStock: true,
    stockQuantity: 32,
    weight: 0.1,
    dimensions: { length: 2.5, width: 2.5, height: 9.5 },
    searchKeywords: ['شمع', 'پژو', '405', 'NGK', 'spark plug'],
    metaDescription: 'شمع پژو 405 NGK اصلی ژاپن با کیفیت بالا'
  },

  // Electrical System
  {
    name: 'باتری 60 آمپر وارتا - اصلی',
    description: 'باتری 60 آمپر وارتا آلمان مناسب برای خودروهای سواری. دارای 24 ماه گارانتی.',
    price: 1500000,
    discountPrice: 1400000,
    category: 'electrical-system',
    brand: 'varta',
    sku: 'ELEC-BATTERY-60A-001',
    oem: 'VARTA-A15',
    images: ['/uploads/products/battery-60a-varta.jpg'],
    specifications: {
      voltage: '12V',
      capacity: '60Ah',
      coldCrankingAmps: '540A',
      dimensions: '242×175×190mm'
    },
    compatibleVehicles: ['pride-111', 'pride-132', 'peugeot-405', 'samand'],
    inStock: true,
    stockQuantity: 8,
    weight: 15.2,
    dimensions: { length: 24.2, width: 17.5, height: 19.0 },
    searchKeywords: ['باتری', 'وارتا', '60 آمپر', 'battery', 'varta'],
    metaDescription: 'باتری 60 آمپر وارتا آلمان با 24 ماه گارانتی'
  },

  {
    name: 'دینام پراید - اصلی',
    description: 'دینام پراید اصلی با قدرت 65 آمپر. مناسب برای تمام مدل‌های پراید.',
    price: 850000,
    discountPrice: 800000,
    category: 'electrical-system',
    brand: 'saipa',
    sku: 'ELEC-PRIDE-ALT-001',
    oem: 'SP-37300-80D00',
    images: ['/uploads/products/alternator-pride.jpg'],
    specifications: {
      voltage: '12V',
      amperage: '65A',
      pulleyType: 'V-Belt',
      mounting: 'Ear Mount'
    },
    compatibleVehicles: ['pride-111', 'pride-132'],
    inStock: true,
    stockQuantity: 12,
    weight: 4.5,
    dimensions: { length: 15.0, width: 12.0, height: 10.0 },
    searchKeywords: ['دینام', 'پراید', 'alternator', 'شارژ'],
    metaDescription: 'دینام پراید اصلی 65 آمپر با کیفیت بالا'
  },

  // Suspension System
  {
    name: 'کمک فنر جلو پژو 405 - KYB',
    description: 'کمک فنر جلو پژو 405 برند KYB ژاپن. عملکرد بهینه و راحتی رانندگی.',
    price: 650000,
    discountPrice: 620000,
    category: 'suspension-system',
    brand: 'kyb',
    sku: 'SUSP-405-SHOCK-F-001',
    oem: 'KYB-333230',
    images: ['/uploads/products/shock-absorber-405-front.jpg'],
    specifications: {
      type: 'Hydraulic',
      mounting: 'Top Mount',
      strokeLength: '140mm',
      extendedLength: '380mm'
    },
    compatibleVehicles: ['peugeot-405'],
    inStock: true,
    stockQuantity: 15,
    weight: 2.8,
    dimensions: { length: 38.0, width: 5.0, height: 5.0 },
    searchKeywords: ['کمک فنر', 'پژو', '405', 'جلو', 'KYB'],
    metaDescription: 'کمک فنر جلو پژو 405 KYB ژاپن با کیفیت بالا'
  },

  {
    name: 'تایر 185/65R14 میشلن',
    description: 'تایر میشلن فرانسه سایز 185/65R14 مناسب برای خودروهای سواری. دوام بالا و عملکرد ایمن.',
    price: 2200000,
    discountPrice: 2100000,
    category: 'tires-wheels',
    brand: 'michelin',
    sku: 'TIRE-185-65R14-001',
    oem: 'MICH-ENERGY-XM2',
    images: ['/uploads/products/tire-michelin-185-65r14.jpg'],
    specifications: {
      size: '185/65R14',
      loadIndex: '86',
      speedRating: 'H',
      treadPattern: 'Asymmetric'
    },
    compatibleVehicles: ['peugeot-405', 'samand'],
    inStock: true,
    stockQuantity: 20,
    weight: 8.5,
    dimensions: { length: 60.0, width: 18.5, height: 60.0 },
    searchKeywords: ['تایر', 'میشلن', '185/65R14', 'tire', 'michelin'],
    metaDescription: 'تایر میشلن 185/65R14 فرانسه با کیفیت بالا'
  },

  // Cooling System
  {
    name: 'رادیاتور پراید - اصلی',
    description: 'رادیاتور پراید اصلی با کیفیت بالا. تضمین خنک‌کاری بهینه موتور.',
    price: 950000,
    discountPrice: 900000,
    category: 'cooling-system',
    brand: 'saipa',
    sku: 'COOL-PRIDE-RAD-001',
    oem: 'SP-17700-80D00',
    images: ['/uploads/products/radiator-pride.jpg'],
    specifications: {
      material: 'Aluminum',
      coreType: 'Tube & Fin',
      tankMaterial: 'Plastic',
      capacity: '4.5L'
    },
    compatibleVehicles: ['pride-111', 'pride-132'],
    inStock: true,
    stockQuantity: 6,
    weight: 5.2,
    dimensions: { length: 45.0, width: 35.0, height: 5.0 },
    searchKeywords: ['رادیاتور', 'پراید', 'خنک کننده', 'radiator'],
    metaDescription: 'رادیاتور پراید اصلی با کیفیت بالا'
  },

  {
    name: 'واتر پمپ پژو 405 - اصلی',
    description: 'واتر پمپ پژو 405 اصلی. تضمین گردش بهینه مایع خنک‌کننده در سیستم.',
    price: 380000,
    discountPrice: 350000,
    category: 'cooling-system',
    brand: 'peugeot',
    sku: 'COOL-405-PUMP-001',
    oem: 'PG-1201A8',
    images: ['/uploads/products/water-pump-405.jpg'],
    specifications: {
      impellerType: 'Centrifugal',
      sealType: 'Mechanical',
      housing: 'Cast Iron',
      flow: '120L/min'
    },
    compatibleVehicles: ['peugeot-405'],
    inStock: true,
    stockQuantity: 14,
    weight: 1.8,
    dimensions: { length: 12.0, width: 10.0, height: 8.0 },
    searchKeywords: ['واتر پمپ', 'پژو', '405', 'water pump'],
    metaDescription: 'واتر پمپ پژو 405 اصلی با کیفیت بالا'
  }
];

async function populateRealProducts() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/karno');
    console.log('✅ Connected to MongoDB');

    console.log('\n🗑️ Clearing existing products...');
    await Product.deleteMany({});
    console.log('✅ Existing products cleared');

    console.log('\n📦 Adding real automotive products...');
    
    for (const productData of realAutomotiveProducts) {
      try {
        // Find or create category
        let category = await Category.findOne({ slug: productData.category });
        if (!category) {
          console.log(`⚠️ Category ${productData.category} not found, creating...`);
          // You might want to create categories first
        }

        // Find or create brand
        let brand = await Brand.findOne({ slug: productData.brand });
        if (!brand) {
          console.log(`⚠️ Brand ${productData.brand} not found, creating...`);
          // You might want to create brands first
        }

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
          category: category?._id || null,
          brand: brand?._id || null,
          isActive: true,
          isFeatured: Math.random() > 0.7, // 30% chance of being featured
          tags: productData.searchKeywords,
          createdAt: new Date(),
          updatedAt: new Date()
        });

        await product.save();
        console.log(`✅ Added: ${productData.name}`);
      } catch (error) {
        console.log(`❌ Error adding ${productData.name}:`, error.message);
      }
    }

    console.log('\n🎉 Real automotive products added successfully!');
    console.log(`📊 Total products: ${realAutomotiveProducts.length}`);
    
    // Display summary
    const productCount = await Product.countDocuments();
    console.log(`\n📋 Database Summary:`);
    console.log(`   Products in database: ${productCount}`);
    
    // Show category distribution
    const categoryStats = await Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    console.log(`\n📈 Category Distribution:`);
    categoryStats.forEach(stat => {
      console.log(`   ${stat._id || 'Uncategorized'}: ${stat.count} products`);
    });

  } catch (error) {
    console.error('❌ Error populating products:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the population
populateRealProducts(); 