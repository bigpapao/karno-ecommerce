import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Rating,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Close as CloseIcon,
  Compare as CompareIcon,
  ShoppingCart as CartIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { addToCart } from '../store/slices/cartSlice';
import { toPersianCurrency, toPersianNumber } from '../utils/persianUtils';

const ProductComparison = ({ open, onClose, products = [] }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const dispatch = useDispatch();
  const [selectedView, setSelectedView] = useState('overview'); // 'overview' or 'detailed'

  const handleAddToCart = (product) => {
    dispatch(addToCart({
      productId: product._id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: 1
    }));
  };

  const comparisonFeatures = [
    { key: 'price', label: 'قیمت', type: 'currency' },
    { key: 'brand', label: 'برند', type: 'text' },
    { key: 'model', label: 'مدل خودرو', type: 'array' },
    { key: 'warranty', label: 'گارانتی', type: 'text' },
    { key: 'rating', label: 'امتیاز', type: 'rating' },
    { key: 'availability', label: 'موجودی', type: 'boolean' },
    { key: 'origin', label: 'کشور سازنده', type: 'text' },
    { key: 'material', label: 'جنس', type: 'text' },
  ];

  const renderFeatureValue = (product, feature) => {
    const value = product[feature.key];
    
    switch (feature.type) {
      case 'currency':
        return (
          <Typography variant="h6" color="primary" fontWeight="bold">
            {toPersianCurrency(value)}
          </Typography>
        );
      case 'rating':
        return (
          <Box display="flex" alignItems="center" gap={1}>
            <Rating value={value || 0} readOnly size="small" />
            <Typography variant="body2">
              {toPersianNumber(value || 0)}
            </Typography>
          </Box>
        );
      case 'boolean':
        return value ? (
          <Chip
            icon={<CheckIcon />}
            label="موجود"
            color="success"
            size="small"
          />
        ) : (
          <Chip
            icon={<CancelIcon />}
            label="ناموجود"
            color="error"
            size="small"
          />
        );
      case 'array':
        return Array.isArray(value) ? value.join('، ') : value || '-';
      default:
        return value || '-';
    }
  };

  if (products.length === 0) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 2,
          maxHeight: '90vh',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: 1,
          borderColor: 'divider',
          direction: 'rtl',
        }}
      >
        <Box display="flex" alignItems="center" gap={1}>
          <CompareIcon color="primary" />
          <Typography variant="h6">
            مقایسه محصولات ({toPersianNumber(products.length)})
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {/* Mobile View */}
        {isMobile ? (
          <Box p={2}>
            {products.map((product, index) => (
              <Card key={product._id} sx={{ mb: 2 }}>
                <Box display="flex" gap={2} p={2}>
                  <CardMedia
                    component="img"
                    sx={{ width: 80, height: 80, borderRadius: 1 }}
                    image={product.image || '/images/placeholder.jpg'}
                    alt={product.name}
                  />
                  <Box flex={1}>
                    <Typography variant="h6" gutterBottom>
                      {product.name}
                    </Typography>
                    <Typography variant="h6" color="primary" gutterBottom>
                      {toPersianCurrency(product.price)}
                    </Typography>
                    <Box display="flex" gap={1} mt={1}>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<CartIcon />}
                        onClick={() => handleAddToCart(product)}
                      >
                        افزودن به سبد
                      </Button>
                    </Box>
                  </Box>
                </Box>
              </Card>
            ))}
          </Box>
        ) : (
          /* Desktop View */
          <TableContainer component={Paper} sx={{ maxHeight: '60vh' }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ minWidth: 200, fontWeight: 'bold' }}>
                    ویژگی
                  </TableCell>
                  {products.map((product, index) => (
                    <TableCell key={product._id} sx={{ minWidth: 250 }}>
                      <Card elevation={0}>
                        <CardMedia
                          component="img"
                          height="150"
                          image={product.image || '/images/placeholder.jpg'}
                          alt={product.name}
                          sx={{ borderRadius: 1 }}
                        />
                        <CardContent sx={{ p: 2 }}>
                          <Typography variant="h6" gutterBottom>
                            {product.name}
                          </Typography>
                          <Typography variant="h5" color="primary" gutterBottom>
                            {toPersianCurrency(product.price)}
                          </Typography>
                          <Button
                            variant="contained"
                            fullWidth
                            startIcon={<CartIcon />}
                            onClick={() => handleAddToCart(product)}
                            sx={{ mt: 1 }}
                          >
                            افزودن به سبد
                          </Button>
                        </CardContent>
                      </Card>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {comparisonFeatures.map((feature) => (
                  <TableRow key={feature.key}>
                    <TableCell
                      sx={{
                        fontWeight: 'bold',
                        bgcolor: 'grey.50',
                        direction: 'rtl',
                      }}
                    >
                      {feature.label}
                    </TableCell>
                    {products.map((product) => (
                      <TableCell key={`${product._id}-${feature.key}`}>
                        {renderFeatureValue(product, feature)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          borderTop: 1,
          borderColor: 'divider',
          p: 2,
          direction: 'rtl',
        }}
      >
        <Button onClick={onClose} color="inherit">
          بستن
        </Button>
        <Button
          variant="contained"
          onClick={() => {
            products.forEach(product => handleAddToCart(product));
            onClose();
          }}
          startIcon={<CartIcon />}
        >
          افزودن همه به سبد
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProductComparison; 