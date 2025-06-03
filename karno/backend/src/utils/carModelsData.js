// Shared car models data for consistency across the application
export const carModelsData = [
  // سایپا
  {
    id: 'pride_111',
    numericId: 1,
    name: 'پراید 111',
    nameEn: 'Pride 111',
    brand: 'سایپا',
    brandId: 1,
    image: '/images/models/pride111.jpg',
    year: '1398-1401',
    engine: '1.3 لیتر',
    partsCount: 450,
    popular: true,
    description: 'پراید 111 یکی از پرفروش‌ترین خودروهای ایران با قطعات فراوان در بازار است.',
    category: 'هاچبک',
  },
  {
    id: 'pride_131',
    numericId: 2,
    name: 'پراید 131',
    nameEn: 'Pride 131',
    brand: 'سایپا',
    brandId: 1,
    image: '/images/models/pride131.jpg',
    year: '1395-1399',
    engine: '1.3 لیتر',
    partsCount: 480,
    popular: true,
    description: 'پراید 131 نسخه سدان پراید که به دلیل قیمت مناسب و قطعات در دسترس، همچنان پرطرفدار است.',
    category: 'سدان',
  },
  {
    id: 'tiba',
    numericId: 3,
    name: 'تیبا',
    nameEn: 'Tiba',
    brand: 'سایپا',
    brandId: 1,
    image: '/images/models/tiba.jpg',
    year: '1396-1402',
    engine: '1.5 لیتر',
    partsCount: 420,
    popular: true,
    description: 'تیبا جایگزین پراید در خط تولید سایپا با طراحی بهبود یافته و امکانات بیشتر.',
    category: 'سدان',
  },
  {
    id: 'quick',
    numericId: 4,
    name: 'کوییک',
    nameEn: 'Quick',
    brand: 'سایپا',
    brandId: 1,
    image: '/images/models/quick.jpg',
    year: '1397-1402',
    engine: '1.5 لیتر',
    partsCount: 380,
    popular: true,
    description: 'کوییک هاچبک اتوماتیک سایپا با طراحی مدرن و امکانات ایمنی بیشتر نسبت به سایر محصولات سایپا.',
    category: 'هاچبک',
  },
  {
    id: 'shahin',
    numericId: 5,
    name: 'شاهین',
    nameEn: 'Shahin',
    brand: 'سایپا',
    brandId: 1,
    image: '/images/models/shahin.jpg',
    year: '1400-1402',
    engine: '1.6 لیتر',
    partsCount: 320,
    popular: true,
    description: 'شاهین جدیدترین محصول سایپا با طراحی مدرن و پلتفرم جدید که جایگزین محصولات قدیمی سایپا شده است.',
    category: 'سدان',
  },
  
  // ایران خودرو
  {
    id: 'peugeot_206',
    numericId: 6,
    name: 'پژو 206',
    nameEn: 'Peugeot 206',
    brand: 'ایران خودرو',
    brandId: 2,
    image: '/images/models/206.jpg',
    year: '1385-1402',
    engine: '1.4 لیتر',
    partsCount: 520,
    popular: true,
    description: 'پژو 206 یکی از محبوب‌ترین خودروهای ایران با طراحی زیبا و عملکرد مناسب.',
    category: 'هاچبک',
  },
  {
    id: 'peugeot_pars',
    numericId: 7,
    name: 'پژو پارس',
    nameEn: 'Peugeot Pars',
    brand: 'ایران خودرو',
    brandId: 2,
    image: '/images/models/pars.jpg',
    year: '1390-1402',
    engine: '1.8 لیتر',
    partsCount: 490,
    popular: true,
    description: 'پژو پارس نسخه بهبود یافته پژو 405 با طراحی داخلی و خارجی متفاوت و امکانات بیشتر.',
    category: 'سدان',
  },
  {
    id: 'samand_lx',
    numericId: 8,
    name: 'سمند LX',
    nameEn: 'Samand LX',
    brand: 'ایران خودرو',
    brandId: 2,
    image: '/images/models/samand.jpg',
    year: '1388-1402',
    engine: '1.7 لیتر',
    partsCount: 470,
    popular: true,
    description: 'سمند اولین خودروی ملی ایران که توسط ایران خودرو طراحی و تولید شده است.',
    category: 'سدان',
  },
  {
    id: 'dena',
    numericId: 9,
    name: 'دنا',
    nameEn: 'Dena',
    brand: 'ایران خودرو',
    brandId: 2,
    image: '/images/models/dena.jpg',
    year: '1394-1402',
    engine: '1.7 لیتر',
    partsCount: 450,
    popular: true,
    description: 'دنا نسخه بهبود یافته سمند با طراحی مدرن‌تر و امکانات بیشتر.',
    category: 'سدان',
  },
  {
    id: 'runna',
    numericId: 10,
    name: 'رانا',
    nameEn: 'Runna',
    brand: 'ایران خودرو',
    brandId: 2,
    image: '/images/models/runna.jpg',
    year: '1392-1402',
    engine: '1.6 لیتر',
    partsCount: 430,
    popular: false,
    description: 'رانا ترکیبی از پلتفرم پژو 206 و طراحی جدید که توسط ایران خودرو تولید می‌شود.',
    category: 'سدان',
  },
];

// Group models by manufacturer for the CarSelector
export const carData = {
  manufacturers: [
    {
      id: 'saipa',
      name: 'سایپا',
      nameEn: 'SAIPA',
      logo: '/images/brands/saipa.png',
      models: carModelsData.filter(model => model.brand === 'سایپا')
    },
    {
      id: 'ikco',
      name: 'ایران خودرو',
      nameEn: 'IKCO',
      logo: '/images/brands/ikco.png',
      models: carModelsData.filter(model => model.brand === 'ایران خودرو')
    }
  ]
};

// Helper function to find model by ID
export const findModelById = (modelId) => {
  return carModelsData.find(model => model.id === modelId);
};

// Helper function to find model by numeric ID (for backward compatibility)
export const findModelByNumericId = (numericId) => {
  return carModelsData.find(model => model.numericId === parseInt(numericId));
}; 