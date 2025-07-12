import React, { useState, useEffect } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Badge,
  Box,
  Container,
  useTheme,
  useMediaQuery,
  Stack,
  alpha,
  Avatar,
  Tooltip,
  Menu,
  MenuItem,
  Divider,
  ListItemIcon,
  ListItemText,
  Popper,
  Paper,
  Fade,
} from '@mui/material';
import {
  ShoppingCart as CartIcon,
  Person as PersonIcon,
  Menu as MenuIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  Logout as LogoutIcon,
  AccountCircle as ProfileIcon,
  Dashboard as DashboardIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { toggleMobileMenu, toggleSearch } from '../store/slices/uiSlice';
import { logoutUser } from '../store/slices/authSlice';
import MobileMenu from './MobileMenu';
import SearchBar from './SearchBar';
import EnhancedSearchBar from './EnhancedSearchBar';
import { toPersianNumber } from '../utils/persianUtils';
import { useDirection } from '../contexts/DirectionContext';

// Floating particles animation component
const FloatingParticles = () => {
  const particles = Array.from({ length: 6 }, (_, i) => ({
    id: i,
    size: Math.random() * 4 + 2,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: Math.random() * 20 + 15,
    delay: Math.random() * 5,
  }));

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          style={{
            position: 'absolute',
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.3)',
            filter: 'blur(1px)',
          }}
          animate={{
            y: [-20, 20, -20],
            x: [-10, 10, -10],
            opacity: [0.3, 0.7, 0.3],
            scale: [0.8, 1.2, 0.8],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
    </Box>
  );
};

// Enhanced logo component with animations
const AnimatedLogo = ({ scrollY }) => {
  const logoScale = useTransform(scrollY, [0, 100], [1, 0.8]);
  const logoOpacity = useTransform(scrollY, [0, 50], [1, 0.9]);

  return (
    <motion.div
      style={{
        scale: logoScale,
        opacity: logoOpacity,
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Box
        component={RouterLink}
        to="/"
        sx={{
          display: 'flex',
          alignItems: 'center',
          textDecoration: 'none',
          color: 'inherit',
          gap: 2,
          position: 'relative',
        }}
      >
        <motion.div
          initial={{ rotate: 0 }}
          whileHover={{ rotate: 360 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
        >
          <Avatar
            src="/images/logo/Karno.png"
            alt="کارنو"
            sx={{
              width: { xs: 40, md: 48 },
              height: { xs: 40, md: 48 },
              bgcolor: 'rgba(255, 255, 255, 0.1)',
              border: '2px solid rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s ease',
              '&:hover': {
                border: '2px solid rgba(255, 255, 255, 0.4)',
                boxShadow: '0 8px 32px rgba(255, 255, 255, 0.2)',
              },
            }}
          />
        </motion.div>
        <Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 800,
              fontSize: { xs: '1.2rem', md: '1.5rem' },
              background: 'linear-gradient(45deg, #ffffff 30%, #e3f2fd 90%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 2px 4px rgba(0,0,0,0.1)',
              letterSpacing: '0.5px',
            }}
          >
            کارنو
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '0.7rem',
              fontWeight: 400,
              display: { xs: 'none', sm: 'block' },
            }}
          >
            قطعات خودرو
          </Typography>
        </Box>
      </Box>
    </motion.div>
  );
};

// Enhanced navigation button with better hover effects and spacing
const NavButton = ({ to, children, isActive, onClick }) => (
  <motion.div
    whileHover={{ scale: 1.05, y: -2 }}
    whileTap={{ scale: 0.95 }}
    transition={{ duration: 0.2, ease: "easeInOut" }}
  >
    <Button
      component={to ? RouterLink : 'button'}
      to={to}
      onClick={onClick}
      sx={{
        color: 'white',
        position: 'relative',
        px: { xs: 2, md: 3 },
        py: { xs: 1, md: 1.5 },
        mx: { xs: 0.5, md: 1 },
        borderRadius: 2.5,
        fontWeight: isActive ? 700 : 500,
        fontSize: { xs: '0.875rem', md: '0.95rem' },
        background: isActive 
          ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.15) 100%)'
          : 'transparent',
        backdropFilter: isActive ? 'blur(10px)' : 'none',
        border: `1px solid ${isActive ? 'rgba(255, 255, 255, 0.3)' : 'transparent'}`,
        boxShadow: isActive 
          ? '0 8px 32px rgba(255, 255, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
          : 'none',
        textTransform: 'none',
        minWidth: 'auto',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
        '&:hover': {
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.1) 100%)',
          backdropFilter: 'blur(15px)',
          border: '1px solid rgba(255, 255, 255, 0.4)',
          boxShadow: '0 12px 40px rgba(255, 255, 255, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
          transform: 'translateY(-3px)',
          '&::before': {
            transform: 'translateX(100%)',
          },
          '&::after': {
            opacity: 1,
            transform: 'scale(1)',
          },
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: '-100%',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)',
          transition: 'transform 0.6s ease',
          zIndex: 1,
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          bottom: 0,
          left: '50%',
          width: isActive ? '80%' : '0%',
          height: '2px',
          background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.8), transparent)',
          transform: 'translateX(-50%)',
          borderRadius: '1px',
          opacity: isActive ? 1 : 0,
          transition: 'all 0.3s ease',
          zIndex: 2,
        },
      }}
    >
      <Box component="span" sx={{ position: 'relative', zIndex: 3 }}>
        {children}
      </Box>
    </Button>
  </motion.div>
);

