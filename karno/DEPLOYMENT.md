# 🚀 Karno E-commerce Vercel Deployment Guide

## Prerequisites

1. **GitHub Account**: Your code is already on [GitHub](https://github.com/bigpapao/karno-ecommerce)
2. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
3. **MongoDB Database**: Set up a MongoDB Atlas cluster
4. **Environment Variables**: Configure your production environment

## 🛠️ Step-by-Step Deployment

### 1. Connect GitHub to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your GitHub repository: `bigpapao/karno-ecommerce`
4. Select the repository and click "Import"

### 2. Configure Project Settings

**Framework Preset**: Select "Other" (since this is a monorepo)

**Root Directory**: Leave as `/` (root)

**Build Command**: `cd karno/frontend && npm install && npm run build`

**Output Directory**: `karno/frontend/build`

**Install Command**: `npm run install:all`

### 3. Environment Variables

Add these environment variables in Vercel dashboard:

#### Database Configuration
```
MONGODB_URI=your_mongodb_atlas_connection_string
MONGODB_DB_NAME=karno_production
```

#### Authentication
```
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d
REFRESH_TOKEN_SECRET=your_refresh_token_secret
```

#### Payment Gateways
```
ZARINPAL_MERCHANT_ID=your_zarinpal_merchant_id
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

#### Email Configuration
```
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
```

#### Redis (Optional)
```
REDIS_URL=your_redis_url
```

#### Other Settings
```
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://your-domain.vercel.app
BACKEND_URL=https://your-domain.vercel.app/api
```

### 4. Deploy

1. Click "Deploy" in Vercel dashboard
2. Wait for the build process to complete
3. Your app will be available at `https://your-project-name.vercel.app`

### 5. Custom Domain (Optional)

1. Go to your project settings in Vercel
2. Navigate to "Domains"
3. Add your custom domain
4. Configure DNS settings as instructed

## 🔧 Post-Deployment Configuration

### 1. Update Frontend API URLs

Make sure your frontend is pointing to the correct API endpoints:

```javascript
// In karno/frontend/src/services/api.js
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://your-domain.vercel.app/api';
```

### 2. Test Your Application

1. **Frontend**: Visit your Vercel URL
2. **API Endpoints**: Test `/api/health` or `/api/products`
3. **Authentication**: Test login/register functionality
4. **Database**: Verify data is being saved/retrieved

### 3. Monitor Performance

- Check Vercel Analytics
- Monitor function execution times
- Set up error tracking (Sentry, etc.)

## 🚨 Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Node.js version compatibility
   - Verify all dependencies are installed
   - Check for missing environment variables

2. **API Routes Not Working**
   - Verify `vercel.json` configuration
   - Check API routes are properly configured
   - Ensure backend server is starting correctly

3. **Database Connection Issues**
   - Verify MongoDB Atlas network access
   - Check connection string format
   - Ensure database user has proper permissions

4. **Environment Variables**
   - Double-check all required variables are set
   - Verify variable names match your code
   - Check for typos in values

### Debug Commands

```bash
# Check build logs
vercel logs

# Deploy with debug info
vercel --debug

# Check function logs
vercel logs --function=backend/src/server.js
```

## 📊 Performance Optimization

1. **Enable Caching**
   - Configure CDN caching for static assets
   - Implement API response caching
   - Use Redis for session storage

2. **Image Optimization**
   - Use Vercel's image optimization
   - Implement lazy loading
   - Compress images before upload

3. **Code Splitting**
   - Implement React.lazy() for route-based splitting
   - Use dynamic imports for heavy components
   - Optimize bundle size

## 🔒 Security Considerations

1. **Environment Variables**
   - Never commit sensitive data to Git
   - Use Vercel's environment variable encryption
   - Rotate secrets regularly

2. **API Security**
   - Implement rate limiting
   - Use CORS properly
   - Validate all inputs

3. **Database Security**
   - Use MongoDB Atlas security features
   - Implement proper user roles
   - Enable network access controls

## 📈 Monitoring & Analytics

1. **Vercel Analytics**
   - Enable web analytics
   - Monitor Core Web Vitals
   - Track user behavior

2. **Error Tracking**
   - Set up Sentry integration
   - Monitor function errors
   - Track API failures

3. **Performance Monitoring**
   - Monitor function execution times
   - Track database query performance
   - Monitor API response times

## 🔄 Continuous Deployment

Your app will automatically redeploy when you push to the main branch on GitHub.

To deploy from a different branch:
1. Go to Vercel dashboard
2. Select your project
3. Go to "Deployments"
4. Click "Redeploy" and select branch

## 📞 Support

- **Vercel Documentation**: [vercel.com/docs](https://vercel.com/docs)
- **GitHub Issues**: [github.com/bigpapao/karno-ecommerce/issues](https://github.com/bigpapao/karno-ecommerce/issues)
- **MongoDB Atlas**: [docs.atlas.mongodb.com](https://docs.atlas.mongodb.com)

---

**Happy Deploying! 🚀** 