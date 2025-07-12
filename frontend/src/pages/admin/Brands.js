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
  FormControlLabel,
  Switch,
  Chip,
  Avatar,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Card,
  CardContent,
  CardActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  BrandingWatermark as BrandIcon,
  Visibility as ViewIcon,
  Language as CountryIcon,
  FileUpload as UploadIcon,
  FileDownload as DownloadIcon,
  GetApp as TemplateIcon,
  CloudUpload as ImportIcon,
  Assessment as ReportIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { brandAPI } from '../../services/api';
import { adminService } from '../../services/admin.service';

const Brands = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [brands, setBrands] = useState([]);
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
    country: '',
    website: '',
    order: 0,
    logo: {
      url: '',
      alt: '',
    },
  });

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      setLoading(true);
      const response = await brandAPI.getBrands({ limit: 1000 }); // Get all brands
      
      if (response.data && response.data.success) {
        setBrands(response.data.data.brands || []);
      } else {
        throw new Error('Failed to fetch brands');
      }
    } catch (err) {
      console.error('Error fetching brands:', err);
      setError('خطا در دریافت برندها. لطفاً دوباره تلاش کنید.');
    } finally {
      setLoading(false);
    }
  };

  // Filter brands based on search term
  const filteredBrands = brands.filter(
    (brand) =>
      brand.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (brand.country && brand.country.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (brand.description && brand.description.toLowerCase().includes(searchTerm.toLowerCase()))
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

  const handleAddBrand = () => {
    setSelectedBrand(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      featured: false,
      country: '',
      website: '',
      order: 0,
      logo: { url: '', alt: '' },
    });
    setOpenDialog(true);
  };

  const handleEditBrand = (brand) => {
    setSelectedBrand(brand);
    setFormData({
      name: brand.name || '',
      slug: brand.slug || '',
      description: brand.description || '',
      featured: brand.featured || false,
      country: brand.country || '',
      website: brand.website || '',
      order: brand.order || 0,
      logo: {
        url: brand.logo?.url || '',
        alt: brand.logo?.alt || '',
      },
    });
    setOpenDialog(true);
  };

  const handleDeleteBrand = (brand) => {
    setSelectedBrand(brand);
    setDeleteConfirmOpen(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedBrand(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      featured: false,
      country: '',
      website: '',
      order: 0,
      logo: { url: '', alt: '' },
    });
  };

  const handleCloseDeleteConfirm = () => {
    setDeleteConfirmOpen(false);
    setSelectedBrand(null);
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

  const handleSaveBrand = async () => {
    try {
      setSubmitting(true);
      
      if (selectedBrand) {
        // Update existing brand
        await brandAPI.updateBrand(selectedBrand._id, formData);
      } else {
        // Create new brand
        await brandAPI.createBrand(formData);
      }

      await fetchBrands(); // Refresh the list
      handleCloseDialog();
    } catch (err) {
      console.error('Error saving brand:', err);
      setError('خطا در ذخیره برند. لطفاً دوباره تلاش کنید.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      setSubmitting(true);
      await brandAPI.deleteBrand(selectedBrand._id);
      await fetchBrands(); // Refresh the list
      handleCloseDeleteConfirm();
    } catch (err) {
      console.error('Error deleting brand:', err);
      setError('خطا در حذف برند. ممکن است این برند دارای محصولات مرتبط باشد.');
    } finally {
      setSubmitting(false);
    }
  };

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
      const results = await adminService.bulkImportBrands(importData, { validateOnly: true });
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

      const results = await adminService.bulkImportBrands(importData);
      
      clearInterval(interval);
      setImportProgress(100);
      setImportResults(results.data);
      
      // Refresh brands list
      await fetchBrands();
    } catch (error) {
      setError('خطا در وارد کردن داده‌ها');
    } finally {
      setImporting(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await adminService.exportBrands(exportFormat, true);
      
      if (exportFormat === 'json') {
        const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `brands_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        // For CSV, open in new window/tab for download
        window.open(`/api/brands/bulk-export?format=csv&includeIds=true`, '_blank');
      }
    } catch (error) {
      setError('خطا در دانلود فایل');
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await adminService.downloadBrandTemplate(exportFormat);
      
      if (exportFormat === 'json') {
        const blob = new Blob([JSON.stringify(response.template, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `brands_template.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        window.open(`/api/brands/import-template?format=csv`, '_blank');
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
          مدیریت برندها
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
          onClick={handleAddBrand}
            sx={{ direction: 'rtl' }}
        >
            برند جدید
        </Button>
        </Box>
      </Box>

      {/* Search Section */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SearchIcon />
          جستجو در برندها
        </Typography>
        <TextField
          fullWidth
          placeholder="نام برند، کشور یا توضیحات..."
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
        <DialogTitle>عملیات انبوه برندها</DialogTitle>
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
                      ابتدا قالب مناسب را دانلود کنید و اطلاعات برندها را وارد کنید
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
                    id="brand-bulk-upload-input"
                  />
                  <label htmlFor="brand-bulk-upload-input">
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
                    خروجی گرفتن از برندها
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    تمام برندهای موجود را در فرمت دلخواه دانلود کنید
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

      {/* Main Brands Table */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper>
        <Box sx={{ p: 2 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="جستجو بر اساس نام، کشور یا توضیحات..."
            value={searchTerm}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              sx: { direction: 'rtl' }
            }}
          />
        </Box>
        <TableContainer>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow>
                <TableCell align="right">لوگو</TableCell>
                <TableCell align="right">نام برند</TableCell>
                <TableCell align="right">کشور</TableCell>
                <TableCell align="right">توضیحات</TableCell>
                <TableCell align="right">وضعیت</TableCell>
                <TableCell align="center">عملیات</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredBrands
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((brand) => (
                  <TableRow key={brand._id}>
                    <TableCell align="right">
                      <Avatar
                        src={brand.logo?.url}
                        alt={brand.logo?.alt || brand.name}
                        sx={{ width: 40, height: 40 }}
                      >
                        <BrandIcon />
                      </Avatar>
                    </TableCell>
                    <TableCell align="right">
                      <Box>
                        <Typography variant="subtitle2">{brand.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {brand.slug}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CountryIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          {brand.country || 'نامشخص'}
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
                        {brand.description || 'بدون توضیحات'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      {brand.featured && (
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
                        onClick={() => window.open(`/brands/${brand.slug}`, '_blank')}
                      >
                        <ViewIcon />
                      </IconButton>
                      <IconButton
                        color="primary"
                        onClick={() => handleEditBrand(brand)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleDeleteBrand(brand)}
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
          count={filteredBrands.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="تعداد در هر صفحه:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} از ${count}`}
        />
      </Paper>
      )}

      {/* Add/Edit Brand Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ direction: 'rtl' }}>
          {selectedBrand ? 'ویرایش برند' : 'افزودن برند جدید'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="نام برند"
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
              <TextField
                fullWidth
                label="کشور"
                value={formData.country}
                onChange={(e) => handleFormChange('country', e.target.value)}
                sx={{ direction: 'rtl' }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="وب سایت"
                value={formData.website}
                onChange={(e) => handleFormChange('website', e.target.value)}
                sx={{ direction: 'rtl' }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="URL لوگو"
                value={formData.logo.url}
                onChange={(e) => handleFormChange('logo.url', e.target.value)}
                sx={{ direction: 'rtl' }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="متن جایگزین لوگو"
                value={formData.logo.alt}
                onChange={(e) => handleFormChange('logo.alt', e.target.value)}
                sx={{ direction: 'rtl' }}
              />
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
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.featured}
                    onChange={(e) => handleFormChange('featured', e.target.checked)}
                  />
                }
                label="برند ویژه"
                sx={{ direction: 'rtl' }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>انصراف</Button>
          <Button 
            onClick={handleSaveBrand} 
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
            آیا از حذف برند "{selectedBrand?.name}" اطمینان دارید؟
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

export default Brands;
