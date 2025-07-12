import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  Typography,
  TextField,
  InputAdornment,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Paper,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Pagination,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Search as SearchIcon,
  DirectionsCar as CarIcon,
  FilterAlt as FilterIcon,
  Settings as SettingsIcon,
  Star as StarIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import { vehicleService } from '../services/vehicle.service';
import { Link as RouterLink } from 'react-router-dom';

const ModelCard = ({ model }) => {
  return (
    <Card
      elevation={2}
      sx={{
        borderRadius: 2,
        cursor: 'pointer',
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
        },
        direction: 'rtl'
      }}
      component={RouterLink}
      to={`/models/${model.slug}`}
    >
      <CardMedia
        component="img"
        height="200"
        image={model.image || '/images/models/default-car.jpg'}
        alt={model.name}
        sx={{ 
          objectFit: 'cover',
          backgroundColor: '#f5f5f5'
        }}
      />
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Typography variant="h6" component="h3" sx={{ fontWeight: 600, color: '#1976d2' }}>
            {model.name}
          </Typography>
          {model.popular && (
            <Chip 
              label="محبوب" 
              size="small" 
              color="primary" 
              variant="outlined"
              icon={<StarIcon style={{ fontSize: 16 }} />}
            />
          )}
        </Box>
        
        <Typography color="text.secondary" variant="body2" sx={{ mb: 1.5 }}>
          <BusinessIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'text-bottom' }} />
          {model.manufacturer?.name}
        </Typography>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            سال: {model.year || 'نامشخص'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            موتور: {model.engine || 'نامشخص'}
          </Typography>
        </Box>
        
        {model.category && (
          <Chip 
            label={model.category} 
            size="small" 
            variant="outlined" 
            sx={{ mb: 1 }}
          />
        )}
        
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontSize: '0.875rem' }}>
          {model.productsCount || 0} قطعه موجود
        </Typography>
      </CardContent>
    </Card>
  );
};

