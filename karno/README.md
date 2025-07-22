# 🚗 Karno - Iranian Car Parts E-commerce Platform

A comprehensive full-stack e-commerce platform specialized in Iranian car parts and accessories. Built with modern web technologies and designed for the Iranian automotive market.

## 🌟 Features

### 🛍️ **E-commerce Core**
- **Product Catalog**: Browse Iranian car parts by brand, category, and model
- **Advanced Search**: Find parts by car make, model, year, and part type
- **Shopping Cart**: Add, remove, and manage items with real-time updates
- **User Authentication**: Secure registration, login, and profile management
- **Order Management**: Complete order processing and tracking system

### 🚙 **Iranian Car Focus**
- **Supported Brands**: Iran Khodro, Saipa, Bahman Motor, MVM, and more
- **Localized Content**: Full RTL support and Persian language interface
- **Iranian Payment**: ZarinPal payment gateway integration
- **Local Shipping**: Optimized for Iranian postal system

### 💳 **Payment & Checkout**
- **Multiple Gateways**: Stripe (international) and ZarinPal (Iran)
- **Secure Transactions**: PCI-compliant payment processing
- **Guest Checkout**: Purchase without registration
- **Order Tracking**: Real-time order status updates

### 🔧 **Technical Features**
- **Progressive Web App**: Offline support and mobile optimization
- **Real-time Updates**: Live inventory and price updates
- **Analytics**: Comprehensive user behavior tracking
- **SEO Optimized**: Server-side rendering and meta optimization
- **Performance**: Optimized loading and caching strategies

## 🛠️ Technology Stack

### **Frontend**
- **React.js 18** - Modern UI framework
- **Material-UI (MUI)** - Component library and theming
- **Redux Toolkit** - State management
- **Framer Motion** - Animations and transitions
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **React Query** - Data fetching and caching
- **i18next** - Internationalization
- **Workbox** - Service worker and PWA features

### **Backend**
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB ODM
- **Redis** - Caching and session storage
- **JWT** - Authentication tokens
- **Stripe** - International payments
- **ZarinPal** - Iranian payment gateway
- **Nodemailer** - Email notifications
- **Sharp** - Image processing
- **Winston** - Logging

### **DevOps & Tools**
- **Git** - Version control
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Jest** - Testing framework
- **Webpack** - Module bundling
- **Compression** - Asset optimization

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- Redis (v6 or higher)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/bigpapao/karno-ecommerce.git
   cd karno-ecommerce
   ```

2. **Install dependencies**
   ```bash
   # Install backend dependencies
   cd backend
   npm install
   
   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. **Environment Configuration**
   ```bash
   # Backend configuration
   cd backend
   cp .env.example .env
   # Edit .env with your configuration
   
   # Frontend configuration
   cd ../frontend
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Database Setup**
   ```bash
   # Make sure MongoDB is running
   # The application will create the database automatically
   
   # Optional: Seed sample data
   cd backend
   npm run seed
   ```

5. **Start the application**
   ```bash
   # Start backend server (Terminal 1)
   cd backend
   npm run dev
   
   # Start frontend development server (Terminal 2)
   cd frontend
   npm start
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - API Documentation: http://localhost:5000/api-docs

## 📁 Project Structure

```
karno-ecommerce/
├── frontend/                 # React.js frontend application
│   ├── public/              # Static assets
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── store/          # Redux store and slices
│   │   ├── utils/          # Utility functions
│   │   └── styles/         # Global styles
│   ├── package.json
│   └── .env.example
├── backend/                 # Node.js backend API
│   ├── src/
│   │   ├── controllers/    # Route controllers
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Custom middleware
│   │   ├── services/       # Business logic
│   │   └── utils/          # Utility functions
│   ├── package.json
│   └── .env.example
├── .gitignore
└── README.md
```

## 🔧 Configuration

### Backend Environment Variables
```env
# Server
NODE_ENV=development
PORT=5000

# Database
MONGODB_URI=mongodb://localhost:27017/karno-ecommerce

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Authentication
JWT_SECRET=your_jwt_secret

# Payment Gateways
STRIPE_SECRET_KEY=sk_test_...
ZARINPAL_MERCHANT_ID=your_merchant_id

# Email
SMTP_HOST=smtp.gmail.com
SMTP_EMAIL=your_email@gmail.com
SMTP_PASSWORD=your_password
```

### Frontend Environment Variables
```env
# API
REACT_APP_API_URL=http://localhost:5000/api/v1

# Features
REACT_APP_CART_ENABLED=true

# Contact
REACT_APP_TEL=+98XXXXXXXXXX
REACT_APP_TELEGRAM=your_telegram
REACT_APP_WHATSAPP=+98XXXXXXXXXX
```

## 🚀 Deployment

### Production Build
```bash
# Build frontend
cd frontend
npm run build

# Start backend in production
cd backend
NODE_ENV=production npm start
```

### Deployment Options
- **Vercel/Netlify**: Frontend deployment
- **Heroku/Railway**: Full-stack deployment
- **DigitalOcean/AWS**: VPS deployment
- **Docker**: Containerized deployment

## 📱 PWA Features

The application includes Progressive Web App features:
- **Offline Support**: Cache critical resources
- **Add to Home Screen**: Install as native app
- **Push Notifications**: Order updates and promotions
- **Background Sync**: Sync data when connection restored

## 🔒 Security Features

- **Authentication**: JWT-based secure authentication
- **Authorization**: Role-based access control
- **Input Validation**: Comprehensive request validation
- **Rate Limiting**: API rate limiting and DDoS protection
- **Data Sanitization**: XSS and injection attack prevention
- **HTTPS**: SSL/TLS encryption
- **CORS**: Cross-origin resource sharing configuration

## 🧪 Testing

```bash
# Run backend tests
cd backend
npm test

# Run frontend tests
cd frontend
npm test

# Run tests with coverage
npm run test:coverage
```

## 📊 Analytics & Monitoring

- **Google Analytics**: User behavior tracking
- **Performance Monitoring**: Core Web Vitals
- **Error Tracking**: Comprehensive error logging
- **API Monitoring**: Request/response monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- **Email**: support@karno.com
- **Telegram**: @karno_support
- **GitHub Issues**: [Create an issue](https://github.com/bigpapao/karno-ecommerce/issues)

## 🙏 Acknowledgments

- Iranian automotive industry for inspiration
- Open source community for amazing tools
- Material-UI team for excellent components
- All contributors and supporters

---

**Made with ❤️ for the Iranian automotive community**