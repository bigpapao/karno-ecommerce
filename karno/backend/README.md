# Karno E-commerce Backend

This is the backend for the Karno E-commerce platform.

## Project Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd karno-backend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root of the `karno-backend` directory and add the following variables. Replace placeholder values with your actual configuration.

    ```env
    # Server Configuration
    PORT=5001
    NODE_ENV=development # or production

    # MongoDB Configuration
    MONGODB_URI=mongodb://localhost:27017/karno-db # Your MongoDB connection string

    # JWT Configuration
    JWT_SECRET=your-super-secure-jwt-secret # Replace with a strong, random secret
    ACCESS_TOKEN_EXPIRY=15m # Access token expiry time (e.g., 15 minutes)
    REFRESH_TOKEN_SECRET=your-super-secure-refresh-token-secret # Replace with another strong, random secret
    REFRESH_TOKEN_EXPIRY=7d # Refresh token expiry time (e.g., 7 days)

    # CORS Configuration (Optional - defaults are usually fine for development)
    # FRONTEND_URL=http://localhost:3000 # URL of your frontend application

    # SMS Service Configuration (Example for a generic SMS service)
    # SMS_API_KEY=your_sms_service_api_key
    # SMS_SENDER_ID=KarnoApp
    # SMS_SERVICE_URL=https://api.yoursmsservice.com/send

    # Other configurations (Logging, Rate Limiting, etc.)
    # LOG_LEVEL=info
    # CREATE_INDEXES_ON_STARTUP=true
    ```

    **Important Security Notes for `.env`:**
    *   Never commit your `.env` file to version control.
    *   `JWT_SECRET` and `REFRESH_TOKEN_SECRET` must be strong, unique, and kept confidential. Use a password generator to create these.
    *   In `production` mode, ensure `NODE_ENV` is set to `production`. This typically enables more secure defaults (e.g., for cookies).

4.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The server will typically start on `http://localhost:5001` (or the port specified in your `.env` file).

5.  **Run linters/formatters (Optional but Recommended):**
    ```bash
    # Example: If you have ESLint and Prettier configured
    # npm run lint
    # npm run format
    ```

## API Endpoints Overview

(This section should be updated to reflect the current API structure)

### Authentication (`/api/v1/auth`)

*   **`POST /register`**: Register a new user.
    *   **Body**: `firstName`, `lastName`, `email`, `password` (min 6 characters).
    *   **Response**: `201 Created` with user data and sets `access_token` and `refresh_token` HttpOnly cookies.
        Rejects requests with extra fields (400 Bad Request).
        Handles existing email conflicts (400 Bad Request).
*   **`POST /login`**: Log in an existing user.
    *   **Body**: `email`, `password`.
    *   **Response**: `200 OK` with user data and sets `access_token` and `refresh_token` HttpOnly cookies.
        Implements rate limiting (5 requests per 15 minutes per IP).
        Implements account locking (locks account for 15 minutes after 5 failed password attempts).
*   **`POST /logout`**: Log out the current user.
    *   **Response**: `200 OK`. Clears HttpOnly auth cookies.
*   **`POST /refresh-token`**: Obtain a new `access_token` using a valid `refresh_token` (sent via HttpOnly cookie).
    *   **Response**: `200 OK`. Sets a new `access_token` and `refresh_token` via HttpOnly cookies.
*   **`GET /profile`**: (Protected) Get the current authenticated user's profile.
    *   **Response**: `200 OK` with user data.
*   **`PUT /profile`**: (Protected) Update the current authenticated user's profile (e.g., `firstName`, `lastName`).
    *   **Body**: Fields to update (e.g., `firstName`, `lastName`).
    *   **Response**: `200 OK` with updated user data.

### User - Phone Verification (`/api/v1/users/phone`)

*   **`POST /request`**: (Protected) Request a phone verification OTP.
    *   **Body**: `phoneNumber` (string, e.g., "09123456789").
    *   **Response**: `200 OK` with a success message. Sends an OTP to the provided phone number.
*   **`POST /verify`**: (Protected) Verify a phone number using an OTP.
    *   **Body**: `code` (string, the OTP received).
    *   **Response**: `200 OK` on successful verification. Updates the user's `phoneVerified` status to `true`. Allows a maximum of 3 attempts per code.

(Add other relevant endpoint categories like Products, Orders, etc.)

## Key Changes in Recent Auth Refactor

*   **CSRF Protection Removed**: CSRF tokens (e.g., `X-XSRF-TOKEN`) are no longer used. The `csurf` middleware and related routes/logic have been deleted from the backend. The frontend no longer fetches or sends CSRF tokens.
*   **JWTs in HttpOnly Cookies**: Authentication is now managed via `access_token` (15 min expiry) and `refresh_token` (7 days expiry) stored in secure, HttpOnly cookies. The `Authorization: Bearer <token>` header is no longer used for session management.
*   **Simplified Registration**: The registration process (`POST /api/v1/auth/register`) now only accepts `firstName`, `lastName`, `email`, and `password`. Any other fields in the request body will result in a 400 Bad Request. Password must be at least 6 characters.
*   **Login Security Enhancements**:
    *   Rate limiting is applied to the login route (`POST /api/v1/auth/login`): 5 attempts per 15 minutes per IP.
    *   Account locking: After 5 incorrect password attempts, the account is locked for 15 minutes.
*   **Phone Verification Flow**: A new two-step phone verification process has been added for users post-registration (typically on their profile page):
    1.  `POST /api/v1/users/phone/request` with `phoneNumber` to receive an OTP.
    2.  `POST /api/v1/users/phone/verify` with the `code` to verify the number. Users have 3 attempts per OTP.
*   **Dependency Cleanup**: `csurf` and `express-session` (and `connect-mongo`) have been removed from backend dependencies as they are no longer needed for the simplified auth flow. `cookie-parser` is retained for handling JWT cookies.
*   **Validation Improvements**: User model and registration validation now explicitly require `email`. Missing `email` during registration will result in a 400 Bad Request, not a 500 server error.

## Scripts

*   `npm start`: Starts the server in production mode (uses `node src/server.js`).
*   `npm run dev`: Starts the server in development mode with `nodemon` for automatic restarts on file changes.
*   `npm test`: Runs Jest tests (ensure tests are updated for the new auth flow).
*   `npm run test:watch`: Runs Jest tests in watch mode.

## Contributing

(Add guidelines for contributing to the project if applicable)

## License

ISC (or your chosen license) 