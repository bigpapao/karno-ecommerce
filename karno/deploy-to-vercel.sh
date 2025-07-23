#!/bin/bash

# 🚀 Karno E-commerce Vercel Deployment Script
# This script helps you deploy your Karno project to Vercel

echo "🚀 Starting Karno E-commerce Vercel Deployment..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed. Installing now..."
    npm install -g vercel
fi

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm run install:all

# Build the frontend
echo "🔨 Building frontend..."
cd karno/frontend
npm run build
cd ../..

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment completed!"
echo "🌐 Your app should be available at the URL provided above"
echo "📊 Check your Vercel dashboard for deployment status" 