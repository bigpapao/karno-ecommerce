export default function handler(req, res) {
  // Mock products data for testing
  const mockProducts = [
    {
      id: 1,
      name: "ایران خودرو - قطعه موتور",
      description: "قطعه اصلی موتور برای ایران خودرو",
      price: 1500000,
      category: "موتور",
      brand: "ایران خودرو",
      stockQuantity: 10,
      images: ["/images/product1.jpg"],
      compatibility: ["پژو 206", "پژو 207"]
    },
    {
      id: 2,
      name: "سایپا - لنت ترمز",
      description: "لنت ترمز با کیفیت بالا",
      price: 450000,
      category: "ترمز",
      brand: "سایپا",
      stockQuantity: 25,
      images: ["/images/product2.jpg"],
      compatibility: ["پراید", "ساینا"]
    },
    {
      id: 3,
      name: "بهمن موتور - فیلتر هوا",
      description: "فیلتر هوای موتور با کیفیت",
      price: 120000,
      category: "فیلتر",
      brand: "بهمن موتور",
      stockQuantity: 15,
      images: ["/images/product3.jpg"],
      compatibility: ["پژو 405", "پژو 206"]
    }
  ];

  res.status(200).json({
    success: true,
    data: mockProducts,
    total: mockProducts.length,
    message: "Products loaded successfully"
  });
} 