// Enhanced icon button with improved visual effects
const IconBtn = ({ to, children, badge, onClick, tooltip }) => (
  <Tooltip title={tooltip} arrow>
    <motion.div
      whileHover={{ scale: 1.1, rotate: 3 }}
      whileTap={{ scale: 0.9 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
    >
      <IconButton
        component={to ? RouterLink : 'button'}
        to={to}
        onClick={onClick}
        sx={{
          color: 'white',
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.08) 100%)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: 2.5,
          width: { xs: 48, md: 52 },
          height: { xs: 48, md: 52 },
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          '&:hover': {
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.15) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.4)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15), inset 0 2px 0 rgba(255, 255, 255, 0.2)',
            transform: 'translateY(-4px)',
            '&::before': {
              transform: 'scale(1.2)',
              opacity: 0.6,
            },
          },
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '100%',
            height: '100%',
            background: 'radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 70%)',
            transform: 'translate(-50%, -50%) scale(0)',
            transition: 'all 0.4s ease',
            borderRadius: '50%',
            opacity: 0,
          },
        }}
      >
        {badge > 0 ? (
          <Badge
            badgeContent={badge}
            sx={{
              '& .MuiBadge-badge': {
                background: 'linear-gradient(135deg, #ff4757 0%, #ff3838 100%)',
                color: 'white',
                fontWeight: 700,
                fontSize: '0.75rem',
                minWidth: 22,
                height: 22,
                border: '2px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0 4px 12px rgba(255, 71, 87, 0.4)',
                animation: badge > 0 ? 'pulse 2s infinite' : 'none',
              },
              '@keyframes pulse': {
                '0%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(255, 71, 87, 0.7)' },
                '70%': { transform: 'scale(1.05)', boxShadow: '0 0 0 10px rgba(255, 71, 87, 0)' },
                '100%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(255, 71, 87, 0)' },
              },
            }}
          >
            {children}
          </Badge>
        ) : (
          children
        )}
      </IconButton>
    </motion.div>
  </Tooltip>
);

