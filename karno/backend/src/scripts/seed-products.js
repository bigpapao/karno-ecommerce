import mongoose from 'mongoose';
import Product from '../models/product.model.js';
import Category from '../models/category.model.js';
import Brand from '../models/brand.model.js';

// Sample categories
const sampleCategories = [
  {
    name: 'موتور',
    slug: 'motor',
    description: 'قطعات مربوط به موتور خودرو',
    isActive: true,
  },
  {
    name: 'ترمز',
    slug: 'brake',
    description: 'سیستم ترمز و قطعات مربوطه',
    isActive: true,
  },
  {
    name: 'برق خودرو',
    slug: 'electrical',
    description: 'سیستم برق و الکترونیک خودرو',
    isActive: true,
  },
  {
    name: 'سیستم تعلیق',
    slug: 'suspension',
    description: 'قطعات سیستم تعلیق و فنربندی',
    isActive: true,
  },
];

// Sample brands
const sampleBrands = [
  {
    name: 'سایپا',
    slug: 'saipa',
    description: 'شرکت سایپا - تولیدکننده خودروهای ایرانی',
    country: 'ایران',
    isActive: true,
    featured: true,
  },
  {
    name: 'ایران خودرو',
    slug: 'iran-khodro',
    description: 'شرکت ایران خودرو - بزرگترین خودروساز ایران',
    country: 'ایران',
    isActive: true,
    featured: true,
  },
  {
    name: 'MVM',
    slug: 'mvm',
    description: 'شرکت MVM - تولیدکننده خودروهای چینی در ایران',
    country: 'چین',
    isActive: true,
    featured: true,
  },
  {
    name: 'بهمن موتور',
    slug: 'bahman-motor',
    description: 'شرکت بهمن موتور - تولیدکننده خودروهای تجاری',
    country: 'ایران',
    isActive: true,
    featured: true,
  },
];

