import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { recommendationAPI } from '../services/api';
import { motion } from 'framer-motion';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActionArea,
  Button,
  Chip,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Avatar,
  Rating,
  IconButton,
  Tooltip,
  Paper,
  Skeleton,
  Stack,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  ShoppingCart as ShoppingCartIcon,
  TrendingUp as TrendingUpIcon,
  Psychology as PsychologyIcon,
  DirectionsCar as DirectionsCarIcon,
  Category as CategoryIcon,
  Brightness1 as DotIcon,
  Star as StarIcon,
  LocalOffer as OfferIcon,
} from '@mui/icons-material';
import { toPersianCurrency } from '../utils/persianUtils';

const EnhancedRecommendations = ({ 
  productId = null, 
  categorySlug = null, 
  vehicleId = null,
  showTabs = true,
  defaultTab = 0,
  maxItems = 8 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useSelector(state => state.auth);
  
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [recommendations, setRecommendations] = useState({});
  const [loading, setLoading] = useState({});
  const [error, setError] = useState({});

  // Recommendation types configuration
  const recommendationTypes = [
    {
      id: 'personalized',
      label: 'پیشنهادات شخصی',
      icon: <PsychologyIcon />,
      description: 'بر اساس سلیقه و تاریخچه شما',
      color: 'primary',
    },
    {
      id: 'similar',
      label: 'محصولات مشابه',
      icon: <CategoryIcon />,
      description: 'محصولات مرتبط با این محصول',
      color: 'secondary',
      requiresProduct: true,
    },
    {
      id: 'complementary',
      label: 'محصولات مکمل',
      icon: <OfferIcon />,
      description: 'محصولاتی که با هم مناسب هستند',
      color: 'success',
      requiresCategory: true,
    },
    {
      id: 'vehicle',
      label: 'سازگار با خودرو',
      icon: <DirectionsCarIcon />,
      description: 'متناسب با خودروی شما',
      color: 'info',
      requiresVehicle: true,
    },
    {
      id: 'trending',
      label: 'محبوب روز',
      icon: <TrendingUpIcon />,
      description: 'پرفروش‌ترین محصولات',
      color: 'warning',
    },
    {
      id: 'hybrid',
      label: 'ترکیبی هوشمند',
      icon: <StarIcon />,
      description: 'ترکیب بهترین پیشنهادات',
      color: 'error',
    },
  ];

  // Filter available recommendation types based on props
  const availableTypes = recommendationTypes.filter(type => {
    if (type.requiresProduct && !productId) return false;
    if (type.requiresCategory && !categorySlug) return false;
    if (type.requiresVehicle && !vehicleId) return false;
    return true;
  });

  useEffect(() => {
    if (availableTypes.length > 0) {
      loadRecommendations(availableTypes[activeTab]?.id);
    }
  }, [activeTab, productId, categorySlug, vehicleId, availableTypes, maxItems]);

  const loadRecommendations = async (type) => {
    if (!type || loading[type]) return;

    setLoading(prev => ({ ...prev, [type]: true }));
    setError(prev => ({ ...prev, [type]: null }));

    try {
      let response;
      const params = { limit: maxItems };

      switch (type) {
        case 'personalized':
          response = await recommendationAPI.getPersonalizedRecommendations(params);
          break;
        case 'similar':
          if (productId) {
            response = await recommendationAPI.getSimilarProducts(productId, params);
          }
          break;
        case 'complementary':
          if (categorySlug) {
            response = await recommendationAPI.getComplementaryProducts(categorySlug, params);
          }
          break;
        case 'vehicle':
          if (vehicleId) {
            response = await recommendationAPI.getVehicleCompatibleRecommendations(vehicleId, params);
          }
          break;
        case 'trending':
          response = await recommendationAPI.getTrendingProducts(params);
          break;
        case 'hybrid':
          response = await recommendationAPI.getHybridRecommendations(params);
          break;
        default:
          response = await recommendationAPI.getContentBasedRecommendations(params);
      }

      if (response?.data?.data) {
        setRecommendations(prev => ({
          ...prev,
          [type]: response.data.data
        }));
      }
    } catch (err) {
      console.error(`Failed to load ${type} recommendations:`, err);
      setError(prev => ({
        ...prev,
        [type]: err.response?.data?.message || 'خطا در بارگذاری پیشنهادات'
      }));
    } finally {
      setLoading(prev => ({ ...prev, [type]: false }));
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    const type = availableTypes[newValue]?.id;
    if (type && !recommendations[type]) {
      loadRecommendations(type);
    }
  };

  const recordInteraction = async (productId, eventType) => {
    try {
      await recommendationAPI.recordEvent({
        eventType,
        productId,
        sessionId: sessionStorage.getItem('sessionId'),
        metadata: {
          source: 'enhanced_recommendations',
          recommendationType: availableTypes[activeTab]?.id,
        }
      });
    } catch (err) {
      console.error('Failed to record interaction:', err);
    }
  };

  const currentType = availableTypes[activeTab];
  const currentRecommendations = recommendations[currentType?.id] || [];
  const isLoading = loading[currentType?.id];
  const hasError = error[currentType?.id];

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Header */}
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography
            variant="h4"
            component="h2"
            gutterBottom
            sx={{
              fontWeight: 700,
              background: 'linear-gradient(45deg, #1976d2, #2196f3)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            سیستم پیشنهاد هوشمند
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
            پیشنهادات شخصی‌سازی شده بر اساس علائق، خودرو و نیازهای شما
          </Typography>
        </Box>

        {/* Tabs */}
        {showTabs && availableTypes.length > 1 && (
          <Paper elevation={1} sx={{ mb: 3, borderRadius: 2 }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant={isMobile ? "scrollable" : "fullWidth"}
              scrollButtons="auto"
              sx={{
                '& .MuiTab-root': {
                  minHeight: 72,
                  textTransform: 'none',
                  fontWeight: 600,
                },
              }}
            >
              {availableTypes.map((type, index) => (
                <Tab
                  key={type.id}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar
                        sx={{
                          width: 24,
                          height: 24,
                          bgcolor: `${type.color}.main`,
                          fontSize: 14,
                        }}
                      >
                        {type.icon}
                      </Avatar>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {type.label}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {type.description}
                        </Typography>
                      </Box>
                    </Box>
                  }
                />
              ))}
            </Tabs>
          </Paper>
        )}

        {/* Content */}
        <Box sx={{ minHeight: 400 }}>
          {isLoading ? (
            <Grid container spacing={3}>
              {Array.from({ length: maxItems }).map((_, index) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                  <Card>
                    <Skeleton variant="rectangular" height={200} />
                    <CardContent>
                      <Skeleton variant="text" height={30} />
                      <Skeleton variant="text" height={20} />
                      <Skeleton variant="text" width={100} height={25} />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : hasError ? (
            <Alert 
              severity="error" 
              action={
                <Button 
                  color="inherit" 
                  size="small" 
                  onClick={() => loadRecommendations(currentType?.id)}
                >
                  تلاش مجدد
                </Button>
              }
            >
              {hasError}
            </Alert>
          ) : currentRecommendations.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                پیشنهادی موجود نیست
              </Typography>
              <Typography variant="body2" color="text.secondary">
                در حال حاضر پیشنهاد خاصی برای نمایش وجود ندارد
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {currentRecommendations.map((item, index) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={item.productId || index}>
                  <RecommendationCard
                    recommendation={item}
                    index={index}
                    onInteraction={recordInteraction}
                    recommendationType={currentType}
                  />
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </motion.div>
    </Container>
  );
};

const RecommendationCard = ({ recommendation, index, onInteraction, recommendationType }) => {
  const theme = useTheme();
  const { product, score, reason } = recommendation;
  const [isFavorite, setIsFavorite] = useState(false);

  const handleCardClick = () => {
    onInteraction(product._id || product.productId, 'view');
    // Navigate to product page
    window.location.href = `/products/${product._id || product.productId}`;
  };

  const handleAddToCart = (e) => {
    e.stopPropagation();
    onInteraction(product._id || product.productId, 'add_to_cart');
    // Add to cart logic here
  };

  const handleFavoriteToggle = (e) => {
    e.stopPropagation();
    setIsFavorite(!isFavorite);
    onInteraction(product._id || product.productId, isFavorite ? 'remove_favorite' : 'add_favorite');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      whileHover={{ y: -5 }}
    >
      <Card
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: theme.shadows[8],
            transform: 'translateY(-2px)',
          },
        }}
      >
        {/* Score Badge */}
        <Chip
          label={`امتیاز: ${Math.round(score * 10) / 10}`}
          size="small"
          color={recommendationType?.color || 'primary'}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 1,
            fontWeight: 600,
          }}
        />

        {/* Favorite Button */}
        <IconButton
          onClick={handleFavoriteToggle}
          sx={{
            position: 'absolute',
            top: 8,
            left: 8,
            zIndex: 1,
            bgcolor: 'rgba(255, 255, 255, 0.9)',
            '&:hover': { bgcolor: 'rgba(255, 255, 255, 1)' },
          }}
          size="small"
        >
          {isFavorite ? (
            <FavoriteIcon color="error" />
          ) : (
            <FavoriteBorderIcon />
          )}
        </IconButton>

        <CardActionArea onClick={handleCardClick} sx={{ flexGrow: 1 }}>
          {/* Product Image */}
          <CardMedia
            component="img"
            height="200"
            image={product.images?.[0]?.url || '/images/products/placeholder.jpg'}
            alt={product.name}
            sx={{ objectFit: 'cover' }}
          />

          <CardContent sx={{ flexGrow: 1, pb: 1 }}>
            {/* Product Name */}
            <Typography
              variant="h6"
              component="h3"
              sx={{
                fontWeight: 600,
                mb: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                lineHeight: 1.3,
              }}
            >
              {product.name}
            </Typography>

            {/* Recommendation Reason */}
            <Box sx={{ mb: 2 }}>
              <Chip
                label={reason}
                size="small"
                variant="outlined"
                color="secondary"
                icon={<DotIcon sx={{ fontSize: 8 }} />}
                sx={{
                  fontSize: '0.75rem',
                  height: 24,
                  '& .MuiChip-label': {
                    px: 1,
                  },
                }}
              />
            </Box>

            {/* Price */}
            <Typography
              variant="h6"
              color="primary.main"
              sx={{ fontWeight: 700, mb: 1 }}
            >
              {toPersianCurrency(product.price)}
            </Typography>

            {/* Rating */}
            {product.averageRating && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Rating
                  value={product.averageRating}
                  precision={0.1}
                  readOnly
                  size="small"
                />
                <Typography variant="caption" color="text.secondary">
                  ({product.reviewCount || 0})
                </Typography>
              </Box>
            )}

            {/* Vehicle Compatibility */}
            {product.compatibleVehicles && product.compatibleVehicles.length > 0 && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  سازگار با {product.compatibleVehicles.length} خودرو
                </Typography>
              </Box>
            )}
          </CardContent>
        </CardActionArea>

        {/* Add to Cart Button */}
        <Box sx={{ p: 2, pt: 0 }}>
          <Button
            fullWidth
            variant="contained"
            startIcon={<ShoppingCartIcon />}
            onClick={handleAddToCart}
            sx={{
              py: 1,
              fontWeight: 600,
              borderRadius: 2,
            }}
          >
            افزودن به سبد
          </Button>
        </Box>
      </Card>
    </motion.div>
  );
};

export default EnhancedRecommendations; 