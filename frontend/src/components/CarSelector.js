import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { vehicleAPI } from '../services/api';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Paper,
  Chip,
  IconButton,
  useTheme,
  useMediaQuery,
  Grid,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardActionArea,
  CardContent,
  Fade,
  CircularProgress,
  Alert,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Skeleton,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  DirectionsCar as CarIcon,
  Close as CloseIcon,
  ArrowBack as ArrowBackIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Business as BusinessIcon,
  Settings as SettingsIcon,
  LocalShipping as ShippingIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

const CarSelector = ({ 
  variant = 'compact', 
  onSelectionChange = null,
  showProductsCount = true,
  autoNavigate = true 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  
  // Dialog and stepper state
  const [open, setOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  
  // Data state
  const [manufacturers, setManufacturers] = useState([]);
  const [models, setModels] = useState([]);
  const [selectedManufacturer, setSelectedManufacturer] = useState(null);
  const [selectedModel, setSelectedModel] = useState(null);
  const [savedSelection, setSavedSelection] = useState(null);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [manufacturersLoading, setManufacturersLoading] = useState(false);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Load saved selection from localStorage on component mount
  useEffect(() => {
    const saved = localStorage.getItem('selectedVehicle');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSavedSelection(parsed);
        if (onSelectionChange) {
          onSelectionChange(parsed);
        }
      } catch (error) {
        console.error('Error parsing saved vehicle selection:', error);
        localStorage.removeItem('selectedVehicle');
      }
    }
  }, [onSelectionChange]);

  // Load manufacturers when dialog opens
  useEffect(() => {
    if (open && manufacturers.length === 0) {
      loadManufacturers();
    }
  }, [open]);

  const loadManufacturers = async () => {
    try {
      setManufacturersLoading(true);
      setError(null);
      const response = await vehicleAPI.getManufacturers();
      if (response.data?.manufacturers) {
        setManufacturers(response.data.manufacturers);
      }
    } catch (err) {
      console.error('Error loading manufacturers:', err);
      setError('خطا در بارگیری سازندگان خودرو');
    } finally {
      setManufacturersLoading(false);
    }
  };

  const loadModelsForManufacturer = async (manufacturerId) => {
    try {
      setModelsLoading(true);
      setError(null);
      const response = await vehicleAPI.getModelsByManufacturer(manufacturerId);
      if (response.data?.models) {
        setModels(response.data.models);
      }
    } catch (err) {
      console.error('Error loading models:', err);
      setError('خطا در بارگیری مدل‌های خودرو');
      setModels([]);
    } finally {
      setModelsLoading(false);
    }
  };

  const handleManufacturerSelect = async (manufacturer) => {
    setSelectedManufacturer(manufacturer);
    setSelectedModel(null);
    setModels([]);
    setActiveStep(1);
    await loadModelsForManufacturer(manufacturer._id);
  };

  const handleModelSelect = async (model) => {
    setSelectedModel(model);
    const selection = {
      manufacturer: selectedManufacturer,
      model: model,
      timestamp: new Date().toISOString()
    };
    
    // Save to localStorage
    localStorage.setItem('selectedVehicle', JSON.stringify(selection));
    setSavedSelection(selection);
    
    // Call callback if provided
    if (onSelectionChange) {
      onSelectionChange(selection);
    }
    
    // Close modal
    setOpen(false);
    
    // Navigate to products with vehicle filter if enabled
    if (autoNavigate) {
      navigate(`/products?vehicle=${model._id}&make=${selectedManufacturer.slug}&model=${model.slug}`);
    }
  };

  const handleReset = () => {
    setSelectedManufacturer(null);
    setSelectedModel(null);
    setActiveStep(0);
    localStorage.removeItem('selectedVehicle');
    setSavedSelection(null);
    setModels([]);
    if (onSelectionChange) {
      onSelectionChange(null);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setActiveStep(0);
    setSelectedManufacturer(null);
    setSelectedModel(null);
    setModels([]);
    setSearchTerm('');
    setError(null);
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
      if (activeStep === 1) {
        setSelectedManufacturer(null);
        setModels([]);
      }
    }
  };

  const steps = ['انتخاب سازنده', 'انتخاب مدل'];

  // Filter manufacturers based on search
  const filteredManufacturers = manufacturers.filter(manufacturer =>
    manufacturer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (manufacturer.nameEn && manufacturer.nameEn.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Filter models based on search
  const filteredModels = models.filter(model =>
    model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (model.nameEn && model.nameEn.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Compact view for displaying current selection
  if (variant === 'compact' && savedSelection) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Paper 
          elevation={3}
          sx={{ 
            p: 3, 
            mb: 3, 
            borderRadius: 3,
            background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
            color: 'white',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <Box sx={{ position: 'relative', zIndex: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CarIcon sx={{ mr: 1, fontSize: 28 }} />
                <Typography variant="h6" fontWeight="bold">
                  خودروی انتخابی شما
                </Typography>
              </Box>
              <IconButton 
                size="small" 
                onClick={handleReset}
                sx={{ 
                  color: 'white',
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.3)',
                  }
                }}
                title="تغییر خودرو"
              >
                <ClearIcon />
              </IconButton>
            </Box>
            
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <BusinessIcon fontSize="small" />
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    سازنده:
                  </Typography>
                </Box>
                <Chip 
                  avatar={
                    savedSelection.manufacturer.logo ? (
                      <Avatar src={savedSelection.manufacturer.logo} />
                    ) : (
                      <BusinessIcon />
                    )
                  }
                  label={savedSelection.manufacturer.name}
                  sx={{ 
                    bgcolor: 'rgba(255, 255, 255, 0.2)', 
                    color: 'white',
                    '& .MuiChip-label': { fontWeight: 'bold' },
                    height: 40,
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <CarIcon fontSize="small" />
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    مدل:
                  </Typography>
                </Box>
                <Chip 
                  avatar={<CarIcon />}
                  label={savedSelection.model.name}
                  sx={{ 
                    bgcolor: 'rgba(255, 255, 255, 0.2)', 
                    color: 'white',
                    '& .MuiChip-label': { fontWeight: 'bold' },
                    height: 40,
                  }}
                />
              </Grid>
            </Grid>

            {showProductsCount && savedSelection.model.productsCount > 0 && (
              <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircleIcon fontSize="small" />
                <Typography variant="body2">
                  {savedSelection.model.productsCount} قطعه سازگار با این خودرو موجود است
                </Typography>
              </Box>
            )}

            <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                sx={{ 
                  bgcolor: 'rgba(255, 255, 255, 0.2)', 
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.3)',
                  },
                  borderRadius: 2,
                }}
                startIcon={<SearchIcon />}
                onClick={() => navigate(`/products?vehicle=${savedSelection.model._id}`)}
              >
                مشاهده قطعات سازگار
              </Button>
              
              <Button
                variant="outlined"
                sx={{ 
                  borderColor: 'rgba(255, 255, 255, 0.5)', 
                  color: 'white',
                  '&:hover': {
                    borderColor: 'white',
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                  },
                  borderRadius: 2,
                }}
                startIcon={<SettingsIcon />}
                onClick={() => setOpen(true)}
              >
                تغییر خودرو
              </Button>
            </Box>
          </Box>
          
          {/* Background decoration */}
          <Box
            sx={{
              position: 'absolute',
              top: -30,
              right: -30,
              width: 120,
              height: 120,
              opacity: 0.1,
              transform: 'rotate(15deg)',
            }}
          >
            <CarIcon sx={{ fontSize: 100 }} />
          </Box>
        </Paper>
      </motion.div>
    );
  }

  // Selection button for when no car is selected
  const SelectorButton = () => (
    <Paper 
      elevation={2}
      sx={{ 
        p: 3, 
        mb: 3, 
        borderRadius: 3,
        background: 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: theme.shadows[6],
        }
      }}
      onClick={() => setOpen(true)}
    >
      <Box sx={{ textAlign: 'center' }}>
        <CarIcon sx={{ fontSize: 48, color: theme.palette.primary.main, mb: 2 }} />
        <Typography variant="h6" gutterBottom color="primary" fontWeight="bold">
          انتخاب خودروی شما
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          برای یافتن قطعات سازگار، خودروی خود را انتخاب کنید
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<SearchIcon />}
          sx={{ borderRadius: 2 }}
        >
          انتخاب خودرو
        </Button>
      </Box>
    </Paper>
  );

  return (
    <>
      {variant === 'compact' && !savedSelection && <SelectorButton />}
      {variant === 'button' && (
        <Button
          variant="outlined"
          startIcon={<CarIcon />}
          onClick={() => setOpen(true)}
          sx={{ borderRadius: 2 }}
        >
          {savedSelection ? `${savedSelection.manufacturer.name} ${savedSelection.model.name}` : 'انتخاب خودرو'}
        </Button>
      )}

      {/* Vehicle Selection Dialog */}
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : 3,
            minHeight: isMobile ? '100vh' : '600px',
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <CarIcon sx={{ mr: 2, color: 'primary.main' }} />
              <Typography variant="h5" fontWeight="bold">
                انتخاب خودرو
              </Typography>
            </Box>
            <IconButton onClick={handleClose}>
              <CloseIcon />
            </IconButton>
          </Box>
          
          {/* Stepper */}
          <Box sx={{ mt: 2 }}>
            <Stepper activeStep={activeStep} alternativeLabel>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ px: 3, py: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Search Field */}
          <TextField
            fullWidth
            placeholder={activeStep === 0 ? 'جستجو در سازندگان...' : 'جستجو در مدل‌ها...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ mb: 3 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton onClick={() => setSearchTerm('')}>
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <AnimatePresence mode="wait">
            {activeStep === 0 && (
              <motion.div
                key="manufacturers"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                {manufacturersLoading ? (
                  <Grid container spacing={2}>
                    {[...Array(6)].map((_, index) => (
                      <Grid item xs={12} sm={6} md={4} key={index}>
                        <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Grid container spacing={2}>
                    {filteredManufacturers.map((manufacturer) => (
                      <Grid item xs={12} sm={6} md={4} key={manufacturer._id}>
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Card 
                            sx={{ 
                              cursor: 'pointer',
                              height: '100%',
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                boxShadow: theme.shadows[8],
                              }
                            }}
                            onClick={() => handleManufacturerSelect(manufacturer)}
                          >
                            <CardActionArea sx={{ p: 2, height: '100%' }}>
                              <CardContent sx={{ textAlign: 'center', p: 2 }}>
                                {manufacturer.logo ? (
                                  <Avatar
                                    src={manufacturer.logo}
                                    sx={{ width: 60, height: 60, mx: 'auto', mb: 2 }}
                                  />
                                ) : (
                                  <BusinessIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                                )}
                                <Typography variant="h6" fontWeight="bold" gutterBottom>
                                  {manufacturer.name}
                                </Typography>
                                {manufacturer.nameEn && (
                                  <Typography variant="body2" color="text.secondary" gutterBottom>
                                    {manufacturer.nameEn}
                                  </Typography>
                                )}
                                <Typography variant="caption" color="text.secondary">
                                  {manufacturer.modelsCount || 0} مدل
                                </Typography>
                              </CardContent>
                            </CardActionArea>
                          </Card>
                        </motion.div>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </motion.div>
            )}

            {activeStep === 1 && (
              <motion.div
                key="models"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {selectedManufacturer && (
                  <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      سازنده انتخابی: {selectedManufacturer.name}
                    </Typography>
                  </Box>
                )}

                {modelsLoading ? (
                  <Grid container spacing={2}>
                    {[...Array(8)].map((_, index) => (
                      <Grid item xs={12} sm={6} md={3} key={index}>
                        <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 2 }} />
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Grid container spacing={2}>
                    {filteredModels.map((model) => (
                      <Grid item xs={12} sm={6} md={3} key={model._id}>
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Card 
                            sx={{ 
                              cursor: 'pointer',
                              height: '100%',
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                boxShadow: theme.shadows[8],
                              }
                            }}
                            onClick={() => handleModelSelect(model)}
                          >
                            <CardActionArea sx={{ p: 2, height: '100%' }}>
                              <CardContent sx={{ textAlign: 'center', p: 2 }}>
                                <CarIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                  {model.name}
                                </Typography>
                                {model.year && (
                                  <Typography variant="body2" color="text.secondary" gutterBottom>
                                    سال: {model.year}
                                  </Typography>
                                )}
                                {showProductsCount && (
                                  <Chip
                                    size="small"
                                    label={`${model.productsCount || 0} قطعه`}
                                    color="primary"
                                    variant="outlined"
                                  />
                                )}
                              </CardContent>
                            </CardActionArea>
                          </Card>
                        </motion.div>
                      </Grid>
                    ))}
                  </Grid>
                )}

                {!modelsLoading && filteredModels.length === 0 && (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <CarIcon sx={{ fontSize: 60, color: 'grey.400', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      مدلی یافت نشد
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {searchTerm ? 'جستجوی خود را تغییر دهید' : 'هنوز مدلی برای این سازنده ثبت نشده است'}
                    </Typography>
                  </Box>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>

        <DialogActions sx={{ p: 3, justifyContent: 'space-between' }}>
          <Button
            onClick={activeStep === 0 ? handleClose : handleBack}
            startIcon={activeStep === 0 ? <CloseIcon /> : <ArrowBackIcon />}
            variant="outlined"
          >
            {activeStep === 0 ? 'بستن' : 'بازگشت'}
          </Button>

          {savedSelection && (
            <Button
              onClick={handleReset}
              color="error"
              variant="outlined"
              startIcon={<ClearIcon />}
            >
              حذف انتخاب فعلی
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CarSelector; 