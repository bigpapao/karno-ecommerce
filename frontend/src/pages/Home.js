import React from 'react';
import ModernHeroSection from '../components/ModernHeroSection';
import PremiumCategoryCards from '../components/PremiumCategoryCards';
import FeaturedBrands from '../components/FeaturedBrands';
import WhyChooseUs from '../components/WhyChooseUs';
import SEO from '../components/SEO';
import { generateOrganizationSchema, generateLocalBusinessSchema } from '../utils/structuredData';

const Home = () => {
  // Combine organization and local business schemas for homepage
  const combinedSchema = [
    generateOrganizationSchema(),
    generateLocalBusinessSchema()
  ];

  return (
    <>
      <SEO 
        title="فروشگاه آنلاین قطعات خودرو | کارنو"
        description="فروشگاه آنلاین کارنو، ارائه دهنده انواع قطعات یدکی و لوازم جانبی خودرو با قیمت مناسب، کیفیت بالا و ارسال سریع به سراسر ایران"
        canonical="https://karno.ir"
        openGraph={{
          type: 'website',
          image: 'https://karno.ir/images/home-og.jpg',
        }}
        schema={combinedSchema}
      />
      <ModernHeroSection />
      <PremiumCategoryCards maxCategories={6} showTitle={true} />
      <FeaturedBrands />
      <WhyChooseUs />
    </>
  );
};

export default Home;
