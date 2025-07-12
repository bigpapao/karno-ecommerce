import mongoose from 'mongoose';
import 'dotenv/config';
import slugify from 'slugify';

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/karno');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

// Import the existing Category model
import Category from './src/models/category.model.js';

// Define the comprehensive automotive categories
const automotiveCategories = [
  // Main category groups
  {
    name: 'قطعات موتوری',
    slug: 'engine-parts',
    description: 'قطعات مربوط به موتور خودرو شامل پیستون، میل لنگ و سایر اجزای موتور',
    featured: true,
    order: 1,
    subcategories: [
      { name: 'پیستون', slug: 'piston', description: 'پیستون موتور خودرو' },
      { name: 'میل‌لنگ', slug: 'crankshaft', description: 'میل لنگ موتور' },
      { name: 'میل‌سوپاپ', slug: 'camshaft', description: 'میل سوپاپ موتور' },
      { name: 'واشر سرسیلندر', slug: 'head-gasket', description: 'واشر سر سیلندر موتور' },
      { name: 'تسمه تایم', slug: 'timing-belt', description: 'تسمه تایمینگ موتور' },
      { name: 'اویل پمپ', slug: 'oil-pump', description: 'پمپ روغن موتور' },
      { name: 'واتر پمپ', slug: 'water-pump', description: 'پمپ آب موتور' }
    ]
  },
  {
    name: 'جلوبندی و تعلیق',
    slug: 'suspension-frontend',
    description: 'قطعات جلوبندی و سیستم تعلیق خودرو',
    featured: true,
    order: 2,
    subcategories: [
      { name: 'کمک فنر', slug: 'shock-absorber', description: 'کمک فنر خودرو' },
      { name: 'طبق', slug: 'control-arm', description: 'طبق جلوبندی' },
      { name: 'سیبک', slug: 'ball-joint', description: 'سیبک جلوبندی' },
      { name: 'میل موجگیر', slug: 'stabilizer-bar', description: 'میل موج گیر' },
      { name: 'فنر لول', slug: 'coil-spring', description: 'فنر لول تعلیق' }
    ]
  },
  {
    name: 'سیستم ترمز',
    slug: 'brake-system',
    description: 'قطعات سیستم ترمز خودرو',
    featured: true,
    order: 3,
    subcategories: [
      { name: 'لنت ترمز', slug: 'brake-pads', description: 'لنت ترمز خودرو' },
      { name: 'دیسک ترمز', slug: 'brake-disc', description: 'دیسک ترمز' },
      { name: 'کاسه ترمز', slug: 'brake-shoe', description: 'کاسه ترمز' },
      { name: 'بوستر ترمز', slug: 'brake-booster', description: 'بوستر ترمز' },
      { name: 'پمپ ترمز', slug: 'brake-pump', description: 'پمپ ترمز' },
      { name: 'روغن ترمز', slug: 'brake-fluid', description: 'روغن ترمز' }
    ]
  },
  {
    name: 'سیستم فرمان',
    slug: 'steering-system',
    description: 'قطعات سیستم فرمان خودرو',
    featured: true,
    order: 4,
    subcategories: [
      { name: 'جعبه فرمان', slug: 'steering-box', description: 'جعبه فرمان' },
      { name: 'پمپ هیدرولیک', slug: 'power-steering-pump', description: 'پمپ هیدرولیک فرمان' },
      { name: 'میل فرمان', slug: 'steering-shaft', description: 'میل فرمان' }
    ]
  },
  {
    name: 'برق و الکترونیک',
    slug: 'electrical-electronics',
    description: 'قطعات برقی و الکترونیکی خودرو',
    featured: true,
    order: 5,
    subcategories: [
      { name: 'باتری', slug: 'battery', description: 'باتری خودرو' },
      { name: 'دینام', slug: 'alternator', description: 'دینام خودرو' },
      { name: 'استارت', slug: 'starter', description: 'استارت خودرو' },
      { name: 'ECU', slug: 'ecu', description: 'واحد کنترل الکترونیکی' },
      { name: 'سنسورها', slug: 'sensors', description: 'انواع سنسورهای خودرو' },
      { name: 'چراغ‌ها', slug: 'lights', description: 'چراغ‌های خودرو' }
    ]
  },
  {
    name: 'سوخت‌رسانی',
    slug: 'fuel-system',
    description: 'قطعات سیستم سوخت‌رسانی',
    featured: true,
    order: 6,
    subcategories: [
      { name: 'باک سوخت', slug: 'fuel-tank', description: 'باک سوخت' },
      { name: 'پمپ بنزین', slug: 'fuel-pump', description: 'پمپ بنزین' },
      { name: 'انژکتور', slug: 'injector', description: 'انژکتور سوخت' },
      { name: 'ریل سوخت', slug: 'fuel-rail', description: 'ریل سوخت' },
      { name: 'فیلتر بنزین', slug: 'fuel-filter', description: 'فیلتر بنزین' }
    ]
  },
  {
    name: 'سیستم خنک‌کننده',
    slug: 'cooling-system',
    description: 'قطعات سیستم خنک‌کننده موتور',
    featured: true,
    order: 7,
    subcategories: [
      { name: 'رادیاتور', slug: 'radiator', description: 'رادیاتور خودرو' },
      { name: 'فن رادیاتور', slug: 'cooling-fan', description: 'فن رادیاتور' },
      { name: 'ترموستات', slug: 'thermostat', description: 'ترموستات موتور' },
      { name: 'شلنگ آب', slug: 'water-hose', description: 'شلنگ آب موتور' }
    ]
  },
  {
    name: 'بدنه و کاروسری',
    slug: 'body-parts',
    description: 'قطعات بدنه و کاروسری خودرو',
    featured: true,
    order: 8,
    subcategories: [
      { name: 'سپر', slug: 'bumper', description: 'سپر خودرو' },
      { name: 'گلگیر', slug: 'fender', description: 'گلگیر خودرو' },
      { name: 'درب', slug: 'door', description: 'درب خودرو' },
      { name: 'کاپوت', slug: 'hood', description: 'کاپوت خودرو' },
      { name: 'آینه', slug: 'mirror', description: 'آینه خودرو' },
      { name: 'دستگیره', slug: 'handle', description: 'دستگیره درب' },
      { name: 'نوار دور درب', slug: 'door-seal', description: 'نوار دور درب' }
    ]
  },
  {
    name: 'لوازم مصرفی',
    slug: 'consumables',
    description: 'لوازم مصرفی و نگهداری خودرو',
    featured: true,
    order: 9,
    subcategories: [
      { name: 'فیلتر هوا', slug: 'air-filter', description: 'فیلتر هوای موتور' },
      { name: 'روغن موتور', slug: 'engine-oil', description: 'روغن موتور' },
      { name: 'فیلتر کابین', slug: 'cabin-filter', description: 'فیلتر کابین' },
      { name: 'فیلتر سوخت', slug: 'fuel-filter-consumable', description: 'فیلتر سوخت' },
      { name: 'شمع خودرو', slug: 'spark-plugs', description: 'شمع احتراق' },
      { name: 'روغن‌های مختلف', slug: 'various-oils', description: 'انواع روغن‌ها' },
      { name: 'ضدیخ', slug: 'antifreeze', description: 'ضدیخ موتور' }
    ]
  },
  {
    name: 'قطعات داخلی',
    slug: 'interior-parts',
    description: 'قطعات داخلی خودرو',
    featured: false,
    order: 10,
    subcategories: [
      { name: 'داشبورد', slug: 'dashboard', description: 'داشبورد خودرو' },
      { name: 'صندلی', slug: 'seat', description: 'صندلی خودرو' },
      { name: 'کمربند ایمنی', slug: 'seatbelt', description: 'کمربند ایمنی' },
      { name: 'کنسول میانی', slug: 'center-console', description: 'کنسول میانی' },
      { name: 'تزئینات داخلی', slug: 'interior-trim', description: 'تزئینات داخلی' }
    ]
  },
  {
    name: 'گیربکس و کلاچ',
    slug: 'transmission-clutch',
    description: 'قطعات گیربکس و سیستم کلاچ',
    featured: true,
    order: 11,
    subcategories: [
      { name: 'دیسک کلاچ', slug: 'clutch-disc', description: 'دیسک کلاچ' },
      { name: 'صفحه کلاچ', slug: 'clutch-plate', description: 'صفحه کلاچ' },
      { name: 'گیربکس', slug: 'transmission', description: 'جعبه دنده' },
      { name: 'سیم کلاچ', slug: 'clutch-cable', description: 'سیم کلاچ' },
      { name: 'پمپ کلاچ', slug: 'clutch-pump', description: 'پمپ کلاچ' },
      { name: 'دسته دنده', slug: 'gear-shift', description: 'دسته دنده' }
    ]
  },
  {
    name: 'لوازم جانبی',
    slug: 'accessories',
    description: 'لوازم جانبی و تزئینی خودرو',
    featured: false,
    order: 12,
    subcategories: [
      { name: 'روکش صندلی', slug: 'seat-cover', description: 'روکش صندلی' },
      { name: 'کفپوش', slug: 'floor-mat', description: 'کفپوش خودرو' },
      { name: 'آفتاب‌گیر', slug: 'sun-visor', description: 'آفتاب گیر' },
      { name: 'دوربین عقب', slug: 'rear-camera', description: 'دوربین دنده عقب' },
      { name: 'سنسور پارک', slug: 'parking-sensor', description: 'سنسور پارک' }
    ]
  },
  {
    name: 'وضعیت قطعه',
    slug: 'part-condition',
    description: 'وضعیت و کیفیت قطعات',
    featured: false,
    order: 13,
    subcategories: [
      { name: 'نو', slug: 'new', description: 'قطعه نو و اصل' },
      { name: 'استوک', slug: 'used', description: 'قطعه دست دوم' },
      { name: 'بازسازی‌شده', slug: 'refurbished', description: 'قطعه بازسازی شده' }
    ]
  }
];

