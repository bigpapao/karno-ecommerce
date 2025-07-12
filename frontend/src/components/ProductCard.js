import React, { useState, useRef } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, useInView } from 'framer-motion';
import {
  Card,
  CardActionArea,
  CardActions,
  CardContent,
  CardMedia,
  Button,
  Typography,
  Box,
  Rating,
  Chip,
  IconButton,
  Tooltip,
  Skeleton,
  useTheme,
  alpha,
  Avatar,
} from '@mui/material';
import {
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Build as BuildIcon,
  Settings as SettingsIcon,
  ElectricalServices as ElectricalServicesIcon,
  BatteryChargingFull as BatteryChargingFullIcon,
  AcUnit as AcUnitIcon,
  Opacity as OilIcon,
  Brightness1 as BrakesIcon,
  RadioButtonChecked as TireIcon,
  Lightbulb as LightbulbIcon,
  DirectionsCar as DirectionsCarIcon,
  Phone as PhoneIcon,
  Visibility as ViewIcon,
  Category as CategoryIcon,
  Storefront as StorefrontIcon,
  CheckCircle as CheckCircleIcon,
  LocalShipping as LocalShippingIcon,
} from '@mui/icons-material';
import { toPersianCurrency, toPersianNumber } from '../utils/persianUtils';
import { getProductImageUrl } from '../utils/imageUtils';
import { useNavigate } from 'react-router-dom';
import AddToCartButton from './AddToCartButton';

// Default placeholder image for products
const placeholderImage = '/images/products/placeholder.jpg';

// Helper function to get category icon based on category name
const getCategoryIcon = (categoryName) => {
  if (!categoryName) return <BuildIcon fontSize="small" className="no-flip" />;
  
  const name = categoryName.toLowerCase();
  if (name.includes('موتور') || name.includes('engine')) return <SettingsIcon fontSize="small" className="no-flip" />;
  if (name.includes('برق') || name.includes('electrical')) return <ElectricalServicesIcon fontSize="small" className="no-flip" />;
  if (name.includes('باتری') || name.includes('battery')) return <BatteryChargingFullIcon fontSize="small" className="no-flip" />;
  if (name.includes('تهویه') || name.includes('ac')) return <AcUnitIcon fontSize="small" className="no-flip" />;
  if (name.includes('روغن') || name.includes('oil')) return <OilIcon fontSize="small" className="no-flip" />;
  if (name.includes('ترمز') || name.includes('brake')) return <BrakesIcon fontSize="small" className="no-flip" />;
  if (name.includes('لاستیک') || name.includes('tire')) return <TireIcon fontSize="small" className="no-flip" />;
  if (name.includes('چراغ') || name.includes('light')) return <LightbulbIcon fontSize="small" className="no-flip" />;
  if (name.includes('تعلیق') || name.includes('suspension')) return <DirectionsCarIcon fontSize="small" className="no-flip" />;
  return <BuildIcon fontSize="small" className="no-flip" />;
};

const CART_ENABLED = String(process.env.REACT_APP_CART_ENABLED).toLowerCase() === 'true';

