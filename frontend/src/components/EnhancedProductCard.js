import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Typography,
  Button,
  IconButton,
  Box,
  Chip,
  Rating,
  Badge,
  Tooltip,
  Skeleton,
  useTheme,
  Zoom,
  Fade,
} from '@mui/material';
import {
  ShoppingCart as CartIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Visibility as ViewIcon,
  Compare as CompareIcon,
  LocalOffer as OfferIcon,
  Verified as VerifiedIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { addToCart } from '../store/slices/cartSlice';
import { toPersianCurrency, toPersianNumber } from '../utils/persianUtils';

const EnhancedProductCard = ({ 
  product, 
  loading = false, 
  onCompare, 
  onQuickView,
  compact = false 
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false); // In real app, get from Redux store
  
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const theme = useTheme();
  const cartItems = useSelector((state) => state.cart.items);

  const isInCart = cartItems.some(item => item.productId === product?._id);

  const handleAddToCart = (e) => {
    e.stopPropagation();
    if (!product) return;
    
    dispatch(addToCart({
      productId: product._id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: 1
    }));
  };

  const handleFavoriteToggle = (e) => {
    e.stopPropagation();
    setIsFavorite(!isFavorite);
    // In real app: dispatch favoriteToggle action
  };

  const handleCompare = (e) => {
    e.stopPropagation();
    onCompare && onCompare(product);
  };

  const handleQuickView = (e) => {
    e.stopPropagation();
    onQuickView && onQuickView(product);
  };

  const handleCardClick = () => {
    if (product?._id) {
      navigate(`/products/${product._id}`);
    }
  };

  if (loading) {
    return (
      <Card sx={{ height: compact ? 280 : 400, position: 'relative' }}>
        <Skeleton variant="rectangular" height={compact ? 120 : 200} />
        <CardContent>
          <Skeleton variant="text" height={32} />
          <Skeleton variant="text" height={24} width="60%" />
          <Skeleton variant="text" height={28} width="40%" />
        </CardContent>
        <CardActions>
          <Skeleton variant="rectangular" width={100} height={36} />
          <Skeleton variant="circular" width={40} height={40} />
        </CardActions>
      </Card>
    );
  }

  if (!product) return null;

  const hasDiscount = product.originalPrice && product.originalPrice > product.price;
  const discountPercent = hasDiscount 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        sx={{
          height: compact ? 280 : 400,
          position: 'relative',
          cursor: 'pointer',
          overflow: 'hidden',
          borderRadius: 3,
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
            transform: 'translateY(-2px)',
          },
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleCardClick}
      >
        {/* Product Image */}
        <Box sx={{ position: 'relative', overflow: 'hidden' }}>
          {!imageLoaded && (
            <Skeleton 
              variant="rectangular" 
              height={compact ? 120 : 200} 
              animation="wave" 
            />
          )}
          <CardMedia
            component="img"
            height={compact ? 120 : 200}
            image={product.image || '/images/placeholder.jpg'}
            alt={product.name}
            onLoad={() => setImageLoaded(true)}
            sx={{
              transition: 'transform 0.3s ease',
              transform: isHovered ? 'scale(1.05)' : 'scale(1)',
              display: imageLoaded ? 'block' : 'none',
            }}
          />

          {/* Discount Badge */}
          {hasDiscount && (
            <Chip
              icon={<OfferIcon />}
              label={`${toPersianNumber(discountPercent)}% تخفیف`}
              color="error"
              size="small"
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                fontWeight: 'bold',
                fontSize: '0.75rem',
              }}
            />
          )}

          {/* Product Quality Badge */}
          {product.isOriginal && (
            <Tooltip title="قطعه اصل">
              <Chip
                icon={<VerifiedIcon />}
                label="اصل"
                color="success"
                size="small"
                sx={{
                  position: 'absolute',
                  top: hasDiscount ? 48 : 8,
                  right: 8,
                  fontWeight: 'bold',
                  fontSize: '0.75rem',
                }}
              />
            </Tooltip>
          )}

          {/* Quick Actions Overlay */}
          <Fade in={isHovered}>
            <Box
              sx={{
                position: 'absolute',
                top: 8,
                left: 8,
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
              }}
            >
              <Tooltip title="افزودن به علاقه‌مندی‌ها">
                <IconButton
                  size="small"
                  onClick={handleFavoriteToggle}
                  sx={{
                    backgroundColor: 'background.paper',
                    boxShadow: 1,
                    '&:hover': { backgroundColor: 'background.paper' },
                  }}
                >
                  {isFavorite ? (
                    <FavoriteIcon color="error" />
                  ) : (
                    <FavoriteBorderIcon />
                  )}
                </IconButton>
              </Tooltip>

              <Tooltip title="مقایسه محصولات">
                <IconButton
                  size="small"
                  onClick={handleCompare}
                  sx={{
                    backgroundColor: 'background.paper',
                    boxShadow: 1,
                    '&:hover': { backgroundColor: 'background.paper' },
                  }}
                >
                  <CompareIcon />
                </IconButton>
              </Tooltip>

              <Tooltip title="مشاهده سریع">
                <IconButton
                  size="small"
                  onClick={handleQuickView}
                  sx={{
                    backgroundColor: 'background.paper',
                    boxShadow: 1,
                    '&:hover': { backgroundColor: 'background.paper' },
                  }}
                >
                  <ViewIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Fade>
        </Box>

        {/* Product Content */}
        <CardContent sx={{ p: compact ? 1.5 : 2, flexGrow: 1 }}>
          <Typography
            variant={compact ? "body2" : "h6"}
            component="h3"
            gutterBottom
            sx={{
              fontWeight: 600,
              direction: 'rtl',
              lineHeight: 1.3,
              height: compact ? 32 : 48,
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {product.name}
          </Typography>

          {/* Brand */}
          {product.brand && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ direction: 'rtl', display: 'block', mb: 1 }}
            >
              برند: {product.brand}
            </Typography>
          )}

          {/* Rating */}
          {product.rating && (
            <Box display="flex" alignItems="center" gap={0.5} mb={1}>
              <Rating 
                value={product.rating} 
                readOnly 
                size="small" 
                precision={0.5}
              />
              <Typography variant="caption" color="text.secondary">
                ({toPersianNumber(product.reviewCount || 0)})
              </Typography>
            </Box>
          )}

          {/* Price */}
          <Box>
            {hasDiscount && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  textDecoration: 'line-through',
                  direction: 'rtl',
                  display: 'block',
                }}
              >
                {toPersianCurrency(product.originalPrice)}
              </Typography>
            )}
            <Typography
              variant={compact ? "h6" : "h5"}
              color="primary"
              fontWeight="bold"
              sx={{ direction: 'rtl' }}
            >
              {toPersianCurrency(product.price)}
            </Typography>
          </Box>

          {/* Stock Status */}
          <Box mt={1}>
            {product.stock > 0 ? (
              <Chip
                label={`${toPersianNumber(product.stock)} عدد موجود`}
                color="success"
                size="small"
                variant="outlined"
              />
            ) : (
              <Chip
                label="ناموجود"
                color="error"
                size="small"
                variant="outlined"
              />
            )}
          </Box>
        </CardContent>

        {/* Actions */}
        <CardActions sx={{ p: compact ? 1.5 : 2, pt: 0 }}>
          <Button
            variant="contained"
            fullWidth
            startIcon={isInCart ? <CartIcon /> : <CartIcon />}
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              backgroundColor: isInCart ? 'success.main' : 'primary.main',
              '&:hover': {
                backgroundColor: isInCart ? 'success.dark' : 'primary.dark',
              },
            }}
          >
            {isInCart ? 'در سبد خرید' : 'افزودن به سبد'}
          </Button>
        </CardActions>

        {/* Availability Indicator */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            height: 3,
            backgroundColor: product.stock > 0 ? 'success.main' : 'error.main',
          }}
        />
      </Card>
    </motion.div>
  );
};

export default EnhancedProductCard; 