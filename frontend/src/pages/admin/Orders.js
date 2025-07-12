import React, { useState } from 'react';
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
  Tooltip,
  Avatar,
  Stack,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  useTheme,
  alpha,
  Badge,
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Edit as EditIcon,
  LocalShipping as ShippingIcon,
  Payment as PaymentIcon,
  Person as PersonIcon,
  Search as SearchIcon,
  GetApp as ExportIcon,
  Print as PrintIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
  ShoppingCart as CartIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';

const Orders = () => {
  const theme = useTheme();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetailOpen, setOrderDetailOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    paymentStatus: '',
    dateRange: '',
  });

  // Enhanced mock data for orders
  const orders = [
    {
      id: 'ORD-001',
      customerName: 'علی محمدی',
      customerPhone: '09123456789',
      customerEmail: 'ali@example.com',
      date: '۱۴۰۴/۰۵/۰۸',
      time: '۱۴:۳۰',
      status: 'تکمیل شده',
      paymentStatus: 'پرداخت شده',
      totalAmount: 350000,
      itemsCount: 3,
      shippingAddress: 'تهران، خیابان ولیعصر، پلاک ۱۲۳',
      items: [
        { name: 'فیلتر روغن تویوتا', quantity: 2, price: 100000 },
        { name: 'لنت ترمز بوش', quantity: 1, price: 150000 },
      ],
      trackingCode: 'TRK123456789',
      priority: 'normal'
    },
    {
      id: 'ORD-002',
      customerName: 'سارا احمدی',
      customerPhone: '09987654321',
      customerEmail: 'sara@example.com',
      date: '۱۴۰۴/۰۵/۰۸',
      time: '۱۶:۱۵',
      status: 'در حال پردازش',
      paymentStatus: 'پرداخت شده',
      totalAmount: 420000,
      itemsCount: 2,
      shippingAddress: 'اصفهان، خیابان چهارباغ، پلاک ۴۵۶',
      items: [
        { name: 'باتری واریان', quantity: 1, price: 400000 },
        { name: 'شمع NGK', quantity: 1, price: 20000 },
      ],
      trackingCode: null,
      priority: 'high'
    },
    {
      id: 'ORD-003',
      customerName: 'محمد رضایی',
      customerPhone: '09111111111',
      customerEmail: 'mohammad@example.com',
      date: '۱۴۰۴/۰۵/۰۷',
      time: '۱۰:۴۵',
      status: 'ارسال شده',
      paymentStatus: 'پرداخت شده',
      totalAmount: 1150000,
      itemsCount: 5,
      shippingAddress: 'شیراز، خیابان زند، پلاک ۷۸۹',
      items: [
        { name: 'روغن موتور شل', quantity: 2, price: 150000 },
        { name: 'فیلتر هوا', quantity: 3, price: 50000 },
      ],
      trackingCode: 'TRK987654321',
      priority: 'normal'
    },
    {
      id: 'ORD-004',
      customerName: 'زهرا کریمی',
      customerPhone: '09222222222',
      customerEmail: 'zahra@example.com',
      date: '۱۴۰۴/۰۵/۰۷',
      time: '۰۹:۲۰',
      status: 'در انتظار پرداخت',
      paymentStatus: 'پرداخت نشده',
      totalAmount: 280000,
      itemsCount: 1,
      shippingAddress: 'مشهد، خیابان امام رضا، پلاک ۳۲۱',
      items: [
        { name: 'دیسک ترمز', quantity: 1, price: 280000 },
      ],
      trackingCode: null,
      priority: 'high'
    },
    {
      id: 'ORD-005',
      customerName: 'امیر حسینی',
      customerPhone: '09333333333',
      customerEmail: 'amir@example.com',
      date: '۱۴۰۴/۰۵/۰۶',
      time: '۱۱:۳۰',
      status: 'لغو شده',
      paymentStatus: 'بازگشت وجه',
      totalAmount: 560000,
      itemsCount: 4,
      shippingAddress: 'تبریز، خیابان ولیعهد، پلاک ۶۵۴',
      items: [
        { name: 'کمک فنر', quantity: 2, price: 200000 },
        { name: 'تسمه تایم', quantity: 2, price: 80000 },
      ],
      trackingCode: null,
      priority: 'normal'
    },
  ];

  // Filter orders based on search term and filters
  const filteredOrders = orders.filter((order) => {
    const matchesSearch = 
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerPhone.includes(searchTerm) ||
      order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = !filters.status || order.status === filters.status;
    const matchesPaymentStatus = !filters.paymentStatus || order.paymentStatus === filters.paymentStatus;

    return matchesSearch && matchesStatus && matchesPaymentStatus;
  });

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

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setOrderDetailOpen(true);
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
    setPage(0);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'تکمیل شده': return 'success';
      case 'در حال پردازش': return 'warning';
      case 'ارسال شده': return 'info';
      case 'در انتظار پرداخت': return 'error';
      case 'لغو شده': return 'default';
      default: return 'default';
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'پرداخت شده': return 'success';
      case 'پرداخت نشده': return 'error';
      case 'بازگشت وجه': return 'warning';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'تکمیل شده': return <CheckCircleIcon fontSize="small" />;
      case 'در حال پردازش': return <ScheduleIcon fontSize="small" />;
      case 'ارسال شده': return <ShippingIcon fontSize="small" />;
      case 'در انتظار پرداخت': return <PaymentIcon fontSize="small" />;
      case 'لغو شده': return <CancelIcon fontSize="small" />;
      default: return <WarningIcon fontSize="small" />;
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fa-IR').format(price);
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ direction: 'rtl', fontWeight: 'bold', mb: 1 }}>
            مدیریت سفارشات
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ direction: 'rtl' }}>
            مدیریت و پیگیری سفارشات مشتریان
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            size="small"
          >
            چاپ گزارش
          </Button>
          <Button
            variant="outlined"
            startIcon={<ExportIcon />}
            size="small"
          >
            خروجی Excel
          </Button>
        </Stack>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={1}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary.main" sx={{ fontWeight: 'bold' }}>
                {orders.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                کل سفارشات
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={1}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="warning.main" sx={{ fontWeight: 'bold' }}>
                {orders.filter(o => o.status === 'در حال پردازش').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                در حال پردازش
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={1}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main" sx={{ fontWeight: 'bold' }}>
                {orders.filter(o => o.status === 'تکمیل شده').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                تکمیل شده
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={1}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="error.main" sx={{ fontWeight: 'bold' }}>
                {orders.filter(o => o.paymentStatus === 'پرداخت نشده').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                پرداخت نشده
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search Section */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SearchIcon />
          جستجو در سفارشات
        </Typography>
        <TextField
          fullWidth
          placeholder="جستجو بر اساس شماره سفارش، نام مشتری، تلفن یا ایمیل..."
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
          sx={{ '& .MuiOutlinedInput-root': { backgroundColor: 'background.default' } }}
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

      {/* Filters Section */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SearchIcon />
          فیلترها
        </Typography>
        
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth>
              <InputLabel>وضعیت سفارش</InputLabel>
              <Select
                value={filters.status}
                label="وضعیت سفارش"
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <MenuItem value="">همه سفارشات</MenuItem>
                <MenuItem value="در حال پردازش">در حال پردازش</MenuItem>
                <MenuItem value="تکمیل شده">تکمیل شده</MenuItem>
                <MenuItem value="ارسال شده">ارسال شده</MenuItem>
                <MenuItem value="در انتظار پرداخت">در انتظار پرداخت</MenuItem>
                <MenuItem value="لغو شده">لغو شده</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth>
              <InputLabel>وضعیت پرداخت</InputLabel>
              <Select
                value={filters.paymentStatus}
                label="وضعیت پرداخت"
                onChange={(e) => handleFilterChange('paymentStatus', e.target.value)}
              >
                <MenuItem value="">همه پرداخت‌ها</MenuItem>
                <MenuItem value="پرداخت شده">پرداخت شده</MenuItem>
                <MenuItem value="پرداخت نشده">پرداخت نشده</MenuItem>
                <MenuItem value="بازگشت وجه">بازگشت وجه</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <Button 
              onClick={() => setFilters({ status: '', paymentStatus: '', dateRange: '' })} 
              variant="outlined" 
              fullWidth
              sx={{ height: '56px' }}
            >
              پاک کردن همه فیلترها
            </Button>
          </Grid>
        </Grid>

        {/* Active Filters Chips */}
        {(filters.status || filters.paymentStatus) && (
          <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              فیلترهای فعال:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {filters.status && (
                <Chip
                  label={`وضعیت سفارش: ${filters.status}`}
                  onDelete={() => handleFilterChange('status', '')}
                  variant="filled"
                  color="secondary"
                  size="small"
                />
              )}
              {filters.paymentStatus && (
                <Chip
                  label={`وضعیت پرداخت: ${filters.paymentStatus}`}
                  onDelete={() => handleFilterChange('paymentStatus', '')}
                  variant="filled"
                  color="secondary"
                  size="small"
                />
              )}
            </Box>
          </Box>
        )}
      </Paper>

      {/* Orders Table */}
      <Paper sx={{ width: '100%', mb: 2 }}>
        <TableContainer>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow>
                <TableCell align="right">شماره سفارش</TableCell>
                <TableCell align="right">مشتری</TableCell>
                <TableCell align="right">تاریخ و زمان</TableCell>
                <TableCell align="right">تعداد آیتم</TableCell>
                <TableCell align="right">مبلغ کل</TableCell>
                <TableCell align="right">وضعیت سفارش</TableCell>
                <TableCell align="right">وضعیت پرداخت</TableCell>
                <TableCell align="center">عملیات</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredOrders
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((order) => (
                  <TableRow 
                    key={order.id}
                    hover
                    sx={{ '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) } }}
                  >
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" fontWeight="bold">
                          {order.id}
                        </Typography>
                        {order.priority === 'high' && (
                          <Badge badgeContent="!" color="error" />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {order.customerName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {order.customerPhone}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Box>
                        <Typography variant="body2">
                          {order.date}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {order.time}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Chip 
                        label={`${order.itemsCount} آیتم`}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="bold" color="primary.main">
                        {formatPrice(order.totalAmount)} تومان
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        icon={getStatusIcon(order.status)}
                        label={order.status}
                        color={getStatusColor(order.status)}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        label={order.paymentStatus}
                        color={getPaymentStatusColor(order.paymentStatus)}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={0.5} justifyContent="center">
                        <Tooltip title="مشاهده جزئیات">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleViewOrder(order)}
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="ویرایش">
                          <IconButton size="small" color="info">
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="پیگیری ارسال">
                          <IconButton size="small" color="success">
                            <ShippingIcon />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredOrders.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="تعداد در هر صفحه:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} از ${count}`}
        />
      </Paper>

      {/* Order Detail Dialog */}
      <Dialog 
        open={orderDetailOpen} 
        onClose={() => setOrderDetailOpen(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle sx={{ direction: 'rtl', borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight="bold">
              جزئیات سفارش {selectedOrder?.id}
            </Typography>
            <Chip
              icon={getStatusIcon(selectedOrder?.status)}
              label={selectedOrder?.status}
              color={getStatusColor(selectedOrder?.status)}
              variant="outlined"
            />
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedOrder && (
            <Grid container spacing={3} sx={{ direction: 'rtl' }}>
              {/* Customer Information */}
              <Grid item xs={12} md={6}>
                <Card elevation={1}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PersonIcon color="primary" />
                      اطلاعات مشتری
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Stack spacing={1}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PersonIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          <strong>نام:</strong> {selectedOrder.customerName}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PhoneIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          <strong>تلفن:</strong> {selectedOrder.customerPhone}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <EmailIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          <strong>ایمیل:</strong> {selectedOrder.customerEmail}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                        <LocationIcon fontSize="small" color="action" sx={{ mt: 0.5 }} />
                        <Typography variant="body2">
                          <strong>آدرس:</strong> {selectedOrder.shippingAddress}
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              {/* Order Information */}
              <Grid item xs={12} md={6}>
                <Card elevation={1}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CartIcon color="primary" />
                      اطلاعات سفارش
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Stack spacing={1}>
                      <Typography variant="body2">
                        <strong>تاریخ:</strong> {selectedOrder.date} - {selectedOrder.time}
                      </Typography>
                      <Typography variant="body2">
                        <strong>تعداد آیتم:</strong> {selectedOrder.itemsCount}
                      </Typography>
                      <Typography variant="body2">
                        <strong>مبلغ کل:</strong> {formatPrice(selectedOrder.totalAmount)} تومان
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2">
                          <strong>وضعیت پرداخت:</strong>
                        </Typography>
                        <Chip
                          label={selectedOrder.paymentStatus}
                          color={getPaymentStatusColor(selectedOrder.paymentStatus)}
                          size="small"
                        />
                      </Box>
                      {selectedOrder.trackingCode && (
                        <Typography variant="body2">
                          <strong>کد پیگیری:</strong> {selectedOrder.trackingCode}
                        </Typography>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              {/* Order Items */}
              <Grid item xs={12}>
                <Card elevation={1}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      آیتم‌های سفارش
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <List>
                      {selectedOrder.items.map((item, index) => (
                        <ListItem key={index} divider={index < selectedOrder.items.length - 1}>
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
                              <CartIcon color="primary" />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={item.name}
                            secondary={
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                                <Typography variant="body2" color="text.secondary">
                                  تعداد: {item.quantity}
                                </Typography>
                                <Typography variant="body2" color="primary.main" fontWeight="bold">
                                  {formatPrice(item.price)} تومان
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOrderDetailOpen(false)}>
            بستن
          </Button>
          <Button variant="outlined" startIcon={<PrintIcon />}>
            چاپ
          </Button>
          <Button variant="contained" startIcon={<EditIcon />}>
            ویرایش سفارش
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Orders;
