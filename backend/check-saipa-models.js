import mongoose from 'mongoose';
import 'dotenv/config';
import VehicleModel from './src/models/VehicleModel.js';
import Manufacturer from './src/models/Manufacturer.js';

const checkSaipaModels = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/karno');

    const saipa = await Manufacturer.findOne({ slug: 'saipa' });
    if (saipa) {
      const models = await VehicleModel.find({ manufacturer: saipa._id }).select('name nameEn category engine year');
      console.log('Currently imported SAIPA models:');
      models.forEach((m, i) => {
        console.log(`${i+1}. ${m.name} (${m.nameEn || 'N/A'}) - ${m.category || 'N/A'} - ${m.engine || 'N/A'}`);
      });
      console.log(`\nTotal: ${models.length} models`);
      
      // Your original requested models
      const requestedModels = [
        'کوییک', 'کوییک R', 'کوییک S', 'کوییک اتوماتیک',
        'پراید 111', 'پراید 131', 'پراید 132', 'پراید 141', 'پراید 151 (وانت)',
        'سایپا نسیم', 'سایپا صبا', 'تیبا', 'تیبا 2', 'ساینا', 'ساینا S', 'شاهین',
        'سایپا اطلس', 'سایپا اطلس پلاس', 'سایپا اطلس GT', 'سایپا اطلس S', 'سایپا اطلس R',
        'سایپا اطلس X', 'سایپا اطلس LX', 'سایپا اطلس EX', 'سایپا اطلس SE', 'سایپا اطلس LE',
        'سایپا اطلس GLX', 'سایپا اطلس SLX', 'سایپا اطلس ELX', 'سایپا اطلس GTI', 'سایپا اطلس GTR',
        'ساینا GX-L', 'ساینا GX-L دوگانه سوز', 'ساینا اتوماتیک S', 'کوییک GX-L', 'کوییک R تیپ GX-L',
        'کوییک اتوماتیک با سیستم کنترل کشش ESC', 'شاهین G', 'شاهین GL', 'شاهین CVT اتوماتیک',
        'شاهین پلاس اتوماتیک', 'وانت نیسان زامیاد بنزینی', 'وانت نیسان زامیاد دیزلی',
        'وانت نیسان زامیاد دوگانه سوز', 'وانت شوکا بنزینی', 'وانت شوکا دوگانه سوز', 'زامیاد زاگرس'
      ];
      
      console.log(`\n📋 You requested ${requestedModels.length} models total`);
      console.log(`✅ Currently imported: ${models.length} models`);
      console.log(`⏳ Missing: ${requestedModels.length - models.length} models`);
      
      if (models.length < requestedModels.length) {
        console.log('\n❌ Not all models are imported yet.');
      } else {
        console.log('\n✅ All models appear to be imported!');
      }
      
    } else {
      console.log('SAIPA manufacturer not found');
    }

    mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    mongoose.disconnect();
  }
};

checkSaipaModels(); 