import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Box,
  Skeleton,
  Chip,
  Paper,
  InputAdornment,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Breadcrumbs,
  Link
} from '@mui/material';
import {
  Search as SearchIcon,
  Category as CategoryIcon,
  TrendingUp as TrendingIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { categoryAPI } from '../services/api';
import { useAnalytics, setupScrollTracking, setupTimeTracking } from '../utils/analytics';
import PremiumCategoryCards from '../components/PremiumCategoryCards';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [filterBy, setFilterBy] = useState('all');
  const [searchParams, setSearchParams] = useSearchParams();
  
  const navigate = useNavigate();
  const analytics = useAnalytics();

  // Setup analytics tracking for this page
  useEffect(() => {
    // Track page view
    analytics.trackCategoryView(null, 'Categories Page', {
      source: 'page_load',
      page: 'categories'
    });

    // Setup scroll and time tracking
    const cleanupScroll = setupScrollTracking('category', 'categories_page');
    const cleanupTime = setupTimeTracking('category', 'categories_page');

    return () => {
      cleanupScroll();
      cleanupTime();
    };
  }, []);

  // Track search interactions
  useEffect(() => {
    if (searchTerm) {
      const searchTimer = setTimeout(() => {
        const filteredCategories = categories.filter(category =>
          category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          category.description.toLowerCase().includes(searchTerm.toLowerCase())
        );

        analytics.trackSearch('category', searchTerm, filteredCategories, {
          source: 'search_box',
          resultCount: filteredCategories.length,
          searchDuration: Date.now() - searchStartTime
        });
      }, 1000); // Track after 1 second of no typing

      return () => clearTimeout(searchTimer);
    }
  }, [searchTerm, categories]);

  // Track filter usage
  useEffect(() => {
    if (filterBy !== 'all') {
      analytics.trackFilter('category', null, { filterBy, sortBy }, {
        source: 'filter_dropdown',
        page: 'categories'
      });
    }
  }, [filterBy, sortBy]);

  const [searchStartTime, setSearchStartTime] = useState(Date.now());

  const fetchCategories = async () => {
    try {
      setLoading(true);
      // Use the same API call that works in PremiumCategoryCards
      const response = await categoryAPI.getCategories({ featured: true, parentOnly: true });
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('خطا در بارگذاری دسته‌بندی‌ها');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Handle search input
  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearchTerm(value);
    
    if (value.length === 0) {
      setSearchStartTime(Date.now());
    }
    
    // Update URL params
    if (value) {
      setSearchParams({ search: value, sort: sortBy, filter: filterBy });
    } else {
      setSearchParams({ sort: sortBy, filter: filterBy });
    }
  };

  // Handle category click with analytics
  const handleCategoryClick = (category, event, position) => {
    // Track click analytics
    analytics.trackCategoryClick(category._id, category.name, {
      clickX: event.clientX,
      clickY: event.clientY,
      position: position,
      source: 'category_card',
      page: 'categories'
    });

    // Navigate to category page
    navigate(`/categories/${category.slug}`);
  };

  // Handle sort change
  const handleSortChange = (event) => {
    const value = event.target.value;
    setSortBy(value);
    setSearchParams({ search: searchTerm, sort: value, filter: filterBy });
    
    // Track sort usage
    analytics.trackFilter('category', null, { sortBy: value }, {
      source: 'sort_dropdown',
      page: 'categories'
    });
  };

  // Handle filter change
  const handleFilterChange = (event) => {
    const value = event.target.value;
    setFilterBy(value);
    setSearchParams({ search: searchTerm, sort: sortBy, filter: value });
  };

  // Filter and sort categories
  const getFilteredAndSortedCategories = () => {
    let filtered = categories;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(category =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply category filter
    if (filterBy === 'featured') {
      filtered = filtered.filter(category => category.featured);
    } else if (filterBy === 'parent') {
      filtered = filtered.filter(category => !category.parent);
    } else if (filterBy === 'child') {
      filtered = filtered.filter(category => category.parent);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name, 'fa');
        case 'products':
          return (b.productCount || 0) - (a.productCount || 0);
        case 'newest':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'featured':
          return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
        default:
          return 0;
      }
    });

    return filtered;
  };

  const filteredCategories = getFilteredAndSortedCategories();

  // Category card component with analytics
  const CategoryCard = ({ category, index }) => {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [viewTracked, setViewTracked] = useState(false);

    // Track category view when card comes into viewport
    useEffect(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !viewTracked) {
              analytics.trackCategoryView(category._id, category.name, {
                source: 'card_view',
                position: index,
                page: 'categories'
              });
              setViewTracked(true);
            }
          });
        },
        { threshold: 0.5 }
      );

      const cardElement = document.getElementById(`category-card-${category._id}`);
      if (cardElement) {
        observer.observe(cardElement);
      }

      return () => observer.disconnect();
    }, [category._id, index, viewTracked]);

    return (
      <Grid item xs={12} sm={6} md={4} lg={3} key={category._id}>
        <Card
          id={`category-card-${category._id}`}
          sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            cursor: 'pointer',
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: 3
            },
            direction: 'rtl'
          }}
          onClick={(event) => handleCategoryClick(category, event, index)}
        >
          {category.imageUrl && (
            <CardMedia
              component="img"
              height="160"
              image={category.imageUrl}
              alt={category.imageAlt || category.name}
              onLoad={() => setImageLoaded(true)}
              sx={{
                opacity: imageLoaded ? 1 : 0,
                transition: 'opacity 0.3s'
              }}
            />
          )}
          
          <CardContent sx={{ flexGrow: 1, p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <CategoryIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6" component="h3" sx={{ fontWeight: 600 }}>
                {category.name}
              </Typography>
              {category.featured && (
                <Chip
                  icon={<TrendingIcon />}
                  label="ویژه"
                  size="small"
                  color="primary"
                  sx={{ mr: 1, fontSize: '0.7rem' }}
                />
              )}
            </Box>
            
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                mb: 2
              }}
            >
              {category.description}
            </Typography>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="primary.main" sx={{ fontWeight: 500 }}>
                {category.productCount || 0} محصول
              </Typography>
              
              <Button
                size="small"
                variant="outlined"
                onClick={(event) => {
                  event.stopPropagation();
                  handleCategoryClick(category, event, index);
                }}
              >
                مشاهده
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    );
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Grid container spacing={3}>
          {[...Array(12)].map((_, index) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
              <Card sx={{ height: 300 }}>
                <Skeleton variant="rectangular" height={160} />
                <CardContent>
                  <Skeleton variant="text" height={32} />
                  <Skeleton variant="text" height={48} />
                  <Skeleton variant="text" height={24} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="error">
          {error}
        </Typography>
        <Button onClick={fetchCategories} sx={{ mt: 2 }}>
          تلاش مجدد
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3, direction: 'rtl' }}>
        <Link underline="hover" color="inherit" href="/">
          خانه
        </Link>
        <Typography color="text.primary">دسته‌بندی‌ها</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
          دسته‌بندی محصولات
        </Typography>
        <Typography variant="h6" color="text.secondary">
          محصولات مورد نظر خود را از میان دسته‌بندی‌های مختلف انتخاب کنید
        </Typography>
      </Box>



      {/* Search and Filters */}
      <Paper sx={{ p: 3, mb: 4, direction: 'rtl' }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="جستجو در دسته‌بندی‌ها..."
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>مرتب‌سازی</InputLabel>
              <Select value={sortBy} onChange={handleSortChange} label="مرتب‌سازی">
                <MenuItem value="name">نام</MenuItem>
                <MenuItem value="products">تعداد محصول</MenuItem>
                <MenuItem value="newest">جدیدترین</MenuItem>
                <MenuItem value="featured">ویژه</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>فیلتر</InputLabel>
              <Select value={filterBy} onChange={handleFilterChange} label="فیلتر">
                <MenuItem value="all">همه</MenuItem>
                <MenuItem value="featured">ویژه</MenuItem>
                <MenuItem value="parent">اصلی</MenuItem>
                <MenuItem value="child">فرعی</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Results Summary */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="body1" color="text.secondary">
          {filteredCategories.length} دسته‌بندی یافت شد
        </Typography>
        
        {searchTerm && (
          <Chip
            label={`جستجو: ${searchTerm}`}
            onDelete={() => {
              setSearchTerm('');
              setSearchParams({ sort: sortBy, filter: filterBy });
            }}
            sx={{ direction: 'rtl' }}
          />
        )}
      </Box>

      {/* Use our working PremiumCategoryCards component with all features */}
      <PremiumCategoryCards maxCategories={null} showTitle={false} />
    </Container>
  );
};

export default Categories; 