import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  Button,
  Card,
  CardActionArea,
  alpha,
  useMediaQuery,
  useTheme,
  Skeleton,
  Alert,
} from '@mui/material';
import { DirectionsCar as CarIcon } from '@mui/icons-material';
import { brandAPI } from '../services/api';

const FeaturedBrands = () => {
  const navigate = useNavigate();
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFeaturedBrands = async () => {
      try {
        setLoading(true);
        const response = await brandAPI.getFeaturedBrands(8); // Get 8 featured brands
        
        if (response.data && response.data.success) {
          setBrands(response.data.data.brands || []);
        } else {
          throw new Error('Failed to fetch brands');
        }
      } catch (err) {
        console.error('Error fetching featured brands:', err);
        setError('خطا در دریافت برندها. لطفاً دوباره تلاش کنید.');
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedBrands();
  }, []);

  const BrandSkeleton = () => (
    <Grid item xs={12} sm={6} md={3}>
      <Card
        elevation={0}
        sx={{
          height: '100%',
          borderRadius: '16px',
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'rgba(0,0,0,0.1)',
        }}
      >
        <Box sx={{ p: 3 }}>
          <Skeleton variant="circular" width={48} height={48} sx={{ mb: 2 }} />
          <Skeleton variant="text" height={32} width="70%" sx={{ mb: 1 }} />
          <Skeleton variant="text" height={20} width="100%" />
          <Skeleton variant="text" height={20} width="80%" />
          <Box sx={{ mt: 2, pt: 2 }}>
            <Skeleton variant="text" height={16} width="50%" />
          </Box>
        </Box>
      </Card>
    </Grid>
  );

  // Color palette for brands
  const brandColors = [
    '#e53935', // red
    '#1976d2', // blue
    '#43a047', // green
    '#7b1fa2', // purple
    '#f57c00', // orange
    '#00acc1', // cyan
    '#d32f2f', // dark red
    '#303f9f', // indigo
  ];

  if (error) {
    return (
      <Box sx={{ py: 8 }}>
        <Container maxWidth="lg">
          <Alert severity="error" sx={{ direction: 'rtl' }}>
            {error}
          </Alert>
        </Container>
      </Box>
    );
  }

  return (
    <Box
      className="featured-brands"
      sx={{
        py: { xs: 6, md: 8 },
        backgroundColor: 'rgba(232, 244, 253, 0.6)',
        borderRadius: '16px',
        mx: { xs: 2, md: 4 },
        my: 6,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background elements */}
      <Box
        sx={{
          position: 'absolute',
          top: -70,
          right: -70,
          width: 200,
          height: 200,
          borderRadius: '50%',
          backgroundColor: alpha('#4fc3f7', 0.2),
          zIndex: 0,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: -80,
          left: -80,
          width: 260,
          height: 260,
          borderRadius: '50%',
          backgroundColor: alpha('#4fc3f7', 0.15),
          zIndex: 0,
        }}
      />

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Box
          sx={{
            textAlign: 'center',
            mb: { xs: 4, md: 6 },
          }}
        >
          <Typography
            component="h2"
            variant="h3"
            sx={{
              fontWeight: 700,
              mb: 2,
              direction: 'rtl',
              background: 'linear-gradient(45deg, #1976d2, #64b5f6)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textAlign: 'center',
            }}
          >
            برندهای معتبر قطعات خودرو
          </Typography>
          <Typography
            variant="h6"
            color="text.secondary"
            align="center"
            sx={{ direction: 'rtl', mb: 3, maxWidth: '800px', mx: 'auto' }}
          >
            ارائه قطعات کمیاب و اصل برای تمامی مدل‌های خودروهای ایرانی و خارجی
          </Typography>
        </Box>

        <Grid container spacing={3} justifyContent="center">
          {loading ? (
            // Show skeletons while loading
            Array.from({ length: 8 }).map((_, index) => (
              <BrandSkeleton key={index} />
            ))
          ) : (
            brands.map((brand, index) => {
              const brandColor = brandColors[index % brandColors.length];
              
              return (
                <Grid item key={brand._id} xs={12} sm={6} md={3}>
                  <Card
                    elevation={0}
                    sx={{
                      height: '100%',
                      borderRadius: '16px',
                      overflow: 'hidden',
                      transition: 'all 0.3s ease',
                      border: '1px solid',
                      borderColor: alpha(brandColor, 0.2),
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: `0 12px 20px -8px ${alpha(brandColor, 0.25)}`,
                      },
                    }}
                  >
                    <CardActionArea
                      onClick={() => navigate(`/brands/${brand.slug}`)}
                      sx={{ height: '100%' }}
                    >
                      <Box 
                        sx={{
                          position: 'relative',
                          height: '100%',
                          padding: 3,
                          background: `linear-gradient(135deg, white 50%, ${alpha(brandColor, 0.08)} 100%)`,
                        }}
                      >
                        {/* Brand Logo or Icon */}
                        <Box
                          sx={{
                            width: 48,
                            height: 48,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: brand.logo?.url ? 
                              `url(${brand.logo.url}) center/cover no-repeat` :
                              `linear-gradient(135deg, ${brandColor} 0%, ${alpha(brandColor, 0.7)} 100%)`,
                            color: 'white',
                            mb: 2,
                          }}
                        >
                          {!brand.logo?.url && <CarIcon />}
                        </Box>
                        
                        <Typography
                          variant="h5"
                          component="h3"
                          gutterBottom
                          sx={{ 
                            direction: 'rtl', 
                            fontWeight: 700,
                            color: brandColor,
                          }}
                        >
                          {brand.name}
                        </Typography>
                        
                        <Typography
                          variant="body2"
                          sx={{ 
                            direction: 'rtl',
                            color: 'text.secondary',
                            height: '2.5em',
                            overflow: 'hidden',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}
                        >
                          {brand.description}
                        </Typography>
                        
                        <Box
                          sx={{
                            mt: 2,
                            pt: 2,
                            borderTop: '1px solid',
                            borderColor: alpha(brandColor, 0.2),
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{ 
                              direction: 'rtl',
                              color: brandColor,
                              fontWeight: 'medium',
                            }}
                          >
                            {brand.country && `کشور: ${brand.country}`}
                          </Typography>
                        </Box>
                      </Box>
                    </CardActionArea>
                  </Card>
                </Grid>
              );
            })
          )}
        </Grid>

        {/* View All Brands Button */}
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Button
            variant="outlined"
            size="large"
            onClick={() => navigate('/brands')}
            sx={{
              borderRadius: '28px',
              px: 4,
              py: 1.5,
              direction: 'rtl',
              fontWeight: 600,
              borderColor: '#1976d2',
              color: '#1976d2',
              '&:hover': {
                backgroundColor: '#1976d2',
                color: 'white',
                transform: 'translateY(-2px)',
              },
            }}
          >
            مشاهده همه برندها
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default FeaturedBrands;
