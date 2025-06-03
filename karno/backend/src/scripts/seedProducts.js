import mongoose from 'mongoose';
import { connectDB } from '../config/database.js';

// Import models
import Manufacturer from '../models/Manufacturer.js';
import VehicleModel from '../models/VehicleModel.js';

// Define Product schema (this should match your actual product model)
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String },
  price: { type: Number, required: true },
  originalPrice: { type: Number },
  discount: { type: Number, default: 0 },
  images: [{ type: String }],
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  brand: { type: String },
  sku: { type: String, unique: true },
  stock: { type: Number, default: 0 },
  featured: { type: Boolean, default: false },
  status: { type: String, enum: ['active', 'inactive', 'out-of-stock'], default: 'active' },
  rating: { type: Number, default: 0 },
  numReviews: { type: Number, default: 0 },
  compatibleVehicles: [{
    modelId: { type: mongoose.Schema.Types.ObjectId, ref: 'VehicleModel' },
    manufacturer: { type: String },
    model: { type: String },
    year: { type: String }
  }]
}, {
  timestamps: true
});

const Product = mongoose.model('Product', productSchema);

const seedProducts = async () => {
  try {
    console.log('🚀 Starting product database seeding...');
    
    // Connect to database
    await connectDB();
    
    // Get all vehicle models
    const vehicleModels = await VehicleModel.find({ isActive: true });
    console.log(`📋 Found ${vehicleModels.length} vehicle models`);
    
    if (vehicleModels.length === 0) {
      console.log('❌ No vehicle models found. Please run vehicle seeder first.');
      process.exit(1);
    }
    
    // Clear existing products
    console.log('🗑️  Clearing existing products...');
    await Product.deleteMany({});
    
    // Define product categories and sample products
    const productsData = [
      // Air Filters
      {
        name: 'فیلتر هوا پراید',
        slug: 'air-filter-pride',
        description: 'فیلتر هوای اصل با کیفیت بالا مناسب برای خودروهای پراید',
        price: 250000,
        originalPrice: 300000,
        images: ['/images/products/air-filter-pride.jpg'],
        brand: 'فراز',
        sku: 'AF-PRIDE-001',
        stock: 50,
        featured: true,
        rating: 4.5,
        numReviews: 23,
        compatibleModels: ['pride_111', 'pride_131']
      },
      {
        name: 'فیلتر هوا ساینا',
        slug: 'air-filter-saina',
        description: 'فیلتر هوای اصل برای ساینا با گارانتی یک ساله',
        price: 280000,
        originalPrice: 320000,
        images: ['/images/products/air-filter-saina.jpg'],
        brand: 'بهران',
        sku: 'AF-SAINA-001',
        stock: 30,
        featured: false,
        rating: 4.2,
        numReviews: 18,
        compatibleModels: ['saina']
      },
      
      // Oil Filters
      {
        name: 'فیلتر روغن پراید',
        slug: 'oil-filter-pride',
        description: 'فیلتر روغن اصل پراید با کیفیت اروپایی',
        price: 180000,
        originalPrice: 220000,
        images: ['/images/products/oil-filter-pride.jpg'],
        brand: 'ای بی سی',
        sku: 'OF-PRIDE-001',
        stock: 75,
        featured: true,
        rating: 4.8,
        numReviews: 45,
        compatibleModels: ['pride_111', 'pride_131']
      },
      {
        name: 'فیلتر روغن تیبا',
        slug: 'oil-filter-tiba',
        description: 'فیلتر روغن مخصوص تیبا با تکنولوژی پیشرفته',
        price: 200000,
        originalPrice: 240000,
        images: ['/images/products/oil-filter-tiba.jpg'],
        brand: 'فراز',
        sku: 'OF-TIBA-001',
        stock: 40,
        featured: false,
        rating: 4.3,
        numReviews: 12,
        compatibleModels: ['tiba', 'tiba_2']
      },
      
      // Brake Pads
      {
        name: 'لنت ترمز جلو پراید',
        slug: 'brake-pads-front-pride',
        description: 'لنت ترمز جلو اصل پراید با عمر بالا و کیفیت اروپایی',
        price: 450000,
        originalPrice: 500000,
        images: ['/images/products/brake-pads-pride.jpg'],
        brand: 'ای بی سی',
        sku: 'BP-PRIDE-F-001',
        stock: 25,
        featured: true,
        rating: 4.9,
        numReviews: 67,
        compatibleModels: ['pride_111', 'pride_131']
      },
      {
        name: 'لنت ترمز عقب ساینا',
        slug: 'brake-pads-rear-saina',
        description: 'لنت ترمز عقب ساینا با تکنولوژی ضد صدا',
        price: 380000,
        originalPrice: 420000,
        images: ['/images/products/brake-pads-saina.jpg'],
        brand: 'بهران',
        sku: 'BP-SAINA-R-001',
        stock: 20,
        featured: false,
        rating: 4.4,
        numReviews: 34,
        compatibleModels: ['saina']
      },
      
      // Spark Plugs
      {
        name: 'شمع پراید دوگانه سوز',
        slug: 'spark-plug-pride-cng',
        description: 'شمع مخصوص پراید دوگانه سوز با مقاومت بالا',
        price: 120000,
        originalPrice: 150000,
        images: ['/images/products/spark-plug-pride.jpg'],
        brand: 'بوش',
        sku: 'SP-PRIDE-CNG-001',
        stock: 100,
        featured: true,
        rating: 4.6,
        numReviews: 89,
        compatibleModels: ['pride_111', 'pride_131']
      },
      {
        name: 'شمع ساماند',
        slug: 'spark-plug-samand',
        description: 'شمع اصل ساماند با تکنولوژی پلاتینیوم',
        price: 150000,
        originalPrice: 180000,
        images: ['/images/products/spark-plug-samand.jpg'],
        brand: 'بوش',
        sku: 'SP-SAMAND-001',
        stock: 60,
        featured: false,
        rating: 4.7,
        numReviews: 56,
        compatibleModels: ['samand', 'samand_lx']
      },
      
      // Belts
      {
        name: 'تسمه تایم پراید',
        slug: 'timing-belt-pride',
        description: 'تسمه تایم اصل پراید با گارانتی دو ساله',
        price: 350000,
        originalPrice: 400000,
        images: ['/images/products/timing-belt-pride.jpg'],
        brand: 'گیتس',
        sku: 'TB-PRIDE-001',
        stock: 35,
        featured: true,
        rating: 4.8,
        numReviews: 123,
        compatibleModels: ['pride_111', 'pride_131']
      },
      {
        name: 'تسمه دینام ساینا',
        slug: 'alternator-belt-saina',
        description: 'تسمه دینام ساینا با مقاومت بالا در برابر حرارت',
        price: 180000,
        originalPrice: 220000,
        images: ['/images/products/alternator-belt-saina.jpg'],
        brand: 'کانتی',
        sku: 'AB-SAINA-001',
        stock: 45,
        featured: false,
        rating: 4.3,
        numReviews: 27,
        compatibleModels: ['saina']
      }
    ];
    
    // Create products with vehicle compatibility
    console.log('🛍️  Creating products...');
    const createdProducts = [];
    
    for (const productData of productsData) {
      const { compatibleModels, ...productInfo } = productData;
      
      // Find compatible vehicle models
      const compatibleVehicles = [];
      for (const modelSlug of compatibleModels) {
        const vehicleModel = vehicleModels.find(vm => vm.slug === modelSlug);
        if (vehicleModel) {
          compatibleVehicles.push({
            modelId: vehicleModel._id,
            manufacturer: vehicleModel.manufacturer.name,
            model: vehicleModel.name,
            year: vehicleModel.year
          });
        }
      }
      
      const product = await Product.create({
        ...productInfo,
        compatibleVehicles
      });
      
      createdProducts.push(product);
    }
    
    console.log(`✅ Created ${createdProducts.length} products`);
    
    // Log summary
    console.log('\n📊 Product Seeding Summary:');
    console.log(`• Total Products: ${createdProducts.length}`);
    console.log(`• Featured Products: ${createdProducts.filter(p => p.featured).length}`);
    console.log(`• Average Price: ${Math.round(createdProducts.reduce((sum, p) => sum + p.price, 0) / createdProducts.length).toLocaleString()} تومان`);
    
    // Show product-vehicle compatibility
    console.log('\n🚗 Vehicle Compatibility Summary:');
    const compatibilityStats = {};
    createdProducts.forEach(product => {
      product.compatibleVehicles.forEach(vehicle => {
        if (!compatibilityStats[vehicle.model]) {
          compatibilityStats[vehicle.model] = 0;
        }
        compatibilityStats[vehicle.model]++;
      });
    });
    
    Object.entries(compatibilityStats).forEach(([model, count]) => {
      console.log(`• ${model}: ${count} products`);
    });
    
    console.log('\n🎉 Product seeding completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error seeding products:', error);
    process.exit(1);
  }
};

// Run the seeder
seedProducts(); 