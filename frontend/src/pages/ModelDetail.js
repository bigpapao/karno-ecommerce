import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  Typography,
  Breadcrumbs,
  Link,
  Paper,
  Tabs,
  Tab,
  Divider,
  Button,
  Chip,
  Card,
  CardMedia,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  Alert,
  Pagination,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  NavigateNext as NavigateNextIcon,
  DirectionsCar as CarIcon,
  Speed as SpeedIcon,
  Build as BuildIcon,
  LocalOffer as PriceIcon,
  FilterAlt as FilterIcon,
  LocalGasStation as FuelIcon,
  CalendarToday as YearIcon,
  Settings as PartsIcon,
  Info as InfoIcon,
  Check as CompatibleIcon,
  Home as HomeIcon,
  ArrowBack as ArrowBackIcon,
  ShoppingCart as CartIcon,
  Business as BrandIcon,
  Category as CategoryIcon,
  AttachMoney as AttachMoneyIcon,
  LocalGasStation as EngineIcon,
  CalendarToday as ModelYearIcon,
} from '@mui/icons-material';
import { vehicleService } from '../services/vehicle.service';
import { productService } from '../services/product.service';
import AddToCartButton from '../components/AddToCartButton';

// TabPanel component for handling tabs
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`model-tabpanel-${index}`}
      aria-labelledby={`model-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

// Sample parts data (this would come from your API)
const partsSampleData = [
  // پراید 111
  {
    id: 1,
    name: 'فیلتر روغن پراید',
    slug: 'pride-oil-filter',
    brand: 'سایپا',
    modelId: 1,
    price: 180000,
    discount: 10,
    rating: 4.5,
    reviewCount: 128,
    image: '/images/products/oil-filter.jpg',
    category: 'فیلتر',
    inStock: true,
    isOriginal: true,
  },
  {
    id: 2,
    name: 'لنت ترمز جلو پراید',
    slug: 'pride-front-brake-pads',
    brand: 'سایپا',
    modelId: 1,
    price: 450000,
    discount: 5,
    rating: 4.2,
    reviewCount: 95,
    image: '/images/products/brake-pads.jpg',
    category: 'ترمز',
    inStock: true,
    isOriginal: true,
  },
  {
    id: 3,
    name: 'شمع پراید',
    slug: 'pride-spark-plugs',
    brand: 'بوش',
    modelId: 1,
    price: 320000,
    discount: 0,
    rating: 4.8,
    reviewCount: 210,
    image: '/images/products/spark-plugs.jpg',
    category: 'الکتریکی',
    inStock: true,
    isOriginal: false,
  },
  {
    id: 4,
    name: 'تسمه تایم پراید',
    slug: 'pride-timing-belt',
    brand: 'دیناپارت',
    modelId: 1,
    price: 280000,
    discount: 15,
    rating: 4.0,
    reviewCount: 75,
    image: '/images/products/timing-belt.jpg',
    category: 'موتور',
    inStock: true,
    isOriginal: false,
  },
  {
    id: 5,
    name: 'دیسک ترمز پراید',
    slug: 'pride-brake-disc',
    brand: 'سایپا',
    modelId: 1,
    price: 720000,
    discount: 8,
    rating: 4.3,
    reviewCount: 62,
    image: '/images/products/brake-disc.jpg',
    category: 'ترمز',
    inStock: true,
    isOriginal: true,
  },
  {
    id: 6,
    name: 'رادیاتور پراید',
    slug: 'pride-radiator',
    brand: 'ایساکو',
    modelId: 1,
    price: 1250000,
    discount: 12,
    rating: 4.6,
    reviewCount: 48,
    image: '/images/products/radiator.jpg',
    category: 'خنک‌کننده',
    inStock: false,
    isOriginal: false,
  },
  
  // سمند
  {
    id: 7,
    name: 'فیلتر روغن سمند',
    slug: 'samand-oil-filter',
    brand: 'ایران خودرو',
    modelId: 8,
    price: 210000,
    discount: 5,
    rating: 4.4,
    reviewCount: 92,
    image: '/images/products/oil-filter.jpg',
    category: 'فیلتر',
    inStock: true,
    isOriginal: true,
  },
  {
    id: 8,
    name: 'لنت ترمز جلو سمند',
    slug: 'samand-front-brake-pads',
    brand: 'ایران خودرو',
    modelId: 8,
    price: 520000,
    discount: 10,
    rating: 4.3,
    reviewCount: 87,
    image: '/images/products/brake-pads.jpg',
    category: 'ترمز',
    inStock: true,
    isOriginal: true,
  },
  {
    id: 9,
    name: 'شمع سمند',
    slug: 'samand-spark-plugs',
    brand: 'بوش',
    modelId: 8,
    price: 380000,
    discount: 0,
    rating: 4.7,
    reviewCount: 156,
    image: '/images/products/spark-plugs.jpg',
    category: 'الکتریکی',
    inStock: true,
    isOriginal: false,
  },
  {
    id: 10,
    name: 'تسمه تایم سمند',
    slug: 'samand-timing-belt',
    brand: 'دیناپارت',
    modelId: 8,
    price: 350000,
    discount: 8,
    rating: 4.1,
    reviewCount: 63,
    image: '/images/products/timing-belt.jpg',
    category: 'موتور',
    inStock: true,
    isOriginal: false,
  },
  {
    id: 11,
    name: 'دیسک ترمز سمند',
    slug: 'samand-brake-disc',
    brand: 'ایران خودرو',
    modelId: 8,
    price: 850000,
    discount: 5,
    rating: 4.4,
    reviewCount: 58,
    image: '/images/products/brake-disc.jpg',
    category: 'ترمز',
    inStock: true,
    isOriginal: true,
  },
  {
    id: 12,
    name: 'رادیاتور سمند',
    slug: 'samand-radiator',
    brand: 'ایساکو',
    modelId: 8,
    price: 1450000,
    discount: 10,
    rating: 4.5,
    reviewCount: 42,
    image: '/images/products/radiator.jpg',
    category: 'خنک‌کننده',
    inStock: true,
    isOriginal: false,
  },
];

// Get unique categories for filter
const categories = [...new Set(partsSampleData.map(part => part.category))];

const ModelDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // State management
  const [model, setModel] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);

  // Product filtering and pagination
  const [filters, setFilters] = useState({
    category: '',
    priceRange: 'all',
    availability: 'all',
    sort: 'featured'
  });
  
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0
  });

  // Fetch model data
  useEffect(() => {
    const fetchModel = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const modelData = await vehicleService.getModelById(id);
        setModel(modelData);
      } catch (err) {
        console.error('Error fetching model:', err);
        setError('خطا در بارگذاری اطلاعات مدل خودرو');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchModel();
    }
  }, [id]);

  // Fetch products for this model
  useEffect(() => {
    const fetchProducts = async () => {
      if (!model) return;
      
      try {
        setProductsLoading(true);
        
        const params = {
          page: pagination.page,
          limit: pagination.limit,
          ...filters
        };
        
        const result = await productService.getProductsByModel(model.slug || id, params);
        
        setProducts(result.products || []);
        setPagination(prev => ({
          ...prev,
          total: result.pagination?.total || 0,
          pages: result.pagination?.pages || 0
        }));
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('خطا در بارگذاری محصولات');
      } finally {
        setProductsLoading(false);
      }
    };

    fetchProducts();
  }, [model, id, pagination.page, pagination.limit, filters]);

  // Event handlers
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const handlePageChange = (event, page) => {
    setPagination(prev => ({ ...prev, page }));
    // Scroll to top of products section
    const productsSection = document.getElementById('products-section');
    if (productsSection) {
      productsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  if (error || !model) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || 'مدل خودرو یافت نشد'}
        </Alert>
        <Button variant="contained" onClick={() => navigate('/models')}>
          بازگشت به لیست مدل‌ها
        </Button>
      </Container>
    );
  }

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
        <Link 
          component={RouterLink} 
          to={`/brands/${model.manufacturer.slug}`} 
          color="inherit"
        >
          {model.manufacturer.name}
        </Link>
        <Typography color="text.primary">{model.name}</Typography>
      </Breadcrumbs>

      {/* Model Header */}
      <Paper 
        elevation={1} 
        sx={{ 
          p: 3, 
          mb: 4, 
          borderRadius: 2,
          background: 'linear-gradient(to right, #1976d2, #2196f3)',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ position: 'absolute', right: -50, top: -50, opacity: 0.1, fontSize: 250 }}>
          <CarIcon fontSize="inherit" />
        </Box>
        
        <Grid container spacing={3} direction="row-reverse">
          <Grid item xs={12} md={8}>
            <Typography 
              variant="h4" 
              component="h1" 
              gutterBottom 
              sx={{ 
                fontWeight: 700,
                textAlign: 'right',
                direction: 'rtl',
              }}
            >
              {model.name}
            </Typography>
            
            <Typography 
              variant="subtitle1" 
              paragraph 
              sx={{ 
                textAlign: 'right',
                direction: 'rtl',
              }}
            >
              {model.description}
            </Typography>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
              <Chip 
                icon={<SpeedIcon />} 
                label={`موتور: ${model.engine}`}
                sx={{ direction: 'rtl', bgcolor: 'rgba(255,255,255,0.2)' }}
              />
              <Chip 
                icon={<BuildIcon />} 
                label={`${model.partsCount} قطعه`}
                sx={{ direction: 'rtl', bgcolor: 'rgba(255,255,255,0.2)' }}
              />
              <Chip 
                label={`سال تولید: ${model.year}`}
                sx={{ direction: 'rtl', bgcolor: 'rgba(255,255,255,0.2)' }}
              />
            </Box>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Box 
              component="img"
              src={model.image || '/images/models/default-car.jpg'}
              alt={model.name}
              sx={{
                width: '100%',
                height: 200,
                objectFit: 'cover',
                borderRadius: 2,
                boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
              }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Tabs for different sections */}
      <Paper sx={{ mb: 4, borderRadius: 2 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          variant="fullWidth"
          textColor="primary"
          indicatorColor="primary"
          sx={{ direction: 'rtl' }}
        >
          <Tab label="قطعات یدکی" />
          <Tab label="مشخصات فنی" />
          <Tab label="مشکلات رایج" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <Box sx={{ mb: 4 }}>
        {/* Parts Tab */}
        {tabValue === 0 && (
          <>
            {/* Filters */}
            <Paper elevation={1} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
              <Grid container spacing={3} alignItems="center" direction="row-reverse">
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth sx={{ direction: 'rtl' }}>
                    <InputLabel id="category-select-label">دسته‌بندی قطعات</InputLabel>
                    <Select
                      labelId="category-select-label"
                      value={filters.category}
                      label="دسته‌بندی قطعات"
                      onChange={(e) => handleFilterChange('category', e.target.value)}
                    >
                      <MenuItem value="">همه دسته‌بندی‌ها</MenuItem>
                      {categories.map((category) => (
                        <MenuItem key={category} value={category}>{category}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth sx={{ direction: 'rtl' }}>
                    <InputLabel id="price-range-select-label">محدوده قیمت</InputLabel>
                    <Select
                      labelId="price-range-select-label"
                      value={filters.priceRange}
                      label="محدوده قیمت"
                      onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                    >
                      <MenuItem value="all">همه قیمت‌ها</MenuItem>
                      <MenuItem value="low">قیمت کم</MenuItem>
                      <MenuItem value="high">قیمت زیاد</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth sx={{ direction: 'rtl' }}>
                    <InputLabel id="availability-select-label">موجودی</InputLabel>
                    <Select
                      labelId="availability-select-label"
                      value={filters.availability}
                      label="موجودی"
                      onChange={(e) => handleFilterChange('availability', e.target.value)}
                    >
                      <MenuItem value="all">همه موجودی‌ها</MenuItem>
                      <MenuItem value="inStock">موجود</MenuItem>
                      <MenuItem value="outOfStock">ناموجود</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth sx={{ direction: 'rtl' }}>
                    <InputLabel id="sort-select-label">مرتب‌سازی</InputLabel>
                    <Select
                      labelId="sort-select-label"
                      value={filters.sort}
                      label="مرتب‌سازی"
                      onChange={(e) => handleFilterChange('sort', e.target.value)}
                    >
                      <MenuItem value="featured">پیش‌فرض</MenuItem>
                      <MenuItem value="price-low">قیمت: کم به زیاد</MenuItem>
                      <MenuItem value="price-high">قیمت: زیاد به کم</MenuItem>
                      <MenuItem value="rating">بیشترین امتیاز</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <Button 
                    variant="outlined" 
                    color="secondary" 
                    onClick={() => {
                      setFilters({
                        category: '',
                        priceRange: 'all',
                        availability: 'all',
                        sort: 'featured'
                      });
                      setPagination(prev => ({ ...prev, page: 1 }));
                    }}
                    fullWidth
                    startIcon={<FilterIcon />}
                    sx={{ direction: 'rtl' }}
                  >
                    حذف فیلترها
                  </Button>
                </Grid>
              </Grid>
            </Paper>
            
            {/* Parts List */}
            <Box sx={{ mb: 2 }}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 2, 
                  bgcolor: 'rgba(25, 118, 210, 0.05)', 
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  direction: 'rtl',
                  mb: 3,
                }}
              >
                <Typography variant="body1">
                  قطعات یدکی برای {model.name}
                </Typography>
                <Chip 
                  label={`${products.length} قطعه`} 
                  color="primary" 
                  variant="outlined" 
                />
              </Paper>
              
              <Grid container spacing={3}>
                {products.map((part) => (
                  <Grid item key={part._id} xs={12} sm={6} md={4}>
                    <Card
                      sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        borderRadius: 2,
                        transition: 'transform 0.3s, box-shadow 0.3s',
                        '&:hover': {
                          transform: 'translateY(-5px)',
                          boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
                        },
                        position: 'relative',
                      }}
                    >
                      {part.discountPrice && (
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 10,
                            right: 10,
                            bgcolor: 'error.main',
                            color: 'white',
                            borderRadius: '50%',
                            width: 40,
                            height: 40,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            zIndex: 1,
                          }}
                        >
                          {Math.round(((part.price - part.discountPrice) / part.price) * 100)}%
                        </Box>
                      )}
                      
                      <CardMedia
                        component="img"
                        height="160"
                        image={part.images?.[0]?.url || '/images/products/default-product.jpg'}
                        alt={part.name}
                        sx={{ objectFit: 'contain', p: 2 }}
                      />
                      
                      <CardContent sx={{ flexGrow: 1, direction: 'rtl' }}>
                        <Typography variant="h6" component="h3" gutterBottom>
                          {part.name}
                        </Typography>
                        
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {part.description}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Chip 
                            label={part.category?.name || 'عمومی'} 
                            size="small" 
                            color="primary"
                            variant="outlined"
                          />
                          <Chip 
                            label={part.stock > 0 ? 'موجود' : 'ناموجود'} 
                            size="small" 
                            color={part.stock > 0 ? 'success' : 'error'}
                            variant="outlined"
                          />
                        </Box>
                        
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          برند: {part.brand?.name || 'نامشخص'}
                        </Typography>
                        
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          کد محصول: {part.sku}
                        </Typography>
                        
                        <Divider sx={{ my: 1.5 }} />
                        
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box>
                            {part.discountPrice ? (
                              <>
                                <Typography 
                                  variant="body2" 
                                  color="text.secondary"
                                  sx={{ textDecoration: 'line-through' }}
                                >
                                  {part.price.toLocaleString()} تومان
                                </Typography>
                                <Typography 
                                  variant="h6" 
                                  color="error" 
                                  sx={{ fontWeight: 'bold' }}
                                >
                                  {part.discountPrice.toLocaleString()} تومان
                                </Typography>
                              </>
                            ) : (
                              <Typography 
                                variant="h6" 
                                color="primary" 
                                sx={{ fontWeight: 'bold' }}
                              >
                                {part.price.toLocaleString()} تومان
                              </Typography>
                            )}
                            
                            {part.rating && (
                              <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                                <Typography variant="body2" color="text.secondary">
                                  ⭐ {part.rating} ({part.numReviews} نظر)
                                </Typography>
                              </Box>
                            )}
                          </Box>
                          
                          <AddToCartButton
                            product={part}
                            variant="contained"
                            size="small"
                            customText={part.stock > 0 ? 'افزودن به سبد خرید' : 'ناموجود'}
                            redirectAfterLogin="/products"
                            disabled={part.stock === 0}
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
              
              {productsLoading && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <CircularProgress />
                  <Typography variant="body2" sx={{ mt: 2 }}>
                    در حال بارگذاری قطعات...
                  </Typography>
                </Box>
              )}
              
              {products.length === 0 && !productsLoading && (
                <Paper
                  sx={{
                    textAlign: 'center',
                    py: 8,
                    borderRadius: 2,
                    direction: 'rtl',
                  }}
                >
                  <Typography variant="h6" color="text.secondary">
                    هیچ قطعه‌ای با فیلترهای انتخاب شده یافت نشد
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    لطفاً فیلترهای مختلفی را امتحان کنید یا همه فیلترها را حذف کنید
                  </Typography>
                </Paper>
              )}
            </Box>
          </>
        )}
        
        {/* Specifications Tab */}
        {tabValue === 1 && (
          <Paper elevation={1} sx={{ p: 3, borderRadius: 2, direction: 'rtl' }}>
            <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
              مشخصات فنی {model.name}
            </Typography>
            
            <Grid container spacing={2}>
              {Object.entries(model.specifications || {}).map(([key, value]) => (
                <Grid item xs={12} sm={6} key={key}>
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      p: 2, 
                      bgcolor: 'rgba(25, 118, 210, 0.05)', 
                      borderRadius: 2,
                      display: 'flex',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Typography variant="body1" color="text.secondary">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {value}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Paper>
        )}
        
        {/* Common Issues Tab */}
        {tabValue === 2 && (
          <Paper elevation={1} sx={{ p: 3, borderRadius: 2, direction: 'rtl' }}>
            <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
              مشکلات رایج {model.name}
            </Typography>
            
            <Grid container spacing={2}>
              {(model.commonIssues || []).map((issue, index) => (
                <Grid item xs={12} key={index}>
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      p: 2, 
                      bgcolor: 'rgba(25, 118, 210, 0.05)', 
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <Box 
                      sx={{ 
                        width: 24, 
                        height: 24, 
                        borderRadius: '50%', 
                        bgcolor: 'primary.main', 
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 2,
                        fontSize: '0.8rem',
                        fontWeight: 'bold',
                      }}
                    >
                      {index + 1}
                    </Box>
                    <Typography variant="body1">
                      {issue}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Paper>
        )}
      </Box>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination
            count={pagination.pages}
            page={pagination.page}
            onChange={handlePageChange}
            color="primary"
            size="large"
            showFirstButton
            showLastButton
          />
        </Box>
      )}
    </Container>
  );
};

export default ModelDetail;