// User menu component
const UserMenu = ({ 
  user, 
  anchorEl, 
  onClose, 
  onLogout, 
  isRTL 
}) => {
  const getUserDisplayName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user?.email || user?.phone || 'کاربر';
  };

  return (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={onClose}
      onClick={onClose}
      PaperProps={{
        elevation: 8,
        sx: {
          overflow: 'visible',
          filter: 'drop-shadow(0px 4px 20px rgba(0,0,0,0.15))',
          mt: 1.5,
          borderRadius: 2,
          minWidth: 200,
          background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(240,248,255,0.95) 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.3)',
          '&:before': {
            content: '""',
            display: 'block',
            position: 'absolute',
            top: 0,
            right: isRTL ? 20 : 'auto',
            left: isRTL ? 'auto' : 20,
            width: 10,
            height: 10,
            bgcolor: 'background.paper',
            transform: 'translateY(-50%) rotate(45deg)',
            zIndex: 0,
          },
        },
      }}
      transformOrigin={{ horizontal: isRTL ? 'left' : 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: isRTL ? 'left' : 'right', vertical: 'bottom' }}
    >
      <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'primary.main' }}>
          {getUserDisplayName()}
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {user?.email || user?.phone}
        </Typography>
      </Box>
      
      <MenuItem 
        component={RouterLink} 
        to="/profile"
        sx={{ 
          py: 1.5, 
          '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.1)' } 
        }}
      >
        <ListItemIcon>
          <ProfileIcon fontSize="small" color="primary" />
        </ListItemIcon>
        <ListItemText primary="پروفایل کاربری" />
      </MenuItem>
      
      <MenuItem 
        component={RouterLink} 
        to="/orders"
        sx={{ 
          py: 1.5, 
          '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.1)' } 
        }}
      >
        <ListItemIcon>
          <DashboardIcon fontSize="small" color="primary" />
        </ListItemIcon>
        <ListItemText primary="سفارش‌های من" />
      </MenuItem>
      
      <Divider sx={{ my: 0.5 }} />
      
      <MenuItem 
        onClick={onLogout}
        sx={{ 
          py: 1.5, 
          color: 'error.main',
          '&:hover': { backgroundColor: 'rgba(211, 47, 47, 0.1)' } 
        }}
      >
        <ListItemIcon>
          <LogoutIcon fontSize="small" color="error" />
        </ListItemIcon>
        <ListItemText primary="خروج از حساب" />
      </MenuItem>
    </Menu>
  );
};

