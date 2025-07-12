import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Box, Container, useTheme, useMediaQuery } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '../components/Header';
import Footer from '../components/Footer';
import CartAuthNotification from '../components/CartAuthNotification';
import MobileBottomNavigation from '../components/MobileBottomNavigation';
import QuickActionsMenu from '../components/QuickActionsMenu';

const MainLayout = () => {
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Fixed RTL animations (right-to-left)
  const initialAnimation = {
    opacity: 0,
    x: -20,
    y: 20,
  };
  
  const exitAnimation = {
    opacity: 0,
    x: 20,
    y: -20,
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        bgcolor: 'background.default',
      }}
    >
      <Header />
      <Container
        component="main"
        maxWidth="lg"
        sx={{
          flexGrow: 1,
          py: { xs: 4, md: 6 },
          px: { xs: 2, sm: 3, md: 4 },
          pb: isMobile ? { xs: 10, sm: 10 } : { xs: 4, md: 6 }, // Add bottom padding for mobile nav
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={initialAnimation}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={exitAnimation}
            transition={{ duration: 0.3 }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </Container>
      <Footer />
      <CartAuthNotification />
      <MobileBottomNavigation />
      <QuickActionsMenu />
    </Box>
  );
};

export default MainLayout;
