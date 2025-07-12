import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
  Button,
  IconButton,
  useTheme,
  useMediaQuery,
  Skeleton,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Slider,
  FormGroup,
  FormControlLabel,
  Checkbox,
  alpha,
  Stack,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  ViewList as ListViewIcon,
  ViewModule as GridViewIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearch } from '../hooks/useSearch';
import searchService from '../services/searchService';
import ProductCard from '../components/ProductCard';

const SearchResults = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  
  // Get search query from URL
  const searchParams = new URLSearchParams(location.search);
  const queryFromUrl = searchParams.get('q') || '';
  
  // State management
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    categories: [],
    brands: [],
    priceRange: [0, 10000000],
    inStock: false,
    featured: false,
  });
  const [filtersOpen, setFiltersOpen] = useState(!isMobile);

  // Search hook for the search bar
  const { setQuery } = useSearch();

  // Load search results
  useEffect(() => {
    const loadResults = async () => {
      if (!queryFromUrl) {
        setResults(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Build filter object
        const searchFilters = {};
        if (filters.categories.length > 0) {
          searchFilters.category = { $in: filters.categories };
        }
        if (filters.brands.length > 0) {
          searchFilters.brand = { $in: filters.brands };
        }
        if (filters.priceRange[0] > 0 || filters.priceRange[1] < 10000000) {
          searchFilters.price = {
            $gte: filters.priceRange[0],
            $lte: filters.priceRange[1],
          };
        }
        if (filters.inStock) {
          searchFilters.stock = { $gt: 0 };
        }
        if (filters.featured) {
          searchFilters.featured = true;
        }

        const searchResults = await searchService.search(
          queryFromUrl,
          searchFilters,
          page,
          20
        );

        setResults(searchResults);
      } catch (err) {
        // Search error handled
        setError('خطا در بارگیری نتایج جستجو');
      } finally {
        setLoading(false);
      }
    };

    loadResults();
  }, [queryFromUrl, filters, page]);

  // Update search bar with current query
  useEffect(() => {
    setQuery(queryFromUrl);
  }, [queryFromUrl, setQuery]);

  // Handle filter changes
  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value,
    }));
    setPage(1); // Reset to first page
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      categories: [],
      brands: [],
      priceRange: [0, 10000000],
      inStock: false,
      featured: false,
    });
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    setPage(newPage);
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Format price for display
  const formatPrice = (price) => {
    return new Intl.NumberFormat('fa-IR', {
      style: 'currency',
      currency: 'IRR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Loading skeleton
  const LoadingSkeleton = () => (
    <Grid container spacing={3}>
      {[...Array(8)].map((_, index) => (
        <Grid item xs={12} sm={6} md={viewMode === 'grid' ? 3 : 12} key={index}>
          <Paper sx={{ p: 2, borderRadius: 2 }}>
            <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 1, mb: 2 }} />
            <Skeleton variant="text" height={24} sx={{ mb: 1 }} />
            <Skeleton variant="text" height={20} width="60%" sx={{ mb: 1 }} />
            <Skeleton variant="text" height={20} width="40%" />
          </Paper>
        </Grid>
      ))}
    </Grid>
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Results header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box>
            {queryFromUrl && (
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                نتایج جستجو برای "{queryFromUrl}"
              </Typography>
            )}
            {results && (
              <Typography variant="body2" color="text.secondary">
                {results.total} محصول یافت شد
              </Typography>
            )}
          </Box>

          <Stack direction="row" spacing={1}>
            {/* View mode toggle */}
            <Paper sx={{ display: 'flex', borderRadius: 2 }}>
              <IconButton
                onClick={() => setViewMode('grid')}
                sx={{
                  color: viewMode === 'grid' ? theme.palette.primary.main : theme.palette.text.secondary,
                  backgroundColor: viewMode === 'grid' ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                }}
              >
                <GridViewIcon />
              </IconButton>
              <IconButton
                onClick={() => setViewMode('list')}
                sx={{
                  color: viewMode === 'list' ? theme.palette.primary.main : theme.palette.text.secondary,
                  backgroundColor: viewMode === 'list' ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                }}
              >
                <ListViewIcon />
              </IconButton>
            </Paper>

            {/* Filter toggle for mobile */}
            {isMobile && (
              <Button
                variant="outlined"
                startIcon={<FilterIcon />}
                onClick={() => setFiltersOpen(!filtersOpen)}
              >
                فیلتر
              </Button>
            )}
          </Stack>
        </Box>
      </motion.div>

      {/* Error state */}
      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Alert 
            severity="error" 
            sx={{ mb: 3, borderRadius: 2 }}
            action={
              <Button 
                color="inherit" 
                size="small"
                onClick={() => window.location.reload()}
              >
                تلاش مجدد
              </Button>
            }
          >
            {error}
          </Alert>
        </motion.div>
      )}

      {/* No query state */}
      {!queryFromUrl && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Paper
            sx={{
              p: 6,
              textAlign: 'center',
              borderRadius: 3,
              background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.05) 0%, rgba(25, 118, 210, 0.1) 100%)',
            }}
          >
            <SearchIcon sx={{ fontSize: 64, color: theme.palette.primary.main, mb: 2 }} />
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
              برای شروع جستجو کنید
            </Typography>
            <Typography variant="body1" color="text.secondary">
              محصولات، برندها و دسته‌بندی‌های مورد نظر خود را جستجو کنید
            </Typography>
          </Paper>
        </motion.div>
      )}

      {/* Results content */}
      {queryFromUrl && (
        <Grid container spacing={3}>
          {/* Filters sidebar */}
          <AnimatePresence>
            {filtersOpen && (
              <Grid item xs={12} md={3}>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Paper sx={{ p: 3, borderRadius: 3, position: 'sticky', top: 100 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        فیلترها
                      </Typography>
                      <Button
                        size="small"
                        startIcon={<ClearIcon />}
                        onClick={clearFilters}
                        sx={{ fontSize: '0.8rem' }}
                      >
                        پاک کردن
                      </Button>
                    </Box>

                    {/* Price range filter */}
                    <Accordion defaultExpanded>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          محدوده قیمت
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Slider
                          value={filters.priceRange}
                          onChange={(e, newValue) => handleFilterChange('priceRange', newValue)}
                          valueLabelDisplay="auto"
                          valueLabelFormat={formatPrice}
                          min={0}
                          max={10000000}
                          step={100000}
                          marks={[
                            { value: 0, label: '0' },
                            { value: 10000000, label: '10M' },
                          ]}
                        />
                      </AccordionDetails>
                    </Accordion>

                    {/* Stock filter */}
                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          وضعیت موجودی
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <FormGroup>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={filters.inStock}
                                onChange={(e) => handleFilterChange('inStock', e.target.checked)}
                              />
                            }
                            label="فقط کالاهای موجود"
                          />
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={filters.featured}
                                onChange={(e) => handleFilterChange('featured', e.target.checked)}
                              />
                            }
                            label="کالاهای ویژه"
                          />
                        </FormGroup>
                      </AccordionDetails>
                    </Accordion>

                    {/* Facets from search results */}
                    {results?.facets && (
                      <>
                        {results.facets.categories?.length > 0 && (
                          <Accordion>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                دسته‌بندی‌ها
                              </Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                              <FormGroup>
                                {results.facets.categories.map((category) => (
                                  <FormControlLabel
                                    key={category._id}
                                    control={
                                      <Checkbox
                                        checked={filters.categories.includes(category._id)}
                                        onChange={(e) => {
                                          const newCategories = e.target.checked
                                            ? [...filters.categories, category._id]
                                            : filters.categories.filter(id => id !== category._id);
                                          handleFilterChange('categories', newCategories);
                                        }}
                                      />
                                    }
                                    label={`${category.name} (${category.count})`}
                                  />
                                ))}
                              </FormGroup>
                            </AccordionDetails>
                          </Accordion>
                        )}

                        {results.facets.brands?.length > 0 && (
                          <Accordion>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                برندها
                              </Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                              <FormGroup>
                                {results.facets.brands.map((brand) => (
                                  <FormControlLabel
                                    key={brand._id}
                                    control={
                                      <Checkbox
                                        checked={filters.brands.includes(brand._id)}
                                        onChange={(e) => {
                                          const newBrands = e.target.checked
                                            ? [...filters.brands, brand._id]
                                            : filters.brands.filter(id => id !== brand._id);
                                          handleFilterChange('brands', newBrands);
                                        }}
                                      />
                                    }
                                    label={`${brand.name} (${brand.count})`}
                                  />
                                ))}
                              </FormGroup>
                            </AccordionDetails>
                          </Accordion>
                        )}
                      </>
                    )}
                  </Paper>
                </motion.div>
              </Grid>
            )}
          </AnimatePresence>

          {/* Results grid */}
          <Grid item xs={12} md={filtersOpen ? 9 : 12}>
            {loading ? (
              <LoadingSkeleton />
            ) : results?.data?.length > 0 ? (
              <>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                >
                  <Grid container spacing={3}>
                    {results.data.map((product, index) => (
                      <Grid 
                        item 
                        xs={12} 
                        sm={viewMode === 'list' ? 12 : 6} 
                        md={viewMode === 'list' ? 12 : filtersOpen ? 4 : 3} 
                        key={product._id}
                      >
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                        >
                          <ProductCard 
                            product={product} 
                            variant={viewMode}
                          />
                        </motion.div>
                      </Grid>
                    ))}
                  </Grid>
                </motion.div>

                {/* Pagination */}
                {results.totalPages > 1 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.4 }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                      <Stack direction="row" spacing={1}>
                        {[...Array(results.totalPages)].map((_, index) => {
                          const pageNumber = index + 1;
                          return (
                            <Button
                              key={pageNumber}
                              variant={page === pageNumber ? 'contained' : 'outlined'}
                              onClick={() => handlePageChange(pageNumber)}
                              sx={{ minWidth: 40 }}
                            >
                              {pageNumber}
                            </Button>
                          );
                        })}
                      </Stack>
                    </Box>
                  </motion.div>
                )}
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Paper
                  sx={{
                    p: 6,
                    textAlign: 'center',
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.05) 0%, rgba(255, 152, 0, 0.1) 100%)',
                  }}
                >
                  <SearchIcon sx={{ fontSize: 64, color: theme.palette.warning.main, mb: 2 }} />
                  <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                    نتیجه‌ای یافت نشد
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    برای "{queryFromUrl}" نتیجه‌ای پیدا نکردیم
                  </Typography>
                  <Button
                    variant="outlined"
                    onClick={clearFilters}
                    startIcon={<ClearIcon />}
                  >
                    حذف فیلترها
                  </Button>
                </Paper>
              </motion.div>
            )}
          </Grid>
        </Grid>
      )}
    </Container>
  );
};

export default SearchResults; 