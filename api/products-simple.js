// Vercel serverless function for products
export default function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Mock products data
  const products = [
    {
      _id: '1',
      name: 'لنت ترمز جلو پراید',
      description: 'لنت ترمز جلو با کیفیت بالا برای خودروهای پراید',
      price: 180000,
      category: { name: 'لنت ترمز' },
      brand: { name: 'ایرانی' },
      stock: 25,
      images: [{ url: '/images/products/placeholder.jpg' }],
      rating: 4.2,
      numReviews: 45
    },
    {
      _id: '2',
      name: 'فیلتر روغن پراید',
      description: 'فیلتر روغن با کیفیت بالا برای خودروهای پراید',
      price: 45000,
      category: { name: 'فیلتر روغن' },
      brand: { name: 'ایرانی' },
      stock: 50,
      images: [{ url: '/images/products/placeholder.jpg' }],
      rating: 4.3,
      numReviews: 32
    }
  ];

  res.status(200).json({
    success: true,
    data: products,
    count: products.length,
    message: 'Products fetched successfully'
  });
} 