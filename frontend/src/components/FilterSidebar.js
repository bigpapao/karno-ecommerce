import React, { useState } from 'react';
import {
  Box,
  Drawer,
  IconButton,
  Typography,
  Slider,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Radio,
  RadioGroup,
  Button,
  Divider,
  useTheme,
  useMediaQuery,
  Avatar,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
  Paper,
} from '@mui/material';
import { 
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  Category as CategoryIcon,
  Storefront as StorefrontIcon,
} from '@mui/icons-material';
import { toPersianCurrency } from '../utils/persianUtils';

const defaultFilters = {
  priceRange: [0, 10000000],
  category: '',
  availability: 'all',
  rating: 0,
  brand: '',
  search: '',
  sortBy: 'createdAt',
  sortOrder: 'desc',
  inStock: true,
};

const FilterSidebar = ({
  open = false,
  onClose = () => {},
  filters = defaultFilters,
  onChange = () => {},
  onClear = () => {},
  mobile = false,
  type = 'product',
  title = 'فیلترها',
  buttonText = 'حذف همه فیلترها',
  categories = [],
  brands = [],
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md')) || mobile;
  const [expandedAccordion, setExpandedAccordion] = useState('');

  const {
    priceRange = defaultFilters.priceRange,
    category = defaultFilters.category,
    availability = defaultFilters.availability,
    rating = defaultFilters.rating,
    brand = defaultFilters.brand,
    sortBy = defaultFilters.sortBy,
    sortOrder = defaultFilters.sortOrder,
    inStock = defaultFilters.inStock,
  } = filters || {};

  const handlePriceChange = (event, newValue) => {
    onChange('priceRange', newValue);
  };
  
  const handleBrandSelect = (selectedBrand) => {
    onChange('brand', selectedBrand === brand ? '' : selectedBrand);
  };

  const handleCategorySelect = (selectedCategory) => {
    onChange('category', selectedCategory === category ? '' : selectedCategory);
  };

  const handleSortChange = (newSortBy) => {
    onChange('sortBy', newSortBy);
  };

  const handleSortOrderChange = (newOrder) => {
    onChange('sortOrder', newOrder);
  };

  const handleAccordionChange = (panel) => (event, isExpanded) => {
    setExpandedAccordion(isExpanded ? panel : '');
  };

  const formatPrice = (price) => {
    return toPersianCurrency(price);
  };

  const drawerContent = (
    <Box sx={{ width: 320, p: 3, direction: 'rtl' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
        }}
      >
        <Typography variant="h6">{title}</Typography>
        {isMobile && (
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        )}
      </Box>

      <Button
        variant="outlined"
        color="primary"
        fullWidth
        onClick={onClear}
        sx={{ mb: 3 }}
      >
        {buttonText}
      </Button>

      <Divider sx={{ mb: 3 }} />

      {/* Price Range Filter */}
      <Accordion 
        expanded={expandedAccordion === 'price'} 
        onChange={handleAccordionChange('price')}
        sx={{ mb: 2 }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle1">محدوده قیمت</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ px: 2 }}>
            <Slider
              value={priceRange}
              onChange={handlePriceChange}
              valueLabelDisplay="auto"
              valueLabelFormat={formatPrice}
              min={0}
              max={50000000}
              step={100000}
              marks={[
                { value: 0, label: '0' },
                { value: 10000000, label: '10 میلیون' },
                { value: 25000000, label: '25 میلیون' },
                { value: 50000000, label: '50 میلیون' }
              ]}
            />
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                mt: 2,
              }}
            >
              <Typography variant="body2" color="text.secondary">
                {formatPrice(priceRange[0])}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formatPrice(priceRange[1])}
              </Typography>
            </Box>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Categories Filter */}
      {type === 'product' && categories.length > 0 && (
        <Accordion 
          expanded={expandedAccordion === 'categories'} 
          onChange={handleAccordionChange('categories')}
          sx={{ mb: 2 }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CategoryIcon fontSize="small" />
              <Typography variant="subtitle1">دسته‌بندی‌ها</Typography>
              {category && (
                <Chip 
                  size="small" 
                  label="1" 
                  color="primary" 
                  sx={{ minWidth: 24, height: 20 }}
                />
              )}
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={1}>
              {categories.map((cat) => (
                <Chip
                  key={cat._id}
                  label={cat.name}
                  onClick={() => handleCategorySelect(cat.slug)}
                  variant={category === cat.slug ? "filled" : "outlined"}
                  color={category === cat.slug ? "primary" : "default"}
                  avatar={
                    cat.image?.url ? (
                      <Avatar 
                        alt={cat.name} 
                        src={cat.image.url}
                        sx={{ width: 24, height: 24 }}
                      />
                    ) : (
                      <Avatar sx={{ width: 24, height: 24, bgcolor: 'primary.main' }}>
                        <CategoryIcon fontSize="small" />
                      </Avatar>
                    )
                  }
                  sx={{ 
                    justifyContent: 'flex-start',
                    '& .MuiChip-avatar': {
                      marginLeft: 1,
                      marginRight: -1,
                    }
                  }}
                />
              ))}
            </Stack>
          </AccordionDetails>
        </Accordion>
      )}

      {/* Brands Filter */}
      {type === 'product' && brands.length > 0 && (
        <Accordion 
          expanded={expandedAccordion === 'brands'} 
          onChange={handleAccordionChange('brands')}
          sx={{ mb: 2 }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <StorefrontIcon fontSize="small" />
              <Typography variant="subtitle1">برندها</Typography>
              {brand && (
                <Chip 
                  size="small" 
                  label="1" 
                  color="primary" 
                  sx={{ minWidth: 24, height: 20 }}
                />
              )}
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={1}>
              {brands.map((brandItem) => (
                <Chip
                  key={brandItem._id}
                  label={brandItem.name}
                  onClick={() => handleBrandSelect(brandItem.slug)}
                  variant={brand === brandItem.slug ? "filled" : "outlined"}
                  color={brand === brandItem.slug ? "primary" : "default"}
                  avatar={
                    brandItem.logo?.url ? (
                      <Avatar 
                        alt={brandItem.name} 
                        src={brandItem.logo.url}
                        sx={{ width: 24, height: 24 }}
                      />
                    ) : (
                      <Avatar sx={{ width: 24, height: 24, bgcolor: 'secondary.main' }}>
                        <StorefrontIcon fontSize="small" />
                      </Avatar>
                    )
                  }
                  sx={{ 
                    justifyContent: 'flex-start',
                    '& .MuiChip-avatar': {
                      marginLeft: 1,
                      marginRight: -1,
                    }
                  }}
                />
              ))}
            </Stack>
          </AccordionDetails>
        </Accordion>
      )}

      {/* Sort Options */}
      <Accordion 
        expanded={expandedAccordion === 'sort'} 
        onChange={handleAccordionChange('sort')}
        sx={{ mb: 2 }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle1">مرتب‌سازی</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <RadioGroup
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [newSortBy, newSortOrder] = e.target.value.split('-');
              handleSortChange(newSortBy);
              handleSortOrderChange(newSortOrder);
            }}
          >
            <FormControlLabel
              value="createdAt-desc"
              control={<Radio />}
              label="جدیدترین"
            />
            <FormControlLabel
              value="createdAt-asc"
              control={<Radio />}
              label="قدیمی‌ترین"
            />
            <FormControlLabel
              value="price-asc"
              control={<Radio />}
              label="ارزان‌ترین"
            />
            <FormControlLabel
              value="price-desc"
              control={<Radio />}
              label="گران‌ترین"
            />
            <FormControlLabel
              value="name-asc"
              control={<Radio />}
              label="الفبایی (الف-ی)"
            />
            <FormControlLabel
              value="name-desc"
              control={<Radio />}
              label="الفبایی (ی-الف)"
            />
          </RadioGroup>
        </AccordionDetails>
      </Accordion>

      {/* Availability Filter */}
      <Accordion 
        expanded={expandedAccordion === 'availability'} 
        onChange={handleAccordionChange('availability')}
        sx={{ mb: 2 }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle1">موجودی</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <FormGroup>
            <FormControlLabel
              control={
                <Checkbox
                  checked={inStock}
                  onChange={(e) => onChange('inStock', e.target.checked)}
                />
              }
              label="فقط کالاهای موجود"
            />
          </FormGroup>
        </AccordionDetails>
      </Accordion>
    </Box>
  );

  if (isMobile) {
    return (
      <Drawer
        anchor="left"
        open={open}
        onClose={onClose}
        PaperProps={{
          sx: {
            direction: 'rtl',
          },
        }}
      >
        {drawerContent}
      </Drawer>
    );
  }

  return (
    <Paper
      elevation={2}
      sx={{
        position: 'sticky',
        top: 100,
        maxHeight: 'calc(100vh - 120px)',
        overflowY: 'auto',
        borderRadius: 2,
      }}
    >
      {drawerContent}
    </Paper>
  );
};

export default FilterSidebar;
