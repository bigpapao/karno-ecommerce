import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Grid,
  TextField,
  Button,
  Box,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  FormHelperText,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
  Paper,
  Divider,
  CircularProgress,
  Checkbox,
  FormControlLabel,
  Radio,
  RadioGroup,
  // Removed unused imports: FormLabel, List, ListItem, ListItemText
} from '@mui/material';
import { LocalShipping, Payment, Receipt, CheckCircle, Login } from '@mui/icons-material';
import { clearCart } from '../store/slices/cartSlice';
import orderService from '../services/order.service';
import { RTL } from '../components/RTL';
import AddressForm from '../components/AddressForm';
import { formatAddress } from '../utils/addressValidation';
import { useAuthModal } from '../contexts/AuthModalContext';
import { isGuestSession, getSessionId } from '../utils/sessionUtils';

// Persian steps for the checkout process
const steps = [
  { label: 'اطلاعات ارسال', icon: <LocalShipping /> },
  { label: 'اطلاعات پرداخت', icon: <Payment /> },
  { label: 'بررسی سفارش', icon: <Receipt /> },
  { label: 'تکمیل سفارش', icon: <CheckCircle /> }
];

// Removed unused iranianProvinces array (now handled by AddressForm component)

const Checkout = () => {
  const [activeStep, setActiveStep] = useState(0);
  const { items, total } = useSelector((state) => state.cart);
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { openAuthModal } = useAuthModal();
  
  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: user?.phoneNumber || '',
    email: '',
    address: '',
    city: '',
    state: '', // Changed from province to match AddressForm
    zipCode: '', // Changed from postalCode to match AddressForm
    country: 'IR',
    paymentMethod: 'zarinpal',
    saveInfo: true,
    createAccount: false,
    password: '',
    confirmPassword: ''
  });
  
  // Check if user is authenticated, if not, redirect to login before proceeding to payment
  useEffect(() => {
    if (!isAuthenticated && activeStep === 1) {
      // We've reached the payment step but user is not authenticated
      // Open auth modal with checkout as redirect
      openAuthModal('/checkout');
      // Go back to shipping step
      setActiveStep(0);
    }
  }, [activeStep, isAuthenticated, openAuthModal]);
  
  // Address validation state
  const [addressValidated, setAddressValidated] = useState(false);
  
  // Validation state
  const [errors, setErrors] = useState({});
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'info' });
  const [orderId, setOrderId] = useState(null);
  
  // Load user data if available
  useEffect(() => {
    if (user && user.shippingInfo) {
      setFormData(prev => ({
        ...prev,
        ...user.shippingInfo,
        phoneNumber: user.phoneNumber || prev.phoneNumber
      }));
    }
  }, [user]);
  
  // Handle address form change
  const handleAddressFormChange = (updatedAddress) => {
    setFormData(prev => ({
      ...prev,
      ...updatedAddress
    }));
    
    // Reset validation state when address changes
    setAddressValidated(false);
  };
  
  // Handle form input changes (for non-address fields)
  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  // Validate form data based on current step
  const validateForm = () => {
    const newErrors = {};
    
    if (activeStep === 0) {
      // For shipping info, we'll rely on the AddressForm component's validation
      if (!addressValidated) {
        newErrors.address = 'لطفاً آدرس خود را اعتبارسنجی کنید';
      }
      
      // If creating account, validate password
      if (formData.createAccount) {
        if (!formData.password) {
          newErrors.password = 'رمز عبور الزامی است';
        } else if (formData.password.length < 6) {
          newErrors.password = 'رمز عبور باید حداقل 6 کاراکتر باشد';
        }
        
        if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = 'تکرار رمز عبور مطابقت ندارد';
        }
      }
      
      // Validate email
      if (!formData.email) {
        newErrors.email = 'ایمیل الزامی است';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'ایمیل نامعتبر است';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Removed unused handleAddressValidated function
  
  // Handle next step
  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      return; // Already at confirmation step
    }
    
    if (activeStep === 0 && !validateForm()) {
      return; // Stop if validation fails
    }
    
    // If moving from shipping to payment, check if user is authenticated
    if (activeStep === 0 && !isAuthenticated) {
      // Prompt user to login/register before proceeding
      openAuthModal('/checkout');
      return;
    }
    
    if (activeStep === steps.length - 2) {
      // Submit order
      handlePlaceOrder();
    } else {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };
  
  // Handle back step
  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  // Handle order placement
  const handlePlaceOrder = async () => {
    if (items.length === 0) {
      setAlert({
        open: true,
        message: 'سبد خرید شما خالی است',
        severity: 'error'
      });
      return;
    }

    setLoading(true);

    try {
      // Extract first name and last name from fullName if available
      let firstName = '', lastName = '';
      if (formData.fullName) {
        const nameParts = formData.fullName.trim().split(' ');
        if (nameParts.length > 0) {
          firstName = nameParts[0];
          lastName = nameParts.slice(1).join(' ');
        }
      }

      // Prepare order data
      const orderData = {
        items: items.map(item => ({
          productId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        })),
        totalAmount: total,
        shippingInfo: {
          fullName: formData.fullName,
          firstName: firstName, // For backward compatibility
          lastName: lastName,   // For backward compatibility
          phoneNumber: formData.phoneNumber,
          email: formData.email,
          address: formData.address,
          city: formData.city,
          province: formData.state, // Map state to province for backend
          state: formData.state,    // Include state directly as well
          postalCode: formData.zipCode, // Map zipCode to postalCode for backend
          zipCode: formData.zipCode,    // Include zipCode directly as well
          country: formData.country,
          addressType: formData.addressType
        },
        paymentMethod: formData.paymentMethod
      };

      // If this is a guest checkout, add guest info
      if (!isAuthenticated) {
        orderData.guestInfo = {
          email: formData.email,
          phone: formData.phoneNumber,
          createAccount: formData.createAccount,
          password: formData.createAccount ? formData.password : undefined
        };
        
        // Add the session ID for the guest cart
        orderData.sessionId = getSessionId();
      }

      // Send order to backend
      const response = await orderService.createOrder(orderData);
      
      // Save shipping info if requested
      if (formData.saveInfo && user) {
        // This would typically be handled by a user service
        // userService.updateShippingInfo(formData);
      }
      
      // Clear cart and move to confirmation step
      setOrderId(response.orderId || response._id);
      dispatch(clearCart());
      setActiveStep(steps.length - 1);
      
      setAlert({
        open: true,
        message: 'سفارش شما با موفقیت ثبت شد',
        severity: 'success'
      });
    } catch (error) {
              // Order placement failed - error handled
      setAlert({
        open: true,
        message: 'خطا در ثبت سفارش. لطفا دوباره تلاش کنید',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle alert close
  const handleAlertClose = () => {
    setAlert({ ...alert, open: false });
  };

  // Render shipping form
  const renderShippingForm = () => (
    <Box sx={{ mt: 2 }}>
      <AddressForm
        initialValues={{
          fullName: formData.fullName,
          phoneNumber: formData.phoneNumber,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: formData.country,
          isDefaultAddress: formData.saveInfo
        }}
        onChange={handleAddressFormChange}
        showValidation={true}
        validateOnBlur={true}
        buttonText={null} // We'll use our own buttons
      />
      
      {/* Email field - important for guest checkout */}
      <TextField
        margin="normal"
        required
        fullWidth
        id="email"
        label="ایمیل"
        name="email"
        autoComplete="email"
        value={formData.email}
        onChange={handleChange}
        error={!!errors.email}
        helperText={errors.email}
        sx={{ mb: 2, direction: 'rtl' }}
      />
      
      {/* Account creation option for guest users */}
      {!isAuthenticated && (
        <Box sx={{ mt: 2, mb: 3 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.createAccount}
                onChange={handleChange}
                name="createAccount"
                color="primary"
              />
            }
            label="ایجاد حساب کاربری جدید"
          />
          
          {formData.createAccount && (
            <Box sx={{ mt: 2 }}>
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="رمز عبور"
                type="password"
                id="password"
                autoComplete="new-password"
                value={formData.password}
                onChange={handleChange}
                error={!!errors.password}
                helperText={errors.password}
                sx={{ mb: 2, direction: 'rtl' }}
              />
              
              <TextField
                margin="normal"
                required
                fullWidth
                name="confirmPassword"
                label="تکرار رمز عبور"
                type="password"
                id="confirmPassword"
                autoComplete="new-password"
                value={formData.confirmPassword}
                onChange={handleChange}
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword}
                sx={{ mb: 2, direction: 'rtl' }}
              />
            </Box>
          )}
        </Box>
      )}
      
      {errors.address && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          {errors.address}
        </Alert>
      )}
      
      <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
        <Button
          color="inherit"
          disabled={activeStep === 0}
          onClick={handleBack}
          sx={{ mr: 1 }}
        >
          بازگشت
        </Button>
        <Box sx={{ flex: '1 1 auto' }} />
        
        {!isAuthenticated && (
          <Button
            variant="outlined"
            color="primary"
            onClick={() => openAuthModal('/checkout')}
            startIcon={<Login />}
            sx={{ mr: 1 }}
          >
            ورود به حساب کاربری
          </Button>
        )}
        
        <Button 
          variant="contained" 
          onClick={handleNext}
          disabled={loading}
        >
          {loading ? (
            <CircularProgress size={24} />
          ) : (
            activeStep === steps.length - 2 ? 'ثبت سفارش' : 'ادامه'
          )}
        </Button>
      </Box>
    </Box>
  );

  // Render payment form
  const renderPaymentForm = () => (
    <Grid container spacing={3} dir="rtl">
      <Grid item xs={12}>
        <FormControl component="fieldset">
          <Typography variant="h6" gutterBottom>
            روش پرداخت
          </Typography>
          <FormControlLabel
            value="zarinpal"
            control={
              <Checkbox
                checked={formData.paymentMethod === 'zarinpal'}
                onChange={() => setFormData({ ...formData, paymentMethod: 'zarinpal' })}
                name="paymentMethod"
                color="primary"
              />
            }
            label="پرداخت آنلاین (درگاه زرین پال)"
          />
        </FormControl>
      </Grid>
      <Grid item xs={12}>
        <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            شما پس از تایید سفارش به درگاه پرداخت منتقل خواهید شد.
          </Typography>
        </Paper>
      </Grid>
    </Grid>
  );

  // Render order summary
  const renderOrderSummary = () => (
    <Grid container spacing={3} dir="rtl">
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          خلاصه سفارش
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            اطلاعات تماس و ارسال
          </Typography>
          <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="body2">
              {formData.fullName}
            </Typography>
            <Typography variant="body2">
              {formData.phoneNumber}
            </Typography>
            <Typography variant="body2">
              {formatAddress({
                address: formData.address,
                city: formData.city,
                state: formData.state,
                zipCode: formData.zipCode,
                country: formData.country
              })}
            </Typography>
          </Paper>
        </Box>
        
        <Typography variant="subtitle1" gutterBottom>
          اقلام سفارش
        </Typography>
        <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider', mb: 3 }}>
          {items.length > 0 ? (
            items.map((item) => (
              <Box
                key={item.id}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 1,
                  pb: 1,
                  borderBottom: items.indexOf(item) !== items.length - 1 ? '1px solid' : 'none',
                  borderColor: 'divider'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body1">
                    {item.name} 
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mx: 1 }}>
                    x{item.quantity}
                  </Typography>
                </Box>
                <Typography variant="body1">
                  {new Intl.NumberFormat('fa-IR').format(item.price * item.quantity)} تومان
                </Typography>
              </Box>
            ))
          ) : (
            <Typography variant="body2" color="text.secondary">
              سبد خرید شما خالی است
            </Typography>
          )}
        </Paper>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
          <Typography variant="h6">جمع کل</Typography>
          <Typography variant="h6">{new Intl.NumberFormat('fa-IR').format(total)} تومان</Typography>
        </Box>
      </Grid>
    </Grid>
  );

  // Render order confirmation
  const renderOrderConfirmation = () => (
    <Grid container spacing={3} dir="rtl" justifyContent="center" textAlign="center">
      <Grid item xs={12}>
        <CheckCircle color="success" sx={{ fontSize: 64, mb: 2 }} />
        <Typography variant="h5" gutterBottom>
          سپاس از خرید شما!
        </Typography>
        <Typography variant="body1" paragraph>
          سفارش شما با موفقیت ثبت شد.
        </Typography>
        {orderId && (
          <Typography variant="body1" paragraph>
            شماره سفارش: {orderId}
          </Typography>
        )}
        <Typography variant="body2" color="text.secondary" paragraph>
          اطلاعات سفارش و کد پیگیری به شماره موبایل شما ارسال خواهد شد.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate('/')}
          sx={{ mt: 2 }}
        >
          بازگشت به صفحه اصلی
        </Button>
      </Grid>
    </Grid>
  );

  return (
    <RTL>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: 2, bgcolor: 'background.paper' }}>
          <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ fontWeight: 'bold', mb: 4 }}>
            تکمیل خرید
          </Typography>
          
          <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 5 }}>
            {steps.map((step, index) => (
              <Step key={index}>
                <StepLabel StepIconComponent={() => (
                  <Box sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: activeStep >= index ? 'primary.main' : 'grey.300',
                    color: activeStep >= index ? 'white' : 'text.secondary'
                  }}>
                    {step.icon}
                  </Box>
                )}>
                  {step.label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>
          
          <Grid container spacing={4}>
            <Grid item xs={12} md={8}>
              <Card elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                <CardContent sx={{ p: 3 }}>
                  {activeStep === 0 && renderShippingForm()}
                  {activeStep === 1 && renderPaymentForm()}
                  {activeStep === 2 && renderOrderSummary()}
                  {activeStep === 3 && renderOrderConfirmation()}
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card elevation={2} sx={{ borderRadius: 2, position: 'sticky', top: 20 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom align="right">
                    خلاصه سبد خرید
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  {items.length > 0 ? (
                    <>
                      {items.map((item) => (
                        <Box
                          key={item.id}
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            mb: 1,
                            pb: 1,
                            borderBottom: '1px dashed',
                            borderColor: 'divider',
                          }}
                          dir="rtl"
                        >
                          <Typography variant="body2">
                            {item.name} ({item.quantity})
                          </Typography>
                          <Typography variant="body2">
                            {new Intl.NumberFormat('fa-IR').format(item.price * item.quantity)}
                          </Typography>
                        </Box>
                      ))}
                      
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          mt: 2,
                          pt: 2,
                          borderTop: '1px solid',
                          borderColor: 'divider',
                          fontWeight: 'bold'
                        }}
                        dir="rtl"
                      >
                        <Typography variant="subtitle1" fontWeight="bold">مجموع</Typography>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {new Intl.NumberFormat('fa-IR').format(total)} تومان
                        </Typography>
                      </Box>
                    </>
                  ) : (
                    <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
                      سبد خرید شما خالی است
                    </Typography>
                  )}
                </CardContent>
                
                {activeStep < 3 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 2, bgcolor: 'background.paper' }}>
                    <Button
                      disabled={activeStep === 0}
                      onClick={handleBack}
                      sx={{ minWidth: 100 }}
                    >
                      بازگشت
                    </Button>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleNext}
                      disabled={loading}
                      sx={{ minWidth: 100 }}
                    >
                      {loading ? (
                        <CircularProgress size={24} color="inherit" />
                      ) : activeStep === 2 ? (
                        'ثبت سفارش'
                      ) : (
                        'ادامه'
                      )}
                    </Button>
                  </Box>
                )}
              </Card>
            </Grid>
          </Grid>
        </Paper>
        
        <Snackbar open={alert.open} autoHideDuration={6000} onClose={handleAlertClose}>
          <Alert onClose={handleAlertClose} severity={alert.severity} sx={{ width: '100%' }}>
            {alert.message}
          </Alert>
        </Snackbar>
      </Container>
    </RTL>
  );
};

export default Checkout;
