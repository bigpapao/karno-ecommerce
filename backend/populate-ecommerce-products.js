import mongoose from 'mongoose';
import 'dotenv/config';
import Product from './src/models/product.model.js';
import Category from './src/models/category.model.js';
import Brand from './src/models/brand.model.js';
import VehicleModel from './src/models/VehicleModel.js';
import Manufacturer from './src/models/Manufacturer.js';

console.log('🏪 E-Commerce Products Population');
console.log('=================================');

// Enhanced e-commerce product data with better inventory management
const ecommerceProducts = [
  // Brake System Products
  {
    name: 'لنت ترمز جلو پراید - اصلی سایپا',
    nameEn: 'Pride Front Brake Pads - Original SAIPA',
    description: 'لنت ترمز جلو پراید با کیفیت اصلی سایپا. مقاوم در برابر حرارت و مناسب برای استفاده روزانه. دارای گواهی کیفیت و 12 ماه گارانتی.',
    price: 185000,
    discountPrice: 167000,
    costPrice: 145000, // For profit calculation
    category: 'brake-system',
    brand: 'saipa',
    sku: 'BRK-PRIDE-FRONT-SP001',
    barcode: '1234567890123',
    oemCodes: [
      { code: 'SP-96316684', manufacturer: 'SAIPA', type: 'original', verified: true },
      { code: 'SAIPA-BRK-F001', manufacturer: 'SAIPA', type: 'original', verified: true }
    ],
    crossReferences: [
      { brand: 'FERODO', partNumber: 'FDB1234', compatibilityLevel: 'exact', notes: 'آفترمارکت معتبر' },
      { brand: 'BENDIX', partNumber: 'DB1567', compatibilityLevel: 'functional', notes: 'جایگزین مناسب' }
    ],
    images: [
      { url: '/uploads/products/brake-pride-front-main.jpg', alt: 'لنت ترمز جلو پراید - تصویر اصلی', isPrimary: true },
      { url: '/uploads/products/brake-pride-front-side.jpg', alt: 'لنت ترمز جلو پراید - نمای جانبی', isPrimary: false }
    ],
    specifications: [
      { name: 'Material', value: 'سرامیک', nameEn: 'Material', valueEn: 'Ceramic' },
      { name: 'Thickness', value: '12mm', nameEn: 'Thickness', valueEn: '12mm' },
      { name: 'Width', value: '45mm', nameEn: 'Width', valueEn: '45mm' },
      { name: 'Length', value: '105mm', nameEn: 'Length', valueEn: '105mm' },
      { name: 'Operating Temperature', value: '-40°C to +400°C', nameEn: 'Operating Temperature', valueEn: '-40°C to +400°C' }
    ],
    // Enhanced Vehicle Compatibility
    compatibleVehicles: [
      { manufacturer: 'سایپا', model: 'پراید 111', years: '1990-2018', engineSizes: ['1000cc'] },
      { manufacturer: 'سایپا', model: 'پراید 132', years: '1995-2018', engineSizes: ['1300cc'] }
    ],
    // Stock Management (using standard field)
    stock: 45,
    // Enhanced Inventory Management (for admin features)
    inventory: {
      inStock: true,
      stockQuantity: 45,
      minStockLevel: 10, // Reorder point
      maxStockLevel: 100,
      reorderQuantity: 50,
      supplier: 'سایپا یدک',
      supplierCode: 'SP-BRK-001',
      lastRestockDate: new Date('2024-01-15'),
      location: 'A-01-15' // Warehouse location
    },
    // Physical Properties
    weight: 0.85,
    dimensions: { length: 10.5, width: 4.5, height: 1.2 },
    // E-commerce Features
    featured: true,
    bestseller: false,
    newProduct: false,
    onSale: true,
    tags: ['لنت ترمز', 'پراید', 'جلو', 'اصلی', 'سایپا'],
    searchKeywords: ['لنت ترمز', 'پراید', 'جلو', 'brake pad', 'front', 'pride'],
    metaTitle: 'لنت ترمز جلو پراید اصلی - فروشگاه قطعات کارنو',
    metaDescription: 'لنت ترمز جلو پراید اصلی سایپا با بهترین کیفیت و قیمت. گارانتی 12 ماه و ارسال رایگان',
    // Admin Features
    status: 'active',
    adminNotes: 'محصول پرفروش - موجودی را کنترل کنید',
    lastModified: new Date(),
    createdBy: 'admin'
  },

  {
    name: 'لنت ترمز عقب پژو 405 - اصلی ایران خودرو',
    nameEn: 'Peugeot 405 Rear Brake Pads - Original Iran Khodro',
    description: 'لنت ترمز عقب پژو 405 با استاندارد اروپایی. کیفیت اصلی ایران خودرو با مقاومت بالا و عمر طولانی. مناسب برای تمام مدل‌های 405.',
    price: 225000,
    discountPrice: 205000,
    costPrice: 170000,
    category: 'brake-system',
    brand: 'iran-khodro',
    sku: 'BRK-405-REAR-IK001',
    barcode: '1234567890124',
    oemCodes: [
      { code: 'PG-4251A6', manufacturer: 'Peugeot', type: 'original', verified: true },
      { code: 'IKCO-BRK-R405', manufacturer: 'Iran Khodro', type: 'original', verified: true }
    ],
    crossReferences: [
      { brand: 'FERODO', partNumber: 'FDB4567', compatibilityLevel: 'exact', notes: 'جایگزین اصلی' },
      { brand: 'TRW', partNumber: 'GDB1890', compatibilityLevel: 'functional', notes: 'کیفیت اروپایی' }
    ],
    images: [
      { url: '/uploads/products/brake-405-rear-main.jpg', alt: 'لنت ترمز عقب پژو 405', isPrimary: true }
    ],
    specifications: [
      { name: 'Material', value: 'سرامیک', nameEn: 'Material', valueEn: 'Ceramic' },
      { name: 'Thickness', value: '14mm', nameEn: 'Thickness', valueEn: '14mm' },
      { name: 'Standard', value: 'ECE R90', nameEn: 'Standard', valueEn: 'ECE R90' }
    ],
    compatibleVehicles: [
      { manufacturer: 'ایران‌خودرو', model: 'پژو 405', years: '1993-2010', engineSizes: ['1600cc', '1800cc'] }
    ],
    stock: 32,
    inventory: {
      inStock: true,
      stockQuantity: 32,
      minStockLevel: 8,
      maxStockLevel: 80,
      reorderQuantity: 40,
      supplier: 'ایران خودرو یدک',
      supplierCode: 'IK-BRK-405R',
      lastRestockDate: new Date('2024-01-10'),
      location: 'A-02-08'
    },
    weight: 1.1,
    dimensions: { length: 11.5, width: 5.0, height: 1.4 },
    featured: false,
    bestseller: true,
    newProduct: false,
    onSale: true,
    tags: ['لنت ترمز', 'پژو', '405', 'عقب', 'اصلی'],
    searchKeywords: ['لنت ترمز', 'پژو', '405', 'عقب', 'brake pad', 'rear'],
    metaTitle: 'لنت ترمز عقب پژو 405 اصلی - قطعات کارنو',
    metaDescription: 'لنت ترمز عقب پژو 405 اصلی ایران خودرو. کیفیت اروپایی، گارانتی معتبر',
    status: 'active',
    adminNotes: 'محصول پرفروش 405',
    lastModified: new Date()
  },

  // Engine Parts
  {
    name: 'فیلتر روغن پراید - اصلی سایپا',
    nameEn: 'Pride Oil Filter - Original SAIPA',
    description: 'فیلتر روغن موتور پراید اصلی سایپا. فیلتراسیون بهینه و حفاظت کامل از موتور. مناسب برای تمام مدل‌های پراید.',
    price: 48000,
    discountPrice: 43000,
    costPrice: 35000,
    category: 'engine-parts',
    brand: 'saipa',
    sku: 'ENG-PRIDE-FILTER-SP001',
    barcode: '1234567890125',
    oemCodes: [
      { code: 'SP-15208-43G00', manufacturer: 'SAIPA', type: 'original', verified: true }
    ],
    crossReferences: [
      { brand: 'MANN', partNumber: 'W712/75', compatibilityLevel: 'exact', notes: 'فیلتر آلمانی معتبر' },
      { brand: 'BOSCH', partNumber: '0451103316', compatibilityLevel: 'functional', notes: 'کیفیت اروپایی' }
    ],
    images: [
      { url: '/uploads/products/oil-filter-pride-main.jpg', alt: 'فیلتر روغن پراید', isPrimary: true }
    ],
    specifications: [
      { name: 'Filter Type', value: 'Full Flow', nameEn: 'Filter Type', valueEn: 'Full Flow' },
      { name: 'Thread Size', value: '3/4-16 UNF', nameEn: 'Thread Size', valueEn: '3/4-16 UNF' },
      { name: 'Gasket Diameter', value: '71mm', nameEn: 'Gasket Diameter', valueEn: '71mm' },
      { name: 'Filter Media', value: 'Paper', nameEn: 'Filter Media', valueEn: 'Paper' }
    ],
    compatibleVehicles: [
      { manufacturer: 'سایپا', model: 'پراید 111', years: '1990-2018', engineSizes: ['1000cc'] },
      { manufacturer: 'سایپا', model: 'پراید 132', years: '1995-2018', engineSizes: ['1300cc'] },
      { manufacturer: 'سایپا', model: 'پراید 151 (وانت)', years: '1998-2018', engineSizes: ['1500cc'] }
    ],
    stock: 120,
    inventory: {
      inStock: true,
      stockQuantity: 120,
      minStockLevel: 25,
      maxStockLevel: 200,
      reorderQuantity: 100,
      supplier: 'سایپا یدک',
      supplierCode: 'SP-FILTER-001',
      lastRestockDate: new Date('2024-01-12'),
      location: 'B-01-05'
    },
    weight: 0.3,
    dimensions: { length: 8.5, width: 8.5, height: 8.5 },
    featured: false,
    bestseller: true,
    newProduct: false,
    onSale: false,
    tags: ['فیلتر روغن', 'پراید', 'موتور', 'اصلی'],
    searchKeywords: ['فیلتر روغن', 'پراید', 'موتور', 'oil filter', 'engine'],
    metaTitle: 'فیلتر روغن پراید اصلی سایپا - فروشگاه کارنو',
    metaDescription: 'فیلتر روغن پراید اصلی سایپا. کیفیت تضمینی و عمر طولانی موتور',
    status: 'active',
    adminNotes: 'محصول ضروری - همیشه موجود باشد',
    lastModified: new Date()
  },

  // Battery
  {
    name: 'باتری 60 آمپر وارتا - آلمان',
    nameEn: 'Varta 60Ah Battery - Germany',
    description: 'باتری 60 آمپر وارتا آلمان. کیفیت اروپایی و دوام بالا. مناسب برای خودروهای سواری. گارانتی 24 ماه.',
    price: 1550000,
    discountPrice: 1450000,
    costPrice: 1200000,
    category: 'electrical-system',
    brand: 'varta',
    sku: 'ELEC-BATTERY-60A-VT001',
    barcode: '1234567890126',
    oemCodes: [
      { code: 'VARTA-A15', manufacturer: 'Varta', type: 'original', verified: true }
    ],
    crossReferences: [
      { brand: 'BOSCH', partNumber: 'S4025', compatibilityLevel: 'exact', notes: 'باتری آلمانی معادل' },
      { brand: 'YUASA', partNumber: 'YBX5068', compatibilityLevel: 'functional', notes: 'باتری ژاپنی معتبر' }
    ],
    images: [
      { url: '/uploads/products/battery-varta-60a-main.jpg', alt: 'باتری 60 آمپر وارتا', isPrimary: true }
    ],
    specifications: [
      { name: 'Voltage', value: '12V', nameEn: 'Voltage', valueEn: '12V' },
      { name: 'Capacity', value: '60Ah', nameEn: 'Capacity', valueEn: '60Ah' },
      { name: 'Cold Cranking Amps', value: '540A', nameEn: 'Cold Cranking Amps', valueEn: '540A' },
      { name: 'Technology', value: 'Lead Acid', nameEn: 'Technology', valueEn: 'Lead Acid' }
    ],
    compatibleVehicles: [
      { manufacturer: 'سایپا', model: 'پراید 111', years: '1990-2018', engineSizes: ['1000cc'] },
      { manufacturer: 'سایپا', model: 'پراید 132', years: '1995-2018', engineSizes: ['1300cc'] },
      { manufacturer: 'ایران‌خودرو', model: 'پژو 405', years: '1993-2010', engineSizes: ['1600cc'] },
      { manufacturer: 'ایران‌خودرو', model: 'سمند', years: '2002-2017', engineSizes: ['1800cc'] }
    ],
    stock: 15,
    inventory: {
      inStock: true,
      stockQuantity: 15,
      minStockLevel: 5,
      maxStockLevel: 30,
      reorderQuantity: 20,
      supplier: 'وارتا ایران',
      supplierCode: 'VT-60A-001',
      lastRestockDate: new Date('2024-01-08'),
      location: 'C-01-01'
    },
    weight: 15.2,
    dimensions: { length: 24.2, width: 17.5, height: 19.0 },
    featured: true,
    bestseller: false,
    newProduct: false,
    onSale: true,
    tags: ['باتری', 'وارتا', '60 آمپر', 'آلمان'],
    searchKeywords: ['باتری', 'وارتا', '60 آمپر', 'battery', 'varta', '12v'],
    metaTitle: 'باتری 60 آمپر وارتا آلمان - کارنو',
    metaDescription: 'باتری 60 آمپر وارتا آلمان با گارانتی 24 ماه. کیفیت اروپایی و قیمت مناسب',
    status: 'active',
    adminNotes: 'محصول گران قیمت - بررسی موجودی',
    lastModified: new Date()
  }
];

