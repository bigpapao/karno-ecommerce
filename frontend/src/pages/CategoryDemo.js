import React from 'react';
import {
  Box,
  Container,
  Typography,
  Divider,
  Paper,
  Chip,
} from '@mui/material';
import PremiumCategoryCards from '../components/PremiumCategoryCards';

const CategoryDemo = () => {
  return (
    <Box sx={{ py: 4, bgcolor: '#f5f7fa', minHeight: '100vh' }}>
      <Container maxWidth="xl">
        {/* Page Header */}
        <Box sx={{ textAlign: 'center', mb: 6, direction: 'rtl' }}>
          <Typography
            variant="h3"
            component="h1"
            sx={{
              fontWeight: 800,
              mb: 2,
              color: '#1a202c',
            }}
          >
            نمایش کامپوننت کارت‌های دسته‌بندی
          </Typography>
          <Typography
            variant="h6"
            color="text.secondary"
            sx={{ maxWidth: 800, mx: 'auto', lineHeight: 1.6 }}
          >
            طراحی مدرن و حرفه‌ای برای نمایش دسته‌بندی‌های قطعات خودرو با الهام از سایت‌های معتبر تجارت الکترونیک
          </Typography>
        </Box>

        {/* Features List */}
        <Paper sx={{ p: 4, mb: 6, borderRadius: 3 }}>
          <Typography variant="h5" sx={{ mb: 3, fontWeight: 700, direction: 'rtl' }}>
            ویژگی‌های کامپوننت:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, direction: 'rtl' }}>
            {[
              'طراحی ریسپانسیو (۳ ستون در دسکتاپ، ۱-۲ ستون در موبایل)',
              'انیمیشن‌های نرم و جذاب',
              'آیکون‌های اختصاصی برای هر دسته‌بندی',
              'پالت رنگ حرفه‌ای',
              'افکت‌های هاور پیشرفته',
              'پشتیبانی کامل از RTL',
              'سازگار با Material-UI Theme',
              'بهینه‌سازی شده برای عملکرد',
            ].map((feature, index) => (
              <Chip
                key={index}
                label={feature}
                sx={{
                  backgroundColor: '#e3f2fd',
                  color: '#1976d2',
                  fontWeight: 500,
                  '& .MuiChip-label': {
                    px: 2,
                  }
                }}
              />
            ))}
          </Box>
        </Paper>

        {/* Default Configuration */}
        <Box sx={{ mb: 8 }}>
          <Typography
            variant="h4"
            sx={{
              mb: 3,
              fontWeight: 700,
              direction: 'rtl',
              color: '#1a202c',
            }}
          >
            ۱. نمایش پیش‌فرض (با عنوان)
          </Typography>
          <PremiumCategoryCards maxCategories={6} showTitle={true} />
        </Box>

        <Divider sx={{ my: 6 }} />

        {/* Without Title Configuration */}
        <Box sx={{ mb: 8 }}>
          <Typography
            variant="h4"
            sx={{
              mb: 3,
              fontWeight: 700,
              direction: 'rtl',
              color: '#1a202c',
            }}
          >
            ۲. نمایش بدون عنوان (برای استفاده در بخش‌های مختلف)
          </Typography>
          <PremiumCategoryCards maxCategories={9} showTitle={false} />
        </Box>

        <Divider sx={{ my: 6 }} />

        {/* Compact Configuration */}
        <Box sx={{ mb: 8 }}>
          <Typography
            variant="h4"
            sx={{
              mb: 3,
              fontWeight: 700,
              direction: 'rtl',
              color: '#1a202c',
            }}
          >
            ۳. نمایش محدود (برای صفحه اصلی)
          </Typography>
          <PremiumCategoryCards maxCategories={3} showTitle={false} />
        </Box>

        {/* Usage Examples */}
        <Paper sx={{ p: 4, borderRadius: 3, bgcolor: '#1a202c', color: 'white' }}>
          <Typography variant="h5" sx={{ mb: 3, fontWeight: 700, direction: 'rtl' }}>
            نحوه استفاده:
          </Typography>
          <Box
            component="pre"
            sx={{
              backgroundColor: '#2d3748',
              p: 3,
              borderRadius: 2,
              overflow: 'auto',
              direction: 'ltr',
              fontFamily: 'monospace',
              fontSize: '0.9rem',
              lineHeight: 1.6,
            }}
          >
{`// استفاده پایه
import PremiumCategoryCards from '../components/PremiumCategoryCards';

// در صفحه اصلی - نمایش محدود
<PremiumCategoryCards maxCategories={6} showTitle={true} />

// در بخش‌های دیگر - بدون عنوان
<PremiumCategoryCards maxCategories={9} showTitle={false} />

// نمایش همه دسته‌بندی‌ها
<PremiumCategoryCards maxCategories={12} showTitle={true} />`}
          </Box>

          <Typography variant="h6" sx={{ mt: 4, mb: 2, fontWeight: 600, direction: 'rtl' }}>
            تنظیمات قابل تغییر:
          </Typography>
          <Box
            component="ul"
            sx={{
              direction: 'rtl',
              '& li': {
                mb: 1,
                lineHeight: 1.6,
              }
            }}
          >
            <li><strong>maxCategories:</strong> حداکثر تعداد دسته‌بندی نمایش داده شده (پیش‌فرض: ۱۲)</li>
            <li><strong>showTitle:</strong> نمایش عنوان اصلی کامپوننت (پیش‌فرض: true)</li>
          </Box>
        </Paper>

        {/* Technical Details */}
        <Paper sx={{ p: 4, mt: 6, borderRadius: 3, bgcolor: '#f8fafc' }}>
          <Typography variant="h5" sx={{ mb: 3, fontWeight: 700, direction: 'rtl' }}>
            جزئیات فنی:
          </Typography>
          <Box sx={{ direction: 'rtl' }}>
            <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.8 }}>
              <strong>Grid Layout:</strong> استفاده از Material-UI Grid با نقاط شکست ریسپانسیو
            </Typography>
            <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.8 }}>
              <strong>Animations:</strong> انیمیشن‌های CSS3 با cubic-bezier timing functions
            </Typography>
            <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.8 }}>
              <strong>Icons:</strong> آیکون‌های SVG سفارشی برای هر دسته‌بندی خودرویی
            </Typography>
            <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.8 }}>
              <strong>Performance:</strong> Lazy loading و مدیریت state بهینه
            </Typography>
            <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
              <strong>Accessibility:</strong> پشتیبانی کامل از ARIA labels و keyboard navigation
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default CategoryDemo; 