import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation, Link as RouterLink, Outlet } from 'react-router-dom';
import { adminService } from '../services/admin.service';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  Avatar,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Badge,
  Chip,
  Button,
  Collapse,
  TextField,
  InputAdornment,
  ListSubheader,
  useTheme,
  alpha,
  Menu,
  MenuItem,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Inventory as ProductsIcon,
  ShoppingCart as OrdersIcon,
  People as UsersIcon,
  Category as CategoriesIcon,
  LocalOffer as BrandsIcon,
  Menu as MenuIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Search as SearchIcon,
  ExpandLess,
  ExpandMore,
  Add as AddIcon,
  Analytics as AnalyticsIcon,
  Report as ReportIcon,
  Store as StoreIcon,
} from '@mui/icons-material';
import { logout } from '../store/slices/authSlice';
import { useDirection } from '../contexts/DirectionContext';
import { useDirectionalValue } from '../utils/directionComponentUtils';

const drawerWidth = 280; // Increased width for better navigation

const AdminLayout = () => {
  const theme = useTheme();
  const location = useLocation();
  const isMobile = useTheme().breakpoints.down('md');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { direction } = useDirection();
  const isRTL = direction === 'rtl';
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationAnchor, setNotificationAnchor] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedMenus, setExpandedMenus] = useState({});
  const [dashboardStats, setDashboardStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Get directional values based on current direction
  const drawerAnchor = useDirectionalValue('right', 'left');
  const marginProp = useDirectionalValue('mr', 'ml');
  const marginStartProp = useDirectionalValue('ml', 'mr');

  // Fetch dashboard stats for sidebar counts
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await adminService.getDashboardStats();
        // Set dashboard stats for sidebar counts
        setDashboardStats(response.data || response);
      } catch (error) {
        // Error fetching dashboard stats - using empty state
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationOpen = (event) => {
    setNotificationAnchor(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchor(null);
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
    handleMenuClose();
  };

  const handleExpandMenu = (menuKey) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuKey]: !prev[menuKey]
    }));
  };

  // Dynamic menu items with real data
  const menuItems = [
    { 
      text: 'داشبورد', 
      icon: <DashboardIcon />, 
      path: '/admin',
      category: 'main'
    },
    { 
      text: 'فروشگاه', 
      icon: <StoreIcon />, 
      category: 'store',
      expandable: true,
      subItems: [
        { text: 'محصولات', icon: <ProductsIcon />, path: '/admin/products', badge: dashboardStats?.productCount?.toString() || '0' },
        { text: 'دسته‌بندی‌ها', icon: <CategoriesIcon />, path: '/admin/categories', badge: dashboardStats?.categoryCount?.toString() || '0' },
        { text: 'برندها', icon: <BrandsIcon />, path: '/admin/brands', badge: dashboardStats?.brandCount?.toString() || '0' },
      ]
    },
    { 
      text: 'سفارشات', 
      icon: <OrdersIcon />, 
      path: '/admin/orders',
      badge: dashboardStats?.orderCount?.toString() || '0',
      badgeColor: 'error',
      category: 'orders'
    },
    { 
      text: 'کاربران', 
      icon: <UsersIcon />, 
      path: '/admin/users',
      badge: dashboardStats?.userCount?.toString() || '0',
      category: 'users'
    },
    { 
      text: 'گزارشات', 
      icon: <AnalyticsIcon />, 
      category: 'reports',
      expandable: true,
      subItems: [
        { text: 'آمارها و تحلیل‌ها', icon: <AnalyticsIcon />, path: '/admin/analytics' },
        { text: 'گزارش فروش', icon: <ReportIcon />, path: '/admin/reports/sales' },
        { text: 'گزارش موجودی', icon: <ProductsIcon />, path: '/admin/reports/inventory' },
        { text: 'گزارش کاربران', icon: <UsersIcon />, path: '/admin/reports/users' },
      ]
    },
    { 
      text: 'تنظیمات', 
      icon: <SettingsIcon />, 
      path: '/admin/settings',
      category: 'settings'
    },
  ];

  // Enhanced notifications with more details
  const notifications = [
    { id: 1, text: 'سفارش جدید دریافت شد', read: false, type: 'order', time: '5 دقیقه پیش' },
    { id: 2, text: 'محصول X به اتمام رسیده است', read: false, type: 'inventory', time: '10 دقیقه پیش' },
    { id: 3, text: 'کاربر جدید ثبت نام کرد', read: true, type: 'user', time: '1 ساعت پیش' },
    { id: 4, text: 'پرداخت موفق انجام شد', read: true, type: 'payment', time: '2 ساعت پیش' },
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  // Filter menu items based on search
  const filteredMenuItems = menuItems.filter(item => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    
    // Check main item
    if (item.text.toLowerCase().includes(searchLower)) return true;
    
    // Check sub items
    if (item.subItems) {
      return item.subItems.some(subItem => 
        subItem.text.toLowerCase().includes(searchLower)
      );
    }
    
    return false;
  });

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 3, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, textAlign: 'center' }}>
          پنل مدیریت کارنو
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column', mb: 2 }}>
          <Avatar 
            alt={user?.name || 'Admin'} 
            src={user?.avatar} 
            sx={{ width: 64, height: 64, mb: 1, border: `3px solid ${theme.palette.primary.main}` }}
          />
          <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
            {user?.name || 'مدیر سیستم'}
          </Typography>
          <Chip 
            label="مدیر" 
            size="small" 
            color="primary" 
            variant="outlined"
            sx={{ mt: 0.5 }}
          />
        </Box>
        
        {/* Search */}
        <TextField
          fullWidth
          size="small"
          placeholder="جستجو در منو..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
            sx: { direction: 'rtl' }
          }}
          sx={{ mt: 1 }}
        />
      </Box>

      {/* Navigation */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        <List sx={{ direction: 'rtl', py: 1 }}>
          {filteredMenuItems.map((item) => {
            if (item.expandable) {
              const isExpanded = Boolean(expandedMenus[item.text] || searchTerm);
              return (
                <React.Fragment key={item.text}>
                  <ListSubheader 
                    component="div" 
                    sx={{ 
                      bgcolor: 'transparent', 
                      fontWeight: 'bold',
                      color: theme.palette.text.primary,
                      direction: 'rtl',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.04),
                      }
                    }}
                    onClick={() => handleExpandMenu(item.text)}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {item.icon}
                      {item.text}
                    </Box>
                    {isExpanded ? <ExpandLess /> : <ExpandMore />}
                  </ListSubheader>
                  <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                      {item.subItems?.map((subItem) => {
                        const isActive = location.pathname === subItem.path;
                        return (
                          <ListItem key={subItem.text} disablePadding sx={{ pl: 2 }}>
                            <ListItemButton
                              component={RouterLink}
                              to={subItem.path}
                              onClick={isMobile ? handleDrawerToggle : undefined}
                              selected={isActive}
                              sx={{
                                borderRadius: 1,
                                mx: 1,
                                '&.Mui-selected': {
                                  bgcolor: alpha(theme.palette.primary.main, 0.12),
                                  color: 'primary.main',
                                  '& .MuiListItemIcon-root': {
                                    color: 'primary.main',
                                  },
                                  '&:hover': {
                                    bgcolor: alpha(theme.palette.primary.main, 0.16),
                                  },
                                },
                                '&:hover': {
                                  bgcolor: alpha(theme.palette.primary.main, 0.04),
                                }
                              }}
                            >
                              <ListItemIcon sx={{ minWidth: 36 }}>{subItem.icon}</ListItemIcon>
                              <ListItemText 
                                primary={subItem.text}
                                primaryTypographyProps={{ fontSize: '0.875rem' }}
                              />
                              {subItem.badge && (
                                <Chip 
                                  label={subItem.badge} 
                                  size="small" 
                                  variant="outlined"
                                  sx={{ fontSize: '0.75rem', height: 20 }}
                                />
                              )}
                            </ListItemButton>
                          </ListItem>
                        );
                      })}
                    </List>
                  </Collapse>
                </React.Fragment>
              );
            } else {
              const isActive = location.pathname === item.path;
              return (
                <ListItem key={item.text} disablePadding>
                  <ListItemButton
                    component={RouterLink}
                    to={item.path}
                    onClick={isMobile ? handleDrawerToggle : undefined}
                    selected={isActive}
                    sx={{
                      borderRadius: 1,
                      mx: 1,
                      '&.Mui-selected': {
                        bgcolor: alpha(theme.palette.primary.main, 0.12),
                        color: 'primary.main',
                        '& .MuiListItemIcon-root': {
                          color: 'primary.main',
                        },
                        '&:hover': {
                          bgcolor: alpha(theme.palette.primary.main, 0.16),
                        },
                      },
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.04),
                      }
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.text} />
                    {item.badge && (
                      <Badge 
                        badgeContent={item.badge} 
                        color={item.badgeColor || 'primary'}
                        max={999}
                      />
                    )}
                  </ListItemButton>
                </ListItem>
              );
            }
          })}
        </List>
      </Box>

      {/* Footer */}
      <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
        <ListItem disablePadding>
          <ListItemButton 
            onClick={handleLogout}
            sx={{
              borderRadius: 1,
              color: theme.palette.error.main,
              '&:hover': {
                bgcolor: alpha(theme.palette.error.main, 0.04),
              }
            }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="خروج" />
          </ListItemButton>
        </ListItem>
      </Box>
    </Box>
  );

  // Get current page title
  const getCurrentPageTitle = () => {
    // Check main items
    const currentItem = menuItems.find(item => item.path === location.pathname);
    if (currentItem) return currentItem.text;
    
    // Check sub items
    for (const item of menuItems) {
      if (item.subItems) {
        const subItem = item.subItems.find(sub => sub.path === location.pathname);
        if (subItem) return subItem.text;
      }
    }
    
    return 'پنل مدیریت';
  };

  return (
    <Box sx={{ display: 'flex', direction: isRTL ? 'rtl' : 'ltr' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          [marginProp]: { md: `${drawerWidth}px` },
          bgcolor: 'background.paper',
          color: 'text.primary',
          boxShadow: `0 1px 3px ${alpha(theme.palette.common.black, 0.12)}`,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              color="inherit"
              edge={isRTL ? "end" : "start"}
              onClick={handleDrawerToggle}
              sx={{ [marginStartProp]: 2, display: { md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            
            <Box>
              <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
                {getCurrentPageTitle()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                مدیریت و کنترل سیستم
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Quick Actions */}
            <Tooltip title="افزودن محصول جدید">
              <IconButton 
                color="primary" 
                onClick={() => navigate('/admin/products')}
                sx={{ 
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) }
                }}
              >
                <AddIcon />
              </IconButton>
            </Tooltip>

            {/* Notifications */}
            <Tooltip title="اعلان‌ها">
              <IconButton onClick={handleNotificationOpen}>
                <Badge badgeContent={unreadCount} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* Profile Menu */}
            <Tooltip title="پروفایل کاربری">
              <IconButton onClick={handleMenuOpen}>
                <Avatar 
                  alt={user?.name || 'Admin'} 
                  src={user?.avatar}
                  sx={{ width: 32, height: 32 }}
                />
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Navigation Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          anchor={drawerAnchor}
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              borderRight: 'none',
              boxShadow: theme.shadows[8]
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              borderRight: 'none',
              borderLeft: `1px solid ${theme.palette.divider}`,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          bgcolor: alpha(theme.palette.grey[50], 0.4),
        }}
      >
        <Toolbar />
        <Box sx={{ p: 3 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
              <CircularProgress />
            </Box>
          ) : (
            <Outlet />
          )}
        </Box>
      </Box>

      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          پروفایل
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          تنظیمات
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" color="error" />
          </ListItemIcon>
          خروج
        </MenuItem>
      </Menu>

      {/* Notifications Menu */}
      <Menu
        anchorEl={notificationAnchor}
        open={Boolean(notificationAnchor)}
        onClose={handleNotificationClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: { width: 320, maxHeight: 400 }
        }}
      >
        <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            اعلان‌ها
          </Typography>
        </Box>
        {notifications.map((notification) => (
          <MenuItem 
            key={notification.id} 
            onClick={handleNotificationClose}
            sx={{ 
              py: 1.5,
              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
              '&:last-child': { borderBottom: 'none' }
            }}
          >
            <Box sx={{ width: '100%' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: notification.read ? 'normal' : 'bold',
                    direction: 'rtl'
                  }}
                >
                  {notification.text}
                </Typography>
                {!notification.read && (
                  <Box 
                    sx={{ 
                      width: 8, 
                      height: 8, 
                      borderRadius: '50%', 
                      bgcolor: 'error.main',
                      ml: 1,
                      mt: 0.5
                    }} 
                  />
                )}
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ direction: 'rtl' }}>
                {notification.time}
              </Typography>
            </Box>
          </MenuItem>
        ))}
        <Box sx={{ p: 1 }}>
          <Button fullWidth size="small">
            مشاهده همه اعلان‌ها
          </Button>
        </Box>
      </Menu>
    </Box>
  );
};

export default AdminLayout;