// Function to create categories
const createCategories = async () => {
  try {
    await connectDB();
    console.log('🚀 Starting to create automotive categories...\n');

    let totalCreated = 0;
    let totalSkipped = 0;

    for (const mainCategoryData of automotiveCategories) {
      try {
        // Create main category
        const mainCategoryExists = await Category.findOne({ 
          slug: mainCategoryData.slug 
        });

        let mainCategory;
        if (mainCategoryExists) {
          console.log(`⚠️  Main category "${mainCategoryData.name}" already exists, skipping...`);
          mainCategory = mainCategoryExists;
          totalSkipped++;
        } else {
          mainCategory = await Category.create({
            name: mainCategoryData.name,
            slug: mainCategoryData.slug,
            description: mainCategoryData.description,
            featured: mainCategoryData.featured,
            order: mainCategoryData.order,
            parent: null
          });
          console.log(`✅ Created main category: "${mainCategoryData.name}"`);
          totalCreated++;
        }

        // Create subcategories
        if (mainCategoryData.subcategories) {
          for (const subCategoryData of mainCategoryData.subcategories) {
            try {
              const subCategoryExists = await Category.findOne({ 
                slug: subCategoryData.slug 
              });

              if (subCategoryExists) {
                console.log(`   ⚠️  Subcategory "${subCategoryData.name}" already exists, skipping...`);
                totalSkipped++;
              } else {
                await Category.create({
                  name: subCategoryData.name,
                  slug: subCategoryData.slug,
                  description: subCategoryData.description,
                  featured: false,
                  order: 0,
                  parent: mainCategory._id
                });
                console.log(`   ✅ Created subcategory: "${subCategoryData.name}"`);
                totalCreated++;
              }
            } catch (subError) {
              console.error(`   ❌ Error creating subcategory "${subCategoryData.name}": ${subError.message}`);
            }
          }
        }

        console.log(''); // Empty line for better readability
      } catch (mainError) {
        console.error(`❌ Error creating main category "${mainCategoryData.name}": ${mainError.message}`);
      }
    }

    console.log('🎉 Category creation completed!');
    console.log(`📊 Summary:`);
    console.log(`   ✅ Categories created: ${totalCreated}`);
    console.log(`   ⚠️  Categories skipped: ${totalSkipped}`);
    console.log(`   📁 Total categories processed: ${totalCreated + totalSkipped}`);

    // Close the connection
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB connection closed');
  } catch (error) {
    console.error(`❌ Error creating categories: ${error.message}`);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run the function
console.log('🏁 Starting automotive categories setup...\n');
createCategories(); 