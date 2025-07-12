import React, { useState, useEffect } from 'react';
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
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Chip,
  Avatar,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Tabs,
  Tab,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Card,
  CardContent,
  CardActions,
} from '@mui/material';
import {
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Category as CategoryIcon,
  Visibility as ViewIcon,
  FileUpload as UploadIcon,
  FileDownload as DownloadIcon,
  GetApp as TemplateIcon,
  CloudUpload as ImportIcon,
  Assessment as ReportIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { categoryAPI } from '../../services/api';
import { adminService } from '../../services/admin.service';

const Categories = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Bulk operations state
  const [bulkDialog, setBulkDialog] = useState(false);
  const [bulkTab, setBulkTab] = useState(0);
  const [uploadFile, setUploadFile] = useState(null);
  const [importData, setImportData] = useState([]);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState(null);
  const [importing, setImporting] = useState(false);
  const [validating, setValidating] = useState(false);
  const [exportFormat, setExportFormat] = useState('csv');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    featured: false,
    parent: '',
    order: 0,
    image: {
      url: '',
      alt: '',
    },
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await categoryAPI.getCategories();
      
      if (response.data && response.data.status === 'success') {
        setCategories(response.data.data);
      } else {
        throw new Error('Failed to fetch categories');
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('خطا در دریافت دسته‌بندی‌ها. لطفاً دوباره تلاش کنید.');
    } finally {
      setLoading(false);
    }
  };

  // Filter categories based on search term
  const filteredCategories = categories.filter(
    (category) =>
      category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const handleAddCategory = () => {
    setSelectedCategory(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      featured: false,
      parent: '',
      order: 0,
      image: { url: '', alt: '' },
    });
    setOpenDialog(true);
  };

  const handleEditCategory = (category) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name || '',
      slug: category.slug || '',
      description: category.description || '',
      featured: category.featured || false,
      parent: category.parent?._id || '',
      order: category.order || 0,
      image: {
        url: category.image?.url || '',
        alt: category.image?.alt || '',
      },
    });
    setOpenDialog(true);
  };

  const handleDeleteCategory = (category) => {
    setSelectedCategory(category);
    setDeleteConfirmOpen(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedCategory(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      featured: false,
      parent: '',
      order: 0,
      image: { url: '', alt: '' },
    });
  };

  const handleCloseDeleteConfirm = () => {
    setDeleteConfirmOpen(false);
    setSelectedCategory(null);
  };

  const handleFormChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleSaveCategory = async () => {
    try {
      setSubmitting(true);
      
      const dataToSubmit = {
        ...formData,
        parent: formData.parent || null,
      };

      if (selectedCategory) {
        // Update existing category
        await categoryAPI.updateCategory(selectedCategory._id, dataToSubmit);
      } else {
        // Create new category
        await categoryAPI.createCategory(dataToSubmit);
      }

      await fetchCategories(); // Refresh the list
      handleCloseDialog();
    } catch (err) {
      console.error('Error saving category:', err);
      setError('خطا در ذخیره دسته‌بندی. لطفاً دوباره تلاش کنید.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      setSubmitting(true);
      await categoryAPI.deleteCategory(selectedCategory._id);
      await fetchCategories(); // Refresh the list
      handleCloseDeleteConfirm();
    } catch (err) {
      console.error('Error deleting category:', err);
      setError('خطا در حذف دسته‌بندی. ممکن است این دسته‌بندی دارای زیردسته باشد.');
    } finally {
      setSubmitting(false);
    }
  };

  // Get parent categories for the select dropdown
  const parentCategories = categories.filter(cat => !cat.parent);

  const handleBulkOpen = () => {
    setBulkDialog(true);
    setBulkTab(0);
    setImportResults(null);
  };

  const handleBulkClose = () => {
    setBulkDialog(false);
    setUploadFile(null);
    setImportData([]);
    setImportResults(null);
    setImportProgress(0);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploadFile(file);
    
    // Parse CSV file
    if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const csv = e.target.result;
        const lines = csv.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        
        const data = lines.slice(1)
          .filter(line => line.trim())
          .map(line => {
            const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
            const obj = {};
            headers.forEach((header, index) => {
              obj[header.toLowerCase().replace(/\s+/g, '')] = values[index] || '';
            });
            return obj;
          });
        
        setImportData(data);
      };
      reader.readAsText(file);
    }
    // Parse JSON file
    else if (file.type === 'application/json' || file.name.endsWith('.json')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target.result);
          setImportData(Array.isArray(json) ? json : json.template || json.data || []);
        } catch (error) {
          setError('فایل JSON نامعتبر است');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleValidateImport = async () => {
    if (!importData.length) {
      setError('هیچ داده‌ای برای اعتبارسنجی یافت نشد');
      return;
    }

    try {
      setValidating(true);
      const results = await adminService.bulkImportCategories(importData, { validateOnly: true });
      setImportResults(results.data);
    } catch (error) {
      setError('خطا در اعتبارسنجی داده‌ها');
    } finally {
      setValidating(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!importData.length) return;

    try {
      setImporting(true);
      setImportProgress(0);
      
      // Simulate progress
      const interval = setInterval(() => {
        setImportProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const results = await adminService.bulkImportCategories(importData);
      
      clearInterval(interval);
      setImportProgress(100);
      setImportResults(results.data);
      
      // Refresh categories list
      await fetchCategories();
    } catch (error) {
      setError('خطا در وارد کردن داده‌ها');
    } finally {
      setImporting(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await adminService.exportCategories(exportFormat, true);
      
      if (exportFormat === 'json') {
        const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `categories_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        // For CSV, the response should be handled by the browser
        window.open(`/api/categories/bulk-export?format=csv&includeIds=true`, '_blank');
      }
    } catch (error) {
      setError('خطا در دانلود فایل');
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await adminService.downloadCategoryTemplate(exportFormat);
      
      if (exportFormat === 'json') {
        const blob = new Blob([JSON.stringify(response.template, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `categories_template.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        window.open(`/api/categories/import-template?format=csv`, '_blank');
      }
    } catch (error) {
      setError('خطا در دانلود قالب');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2, direction: 'rtl' }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Header Section */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ direction: 'rtl' }}>
          مدیریت دسته‌بندی‌ها
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<ImportIcon />}
            onClick={handleBulkOpen}
            sx={{ direction: 'rtl' }}
          >
            عملیات انبوه
          </Button>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddCategory}
            sx={{ direction: 'rtl' }}
        >
            دسته‌بندی جدید
        </Button>
        </Box>
      </Box>

      {/* Search Section */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SearchIcon />
          جستجو در دسته‌بندی‌ها
        </Typography>
        <TextField
          fullWidth
          placeholder="نام دسته‌بندی، توضیحات..."
          value={searchTerm}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ 
            direction: 'rtl',
            '& .MuiOutlinedInput-root': { backgroundColor: 'background.default' }
          }}
        />
        
        {/* Active Search Chip */}
        {searchTerm && (
          <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              جستجوی فعال:
            </Typography>
            <Chip
              label={`جستجو: ${searchTerm}`}
              onDelete={() => setSearchTerm('')}
              variant="filled"
              color="primary"
              size="small"
            />
          </Box>
        )}
      </Paper>

      {/* Bulk Operations Dialog */}
      <Dialog 
        open={bulkDialog} 
        onClose={handleBulkClose} 
        maxWidth="md" 
        fullWidth
        PaperProps={{ sx: { direction: 'rtl' } }}
      >
        <DialogTitle>عملیات انبوه دسته‌بندی‌ها</DialogTitle>
        <DialogContent>
          <Tabs value={bulkTab} onChange={(e, v) => setBulkTab(v)} sx={{ mb: 3 }}>
            <Tab label="وارد کردن" icon={<UploadIcon />} />
            <Tab label="خروجی گرفتن" icon={<DownloadIcon />} />
          </Tabs>

          {/* Import Tab */}
          {bulkTab === 0 && (
            <Box>
              {!importResults && (
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      1. دانلود قالب
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      ابتدا قالب مناسب را دانلود کنید و اطلاعات خود را وارد کنید
                    </Typography>
                    <FormControl sx={{ minWidth: 120, mr: 1 }}>
                      <InputLabel>فرمت</InputLabel>
                      <Select
                        value={exportFormat}
                        onChange={(e) => setExportFormat(e.target.value)}
                        label="فرمت"
                      >
                        <MenuItem value="csv">CSV</MenuItem>
                        <MenuItem value="json">JSON</MenuItem>
                      </Select>
                    </FormControl>
                    <Button
                      variant="outlined"
                      startIcon={<TemplateIcon />}
                      onClick={handleDownloadTemplate}
                      sx={{ mr: 1 }}
                    >
                      دانلود قالب
                    </Button>
                  </CardContent>
                </Card>
              )}

              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    2. انتخاب فایل
                  </Typography>
                  <input
                    type="file"
                    accept=".csv,.json"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                    id="bulk-upload-input"
                  />
                  <label htmlFor="bulk-upload-input">
                    <Button
                      variant="outlined"
                      component="span"
                      startIcon={<UploadIcon />}
                      fullWidth
                      sx={{ mb: 2 }}
                    >
                      {uploadFile ? uploadFile.name : 'انتخاب فایل CSV یا JSON'}
                    </Button>
                  </label>
                  
                  {importData.length > 0 && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                      {importData.length} رکورد در فایل یافت شد
                    </Alert>
                  )}
                </CardContent>
                <CardActions>
                  <Button
                    variant="outlined"
                    onClick={handleValidateImport}
                    disabled={!importData.length || validating}
                    startIcon={validating ? <CircularProgress size={20} /> : <WarningIcon />}
                  >
                    اعتبارسنجی
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleConfirmImport}
                    disabled={!importData.length || importing}
                    startIcon={importing ? <CircularProgress size={20} /> : <ImportIcon />}
                  >
                    وارد کردن
                  </Button>
                </CardActions>
              </Card>

              {/* Import Progress */}
              {importing && (
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      در حال پردازش...
                    </Typography>
                    <LinearProgress variant="determinate" value={importProgress} sx={{ mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      {importProgress}% تکمیل شده
                    </Typography>
                  </CardContent>
                </Card>
              )}

              {/* Import Results */}
              {importResults && (
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      <ReportIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                      نتایج عملیات
                    </Typography>
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid item xs={3}>
                        <Chip
                          icon={<SuccessIcon />}
                          label={`موفق: ${importResults.successful}`}
                          color="success"
                          variant="outlined"
                        />
                      </Grid>
                      <Grid item xs={3}>
                        <Chip
                          icon={<ErrorIcon />}
                          label={`ناموفق: ${importResults.failed}`}
                          color="error"
                          variant="outlined"
                        />
                      </Grid>
                      <Grid item xs={3}>
                        <Chip
                          label={`رد شده: ${importResults.skipped?.length || 0}`}
                          color="warning"
                          variant="outlined"
                        />
                      </Grid>
                      <Grid item xs={3}>
                        <Chip
                          label={`کل: ${importResults.total}`}
                          color="info"
                          variant="outlined"
                        />
                      </Grid>
                    </Grid>

                    {importResults.errors?.length > 0 && (
                      <Box>
                        <Typography variant="subtitle2" color="error" gutterBottom>
                          خطاها:
                        </Typography>
                        <List dense>
                          {importResults.errors.slice(0, 5).map((error, index) => (
                            <ListItem key={index}>
                              <ListItemIcon>
                                <ErrorIcon color="error" />
                              </ListItemIcon>
                              <ListItemText
                                primary={`ردیف ${error.row}: ${error.error}`}
                                secondary={error.data?.name}
                              />
                            </ListItem>
                          ))}
                          {importResults.errors.length > 5 && (
                            <Typography variant="body2" color="text.secondary">
                              و {importResults.errors.length - 5} خطای دیگر...
                            </Typography>
                          )}
                        </List>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              )}
            </Box>
          )}

          {/* Export Tab */}
          {bulkTab === 1 && (
            <Box>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    خروجی گرفتن از دسته‌بندی‌ها
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    تمام دسته‌بندی‌های موجود را در فرمت دلخواه دانلود کنید
                  </Typography>
                  
                  <FormControl fullWidth sx={{ mb: 3 }}>
                    <InputLabel>فرمت خروجی</InputLabel>
                    <Select
                      value={exportFormat}
                      onChange={(e) => setExportFormat(e.target.value)}
                      label="فرمت خروجی"
                    >
                      <MenuItem value="csv">CSV (Excel سازگار)</MenuItem>
                      <MenuItem value="json">JSON (ساختاری)</MenuItem>
                    </Select>
                  </FormControl>
                </CardContent>
                <CardActions>
                  <Button
                    variant="contained"
                    startIcon={<DownloadIcon />}
                    onClick={handleExport}
                    fullWidth
                  >
                    دانلود فایل {exportFormat.toUpperCase()}
                  </Button>
                </CardActions>
              </Card>
        </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleBulkClose}>بستن</Button>
        </DialogActions>
      </Dialog>

      {/* Main Categories Table */}
      <Paper sx={{ width: '100%', mb: 2 }}>
        <TableContainer>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow>
                <TableCell align="right">تصویر</TableCell>
                <TableCell align="right">نام دسته‌بندی</TableCell>
                <TableCell align="right">توضیحات</TableCell>
                <TableCell align="right">والد</TableCell>
                <TableCell align="right">وضعیت</TableCell>
                <TableCell align="center">عملیات</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCategories
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((category) => (
                  <TableRow key={category._id}>
                    <TableCell align="right">
                      <Avatar
                        src={category.image?.url}
                        alt={category.image?.alt || category.name}
                        sx={{ width: 40, height: 40 }}
                      >
                        <CategoryIcon />
                      </Avatar>
                    </TableCell>
                    <TableCell align="right">
                      <Box>
                        <Typography variant="subtitle2">{category.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {category.slug}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          maxWidth: 200, 
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {category.description}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      {category.parent ? (
                        <Chip 
                          label={category.parent.name} 
                          size="small" 
                          variant="outlined"
                        />
                      ) : (
                        <Chip 
                          label="دسته اصلی" 
                          size="small" 
                          color="primary"
                          variant="outlined"
                        />
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {category.featured && (
                        <Chip 
                          label="ویژه" 
                          size="small" 
                          color="secondary"
                          sx={{ mr: 1 }}
                        />
                      )}
                      <Chip 
                        label="فعال" 
                        size="small" 
                        color="success"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        color="info"
                        onClick={() => window.open(`/products?category=${category.slug}`, '_blank')}
                      >
                        <ViewIcon />
                      </IconButton>
                      <IconButton
                        color="primary"
                        onClick={() => handleEditCategory(category)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleDeleteCategory(category)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredCategories.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="تعداد در هر صفحه:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} از ${count}`}
        />
      </Paper>

      {/* Add/Edit Category Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ direction: 'rtl' }}>
          {selectedCategory ? 'ویرایش دسته‌بندی' : 'افزودن دسته‌بندی جدید'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="نام دسته‌بندی"
                value={formData.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
                sx={{ direction: 'rtl' }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="شناسه (Slug)"
                value={formData.slug}
                onChange={(e) => handleFormChange('slug', e.target.value)}
                sx={{ direction: 'rtl' }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="توضیحات"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => handleFormChange('description', e.target.value)}
                sx={{ direction: 'rtl' }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>دسته والد</InputLabel>
                <Select
                  value={formData.parent}
                  onChange={(e) => handleFormChange('parent', e.target.value)}
                  label="دسته والد"
                >
                  <MenuItem value="">
                    <em>هیچ (دسته اصلی)</em>
                  </MenuItem>
                  {parentCategories.map((cat) => (
                    <MenuItem key={cat._id} value={cat._id}>
                      {cat.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="ترتیب نمایش"
                type="number"
                value={formData.order}
                onChange={(e) => handleFormChange('order', parseInt(e.target.value) || 0)}
                sx={{ direction: 'rtl' }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="URL تصویر"
                value={formData.image.url}
                onChange={(e) => handleFormChange('image.url', e.target.value)}
                sx={{ direction: 'rtl' }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="متن جایگزین تصویر"
                value={formData.image.alt}
                onChange={(e) => handleFormChange('image.alt', e.target.value)}
                sx={{ direction: 'rtl' }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.featured}
                    onChange={(e) => handleFormChange('featured', e.target.checked)}
                  />
                }
                label="دسته‌بندی ویژه"
                sx={{ direction: 'rtl' }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>انصراف</Button>
          <Button 
            onClick={handleSaveCategory} 
            variant="contained"
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={20} /> : 'ذخیره'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={handleCloseDeleteConfirm}>
        <DialogTitle sx={{ direction: 'rtl' }}>تأیید حذف</DialogTitle>
        <DialogContent>
          <Typography sx={{ direction: 'rtl' }}>
            آیا از حذف دسته‌بندی "{selectedCategory?.name}" اطمینان دارید؟
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteConfirm}>انصراف</Button>
          <Button 
            onClick={handleConfirmDelete} 
            color="error"
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={20} /> : 'حذف'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Categories;
