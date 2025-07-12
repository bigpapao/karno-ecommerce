import React, { useState, useEffect } from 'react';
import AdminHeader from '../../components/AdminHeader';
import { adminService } from '../../services/admin.service';
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Button,
  IconButton,
  Chip,
  LinearProgress,
  Alert,
  Tooltip,
  Badge,
  useTheme,
  alpha,
  CircularProgress,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  ShoppingCart as OrderIcon,
  Person as UserIcon,
  Inventory as ProductIcon,
  AttachMoney as RevenueIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  Dashboard as DashboardIcon,
  Speed as PerformanceIcon,
  Storage as DatabaseIcon,
  Memory as CacheIcon,
  QueryStats as QueryIcon,
  Tune as OptimizeIcon,
  CheckCircle as HealthIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';

const Dashboard = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState(null);
  
  // Performance monitoring state
  const [currentTab, setCurrentTab] = useState(0);
  const [performanceData, setPerformanceData] = useState({
    metrics: null,
    health: null,
    cache: null,
    collections: null,
    slowQueries: null,
  });
  const [performanceLoading, setPerformanceLoading] = useState(false);

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminService.getDashboardStats();
      setDashboardData(data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('خطا در بارگذاری داده‌ها. لطفاً دوباره تلاش کنید.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch performance monitoring data
  const fetchPerformanceData = async () => {
    try {
      setPerformanceLoading(true);
      const [metrics, health, cache, collections, slowQueries] = await Promise.all([
        adminService.getDatabaseMetrics(),
        adminService.getDatabaseHealth(),
        adminService.getCacheMetrics(),
        adminService.getCollectionStats(),
        adminService.getSlowQueries(),
      ]);

      setPerformanceData({
        metrics,
        health,
        cache,
        collections,
        slowQueries,
      });
    } catch (err) {
      console.error('Error fetching performance data:', err);
    } finally {
      setPerformanceLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (currentTab === 1) { // Performance tab
      fetchPerformanceData();
    }
  }, [currentTab]);

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  // Create stats array from real data
  const getStats = () => {
    if (!dashboardData) return [];
    
    return [
      {
        title: 'سفارشات امروز',
        value: dashboardData.data?.orderCount || '0',
        change: '+12%',
        trend: 'up',
        icon: <OrderIcon fontSize="large" />,
        color: theme.palette.success.main,
        bgColor: alpha(theme.palette.success.main, 0.1),
        description: 'نسبت به دیروز',
      },
      {
        title: 'کاربران',
        value: dashboardData.data?.userCount || '0',
        change: '+8%',
        trend: 'up',
        icon: <UserIcon fontSize="large" />,
        color: theme.palette.info.main,
        bgColor: alpha(theme.palette.info.main, 0.1),
        description: 'کل کاربران',
      },
      {
        title: 'محصولات',
        value: dashboardData.data?.productCount || '0',
        change: '+5%',
        trend: 'up',
        icon: <ProductIcon fontSize="large" />,
        color: theme.palette.warning.main,
        bgColor: alpha(theme.palette.warning.main, 0.1),
        description: 'محصولات فعال',
      },
      {
        title: 'کل درآمد',
        value: dashboardData.data?.totalRevenue ? 
          new Intl.NumberFormat('fa-IR').format(dashboardData.data.totalRevenue) : '0',
        change: '-3%',
        trend: 'down',
        icon: <RevenueIcon fontSize="large" />,
        color: theme.palette.error.main,
        bgColor: alpha(theme.palette.error.main, 0.1),
        description: 'تومان',
      },
    ];
  };

  const stats = getStats();

  // Get recent orders from real data
  const getRecentOrders = () => {
    if (!dashboardData?.data?.recentOrders) return [];
    
    return dashboardData.data.recentOrders.map((order, index) => ({
      id: order.orderNumber || `#ORD-${String(index + 1).padStart(3, '0')}`,
      user: order.user?.firstName && order.user?.lastName ? 
        `${order.user.firstName} ${order.user.lastName}` : 
        order.user?.email || 'کاربر ناشناس',
      date: new Date(order.createdAt).toLocaleDateString('fa-IR'),
      amount: new Intl.NumberFormat('fa-IR').format(order.totalPrice || 0),
      status: getOrderStatusText(order.status),
      statusColor: getOrderStatusColor(order.status),
      items: order.orderItems?.length || 0,
      priority: 'normal'
    }));
  };

  // Helper functions for order status
  const getOrderStatusText = (status) => {
    const statusMap = {
      'pending': 'در انتظار پرداخت',
      'processing': 'در حال پردازش',
      'shipped': 'ارسال شده',
      'delivered': 'تکمیل شده',
      'cancelled': 'لغو شده'
    };
    return statusMap[status] || status;
  };

  const getOrderStatusColor = (status) => {
    const colorMap = {
      'pending': 'warning',
      'processing': 'info',
      'shipped': 'primary',
      'delivered': 'success',
      'cancelled': 'error'
    };
    return colorMap[status] || 'default';
  };

  // Get top products from real data
  const getTopProducts = () => {
    if (!dashboardData?.data?.topProducts) return [];
    
    return dashboardData.data.topProducts.slice(0, 5).map(product => ({
      name: product.name || 'محصول ناشناس',
      sales: product.totalQuantity || 0,
      revenue: new Intl.NumberFormat('fa-IR').format(product.totalRevenue || 0),
      progress: Math.min((product.totalQuantity || 0) * 2, 100),
      stock: product.currentStock || 0
    }));
  };

  // Get low stock products from real data
  const getLowStockProducts = () => {
    if (!dashboardData?.data?.lowStockProducts) return [];
    
    return dashboardData.data.lowStockProducts.slice(0, 3).map(product => ({
      name: product.name || 'محصول ناشناس',
      stock: product.stock || 0,
      minStock: 10
    }));
  };

  const recentOrders = getRecentOrders();
  const topProducts = getTopProducts();
  const lowStockProducts = getLowStockProducts();

  const handleRefresh = () => {
    fetchDashboardData();
    if (currentTab === 1) {
      fetchPerformanceData();
    }
  };

  // Performance optimization actions
  const handleOptimizeDatabase = async () => {
    try {
      setPerformanceLoading(true);
      await adminService.optimizeDatabase();
      fetchPerformanceData();
    } catch (error) {
      console.error('Database optimization failed:', error);
    } finally {
      setPerformanceLoading(false);
    }
  };

  const handleClearCache = async () => {
    try {
      setPerformanceLoading(true);
      await adminService.clearCache();
      fetchPerformanceData();
    } catch (error) {
      console.error('Cache clear failed:', error);
    } finally {
      setPerformanceLoading(false);
    }
  };

  // Performance helper functions
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getPerformanceScore = () => {
    if (!performanceData.metrics?.data) return 0;
    const metrics = performanceData.metrics.data;
    
    let score = 100;
    if (metrics.avgQueryTime > 100) score -= 20;
    if (metrics.slowQueries > 50) score -= 15;
    if (metrics.cacheHitRate < 80) score -= 15;
    if (metrics.connectionsActive > 15) score -= 10;
    
    return Math.max(score, 0);
  };

  if (loading && !dashboardData) {
    return (
      <>
        <AdminHeader />
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      </>
    );
  }

  return (
    <>
      <AdminHeader />
      <Box sx={{ flexGrow: 1, p: 3 }}>
        {/* Header Section */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom sx={{ direction: 'rtl', fontWeight: 'bold' }}>
              داشبورد مدیریت
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ direction: 'rtl' }}>
              آخرین بروزرسانی: {lastUpdated.toLocaleTimeString('fa-IR')}
            </Typography>
          </Box>
          <Tooltip title="بروزرسانی داده‌ها">
            <IconButton onClick={handleRefresh} disabled={loading || performanceLoading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Navigation Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={currentTab} onChange={handleTabChange} sx={{ direction: 'rtl' }}>
            <Tab 
              icon={<DashboardIcon />} 
              label="داشبورد اصلی" 
              sx={{ direction: 'rtl', flexDirection: 'row-reverse' }}
            />
            <Tab 
              icon={<PerformanceIcon />} 
              label="نظارت بر عملکرد" 
              sx={{ direction: 'rtl', flexDirection: 'row-reverse' }}
            />
          </Tabs>
        </Box>

        {/* Loading Bar */}
        {(loading || performanceLoading) && <LinearProgress sx={{ mb: 2 }} />}

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3, direction: 'rtl' }}>
            {error}
          </Alert>
        )}

        {/* Main Dashboard Tab */}
        {currentTab === 0 && (
          <>
            {/* Low Stock Alert */}
            {lowStockProducts.length > 0 && (
              <Alert 
                severity="warning" 
                sx={{ mb: 3, direction: 'rtl' }}
                action={
                  <Button color="inherit" size="small">
                    مشاهده همه
                  </Button>
                }
              >
                <Typography variant="body2">
                  {lowStockProducts.length} محصول موجودی کم دارند
                </Typography>
              </Alert>
            )}

            {/* Enhanced Stats Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {stats.map((stat, index) => (
                <Grid item xs={12} sm={6} md={3} key={index}>
                  <Card
                    elevation={2}
                    sx={{
                      height: 160,
                      background: `linear-gradient(135deg, ${stat.bgColor} 0%, ${alpha(stat.color, 0.05)} 100%)`,
                      border: `1px solid ${alpha(stat.color, 0.2)}`,
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: theme.shadows[8],
                      },
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', direction: 'rtl' }}>
                        <Box>
                          <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
                            {stat.title}
                          </Typography>
                          <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', color: stat.color, mb: 1 }}>
                            {stat.value}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {stat.trend === 'up' ? (
                              <TrendingUpIcon sx={{ color: theme.palette.success.main, fontSize: 16 }} />
                            ) : (
                              <TrendingDownIcon sx={{ color: theme.palette.error.main, fontSize: 16 }} />
                            )}
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: stat.trend === 'up' ? theme.palette.success.main : theme.palette.error.main,
                                fontWeight: 'bold'
                              }}
                            >
                              {stat.change}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {stat.description}
                            </Typography>
                          </Box>
                        </Box>
                        <Avatar sx={{ bgcolor: stat.color, width: 56, height: 56 }}>
                          {stat.icon}
                        </Avatar>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            <Grid container spacing={3}>
              {/* Enhanced Recent Orders */}
              <Grid item xs={12} lg={8}>
                <Card elevation={2} sx={{ height: '100%' }}>
                  <CardHeader 
                    title={
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', direction: 'rtl' }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          سفارشات اخیر
                        </Typography>
                        <Button size="small" endIcon={<ViewIcon />}>
                          مشاهده همه
                        </Button>
                      </Box>
                    } 
                    sx={{ borderBottom: '1px solid #eee' }}
                  />
                  <CardContent sx={{ p: 0 }}>
                    <List sx={{ width: '100%' }}>
                      {recentOrders.map((order, index) => (
                        <React.Fragment key={order.id}>
                          <ListItem 
                            alignItems="flex-start" 
                            sx={{ 
                              px: 3, 
                              py: 2, 
                              direction: 'rtl',
                              '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) }
                            }}
                            secondaryAction={
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <Tooltip title="مشاهده جزئیات">
                                  <IconButton size="small">
                                    <ViewIcon />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="ویرایش">
                                  <IconButton size="small">
                                    <EditIcon />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            }
                          >
                            <ListItemAvatar>
                              <Badge 
                                badgeContent={order.priority === 'high' ? '!' : null} 
                                color="error"
                              >
                                <Avatar sx={{ bgcolor: alpha(order.statusColor === 'success' ? theme.palette.success.main : theme.palette.warning.main, 0.2), color: order.statusColor === 'success' ? theme.palette.success.main : theme.palette.warning.main }}>
                                  <OrderIcon />
                                </Avatar>
                              </Badge>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Typography component="div" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography component="span" variant="body1" fontWeight="bold">
                                      {order.id}
                                    </Typography>
                                    <Chip 
                                      label={order.status} 
                                      color={order.statusColor} 
                                      size="small" 
                                      variant="outlined"
                                    />
                                  </Box>
                                  <Typography component="span" variant="body2" color="text.secondary">
                                    {order.date}
                                  </Typography>
                                </Typography>
                              }
                              secondary={
                                <Typography component="div" sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                                  <Box>
                                    <Typography component="span" variant="body2" color="text.primary">
                                      {order.user}
                                    </Typography>
                                    <Typography component="span" variant="body2" color="text.secondary" sx={{ mr: 2 }}>
                                      • {order.items} آیتم
                                    </Typography>
                                  </Box>
                                  <Typography component="span" variant="body1" fontWeight="bold" color="primary.main">
                                    {order.amount} تومان
                                  </Typography>
                                </Typography>
                              }
                            />
                          </ListItem>
                          {index < recentOrders.length - 1 && <Divider variant="inset" component="li" />}
                        </React.Fragment>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>

              {/* Enhanced Top Products */}
              <Grid item xs={12} lg={4}>
                <Card elevation={2}>
                  <CardHeader 
                    title={
                      <Typography variant="h6" sx={{ direction: 'rtl', fontWeight: 'bold' }}>
                        محصولات پرفروش
                      </Typography>
                    } 
                    sx={{ borderBottom: '1px solid #eee' }}
                  />
                  <CardContent sx={{ p: 0 }}>
                    <List sx={{ width: '100%' }}>
                      {topProducts.map((product, index) => (
                        <React.Fragment key={product.name}>
                          <ListItem alignItems="flex-start" sx={{ px: 3, py: 2, direction: 'rtl' }}>
                            <ListItemAvatar>
                              <Avatar sx={{ 
                                bgcolor: product.stock === 0 ? alpha(theme.palette.error.main, 0.2) : alpha(theme.palette.success.main, 0.2), 
                                color: product.stock === 0 ? theme.palette.error.main : theme.palette.success.main 
                              }}>
                                <ProductIcon />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Typography component="div">
                                  <Typography variant="body1" fontWeight="bold" sx={{ mb: 1 }}>
                                    {product.name}
                                  </Typography>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <Typography variant="body2" color="text.secondary">
                                      فروش:
                                    </Typography>
                                    <LinearProgress 
                                      variant="determinate" 
                                      value={product.progress} 
                                      sx={{ flexGrow: 1, height: 6, borderRadius: 3 }}
                                    />
                                    <Typography variant="body2" fontWeight="bold">
                                      {product.sales}
                                    </Typography>
                                  </Box>
                                  <Typography variant="body2" color="text.secondary">
                                    درآمد: {product.revenue} تومان
                                  </Typography>
                                </Typography>
                              }
                            />
                          </ListItem>
                          {index < topProducts.length - 1 && <Divider variant="inset" component="li" />}
                        </React.Fragment>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </>
        )}

        {/* Performance Monitoring Tab */}
        {currentTab === 1 && (
          <Box>
            {/* Performance Overview Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card elevation={2}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', direction: 'rtl' }}>
                      <Box>
                        <Typography variant="h6" sx={{ direction: 'rtl' }}>امتیاز کلی</Typography>
                        <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
                          {getPerformanceScore()}%
                        </Typography>
                      </Box>
                      <PerformanceIcon color="primary" sx={{ fontSize: 40 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card elevation={2}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', direction: 'rtl' }}>
                      <Box>
                        <Typography variant="h6" sx={{ direction: 'rtl' }}>وضعیت دیتابیس</Typography>
                        <Chip 
                          label={performanceData.health?.data?.database?.state || 'نامشخص'}
                          color={performanceData.health?.data?.database?.state === 'connected' ? 'success' : 'error'}
                          icon={performanceData.health?.data?.database?.state === 'connected' ? <HealthIcon /> : <ErrorIcon />}
                        />
                      </Box>
                      <DatabaseIcon color="info" sx={{ fontSize: 40 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card elevation={2}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', direction: 'rtl' }}>
                      <Box>
                        <Typography variant="h6" sx={{ direction: 'rtl' }}>کش Redis</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {performanceData.cache?.data?.cache?.totalKeys || 0} کلید
                        </Typography>
                      </Box>
                      <CacheIcon color="warning" sx={{ fontSize: 40 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card elevation={2}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', direction: 'rtl' }}>
                      <Box>
                        <Typography variant="h6" sx={{ direction: 'rtl' }}>کوئری‌های آهسته</Typography>
                        <Typography variant="h4" color="error" sx={{ fontWeight: 'bold' }}>
                          {Object.keys(performanceData.slowQueries?.data?.groupedQueries || {}).length}
                        </Typography>
                      </Box>
                      <QueryIcon color="error" sx={{ fontSize: 40 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Performance Actions */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12}>
                <Card elevation={2}>
                  <CardHeader 
                    title="عملیات بهینه‌سازی" 
                    sx={{ direction: 'rtl' }}
                  />
                  <CardContent>
                    <Box sx={{ display: 'flex', gap: 2, direction: 'rtl' }}>
                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={<OptimizeIcon />}
                        onClick={handleOptimizeDatabase}
                        disabled={performanceLoading}
                        sx={{ direction: 'rtl' }}
                      >
                        بهینه‌سازی دیتابیس
                      </Button>
                      <Button
                        variant="outlined"
                        color="warning"
                        startIcon={<CacheIcon />}
                        onClick={handleClearCache}
                        disabled={performanceLoading}
                        sx={{ direction: 'rtl' }}
                      >
                        پاک کردن کش
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Collection Statistics */}
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card elevation={2}>
                  <CardHeader 
                    title="آمار مجموعه‌ها" 
                    sx={{ direction: 'rtl' }}
                  />
                  <CardContent>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell align="right">نام مجموعه</TableCell>
                            <TableCell align="right">تعداد اسناد</TableCell>
                            <TableCell align="right">حجم</TableCell>
                            <TableCell align="right">فهرست‌ها</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {(performanceData.collections?.data?.collections || []).map((collection) => (
                            <TableRow key={collection.name}>
                              <TableCell align="right">{collection.name}</TableCell>
                              <TableCell align="right">
                                {collection.documents?.toLocaleString('fa-IR') || 'نامشخص'}
                              </TableCell>
                              <TableCell align="right">
                                {collection.size ? formatBytes(collection.size) : 'نامشخص'}
                              </TableCell>
                              <TableCell align="right">{collection.indexes || 0}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}
      </Box>
    </>
  );
};

export default Dashboard;