// Helper function to create categories
const createCategories = async () => {
  const categories = [
    {
      name: 'سیستم ترمز',
      nameEn: 'Brake System',
      slug: 'brake-system',
      description: 'قطعات سیستم ترمز خودرو شامل لنت، دیسک، کالیپر و...',
      image: { url: '/images/categories/brake-system.jpg', alt: 'سیستم ترمز' },
      order: 1
    },
    {
      name: 'قطعات موتور',
      nameEn: 'Engine Parts',
      slug: 'engine-parts',
      description: 'قطعات موتور شامل فیلتر روغن، شمع، تسمه تایم و...',
      image: { url: '/images/categories/engine-parts.jpg', alt: 'قطعات موتور' },
      order: 2
    },
    {
      name: 'سیستم برق',
      nameEn: 'Electrical System',
      slug: 'electrical-system',
      description: 'قطعات برقی خودرو شامل باتری، دینام، استارت و...',
      image: { url: '/images/categories/electrical-system.jpg', alt: 'سیستم برق' },
      order: 3
    }
  ];

  for (const categoryData of categories) {
    const existingCategory = await Category.findOne({ slug: categoryData.slug });
    if (!existingCategory) {
      await Category.create(categoryData);
      console.log(`✅ Created category: ${categoryData.name}`);
    }
  }
};

