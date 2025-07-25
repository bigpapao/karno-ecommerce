#!/bin/bash

echo "🚀 Deploying Karno Frontend to Vercel..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed. Please install it first:"
    echo "npm install -g vercel"
    exit 1
fi

# Navigate to the project root
cd "$(dirname "$0")"

# Deploy to Vercel
echo "📦 Building and deploying..."
vercel --prod

echo "✅ Deployment completed!"
echo "🌐 Your frontend should now be live at the URL provided above"
echo "🔗 Backend URL: https://karno-backend-834670291128.europe-west1.run.app" 