// Enhanced Cart Button with better hover effects
const EnhancedCartButton = ({ cartQuantity, cartItems, isRTL }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = (event) => {
    if (cartQuantity > 0) {
      setAnchorEl(event.currentTarget);
      setIsHovered(true);
    }
  };

  const handleMouseLeave = () => {
    setAnchorEl(null);
    setIsHovered(false);
  };

  return (
    <>
      <Tooltip title={`سبد خرید (${toPersianNumber(cartQuantity)} کالا)`} arrow>
        <motion.div
          whileHover={{ scale: 1.1, y: -3 }}
          whileTap={{ scale: 0.95 }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          transition={{ duration: 0.2, ease: "easeInOut" }}
        >
          <IconButton
            component={RouterLink}
            to="/cart"
            sx={{
              color: 'white',
              background: cartQuantity > 0 
                ? 'linear-gradient(135deg, rgba(76, 175, 80, 0.3) 0%, rgba(102, 187, 106, 0.2) 100%)'
                : 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.08) 100%)',
              backdropFilter: 'blur(15px)',
              border: cartQuantity > 0 
                ? '1px solid rgba(76, 175, 80, 0.4)' 
                : '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: 3,
              width: { xs: 50, md: 56 },
              height: { xs: 50, md: 56 },
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: cartQuantity > 0
                ? '0 8px 25px rgba(76, 175, 80, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                : '0 4px 20px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
              '&:hover': {
                background: cartQuantity > 0 
                  ? 'linear-gradient(135deg, rgba(76, 175, 80, 0.4) 0%, rgba(102, 187, 106, 0.3) 100%)'
                  : 'linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.15) 100%)',
                backdropFilter: 'blur(20px)',
                border: cartQuantity > 0 
                  ? '1px solid rgba(76, 175, 80, 0.6)' 
                  : '1px solid rgba(255, 255, 255, 0.4)',
                boxShadow: cartQuantity > 0
                  ? '0 12px 40px rgba(76, 175, 80, 0.3), inset 0 2px 0 rgba(255, 255, 255, 0.3)'
                  : '0 8px 32px rgba(0, 0, 0, 0.15), inset 0 2px 0 rgba(255, 255, 255, 0.2)',
                transform: 'translateY(-4px)',
                '&::before': {
                  left: '100%',
                },
                '&::after': {
                  transform: 'scale(1.2)',
                  opacity: 0.8,
                },
              },
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: '-100%',
                width: '100%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                transition: 'left 0.6s ease',
              },
              '&::after': {
                content: '""',
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: '30px',
                height: '30px',
                background: 'radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 70%)',
                transform: 'translate(-50%, -50%) scale(0)',
                transition: 'all 0.4s ease',
                borderRadius: '50%',
                opacity: 0,
              },
            }}
          >
            <Badge
              badgeContent={cartQuantity}
              sx={{
                '& .MuiBadge-badge': {
                  background: 'linear-gradient(135deg, #ff4757 0%, #ff3838 100%)',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  minWidth: 24,
                  height: 24,
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: '0 4px 12px rgba(255, 71, 87, 0.4)',
                  animation: cartQuantity > 0 ? 'cartPulse 2s infinite' : 'none',
                },
                '@keyframes cartPulse': {
                  '0%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(255, 71, 87, 0.7)' },
                  '70%': { transform: 'scale(1.05)', boxShadow: '0 0 0 10px rgba(255, 71, 87, 0)' },
                  '100%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(255, 71, 87, 0)' },
                },
              }}
            >
              <CartIcon 
                sx={{ 
                  fontSize: { xs: '1.3rem', md: '1.5rem' },
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                }} 
              />
            </Badge>
          </IconButton>
        </motion.div>
      </Tooltip>
    </>
  );
};

// Enhanced User Button with better login/profile indication
const EnhancedUserButton = ({ 
  isAuthenticated, 
  user, 
  userMenuAnchor, 
  onUserMenuOpen, 
  onUserMenuClose, 
  onLogout, 
  isRTL 
}) => {
  return (
    <>
      <Tooltip title={isAuthenticated ? `${user?.firstName || 'کاربر'} - کلیک کنید` : 'ورود / ثبت نام'} arrow>
        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <IconButton
            component={isAuthenticated ? 'button' : RouterLink}
            to={isAuthenticated ? undefined : '/login'}
            onClick={isAuthenticated ? onUserMenuOpen : undefined}
            sx={{
              color: 'white',
              background: isAuthenticated ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255, 193, 7, 0.2)',
              backdropFilter: 'blur(10px)',
              border: isAuthenticated ? '1px solid rgba(76, 175, 80, 0.3)' : '1px solid rgba(255, 193, 7, 0.3)',
              borderRadius: 2,
              width: { xs: 45, md: 50 },
              height: { xs: 45, md: 50 },
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.3s ease',
              '&:hover': {
                background: isAuthenticated ? 'rgba(76, 175, 80, 0.3)' : 'rgba(255, 193, 7, 0.3)',
                backdropFilter: 'blur(15px)',
                border: isAuthenticated ? '1px solid rgba(76, 175, 80, 0.5)' : '1px solid rgba(255, 193, 7, 0.5)',
                boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
                transform: 'translateY(-2px)',
              },
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: '-100%',
                width: '100%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                transition: 'left 0.5s ease',
              },
              '&:hover::before': {
                left: '100%',
              },
            }}
          >
            {isAuthenticated ? (
              <Badge
                variant="dot"
                sx={{
                  '& .MuiBadge-badge': {
                    backgroundColor: '#4caf50',
                    color: '#4caf50',
                    boxShadow: '0 0 0 2px white',
                    '&::after': {
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      borderRadius: '50%',
                      animation: 'ripple 1.2s infinite ease-in-out',
                      border: '1px solid currentColor',
                      content: '""',
                    },
                  },
                  '@keyframes ripple': {
                    '0%': { transform: 'scale(.8)', opacity: 1 },
                    '100%': { transform: 'scale(2.4)', opacity: 0 },
                  },
                }}
              >
                <PersonIcon className={isRTL ? "flip-horizontal" : "no-flip"} />
              </Badge>
            ) : (
              <PersonIcon className={isRTL ? "flip-horizontal" : "no-flip"} />
            )}
          </IconButton>
        </motion.div>
      </Tooltip>

      {/* Enhanced User Menu */}
      {isAuthenticated && (
        <UserMenu
          user={user}
          anchorEl={userMenuAnchor}
          onClose={onUserMenuClose}
          onLogout={onLogout}
          isRTL={isRTL}
        />
      )}
    </>
  );
};

