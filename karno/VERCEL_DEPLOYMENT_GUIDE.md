# Vercel Deployment Guide for Karno Frontend

## Current Issue
Your Vercel deployment is stuck in an infinite loop due to conflicting build configurations.

## Solution Steps

### Step 1: Update Vercel Project Settings

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your `karno-ecommerce` project
3. Go to **Settings** → **General**
4. Update the following settings:

**Build & Development Settings:**
- **Framework Preset**: `Other`
- **Build Command**: `cd karno/frontend && npm install && npm run build`
- **Output Directory**: `karno/frontend/build`
- **Install Command**: `cd karno/frontend && npm install`
- **Root Directory**: Leave empty (or `/`)

### Step 2: Environment Variables (Optional)

If you want to use environment variables for the API URL:

1. Go to **Settings** → **Environment Variables**
2. Add:
   - **Name**: `REACT_APP_API_URL`
   - **Value**: `https://karno-backend-834670291128.europe-west1.run.app/api/v1`
   - **Environment**: Production, Preview, Development

### Step 3: Redeploy

1. Go to **Deployments** tab
2. Click **Redeploy** on your latest deployment
3. Or push new changes to trigger a new deployment

## Alternative: Use Vercel CLI

If you prefer using the command line:

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy from project root
cd karno
vercel --prod
```

## Expected Result

After fixing the configuration:
- ✅ Build should complete without infinite loops
- ✅ Frontend should be accessible at your Vercel URL
- ✅ Frontend should connect to your Google Cloud backend
- ✅ No more "up to date, audited 1 package" repeated messages

## Troubleshooting

### If build still fails:
1. Check the build logs in Vercel dashboard
2. Ensure all paths in `vercel.json` are correct
3. Verify that `karno/frontend/package.json` exists
4. Make sure `karno/frontend/src` contains your React app

### If frontend doesn't connect to backend:
1. Check browser console for CORS errors
2. Verify the API URL in `src/services/api.js`
3. Ensure your Google Cloud backend is running and accessible

## Backend URL
Your Google Cloud backend is running at:
`https://karno-backend-834670291128.europe-west1.run.app`

## Support
If you continue to have issues, check:
- Vercel build logs for specific error messages
- Browser console for frontend errors
- Google Cloud logs for backend issues 