const Models = () => {
  // State for models and manufacturers
  const [models, setModels] = useState([]);
  const [manufacturers, setManufacturers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  const [page, setPage] = useState(1);
  const itemsPerPage = 9;
  const location = useLocation();

  // Load data from API
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load models and manufacturers
        const [modelsData, manufacturersData] = await Promise.all([
          vehicleService.getAllModels(),
          vehicleService.getManufacturers()
        ]);

        setModels(modelsData);
        setManufacturers(manufacturersData);
      } catch (err) {
        // Error loading data handled
        setError('خطا در بارگذاری اطلاعات');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);
  
  // Set initial brand filter from URL params if coming from brand page
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const brandParam = params.get('brand');
    
    // Map brand slugs to brand names
    const brandMapping = {
      'saipa': 'سایپا',
      'ikco': 'ایران خودرو',
    };
    
    if (brandParam && brandMapping[brandParam]) {
      setSelectedBrand(brandMapping[brandParam]);
    }
  }, [location]);

  // Get unique categories from models
  const categories = [...new Set(models.map(model => model.category).filter(Boolean))];
  
  // Filter models based on search and filters
  const filteredModels = models.filter((model) => {
    const matchesSearch = model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         model.manufacturer?.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBrand = selectedBrand ? model.manufacturer?.name === selectedBrand : true;
    const matchesType = selectedType ? model.category === selectedType : true;
    
    return matchesSearch && matchesBrand && matchesType;
  });
  
  // Pagination
  const totalPages = Math.ceil(filteredModels.length / itemsPerPage);
  const displayedModels = filteredModels.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );
  
  const handlePageChange = (event, value) => {
    setPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleClearFilters = () => {
    setSelectedBrand('');
    setSelectedType('');
    setSearchQuery('');
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

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Box sx={{ 
      background: 'linear-gradient(to bottom, #f5f7fa, #ffffff)',
      minHeight: '100vh',
      py: 6,
    }}>
      <Container maxWidth="lg">
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
            <CarIcon fontSize="inherit" />
          </Box>
          <Typography 
            variant="h3" 
            component="h1" 
            gutterBottom 
            sx={{ 
              fontWeight: 700,
              textAlign: 'right',
              direction: 'rtl',
            }}
          >
            مدل‌های خودرو
          </Typography>
          <Typography 
            variant="subtitle1" 
            paragraph 
            sx={{ 
              textAlign: 'right',
              direction: 'rtl',
              mb: 0,
            }}
          >
            قطعات اصلی و با کیفیت برای تمامی مدل‌های خودروهای ایرانی و خارجی
          </Typography>
        </Paper>

        <Paper elevation={1} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
          <Grid container spacing={3} alignItems="center" direction="row-reverse">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="جستجوی مدل خودرو..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  sx: { direction: 'rtl' }
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: { xs: 'center', md: 'flex-start' } }}>
                <Button 
                  variant={showFilters ? "contained" : "outlined"} 
                  color="primary" 
                  startIcon={<FilterIcon />}
                  onClick={() => setShowFilters(!showFilters)}
                  sx={{ direction: 'rtl' }}
                >
                  فیلترها
                </Button>
                {(selectedBrand || selectedType) && (
                  <Button 
                    variant="outlined" 
                    color="secondary" 
                    onClick={handleClearFilters}
                    sx={{ direction: 'rtl' }}
                  >
                    حذف فیلترها
                  </Button>
                )}
              </Box>
            </Grid>
          </Grid>
          
          {showFilters && (
            <Box sx={{ mt: 3 }}>
              <Divider sx={{ mb: 3 }} />
              <Grid container spacing={3} direction="row-reverse">
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth sx={{ direction: 'rtl' }}>
                    <InputLabel id="brand-select-label">برند خودرو</InputLabel>
                    <Select
                      labelId="brand-select-label"
                      value={selectedBrand}
                      label="برند خودرو"
                      onChange={(e) => setSelectedBrand(e.target.value)}
                    >
                      <MenuItem value="">همه برندها</MenuItem>
                      {manufacturers.map((manufacturer) => (
                        <MenuItem key={manufacturer._id} value={manufacturer.name}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <BusinessIcon sx={{ mr: 1, fontSize: 16 }} />
                            {manufacturer.name}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth sx={{ direction: 'rtl' }}>
                    <InputLabel id="category-select-label">نوع خودرو</InputLabel>
                    <Select
                      labelId="category-select-label"
                      value={selectedType}
                      label="نوع خودرو"
                      onChange={(e) => setSelectedType(e.target.value)}
                    >
                      <MenuItem value="">همه انواع</MenuItem>
                      {categories.map((category) => (
                        <MenuItem key={category} value={category}>{category}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>
          )}
        </Paper>

        <Box sx={{ mb: 4 }}>
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
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <SettingsIcon color="primary" sx={{ ml: 1 }} />
              <Typography variant="body1">
                قطعات یدکی اصل برای تمام مدل‌های خودرو
              </Typography>
            </Box>
            <Chip 
              label={`${filteredModels.length} مدل`} 
              color="primary" 
              variant="outlined" 
            />
          </Paper>
        </Box>

        <Grid container spacing={3}>
          {displayedModels.map((model) => (
            <Grid item key={model.id} xs={12} sm={6} md={4}>
              <ModelCard model={model} />
            </Grid>
          ))}
        </Grid>

        {filteredModels.length === 0 && (
          <Paper
            sx={{
              textAlign: 'center',
              py: 8,
              borderRadius: 2,
              direction: 'rtl',
            }}
          >
            <Typography variant="h6" color="text.secondary">
              هیچ مدلی مطابق با معیارهای جستجوی شما یافت نشد
            </Typography>
          </Paper>
        )}
        
        {filteredModels.length > 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 2 }}>
            <Pagination 
              count={totalPages} 
              page={page} 
              onChange={handlePageChange} 
              color="primary" 
              size="large"
              showFirstButton
              showLastButton
            />
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default Models;
