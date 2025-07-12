import React, { useState, useEffect } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import SEO from '../components/SEO';
import { generateBreadcrumbSchema, generateProductSchema } from '../utils/structuredData';
import { fetchProductStart, fetchProductSuccess, fetchProductFailure } from '../store/slices/productSlice';
import { productAPI } from '../services/api';
import {
  Box,
  Container,
  Grid,
  Typography,
  Rating,
  Chip,
  Breadcrumbs,
  Link,
  Tab,
  Tabs,
  Divider,
  TextField,
  IconButton,
  Paper,
  useTheme,
  Button,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  ShoppingCart as CartIcon,
  Favorite as FavoriteIcon,

  Check as CheckIcon,
  LocalShipping as LocalShippingIcon,
  AssignmentReturn as AssignmentReturnIcon,
} from '@mui/icons-material';
import ProductImageGallery from '../components/ProductImageGallery';
import RelatedProducts from '../components/RelatedProducts';
import ReviewSection from '../components/ReviewSection';
import Loading from '../components/Loading';
import ContactCTA from '../components/ContactCTA';
import AddToCartButton from '../components/AddToCartButton';

const CART_ENABLED = String(process.env.REACT_APP_CART_ENABLED).toLowerCase() === 'true';

const ProductDetail = () => {
  const { id } = useParams();
  const theme = useTheme();
  const dispatch = useDispatch();


  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState(0);
  const [notFound, setNotFound] = useState(false);
  const { product, loading, error } = useSelector((state) => state.product);

  useEffect(() => {
    const fetchProduct = async () => {
      dispatch(fetchProductStart());
      setNotFound(false);
      try {
        const response = await productAPI.getProductById(id);
        if (response.data && response.data.success) {
          dispatch(fetchProductSuccess(response.data.data));
        } else {
          throw new Error('Product not found');
        }
      } catch (error) {

        if (error.response && error.response.status === 404) {
          setNotFound(true);
          dispatch(fetchProductFailure('محصول مورد نظر یافت نشد.'));
        } else {
          dispatch(fetchProductFailure(error.message || 'خطا در بارگذاری محصول'));
        }
      }
    };
    
    if (id) {
      fetchProduct();
    }
    window.scrollTo(0, 0);
  }, [dispatch, id]);

  const handleQuantityChange = (value) => {
    if (value >= 1 && value <= product?.stockQuantity) {
      setQuantity(value);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  if (loading) return <Loading />;
  
  // Handle 404 - Product not found
  if (notFound || (!loading && !product)) {
    return (
      <Container maxWidth="lg" sx={{ py: 8, direction: 'rtl', textAlign: 'center' }}>
        <SEO 
          title="محصول یافت نشد"
          description="متأسفانه محصول مورد نظر شما یافت نشد."
        />
        <Paper elevation={2} sx={{ p: 6, borderRadius: 3 }}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h1" sx={{ fontSize: '6rem', color: 'primary.main', fontWeight: 'bold' }}>
              404
            </Typography>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'text.primary' }}>
              محصول یافت نشد
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}>
              متأسفانه محصول مورد نظر شما در سیستم موجود نیست. ممکن است این محصول حذف شده یا آدرس آن تغییر کرده باشد.
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="large"
              component={RouterLink}
              to="/"
              sx={{ px: 4, py: 1.5, borderRadius: 2 }}
            >
              بازگشت به صفحه اصلی
            </Button>
            <Button
              variant="outlined"
              size="large"
              component={RouterLink}
              to="/products"
              sx={{ px: 4, py: 1.5, borderRadius: 2 }}
            >
              مشاهده همه محصولات
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }
  
  if (error && !notFound) {
    return (
      <Container>
        <Typography color="error" align="center" py={8} sx={{ direction: 'rtl' }}>
          خطا در بارگذاری جزئیات محصول. لطفا بعدا دوباره امتحان کنید.
        </Typography>
      </Container>
    );
  }
  
  if (!product) return null;

  // Generate product schema for structured data
  const productSchema = generateProductSchema(product);
  
  // Generate breadcrumb schema for structured data
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'خانه', url: 'https://karno.ir/' },
    { name: 'محصولات', url: 'https://karno.ir/products' },
    { name: product.category, url: `https://karno.ir/products?category=${encodeURIComponent(product.category)}` },
    { name: product.name, url: `https://karno.ir/products/${product.slug}` }
  ]);

  return (
    <Box sx={{ 
      background: 'linear-gradient(to bottom, #f5f7fa, #ffffff)',
      minHeight: '100vh',
      py: 6,
    }}>
      <SEO 
        title={product.name}
        description={product.description}
        canonical={`https://karno.ir/products/${product.slug}`}
        openGraph={{
          type: 'product',
          title: product.name,
          description: product.description,
          image: product.images?.[0] || 'https://karno.ir/images/product-placeholder.jpg',
          url: `https://karno.ir/products/${product.slug}`,
        }}
        schema={[productSchema, breadcrumbSchema]}
      />
      <Container maxWidth="lg">
        {/* Breadcrumbs */}
        <Paper 
          elevation={1} 
          sx={{ 
            p: 2, 
            mb: 4, 
            borderRadius: 2,
            direction: 'rtl',
          }}
        >
          <Breadcrumbs sx={{ direction: 'rtl' }}>
            <Link component={RouterLink} to="/" color="inherit">
              خانه
            </Link>
            <Link component={RouterLink} to="/products" color="inherit">
              محصولات
            </Link>
            <Link
              component={RouterLink}
              to={`/products?category=${product.category}`}
              color="inherit"
            >
              {product.category}
            </Link>
            <Typography color="text.primary">{product.name}</Typography>
          </Breadcrumbs>
        </Paper>
        
        {/* Product Header */}
        <Paper 
          elevation={0} 
          sx={{ 
            p: 4, 
            mb: 4, 
            borderRadius: 2,
            backgroundImage: 'linear-gradient(to right, #1976d2, #2196f3)',
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Box sx={{ position: 'absolute', right: -50, top: -50, opacity: 0.1, fontSize: 250 }}>
            <CartIcon fontSize="inherit" />
          </Box>
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
            {product.name}
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', direction: 'rtl' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="subtitle1">
                برند: 
                <Link 
                  component={RouterLink} 
                  to={`/brands/${product.brandSlug}`} 
                  color="inherit"
                  sx={{ ml: 1, textDecoration: 'underline' }}
                >
                  {product.brand}
                </Link>
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Rating value={product.rating} precision={0.5} readOnly size="small" />
              <Typography variant="body2" sx={{ mr: 1 }}>
                ({product.reviewCount} نظر)
              </Typography>
            </Box>
          </Box>
        </Paper>

      {/* Product Overview */}
      <Grid container spacing={4}>
        {/* Product Images */}
        <Grid item xs={12} md={6}>
          <Paper
            elevation={2}
            sx={{
              p: 2,
              borderRadius: 2,
              overflow: 'hidden',
              height: '100%',
            }}
          >
            <ProductImageGallery product={product} />
          </Paper>
        </Grid>

        {/* Product Info */}
        <Grid item xs={12} md={6}>
          <Paper
            elevation={2}
            sx={{
              p: 3,
              borderRadius: 2,
              height: '100%',
              direction: 'rtl',
            }}
          >
            {/* Compatible Models */}
            {product.compatibleModels && (
              <Box 
                sx={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: 1, 
                  mb: 2 
                }}
              >
                {product.compatibleModels.map((model) => (
                  <Chip
                    key={model}
                    label={model}
                    size="small"
                    color="info"
                    variant="outlined"
                  />
                ))}
              </Box>
            )}
            
            {/* Product Name */}
            <Typography 
              variant="h5" 
              component="h1" 
              gutterBottom
              sx={{ fontWeight: 'bold' }}
            >
              {product.name}
            </Typography>
            
            {/* Rating */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Rating value={product.rating} precision={0.5} readOnly />
              <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                ({product.reviewCount} نظر)
              </Typography>
            </Box>

            {/* Price */}
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                mb: 3,
                p: 2,
                bgcolor: 'rgba(25, 118, 210, 0.05)',
                borderRadius: 1,
              }}
            >
              <Box>
                {product.discountPrice ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ textDecoration: 'line-through' }}
                    >
                      {product.price.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} تومان
                    </Typography>
                    <Typography
                      variant="h5"
                      color="primary"
                      sx={{ fontWeight: 700 }}
                    >
                      {product.discountPrice.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} تومان
                    </Typography>
                  </Box>
                ) : (
                  <Typography
                    variant="h5"
                    color="primary"
                    sx={{ fontWeight: 700 }}
                  >
                    {product.price.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} تومان
                  </Typography>
                )}
              </Box>
              {product.discount && (
                <Chip
                  label={`${product.discount}% تخفیف`}
                  color="error"
                  size="small"
                />
              )}
            </Box>

            {/* Stock Status */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Typography variant="body2" sx={{ ml: 1 }}>وضعیت:</Typography>
              {product.stockQuantity > 0 ? (
                <Chip
                  label={`موجود در انبار (${product.stockQuantity} عدد)`}
                  color="success"
                  size="small"
                />
              ) : (
                <Chip
                  label="ناموجود"
                  color="error"
                  size="small"
                />
              )}
            </Box>

            {/* Original Product Badge */}
            {product.isOriginal && (
              <Box sx={{ mb: 3 }}>
                <Chip
                  icon={<CheckIcon />}
                  label="قطعه اصلی"
                  color="success"
                  variant="outlined"
                />
              </Box>
            )}

            {/* Description */}
            <Box sx={{ mt: 3 }}>
              <Typography variant="h2" component="h1" gutterBottom>
                {product.name}
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                {product.fullDescription || product.description}
              </Typography>
              {/* Add to Cart button below description */}
              <AddToCartButton
                product={product}
                quantity={quantity}
                fullWidth
                customText="افزودن به سبد خرید"
                redirectAfterLogin={`/products/${product.slug}`}
                sx={{ mt: 2, borderRadius: 2, transition: 'background 0.2s', fontWeight: 600 }}
              />
            </Box>

            {/* Quantity Selector */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Typography variant="body2" sx={{ ml: 2 }}>تعداد:</Typography>
              <IconButton
                onClick={() => handleQuantityChange(quantity - 1)}
                disabled={quantity <= 1}
              >
                <RemoveIcon />
              </IconButton>
              <TextField
                value={quantity}
                onChange={(e) => handleQuantityChange(Number(e.target.value))}
                type="number"
                size="small"
                inputProps={{ min: 1, max: product.stockQuantity }}
                sx={{ width: 60, mx: 1 }}
              />
              <IconButton
                onClick={() => handleQuantityChange(quantity + 1)}
                disabled={quantity >= product.stockQuantity}
              >
                <AddIcon />
              </IconButton>
            </Box>

            {/* Action Buttons */}
            {!CART_ENABLED && (
              <ContactCTA showButton buttonLabel="Contact us to purchase" sx={{ mb: 3, width: { xs: '100%', sm: 220, md: 300 }, maxWidth: 300 }} />
            )}

            {/* Product Details */}
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle2" gutterBottom sx={{ direction: 'rtl' }}>
                مشخصات محصول:
              </Typography>
              <Grid container spacing={2} sx={{ direction: 'rtl' }}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    برند:
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">{product.brand}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    کد محصول:
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">{product.sku}</Typography>
                </Grid>
                {/* Add more product details as needed */}
              </Grid>
            </Paper>
          </Paper>
        </Grid>
      </Grid>

      {/* Tabs Section */}
      <Paper 
        elevation={2} 
        sx={{ 
          mt: 6, 
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <Box sx={{ 
          bgcolor: theme.palette.primary.main,
          color: 'white',
          direction: 'rtl',
        }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            textColor="inherit"
            indicatorColor="secondary"
            sx={{ 
              '& .MuiTab-root': { 
                fontWeight: 'bold',
                py: 2,
              },
            }}
          >
            <Tab label="توضیحات" />
            <Tab label="مشخصات فنی" />
            <Tab label="نظرات" />
            <Tab label="ارسال و مرجوعی" />
          </Tabs>
        </Box>
        
        <Box sx={{ p: 4, direction: 'rtl' }}>
          {activeTab === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
                درباره این محصول
              </Typography>
              <Typography variant="body1" sx={{ textAlign: 'justify', lineHeight: 1.8 }}>
                {product.fullDescription}
              </Typography>
              
              {/* Installation Info */}
              {product.installationDifficulty && (
                <Box sx={{ mt: 4, p: 2, bgcolor: 'rgba(25, 118, 210, 0.05)', borderRadius: 2 }}>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                    راهنمای نصب
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                          سطح دشواری:
                        </Typography>
                        <Typography variant="body2">
                          {product.installationDifficulty}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                          زمان تقریبی نصب:
                        </Typography>
                        <Typography variant="body2">
                          {product.installationTime}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              )}
            </Box>
          )}
          
          {activeTab === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
                مشخصات فنی
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Grid container spacing={2}>
                  {product.specifications?.map((spec, index) => (
                    <React.Fragment key={index}>
                      <Grid item xs={12} sm={4} md={3}>
                        <Typography variant="body2" color="text.secondary">
                          {spec.name}:
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={8} md={9}>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>{spec.value}</Typography>
                      </Grid>
                      {index < product.specifications.length - 1 && (
                        <Grid item xs={12}>
                          <Divider sx={{ my: 1 }} />
                        </Grid>
                      )}
                    </React.Fragment>
                  ))}
                </Grid>
              </Paper>
              
              {/* Compatible Models */}
              {product.compatibleModels && product.compatibleModels.length > 0 && (
                <Box sx={{ mt: 4 }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
                    مدل‌های سازگار
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {product.compatibleModels.map((model) => (
                        <Chip
                          key={model}
                          label={model}
                          color="primary"
                          variant="outlined"
                          sx={{ m: 0.5 }}
                        />
                      ))}
                    </Box>
                  </Paper>
                </Box>
              )}
            </Box>
          )}
          
          {activeTab === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
                نظرات کاربران
              </Typography>
              <ReviewSection productId={id} />
            </Box>
          )}
          
          {activeTab === 3 && (
            <Box>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
                اطلاعات ارسال
              </Typography>
              <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ 
                    width: 40, 
                    height: 40, 
                    borderRadius: '50%', 
                    bgcolor: 'primary.light', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    mr: 2,
                  }}>
                    <LocalShippingIcon sx={{ color: 'white' }} />
                  </Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    روش‌های ارسال
                  </Typography>
                </Box>
                <Typography variant="body2" paragraph>
                  ارسال رایگان برای سفارش‌های بالای ۵۰۰,۰۰۰ تومان. زمان ارسال استاندارد ۳ تا ۵ روز کاری است.
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  <Chip label="پست پیشتاز" size="small" />
                  <Chip label="تیپاکس" size="small" />
                  <Chip label="ارسال سریع" size="small" />
                </Box>
              </Paper>
              
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
                شرایط مرجوعی
              </Typography>
              <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ 
                    width: 40, 
                    height: 40, 
                    borderRadius: '50%', 
                    bgcolor: 'primary.light', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    mr: 2,
                  }}>
                    <AssignmentReturnIcon sx={{ color: 'white' }} />
                  </Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    مرجوعی آسان
                  </Typography>
                </Box>
                <Typography variant="body2">
                  اگر از خرید خود راضی نیستید، می‌توانید آن را ظرف مدت ۳۰ روز برای دریافت کامل وجه برگردانید.
                  لطفاً اطمینان حاصل کنید که کالا استفاده نشده و در بسته‌بندی اصلی خود است.
                </Typography>
              </Paper>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Related Products */}
      <Paper 
        elevation={2}
        sx={{ 
          mt: 6, 
          p: 3,
          borderRadius: 2,
          direction: 'rtl',
          position: 'relative',
          overflow: 'hidden',
          backgroundImage: 'linear-gradient(to right, rgba(25, 118, 210, 0.05), rgba(25, 118, 210, 0.1))',
        }}
      >
        <Box sx={{ position: 'absolute', left: -30, top: -30, opacity: 0.05, fontSize: 200 }}>
          <FavoriteIcon fontSize="inherit" />
        </Box>
        
        <Typography 
          variant="h5" 
          gutterBottom 
          sx={{ 
            fontWeight: 'bold',
            color: theme.palette.primary.main,
            position: 'relative',
            display: 'inline-block',
            pb: 1,
            '&:after': {
              content: '""',
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: '50%',
              borderBottom: `3px solid ${theme.palette.primary.main}`,
            }
          }}
        >
          محصولات مرتبط
        </Typography>
        
        <Box sx={{ mt: 3 }}>
          <RelatedProducts
            category={product.category}
            currentProductId={id}
          />
        </Box>
      </Paper>
      </Container>
    </Box>
  );
};

export default ProductDetail;
