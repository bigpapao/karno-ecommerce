# Karno - Car Parts E-Commerce Platform

Karno is an e-commerce platform specializing in automotive parts, accessories, and vehicles. The platform provides a seamless shopping experience with advanced search capabilities, secure payments, and comprehensive order management.

## Features

### Frontend (React.js)
- Responsive design for mobile and desktop
- Advanced product search by vehicle, brand, model, or category
- User authentication and account management
- Shopping cart and secure checkout
- Order tracking and history
- Detailed product pages with specifications
- SEO-optimized content

### Backend (Node.js/Express.js)
- RESTful API architecture
- MongoDB database with Mongoose ODM
- JWT-based authentication
- Admin panel for inventory management
- Real-time inventory updates
- Payment gateway integration (Stripe, PayPal)
- Robust security measures

## Project Structure

```
karno/
├── frontend/          # React.js application
│   ├── public/       # Static files
│   └── src/          # Source code
├── backend/          # Node.js/Express.js application
│   ├── src/         # Source code
│   ├── config/      # Configuration files
│   └── models/      # Database models
└── README.md        # Project documentation
```

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (v5 or higher)
- npm or yarn package manager

## Getting Started

1. Clone the repository:
```bash
git clone [repository-url]
cd karno
```

2. Install frontend dependencies:
```bash
cd frontend
npm install
```

3. Install backend dependencies:
```bash
cd ../backend
npm install
```

4. Set up environment variables:
- Create `.env` files in both frontend and backend directories
- Add necessary configuration (database URI, API keys, etc.)

5. Start the development servers:

Backend:
```bash
cd backend

```

Frontend:
```bash
cd frontend
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5001

## Environment Variables

### Backend (.env)
```
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
STRIPE_SECRET_KEY=your_stripe_key
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5001
REACT_APP_STRIPE_PUBLIC_KEY=your_stripe_public_key
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details