const Header = () => {
  const theme = useTheme();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { quantity: cartQuantity } = useSelector((state) => state.cart);
  const { searchOpen } = useSelector((state) => state.ui);
  const { isRTL } = useDirection();

  const [headerBg, setHeaderBg] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  const { scrollY } = useScroll();

  // Dynamic header background based on scroll
  useEffect(() => {
    const unsubscribe = scrollY.on("change", (latest) => {
      setHeaderBg(latest > 100);
    });
    return unsubscribe;
  }, [scrollY]);

  // Icon flip class based on direction
  const iconClass = isRTL ? "flip-horizontal" : "no-flip";

  // Check if current route is active
  const isActiveRoute = (path) => location.pathname === path;

  // User menu handlers
  const handleUserMenuOpen = (event) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      handleUserMenuClose();
    } catch (error) {
      // Handle logout error silently or show user-friendly message
    }
  };

  const headerTransform = useTransform(scrollY, [0, 100], [0, -20]);
  const headerOpacity = useTransform(scrollY, [0, 50], [1, 0.95]);

  return (
    <>
      <motion.div
        style={{
          y: headerTransform,
          opacity: headerOpacity,
        }}
      >
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            background: headerBg
              ? 'rgba(25, 118, 210, 0.85)'
              : 'linear-gradient(135deg, rgba(25, 118, 210, 0.95) 0%, rgba(100, 181, 246, 0.9) 100%)',
            backdropFilter: 'blur(20px)',
            borderBottom: `1px solid ${alpha(theme.palette.common.white, 0.1)}`,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            overflow: 'visible',
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.03"%3E%3Ccircle cx="30" cy="30" r="1"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E") repeat',
              opacity: headerBg ? 0.5 : 1,
              transition: 'opacity 0.3s ease',
            },
          }}
        >
          <FloatingParticles />
          <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, overflow: 'visible' }}>
            <Toolbar
              disableGutters
              sx={{
                minHeight: { xs: 70, md: 85 },
                py: { xs: 1.5, md: 2 },
                px: { xs: 1, md: 0 },
                gap: { xs: 1, md: 2 },
              }}
            >
              {isMobile && (
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <IconBtn
                    onClick={() => dispatch(toggleMobileMenu())}
                    tooltip="منوی اصلی"
                  >
                    <MenuIcon className={iconClass} />
                  </IconBtn>
                </motion.div>
              )}

              <Box sx={{ 
                flexGrow: { xs: 1, md: 0 }, 
                ml: { xs: 0, md: 3 },
                mr: { xs: 0, md: 2 }
              }}>
                <AnimatedLogo scrollY={scrollY} />
              </Box>

              {!isMobile ? (
                <>
                  <Box sx={{ 
                    flexGrow: 1, 
                    mx: { xs: 2, md: 4, lg: 6 }, 
                    maxWidth: { xs: 400, md: 600, lg: 700 },
                    minWidth: { md: 300 }
                  }}>
                    <motion.div
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <SearchBar />
                    </motion.div>
                  </Box>

                  <Stack 
                    direction="row" 
                    spacing={{ xs: 0.5, md: 1 }} 
                    sx={{ 
                      mr: { xs: 1, md: 3 },
                      alignItems: 'center'
                    }}
                  >
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <NavButton 
                        to="/brands" 
                        isActive={isActiveRoute('/brands')}
                      >
                        برندها
                      </NavButton>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <NavButton 
                        to="/models" 
                        isActive={isActiveRoute('/models')}
                      >
                        مدل‌های خودرو
                      </NavButton>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 }}
                    >
                      <NavButton 
                        to="/products" 
                        isActive={isActiveRoute('/products')}
                      >
                        محصولات
                      </NavButton>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 }}
                    >
                      <NavButton 
                        to="/contact" 
                        isActive={isActiveRoute('/contact')}
                      >
                        تماس با ما
                      </NavButton>
                    </motion.div>
                  </Stack>

                  <Stack 
                    direction="row" 
                    spacing={{ xs: 1.5, md: 2 }} 
                    sx={{ 
                      ml: { xs: 2, md: 4 },
                      alignItems: 'center'
                    }}
                  >
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.7, type: 'spring' }}
                    >
                      <EnhancedCartButton
                        cartQuantity={cartQuantity}
                        cartItems={[]}
                        isRTL={isRTL}
                      />
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.8, type: 'spring' }}
                    >
                      <EnhancedUserButton
                        isAuthenticated={isAuthenticated}
                        user={user}
                        userMenuAnchor={userMenuAnchor}
                        onUserMenuOpen={handleUserMenuOpen}
                        onUserMenuClose={handleUserMenuClose}
                        onLogout={handleLogout}
                        isRTL={isRTL}
                      />
                    </motion.div>
                  </Stack>
                </>
              ) : (
                <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3, type: 'spring' }}
                  >
                    <IconBtn
                      onClick={() => dispatch(toggleSearch())}
                      tooltip="جستجو"
                    >
                      {searchOpen ? (
                        <CloseIcon className={iconClass} />
                      ) : (
                        <SearchIcon className={iconClass} />
                      )}
                    </IconBtn>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4, type: 'spring' }}
                  >
                    <EnhancedCartButton
                      cartQuantity={cartQuantity}
                      cartItems={[]}
                      isRTL={isRTL}
                    />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5, type: 'spring' }}
                  >
                    <EnhancedUserButton
                      isAuthenticated={isAuthenticated}
                      user={user}
                      userMenuAnchor={userMenuAnchor}
                      onUserMenuOpen={handleUserMenuOpen}
                      onUserMenuClose={handleUserMenuClose}
                      onLogout={handleLogout}
                      isRTL={isRTL}
                    />
                  </motion.div>
                </Stack>
              )}
            </Toolbar>
          </Container>
        </AppBar>
      </motion.div>

      {/* User Menu */}
      <UserMenu
        user={user}
        anchorEl={userMenuAnchor}
        onClose={handleUserMenuClose}
        onLogout={handleLogout}
        isRTL={isRTL}
      />

      {/* Mobile Search Overlay */}
      <AnimatePresence>
        {isMobile && searchOpen && (
          <motion.div
            initial={{ opacity: 0, y: -100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -100 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              zIndex: 1300,
              background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.95) 0%, rgba(100, 181, 246, 0.9) 100%)',
              backdropFilter: 'blur(20px)',
              padding: '70px 16px 16px',
            }}
          >
            <EnhancedSearchBar onClose={() => dispatch(toggleSearch())} fullWidth />
          </motion.div>
        )}
      </AnimatePresence>

      <MobileMenu />
    </>
  );
};

export default Header;
