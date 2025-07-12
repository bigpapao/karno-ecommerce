import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Skeleton,
  useTheme,
  useMediaQuery,
  Chip,
} from '@mui/material';
import {
  ArrowForward as ArrowForwardIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import { categoryAPI } from '../services/api';

// Modern automotive icons for categories
const CategoryIcon = ({ categoryName, size = 48 }) => {
  const iconProps = {
    style: { 
      fontSize: size, 
      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
    }
  };

  const getIconPath = (name) => {
    const categoryName = name?.toLowerCase() || '';
    
    if (categoryName.includes('موتور') || categoryName.includes('engine')) {
      return (
        <svg viewBox="0 0 24 24" {...iconProps}>
          <path fill="currentColor" d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M14,17H16V15H14V17M10,17H12V15H10V17M8,17H10V15H8V17M14,13H16V11H14V13M10,13H12V11H10V13M8,13H10V11H8V13M14,9H16V7H14V9M10,9H12V7H10V9M8,9H10V7H8V9Z"/>
        </svg>
      );
    }
    
    if (categoryName.includes('ترمز') || categoryName.includes('brake')) {
      return (
        <svg viewBox="0 0 24 24" {...iconProps}>
          <path fill="currentColor" d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,6A6,6 0 0,1 18,12A6,6 0 0,1 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6M12,8A4,4 0 0,0 8,12A4,4 0 0,0 12,16A4,4 0 0,0 16,12A4,4 0 0,0 12,8Z"/>
        </svg>
      );
    }
    
    if (categoryName.includes('تعلیق') || categoryName.includes('suspension') || categoryName.includes('جلوبندی')) {
      return (
        <svg viewBox="0 0 24 24" {...iconProps}>
          <path fill="currentColor" d="M12,2L8,6H16L12,2M12,22L16,18H8L12,22M7,10V14H17V10H7M5,8H19A1,1 0 0,1 20,9V15A1,1 0 0,1 19,16H5A1,1 0 0,1 4,15V9A1,1 0 0,1 5,8Z"/>
        </svg>
      );
    }
    
    if (categoryName.includes('برق') || categoryName.includes('electrical') || categoryName.includes('الکترونیک')) {
      return (
        <svg viewBox="0 0 24 24" {...iconProps}>
          <path fill="currentColor" d="M12,2L13.09,8.26L22,9L14.74,14.74L16.5,22L12,18.23L7.5,22L9.26,14.74L2,9L10.91,8.26L12,2M8,14L12,17L16,14L12,11L8,14Z"/>
        </svg>
      );
    }
    
    if (categoryName.includes('سوخت') || categoryName.includes('fuel')) {
      return (
        <svg viewBox="0 0 24 24" {...iconProps}>
          <path fill="currentColor" d="M3,3H15V13C15,14.11 15.89,15 17,15H18V18C18,19.11 18.89,20 20,20A2,2 0 0,0 22,18V12L20,10V8A2,2 0 0,0 18,6C16.89,6 16,6.89 16,8V10H17V8C17,7.45 17.45,7 18,7C18.55,7 19,7.45 19,8V9.17L20.41,10.59L20.41,10.59C20.78,10.95 21,11.46 21,12V18C21,18.55 20.55,19 20,19C19.45,19 19,18.55 19,18V15A2,2 0 0,0 17,13H16V13C15,13 14,12 14,11V3.5H14V3M4,4V12H13V4H4M6,6H11V10H6V6Z"/>
        </svg>
      );
    }
    
    if (categoryName.includes('خنک') || categoryName.includes('cooling') || categoryName.includes('رادیاتور')) {
      return (
        <svg viewBox="0 0 24 24" {...iconProps}>
          <path fill="currentColor" d="M12,4L9,8H15L12,4M12,20L15,16H9L12,20M4,13V11L8,12L4,13M20,13V11L16,12L20,13M6.5,7.5L8.5,9.5L7.5,10.5L5.5,8.5L6.5,7.5M17.5,7.5L18.5,8.5L16.5,10.5L15.5,9.5L17.5,7.5M6.5,16.5L5.5,15.5L7.5,13.5L8.5,14.5L6.5,16.5M17.5,16.5L15.5,14.5L16.5,13.5L18.5,15.5L17.5,16.5M12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9Z"/>
        </svg>
      );
    }
    
    if (categoryName.includes('بدنه') || categoryName.includes('body') || categoryName.includes('کاروسری')) {
      return (
        <svg viewBox="0 0 24 24" {...iconProps}>
          <path fill="currentColor" d="M18.92,6.01C18.72,5.42 18.16,5 17.5,5H6.5C5.84,5 5.28,5.42 5.08,6.01L3,12V20A1,1 0 0,0 4,21H5A1,1 0 0,0 6,20V19H18V20A1,1 0 0,0 19,21H20A1,1 0 0,0 21,20V12L18.92,6.01M6.5,16A1.5,1.5 0 0,1 5,14.5A1.5,1.5 0 0,1 6.5,13A1.5,1.5 0 0,1 8,14.5A1.5,1.5 0 0,1 6.5,16M17.5,16A1.5,1.5 0 0,1 16,14.5A1.5,1.5 0 0,1 17.5,13A1.5,1.5 0 0,1 19,14.5A1.5,1.5 0 0,1 17.5,16M5,11L6.5,7.5H17.5L19,11H5Z"/>
        </svg>
      );
    }
    
    if (categoryName.includes('گیربکس') || categoryName.includes('transmission') || categoryName.includes('کلاچ')) {
      return (
        <svg viewBox="0 0 24 24" {...iconProps}>
          <path fill="currentColor" d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.98C19.47,12.66 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11.02L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.65 15.48,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.52,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.21,8.95 2.27,9.22 2.46,9.37L4.57,11.02C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.21,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.52,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.48,18.68 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.98Z"/>
        </svg>
      );
    }
    
    if (categoryName.includes('مصرفی') || categoryName.includes('consumable') || categoryName.includes('روغن') || categoryName.includes('فیلتر')) {
      return (
        <svg viewBox="0 0 24 24" {...iconProps}>
          <path fill="currentColor" d="M12,2A3,3 0 0,1 15,5V11A3,3 0 0,1 12,14A3,3 0 0,1 9,11V5A3,3 0 0,1 12,2M12,4A1,1 0 0,0 11,5V11A1,1 0 0,0 12,12A1,1 0 0,0 13,11V5A1,1 0 0,0 12,4M12,15A4,4 0 0,1 16,19V22H8V19A4,4 0 0,1 12,15M8,19H16A2,2 0 0,0 14,17H10A2,2 0 0,0 8,19Z"/>
        </svg>
      );
    }
    
    if (categoryName.includes('جانبی') || categoryName.includes('accessory') || categoryName.includes('لوازم')) {
      return (
        <svg viewBox="0 0 24 24" {...iconProps}>
          <path fill="currentColor" d="M18,15H16V17H18M18,11H16V13H18M20,19H12V17H14V15H12V13H14V11H12V9H20M10,7H8V5H10M10,11H8V9H10M10,15H8V13H10M10,19H8V17H10M6,7H4V5H6M6,11H4V9H6M6,15H4V13H6M6,19H4V17H6M12,7V3H2V21H22V7H12Z"/>
        </svg>
      );
    }
    
    // Default car icon
    return (
      <svg viewBox="0 0 24 24" {...iconProps}>
        <path fill="currentColor" d="M18.92,6.01C18.72,5.42 18.16,5 17.5,5H6.5C5.84,5 5.28,5.42 5.08,6.01L3,12V20A1,1 0 0,0 4,21H5A1,1 0 0,0 6,20V19H18V20A1,1 0 0,0 19,21H20A1,1 0 0,0 21,20V12L18.92,6.01M6.5,16A1.5,1.5 0 0,1 5,14.5A1.5,1.5 0 0,1 6.5,13A1.5,1.5 0 0,1 8,14.5A1.5,1.5 0 0,1 6.5,16M17.5,16A1.5,1.5 0 0,1 16,14.5A1.5,1.5 0 0,1 17.5,13A1.5,1.5 0 0,1 19,14.5A1.5,1.5 0 0,1 17.5,16M5,11L6.5,7.5H17.5L19,11H5Z"/>
      </svg>
    );
  };

  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      {getIconPath(categoryName)}
    </Box>
  );
};

