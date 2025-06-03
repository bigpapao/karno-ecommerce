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

# Karno Authentication System

A clean, optimized, and user-friendly authentication system for the Karno e-commerce platform.

## Features

- **Lightweight Authentication**: Simple email/phone number and password-based authentication
- **Guest Cart Functionality**: Allow guests to add items to cart without login
- **Cart Merging**: Automatically merge guest cart with user cart upon login
- **JWT Authentication**: 15-minute access tokens with HTTP-only refresh tokens
- **Remember Me**: Extend session longevity with an opt-in feature (7 days)
- **Secure Implementation**: Includes password hashing, rate limiting, and more

## Frontend Implementation

The frontend is built with React and Tailwind CSS, featuring:

- Responsive login and registration forms
- Real-time form validation
- Password strength indicators
- Mobile number validation
- Protected routes for authenticated sections
- Guest cart management with localStorage

## Backend API

The backend provides RESTful endpoints for:

- User registration (`/api/register`)
- User login (`/api/login`)
- Cart merging (`/api/cart/merge`)
- User profile management
- JWT token management

## Setup Instructions

### Prerequisites

- Node.js (v14 or later)
- npm or yarn
- MongoDB

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd karno/frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd karno/backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the backend root with the following variables:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/karno
   JWT_SECRET=your_secure_jwt_secret
   JWT_REFRESH_SECRET=your_secure_refresh_token_secret
   NODE_ENV=development
   ```

4. Start the server:
   ```bash
   npm run dev
   ```

## Security Features

- **Password Hashing**: bcrypt with 12 rounds of salting
- **Rate Limiting**: 5 requests per minute for login/register endpoints
- **JWT Security**: Short-lived access tokens with HTTP-only refresh tokens
- **Generic Error Messages**: Prevents user enumeration
- **HTTP Security Headers**: Protects against common web vulnerabilities

## Usage Examples

### Protecting Routes

Wrap your routes in the `ProtectedRoute` component:

```jsx
<Routes>
  <Route path="/" element={<Home />} />
  <Route path="/login" element={<Login />} />
  <Route path="/register" element={<Register />} />
  
  {/* Protected Routes */}
  <Route path="/checkout" element={
    <ProtectedRoute>
      <Checkout />
    </ProtectedRoute>
  } />
  <Route path="/profile" element={
    <ProtectedRoute>
      <Profile />
    </ProtectedRoute>
  } />
</Routes>
```

### Guest Cart Functionality

Use the cart utilities to manage the guest cart:

```javascript
import { addToGuestCart, getGuestCart } from '../utils/cartMergeUtils';

// Add item to guest cart
const handleAddToCart = (product) => {
  addToGuestCart({
    productId: product._id,
    name: product.name,
    price: product.price,
    quantity: 1,
    image: product.images[0]
  });
};
```

## License

[MIT License](LICENSE)

## Contact

For support or questions, please contact the Karno development team.
