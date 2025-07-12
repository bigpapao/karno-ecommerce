import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Grid,
  Checkbox,
  Alert,
  useTheme,
  alpha,
  Avatar,
  ToggleButton,
  ToggleButtonGroup,
  CircularProgress,
  Snackbar,
  FormHelperText,
  CardMedia,
  ImageList,
  ImageListItem,
  ImageListItemBar,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Search as SearchIcon,
  GridView as GridViewIcon,
  ViewList as ViewListIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Inventory as InventoryIcon,
  PhotoCamera as PhotoCameraIcon,
  Close as CloseIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { productService } from '../../services/product.service';
import { categoryService } from '../../services/category.service';
import { brandService } from '../../services/brand.service';
import { vehicleService } from '../../services/vehicle.service';
import VehicleCompatibilityManager from '../../components/VehicleCompatibilityManager';

const Products = () => {
  const theme = useTheme();
  
  // State management
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [manufacturers, setManufacturers] = useState([]);
  const [vehicleModels, setVehicleModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalProducts, setTotalProducts] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [viewMode, setViewMode] = useState('table');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [filters, setFilters] = useState({
    category: '',
    brand: '',
    status: '',
    stockLevel: '',
  });

  // Form state for product creation/editing
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    discountPrice: '',
    category: '',
    brand: '',
    stock: '',
    sku: '',
    weight: '',
    featured: false,
    specifications: [],
    compatibleVehicles: [],
    images: [],
  });

  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState([]);
  const [formErrors, setFormErrors] = useState({});

  // Define helper functions first
  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  // Generate a unique SKU
  const generateSKU = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `PRD-${timestamp}-${random}`;
  };

  // Define loadProducts before the useEffect that uses it
  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        search: searchTerm,
        ...filters,
      };

      const response = await productService.getProducts(params);
      setProducts(response.products || []);
      setTotalProducts(response.pagination?.total || 0);
    } catch (error) {
      console.error('Error loading products:', error);
      showSnackbar('خطا در بارگذاری محصولات', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, searchTerm, filters]);

  // Load initial data
  useEffect(() => {
    loadProducts();
    loadCategories();
    loadBrands();
    loadManufacturers();
    loadVehicleModels();
  }, [page, rowsPerPage, searchTerm, filters, loadProducts]);

  const loadCategories = async () => {
    try {
      const response = await categoryService.getCategories();
      setCategories(response.categories || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadBrands = async () => {
    try {
      const response = await brandService.getBrands();
      setBrands(response.brands || []);
    } catch (error) {
      console.error('Error loading brands:', error);
    }
  };

  const loadManufacturers = async () => {
    try {
      const response = await vehicleService.getManufacturers();
      setManufacturers(response || []);
    } catch (error) {
      console.error('Error loading manufacturers:', error);
    }
  };

  const loadVehicleModels = async () => {
    try {
      const response = await vehicleService.getAllModels();
      setVehicleModels(response || []);
    } catch (error) {
      console.error('Error loading vehicle models:', error);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleAddProduct = () => {
    setSelectedProduct(null);
    setProductForm({
      name: '',
      description: '',
      price: '',
      discountPrice: '',
      category: '',
      brand: '',
      stock: '',
      sku: generateSKU(),
      weight: '',
      featured: false,
      specifications: [],
      compatibleVehicles: [],
      images: [],
    });
    setImageFiles([]);
    setImagePreviewUrls([]);
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    setProductForm({
      name: product.name || '',
      description: product.description || '',
      price: product.price || '',
      discountPrice: product.discountPrice || '',
      category: product.category?._id || '',
      brand: product.brand?._id || '',
      stock: product.stock || '',
      sku: product.sku || '',
      weight: product.weight || '',
      featured: product.featured || false,
      specifications: product.specifications || [],
      compatibleVehicles: product.compatibleVehicles || [],
      images: product.images || [],
    });
    setImageFiles([]);
    setImagePreviewUrls(product.images?.map(img => img.url) || []);
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleDeleteProduct = (product) => {
    setSelectedProduct(product);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await productService.deleteProduct(selectedProduct._id);
      showSnackbar('محصول با موفقیت حذف شد', 'success');
      loadProducts();
      setDeleteConfirmOpen(false);
      setSelectedProduct(null);
    } catch (error) {
      console.error('Error deleting product:', error);
      showSnackbar('خطا در حذف محصول', 'error');
    }
  };

  const handleFormChange = (field, value) => {
    setProductForm(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);
    
    if (files.length === 0) {
      return;
    }
    
    // Show loading feedback
    showSnackbar('در حال پردازش تصاویر...', 'info');
    
    // Validate file types and sizes
    const validFiles = [];
    const invalidFiles = [];
    
    files.forEach(file => {
      if (!file.type.startsWith('image/')) {
        invalidFiles.push(`${file.name}: فقط فایل‌های تصویری مجاز هستند`);
      } else if (file.size > 5 * 1024 * 1024) { // 5MB limit
        invalidFiles.push(`${file.name}: حجم فایل نباید بیشتر از 5 مگابایت باشد`);
      } else {
        validFiles.push(file);
      }
    });

    // Show validation errors if any
    if (invalidFiles.length > 0) {
      showSnackbar(invalidFiles.join('\n'), 'error');
    }

    if (validFiles.length > 0) {
      setImageFiles(prev => [...prev, ...validFiles]);
      
      // Create preview URLs with loading handling
      let processedCount = 0;
      validFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreviewUrls(prev => [...prev, e.target.result]);
          processedCount++;
          
          // Show success message when all files are processed
          if (processedCount === validFiles.length) {
            showSnackbar(`${validFiles.length} تصویر با موفقیت انتخاب شد`, 'success');
          }
        };
        reader.onerror = () => {
          showSnackbar(`خطا در خواندن فایل ${file.name}`, 'error');
        };
        reader.readAsDataURL(file);
      });
    }
    
    // Clear the input value to allow selecting the same file again
    event.target.value = '';
  };

  const removeImage = (index) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviewUrls(prev => prev.filter((_, i) => i !== index));
    showSnackbar('تصویر حذف شد', 'info');
  };

  const validateForm = () => {
    const errors = {};
    
    if (!productForm.name.trim()) errors.name = 'نام محصول الزامی است';
    if (!productForm.description.trim()) errors.description = 'توضیحات محصول الزامی است';
    if (!productForm.price || productForm.price <= 0) errors.price = 'قیمت معتبر وارد کنید';
    if (!productForm.category) errors.category = 'دسته‌بندی را انتخاب کنید';
    if (!productForm.brand) errors.brand = 'برند را انتخاب کنید';
    if (!productForm.sku.trim() || productForm.sku === '0') {
      errors.sku = 'کد محصول معتبر وارد کنید (نمی‌تواند خالی یا صفر باشد)';
    }
    if (productForm.stock < 0) errors.stock = 'موجودی نمی‌تواند منفی باشد';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveProduct = async () => {
    if (!validateForm()) {
      showSnackbar('لطفاً خطاهای فرم را برطرف کنید', 'error');
      return;
    }

    try {
      setLoading(true);
      
      const formData = new FormData();
      
      // Add product data
      Object.keys(productForm).forEach(key => {
        if (key !== 'images') {
          if (key === 'specifications' || key === 'compatibleVehicles') {
            formData.append(key, JSON.stringify(productForm[key]));
          } else {
            formData.append(key, productForm[key]);
          }
        }
      });

      // Add image files
      imageFiles.forEach((file, index) => {
        formData.append('images', file);
      });

      if (selectedProduct) {
        // Update existing product
        await productService.updateProduct(selectedProduct._id, formData);
        showSnackbar('محصول با موفقیت به‌روزرسانی شد', 'success');
      } else {
        // Create new product
        await productService.createProduct(formData);
        showSnackbar('محصول با موفقیت ایجاد شد', 'success');
      }

      loadProducts();
      setOpenDialog(false);
    } catch (error) {
      console.error('Error saving product:', error);
      
      // Extract error message from response
      let errorMessage = 'خطا در ذخیره محصول';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showSnackbar(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProduct = (productId) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedProducts(products.map(product => product._id));
    } else {
      setSelectedProducts([]);
    }
  };

  const handleBulkDelete = async () => {
    try {
      await Promise.all(selectedProducts.map(id => productService.deleteProduct(id)));
      showSnackbar(`${selectedProducts.length} محصول حذف شد`, 'success');
    setSelectedProducts([]);
      loadProducts();
    } catch (error) {
      console.error('Error bulk deleting products:', error);
      showSnackbar('خطا در حذف محصولات', 'error');
    }
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
    setPage(0);
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      brand: '',
      status: '',
      stockLevel: '',
    });
    setPage(0);
  };

  const getStatusColor = (stock) => {
    if (stock === 0) return 'error';
    if (stock < 10) return 'warning';
    return 'success';
  };

  const getStatusText = (stock) => {
    if (stock === 0) return 'ناموجود';
    if (stock < 10) return 'موجودی کم';
    return 'موجود';
  };

  const getStatusIcon = (stock) => {
    if (stock === 0) return <WarningIcon />;
    if (stock < 10) return <InventoryIcon />;
    return <CheckCircleIcon />;
  };

  const ProductCard = ({ product }) => (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardMedia
        component="img"
        height="200"
        image={product.images?.[0]?.url || '/images/placeholder-product.jpg'}
            alt={product.name}
        sx={{ objectFit: 'cover' }}
      />
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography variant="h6" component="h2" gutterBottom noWrap>
              {product.name}
            </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {product.category?.name} - {product.brand?.name}
        </Typography>
        <Typography variant="body2" gutterBottom>
          کد: {product.sku}
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
          <Typography variant="h6" color="primary">
            {product.price?.toLocaleString()} تومان
            </Typography>
            <Chip 
            icon={getStatusIcon(product.stock)}
            label={getStatusText(product.stock)}
            color={getStatusColor(product.stock)}
              size="small"
            />
          </Box>
      </CardContent>
      <Box sx={{ p: 1, display: 'flex', justifyContent: 'space-between' }}>
        <IconButton onClick={() => handleEditProduct(product)} color="primary">
          <EditIcon />
        </IconButton>
        <IconButton onClick={() => handleDeleteProduct(product)} color="error">
          <DeleteIcon />
          </IconButton>
        </Box>
    </Card>
  );

  return (
        <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
            مدیریت محصولات
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddProduct}
          size="large"
          >
            افزودن محصول
          </Button>
      </Box>

      {/* Search Section */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              placeholder="جستجو در محصولات..."
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ '& .MuiOutlinedInput-root': { backgroundColor: 'background.default' } }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'center', md: 'flex-end' } }}>
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={(e, newMode) => newMode && setViewMode(newMode)}
                size="small"
              >
                <ToggleButton value="table" aria-label="نمایش جدولی">
                  <ViewListIcon />
                </ToggleButton>
                <ToggleButton value="grid" aria-label="نمایش کارتی">
                  <GridViewIcon />
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Filters Section */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SearchIcon />
          فیلترها
        </Typography>
        
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>دسته‌بندی</InputLabel>
              <Select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                label="دسته‌بندی"
              >
                <MenuItem value="">همه دسته‌بندی‌ها</MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category._id} value={category._id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>برند</InputLabel>
              <Select
                value={filters.brand}
                onChange={(e) => handleFilterChange('brand', e.target.value)}
                label="برند"
              >
                <MenuItem value="">همه برندها</MenuItem>
                {brands.map((brand) => (
                  <MenuItem key={brand._id} value={brand._id}>
                    {brand.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>وضعیت موجودی</InputLabel>
              <Select
                value={filters.stockLevel}
                onChange={(e) => handleFilterChange('stockLevel', e.target.value)}
                label="وضعیت موجودی"
              >
                <MenuItem value="">همه محصولات</MenuItem>
                <MenuItem value="available">موجود</MenuItem>
                <MenuItem value="low">موجودی کم</MenuItem>
                <MenuItem value="out">ناموجود</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Button 
              onClick={clearFilters} 
              variant="outlined" 
              fullWidth
              sx={{ height: '56px' }}
            >
              پاک کردن همه فیلترها
            </Button>
          </Grid>
        </Grid>

        {/* Active Filters Chips */}
        {(filters.category || filters.brand || filters.stockLevel || searchTerm) && (
          <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              فیلترهای فعال:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {searchTerm && (
                <Chip
                  label={`جستجو: ${searchTerm}`}
                  onDelete={() => setSearchTerm('')}
                  variant="filled"
                  color="primary"
                  size="small"
                />
              )}
              {filters.category && (
                <Chip
                  label={`دسته‌بندی: ${categories.find(c => c._id === filters.category)?.name || 'نامشخص'}`}
                  onDelete={() => handleFilterChange('category', '')}
                  variant="filled"
                  color="secondary"
                  size="small"
                />
              )}
              {filters.brand && (
                <Chip
                  label={`برند: ${brands.find(b => b._id === filters.brand)?.name || 'نامشخص'}`}
                  onDelete={() => handleFilterChange('brand', '')}
                  variant="filled"
                  color="secondary"
                  size="small"
                />
              )}
              {filters.stockLevel && (
                <Chip
                  label={`موجودی: ${
                    filters.stockLevel === 'available' ? 'موجود' :
                    filters.stockLevel === 'low' ? 'موجودی کم' :
                    filters.stockLevel === 'out' ? 'ناموجود' : 'نامشخص'
                  }`}
                  onDelete={() => handleFilterChange('stockLevel', '')}
                  variant="filled"
                  color="secondary"
                  size="small"
                />
              )}
            </Box>
          </Box>
        )}
      </Paper>

      {/* Bulk Actions */}
      {selectedProducts.length > 0 && (
        <Paper sx={{ p: 2, mb: 2, bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography>
          {selectedProducts.length} محصول انتخاب شده
            </Typography>
            <Button
              variant="contained"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleBulkDelete}
            >
              حذف انتخاب شده‌ها
            </Button>
          </Box>
        </Paper>
      )}

      {/* Products Display */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : viewMode === 'table' ? (
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={selectedProducts.length > 0 && selectedProducts.length < products.length}
                      checked={products.length > 0 && selectedProducts.length === products.length}
                      onChange={handleSelectAll}
                    />
                  </TableCell>
                  <TableCell>تصویر</TableCell>
                  <TableCell>نام محصول</TableCell>
                  <TableCell>دسته‌بندی</TableCell>
                  <TableCell>برند</TableCell>
                  <TableCell>قیمت</TableCell>
                  <TableCell>موجودی</TableCell>
                  <TableCell>وضعیت</TableCell>
                  <TableCell>عملیات</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product._id} hover>
                      <TableCell padding="checkbox">
                        <Checkbox
                        checked={selectedProducts.includes(product._id)}
                        onChange={() => handleSelectProduct(product._id)}
                        />
                      </TableCell>
                    <TableCell>
                        <Avatar
                        src={product.images?.[0]?.url || '/images/placeholder-product.jpg'}
                          alt={product.name}
                          variant="rounded"
                        sx={{ width: 50, height: 50 }}
                      />
                      </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2">{product.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        کد: {product.sku}
                        </Typography>
                      </TableCell>
                    <TableCell>{product.category?.name}</TableCell>
                    <TableCell>{product.brand?.name}</TableCell>
                    <TableCell>{product.price?.toLocaleString()} تومان</TableCell>
                    <TableCell>{product.stock}</TableCell>
                    <TableCell>
                        <Chip
                        icon={getStatusIcon(product.stock)}
                        label={getStatusText(product.stock)}
                        color={getStatusColor(product.stock)}
                          size="small"
                        />
                      </TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleEditProduct(product)} color="primary">
                              <EditIcon />
                            </IconButton>
                      <IconButton onClick={() => handleDeleteProduct(product)} color="error">
                              <DeleteIcon />
                            </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={totalProducts}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="تعداد در صفحه:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} از ${count}`}
          />
        </Paper>
      ) : (
        <>
          <Grid container spacing={3}>
            {products.map((product) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={product._id}>
                  <ProductCard product={product} />
                </Grid>
              ))}
          </Grid>
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <TablePagination
              component="div"
              count={totalProducts}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="تعداد در صفحه:"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} از ${count}`}
            />
          </Box>
        </>
      )}

      {/* Product Form Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedProduct ? 'ویرایش محصول' : 'افزودن محصول جدید'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
            <TextField
                fullWidth
              label="نام محصول"
                value={productForm.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
                error={!!formErrors.name}
                helperText={formErrors.name}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
              fullWidth
                label="کد محصول (SKU)"
                value={productForm.sku}
                onChange={(e) => handleFormChange('sku', e.target.value)}
                error={!!formErrors.sku}
                helperText={formErrors.sku}
                required
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Button
                        size="small"
                        onClick={() => handleFormChange('sku', generateSKU())}
                        sx={{ minWidth: 'auto', px: 1 }}
                      >
                        تولید
                      </Button>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="توضیحات محصول"
                value={productForm.description}
                onChange={(e) => handleFormChange('description', e.target.value)}
                error={!!formErrors.description}
                helperText={formErrors.description}
                multiline
                rows={3}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="قیمت (تومان)"
                type="number"
                value={productForm.price}
                onChange={(e) => handleFormChange('price', e.target.value)}
                error={!!formErrors.price}
                helperText={formErrors.price}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="قیمت تخفیف‌خورده (تومان)"
                type="number"
                value={productForm.discountPrice}
                onChange={(e) => handleFormChange('discountPrice', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!formErrors.category}>
                <InputLabel>دسته‌بندی</InputLabel>
                <Select
                  value={productForm.category}
                  onChange={(e) => handleFormChange('category', e.target.value)}
                  label="دسته‌بندی"
                  required
                >
                  {categories.map((category) => (
                    <MenuItem key={category._id} value={category._id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.category && <FormHelperText>{formErrors.category}</FormHelperText>}
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!formErrors.brand}>
                <InputLabel>برند</InputLabel>
                <Select
                  value={productForm.brand}
                  onChange={(e) => handleFormChange('brand', e.target.value)}
                  label="برند"
                  required
                >
                  {brands.map((brand) => (
                    <MenuItem key={brand._id} value={brand._id}>
                      {brand.name}
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.brand && <FormHelperText>{formErrors.brand}</FormHelperText>}
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="موجودی"
                type="number"
                value={productForm.stock}
                onChange={(e) => handleFormChange('stock', e.target.value)}
                error={!!formErrors.stock}
                helperText={formErrors.stock}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="وزن (گرم)"
                type="number"
                value={productForm.weight}
                onChange={(e) => handleFormChange('weight', e.target.value)}
              />
            </Grid>
            
            {/* Vehicle Compatibility Section */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                سازگاری با خودروها
              </Typography>
              <Paper elevation={1} sx={{ p: 2, bgcolor: 'grey.50' }}>
                <VehicleCompatibilityManager
                  compatibleVehicles={productForm.compatibleVehicles}
                  manufacturers={manufacturers}
                  vehicleModels={vehicleModels}
                  onChange={(vehicles) => handleFormChange('compatibleVehicles', vehicles)}
                />
              </Paper>
            </Grid>
            
            {/* Image Upload Section */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                تصاویر محصول
              </Typography>
              <Box sx={{ mb: 2 }}>
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="image-upload"
                  multiple
                  type="file"
                  onChange={handleImageUpload}
                />
                <label htmlFor="image-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<PhotoCameraIcon />}
                    sx={{ 
                      mb: 1, 
                      '&:hover': { 
                        backgroundColor: 'primary.main', 
                        color: 'white' 
                      } 
                    }}
                  >
                    انتخاب تصاویر
                  </Button>
                </label>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  حداکثر اندازه فایل: 5 مگابایت | فرمت‌های مجاز: JPG, PNG, WEBP
                </Typography>
              </Box>
              
              {imagePreviewUrls.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    تصاویر انتخاب شده ({imagePreviewUrls.length})
                  </Typography>
                  <ImageList sx={{ width: '100%', height: 200 }} cols={4} rowHeight={150}>
                    {imagePreviewUrls.map((url, index) => (
                      <ImageListItem key={index}>
                        <img
                          src={url}
                          alt={`Product ${index + 1}`}
                          loading="lazy"
                          style={{ objectFit: 'cover' }}
                        />
                        <ImageListItemBar
                          actionIcon={
                            <IconButton
                              sx={{ color: 'rgba(255, 255, 255, 0.8)' }}
                              onClick={() => removeImage(index)}
                              title="حذف تصویر"
                            >
                              <CloseIcon />
                            </IconButton>
                          }
                        />
                      </ImageListItem>
                    ))}
                  </ImageList>
                </Box>
              )}
              
              {imagePreviewUrls.length === 0 && (
                <Box 
                  sx={{ 
                    border: '2px dashed', 
                    borderColor: 'grey.300', 
                    borderRadius: 2, 
                    p: 3, 
                    textAlign: 'center',
                    backgroundColor: 'grey.50',
                    '&:hover': {
                      borderColor: 'primary.main',
                      backgroundColor: 'primary.50'
                    }
                  }}
                >
                  <PhotoCameraIcon sx={{ fontSize: 48, color: 'grey.400', mb: 1 }} />
                  <Typography variant="body1" color="text.secondary">
                    هنوز هیچ تصویری انتخاب نشده است
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    روی دکمه "انتخاب تصاویر" کلیک کنید
                  </Typography>
                </Box>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} startIcon={<CancelIcon />}>
            انصراف
          </Button>
          <Button 
            onClick={handleSaveProduct} 
            variant="contained" 
            startIcon={<SaveIcon />}
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : 'ذخیره'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>تأیید حذف</DialogTitle>
        <DialogContent>
          <Typography>
            آیا از حذف محصول "{selectedProduct?.name}" اطمینان دارید؟
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>انصراف</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            حذف
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Products;