const ProductCard = ({ product, index = 0, variant = 'grid', delay = 0 }) => {
  const dispatch = useDispatch();
  const [favorite, setFavorite] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();
  const theme = useTheme();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const contactRoute = process.env.REACT_APP_CONTACT_ROUTE || '/contact-us';

  // Safely extract product data
  const {
    _id,
    name = 'محصول نام‌گذاری نشده',
    price = 0,
    discountPrice,
    description = '',
    images = [],
    category,
    brand,
    rating = 0,
    reviewsCount = 0,
    inStock = false,
    stockQuantity = 0,
    features = [],
    compatibleVehicles = [],
  } = product || {};

  // Get category information
  const categoryInfo = {
    name: category?.name || 'عمومی',
    slug: category?.slug || 'general',
    image: category?.image?.url,
  };

  // Get brand information
  const brandInfo = {
    name: brand?.name || 'نامشخص',
    slug: brand?.slug || 'unknown',
    logo: brand?.logo?.url,
    country: brand?.country,
  };

  // Get main product image
  const mainImage = images?.[0]?.url || placeholderImage;
  
  // Calculate discount percentage
  const discountPercentage = discountPrice && price > discountPrice 
    ? Math.round(((price - discountPrice) / price) * 100)
    : 0;

  // Final display price
  const displayPrice = discountPrice || price;

  // Determine layout based on variant
  const isListView = variant === 'list';

  const handleToggleFavorite = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setFavorite(!favorite);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  const handleViewProduct = () => {
    navigate(`/products/${_id}`);
  };

  const handleCategoryClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/products?category=${categoryInfo.slug}`);
  };

  const handleBrandClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/products?brand=${brandInfo.slug}`);
  };

  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: 30,
      scale: 0.95 
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        duration: 0.4,
        delay: delay,
        ease: [0.4, 0, 0.2, 1],
      }
    }
  };

  const imageVariants = {
    hover: {
      scale: 1.05,
      transition: { duration: 0.3 }
    }
  };

  const buttonVariants = {
    hover: {
      scale: 1.02,
      transition: { duration: 0.2 }
    },
    tap: {
      scale: 0.98
    }
  };

  if (!product) {
    return (
      <Card sx={{ maxWidth: 345, m: 1 }}>
        <Skeleton variant="rectangular" width="100%" height={200} />
        <CardContent>
          <Skeleton variant="text" sx={{ fontSize: '1.5rem' }} />
          <Skeleton variant="text" sx={{ fontSize: '1rem' }} />
          <Skeleton variant="text" sx={{ fontSize: '1rem', width: '60%' }} />
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      ref={ref}
      variants={cardVariants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        sx={{
          maxWidth: isListView ? '100%' : 345,
          height: isListView ? 'auto' : '100%',
          display: 'flex',
          flexDirection: isListView ? 'row' : 'column',
          position: 'relative',
          transition: 'all 0.3s ease-in-out',
          borderRadius: 2,
          overflow: 'hidden',
          '&:hover': {
            boxShadow: theme.shadows[12],
            '& .product-image': {
              transform: 'scale(1.05)',
            },
          },
          direction: 'rtl',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Discount Badge */}
        {discountPercentage > 0 && (
          <Box
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              bgcolor: 'error.main',
              color: 'white',
              px: 1,
              py: 0.5,
              borderRadius: 1,
              fontSize: '0.75rem',
              fontWeight: 'bold',
              zIndex: 1,
            }}
          >
            {toPersianNumber(discountPercentage)}% تخفیف
          </Box>
        )}

        {/* Stock Status Badge */}
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            left: 8,
            zIndex: 1,
          }}
        >
          <Chip
            icon={inStock ? <CheckCircleIcon /> : undefined}
            label={inStock ? 'موجود' : 'ناموجود'}
            color={inStock ? 'success' : 'error'}
            size="small"
            variant="filled"
          />
        </Box>

        {/* Favorite Button */}
        <IconButton
          onClick={handleToggleFavorite}
          sx={{
            position: 'absolute',
            top: 8,
            left: isListView ? 8 : 45,
            zIndex: 2,
            bgcolor: alpha(theme.palette.background.paper, 0.8),
            '&:hover': {
              bgcolor: alpha(theme.palette.background.paper, 0.9),
            },
          }}
          size="small"
        >
          {favorite ? (
            <FavoriteIcon color="error" fontSize="small" />
          ) : (
            <FavoriteBorderIcon fontSize="small" />
          )}
        </IconButton>

        {/* Product Image */}
        <CardActionArea
          onClick={handleViewProduct}
          sx={{
            width: isListView ? 200 : '100%',
            height: isListView ? 200 : 250,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <motion.div variants={imageVariants} whileHover="hover">
            <CardMedia
              component="img"
              className="product-image"
              height={isListView ? "200" : "250"}
              image={imageError ? placeholderImage : mainImage}
              alt={name}
              onLoad={handleImageLoad}
              onError={handleImageError}
              sx={{
                objectFit: 'cover',
                transition: 'transform 0.3s ease-in-out',
                width: '100%',
                height: '100%',
              }}
            />
          </motion.div>
          
          {imageLoading && (
            <Skeleton
              variant="rectangular"
              width="100%"
              height="100%"
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
              }}
            />
          )}
        </CardActionArea>

        {/* Product Content */}
        <CardContent
          sx={{
            flex: 1,
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
          }}
        >
          {/* Category and Brand */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Chip
              icon={getCategoryIcon(categoryInfo.name)}
              label={categoryInfo.name}
              size="small"
              variant="outlined"
              color="primary"
              onClick={handleCategoryClick}
              sx={{ 
                cursor: 'pointer',
                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.1) }
              }}
            />
            
            <Chip
              avatar={
                brandInfo.logo ? (
                  <Avatar src={brandInfo.logo} sx={{ width: 16, height: 16 }}>
                    <StorefrontIcon fontSize="small" />
                  </Avatar>
                ) : (
                  <Avatar sx={{ width: 16, height: 16, bgcolor: 'secondary.main' }}>
                    <StorefrontIcon fontSize="small" />
                  </Avatar>
                )
              }
              label={brandInfo.name}
              size="small"
              variant="outlined"
              color="secondary"
              onClick={handleBrandClick}
              sx={{ 
                cursor: 'pointer',
                '&:hover': { bgcolor: alpha(theme.palette.secondary.main, 0.1) }
              }}
            />
          </Box>

          {/* Product Name */}
          <Typography
            variant="h6"
            component="h3"
            sx={{
              fontWeight: 600,
              fontSize: '1.1rem',
              lineHeight: 1.3,
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              minHeight: '2.6em',
              direction: 'rtl',
            }}
          >
            {name}
          </Typography>

          {/* Description */}
          {description && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                direction: 'rtl',
              }}
            >
              {description}
            </Typography>
          )}

          {/* Features */}
          {features && features.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {features.slice(0, 3).map((feature, idx) => (
                <Chip
                  key={idx}
                  label={feature}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.7rem' }}
                />
              ))}
              {features.length > 3 && (
                <Chip
                  label={`+${toPersianNumber(features.length - 3)}`}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.7rem' }}
                />
              )}
            </Box>
          )}

          {/* Compatible Vehicles */}
          {compatibleVehicles && compatibleVehicles.length > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <DirectionsCarIcon fontSize="small" color="action" />
              <Typography variant="caption" color="text.secondary">
                مناسب برای {toPersianNumber(compatibleVehicles.length)} خودرو
              </Typography>
            </Box>
          )}

          {/* Rating */}
          {rating > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Rating
                value={rating}
                precision={0.5}
                size="small"
                readOnly
                sx={{ direction: 'ltr' }}
              />
              <Typography variant="caption" color="text.secondary">
                ({toPersianNumber(reviewsCount)} نظر)
              </Typography>
            </Box>
          )}

          {/* Stock Info */}
          {inStock && stockQuantity > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LocalShippingIcon fontSize="small" color="success" />
              <Typography variant="caption" color="success.main">
                {stockQuantity > 10 ? 'موجود در انبار' : `فقط ${toPersianNumber(stockQuantity)} عدد باقی مانده`}
              </Typography>
            </Box>
          )}

          {/* Price Section */}
          <Box sx={{ mt: 'auto', pt: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, direction: 'rtl' }}>
              {discountPrice && (
                <Typography
                  variant="body2"
                  sx={{
                    textDecoration: 'line-through',
                    color: 'text.secondary',
                    fontSize: '0.9rem',
                  }}
                >
                  {toPersianCurrency(price)}
                </Typography>
              )}
              <Typography
                variant="h6"
                component="span"
                sx={{
                  fontWeight: 700,
                  color: discountPrice ? 'error.main' : 'text.primary',
                  fontSize: '1.1rem',
                }}
              >
                {displayPrice > 0 ? toPersianCurrency(displayPrice) : 'تماس بگیرید'}
              </Typography>
            </Box>
          </Box>
        </CardContent>

        {/* Actions */}
        <CardActions sx={{ p: 2, pt: 0, justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
            {CART_ENABLED ? (
              <AddToCartButton
                product={product}
                variant="contained"
                size="small"
                fullWidth
                disabled={false}
                customText={inStock ? 'افزودن به سبد خرید' : 'افزودن به سبد خرید'}
                sx={{ flex: 1 }}
              />
            ) : (
              <Button
                variant="outlined"
                size="small"
                fullWidth
                component={RouterLink}
                to={contactRoute}
                startIcon={<PhoneIcon />}
                sx={{ flex: 1 }}
              >
                استعلام قیمت
              </Button>
            )}
            
            <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
              <Tooltip title="مشاهده جزئیات">
                <IconButton
                  onClick={handleViewProduct}
                  color="primary"
                  size="small"
                  sx={{
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.5)}`,
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                    },
                  }}
                >
                  <ViewIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </motion.div>
          </Box>
        </CardActions>
      </Card>
    </motion.div>
  );
};

export default ProductCard;