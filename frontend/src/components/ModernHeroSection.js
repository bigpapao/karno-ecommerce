import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  TextField,
  InputAdornment,
  useTheme,
  Paper,
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import { motion, useInView, useAnimation } from 'framer-motion';
import {
  Search as SearchIcon,
  Verified as VerifiedIcon,
  Speed as SpeedIcon,
  Star as StarIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';

const ModernHeroSection = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const controls = useAnimation();

  useEffect(() => {
    if (isInView) {
      controls.start('visible');
    }
  }, [isInView, controls]);

  // Iranian car brands with modern gradient styling
  const carBrands = [
    {
      name: 'ایران خودرو',
      nameEn: 'Iran Khodro',
      color: '#0066cc',
      gradient: 'linear-gradient(135deg, #0066cc 0%, #0099ff 100%)',
      icon: '🚗',
      description: 'بزرگترین خودروساز ایران',
    },
    {
      name: 'سایپا',
      nameEn: 'Saipa',
      color: '#e74c3c',
      gradient: 'linear-gradient(135deg, #e74c3c 0%, #ff6b6b 100%)',
      icon: '🚙',
      description: 'خودروساز پیشرو',
    },
    {
      name: 'بهمن موتور',
      nameEn: 'Bahman Motor',
      color: '#8e44ad',
      gradient: 'linear-gradient(135deg, #8e44ad 0%, #b56ce0 100%)',
      icon: '🚐',
      description: 'تولید خودروهای تجاری',
    },
    {
      name: 'ام وی ام',
      nameEn: 'MVM',
      color: '#27ae60',
      gradient: 'linear-gradient(135deg, #27ae60 0%, #4ecdc4 100%)',
      icon: '🚗',
      description: 'فناوری پیشرفته',
    },
  ];

  // Feature badges with icons
  const features = [
    {
      icon: VerifiedIcon,
      text: 'قطعات اصل',
      description: 'Genuine Parts',
      color: '#4285f4',
    },
    {
      icon: StarIcon,
      text: 'کیفیت تضمینی',
      description: 'Guaranteed Quality',
      color: '#34a853',
    },
    {
      icon: SpeedIcon,
      text: 'ارسال سریع',
      description: 'Fast Shipping',
      color: '#ea4335',
    },
  ];

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate('/products');
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.4, 0, 0.2, 1],
      },
    },
  };

  const brandCardVariants = {
    hidden: { opacity: 0, scale: 0.8, x: -50 },
    visible: {
      opacity: 1,
      scale: 1,
      x: 0,
      transition: {
        duration: 0.5,
        ease: [0.4, 0, 0.2, 1],
      },
    },
  };

  return (
    <Box
      ref={ref}
      sx={{
        background: `linear-gradient(135deg, 
          ${theme.palette.background.default} 0%, 
          #f8fafc 25%, 
          #f1f5f9 50%, 
          #e2e8f0 75%, 
          ${theme.palette.grey[50]} 100%)`,
        minHeight: '90vh',
        py: { xs: 4, md: 8 },
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `radial-gradient(circle at 20% 80%, ${theme.palette.primary.main}08 0%, transparent 50%),
                      radial-gradient(circle at 80% 20%, ${theme.palette.secondary.main}08 0%, transparent 50%)`,
          zIndex: 1,
        },
      }}
    >
      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 2 }}>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={controls}
        >
          <Grid container spacing={6} alignItems="center">
            {/* Left Side - Car Brands */}
            <Grid item xs={12} lg={4}>
              <motion.div variants={itemVariants}>
                <Typography
                  variant="h5"
                  sx={{
                    mb: 3,
                    fontWeight: 600,
                    color: theme.palette.text.primary,
                    direction: 'rtl',
                  }}
                >
                  برندهای معتبر ایرانی
                </Typography>
              </motion.div>

              <Grid container spacing={2}>
                {carBrands.map((brand, index) => (
                  <Grid item xs={6} key={index}>
                    <motion.div
                      variants={brandCardVariants}
                      whileHover={{
                        scale: 1.05,
                        y: -5,
                        transition: { duration: 0.2 },
                      }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Card
                        onClick={() => navigate(`/brands/${brand.nameEn.toLowerCase()}`)}
                        sx={{
                          background: brand.gradient,
                          color: 'white',
                          cursor: 'pointer',
                          borderRadius: 3,
                          overflow: 'hidden',
                          position: 'relative',
                          height: { xs: 120, md: 140 },
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                          '&:hover': {
                            boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
                          },
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'linear-gradient(45deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)',
                            zIndex: 1,
                          },
                        }}
                      >
                        <CardContent
                          sx={{
                            position: 'relative',
                            zIndex: 2,
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            textAlign: 'center',
                            p: 2,
                          }}
                        >
                          <Typography
                            variant="h2"
                            sx={{ mb: 1, fontSize: '2rem' }}
                          >
                            {brand.icon}
                          </Typography>
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: 700,
                              mb: 0.5,
                              fontSize: { xs: '0.9rem', md: '1rem' },
                              direction: 'rtl',
                            }}
                          >
                            {brand.name}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              opacity: 0.9,
                              fontSize: { xs: '0.7rem', md: '0.75rem' },
                            }}
                          >
                            {brand.description}
                          </Typography>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </Grid>
                ))}
              </Grid>
            </Grid>

            {/* Right Side - Main Content */}
            <Grid item xs={12} lg={8}>
              <Box sx={{ pl: { lg: 4 } }}>
                {/* Main Headline */}
                <motion.div variants={itemVariants}>
                  <Typography
                    variant="h1"
                    sx={{
                      fontSize: { xs: '2.5rem', md: '3.5rem', lg: '4rem' },
                      fontWeight: 800,
                      mb: 2,
                      direction: 'rtl',
                      background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      lineHeight: 1.2,
                    }}
                  >
                    مرجع تخصصی قطعات
                    <br />
                    خودروهای ایرانی
                  </Typography>
                </motion.div>

                {/* Description */}
                <motion.div variants={itemVariants}>
                  <Typography
                    variant="h5"
                    sx={{
                      mb: 4,
                      color: theme.palette.text.secondary,
                      fontWeight: 400,
                      direction: 'rtl',
                      lineHeight: 1.5,
                    }}
                  >
                    بهترین قطعات اصلی و با کیفیت برای تمامی مدل‌های خودروهای ایرانی
                    با ضمانت اصالت و ارسال سریع
                  </Typography>
                </motion.div>

                {/* Feature Badges */}
                <motion.div variants={itemVariants}>
                  <Box
                    sx={{
                      display: 'flex',
                      gap: 2,
                      mb: 4,
                      flexWrap: 'wrap',
                      justifyContent: { xs: 'center', lg: 'flex-start' },
                    }}
                  >
                    {features.map((feature, index) => (
                      <motion.div
                        key={index}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Chip
                          icon={<feature.icon sx={{ color: feature.color + ' !important' }} />}
                          label={
                            <Box sx={{ textAlign: 'center' }}>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {feature.text}
                              </Typography>
                              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                                {feature.description}
                              </Typography>
                            </Box>
                          }
                          sx={{
                            px: 2,
                            py: 3,
                            borderRadius: 3,
                            backgroundColor: feature.color + '15',
                            color: theme.palette.text.primary,
                            border: `1px solid ${feature.color}25`,
                            fontSize: '0.9rem',
                            '& .MuiChip-icon': {
                              color: feature.color,
                            },
                            '&:hover': {
                              backgroundColor: feature.color + '20',
                              transform: 'translateY(-2px)',
                            },
                            transition: 'all 0.3s ease',
                          }}
                        />
                      </motion.div>
                    ))}
                  </Box>
                </motion.div>

                {/* Large Search Input */}
                <motion.div variants={itemVariants}>
                  <Box sx={{ mb: 4 }}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 1,
                        borderRadius: 4,
                        backgroundColor: 'white',
                        border: `2px solid ${theme.palette.grey[200]}`,
                        '&:hover': {
                          borderColor: theme.palette.primary.main + '50',
                        },
                        '&:focus-within': {
                          borderColor: theme.palette.primary.main,
                          boxShadow: `0 0 0 4px ${theme.palette.primary.main}15`,
                        },
                        transition: 'all 0.3s ease',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <TextField
                          fullWidth
                          placeholder="جستجو برای قطعات خودرو..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onKeyPress={handleKeyPress}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <SearchIcon
                                  sx={{
                                    color: theme.palette.grey[400],
                                    fontSize: '1.5rem',
                                  }}
                                />
                              </InputAdornment>
                            ),
                            disableUnderline: true,
                          }}
                          variant="standard"
                          sx={{
                            '& .MuiInputBase-input': {
                              fontSize: '1.1rem',
                              py: 2,
                              direction: 'rtl',
                              '&::placeholder': {
                                color: theme.palette.grey[500],
                                opacity: 1,
                              },
                            },
                          }}
                        />
                        <Button
                          variant="contained"
                          onClick={handleSearch}
                          sx={{
                            ml: 1,
                            px: 3,
                            py: 1.5,
                            borderRadius: 3,
                            fontWeight: 600,
                            fontSize: '1rem',
                            textTransform: 'none',
                            boxShadow: 'none',
                            '&:hover': {
                              boxShadow: `0 4px 12px ${theme.palette.primary.main}40`,
                            },
                          }}
                        >
                          جستجو
                        </Button>
                      </Box>
                    </Paper>
                  </Box>
                </motion.div>

                {/* Browse Brands Button */}
                <motion.div variants={itemVariants}>
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={() => navigate('/brands')}
                    endIcon={<ArrowForwardIcon sx={{ transform: 'rotate(180deg)' }} />}
                    sx={{
                      px: 4,
                      py: 2,
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      textTransform: 'none',
                      borderRadius: 3,
                      borderWidth: 2,
                      borderColor: theme.palette.primary.main,
                      color: theme.palette.primary.main,
                      '&:hover': {
                        borderWidth: 2,
                        backgroundColor: theme.palette.primary.main + '08',
                        transform: 'translateY(-2px)',
                        boxShadow: `0 6px 20px ${theme.palette.primary.main}30`,
                      },
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  >
                    مشاهده همه برندها
                  </Button>
                </motion.div>
              </Box>
            </Grid>
          </Grid>
        </motion.div>
      </Container>
    </Box>
  );
};

export default ModernHeroSection; 