import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button, IconButton, Tooltip, Snackbar, Alert } from '@mui/material';
import { ShoppingCart as CartIcon, Add as AddIcon } from '@mui/icons-material';
import { useAuthModal } from '../contexts/AuthModalContext';
import { addToCart } from '../utils/cartUtils';
import useTracking from '../hooks/useTracking';

/**
 * Reusable Add to Cart button component
 * Handles authentication check and cart addition in one component
 */
const AddToCartButton = ({ 
  product, 
  quantity = 1, 
  variant = 'contained', 
  size = 'medium',
  fullWidth = false,
  showIcon = true,
  iconOnly = false,
  redirectAfterLogin = '/products',
  customText = 'افزودن به سبد خرید',
  disabled = false,
  sx = {}
}) => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector(state => state.auth);
  const { openAuthModal } = useAuthModal();
  const { trackAddToCart } = useTracking();
  const [snackbarOpen, setSnackbarOpen] = React.useState(false);

  const CART_ENABLED = String(process.env.REACT_APP_CART_ENABLED).toLowerCase() === 'true';
  if (!CART_ENABLED) return null;

  const handleAddToCart = async () => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      // Open authentication modal with redirect path
      openAuthModal(redirectAfterLogin);
      return;
    }

    try {
      // Add to cart for authenticated users
      const result = await addToCart(product, quantity, dispatch, isAuthenticated);
      
      if (result) {
        setSnackbarOpen(true);
        
        // Track add to cart event in Google Analytics
        trackAddToCart(
          product.id,
          product.name,
          product.discountPrice || product.price,
          quantity
        );
      }
    } catch (error) {
      // TODO: surface error to user via snackbar or toast
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  if (iconOnly) {
    return (
      <>
        <Tooltip title={customText}>
          <IconButton
            color="primary"
            onClick={handleAddToCart}
            disabled={disabled}
            size={size}
          >
            <AddIcon />
          </IconButton>
        </Tooltip>
        
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={3000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={handleCloseSnackbar} severity="success">
            محصول به سبد خرید اضافه شد
          </Alert>
        </Snackbar>
      </>
    );
  }

  return (
    <>
      <Button
        variant={variant}
        color="primary"
        size={size}
        fullWidth={fullWidth}
        disabled={disabled}
        onClick={handleAddToCart}
        endIcon={showIcon ? <CartIcon /> : null}
        sx={{ direction: 'rtl', ...sx }}
      >
        {customText}
      </Button>
      
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success">
          محصول به سبد خرید اضافه شد
        </Alert>
      </Snackbar>
    </>
  );
};

export default AddToCartButton;
