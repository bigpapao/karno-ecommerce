# ⚡ Quick Vercel Deployment Guide

## 🚀 Deploy in 5 Minutes

### Step 1: Push Your Code to GitHub
```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin master
```

### Step 2: Connect to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Sign up/Login with GitHub
3. Click "New Project"
4. Import: `bigpapao/karno-ecommerce`

### Step 3: Configure Project
- **Framework**: Other
- **Root Directory**: `/` (leave default)
- **Build Command**: `cd karno/frontend && npm install && npm run build`
- **Output Directory**: `karno/frontend/build`
- **Install Command**: `npm run install:all`

### Step 4: Add Environment Variables
Add these in Vercel dashboard → Settings → Environment Variables:

```
# Required
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/karno
JWT_SECRET=your-super-secret-jwt-key-here
NODE_ENV=production

# Optional (add as needed)
ZARINPAL_MERCHANT_ID=your-zarinpal-id
STRIPE_SECRET_KEY=your-stripe-key
SMTP_HOST=your-smtp-host
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
```

### Step 5: Deploy
Click "Deploy" and wait for build to complete!

## 🔗 Your App Will Be Available At:
`https://your-project-name.vercel.app`

## 🧪 Test Your Deployment
1. Visit your Vercel URL
2. Test API: `https://your-project-name.vercel.app/api/products`
3. Test frontend navigation
4. Test authentication (if configured)

## 🚨 If Something Goes Wrong

### Check Build Logs
- Go to Vercel dashboard → Deployments → Latest deployment
- Check "Build Logs" for errors

### Common Issues & Fixes

**Build Fails:**
- Check Node.js version (should be 16+)
- Verify all dependencies are in package.json
- Check for missing environment variables

**API Not Working:**
- Verify `vercel.json` is in root directory
- Check API routes are properly configured
- Ensure MongoDB connection string is correct

**Frontend Not Loading:**
- Check if build completed successfully
- Verify output directory is correct
- Check for JavaScript errors in browser console

## 📞 Need Help?
- Check the full [DEPLOYMENT.md](./DEPLOYMENT.md) guide
- Review [Vercel documentation](https://vercel.com/docs)
- Check your [GitHub repository](https://github.com/bigpapao/karno-ecommerce)

---

**🎉 Your Karno E-commerce platform will be live in minutes!** 