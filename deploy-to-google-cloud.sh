#!/bin/bash

# Google Cloud Deployment Script for Karno Backend
# Usage: ./deploy-to-google-cloud.sh [PROJECT_ID] [REGION]

set -e

# Default values
PROJECT_ID=${1:-"celestial-sonar-466918-n2"}
REGION=${2:-"us-central1"}
SERVICE_NAME="karno-backend"

echo "🚀 Starting deployment to Google Cloud..."
echo "Project ID: $PROJECT_ID"
echo "Region: $REGION"
echo "Service: $SERVICE_NAME"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ Google Cloud CLI is not installed. Please install it first."
    echo "Visit: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Set the project
echo "📋 Setting project..."
gcloud config set project $PROJECT_ID

# Enable required APIs
echo "🔧 Enabling required APIs..."
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com

# Build and deploy using Cloud Build
echo "🏗️ Building and deploying with Cloud Build..."
gcloud builds submit --config cloudbuild.yaml

echo "✅ Deployment completed successfully!"
echo ""
echo "🌐 Your service URL:"
gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)"

echo ""
echo "📊 To view logs:"
echo "gcloud logs read --service=$SERVICE_NAME --limit=50"

echo ""
echo "🔧 To update environment variables:"
echo "gcloud run services update $SERVICE_NAME --set-env-vars MONGODB_URI=your_uri,JWT_SECRET=your_secret"

echo ""
echo "📈 To monitor your service:"
echo "https://console.cloud.google.com/run/detail/$REGION/$SERVICE_NAME" 