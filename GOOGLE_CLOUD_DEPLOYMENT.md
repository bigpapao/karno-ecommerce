# Google Cloud Deployment Guide for Karno Backend

## Issue Analysis

The build failure you experienced was caused by Google Cloud Build's automatic buildpack detection not finding your Node.js application. The buildpack detector looks for `package.json` in the root directory, but your backend is located in `karno/backend/`.

## Solutions

### Option 1: Cloud Run with Docker (Recommended)

This approach uses Docker containers and Cloud Run for better scalability and cost-effectiveness.

#### Prerequisites
1. Install Google Cloud CLI
2. Enable required APIs:
   ```bash
   gcloud services enable cloudbuild.googleapis.com
   gcloud services enable run.googleapis.com
   gcloud services enable containerregistry.googleapis.com
   ```

#### Deployment Steps

1. **Set your project ID:**
   ```bash
   gcloud config set project YOUR_PROJECT_ID
   ```

2. **Deploy using Cloud Build:**
   ```bash
   gcloud builds submit --config cloudbuild.yaml
   ```

3. **Or deploy manually:**
   ```bash
   # Build the Docker image
   docker build -t gcr.io/YOUR_PROJECT_ID/karno-backend:latest karno/backend/
   
   # Push to Container Registry
   docker push gcr.io/YOUR_PROJECT_ID/karno-backend:latest
   
   # Deploy to Cloud Run
   gcloud run deploy karno-backend \
     --image gcr.io/YOUR_PROJECT_ID/karno-backend:latest \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --port 5000 \
     --memory 512Mi \
     --cpu 1 \
     --max-instances 10
   ```

### Option 2: App Engine

This approach uses Google App Engine for traditional server deployment.

#### Prerequisites
1. Install Google Cloud CLI
2. Enable App Engine API:
   ```bash
   gcloud services enable appengine.googleapis.com
   ```

#### Deployment Steps

1. **Set your project ID:**
   ```bash
   gcloud config set project YOUR_PROJECT_ID
   ```

2. **Deploy to App Engine:**
   ```bash
   gcloud app deploy app.yaml
   ```

### Option 3: Fix the Buildpack Detection (Alternative)

If you want to use the automatic buildpack detection, you can modify your repository structure:

1. **Move the backend to root level temporarily:**
   ```bash
   # Create a new branch for deployment
   git checkout -b deploy-backend
   
   # Move backend files to root
   cp -r karno/backend/* .
   cp karno/backend/package.json .
   cp karno/backend/package-lock.json .
   
   # Commit and push
   git add .
   git commit -m "Fix buildpack detection for Google Cloud Build"
   git push origin deploy-backend
   ```

2. **Deploy using automatic detection:**
   ```bash
   gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/karno-backend
   ```

## Environment Variables

Make sure to set these environment variables in your deployment:

### Required Environment Variables
- `MONGODB_URI`: Your MongoDB connection string
- `JWT_SECRET`: Secret for JWT token signing
- `NODE_ENV`: Set to "production"

### Optional Environment Variables
- `PORT`: Port number (default: 5000 for Cloud Run, 8080 for App Engine)
- `CORS_ORIGIN`: Frontend URL for CORS
- `STRIPE_SECRET_KEY`: For payment processing
- `AWS_ACCESS_KEY_ID`: For S3 file uploads
- `AWS_SECRET_ACCESS_KEY`: For S3 file uploads
- `AWS_REGION`: For S3 file uploads
- `AWS_BUCKET_NAME`: For S3 file uploads

## Setting Environment Variables

### For Cloud Run:
```bash
gcloud run services update karno-backend \
  --set-env-vars MONGODB_URI=your_mongodb_uri,JWT_SECRET=your_jwt_secret,NODE_ENV=production
```

### For App Engine:
Add them to the `env_variables` section in `app.yaml`.

## Monitoring and Logs

### View logs:
```bash
# Cloud Run
gcloud logs read --service=karno-backend --limit=50

# App Engine
gcloud app logs tail -s default
```

### Monitor performance:
- Go to Google Cloud Console
- Navigate to Cloud Run or App Engine
- View metrics and performance data

## Troubleshooting

### Common Issues:

1. **Build fails with "no buildpacks participating"**
   - Solution: Use the Docker approach (Option 1) or fix repository structure (Option 3)

2. **Application fails to start**
   - Check environment variables are set correctly
   - Verify MongoDB connection string
   - Check logs for specific error messages

3. **CORS errors**
   - Update CORS configuration in `server.js` to include your frontend domain
   - Set `CORS_ORIGIN` environment variable

4. **Memory issues**
   - Increase memory allocation in deployment configuration
   - Optimize your application code

## Cost Optimization

### Cloud Run:
- Pay only for actual usage
- Automatic scaling to zero when not in use
- Good for variable traffic

### App Engine:
- Always-on instances (minimum 1)
- Better for consistent traffic
- More predictable pricing

## Security Best Practices

1. **Environment Variables**: Never commit secrets to version control
2. **HTTPS**: Always use HTTPS in production
3. **CORS**: Configure CORS properly for your frontend domain
4. **Rate Limiting**: Your app already has rate limiting middleware
5. **Input Validation**: Ensure all inputs are validated

## Next Steps

1. Choose your preferred deployment option
2. Set up environment variables
3. Deploy your application
4. Test the deployment
5. Set up monitoring and alerts
6. Configure custom domain (optional)

## Support

If you encounter issues:
1. Check the Google Cloud Console logs
2. Review the deployment configuration
3. Verify environment variables
4. Test locally with production settings 