import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Fab,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  useTheme,
  useMediaQuery,
  Box,
} from '@mui/material';
import {
  ShoppingCart as CartIcon,
  Phone as PhoneIcon,
  WhatsApp as WhatsAppIcon,
  Search as SearchIcon,
  Category as CategoryIcon,
  Close as CloseIcon,
  Menu as MenuIcon,
} from '@mui/icons-material';

const QuickActionsMenu = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const cartQuantity = useSelector((state) => state.cart.quantity);

  // Don't show on desktop
  if (!isMobile) return null;

  const actions = [
    {
      icon: <CartIcon />,
      name: `سبد خرید ${cartQuantity > 0 ? `(${cartQuantity})` : ''}`,
      action: () => navigate('/cart'),
      color: 'primary',
    },
    {
      icon: <SearchIcon />,
      name: 'جستجو محصولات',
      action: () => navigate('/products'),
      color: 'secondary',
    },
    {
      icon: <CategoryIcon />,
      name: 'دسته‌بندی‌ها',
      action: () => navigate('/categories'),
      color: 'info',
    },
    {
      icon: <WhatsAppIcon />,
      name: 'واتساپ',
      action: () => window.open('https://wa.me/989123456789', '_blank'),
      color: 'success',
    },
    {
      icon: <PhoneIcon />,
      name: 'تماس با ما',
      action: () => window.open('tel:02123456789'),
      color: 'warning',
    },
  ];

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 90, // Above mobile bottom navigation
        left: 16,
        zIndex: 1200,
      }}
    >
      <SpeedDial
        ariaLabel="منوی سریع"
        sx={{
          '& .MuiFab-primary': {
            width: 56,
            height: 56,
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
            '&:hover': {
              background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
              transform: 'scale(1.1)',
            },
          },
          '& .MuiSpeedDialAction-fab': {
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
            '&:hover': {
              transform: 'scale(1.1)',
            },
          },
        }}
        icon={
          <SpeedDialIcon
            icon={<MenuIcon />}
            openIcon={<CloseIcon />}
            sx={{
              '& .MuiSpeedDialIcon-icon': {
                fontSize: '1.5rem',
              },
            }}
          />
        }
        onClose={handleClose}
        onOpen={handleOpen}
        open={open}
        direction="up"
        FabProps={{
          color: 'primary',
          size: 'large',
        }}
      >
        {actions.map((action, index) => (
          <SpeedDialAction
            key={index}
            icon={action.icon}
            tooltipTitle={action.name}
            tooltipPlacement="right"
            onClick={() => {
              action.action();
              handleClose();
            }}
            FabProps={{
              color: action.color,
              size: 'medium',
            }}
            sx={{
              '& .MuiSpeedDialAction-staticTooltip': {
                whiteSpace: 'nowrap',
                backgroundColor: 'background.paper',
                color: 'text.primary',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
                borderRadius: 2,
                fontFamily: 'Vazirmatn',
                fontSize: '0.875rem',
              },
            }}
          />
        ))}
      </SpeedDial>
    </Box>
  );
};

export default QuickActionsMenu; 