const PremiumCategoryCards = ({ maxCategories = 12, showTitle = true }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await categoryAPI.getCategories({ 
          featured: true, 
          limit: maxCategories,
          parentOnly: true 
        });
        
        if (response.data && response.data.status === 'success') {
          setCategories(response.data.data || []);
        } else {
          throw new Error('Failed to fetch categories');
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError('خطا در دریافت دسته‌بندی‌ها');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [maxCategories]);

  const handleCategoryClick = (category) => {
    navigate(`/products?category=${category.slug}`);
  };

  const CategoryCardSkeleton = () => (
    <Card 
      sx={{ 
        height: 320,
        borderRadius: 3,
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <Skeleton variant="circular" width={64} height={64} />
        </Box>
        <Skeleton variant="text" height={32} width="80%" sx={{ mx: 'auto', mb: 1 }} />
        <Skeleton variant="text" height={20} width="100%" sx={{ mb: 1 }} />
        <Skeleton variant="text" height={20} width="70%" sx={{ mx: 'auto', mb: 3 }} />
        <Skeleton variant="rectangular" height={40} width="100%" sx={{ borderRadius: 2 }} />
      </CardContent>
    </Card>
  );

  if (error) {
    return (
      <Box sx={{ py: 4, textAlign: 'center', direction: 'rtl' }}>
        <Typography variant="h6" color="error">
          {error}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ py: { xs: 4, md: 6 }, bgcolor: 'background.default' }}>
      <Container maxWidth="xl">
        {showTitle && (
          <Box sx={{ textAlign: 'center', mb: { xs: 4, md: 6 }, direction: 'rtl' }}>
            <Typography
              variant="h2"
              component="h2"
              sx={{
                fontSize: { xs: '2rem', md: '2.75rem', lg: '3rem' },
                fontWeight: 800,
                background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 2,
                position: 'relative',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  bottom: -8,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 60,
                  height: 4,
                  background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
                  borderRadius: 2,
                }
              }}
            >
              دسته‌بندی قطعات خودرو
            </Typography>
            <Typography
              variant="h6"
              color="text.secondary"
              sx={{
                maxWidth: 600,
                mx: 'auto',
                lineHeight: 1.6,
                fontSize: { xs: '1rem', md: '1.125rem' }
              }}
            >
              بهترین قطعات اصلی و با کیفیت برای خودروهای ایرانی
            </Typography>
          </Box>
        )}

        <Grid container spacing={{ xs: 2, md: 3, lg: 4 }}>
          {loading ? (
            Array.from({ length: 6 }).map((_, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <CategoryCardSkeleton />
              </Grid>
            ))
          ) : (
            categories.map((category, index) => (
              <Grid item xs={12} sm={6} md={4} key={category._id}>
                <Card
                  onClick={() => handleCategoryClick(category)}
                  sx={{
                    height: 320,
                    cursor: 'pointer',
                    borderRadius: 3,
                    overflow: 'hidden',
                    position: 'relative',
                    background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                    border: '1px solid',
                    borderColor: 'divider',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
                      borderColor: 'primary.main',
                      '& .category-icon': {
                        transform: 'scale(1.1) rotate(5deg)',
                        color: 'primary.main',
                      },
                      '& .category-button': {
                        backgroundColor: 'primary.main',
                        color: 'white',
                        '& .MuiSvgIcon-root': {
                          transform: 'translateX(-4px)',
                        }
                      },
                      '& .category-overlay': {
                        opacity: 1,
                      }
                    },
                    direction: 'rtl'
                  }}
                >
                  {/* Hover Overlay */}
                  <Box
                    className="category-overlay"
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'linear-gradient(135deg, rgba(25,118,210,0.05) 0%, rgba(66,165,245,0.05) 100%)',
                      opacity: 0,
                      transition: 'opacity 0.3s ease',
                      pointerEvents: 'none',
                    }}
                  />

                  {/* Featured Badge */}
                  {category.featured && (
                    <Chip
                      icon={<StarIcon sx={{ fontSize: 16 }} />}
                      label="ویژه"
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 16,
                        right: 16,
                        zIndex: 2,
                        backgroundColor: '#ff9800',
                        color: 'white',
                        fontWeight: 600,
                        '& .MuiChip-icon': {
                          color: 'white'
                        }
                      }}
                    />
                  )}

                  <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                    {/* Icon Section */}
                    <Box 
                      sx={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        mb: 3,
                        position: 'relative'
                      }}
                    >
                      <Box
                        sx={{
                          width: 80,
                          height: 80,
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative',
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: -2,
                            left: -2,
                            right: -2,
                            bottom: -2,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #1976d2, #42a5f5)',
                            opacity: 0.2,
                            zIndex: -1,
                          }
                        }}
                      >
                        <Box
                          className="category-icon"
                          sx={{
                            color: '#1976d2',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          }}
                        >
                          <CategoryIcon categoryName={category.name} size={40} />
                        </Box>
                      </Box>
                    </Box>

                    {/* Content Section */}
                    <Box sx={{ flexGrow: 1, textAlign: 'center' }}>
                      <Typography
                        variant="h5"
                        component="h3"
                        sx={{
                          fontWeight: 700,
                          mb: 2,
                          color: 'text.primary',
                          fontSize: { xs: '1.25rem', md: '1.375rem' },
                          lineHeight: 1.3,
                        }}
                      >
                        {category.name}
                      </Typography>
                      
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          lineHeight: 1.6,
                          mb: 3,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          fontSize: '0.95rem',
                        }}
                      >
                        {category.description}
                      </Typography>

                      {/* Product Count */}
                      {category.productCount && (
                        <Typography
                          variant="caption"
                          sx={{
                            color: 'primary.main',
                            fontWeight: 600,
                            fontSize: '0.85rem',
                            mb: 2,
                            display: 'block'
                          }}
                        >
                          {category.productCount} محصول موجود
                        </Typography>
                      )}
                    </Box>

                    {/* Action Button */}
                    <Button
                      className="category-button"
                      variant="outlined"
                      endIcon={<ArrowForwardIcon />}
                      sx={{
                        borderRadius: 2,
                        borderWidth: 2,
                        borderColor: 'divider',
                        color: 'text.primary',
                        fontWeight: 600,
                        py: 1.2,
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          borderWidth: 2,
                        },
                        '& .MuiSvgIcon-root': {
                          transition: 'transform 0.3s ease',
                        }
                      }}
                    >
                      مشاهده محصولات
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))
          )}
        </Grid>

        {/* View All Categories Button */}
        {!loading && categories.length > 0 && (
          <Box sx={{ textAlign: 'center', mt: 6 }}>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/categories')}
              sx={{
                borderRadius: 3,
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 600,
                background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                boxShadow: '0 8px 25px rgba(25,118,210,0.3)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 12px 35px rgba(25,118,210,0.4)',
                }
              }}
            >
              مشاهده همه دسته‌بندی‌ها
            </Button>
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default PremiumCategoryCards; 