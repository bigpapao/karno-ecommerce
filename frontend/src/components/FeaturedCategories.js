import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardActionArea,
  CardContent,
  Skeleton,
  Alert,
} from '@mui/material';
import { categoryAPI } from '../services/api';

const FeaturedCategories = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFeaturedCategories = async () => {
      try {
        setLoading(true);
        const response = await categoryAPI.getFeaturedCategories();
        
        if (response.data && response.data.status === 'success') {
          setCategories(response.data.data);
        } else {
          throw new Error('Failed to fetch categories');
        }
      } catch (err) {
        console.error('Error fetching featured categories:', err);
        setError('خطا در دریافت دسته‌بندی‌ها. لطفاً دوباره تلاش کنید.');
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedCategories();
  }, []);

  const CategorySkeleton = () => (
    <Grid item xs={12} sm={6} md={4}>
      <Card sx={{ height: '100%' }}>
        <Skeleton variant="rectangular" height={200} />
        <CardContent>
          <Skeleton variant="text" height={32} width="80%" />
          <Skeleton variant="text" height={20} width="100%" />
          <Skeleton variant="text" height={20} width="60%" />
        </CardContent>
      </Card>
    </Grid>
  );

  if (error) {
    return (
      <Box sx={{ py: 8, bgcolor: 'background.default' }}>
        <Container maxWidth="lg">
          <Alert severity="error" sx={{ direction: 'rtl' }}>
            {error}
          </Alert>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 8, bgcolor: 'background.default' }}>
      <Container maxWidth="lg" className="featured-categories">
        <Typography
          variant="h2"
          align="center"
          gutterBottom
          sx={{
            fontSize: { xs: '2rem', md: '2.5rem' },
            fontWeight: 700,
            mb: 2,
            direction: 'rtl',
          }}
        >
          دسته‌بندی قطعات خودروهای ایرانی
        </Typography>
        <Typography
          variant="subtitle1"
          align="center"
          color="text.secondary"
          sx={{
            mb: 4,
            direction: 'rtl',
            maxWidth: '800px',
            mx: 'auto'
          }}
        >
          بهترین قطعات اصلی و با کیفیت برای خودروهای سایپا، ایران خودرو، ام وی ام و بهمن موتور
        </Typography>

        <Grid container spacing={3}>
          {loading ? (
            // Show skeletons while loading
            Array.from({ length: 6 }).map((_, index) => (
              <CategorySkeleton key={index} />
            ))
          ) : (
            categories.map((category, index) => (
              <Grid item xs={12} sm={6} md={4} key={category._id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                    },
                  }}
                >
                  <CardActionArea
                    onClick={() => navigate(`/products?category=${category.slug}`)}
                    sx={{ flexGrow: 1 }}
                  >
                    <Box
                      sx={{
                        height: 200,
                        backgroundColor: category.featured ? '#f50057' : (index % 2 === 0 ? '#2196f3' : '#1976d2'),
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        overflow: 'hidden',
                        backgroundImage: category.image?.url ? `url(${category.image.url})` : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        '&::before': category.image?.url ? {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          backgroundColor: 'rgba(0,0,0,0.4)',
                          zIndex: 1,
                        } : {},
                        '&::after': category.featured ? {
                          content: '"\u067eرطرفدار"',
                          position: 'absolute',
                          top: 10,
                          right: -30,
                          transform: 'rotate(45deg)',
                          padding: '2px 30px',
                          backgroundColor: '#ff9800',
                          color: 'white',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          zIndex: 2,
                        } : {},
                      }}
                    >
                      <Box
                        sx={{
                          width: 60,
                          height: 60,
                          borderRadius: '50%',
                          backgroundColor: 'rgba(255,255,255,0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mb: 2,
                          zIndex: 2,
                          position: 'relative',
                        }}
                      >
                        <Typography variant="h5" color="white">
                          {category.name && category.name.charAt(0)}
                        </Typography>
                      </Box>
                      <Typography 
                        variant="h4" 
                        color="white" 
                        align="center"
                        sx={{ zIndex: 2, position: 'relative' }}
                      >
                        {category.name}
                      </Typography>
                    </Box>
                    <CardContent>
                      <Typography
                        gutterBottom
                        variant="h5"
                        component="h3"
                        sx={{ fontWeight: 600, direction: 'rtl' }}
                      >
                        {category.name}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 1, direction: 'rtl' }}
                      >
                        {category.description}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="primary"
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          direction: 'rtl',
                          fontWeight: 'medium',
                        }}
                      >
                        مشاهده محصولات ←
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      </Container>
    </Box>
  );
};

export default FeaturedCategories;
