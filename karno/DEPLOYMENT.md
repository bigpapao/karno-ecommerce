# Karno E-commerce Platform Deployment Guide

This guide provides instructions for deploying both the frontend and backend components of the Karno e-commerce platform.

## Prerequisites

- GitHub account
- Netlify account (for frontend deployment)
- Render account (for backend deployment)
- MongoDB Atlas account (for database)
- Firebase project (already configured)

## Frontend Deployment (Netlify)

1. Push your code to a GitHub repository
2. Log in to Netlify (https://app.netlify.com/)
3. Click "New site from Git"
4. Select your GitHub repository
5. Configure the build settings:
   - Base directory: `frontend`
   - Build command: `npm run build`
   - Publish directory: `build`
6. Add the following environment variables in Netlify's "Site settings" > "Environment variables":
   - `REACT_APP_API_URL`: URL of your deployed backend (e.g., https://karno-api.onrender.com)

7. Click "Deploy site"

## Backend Deployment (Render)

1. Log in to Render (https://dashboard.render.com/)
2. Click "New" > "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - Name: `karno-api`
   - Runtime: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Plan: Free
5. Add the following environment variables:
   - `NODE_ENV`: `production`
   - `MONGO_URI`: Your MongoDB Atlas connection string
   - `JWT_SECRET`: A secure random string for JWT token generation
   - `JWT_EXPIRES_IN`: `90d`
   - `STRIPE_SECRET_KEY`: Your Stripe secret key
   - `FIREBASE_SERVICE_ACCOUNT`: The contents of your Firebase Admin SDK service account key JSON file

6. Click "Create Web Service"

## Important Security Notes

1. **Firebase Configuration**: Your Firebase configuration in `frontend/src/firebase.js` contains API keys. For production, consider moving these to environment variables.

2. **Firebase Admin SDK**: The service account key file (`karno-4253f-firebase-adminsdk-fbsvc-066a91c22c.json`) grants privileged access to your Firebase project. Do not commit this to version control. For Render deployment, you'll need to copy the contents of this file and add it as an environment variable.

3. **MongoDB Connection**: Ensure your MongoDB Atlas cluster is configured to accept connections from your Render deployment (by allowing connections from all IPs or specifically from Render's IP range).

## Post-Deployment Steps

1. Test the deployed application thoroughly
2. Set up custom domain names if needed
3. Configure SSL certificates (automatically handled by Netlify and Render)
4. Set up monitoring and logging
