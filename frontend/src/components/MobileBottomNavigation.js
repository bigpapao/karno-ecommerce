import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  Badge,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Home as HomeIcon,
  Category as CategoryIcon,
  ShoppingCart as CartIcon,
  Person as PersonIcon,
  Search as SearchIcon,
} from '@mui/icons-material';

const MobileBottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Get cart quantity from Redux store
  const cartQuantity = useSelector((state) => state.cart.quantity);
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  // Don't show on desktop
  if (!isMobile) return null;

  // Don't show on certain pages
  const hideOnPages = ['/checkout', '/login', '/register'];
  if (hideOnPages.includes(location.pathname)) return null;

  const getValueFromPath = (pathname) => {
    if (pathname === '/') return 0;
    if (pathname.startsWith('/products') || pathname.startsWith('/search')) return 1;
    if (pathname.startsWith('/categories')) return 2;
    if (pathname.startsWith('/cart')) return 3;
    if (pathname.startsWith('/profile') || pathname.startsWith('/login')) return 4;
    return 0;
  };

  const handleNavigation = (event, newValue) => {
    switch (newValue) {
      case 0:
        navigate('/');
        break;
      case 1:
        navigate('/products');
        break;
      case 2:
        navigate('/categories');
        break;
      case 3:
        navigate('/cart');
        break;
      case 4:
        if (isAuthenticated) {
          navigate('/profile');
        } else {
          navigate('/login');
        }
        break;
      default:
        navigate('/');
    }
  };

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1300,
        borderRadius: '16px 16px 0 0',
        backgroundColor: 'background.paper',
        boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.1)',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: -1,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 40,
          height: 4,
          backgroundColor: 'divider',
          borderRadius: 2,
        },
      }}
      elevation={0}
    >
      <BottomNavigation
        value={getValueFromPath(location.pathname)}
        onChange={handleNavigation}
        sx={{
          height: 70,
          borderRadius: '16px 16px 0 0',
          '& .MuiBottomNavigationAction-root': {
            minWidth: 'auto',
            padding: '8px 12px',
            '&.Mui-selected': {
              color: 'primary.main',
            },
          },
        }}
      >
        <BottomNavigationAction
          label="خانه"
          icon={<HomeIcon />}
          sx={{
            '& .MuiBottomNavigationAction-label': {
              fontSize: '0.75rem',
              fontFamily: 'Vazirmatn',
            },
          }}
        />
        <BottomNavigationAction
          label="جستجو"
          icon={<SearchIcon />}
          sx={{
            '& .MuiBottomNavigationAction-label': {
              fontSize: '0.75rem',
              fontFamily: 'Vazirmatn',
            },
          }}
        />
        <BottomNavigationAction
          label="دسته‌ها"
          icon={<CategoryIcon />}
          sx={{
            '& .MuiBottomNavigationAction-label': {
              fontSize: '0.75rem',
              fontFamily: 'Vazirmatn',
            },
          }}
        />
        <BottomNavigationAction
          label="سبد خرید"
          icon={
            <Badge badgeContent={cartQuantity} color="error" max={99}>
              <CartIcon />
            </Badge>
          }
          sx={{
            '& .MuiBottomNavigationAction-label': {
              fontSize: '0.75rem',
              fontFamily: 'Vazirmatn',
            },
          }}
        />
        <BottomNavigationAction
          label={isAuthenticated ? "پروفایل" : "ورود"}
          icon={<PersonIcon />}
          sx={{
            '& .MuiBottomNavigationAction-label': {
              fontSize: '0.75rem',
              fontFamily: 'Vazirmatn',
            },
          }}
        />
      </BottomNavigation>
    </Paper>
  );
};

export default MobileBottomNavigation; 