// Sample products
const createSampleProducts = (categories, brands) => [
  {
    name: 'فیلتر روغن سایپا پراید',
    slug: 'filter-oil-saipa-pride',
    description: 'فیلتر روغن با کیفیت بالا برای خودروهای سایپا پراید. این فیلتر از مواد با کیفیت ساخته شده و عمر مفید طولانی دارد.',
    price: 120000,
    discountPrice: 100000,
    category: categories.find(c => c.name === 'موتور')._id,
    brand: brands.find(b => b.name === 'سایپا')._id,
    stock: 45,
    sku: 'SAI-FIL-001',
    weight: 500,
    featured: true,
    specifications: [
      { name: 'نوع', value: 'فیلتر روغن' },
      { name: 'سازگاری', value: 'سایپا پراید، تیبا' },
      { name: 'مواد', value: 'کاغذ فیلتر با کیفیت' },
    ],
    compatibleVehicles: [
      { make: 'سایپا', model: 'پراید', year: 2020 },
      { make: 'سایپا', model: 'تیبا', year: 2019 },
      { make: 'سایپا', model: 'ساینا', year: 2018 },
    ],
    images: [
      { url: '/images/products/filter-saipa.jpg', alt: 'فیلتر روغن سایپا' }
    ],
  },
  {
    name: 'لنت ترمز پژو 206',
    slug: 'brake-pad-peugeot-206',
    description: 'لنت ترمز با کیفیت اروپایی برای ایمنی بیشتر. مناسب برای خودروهای پژو تولید ایران خودرو با عملکرد عالی در شرایط مختلف جوی.',
    price: 250000,
    discountPrice: null,
    category: categories.find(c => c.name === 'ترمز')._id,
    brand: brands.find(b => b.name === 'ایران خودرو')._id,
    stock: 32,
    sku: 'IKC-BRK-002',
    weight: 800,
    featured: false,
    specifications: [
      { name: 'نوع', value: 'لنت ترمز جلو' },
      { name: 'مواد', value: 'سرامیک' },
      { name: 'کیفیت', value: 'اروپایی' },
    ],
    compatibleVehicles: [
      { make: 'ایران خودرو', model: 'پژو 206', year: 2018 },
      { make: 'ایران خودرو', model: 'پژو 207', year: 2019 },
    ],
    images: [
      { url: '/images/products/brake-peugeot.jpg', alt: 'لنت ترمز پژو' }
    ],
  },
  {
    name: 'روغن موتور ایرانول',
    slug: 'engine-oil-iranol',
    description: 'روغن موتور با فرمولاسیون پیشرفته برای محافظت بهتر از موتور. مناسب برای موتورهای بنزینی خودروهای ایرانی.',
    price: 180000,
    discountPrice: 160000,
    category: categories.find(c => c.name === 'موتور')._id,
    brand: brands.find(b => b.name === 'سایپا')._id,
    stock: 78,
    sku: 'IRN-OIL-003',
    weight: 4000,
    featured: true,
    specifications: [
      { name: 'نوع', value: 'روغن موتور' },
      { name: 'ویسکوزیته', value: '5W-30' },
      { name: 'حجم', value: '4 لیتر' },
    ],
    compatibleVehicles: [
      { make: 'سایپا', model: 'پراید', year: 2020 },
      { make: 'ایران خودرو', model: 'سمند', year: 2019 },
    ],
    images: [
      { url: '/images/products/oil-iranol.jpg', alt: 'روغن موتور ایرانول' }
    ],
  },
  {
    name: 'باتری MVM X33',
    slug: 'battery-mvm-x33',
    description: 'باتری خودرو با کیفیت مناسب برای خودروهای MVM. دارای گارانتی 18 ماهه و عملکرد مطمئن در شرایط مختلف آب و هوایی.',
    price: 1200000,
    discountPrice: 1100000,
    category: categories.find(c => c.name === 'برق خودرو')._id,
    brand: brands.find(b => b.name === 'MVM')._id,
    stock: 15,
    sku: 'MVM-BAT-004',
    weight: 15000,
    featured: false,
    specifications: [
      { name: 'نوع', value: 'باتری اسیدی' },
      { name: 'ظرفیت', value: '60 آمپر ساعت' },
      { name: 'ولتاژ', value: '12 ولت' },
      { name: 'گارانتی', value: '18 ماه' },
    ],
    compatibleVehicles: [
      { make: 'MVM', model: 'X33', year: 2018 },
      { make: 'MVM', model: '315', year: 2019 },
    ],
    images: [
      { url: '/images/products/battery-mvm.jpg', alt: 'باتری MVM' }
    ],
  },
  {
    name: 'کمک فنر بهمن موتور',
    slug: 'shock-absorber-bahman-motor',
    description: 'کمک فنر با کیفیت ایرانی برای راحتی بیشتر در رانندگی. مناسب برای خودروهای تجاری بهمن موتور با دوام بالا.',
    price: 850000,
    discountPrice: null,
    category: categories.find(c => c.name === 'سیستم تعلیق')._id,
    brand: brands.find(b => b.name === 'بهمن موتور')._id,
    stock: 8,
    sku: 'BHM-SUS-005',
    weight: 2500,
    featured: true,
    specifications: [
      { name: 'نوع', value: 'کمک فنر جلو' },
      { name: 'مواد', value: 'فولاد با کیفیت' },
      { name: 'کیفیت', value: 'ایرانی' },
    ],
    compatibleVehicles: [
      { make: 'بهمن موتور', model: 'بهمن دیزل', year: 2018 },
      { make: 'بهمن موتور', model: 'مزدا', year: 2019 },
    ],
    images: [
      { url: '/images/products/shock-bahman.jpg', alt: 'کمک فنر بهمن موتور' }
    ],
  },
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/karno';
    await mongoose.connect(mongoUri);
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

    // Create products
    const sampleProducts = createSampleProducts(createdCategories, createdBrands);
    const createdProducts = await Product.insertMany(sampleProducts);
    console.log(`Created ${createdProducts.length} products`);

    console.log('Database seeded successfully!');
    console.log('\nSample data created:');
    console.log('- Categories:', createdCategories.map(c => c.name).join(', '));
    console.log('- Brands:', createdBrands.map(b => b.name).join(', '));
    console.log('- Products:', createdProducts.map(p => p.name).join(', '));

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the seeding function
seedDatabase(); 