// Helper function to create brands
const createBrands = async () => {
  const brands = [
    {
      name: 'سایپا',
      nameEn: 'SAIPA',
      slug: 'saipa',
      description: 'قطعات اصلی سایپا',
      logo: { url: '/images/brands/saipa.jpg', alt: 'سایپا' },
      country: 'ایران',
      order: 1
    },
    {
      name: 'ایران خودرو',
      nameEn: 'Iran Khodro',
      slug: 'iran-khodro',
      description: 'قطعات اصلی ایران خودرو',
      logo: { url: '/images/brands/iran-khodro.jpg', alt: 'ایران خودرو' },
      country: 'ایران',
      order: 2
    },
    {
      name: 'وارتا',
      nameEn: 'Varta',
      slug: 'varta',
      description: 'باتری آلمانی وارتا',
      logo: { url: '/images/brands/varta.jpg', alt: 'وارتا' },
      country: 'آلمان',
      order: 3
    }
  ];

  for (const brandData of brands) {
    const existingBrand = await Brand.findOne({ slug: brandData.slug });
    if (!existingBrand) {
      await Brand.create(brandData);
      console.log(`✅ Created brand: ${brandData.name}`);
    }
  }
};

// Main population function
const populateEcommerceProducts = async () => {
  try {
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/karno');
    console.log('✅ Connected to MongoDB\n');

    console.log('🏷️ Setting up categories and brands...');
    await createCategories();
    await createBrands();
    console.log('✅ Categories and brands ready\n');

    console.log('🛍️ Adding e-commerce products...');
    let addedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const productData of ecommerceProducts) {
      try {
        // Check if product already exists (by SKU)
        const existingProduct = await Product.findOne({ sku: productData.sku });
        if (existingProduct) {
          console.log(`⏭️  Skipped: ${productData.name} (SKU exists)`);
          skippedCount++;
          continue;
        }

        // Find category and brand
        const category = await Category.findOne({ slug: productData.category });
        const brand = await Brand.findOne({ slug: productData.brand });

        // Create slug from name
        const slug = productData.name
          .toLowerCase()
          .replace(/[^\w\s\u0600-\u06FF-]/g, '') // Keep Persian characters
          .replace(/\s+/g, '-')
          .replace(/--+/g, '-')
          .trim();

        // Create enhanced product
        const product = new Product({
          ...productData,
          slug,
          category: category?._id,
          brand: brand?._id,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          // Enhanced e-commerce fields
          profitMargin: ((productData.price - productData.costPrice) / productData.costPrice * 100).toFixed(2),
          discountPercentage: productData.discountPrice ? 
            (((productData.price - productData.discountPrice) / productData.price) * 100).toFixed(2) : 0
        });

        await product.save();
        console.log(`✅ Added: ${productData.name}`);
        addedCount++;

      } catch (error) {
        console.log(`❌ Error adding ${productData.name}: ${error.message}`);
        errorCount++;
      }
    }

    console.log('\n🎉 E-commerce products population completed!');
    console.log(`📊 Summary:`);
    console.log(`   ✅ Added: ${addedCount} products`);
    console.log(`   ⏭️  Skipped: ${skippedCount} products`);
    console.log(`   ❌ Errors: ${errorCount} products`);

    // Enhanced database summary
    const totalProducts = await Product.countDocuments();
    const activeProducts = await Product.countDocuments({ status: 'active' });
    const featuredProducts = await Product.countDocuments({ featured: true });
    const onSaleProducts = await Product.countDocuments({ onSale: true });

    console.log(`\n📈 Database Statistics:`);
    console.log(`   🛍️  Total Products: ${totalProducts}`);
    console.log(`   ✅ Active Products: ${activeProducts}`);
    console.log(`   ⭐ Featured Products: ${featuredProducts}`);
    console.log(`   🏷️  On Sale Products: ${onSaleProducts}`);

    // Inventory alerts
    const lowStockProducts = await Product.find({
      'inventory.stockQuantity': { $lte: '$inventory.minStockLevel' }
    }).select('name inventory.stockQuantity inventory.minStockLevel');

    if (lowStockProducts.length > 0) {
      console.log(`\n⚠️  Low Stock Alerts:`);
      lowStockProducts.forEach(product => {
        console.log(`   📦 ${product.name}: ${product.inventory.stockQuantity} (min: ${product.inventory.minStockLevel})`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
};

// Run the enhanced e-commerce population
populateEcommerceProducts(); 