import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Tabs,
  Tab,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  CircularProgress,
  Alert,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Visibility as ViewIcon,
  TouchApp as ClickIcon,
  Category as CategoryIcon,
  BrandingWatermark as BrandIcon,
  Assessment as AssessmentIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { adminService } from '../../services/admin.service';

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [timeRange, setTimeRange] = useState(30);
  const [error, setError] = useState(null);
  
  // Analytics data state
  const [overview, setOverview] = useState(null);
  const [categoriesData, setCategoriesData] = useState(null);
  const [brandsData, setBrandsData] = useState(null);
  const [realtimeData, setRealtimeData] = useState(null);

  const fetchAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);
      
      const [overviewRes, categoriesRes, brandsRes] = await Promise.all([
        adminService.getAnalyticsOverview({ days: timeRange }),
        adminService.getCategoriesAnalyticsSummary({ days: timeRange }),
        adminService.getBrandsAnalyticsSummary({ days: timeRange })
      ]);
      
      setOverview(overviewRes.data);
      setCategoriesData(categoriesRes.data);
      setBrandsData(brandsRes.data);
      
      setError(null);
    } catch (error) {
      setError('خطا در بارگذاری آمار');
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  const fetchRealtimeData = useCallback(async () => {
    try {
      const response = await adminService.getRealtimeAnalytics();
      setRealtimeData(response.data);
    } catch (error) {
      // Silent error for real-time data
    }
  }, []);

  useEffect(() => {
    fetchAnalyticsData();
    
    // Setup real-time updates
    const interval = setInterval(fetchRealtimeData, 30000); // Every 30 seconds
    
    return () => clearInterval(interval);
  }, [fetchAnalyticsData, fetchRealtimeData]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleTimeRangeChange = (event) => {
    setTimeRange(event.target.value);
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num?.toString() || '0';
  };

  const formatPercentage = (num) => {
    return `${num?.toFixed(1) || 0}%`;
  };

  const getChangeColor = (change) => {
    if (change > 0) return 'success.main';
    if (change < 0) return 'error.main';
    return 'text.secondary';
  };

  const getChangeIcon = (change) => {
    if (change > 0) return <TrendingUpIcon />;
    if (change < 0) return <TrendingDownIcon />;
    return null;
  };

  // Stats cards component
  const StatsCard = ({ title, value, change, icon, color = 'primary' }) => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography color="textSecondary" gutterBottom variant="overline">
              {title}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 600 }}>
              {formatNumber(value)}
            </Typography>
            {change !== undefined && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <Box sx={{ color: getChangeColor(change), display: 'flex', alignItems: 'center' }}>
                  {getChangeIcon(change)}
                  <Typography variant="body2" sx={{ ml: 0.5 }}>
                    {formatPercentage(Math.abs(change))}
                  </Typography>
                </Box>
                <Typography variant="body2" color="textSecondary" sx={{ ml: 1 }}>
                  از دوره قبل
                </Typography>
              </Box>
            )}
          </Box>
          <Box sx={{ color: `${color}.main`, opacity: 0.8 }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  // Top items table component
  const TopItemsTable = ({ items, type, loading }) => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>نام</TableCell>
            <TableCell align="center">بازدید</TableCell>
            <TableCell align="center">کلیک</TableCell>
            <TableCell align="center">کاربر</TableCell>
            <TableCell align="center">امتیاز</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            [...Array(5)].map((_, index) => (
              <TableRow key={index}>
                <TableCell><LinearProgress /></TableCell>
                <TableCell><LinearProgress /></TableCell>
                <TableCell><LinearProgress /></TableCell>
                <TableCell><LinearProgress /></TableCell>
                <TableCell><LinearProgress /></TableCell>
              </TableRow>
            ))
          ) : (
            items?.slice(0, 10).map((item, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {type === 'category' ? <CategoryIcon sx={{ mr: 1 }} /> : <BrandIcon sx={{ mr: 1 }} />}
                    {item.name || item.categoryName || item.brandName}
                  </Box>
                </TableCell>
                <TableCell align="center">{formatNumber(item.totalViews)}</TableCell>
                <TableCell align="center">{formatNumber(item.totalClicks)}</TableCell>
                <TableCell align="center">{formatNumber(item.totalUsers)}</TableCell>
                <TableCell align="center">
                  <Chip
                    label={formatNumber(item.combinedScore || item.avgPopularityScore)}
                    color="primary"
                    size="small"
                  />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );

  // Chart component
  const AnalyticsChart = ({ data, type = 'line' }) => {
    if (!data || data.length === 0) {
      return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography color="textSecondary">داده‌ای برای نمایش وجود ندارد</Typography>
        </Box>
      );
    }

    if (type === 'line') {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <RechartsTooltip />
            <Line type="monotone" dataKey="views" stroke="#8884d8" strokeWidth={2} />
            <Line type="monotone" dataKey="clicks" stroke="#82ca9d" strokeWidth={2} />
            <Line type="monotone" dataKey="users" stroke="#ffc658" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      );
    }

    if (type === 'bar') {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <RechartsTooltip />
            <Bar dataKey="value" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      );
    }

    return null;
  };

  if (loading && !overview) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3, direction: 'rtl' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
          آمار و تحلیل
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>بازه زمانی</InputLabel>
            <Select value={timeRange} onChange={handleTimeRangeChange} label="بازه زمانی">
              <MenuItem value={7}>7 روز گذشته</MenuItem>
              <MenuItem value={30}>30 روز گذشته</MenuItem>
              <MenuItem value={90}>90 روز گذشته</MenuItem>
            </Select>
          </FormControl>
          <Tooltip title="بروزرسانی">
            <IconButton onClick={fetchAnalyticsData}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Real-time stats */}
      {realtimeData && (
        <Paper sx={{ p: 2, mb: 3, backgroundColor: 'primary.50' }}>
          <Typography variant="h6" gutterBottom>
            آمار لحظه‌ای
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h5" color="primary.main">
                  {realtimeData.currentActiveUsers}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  کاربر فعال
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h5" color="primary.main">
                  {realtimeData.eventsLastHour}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  رویداد در ساعت گذشته
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="textSecondary">
                  آخرین بروزرسانی: {new Date(realtimeData.timestamp).toLocaleTimeString('fa-IR')}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Main stats cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="کل بازدید دسته‌بندی‌ها"
            value={categoriesData?.metrics?.totalViews}
            icon={<ViewIcon sx={{ fontSize: 40 }} />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="کل کلیک دسته‌بندی‌ها"
            value={categoriesData?.metrics?.totalClicks}
            icon={<ClickIcon sx={{ fontSize: 40 }} />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="کل بازدید برندها"
            value={brandsData?.metrics?.totalViews}
            icon={<ViewIcon sx={{ fontSize: 40 }} />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="کل کلیک برندها"
            value={brandsData?.metrics?.totalClicks}
            icon={<ClickIcon sx={{ fontSize: 40 }} />}
            color="error"
          />
        </Grid>
      </Grid>

      {/* Tabs for different analytics views */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="خلاصه" icon={<AssessmentIcon />} />
          <Tab label="دسته‌بندی‌ها" icon={<CategoryIcon />} />
          <Tab label="برندها" icon={<BrandIcon />} />
        </Tabs>
      </Paper>

      {/* Tab content */}
      {tabValue === 0 && (
        <Grid container spacing={3}>
          {/* Overview metrics */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader title="برترین دسته‌بندی‌ها" />
              <CardContent>
                <TopItemsTable
                  items={overview?.topPerforming?.categories}
                  type="category"
                  loading={loading}
                />
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader title="برترین برندها" />
              <CardContent>
                <TopItemsTable
                  items={overview?.topPerforming?.brands}
                  type="brand"
                  loading={loading}
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader title="دسته‌بندی‌های در حال رشد" />
              <CardContent>
                <TopItemsTable
                  items={overview?.trending?.categories}
                  type="category"
                  loading={loading}
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader title="برندهای در حال رشد" />
              <CardContent>
                <TopItemsTable
                  items={overview?.trending?.brands}
                  type="brand"
                  loading={loading}
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {tabValue === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardHeader title="دسته‌بندی‌های برتر" />
              <CardContent>
                <TopItemsTable
                  items={categoriesData?.topPerforming}
                  type="category"
                  loading={loading}
                />
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardHeader title="آمار کلی دسته‌بندی‌ها" />
              <CardContent>
                <Box sx={{ textAlign: 'center', mb: 2 }}>
                  <Typography variant="h4" color="primary.main">
                    {categoriesData?.metrics?.totalCategories || 0}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    کل دسته‌بندی‌ها
                  </Typography>
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">نرخ تعامل:</Typography>
                  <Typography variant="body2" color="primary.main">
                    {formatPercentage(categoriesData?.metrics?.avgEngagementRate)}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">کل بازدید:</Typography>
                  <Typography variant="body2">
                    {formatNumber(categoriesData?.metrics?.totalViews)}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">کل کلیک:</Typography>
                  <Typography variant="body2">
                    {formatNumber(categoriesData?.metrics?.totalClicks)}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {tabValue === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardHeader title="برندهای برتر" />
              <CardContent>
                <TopItemsTable
                  items={brandsData?.topPerforming}
                  type="brand"
                  loading={loading}
                />
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardHeader title="آمار کلی برندها" />
              <CardContent>
                <Box sx={{ textAlign: 'center', mb: 2 }}>
                  <Typography variant="h4" color="primary.main">
                    {brandsData?.metrics?.totalBrands || 0}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    کل برندها
                  </Typography>
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">نرخ تعامل:</Typography>
                  <Typography variant="body2" color="primary.main">
                    {formatPercentage(brandsData?.metrics?.avgEngagementRate)}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">کل بازدید:</Typography>
                  <Typography variant="body2">
                    {formatNumber(brandsData?.metrics?.totalViews)}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">کل کلیک:</Typography>
                  <Typography variant="body2">
                    {formatNumber(brandsData?.metrics?.totalClicks)}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default Analytics; 