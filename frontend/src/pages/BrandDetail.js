import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  Typography,
  Button,
  useTheme,
  useMediaQuery,
  IconButton,
  Breadcrumbs,
  Link,
  Tabs,
  Tab,
  Chip, // Used for country tags and common parts
} from '@mui/material';
import {
  FilterList as FilterIcon,
  NavigateNext as NavigateNextIcon,
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import FilterSidebar from '../components/FilterSidebar';

// Mock data - replace with API calls
const brandData = {
  // Iranian Car Brands
  saipa: {
    name: 'سایپا',
    logo: 'images/brands/Saipa_Logo.png',
    description:
      'قطعات اصلی و لوازم جانبی سایپا را برای خودروی خود پیدا کنید. ما مجموعه وسیعی از قطعات اصلی و آفتر مارکت را ارائه می‌دهیم تا خودروی سایپای شما در بهترین حالت خود کار کند.',
    country: 'ایران',
    foundedYear: 1345,
    headquarters: 'تهران، ایران',
    popularModels: ['پراید', 'تیبا', 'کوییک', 'ساینا', 'شاهین'],
    commonParts: [
      'فیلتر هوا', 'فیلتر روغن', 'لنت ترمز', 'شمع', 'قطعات سیستم تعلیق',
      'تسمه تایم', 'واتر پمپ', 'دینام', 'استارتر', 'رادیاتور'
    ],
    website: 'https://www.saipacorp.com',
  },
  irankhodro: {
    name: 'ایران خودرو',
    logo: 'images/brands/iran-khodro-logo.png',
    description:
      'قطعات و لوازم جانبی اصلی ایران خودرو را خریداری کنید. ما مجموعه کاملی از قطعات اصلی و آفتر مارکت را برای خودروهای ایران خودرو ارائه می‌دهیم.',
    country: 'ایران',
    foundedYear: 1341,
    headquarters: 'تهران، ایران',
    popularModels: ['سمند', 'دنا', 'رانا', 'پژو پارس', 'پژو 207', 'تارا'],
    commonParts: [
      'قطعات موتور', 'قطعات گیربکس', 'سیستم‌های الکتریکی', 'سیستم‌های خنک‌کننده',
      'قطعات ترمز', 'قطعات سیستم تعلیق', 'پنل‌های بدنه', 'لوازم جانبی داخلی',
      'سیستم‌های روشنایی', 'قطعات سیستم سوخت'
    ],
    website: 'https://www.ikco.ir',
  },
  mvm: {
    name: 'ام وی ام',
    logo: 'images/brands/MVM_logo.png',
    description:
      'قطعات مناسب خودروهای ام وی ام (مدیران خودرو) را برای خودروی خود پیدا کنید. انتخاب ما شامل قطعات اصلی و سازگار برای تمامی مدل‌های ام وی ام است.',
    country: 'ایران',
    foundedYear: 1386,
    headquarters: 'تهران، ایران',
    popularModels: ['ام وی ام 110', 'ام وی ام 315', 'ام وی ام 550', 'ام وی ام X22', 'ام وی ام X33'],
    commonParts: [
      'قطعات سیستم تهویه', 'سیستم‌های ترمز', 'مجموعه‌های کلاچ', 'تسمه‌ها',
      'دسته موتور', 'فیلترها', 'واشرها', 'قطعات سیستم جرقه', 'سنسورها', 'قطعات فرمان'
    ],
    website: 'https://www.mvmco.ir',
  },
  bahmanmotor: {
    name: 'بهمن موتور',
    logo: 'images/brands/Bahman_motor_Logo.png',
    description:
      'قطعات با کیفیت بهمن موتور را برای تمامی مدل‌ها کشف کنید. موجودی گسترده ما شامل همه چیزهایی است که برای تعمیر و نگهداری نیاز دارید.',
    country: 'ایران',
    foundedYear: 1331,
    headquarters: 'تهران، ایران',
    popularModels: ['مزدا 3', 'کارا', 'کاپرا', 'شهاب'],
    commonParts: [
      'دینام', 'باتری', 'تسمه و شیلنگ', 'قطعات ترمز', 'قطعات کلاچ',
      'قطعات سیستم خنک‌کننده', 'قطعات موتور', 'قطعات اگزوز', 'فیلترها', 'قطعات سیستم تعلیق'
    ],
    website: 'https://www.bahman.ir',
  },
  
  // International Car Brands
  kia: {
    name: 'کیا',
    logo: '/images/brands/kia.png',
    description:
      'قطعات اصلی و لوازم جانبی کیا را برای خودروی خود پیدا کنید. ما مجموعه وسیعی از قطعات اصلی و آفتر مارکت را ارائه می‌دهیم تا خودروی کیای شما در بهترین حالت خود کار کند.',
    country: 'کره جنوبی',
    popularModels: ['اسپورتیج', 'سراتو', 'سورنتو', 'ریو'],
  },
  hyundai: {
    name: 'هیوندای',
    logo: '/images/brands/hyundai.png',
    description:
      'قطعات با کیفیت هیوندای را برای تمامی مدل‌ها کشف کنید. موجودی گسترده ما شامل همه چیزهایی است که برای تعمیر و نگهداری نیاز دارید.',
    country: 'کره جنوبی',
    popularModels: ['النترا', 'توسان', 'سانتافه', 'اکسنت'],
  },
  renault: {
    name: 'رنو',
    logo: '/images/brands/renault.png',
    description:
      'قطعات و لوازم جانبی اصلی رنو را خریداری کنید. ما مجموعه کاملی از قطعات اصلی و آفتر مارکت را برای خودروهای رنو ارائه می‌دهیم.',
    country: 'فرانسه',
    popularModels: ['داستر', 'لوگان', 'ساندرو', 'کپچر'],
  },
  geely: {
    name: 'جیلی',
    logo: '/images/brands/geely.png',
    description:
      'قطعات مناسب خودروهای جیلی را برای خودروی خود پیدا کنید. انتخاب ما شامل قطعات اصلی و سازگار برای تمامی مدل‌های جیلی است.',
    country: 'چین',
    popularModels: ['امگرند', 'کولری', 'اطلس', 'توگلا'],
  },
  toyota: {
    name: 'تویوتا',
    logo: '/images/brands/toyota.png',
    description:
      'مجموعه قطعات و لوازم جانبی تویوتا را مرور کنید. ما قطعات قابل اعتمادی ارائه می‌دهیم تا تویوتای شما بهترین عملکرد را داشته باشد.',
    country: 'ژاپن',
    popularModels: ['کمری', 'کرولا', 'راوفور', 'لندکروزر'],
  },
  honda: {
    name: 'هوندا',
    logo: '/images/brands/honda.png',
    description:
      'قطعات اصلی هوندا را برای خودروی خود تهیه کنید. موجودی ما شامل همه چیز از قطعات موتور تا قطعات بدنه است.',
    country: 'ژاپن',
    popularModels: ['سیویک', 'آکورد', 'سی‌آر‌وی', 'پایلوت'],
  },
  nissan: {
    name: 'نیسان',
    logo: '/images/brands/nissan.png',
    description:
      'قطعات و لوازم جانبی با کیفیت نیسان را خریداری کنید. همه چیزهایی که برای خودروی نیسان خود نیاز دارید را در یک مکان پیدا کنید.',
    country: 'ژاپن',
    popularModels: ['آلتیما', 'ماکسیما', 'روگ', 'پاث‌فایندر'],
  },
  bmw: {
    name: 'بی‌ام‌و',
    logo: '/images/brands/bmw.png',
    description:
      'قطعات و لوازم جانبی ممتاز بی‌ام‌و را کشف کنید. انتخاب ما شامل قطعات با کیفیت بالا برای تمامی سری‌های بی‌ام‌و است.',
    country: 'آلمان',
    popularModels: ['سری 3', 'سری 5', 'X3', 'X5'],
  },
};

const products = [
  // Saipa Products
  {
    id: 1,
    name: 'Saipa Pride Brake Pad Set',
    slug: 'saipa-pride-brake-pad-set',
    brand: 'Saipa',
    price: 45.99,
    discount: 15,
    rating: 4.2,
    reviewCount: 87,
    image: '/images/products/brake-pads.jpg',
    category: 'Brakes',
    model: 'Pride',
    compatibility: ['Pride 111', 'Pride 131', 'Pride 141'],
    inStock: true,
  },
  {
    id: 2,
    name: 'Saipa Tiba Air Filter',
    slug: 'saipa-tiba-air-filter',
    brand: 'Saipa',
    price: 18.50,
    discount: 0,
    rating: 4.0,
    reviewCount: 56,
    image: '/images/products/air-filter.jpg',
    category: 'Filters',
    model: 'Tiba',
    compatibility: ['Tiba', 'Tiba 2', 'Saina'],
    inStock: true,
  },
  {
    id: 3,
    name: 'Saipa Quick Shock Absorber Set',
    slug: 'saipa-quick-shock-absorber-set',
    brand: 'Saipa',
    price: 120.75,
    discount: 8,
    rating: 4.7,
    reviewCount: 42,
    image: '/images/products/shock-absorber.jpg',
    category: 'Suspension',
    model: 'Quick',
    compatibility: ['Quick', 'Quick MT'],
    inStock: true,
  },
  
  // Iran Khodro Products
  {
    id: 4,
    name: 'Iran Khodro Samand Timing Belt Kit',
    slug: 'iran-khodro-samand-timing-belt-kit',
    brand: 'Iran Khodro',
    price: 75.99,
    discount: 12,
    rating: 4.4,
    reviewCount: 103,
    image: '/images/products/timing-belt.jpg',
    category: 'Engine',
    model: 'Samand',
    compatibility: ['Samand LX', 'Samand EL', 'Samand Soren'],
    inStock: true,
  },
  {
    id: 5,
    name: 'Iran Khodro Dena Headlight Assembly',
    slug: 'iran-khodro-dena-headlight-assembly',
    brand: 'Iran Khodro',
    price: 135.50,
    discount: 5,
    rating: 4.8,
    reviewCount: 67,
    image: '/images/products/headlight.jpg',
    category: 'Lighting',
    model: 'Dena',
    compatibility: ['Dena', 'Dena+'],
    inStock: true,
  },
  
  // MVM Products
  {
    id: 6,
    name: 'MVM X22 Fuel Pump Assembly',
    slug: 'mvm-x22-fuel-pump-assembly',
    brand: 'MVM',
    price: 89.99,
    discount: 0,
    rating: 4.3,
    reviewCount: 38,
    image: '/images/products/fuel-pump.jpg',
    category: 'Fuel System',
    model: 'X22',
    compatibility: ['X22', 'X22 Pro'],
    inStock: true,
  },
  {
    id: 7,
    name: 'MVM 550 Clutch Kit',
    slug: 'mvm-550-clutch-kit',
    brand: 'MVM',
    price: 145.25,
    discount: 10,
    rating: 4.6,
    reviewCount: 52,
    image: '/images/products/clutch-kit.jpg',
    category: 'Transmission',
    model: '550',
    compatibility: ['550', '530'],
    inStock: true,
  },
  
  // Bahman Motor Products
  {
    id: 8,
    name: 'Bahman Mazda3 Alternator',
    slug: 'bahman-mazda3-alternator',
    brand: 'Bahman Motor',
    price: 175.99,
    discount: 15,
    rating: 4.7,
    reviewCount: 45,
    image: '/images/products/alternator.jpg',
    category: 'Electrical',
    model: 'Mazda3',
    compatibility: ['Mazda3', 'Mazda3 New'],
    inStock: true,
  },
  {
    id: 9,
    name: 'Bahman Cara Radiator',
    slug: 'bahman-cara-radiator',
    brand: 'Bahman Motor',
    price: 110.50,
    discount: 8,
    rating: 4.5,
    reviewCount: 33,
    image: '/images/products/radiator.jpg',
    category: 'Cooling System',
    model: 'Cara',
    compatibility: ['Cara', 'Cara 2000'],
    inStock: true,
  },
  
  // International Brand Products
  {
    id: 10,
    name: 'Kia Sportage Brake Pad Set',
    slug: 'kia-sportage-brake-pad-set',
    brand: 'Kia',
    price: 89.99,
    discount: 10,
    rating: 4.5,
    reviewCount: 128,
    image: '/images/products/brake-pads.jpg',
    category: 'Brakes',
    model: 'Sportage',
    inStock: true,
  },
];

const BrandDetail = () => {
  const { brandSlug } = useParams();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [filterOpen, setFilterOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState('all');
  const [filters, setFilters] = useState({
    category: [],
    price: [0, 1000],
    rating: 0,
    availability: 'all',
  });
  const [brandSpecificProducts, setBrandSpecificProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const brand = brandData[brandSlug] || {
    name: 'برند یافت نشد',
    logo: '',
    description: 'برندی که به دنبال آن هستید در حال حاضر در دسترس نیست.',
    popularModels: [],
  };

  // Enhanced product filtering logic
  useEffect(() => {
    setLoading(true);
    
    // Create mapping for brand name matching
    const brandNameMapping = {
      'saipa': ['Saipa', 'سایپا', 'saipa'],
      'irankhodro': ['Iran Khodro', 'ایران خودرو', 'irankhodro'],
      'mvm': ['MVM', 'ام وی ام', 'mvm'],
      'bahmanmotor': ['Bahman Motor', 'بهمن موتور', 'bahmanmotor']
    };
    
    const possibleBrandNames = brandNameMapping[brandSlug] || [brand.name];
    
    const brandProducts = products.filter((product) => 
      possibleBrandNames.some(brandName => 
        product.brand?.toLowerCase().includes(brandName.toLowerCase()) ||
        brandName.toLowerCase().includes(product.brand?.toLowerCase())
      )
    );
    
    setBrandSpecificProducts(brandProducts);
    setFilteredProducts(brandProducts);
    setLoading(false);
  }, [brandSlug, brand.name]);

  // Filter products based on current filters and tab
  useEffect(() => {
    let filtered = [...brandSpecificProducts];
    
    // Apply tab filter
    switch (currentTab) {
      case 'popular':
        filtered = filtered.filter(p => p.rating >= 4.0);
        break;
      case 'new':
        filtered = filtered.slice(-6); // Last 6 products as "new"
        break;
      case 'sale':
        filtered = filtered.filter(p => p.discount > 0);
        break;
      default:
        break;
    }
    
    // Apply category filter
    if (filters.category.length > 0) {
      filtered = filtered.filter(p => 
        filters.category.includes(p.category)
      );
    }
    
    // Apply price filter
    filtered = filtered.filter(p => 
      p.price >= filters.price[0] && p.price <= filters.price[1]
    );
    
    // Apply rating filter
    if (filters.rating > 0) {
      filtered = filtered.filter(p => p.rating >= filters.rating);
    }
    
    // Apply availability filter
    if (filters.availability === 'inStock') {
      filtered = filtered.filter(p => p.inStock);
    } else if (filters.availability === 'onSale') {
      filtered = filtered.filter(p => p.discount > 0);
    }
    
    setFilteredProducts(filtered);
  }, [brandSpecificProducts, currentTab, filters]);

  useEffect(() => {
    if (brand) {
      document.title = `${brand.name} | کارنو`;
    }
  }, [brand]);

  const handleFilterChange = (filterType, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      category: [],
      price: [0, 1000],
      rating: 0,
      availability: 'all',
    });
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs
        separator={<NavigateNextIcon fontSize="small" />}
        sx={{ mb: 3, direction: 'rtl' }}
      >
        <Link component={RouterLink} to="/" color="inherit">
          خانه
        </Link>
        <Link component={RouterLink} to="/brands" color="inherit">
          برندها
        </Link>
        <Typography color="text.primary">{brand.name}</Typography>
      </Breadcrumbs>

      {/* Brand Header */}
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={3}>
            <Box
              sx={{
                position: 'relative',
                overflow: 'hidden',
                borderRadius: 3,
                bgcolor: 'background.paper',
                boxShadow: 3,
                transition: 'transform 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6,
                }
              }}
            >
              {brand.logo ? (
                <Box
                  component="img"
                  src={brand.logo}
                  alt={brand.name}
                  sx={{
                    width: '100%',
                    maxHeight: 140,
                    objectFit: 'contain',
                    p: 3,
                    transition: 'transform 0.3s ease',
                    '&:hover': {
                      transform: 'scale(1.05)',
                    }
                  }}
                />
              ) : (
                <Box
                  sx={{
                    width: '100%',
                    height: 140,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'primary.light',
                    color: 'white',
                    borderRadius: 3,
                  }}
                >
                  <Typography variant="h6" fontWeight="bold">
                    {brand.name}
                  </Typography>
                </Box>
              )}
              {brand.country && (
                <Box sx={{ 
                  position: 'absolute',
                  bottom: 8,
                  right: 8,
                  bgcolor: 'primary.main',
                  color: 'white',
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 2,
                  fontSize: '0.75rem',
                  fontWeight: 'bold'
                }}>
                  ساخت {brand.country}
                </Box>
              )}
            </Box>
          </Grid>
          <Grid item xs={12} md={9}>
            <Box sx={{ 
              bgcolor: 'background.paper', 
              p: 3, 
              borderRadius: 3, 
              boxShadow: 2,
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Background Pattern */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: 200,
                  height: 200,
                  background: 'linear-gradient(45deg, rgba(25, 118, 210, 0.05) 0%, rgba(25, 118, 210, 0.02) 100%)',
                  borderRadius: '50%',
                  transform: 'translate(30%, -30%)'
                }}
              />
              
              <Typography variant="h4" component="h1" gutterBottom sx={{ 
                direction: 'rtl',
                fontWeight: 'bold',
                color: 'primary.main',
                position: 'relative',
                zIndex: 1
              }}>
                قطعات و لوازم جانبی {brand.name}
              </Typography>
              
              <Typography color="text.secondary" paragraph sx={{ 
                direction: 'rtl',
                fontSize: '1.1rem',
                lineHeight: 1.7,
                position: 'relative',
                zIndex: 1
              }}>
                {brand.description}
              </Typography>
              
              {/* Brand Stats */}
              <Box sx={{ 
                display: 'flex', 
                gap: 3, 
                mb: 3, 
                direction: 'rtl',
                flexWrap: 'wrap',
                position: 'relative',
                zIndex: 1
              }}>
                <Box sx={{ 
                  bgcolor: 'rgba(25, 118, 210, 0.1)', 
                  px: 2, 
                  py: 1, 
                  borderRadius: 2,
                  border: '1px solid rgba(25, 118, 210, 0.2)'
                }}>
                  <Typography variant="h6" color="primary.main" fontWeight="bold">
                    {loading ? '...' : brandSpecificProducts.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    محصول موجود
                  </Typography>
                </Box>
                
                {brand.popularModels && brand.popularModels.length > 0 && (
                  <Box sx={{ 
                    bgcolor: 'rgba(46, 125, 50, 0.1)', 
                    px: 2, 
                    py: 1, 
                    borderRadius: 2,
                    border: '1px solid rgba(46, 125, 50, 0.2)'
                  }}>
                    <Typography variant="h6" color="success.main" fontWeight="bold">
                      {brand.popularModels.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      مدل خودرو
                    </Typography>
                  </Box>
                )}
                
                {brand.foundedYear && (
                  <Box sx={{ 
                    bgcolor: 'rgba(237, 108, 2, 0.1)', 
                    px: 2, 
                    py: 1, 
                    borderRadius: 2,
                    border: '1px solid rgba(237, 108, 2, 0.2)'
                  }}>
                    <Typography variant="h6" color="warning.main" fontWeight="bold">
                      {new Date().getFullYear() - brand.foundedYear}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      سال سابقه
                    </Typography>
                  </Box>
                )}
              </Box>
              
              {/* Brand Details */}
              {(brand.foundedYear || brand.headquarters || brand.website) && (
                <Box sx={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: 3, 
                  mb: 3, 
                  direction: 'rtl',
                  position: 'relative',
                  zIndex: 1
                }}>
                  {brand.foundedYear && (
                    <Typography variant="body2" color="text.secondary" sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1 
                    }}>
                      <Box component="span" sx={{ 
                        width: 8, 
                        height: 8, 
                        borderRadius: '50%', 
                        bgcolor: 'primary.main' 
                      }} />
                      <strong>تاسیس:</strong> {brand.foundedYear}
                    </Typography>
                  )}
                  {brand.headquarters && (
                    <Typography variant="body2" color="text.secondary" sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1 
                    }}>
                      <Box component="span" sx={{ 
                        width: 8, 
                        height: 8, 
                        borderRadius: '50%', 
                        bgcolor: 'success.main' 
                      }} />
                      <strong>دفتر مرکزی:</strong> {brand.headquarters}
                    </Typography>
                  )}
                  {brand.website && (
                    <Typography variant="body2" color="text.secondary" sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1 
                    }}>
                      <Box component="span" sx={{ 
                        width: 8, 
                        height: 8, 
                        borderRadius: '50%', 
                        bgcolor: 'warning.main' 
                      }} />
                      <strong>وب‌سایت:</strong> 
                      <Link 
                        href={brand.website} 
                        target="_blank" 
                        rel="noopener"
                        sx={{ 
                          color: 'primary.main',
                          textDecoration: 'none',
                          '&:hover': {
                            textDecoration: 'underline'
                          }
                        }}
                      >
                        {brand.website}
                      </Link>
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* Popular Models and Common Parts */}
      {((brand.popularModels && brand.popularModels.length > 0) || (brand.commonParts && brand.commonParts.length > 0)) && (
        <Box sx={{ mb: 4 }}>
          <Grid container spacing={3}>
            {/* Popular Models */}
            {brand.popularModels && brand.popularModels.length > 0 && (
              <Grid item xs={12} md={6}>
                <Box sx={{ 
                  bgcolor: 'background.paper', 
                  p: 3, 
                  borderRadius: 3, 
                  boxShadow: 2,
                  height: '100%'
                }}>
                  <Typography variant="h6" gutterBottom sx={{ 
                    direction: 'rtl',
                    color: 'primary.main',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    mb: 2
                  }}>
                    <Box sx={{ 
                      width: 24, 
                      height: 24, 
                      borderRadius: '50%', 
                      bgcolor: 'primary.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '0.8rem'
                    }}>
                      🚗
                    </Box>
                    مدل‌های محبوب
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                    {brand.popularModels.map((model) => {
                      const modelId = {
                        'پراید': 1, 'تیبا': 3, 'کوییک': 4, 'ساینا': 5, 'شاهین': 5,
                        'سمند': 8, 'دنا': 9, 'رانا': 10, 'پژو پارس': 7, 'پژو 207': 6, 'تارا': 10,
                        'ام وی ام 110': 13, 'ام وی ام 315': 13, 'ام وی ام 550': 12,
                        'ام وی ام X22': 11, 'ام وی ام X33': 12, 'مزدا 3': 14,
                        'کارا': 15, 'کاپرا': 16, 'شهاب': 16,
                      }[model] || 1;
                      
                      return (
                        <Button
                          key={model}
                          variant="outlined"
                          size="small"
                          component={RouterLink}
                          to={`/models/${modelId}`}
                          sx={{
                            borderRadius: 2,
                            textTransform: 'none',
                            borderColor: 'divider',
                            color: 'text.primary',
                            '&:hover': {
                              borderColor: 'primary.main',
                              bgcolor: 'primary.light',
                              color: 'primary.main',
                              transform: 'translateY(-1px)',
                            },
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {model}
                        </Button>
                      );
                    })}
                  </Box>
                </Box>
              </Grid>
            )}
            
            {/* Common Parts */}
            {brand.commonParts && brand.commonParts.length > 0 && (
              <Grid item xs={12} md={6}>
                <Box sx={{ 
                  bgcolor: 'background.paper', 
                  p: 3, 
                  borderRadius: 3, 
                  boxShadow: 2,
                  height: '100%'
                }}>
                  <Typography variant="h6" gutterBottom sx={{ 
                    direction: 'rtl',
                    color: 'success.main',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    mb: 2
                  }}>
                    <Box sx={{ 
                      width: 24, 
                      height: 24, 
                      borderRadius: '50%', 
                      bgcolor: 'success.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '0.8rem'
                    }}>
                      🔧
                    </Box>
                    قطعات و لوازم جانبی متداول
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {brand.commonParts.map((part) => (
                      <Chip
                        key={part}
                        label={part}
                        variant="outlined"
                        size="small"
                        clickable
                        component={RouterLink}
                        to={`/products?brand=${brandSlug}&category=${part.toLowerCase().replace(' ', '-')}`}
                        sx={{ 
                          m: 0.5,
                          borderRadius: 2,
                          borderColor: 'success.light',
                          color: 'success.main',
                          '&:hover': {
                            bgcolor: 'success.light',
                            borderColor: 'success.main',
                            color: 'white',
                            transform: 'translateY(-1px)',
                          },
                          transition: 'all 0.2s ease'
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              </Grid>
            )}
          </Grid>
        </Box>
      )}

      {/* Tabs and Filter Button */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
          direction: 'rtl',
        }}
      >
        <Tabs
          value={currentTab}
          onChange={(e, value) => setCurrentTab(value)}
          textColor="primary"
          indicatorColor="primary"
        >
          <Tab value="all" label="همه قطعات" />
          <Tab value="popular" label="محبوب‌ترین‌ها" />
          <Tab value="new" label="تازه رسیده‌ها" />
          <Tab value="sale" label="حراج" />
        </Tabs>
        {isMobile && (
          <IconButton
            onClick={() => setFilterOpen(true)}
            sx={{ ml: 2 }}
          >
            <FilterIcon />
          </IconButton>
        )}
      </Box>

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Filter Sidebar */}
        {!isMobile && (
          <Grid item xs={12} md={3}>
            <FilterSidebar
              filters={filters}
              onChange={handleFilterChange}
              onClear={handleClearFilters}
              type="brand"
              title="فیلترها"
              buttonText="پاک کردن فیلترها"
            />
          </Grid>
        )}

        {/* Products Grid */}
        <Grid item xs={12} md={!isMobile ? 9 : 12}>
          {/* Products Header with Count and Sort */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            mb: 3,
            p: 2,
            bgcolor: 'background.paper',
            borderRadius: 2,
            boxShadow: 1
          }}>
            <Typography variant="h6" sx={{ direction: 'rtl' }}>
              {loading ? 'در حال بارگذاری...' : `${filteredProducts.length} محصول یافت شد`}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                مرتب‌سازی بر اساس:
              </Typography>
              <Button 
                variant="outlined" 
                size="small"
                onClick={() => {
                  const sorted = [...filteredProducts].sort((a, b) => b.rating - a.rating);
                  setFilteredProducts(sorted);
                }}
              >
                امتیاز
              </Button>
              <Button 
                variant="outlined" 
                size="small"
                onClick={() => {
                  const sorted = [...filteredProducts].sort((a, b) => a.price - b.price);
                  setFilteredProducts(sorted);
                }}
              >
                قیمت
              </Button>
            </Box>
          </Box>

          {/* Loading State */}
          {loading ? (
            <Box sx={{ py: 8, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                در حال بارگذاری محصولات...
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                {[1, 2, 3].map((i) => (
                  <Box
                    key={i}
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      bgcolor: 'primary.main',
                      mx: 0.5,
                      animation: `pulse 1.5s ease-in-out ${i * 0.3}s infinite`,
                      '@keyframes pulse': {
                        '0%, 80%, 100%': { transform: 'scale(0)' },
                        '40%': { transform: 'scale(1)' }
                      }
                    }}
                  />
                ))}
              </Box>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <Grid item xs={12} sm={6} md={4} key={product.id}>
                    <ProductCard product={product} />
                  </Grid>
                ))
              ) : (
                <Grid item xs={12}>
                  <Box
                    sx={{
                      py: 8,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      bgcolor: 'background.paper',
                      borderRadius: 2,
                      boxShadow: 1,
                    }}
                  >
                    <Box
                      sx={{
                        width: 120,
                        height: 120,
                        borderRadius: '50%',
                        bgcolor: 'grey.100',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 3,
                      }}
                    >
                      <Typography variant="h2" color="grey.400">
                        📦
                      </Typography>
                    </Box>
                    <Typography variant="h6" gutterBottom color="text.primary">
                      محصولی یافت نشد
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 400 }}>
                      {currentTab === 'all' 
                        ? `متأسفانه، هیچ محصولی برای ${brand.name} در حال حاضر در دسترس نیست.`
                        : `هیچ محصولی در دسته‌بندی انتخاب شده برای ${brand.name} یافت نشد.`
                      }
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
                      <Button
                        variant="contained"
                        color="primary"
                        component={RouterLink}
                        to="/products"
                      >
                        مشاهده همه محصولات
                      </Button>
                      <Button
                        variant="outlined"
                        color="primary"
                        component={RouterLink}
                        to="/brands"
                      >
                        سایر برندها
                      </Button>
                      {currentTab !== 'all' && (
                        <Button
                          variant="text"
                          color="primary"
                          onClick={() => setCurrentTab('all')}
                        >
                          نمایش همه محصولات {brand.name}
                        </Button>
                      )}
                    </Box>
                  </Box>
                </Grid>
              )}
            </Grid>
          )}

          {/* Load More Button */}
          {filteredProducts.length > 0 && filteredProducts.length >= 9 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Button
                variant="outlined"
                size="large"
                sx={{
                  px: 4,
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontSize: '1rem'
                }}
              >
                مشاهده محصولات بیشتر
              </Button>
            </Box>
          )}
        </Grid>
      </Grid>

      {/* Mobile Filter Dialog */}
      {isMobile && (
        <FilterSidebar
          filters={filters}
          onChange={handleFilterChange}
          onClear={handleClearFilters}
          type="brand"
          mobile={true}
          open={filterOpen}
          onClose={() => setFilterOpen(false)}
          title="فیلترها"
          buttonText="پاک کردن فیلترها"
        />
      )}
    </Container>
  );
};

export default BrandDetail;
