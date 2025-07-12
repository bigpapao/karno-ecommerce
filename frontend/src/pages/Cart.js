import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Link as RouterLink } from 'react-router-dom';
import SEO from '../components/SEO';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  IconButton,
  Snackbar,
  Alert,
  TextField,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Tooltip,
  Link,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PaymentIcon from '@mui/icons-material/Payment';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import SecurityIcon from '@mui/icons-material/Security';
import ShoppingCartCheckoutIcon from '@mui/icons-material/ShoppingCartCheckout';
import { updateCartQuantity, removeFromCart, clearCart, fetchCart } from '../store/slices/cartSlice';
import { toPersianCurrency, toPersianNumber } from '../utils/persianUtils';
import { removeFromCart as removeFromCartUtil, updateCartItemQuantity, clearEntireCart } from '../utils/cartUtils';

const Cart = () => {
  const { items, total, quantity } = useSelector((state) => state.cart);
  const { isAuthenticated, successMessage } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [discountCode, setDiscountCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false);
  
  // Calculate the total with discount applied
  const totalWithDiscount = total - discount;
  
  // Calculate shipping cost - free if total is above 500,000 tomans
  const SHIPPING_THRESHOLD = 5000000; // 500,000 tomans in rials
  const SHIPPING_COST = 200000; // 20,000 tomans in rials
  const shippingCost = totalWithDiscount > SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  
  // Calculate final total
  const finalTotal = totalWithDiscount + shippingCost;
  
  // Fetch cart when component loads
  useEffect(() => {
    dispatch(fetchCart());
  }, [dispatch]);
  
  // Show success message when user logs in
  useEffect(() => {
    if (successMessage && isAuthenticated) {
      setSnackbarMessage(successMessage);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    }
  }, [successMessage, isAuthenticated]);
  
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const handleQuantityChange = (item, newQuantity) => {
    if (newQuantity < 1) newQuantity = 1;
    if (newQuantity > (item.stockQuantity || 10)) newQuantity = item.stockQuantity || 10;
    
    const payload = { productId: item.id, quantity: newQuantity };
    dispatch(updateCartQuantity(payload));
    
    if (isAuthenticated) {
      // Update cart in backend
      updateCartItemQuantity(item.id, newQuantity, dispatch, isAuthenticated)
        .catch(error => {
          setSnackbarMessage('خطا در بروزرسانی سبد خرید. لطفا دوباره تلاش کنید.');
          setSnackbarSeverity('error');
          setSnackbarOpen(true);
        });
    }
  };

  const handleRemoveItem = (itemId) => {
    if (isAuthenticated) {
      removeFromCartUtil(itemId, dispatch, isAuthenticated)
        .then(() => {
          setSnackbarMessage('محصول از سبد خرید حذف شد');
          setSnackbarSeverity('success');
          setSnackbarOpen(true);
        })
        .catch(error => {
          setSnackbarMessage('خطا در حذف محصول. لطفا دوباره تلاش کنید.');
          setSnackbarSeverity('error');
          setSnackbarOpen(true);
        });
    } else {
      dispatch(removeFromCart(itemId));
      setSnackbarMessage('محصول از سبد خرید حذف شد');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    }
  };

  const handleClearCart = () => {
    if (window.confirm('آیا از خالی کردن سبد خرید مطمئن هستید؟')) {
      if (isAuthenticated) {
        clearEntireCart(dispatch, isAuthenticated)
          .then(() => {
            setSnackbarMessage('سبد خرید خالی شد');
            setSnackbarSeverity('success');
            setSnackbarOpen(true);
          })
          .catch(error => {
            setSnackbarMessage('خطا در خالی کردن سبد خرید. لطفا دوباره تلاش کنید.');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
          });
      } else {
        dispatch(clearCart());
        setSnackbarMessage('سبد خرید خالی شد');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      }
    }
  };

  const handleApplyDiscount = () => {
    if (!discountCode.trim()) {
      setSnackbarMessage('لطفا کد تخفیف را وارد کنید');
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
      return;
    }

    setIsApplyingDiscount(true);
    
    // Simulate API call to validate discount code
    setTimeout(() => {
      // Demo discount codes: "WELCOME10" (10% off), "SUMMER20" (20% off)
      switch (discountCode.toUpperCase()) {
        case 'WELCOME10':
          setDiscount(Math.floor(total * 0.1)); // 10% discount
          setSnackbarMessage('کد تخفیف اعمال شد: 10٪ تخفیف');
          setSnackbarSeverity('success');
          break;
        case 'SUMMER20':
          setDiscount(Math.floor(total * 0.2)); // 20% discount
          setSnackbarMessage('کد تخفیف اعمال شد: 20٪ تخفیف');
          setSnackbarSeverity('success');
          break;
        default:
          setDiscount(0);
          setSnackbarMessage('کد تخفیف نامعتبر است');
          setSnackbarSeverity('error');
      }
      
      setSnackbarOpen(true);
      setIsApplyingDiscount(false);
    }, 1000);
  };

  const handleCheckout = () => {
    // Proceed to checkout directly - authentication will be required in the checkout page
    navigate('/checkout');
  };

  return (
    <>
      <SEO
        title="سبد خرید | فروشگاه اینترنتی کارنو"
        description="مشاهده و مدیریت سبد خرید شما در فروشگاه اینترنتی کارنو. خرید انواع قطعات و لوازم یدکی خودرو با گارانتی اصالت و بهترین قیمت."
        canonical="https://karno.ir/cart"
      />
      <Box sx={{ 
        background: 'linear-gradient(to bottom, #f5f7fa, #ffffff)',
        minHeight: '100vh',
        py: 6,
      }}>
        <Container maxWidth="lg">
          {/* Page Header */}
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
              <ShoppingCartIcon fontSize="inherit" />
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
              سبد خرید
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
              {toPersianNumber(quantity)} محصول در سبد خرید شما
            </Typography>
          </Paper>
          
          {items.length === 0 ? (
            <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 2, direction: 'rtl' }}>
              <Typography variant="h5" gutterBottom>
                سبد خرید شما خالی است
              </Typography>
              <Typography variant="body1" sx={{ mb: 4 }}>
                می‌توانید با مراجعه به صفحه محصولات، اقدام به خرید نمایید.
              </Typography>
              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={() => navigate('/products')}
                sx={{ minWidth: 200 }}
              >
                مشاهده محصولات
              </Button>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Paper sx={{ borderRadius: 2, overflow: 'hidden' }} className="cart-items">
                  <TableContainer>
                    <Table>
                      <TableHead sx={{ bgcolor: 'rgba(25, 118, 210, 0.05)' }}>
                        <TableRow key="cart-header">
                          <TableCell sx={{ fontWeight: 'bold', direction: 'rtl' }}>محصول</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 'bold' }}>قیمت واحد</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 'bold' }}>تعداد</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 'bold' }}>قیمت کل</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 'bold' }}>عملیات</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {items.map((item) => {
                          const itemTotal = (item.discountPrice || item.price) * item.quantity;
                          return (
                            <TableRow key={item.id}>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', direction: 'rtl' }}>
                                  <img
                                    src={item.image || '/images/products/placeholder.jpg'}
                                    alt={item.name}
                                    style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8 }}
                                  />
                                  <Box sx={{ ml: 2 }}>
                                    <Link 
                                      component={RouterLink} 
                                      to={`/products/${item.slug}`}
                                      underline="hover" 
                                      color="inherit"
                                      sx={{ fontWeight: 'medium', display: 'block', mb: 0.5 }}
                                    >
                                      {item.name}
                                    </Link>
                                    {item.brand && (
                                      <Typography variant="body2" color="text.secondary">
                                        برند: {item.brand}
                                      </Typography>
                                    )}
                                    {!item.inStock && (
                                      <Chip 
                                        label="ناموجود" 
                                        size="small" 
                                        color="error" 
                                        sx={{ mt: 1 }} 
                                      />
                                    )}
                                  </Box>
                                </Box>
                              </TableCell>
                              <TableCell align="center">
                                {item.discountPrice ? (
                                  <Box>
                                    <Typography 
                                      variant="body2" 
                                      sx={{ textDecoration: 'line-through', color: 'text.secondary' }}
                                    >
                                      {toPersianCurrency(item.price)}
                                    </Typography>
                                    <Typography variant="body1" color="secondary" fontWeight="medium">
                                      {toPersianCurrency(item.discountPrice)}
                                    </Typography>
                                  </Box>
                                ) : (
                                  <Typography variant="body1" fontWeight="medium">
                                    {toPersianCurrency(item.price)}
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell align="center">
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <IconButton 
                                    size="small" 
                                    color="primary"
                                    onClick={() => handleQuantityChange(item, item.quantity - 1)}
                                    disabled={item.quantity <= 1}
                                  >
                                    <RemoveIcon fontSize="small" />
                                  </IconButton>
                                  <TextField
                                    size="small"
                                    value={toPersianNumber(item.quantity)}
                                    onChange={(e) => {
                                      const numericValue = e.target.value.replace(/[^0-9]/g, '');
                                      if (numericValue) {
                                        handleQuantityChange(item, parseInt(numericValue, 10));
                                      }
                                    }}
                                    inputProps={{ 
                                      min: 1, 
                                      max: item.stockQuantity || 10,
                                      style: { textAlign: 'center', width: '40px' } 
                                    }}
                                    variant="outlined"
                                    sx={{ mx: 1, width: '70px' }}
                                  />
                                  <IconButton 
                                    size="small" 
                                    color="primary"
                                    onClick={() => handleQuantityChange(item, item.quantity + 1)}
                                    disabled={item.quantity >= (item.stockQuantity || 10)}
                                  >
                                    <AddIcon fontSize="small" />
                                  </IconButton>
                                </Box>
                              </TableCell>
                              <TableCell align="center">
                                <Typography variant="body1" fontWeight="medium">
                                  {toPersianCurrency(itemTotal)}
                                </Typography>
                              </TableCell>
                              <TableCell align="center">
                                <Tooltip title="حذف از سبد خرید">
                                  <IconButton 
                                    color="error" 
                                    onClick={() => handleRemoveItem(item.id)}
                                    size="small"
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                </Tooltip>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', direction: 'rtl' }}>
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={() => navigate('/products')}
                    >
                      ادامه خرید
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={handleClearCart}
                    >
                      خالی کردن سبد خرید
                    </Button>
                  </Box>
                </Paper>
                
                {/* Additional Information */}
                <Paper sx={{ mt: 3, p: 3, borderRadius: 2, direction: 'rtl' }}>
                  <Typography variant="h6" gutterBottom>
                    خدمات و گارانتی
                  </Typography>
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <LocalShippingIcon color="primary" sx={{ ml: 1 }} />
                        <Typography variant="body2">
                          ارسال سریع به سراسر کشور
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <PaymentIcon color="primary" sx={{ ml: 1 }} />
                        <Typography variant="body2">
                          پرداخت امن و مطمئن
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <SecurityIcon color="primary" sx={{ ml: 1 }} />
                        <Typography variant="body2">
                          ضمانت اصالت کالا
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <SupportAgentIcon color="primary" sx={{ ml: 1 }} />
                        <Typography variant="body2">
                          پشتیبانی ۲۴/۷
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
              
              {/* Order Summary */}
              <Grid item xs={12} md={4}>
                <Paper className="cart-summary" sx={{ p: 3, borderRadius: 2, direction: 'rtl' }}>
                  <Typography variant="h6" gutterBottom>
                    خلاصه سفارش
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  {/* Subtotal */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                    <Typography variant="body1">
                      مجموع قیمت ({toPersianNumber(quantity)} کالا):
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {toPersianCurrency(total)}
                    </Typography>
                  </Box>
                  
                  {/* Discount Code */}
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                      <TextField
                        size="small"
                        fullWidth
                        placeholder="کد تخفیف"
                        value={discountCode}
                        onChange={(e) => setDiscountCode(e.target.value)}
                        variant="outlined"
                      />
                      <Button
                        variant="outlined"
                        onClick={handleApplyDiscount}
                        disabled={isApplyingDiscount}
                      >
                        اعمال
                      </Button>
                    </Box>
                  </Box>
                  
                  {/* Discount */}
                  {discount > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                      <Typography variant="body1" color="success.main">
                        تخفیف:
                      </Typography>
                      <Typography variant="body1" fontWeight="medium" color="success.main">
                        {toPersianCurrency(discount)}
                      </Typography>
                    </Box>
                  )}
                  
                  {/* Shipping */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                    <Typography variant="body1">
                      هزینه ارسال:
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {shippingCost === 0 ? 'رایگان' : toPersianCurrency(shippingCost)}
                    </Typography>
                  </Box>
                  
                  {shippingCost > 0 && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                      برای ارسال رایگان {toPersianCurrency(SHIPPING_THRESHOLD - totalWithDiscount)} دیگر به سبد خرید خود اضافه کنید.
                    </Typography>
                  )}
                  
                  <Divider sx={{ my: 2 }} />
                  
                  {/* Total */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                    <Typography variant="h6">
                      مبلغ قابل پرداخت:
                    </Typography>
                    <Typography variant="h6" fontWeight="bold" color="primary.main">
                      {toPersianCurrency(finalTotal)}
                    </Typography>
                  </Box>
                  
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    size="large"
                    onClick={handleCheckout}
                    startIcon={<ShoppingCartCheckoutIcon />}
                    disabled={items.length === 0}
                  >
                    تکمیل سفارش
                  </Button>
                </Paper>
              </Grid>
            </Grid>
          )}
        </Container>
      </Box>
      
      {/* Notification Snackbar */}
      <Snackbar 
        open={snackbarOpen} 
        autoHideDuration={6000} 
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default Cart;
